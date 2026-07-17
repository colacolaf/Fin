import { useState, useEffect } from "react"

/**
 * Animates a number from 0 to `end` on mount using easeOutExpo.
 * ponytail: single RAF loop, no dependency needed.
 */
export function useCountUp(end: number, durationMs = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start: number
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / durationMs, 1)
      const eased = 1 - Math.pow(2, -10 * p)
      setCount(end * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, durationMs])
  return count
}
