import { useState, useEffect, useCallback, useRef } from "react"
import type { NewsArticle } from "./types"
import { newsArticles } from "./data"

/**
 * Simulates real-time news polling.
 * Returns articles + a `hasNew` flag that lights up the "new" indicator.
 *
 * When a real API is connected, replace the mock shuffle with a
 * fetch call inside the interval. The hook signature stays the same.
 */
export function useNewsPolling(intervalMs = 30_000) {
  const [articles, setArticles] = useState<NewsArticle[]>(newsArticles)
  const [hasNew, setHasNew] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Simulate a new article arriving every interval
  useEffect(() => {
    const timer = setInterval(() => {
      // In mock mode: rotate the first article to end, mark as updated
      setArticles((prev) => {
        const [first, ...rest] = prev
        return [...rest, { ...first, timeAgo: "just now", isBreaking: true }]
      })
      setHasNew(true)
      setLastUpdated(new Date())
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])

  const dismissNew = useCallback(() => setHasNew(false), [])

  return { articles, hasNew, dismissNew, lastUpdated }
}

/**
 * Tracks which article IDs have been seen (visited).
 * Persists in sessionStorage so refreshes don't re-highlight.
 */
export function useSeenArticles() {
  const seenRef = useRef<Set<string>>(new Set())

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("news-seen")
      if (stored) {
        seenRef.current = new Set(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const markSeen = useCallback((id: string) => {
    seenRef.current.add(id)
    try {
      sessionStorage.setItem("news-seen", JSON.stringify([...seenRef.current]))
    } catch {
      // ignore
    }
  }, [])

  const isSeen = useCallback((id: string) => seenRef.current.has(id), [])

  return { markSeen, isSeen }
}
