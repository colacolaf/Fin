"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Activity,
  Lightbulb,
  Plug,
  BarChart3,
  Key,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import { useAnalytics, type AgentAnalytics, type ConnectorAnalytics } from "@/lib/analytics/use-analytics"

/* ================================================================== */
/*  SectionHeader — labeled section with icon                           */
/* ================================================================== */

function SectionHeader({
  icon: Icon,
  label,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-white/[0.35]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.45]">
          {label}
        </span>
      </div>
      {right}
    </div>
  )
}

/* ================================================================== */
/*  StatusDot — colored dot for agent/connector status                  */
/* ================================================================== */

function StatusDot({
  status,
  color,
}: {
  status: "connected" | "syncing" | "error" | "idle" | "disconnected"
  color?: string
}) {
  if (status === "syncing") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FBBF24] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FBBF24]" />
      </span>
    )
  }
  if (status === "error") {
    return <span className="h-2 w-2 shrink-0 rounded-full bg-[#F87171]" />
  }
  if (status === "disconnected" || status === "idle") {
    return <span className="h-2 w-2 shrink-0 rounded-full bg-white/[0.20]" />
  }
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color || "#34D399" }}
    />
  )
}

/* ================================================================== */
/*  AgentsTable                                                         */
/* ================================================================== */

function AgentsTable({ agents }: { agents: AgentAnalytics[] }) {
  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 text-center">
        <p className="text-[11px] text-white/[0.30]">
          No agent activity recorded yet. Start a chat with any agent to see analytics here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_100px_80px_70px] gap-4 px-4 py-2.5 border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
        <span>Agent</span>
        <span>Status</span>
        <span>Last Used</span>
        <span className="text-right">Sessions</span>
        <span className="text-right">Accept</span>
      </div>
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
            delay: i * 0.06,
          }}
          className={cn(
            "grid grid-cols-[1fr_100px_100px_80px_70px] gap-4 items-center px-4 py-3 transition-colors",
            "hover:bg-white/[0.02]",
            i < agents.length - 1 && "border-b border-white/[0.03]"
          )}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: agent.color }}
            />
            <div className="min-w-0">
              <span className="text-[12px] font-medium text-white">{agent.label}</span>
              {agent.errors.length > 0 && (
                <p className="text-[9px] text-[#F87171] truncate mt-0.5">{agent.errors[0]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={agent.status} color={agent.color} />
            <span className="text-[11px] capitalize text-white/[0.50]">{agent.status}</span>
          </div>
          <span className="text-[11px] tabular-nums text-white/[0.40]">{agent.lastUsed}</span>
          <span className="text-right text-[12px] font-medium tabular-nums text-white/[0.60]">
            {agent.sessions}
          </span>
          <div className="flex items-center justify-end gap-1.5">
            <div className="h-1 w-8 rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${agent.acceptanceRate}%`,
                  backgroundColor:
                    agent.acceptanceRate >= 90
                      ? "#34D399"
                      : agent.acceptanceRate >= 70
                        ? "#FBBF24"
                        : "#F87171",
                  opacity: agent.sessions > 0 ? 0.8 : 0.3,
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-white/[0.45]">
              {agent.sessions > 0 ? `${agent.acceptanceRate}%` : "—"}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  StrategiesBlock                                                     */
/* ================================================================== */

function StrategiesBlock({ agents }: { agents: AgentAnalytics[] }) {
  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.id} className="flex gap-3">
          <span
            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white mb-0.5">{agent.label}:</p>
            <p className="text-[11px] leading-relaxed text-white/[0.45]">{agent.strategy}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  ConnectorsTable                                                     */
/* ================================================================== */

function ConnectorsTable({ connectors }: { connectors: ConnectorAnalytics[] }) {
  if (connectors.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 text-center">
        <p className="text-[11px] text-white/[0.30]">
          No connectors configured.{" "}
          <a href="/connectors" className="text-[#818CF8] hover:underline">Connect accounts</a>{" "}
          to see connector health here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 px-4 py-2.5 border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
        <span>Connector</span>
        <span>Status</span>
        <span>Last Sync</span>
        <span className="text-right">Accounts</span>
      </div>
      {connectors.map((conn, i) => (
        <motion.div
          key={conn.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
            delay: 0.2 + i * 0.05,
          }}
          className={cn(
            "grid grid-cols-[1fr_100px_100px_80px] gap-4 items-center px-4 py-3 transition-colors",
            "hover:bg-white/[0.02]",
            i < connectors.length - 1 && "border-b border-white/[0.03]"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[8px] font-bold text-white"
              style={{
                backgroundColor: `${conn.accentColor}20`,
                border: `1px solid ${conn.accentColor}30`,
              }}
            >
              {conn.abbreviation}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-white">{conn.name}</span>
                {conn.status === "connected" && !conn.hasApiKey && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#FBBF24]"
                    title="Connected but missing API key — this connector won't sync until you add a key"
                  >
                    <Key className="h-2 w-2" />
                    No key
                  </span>
                )}
              </div>
              {conn.errorMessage && (
                <p className="text-[9px] text-[#F87171] truncate mt-0.5">{conn.errorMessage}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={conn.status} />
            <span className="text-[11px] capitalize text-white/[0.50]">{conn.status}</span>
          </div>
          <span className="text-[11px] tabular-nums text-white/[0.40]">{conn.lastSync}</span>
          <span className="text-right text-[12px] font-medium tabular-nums text-white/[0.60]">
            {conn.accountCount > 0
              ? `${conn.accountCount} account${conn.accountCount !== 1 ? "s" : ""}`
              : "—"}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  UsageBars — CSS-only horizontal bars                                */
/* ================================================================== */

function UsageBars({ agents, totalSessions }: { agents: AgentAnalytics[]; totalSessions: number }) {
  const maxSessions = Math.max(...agents.map((a) => a.sessions), 1)

  if (totalSessions === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 text-center">
        <p className="text-[11px] text-white/[0.30]">
          No usage data yet. Agent activity will appear here as you chat.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
      <div className="space-y-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3"
          >
            <span className="w-20 text-[11px] text-white/[0.45]">{agent.label}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(agent.sessions / maxSessions) * 100}%` }}
                transition={{
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1],
                  delay: 0.4 + i * 0.1,
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: agent.color, opacity: 0.7 }}
              />
            </div>
            <span className="w-10 text-right text-[11px] tabular-nums text-white/[0.40]">
              {agent.sessions}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.04] text-[10px] text-white/[0.25]">
        {totalSessions} total sessions this period
      </div>
    </div>
  )
}

/* ================================================================== */
/*  AnalyticsPage — all data from useAnalytics() hook                   */
/* ================================================================== */

export function AnalyticsPage() {
  const { agents, connectors, totalSessions } = useAnalytics()

  return (
    <PageShell
      title="Analytics"
      subtitle="Agent health, connector status, and system usage"
      maxWidth="wide"
    >
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <SectionHeader icon={Activity} label="Agents" />
          <AgentsTable agents={agents} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
        >
          <SectionHeader icon={Lightbulb} label="Strategies" />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
            <StrategiesBlock agents={agents} />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.16 }}
        >
          <SectionHeader icon={Plug} label="Connectors" />
          <ConnectorsTable connectors={connectors} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.24 }}
        >
          <SectionHeader
            icon={BarChart3}
            label="Usage"
            right={
              totalSessions > 0 ? (
                <span className="text-[10px] text-white/[0.25]">{totalSessions} total sessions</span>
              ) : undefined
            }
          />
          <UsageBars agents={agents} totalSessions={totalSessions} />
        </motion.section>
      </div>
    </PageShell>
  )
}
