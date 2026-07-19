"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import { useConnectors, type RuntimeConnector } from "@/lib/settings/use-connectors"
import type { AgentId } from "@/lib/agents"

/* ================================================================== */
/*  Strategy constants — from agent system prompts                      */
/* ================================================================== */

export const AGENT_STRATEGIES: Record<AgentId, string> = {
  portfolio:
    "Long-term allocation and rebalancing. Prioritizes diversification and concentration risk management. No short-term or speculative trades. Explains tax and fee implications before any trade execution.",
  debt:
    "Avalanche payoff targeting highest-APR debt first. Tracks milestones and freed cash flow. Coordinates with Portfolio Agent on debt vs. invest trade-offs. Celebrates payoff milestones with desktop notifications.",
  retirement:
    "Employer match capture above all else. Conservative projections for retirement readiness. Coordinates with Portfolio and Debt agents on cash flow and allocation. Explains tax implications of contributions and conversions.",
}

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

export interface AgentAnalytics {
  id: AgentId
  label: string
  color: string
  /** Derived from connector health */
  status: "connected" | "syncing" | "error" | "idle"
  /** Human-readable last-used timestamp */
  lastUsed: string
  /** Last session category */
  lastSessionCategory: string
  /** Total chat sessions */
  sessions: number
  /** Percentage of recommendations accepted */
  acceptanceRate: number
  /** Strategy from system prompts */
  strategy: string
  /** Active error messages from connectors */
  errors: string[]
}

export interface ConnectorAnalytics {
  id: string
  name: string
  abbreviation: string
  accentColor: string
  status: "connected" | "syncing" | "error" | "disconnected"
  lastSync: string
  accountCount: number
  errorMessage?: string
  hasApiKey: boolean
}

export interface AnalyticsState {
  agents: AgentAnalytics[]
  connectors: ConnectorAnalytics[]
  totalSessions: number
}

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

/** Map an agent to its required connector categories */
function getAgentConnectorCategories(agentId: AgentId): string[] {
  switch (agentId) {
    case "portfolio":
      return ["brokerage"] // Portfolio needs brokerage
    case "debt":
      return ["credit", "loans"] // Debt needs credit/loan accounts
    case "retirement":
      return ["retirement"] // Retirement needs retirement accounts
  }
}

/** Derive agent status from its connectors. Only counts a connector as
 *  truly connected if it has an API key or an active provider mapping. */
function deriveAgentStatus(
  connectors: RuntimeConnector[],
  agentId: AgentId,
  providers: Record<string, string>
): { status: AgentAnalytics["status"]; errors: string[] } {
  const categories = getAgentConnectorCategories(agentId)
  const relevant = connectors.filter((c) => categories.includes(c.category))

  // If no connectors of this category exist at all — idle
  if (relevant.length === 0) {
    return { status: "idle", errors: [] }
  }

  const errors: string[] = []
  let hasSyncing = false
  let hasConnected = false

  for (const c of relevant) {
    // A connector is only truly connected if it has an API key or an active provider mapping
    const isProviderMapped = Object.values(providers).includes(c.id)
    const isReallyConnected = c.status === "connected" && (c.hasApiKey || isProviderMapped)

    if (c.status === "error") {
      errors.push(`${c.name}: Authentication expired`)
    } else if (c.status === "syncing") {
      hasSyncing = true
    } else if (isReallyConnected) {
      hasConnected = true
    }
  }

  if (errors.length > 0) return { status: "error", errors }
  if (hasSyncing) return { status: "syncing", errors: [] }
  if (hasConnected) return { status: "connected", errors: [] }
  return { status: "idle", errors: [] }
}

