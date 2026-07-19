/* ================================================================== */
/*  POST /api/test-connection                                           */
/*                                                                      */
/*  Verifies a provider API key by making a lightweight request.         */
/*  Body: { providerId, apiKey }                                        */
/*  Returns: { ok: true, model?: string } or { ok: false, error }       */
/* ================================================================== */

export const runtime = "nodejs"

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

const TEST_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku",
  google: "gemini-2.5-flash",
  groq: "llama-4-scout",
  together: "llama-4-scout",
  mistral: "mistral-small",
  deepseek: "deepseek-v3",
  xai: "grok-3-mini",
  cohere: "command-r",
  local: "llama3.1-local",
  openrouter: "openrouter-auto",
}

export async function POST(req: Request) {
  try {
    const { providerId, apiKey } = (await req.json()) as {
      providerId: string
      apiKey: string
    }

    if (!apiKey) {
      return Response.json({ ok: false, error: "No API key provided." }, { status: 400 })
    }

    // ── Local (Ollama) — check if server is reachable ──
    if (providerId === "local") {
      try {
        const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) })
        if (res.ok) return Response.json({ ok: true, model: "Local (Ollama)" })
        return Response.json({ ok: false, error: "Ollama server not responding." })
      } catch {
        return Response.json({ ok: false, error: "Ollama not running. Start it with `ollama serve`." })
      }
    }

    // ── Google: special endpoint ──
    if (providerId === "google") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        return Response.json({
          ok: false,
          error: (err?.error as Record<string, string>)?.message ?? `Google returned ${res.status}`,
        })
      }
      return Response.json({ ok: true, model: (await res.json() as { models?: Array<{ name: string }> })?.models?.[0]?.name ?? "Google" })
    }

    // ── Anthropic: special endpoint ──
    if (providerId === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: TEST_MODELS.anthropic,
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        return Response.json({
          ok: false,
          error: (err?.error as Record<string, string>)?.message ?? `Anthropic returned ${res.status}`,
        })
      }
      return Response.json({ ok: true, model: TEST_MODELS.anthropic })
    }

    // ── OpenAI-compatible: test with a minimal chat completion ──
    const baseUrl = PROVIDER_BASE_URLS[providerId] ?? "https://api.openai.com/v1"
    const testModel = TEST_MODELS[providerId] ?? "gpt-4o-mini"

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>
      const msg =
        res.status === 401
          ? "Invalid API key. Check your key and try again."
          : res.status === 429
            ? "Rate limited. Wait a moment and try again."
            : (err?.error as Record<string, string>)?.message ?? `Provider returned ${res.status}`
      return Response.json({ ok: false, error: msg })
    }

    return Response.json({ ok: true, model: testModel })
  } catch (err) {
    console.error("[api/test-connection]", err)
    return Response.json(
      { ok: false, error: "Connection failed. Check your network and try again." },
      { status: 500 }
    )
  }
}
