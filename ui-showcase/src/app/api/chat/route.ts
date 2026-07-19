/* ================================================================== */
/*  POST /api/chat                                                      */
/*                                                                      */
/*  Server-side proxy for LLM chat completions. Receives the API key    */
/*  from the client (read from localStorage) and forwards to the        */
/*  provider's API. Handles 3 formats:                                  */
/*    - OpenAI-compatible (OpenAI, Groq, Together, Mistral, DeepSeek,   */
/*      xAI, Cohere, OpenRouter, Local/Ollama)                          */
/*    - Anthropic Messages API                                          */
/*    - Google Gemini generateContent API                               */
/* ================================================================== */

export const runtime = "nodejs"

interface ChatRequest {
  model: string
  providerId: string
  messages: { role: "system" | "user" | "assistant"; content: string }[]
  apiKey: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  /** System prompt — sent as top-level system param for Anthropic */
  systemPrompt?: string
}

/* ------------------------------------------------------------------ */
/*  Provider config lookup                                              */
/* ------------------------------------------------------------------ */

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
  mistral: "https://api.mistral.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  xai: "https://api.x.ai/v1",
  cohere: "https://api.cohere.ai/v1",
  local: "http://localhost:11434/v1",
  openrouter: "https://openrouter.ai/api/v1",
}

/* ------------------------------------------------------------------ */
/*  OpenAI-compatible adapter (8 providers)                             */
/* ------------------------------------------------------------------ */

async function openaiCompatible(body: ChatRequest): Promise<Response> {
  const baseUrl = PROVIDER_BASE_URLS[body.providerId] ?? "https://api.openai.com/v1"
  const url = `${baseUrl}/chat/completions`

  const requestBody: Record<string, unknown> = {
    model: body.model,
    messages: body.messages,
  }
  if (body.temperature !== undefined) requestBody.temperature = body.temperature
  if (body.maxTokens) requestBody.max_tokens = body.maxTokens
  if (body.stream) requestBody.stream = true

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${body.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })
}

/* ------------------------------------------------------------------ */
/*  Anthropic adapter                                                   */
/* ------------------------------------------------------------------ */

async function anthropicAdapter(body: ChatRequest): Promise<Response> {
  const url = "https://api.anthropic.com/v1/messages"

  // Anthropic: system prompt goes in top-level system param, not messages
  const nonSystemMsgs = body.messages.filter((m) => m.role !== "system")
  const systemContent = body.systemPrompt ?? body.messages.find((m) => m.role === "system")?.content

  const requestBody: Record<string, unknown> = {
    model: body.model,
    max_tokens: body.maxTokens ?? 4096,
    messages: nonSystemMsgs.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  }
  if (systemContent) requestBody.system = systemContent
  if (body.temperature !== undefined) requestBody.temperature = body.temperature
  if (body.stream) requestBody.stream = true

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": body.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(requestBody),
  })
}

/* ------------------------------------------------------------------ */
/*  Google Gemini adapter                                               */
/* ------------------------------------------------------------------ */

async function googleAdapter(body: ChatRequest): Promise<Response> {
  const method = body.stream ? "streamGenerateContent" : "generateContent"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:${method}?key=${encodeURIComponent(body.apiKey)}`

  // Gemini: messages → contents with parts
  const contents = body.messages.map((m) => {
    let role: string
    if (m.role === "assistant") role = "model"
    else if (m.role === "system") role = "user" // Gemini doesn't have system, prepend to user
    else role = "user"

    return { role, parts: [{ text: m.content }] }
  })

  // If there's a system prompt, prepend it to the first user message
  const systemPrompt = body.systemPrompt ?? body.messages.find((m) => m.role === "system")?.content
  if (systemPrompt && contents.length > 0) {
    const firstUserIdx = contents.findIndex((c) => c.role === "user")
    if (firstUserIdx >= 0) {
      contents[firstUserIdx].parts.unshift({ text: `[System: ${systemPrompt}]\n\n` })
    }
  }

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: body.temperature ?? 0.7,
        maxOutputTokens: body.maxTokens ?? 4096,
      },
    }),
  })
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json()

    if (!body.apiKey) {
      return Response.json(
        { error: "Missing API key. Add it in Settings → AI Models." },
        { status: 401 }
      )
    }

    let response: Response

    switch (body.providerId) {
      case "anthropic":
        response = await anthropicAdapter(body)
        break
      case "google":
        response = await googleAdapter(body)
        break
      default:
        // OpenAI-compatible: openai, groq, together, mistral, deepseek, xai, cohere, local, openrouter
        response = await openaiCompatible(body)
    }

    // Forward the response back — pass through status and body
    if (body.stream) {
      // For streaming, return the raw response so the client can read the SSE stream
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const data = await response.json()

    if (!response.ok) {
      console.error("[api/chat] Provider error:", response.status, JSON.stringify(data).slice(0, 300))
      return Response.json(
        { error: data?.error?.message ?? `Provider returned ${response.status}` },
        { status: response.status }
      )
    }

    return Response.json(data)
  } catch (err) {
    console.error("[api/chat] Unexpected error:", err)
    return Response.json(
      { error: "Internal server error. Check the server logs." },
      { status: 500 }
    )
  }
}
