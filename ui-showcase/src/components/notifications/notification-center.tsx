"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, BellOff, CheckCheck, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useDesktopNotifications,
  eventLabel,
} from "@/lib/notifications/use-desktop-notifications"
import type { NotificationItem } from "@/lib/notifications/types"

/* ================================================================== */
/*  NotificationCenter                                                  */
/* ================================================================== */

export function NotificationCenter() {
  const {
    history,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    permissionGranted,
    requestPermission,
  } = useDesktopNotifications()

  const [open, setOpen] = React.useState(false)

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95",
          open
            ? "border-white/[0.14] bg-white/[0.08] text-white"
            : "border-white/[0.08] bg-white/[0.03] text-white/[0.55] hover:bg-white/[0.06] hover:text-white"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#818CF8] px-1 text-[10px] font-bold tabular-nums text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Scrim */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-90 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-drawer"
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className={cn(
              "fixed right-0 top-0 z-100 flex h-full w-[360px] flex-col",
              "border-l border-white/[0.08] bg-[#0A0A0B]/95 backdrop-blur-2xl",
              "shadow-2xl shadow-black/50"
            )}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[15px] font-semibold text-white">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#818CF8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#818CF8]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Request permission button */}
                {!permissionGranted && (
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="flex h-7 items-center gap-1 rounded-md border border-[#818CF8]/25 bg-[#818CF8]/10 px-2.5 text-[11px] font-medium text-[#818CF8] transition-colors hover:bg-[#818CF8]/15"
                  >
                    <Bell className="h-3 w-3" />
                    Enable
                  </button>
                )}
                {/* Mark all read */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/[0.45] transition-all hover:bg-white/[0.06] hover:text-white"
                    aria-label="Mark all read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Clear all */}
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/[0.45] transition-all hover:bg-white/[0.06] hover:text-white"
                    aria-label="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Close */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/[0.45] transition-all hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <BellOff className="h-5 w-5 text-white/[0.25]" />
                  </div>
                  <p className="text-[13px] font-medium text-white/[0.35]">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-[11px] text-white/[0.20]">
                    Agent updates and milestones appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {history.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onMarkRead={markRead}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ================================================================== */
/*  NotificationRow                                                     */
/* ================================================================== */

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const timeStr = React.useMemo(() => formatTime(item.timestamp), [item.timestamp])

  return (
    <button
      type="button"
      onClick={() => onMarkRead(item.id)}
      className={cn(
        "flex w-full gap-3 px-5 py-3.5 text-left transition-colors",
        item.read
          ? "hover:bg-white/[0.02]"
          : "bg-[#818CF8]/[0.03] hover:bg-[#818CF8]/[0.06]"
      )}
    >
      {/* Unread dot */}
      <div className="mt-1 shrink-0">
        {!item.read && (
          <span className="block h-2 w-2 rounded-full bg-[#818CF8]" />
        )}
        {item.read && <span className="block h-2 w-2" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[13px] font-medium",
              item.read ? "text-white/[0.55]" : "text-white"
            )}
          >
            {item.title}
          </span>
          <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/[0.30]">
            {eventLabel(item.eventType)}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 text-[11px] leading-relaxed",
            item.read ? "text-white/[0.30]" : "text-white/[0.50]"
          )}
        >
          {item.body}
        </p>
        <span className="mt-1.5 block text-[9px] text-white/[0.20]">
          {timeStr}
        </span>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Time formatting helper                                             */
/* ------------------------------------------------------------------ */

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "Just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