/** Format a timestamp as a human-readable relative time */
function formatLastUsed(ts: number | null): string {
  if (!ts) return "Never"
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Just now"
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

/** Default last-session categories */
function getDefaultCategory(agentId: AgentId): string {
  switch (agentId) {
    case "portfolio":
      return "Rebalancing"
    case "debt":
      return "Payoff Strategy"
    case "retirement":
      return "Contribution Strategy"
  }
}

/* ================================================================== */
/*  useAnalytics — derives all analytics from real localStorage state   */
/* ================================================================== */

export function useAnalytics(): AnalyticsState {
  const { connectors: runtimeConnectors } = useConnectors()

  // Read provider mappings to determine truly-connected connectors
  const [providers] = useLocalStorage<Record<string, string>>("fo-connected-providers", {})

  // Per-agent session counters
  const [sessions] = useLocalStorage<Record<AgentId, number>>("fo-agent-sessions", {
    portfolio: 0,
    debt: 0,
    retirement: 0,
  })

  // Per-agent last-used timestamps
  const [lastUsedMap] = useLocalStorage<Record<AgentId, number | null>>(
    "fo-agent-last-used",
    {
      portfolio: null,
      debt: null,
      retirement: null,
    }
  )

  // Per-agent decision tracking (accepted vs total)
  const [decisions] = useLocalStorage<Record<AgentId, { accepted: number; total: number }>>(
    "fo-agent-decisions",
    {
      portfolio: { accepted: 0, total: 0 },
      debt: { accepted: 0, total: 0 },
      retirement: { accepted: 0, total: 0 },
    }
  )

  // Last session categories
  const [lastCategories] = useLocalStorage<Record<AgentId, string>>(
    "fo-agent-last-category",
    {
      portfolio: "Rebalancing",
      debt: "Payoff Strategy",
      retirement: "Contribution Strategy",
    }
  )

  /* ---- Agent config (colors, labels) ---- */
  const agentDefs: { id: AgentId; label: string; color: string }[] = [
    { id: "portfolio", label: "Portfolio", color: "#818CF8" },
    { id: "debt", label: "Debt", color: "#FBBF24" },
    { id: "retirement", label: "Retirement", color: "#34D399" },
  ]

  /* ---- Derive agent analytics ---- */
  const agents: AgentAnalytics[] = React.useMemo(
    () =>
      agentDefs.map((def) => {
        const { status, errors } = deriveAgentStatus(runtimeConnectors, def.id, providers)
        const accRate =
          decisions[def.id].total > 0
            ? Math.round((decisions[def.id].accepted / decisions[def.id].total) * 100)
            : 0

        return {
          id: def.id,
          label: def.label,
          color: def.color,
          status,
          lastUsed: formatLastUsed(lastUsedMap[def.id]),
          lastSessionCategory: lastCategories[def.id] ?? getDefaultCategory(def.id),
          sessions: sessions[def.id] ?? 0,
          acceptanceRate: accRate,
          strategy: AGENT_STRATEGIES[def.id],
          errors,
        }
      }),
    [runtimeConnectors, sessions, lastUsedMap, decisions, lastCategories, providers]
  )

  /* ---- Derive connector analytics — only show truly connected ones ---- */
  const connectors: ConnectorAnalytics[] = React.useMemo(
    () =>
      runtimeConnectors
        .filter((c) => {
          // Only show connectors with real data, not catalog defaults
          const isProviderMapped = Object.values(providers).includes(c.id)
          const isTrulyConnected = c.hasApiKey || isProviderMapped
          if (c.status === "disconnected") return false
          // Show if syncing, in error, or genuinely connected with credentials
          return c.status === "syncing" || c.status === "error" || isTrulyConnected
        })
        .map((c) => ({
          id: c.id,
          name: c.name,
          abbreviation: c.abbreviation,
          accentColor: c.accentColor,
          status: c.status as ConnectorAnalytics["status"],
          lastSync: c.lastSync ?? "Unknown",
          accountCount: c.accountCount ?? 1,
          hasApiKey: c.hasApiKey ?? false,
          errorMessage:
            c.status === "error" ? "Authentication expired. Reconnect to resume syncing." : undefined,
        })),
    [runtimeConnectors, providers]
  )

  /* ---- Total sessions ---- */
  const totalSessions = React.useMemo(
    () => Object.values(sessions).reduce((sum, n) => sum + (n ?? 0), 0),
    [sessions]
  )

  return { agents, connectors, totalSessions }
}
