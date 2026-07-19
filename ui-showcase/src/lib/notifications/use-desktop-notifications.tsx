"use client"

import * as React from "react"
import { toast } from "sonner"
import { useLocalStorage } from "@/lib/use-local-storage"
import type {
  NotificationContextValue,
  NotificationEventType,
  NotificationItem,
} from "./types"

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

const NotificationCtx = React.createContext<NotificationContextValue | null>(null)

export function useDesktopNotifications(): NotificationContextValue {
  const ctx = React.useContext(NotificationCtx)
  if (!ctx) throw new Error("useDesktopNotifications must be used within <NotificationProvider>")
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const SETTINGS_KEY_EVENTS = "fo-notif-events"
const SETTINGS_KEY_MASTER = "fo-notif-master"
const HISTORY_KEY = "fo-notif-history"
const MAX_HISTORY = 50

let _idCounter = Date.now()
function uid(): string {
  return `notif-${(_idCounter++).toString(36)}`
}

function supportsBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

function eventLabel(eventType: NotificationEventType): string {
  switch (eventType) {
    case "agent_task_complete":
      return "Agent task complete"
    case "debt_paid_off":
      return "Debt paid off"
    case "debt_milestone":
      return "Debt milestone"
  }
}

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionGranted, setPermissionGranted] = React.useState(
    supportsBrowserNotifications() ? Notification.permission === "granted" : false
  )

  // Read the settings the user configured in the Settings page
  const [master] = useLocalStorage(SETTINGS_KEY_MASTER, true)
  const [events] = useLocalStorage<{ id: string; enabled: boolean }[]>(
    SETTINGS_KEY_EVENTS,
    [
      { id: "agent_task_complete", enabled: true },
      { id: "debt_paid_off", enabled: true },
      { id: "debt_milestone", enabled: false },
    ]
  )

  // Read history from localStorage
  const [history, setHistory] = useLocalStorage<NotificationItem[]>(HISTORY_KEY, [])

  const unreadCount = React.useMemo(
    () => history.filter((n) => !n.read).length,
    [history]
  )

  /* ---- Check permission status on mount ---- */
  React.useEffect(() => {
    if (supportsBrowserNotifications()) {
      setPermissionGranted(Notification.permission === "granted")
    }
  }, [])

  /* ---- Request permission ---- */
  const requestPermission = React.useCallback(async (): Promise<boolean> => {
    if (!supportsBrowserNotifications()) return false
    try {
      const result = await Notification.requestPermission()
      const granted = result === "granted"
      setPermissionGranted(granted)
      return granted
    } catch {
      return false
    }
  }, [])

  /* ---- Core notify function ---- */
  const notify = React.useCallback(
    (title: string, body: string, eventType: NotificationEventType) => {
      // 1. Master switch
      if (!master) return

      // 2. Per-event toggle
      const eventCfg = events.find((e) => e.id === eventType)
      if (eventCfg && !eventCfg.enabled) return

      // 3. Append to history
      const item: NotificationItem = {
        id: uid(),
        title,
        body,
        eventType,
        timestamp: Date.now(),
        read: false,
      }
      setHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY))

      // 4. Try native desktop notification
      if (permissionGranted && supportsBrowserNotifications()) {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: eventType,
          })
          return // success — don't fall back to toast
        } catch {
          // permission was revoked or API failed, fall through to sonner
        }
      }

      // 5. Fallback: sonner toast
      toast(title, {
        description: body,
        duration: 5000,
      })
    },
    [master, events, permissionGranted, setHistory]
  )

  /* ---- History management ---- */
  const markRead = React.useCallback(
    (id: string) => {
      setHistory((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    },
    [setHistory]
  )

  const markAllRead = React.useCallback(() => {
    setHistory((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [setHistory])

  const clearAll = React.useCallback(() => {
    setHistory([])
  }, [setHistory])

  /* ---- Context value ---- */
  const value = React.useMemo<NotificationContextValue>(
    () => ({
      notify,
      history,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
      permissionGranted,
      requestPermission,
    }),
    [
      notify,
      history,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
      permissionGranted,
      requestPermission,
    ]
  )

  return (
    <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>
  )
}

/* re-export for convenience */
export { eventLabel }
