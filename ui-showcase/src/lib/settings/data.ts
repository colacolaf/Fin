/* ================================================================== */
/*  Mock settings data — grounded in the User Context Schema           */
/*  In production these come from the local encrypted store.           */
/* ================================================================== */

export interface SecurityState {
  authKeyMasked: string
  encryptionKeyMasked: string
  keyStorageHint: string
  authKeySet: boolean
  encryptionKeySet: boolean
}

export const securityState: SecurityState = {
  authKeyMasked: "••••••••••••",
  encryptionKeyMasked: "••••••••••••",
  keyStorageHint: "In 1Password vault — Finance OS folder",
  authKeySet: true,
  encryptionKeySet: true,
}

export interface SetupChecklistItem {
  id: string
  label: string
  done: boolean
}

export const setupChecklist: SetupChecklistItem[] = [
  { id: "auth_key", label: "Authorization key set", done: true },
  { id: "encryption_key", label: "Encryption key set", done: true },
  { id: "portfolio", label: "Portfolio connected", done: true },
  { id: "bank", label: "Bank connected", done: true },
  { id: "debt", label: "Debt connected", done: true },
  { id: "llm_model", label: "LLM model selected", done: true },
]

export const setupComplete = setupChecklist.every((item) => item.done)

export interface SettingsConnector {
  id: string
  label: string
  type: string
  status: "connected" | "disconnected" | "syncing"
  lastSync: string
}

export const settingsConnectors: SettingsConnector[] = [
  { id: "schwab", label: "Schwab", type: "Brokerage", status: "connected", lastSync: "2m ago" },
  { id: "chase", label: "Chase", type: "Bank", status: "connected", lastSync: "5m ago" },
  { id: "vanguard", label: "Vanguard", type: "Retirement", status: "syncing", lastSync: "syncing now" },
  { id: "amex", label: "Amex", type: "Credit Card", status: "connected", lastSync: "1m ago" },
  { id: "sofi", label: "SoFi", type: "Student Loan", status: "disconnected", lastSync: "never" },
]

export interface NotificationEvent {
  id: string
  label: string
  description: string
  enabled: boolean
}

export const notificationEvents: NotificationEvent[] = [
  {
    id: "agent_task_complete",
    label: "Agent task complete",
    description: "Notify when any agent finishes a task.",
    enabled: true,
  },
  {
    id: "debt_paid_off",
    label: "Debt paid off",
    description: "Celebrate when a debt is fully paid.",
    enabled: true,
  },
  {
    id: "debt_milestone",
    label: "Debt milestone",
    description: "Alert at 25%, 50%, 75% payoff milestones.",
    enabled: false,
  },
]

export const notificationsMasterEnabled = true

/* ------------------------------------------------------------------ */
/*  Settings tabs                                                      */
/* ------------------------------------------------------------------ */

export interface SettingsTab {
  id: string
  label: string
}

export const settingsTabs: SettingsTab[] = [
  { id: "security", label: "Security" },
  { id: "connections", label: "Connections" },
  { id: "notifications", label: "Notifications" },
  { id: "model", label: "AI Model" },
]
