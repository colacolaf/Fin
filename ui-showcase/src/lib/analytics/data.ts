/* ================================================================== */
/*  Mock analytics data — for the Single Flow Story layout             */
/*  In production these come from the synced accounts + memory graph.  */
/* ================================================================== */

export interface TrajectoryPoint {
  date: string
  value: number
}

/* Net worth trajectory — 12 months */
export const netWorthTrajectory: TrajectoryPoint[] = [
  { date: "Jul", value: 253000 },
  { date: "Aug", value: 258400 },
  { date: "Sep", value: 251200 },
  { date: "Oct", value: 265800 },
  { date: "Nov", value: 271300 },
  { date: "Dec", value: 268900 },
  { date: "Jan", value: 274200 },
  { date: "Feb", value: 279100 },
  { date: "Mar", value: 276500 },
  { date: "Apr", value: 281700 },
  { date: "May", value: 283200 },
  { date: "Jun", value: 284500 },
]

export const netWorthCurrent = 284500
export const netWorthYtdPct = 12.4

/* Debt trajectory — 12 months (decreasing) */
export const debtTrajectory: TrajectoryPoint[] = [
  { date: "Jul", value: 49800 },
  { date: "Aug", value: 48200 },
  { date: "Sep", value: 47100 },
  { date: "Oct", value: 46400 },
  { date: "Nov", value: 45800 },
  { date: "Dec", value: 45100 },
  { date: "Jan", value: 44300 },
  { date: "Feb", value: 43900 },
  { date: "Mar", value: 43200 },
  { date: "Apr", value: 42800 },
  { date: "May", value: 42500 },
  { date: "Jun", value: 42300 },
]

export const debtCurrent = 42300
export const debtYtdPct = -15.1
export const debtFreeDate = "Jul 2028"

/* Retirement readiness */
export const retirementFundedPct = 68
export const retirementYtdDelta = 8 // percentage points
export const retirementTargetAge = 65
export const retirementProjectedAnnual = 62000

/* Behavioral patterns */
export interface BehavioralPattern {
  label: string
  value: string
}

export const behavioralPatterns: BehavioralPattern[] = [
  { label: "Change preference", value: "Prefers gradual changes" },
  { label: "Acceptance rate", value: "Accepts 74% of recommendations" },
  { label: "Most active agent", value: "Portfolio Agent · 47 chats" },
  { label: "Typical response time", value: "Within 1 hour" },
]

/* Decision history */
export interface DecisionRecord {
  id: string
  agent: "portfolio" | "debt" | "retirement"
  title: string
  vote: "accepted" | "rejected" | "deferred"
  date: string
}

export const decisionHistory: DecisionRecord[] = [
  {
    id: "d1",
    agent: "portfolio",
    title: "Trim NVDA by 6%, redirect to VOO",
    vote: "accepted",
    date: "Mar 12",
  },
  {
    id: "d2",
    agent: "retirement",
    title: "Increase 401(k) contribution by 4%",
    vote: "accepted",
    date: "Mar 08",
  },
  {
    id: "d3",
    agent: "debt",
    title: "Redirect surplus to Credit Card (19.9% APR)",
    vote: "accepted",
    date: "Mar 01",
  },
  {
    id: "d4",
    agent: "portfolio",
    title: "Review new mortgage opportunity",
    vote: "rejected",
    date: "Feb 28",
  },
  {
    id: "d5",
    agent: "retirement",
    title: "Roth conversion of $15k IRA balance",
    vote: "deferred",
    date: "Feb 20",
  },
]

/* Agent activity */
export interface AgentActivity {
  agent: "portfolio" | "debt" | "retirement"
  chats: number
  color: string
}

export const agentActivity: AgentActivity[] = [
  { agent: "portfolio", chats: 47, color: "#818CF8" },
  { agent: "debt", chats: 23, color: "#FBBF24" },
  { agent: "retirement", chats: 18, color: "#67E8F9" },
]
