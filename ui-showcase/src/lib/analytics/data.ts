/* ================================================================== */
/*  Analytics data — agent status, connector health, usage stats        */
/*  For the Compact Table (Template C) layout.                         */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Agent Status                                                        */
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

export const agentStatuses: AgentStatus[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    color: "#818CF8",
    status: "connected",
    lastUsed: "5m ago",
    lastSessionCategory: "Rebalancing",
    sessions: 12,
    acceptanceRate: 92,
    strategy:
      "Long-term allocation and rebalancing. Prioritizes diversification and concentration risk management. No short-term or speculative trades.",
    errors: [],
  },
  {
    id: "debt",
    label: "Debt",
    color: "#FBBF24",
    status: "connected",
    lastUsed: "2h ago",
    lastSessionCategory: "Payoff Strategy",
    sessions: 8,
    acceptanceRate: 75,
    strategy:
      "Avalanche payoff targeting highest-APR debt first. Tracks milestones and freed cash flow. Celebrates debt payoff milestones with desktop notifications.",
    errors: [],
  },
  {
    id: "retirement",
    label: "Retirement",
    color: "#34D399",
    status: "syncing",
    lastUsed: "3d ago",
    lastSessionCategory: "Contribution Strategy",
    sessions: 4,
    acceptanceRate: 100,
    strategy:
      "Employer match capture above all else. Targets 10% contribution rate. Conservative projections for retirement readiness score.",
    errors: [],
  },
]

/* ------------------------------------------------------------------ */
/*  Connector Health                                                    */
/* ------------------------------------------------------------------ */

export interface ConnectorHealth {
  id: string
  name: string
  abbreviation: string
  accentColor: string
  status: "connected" | "syncing" | "error" | "disconnected"
  lastSync: string
  accountCount: number
  errorMessage?: string
}

export const connectorHealth: ConnectorHealth[] = [
  {
    id: "schwab",
    name: "Schwab",
    abbreviation: "SC",
    accentColor: "#00A0DC",
    status: "connected",
    lastSync: "2m ago",
    accountCount: 3,
  },
  {
    id: "chase",
    name: "Chase",
    abbreviation: "CH",
    accentColor: "#1A73E8",
    status: "connected",
    lastSync: "5m ago",
    accountCount: 2,
  },
  {
    id: "amex",
    name: "Amex",
    abbreviation: "AE",
    accentColor: "#006FCF",
    status: "connected",
    lastSync: "1m ago",
    accountCount: 2,
  },
  {
    id: "vanguard",
    name: "Vanguard",
    abbreviation: "VG",
    accentColor: "#96232D",
    status: "syncing",
    lastSync: "syncing now",
    accountCount: 1,
  },
  {
    id: "coinbase",
    name: "Coinbase",
    abbreviation: "CB",
    accentColor: "#0052FF",
    status: "error",
    lastSync: "3d ago",
    accountCount: 0,
    errorMessage: "Authentication expired. Reconnect to resume syncing.",
  },
]

/* ------------------------------------------------------------------ */
/*  Usage Stats                                                         */
/* ------------------------------------------------------------------ */

export const totalSessions = 24
