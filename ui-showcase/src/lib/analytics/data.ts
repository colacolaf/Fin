/* ================================================================== */
/*  Analytics data — types only (no hardcoded state)                    */
/*  All live data comes from useAnalytics() hook.                      */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Agent Analytics type — used by consumers that need the shape        */
/* ------------------------------------------------------------------ */

export interface AgentStatus {
  id: "portfolio" | "debt" | "retirement"
  label: string
  color: string
  status: "connected" | "syncing" | "error" | "idle"
  lastUsed: string
  lastSessionCategory: string
  sessions: number
  acceptanceRate: number
  strategy: string
  errors: string[]
}
