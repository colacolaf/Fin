import * as React from "react"

/**
 * useState that persists to localStorage.
 *
 * SSR-safe: always renders defaultValue on both server and client during
 * initial render (avoids hydration mismatch). After mount, reads the actual
 * value from localStorage and re-renders. Writes are never dropped — the
 * setter uses a ref for the ready flag so it can write even before the
 * initial sync completes.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Always start with defaultValue — server and client agree
  const [value, setValue] = React.useState<T>(defaultValue)

  // Use ref so the setter always sees current ready state
  // (avoids dropped writes during the hydration gap)
  const readyRef = React.useRef(false)

  // After mount, sync the real value from localStorage (client only)
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        setValue(JSON.parse(stored) as T)
      }
    } catch {
      // corrupted storage, stick with default
    }
    readyRef.current = true
  }, [key])

  // Persist changes to localStorage. Uses ref for ready so writes
  // are never silently dropped regardless of render timing.
  const setAndPersist = React.useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue
        if (readyRef.current) {
          try {
            localStorage.setItem(key, JSON.stringify(resolved))
          } catch {
            // storage full or blocked
          }
        }
        return resolved
      })
    },
    [key],
  )

  return [value, setAndPersist]
}
