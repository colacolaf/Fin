import * as React from "react"

/**
 * useState that persists to localStorage.
 * SSR-safe: returns defaultValue on server, reads from localStorage on client.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      // corrupted storage, fall back to default
    }
    return defaultValue
  })

  // Write to localStorage whenever value changes
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked
    }
  }, [key, value])

  return [value, setValue]
}
