/* ================================================================== */
/*  Notification types — grounded in Skills Registry + Design Docs     */
/* ================================================================== */

export type NotificationEventType =
  | "agent_task_complete"
  | "debt_paid_off"
  | "debt_milestone"

export interface NotificationItem {
  id: string
  title: string
  body: string
  eventType: NotificationEventType
  timestamp: number
  read: boolean
}

export interface NotificationContextValue {
  /** Send a desktop notification (falls back to sonner toast if permission denied). */
  notify: (title: string, body: string, eventType: NotificationEventType) => void
  /** Full notification history, newest first. */
  history: NotificationItem[]
  /** Unread count for the bell badge. */
  unreadCount: number
  /** Mark a single notification as read. */
  markRead: (id: string) => void
  /** Mark all notifications as read. */
  markAllRead: () => void
  /** Clear all notification history. */
  clearAll: () => void
  /** Whether the user has granted browser notification permission. */
  permissionGranted: boolean
  /** Request browser notification permission. */
  requestPermission: () => Promise<boolean>
}
