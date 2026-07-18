import type { AgentId } from "@/lib/agents"

/* ================================================================== */
/*  Per-agent constraints — from each agent's system prompt            */
/* ================================================================== */

export interface AgentConstraint {
  id: string
  text: string
}

export const agentConstraints: Record<AgentId, AgentConstraint[]> = {
  portfolio: [
    { id: "p1", text: "Long-term trades only — no day trading or short-term speculation." },
    { id: "p2", text: "Explain tax and fee implications before any trade execution." },
    { id: "p3", text: "Require proof (documents, cap table) before estimating private holdings." },
    { id: "p4", text: "Reference past decisions when relevant." },
  ],
  debt: [
    { id: "d1", text: "Prioritize high-interest debt first unless the user prefers otherwise." },
    { id: "d2", text: "Show total interest saved and payoff timeline for each strategy." },
    { id: "d3", text: "Never recommend taking on new debt without clear justification." },
    { id: "d4", text: "Celebrate payoff milestones with desktop notifications." },
  ],
  retirement: [
    { id: "r1", text: "Prioritize employer match capture above all else." },
    { id: "r2", text: "Explain tax implications of contributions and conversions." },
    { id: "r3", text: "Use conservative assumptions for all projections." },
    { id: "r4", text: "Coordinate with Portfolio and Debt agents on cash flow." },
  ],
}

/* ================================================================== */
/*  Per-agent learning notes — from the agent_learning schema field    */
/* ================================================================== */

export const agentLearningNotes: Record<AgentId, string[]> = {
  portfolio: [
    "User prefers gradual rebalancing over 2-3 weeks rather than a single trade.",
    "Skips June reviews — quarterly reminders are now set.",
    "Comfortable with 15% drawdown limit; panics beyond that.",
  ],
  debt: [
    "User responded well to the avalanche strategy visualization.",
    "Prefers to redirect freed cash flow rather than spend it.",
  ],
  retirement: [
    "User wants to retire at 65, not 67 — projections adjusted.",
    "Interested in Roth conversions but defers on tax timing.",
  ],
}

/* ================================================================== */
/*  Per-agent connector access                                         */
/* ================================================================== */

export interface AgentConnectorAccess {
  id: string
  label: string
  type: string
  granted: boolean
}

export const agentConnectorAccess: Record<AgentId, AgentConnectorAccess[]> = {
  portfolio: [
    { id: "schwab", label: "Schwab", type: "Brokerage", granted: true },
    { id: "chase", label: "Chase", type: "Bank", granted: true },
    { id: "vanguard", label: "Vanguard", type: "Retirement", granted: false },
    { id: "manual", label: "Manual Assets", type: "Custom", granted: true },
  ],
  debt: [
    { id: "chase", label: "Chase", type: "Bank", granted: true },
    { id: "amex", label: "Amex", type: "Credit Card", granted: true },
    { id: "sofi", label: "SoFi", type: "Student Loan", granted: true },
    { id: "schwab", label: "Schwab", type: "Brokerage", granted: false },
  ],
  retirement: [
    { id: "vanguard", label: "Vanguard", type: "Retirement", granted: true },
    { id: "chase", label: "Chase", type: "Bank", granted: true },
    { id: "schwab", label: "Schwab", type: "Brokerage", granted: false },
    { id: "manual", label: "Manual Assets", type: "Custom", granted: false },
  ],
}

/* ================================================================== */
/*  Default per-agent config state                                     */
/* ================================================================== */

export interface AgentConfigState {
  temperature: number
  streamThinking: boolean
  citations: boolean
  autoExecute: boolean
  voice: boolean
}

export const defaultAgentConfig: Record<AgentId, AgentConfigState> = {
  portfolio: {
    temperature: 0.4,
    streamThinking: true,
    citations: true,
    autoExecute: false,
    voice: false,
  },
  debt: {
    temperature: 0.3,
    streamThinking: true,
    citations: true,
    autoExecute: false,
    voice: false,
  },
  retirement: {
    temperature: 0.3,
    streamThinking: true,
    citations: true,
    autoExecute: false,
    voice: false,
  },
}
