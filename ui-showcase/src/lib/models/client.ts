/* ================================================================== */
/*  lib/models/client.ts                                               */
/*                                                                      */
/*  Client-side helper that calls the server-side chat proxy.           */
/*  Reads API key from localStorage, resolves provider & model,         */
/*  and handles streaming + error states.                               */
/* ================================================================== */

import { availableModels, availableProviders, type ModelOption } from "@/lib/agents"
import { getAllProviderKeys } from "@/lib/settings/provider-keys"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CallModelOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
  systemPrompt?: string
  signal?: AbortSignal
}

export interface CallModelResult {
  text: string
  usage?: { inputTokens: number; outputTokens: number }
  model: string
  providerId: string
}

/* ------------------------------------------------------------------ */
/*  Resolve model + provider from localStorage                         */
/* ------------------------------------------------------------------ */

function resolveModel(modelId: string | null): {
  model: ModelOption
  apiKey: string
  providerId: string
  baseUrl: string
} | null {
  const providerKeys = getAllProviderKeys()

  // Find the model in the registry
  const model = modelId
    ? availableModels.find((m) => m.id === modelId)
    : null

  if (!model) {
    // Fall back to first configured model
    for (const m of availableModels) {
      if (providerKeys[m.providerId] || m.providerId === "local") {
        const provider = availableProviders.find((p) => p.id === m.providerId)
        return {
          model: m,
          apiKey: providerKeys[m.providerId] ?? "",
          providerId: m.providerId,
          baseUrl: provider?.baseUrl ?? "",
        }
      }
    }
    return null
  }

  const apiKey = model.providerId === "local" ? "" : (providerKeys[model.providerId] ?? "")
  const provider = availableProviders.find((p) => p.id === model.providerId)

  if (!apiKey && model.providerId !== "local") return null

  return {
    model,
    apiKey,
    providerId: model.providerId,
    baseUrl: provider?.baseUrl ?? "",
  }
}

/* ------------------------------------------------------------------ */
/*  callModel — non-streaming                                          */
/* ------------------------------------------------------------------ */

export async function callModel(
  modelId: string | null,
  messages: ChatMessage[],
  options: CallModelOptions = {},
): Promise<CallModelResult | { error: string }> {
  const resolved = resolveModel(modelId)
  if (!resolved) {
    return { error: "No model configured. Add an API key in Settings → AI Models." }
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: resolved.model.apiModelName ?? resolved.model.id,
        providerId: resolved.providerId,
        messages,
        apiKey: resolved.apiKey,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        stream: false,
      }),
      signal: options.signal,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server returned ${res.status}` })) as { error?: string }
      return { error: err.error ?? `Request failed (${res.status})` }
    }

    const data = await res.json() as Record<string, unknown>

    // Parse response based on provider format
    let text = ""
    let usage: { inputTokens: number; outputTokens: number } | undefined

    if (resolved.providerId === "anthropic") {
      const content = data.content as Array<{ type: string; text: string }> | undefined
      text = content?.find((c) => c.type === "text")?.text ?? ""
      const u = data.usage as { input_tokens: number; output_tokens: number } | undefined
      if (u) usage = { inputTokens: u.input_tokens, outputTokens: u.output_tokens }
    } else if (resolved.providerId === "google") {
      const candidates = data.candidates as Array<{ content: { parts: Array<{ text: string }> } }> | undefined
      text = candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    } else {
      // OpenAI-compatible
      const choices = data.choices as Array<{ message: { content: string } }> | undefined
      text = choices?.[0]?.message?.content ?? ""
      const u = data.usage as { prompt_tokens: number; completion_tokens: number } | undefined
      if (u) usage = { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens }
    }

    return { text, usage, model: resolved.model.id, providerId: resolved.providerId }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { error: "Request cancelled." }
    }
    return { error: "Network error. Check your connection and try again." }
  }
}

/* ------------------------------------------------------------------ */
/*  streamModel — streaming with onToken callback                      */
/* ------------------------------------------------------------------ */

export async function* streamModel(
  modelId: string | null,
  messages: ChatMessage[],
  options: CallModelOptions = {},
): AsyncGenerator<string, void, unknown> {
  const resolved = resolveModel(modelId)
  if (!resolved) {
    yield "[Error: No model configured. Add an API key in Settings → AI Models.]"
    return
  }

  let res: Response
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: resolved.model.id,
        providerId: resolved.providerId,
        messages,
        apiKey: resolved.apiKey,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        stream: true,
      }),
      signal: options.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      yield "[Request cancelled.]"
    } else {
      yield "[Error: Network error. Check your connection and try again.]"
    }
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    yield `[Error: ${err.error ?? `Server returned ${res.status}`}]`
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    yield "[Error: No response body.]"
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data:")) continue

        const data = trimmed.slice(5).trim()
        if (data === "[DONE]") return

        try {
          const chunk = JSON.parse(data)
          let token = ""

          if (resolved.providerId === "anthropic") {
            // Anthropic SSE: { type: "content_block_delta", delta: { type: "text_delta", text: "..." } }
            if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
              token = chunk.delta.text
            }
          } else if (resolved.providerId === "google") {
            // Gemini SSE: each chunk contains cumulative text-so-far.
            // Only yield the new portion to avoid duplication.
            const candidates = chunk.candidates as Array<{ content: { parts: Array<{ text: string }> } }> | undefined
            const fullText = candidates?.[0]?.content?.parts?.[0]?.text ?? ""
            const prevLen = (chunk as { _prevLen?: number })._prevLen ?? 0
            token = fullText.slice(prevLen)
            ;(chunk as { _prevLen: number })._prevLen = fullText.length
          } else {
            // OpenAI-compatible SSE: { choices: [{ delta: { content: "..." } }] }
            const choices = chunk.choices as Array<{ delta: { content?: string } }> | undefined
            token = choices?.[0]?.delta?.content ?? ""
          }

          if (token) yield token
        } catch {
          // Skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/* ------------------------------------------------------------------ */
/*  testConnection — calls the test-connection endpoint                 */
/* ------------------------------------------------------------------ */

export async function testProviderConnection(
  providerId: string,
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, apiKey }),
      signal: AbortSignal.timeout(12000),
    })

    const data = await res.json() as { ok: boolean; error?: string }
    return data
  } catch {
    return { ok: false, error: "Connection timed out. Check your network." }
  }
}
