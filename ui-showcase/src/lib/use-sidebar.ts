"use client"

import * as React from "react"

/* ================================================================== */
/*  useSidebar — open/close state + keyboard + scroll lock              */
/* ================================================================== */

interface UseSidebarOptions {
  /** Initial open state (default false — sidebar hidden until triggered) */
  defaultOpen?: boolean
  /** Keyboard shortcut to toggle (default: Cmd/Ctrl+B). Set to null to disable. */
  shortcut?: string | null
}

interface UseSidebarReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Manages a slide-over sidebar: hidden by default, toggled via a button
 * or Cmd/Ctrl+B, closed with Escape. Locks body scroll while open.
 */
export function useSidebar({
  defaultOpen = false,
  shortcut = "mod+b",
}: UseSidebarOptions = {}): UseSidebarReturn {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const isOpenRef = React.useRef(isOpen)

  React.useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen((v) => !v), [])

  // Keyboard shortcut + Escape to close
  React.useEffect(() => {
    if (!shortcut) return

    const handler = (e: KeyboardEvent) => {
      // Toggle shortcut: mod+b (Cmd on mac, Ctrl elsewhere)
      if (shortcut === "mod+b") {
        const mod = e.metaKey || e.ctrlKey
        if (mod && e.key.toLowerCase() === "b") {
          e.preventDefault()
          setIsOpen((v) => !v)
          return
        }
      }
      // Escape closes (only when open)
      if (e.key === "Escape" && isOpenRef.current) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcut])

  // Body scroll lock while open
  React.useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  return { isOpen, open, close, toggle }
}
