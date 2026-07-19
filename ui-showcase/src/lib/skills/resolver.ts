/**
 * Client-side skill content resolver.
 *
 * Fetches rich skill documents from the API route and caches them in memory.
 * When the agent needs to read a skill (because the user toggled it or invoked
 * it via /skill_name), this resolver provides the full institutional knowledge.
 */

export interface SkillContent {
  skillId: string
  content: string
  /** Approximate token count */
  tokenEstimate: number
  loadedAt: number
}

// In-memory cache — survives within a session but resets on page reload
const cache = new Map<string, SkillContent>()

/**
 * Fetch a single skill's rich document content.
 * Cached in memory after first fetch.
 */
export async function fetchSkillContent(skillId: string): Promise<SkillContent | null> {
  // Check cache first
  const cached = cache.get(skillId)
  if (cached) return cached

  try {
    const res = await fetch(`/api/skills/${skillId}`)
    if (!res.ok) {
      console.warn(`[skills] Failed to fetch "${skillId}": ${res.status}`)
      return null
    }

    const content = await res.text()
    const tokenEstimate = estimateTokens(content)

    const result: SkillContent = {
      skillId,
      content,
      tokenEstimate,
      loadedAt: Date.now(),
    }

    cache.set(skillId, result)
    return result
  } catch (err) {
    console.warn(`[skills] Error fetching "${skillId}":`, err)
    return null
  }
}

/**
 * Fetch multiple skill docs in parallel.
 */
export async function fetchSkillContents(
  skillIds: string[]
): Promise<Map<string, SkillContent>> {
  const results = new Map<string, SkillContent>()

  const fetched = await Promise.all(
    skillIds.map((id) => fetchSkillContent(id))
  )

  for (let i = 0; i < skillIds.length; i++) {
    const content = fetched[i]
    if (content) results.set(skillIds[i], content)
  }

  return results
}

/**
 * Get skill content only if already cached (no fetch).
 * Use this for synchronous access during rendering.
 */
export function getCachedSkillContent(skillId: string): SkillContent | null {
  return cache.get(skillId) ?? null
}

/**
 * Check which skills have cached content ready.
 */
export function getCachedSkillIds(): string[] {
  return Array.from(cache.keys())
}

/**
 * Clear the skill content cache.
 */
export function clearSkillCache(): void {
  cache.clear()
}

/**
 * Get the total token budget of all currently cached skills.
 */
export function getCachedTokenBudget(): number {
  let total = 0
  cache.forEach((c) => { total += c.tokenEstimate })
  return total
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Rough token estimation: ~4 characters per token for English text.
 * This is a quick heuristic, not a tokenizer.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
