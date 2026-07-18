"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Activity,
  Lightbulb,
  Plug,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import {
  agentStatuses,
  connectorHealth,
  totalSessions,
} from "@/lib/analytics/data"

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

function AgentsTable() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_100px_80px_70px] gap-4 px-4 py-2.5 border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
        <span>Agent</span>
        <span>Status</span>
        <span>Last Used</span>
        <span className="text-right">Sessions</span>
        <span className="text-right">Accept</span>
      </div>

      {/* Agent rows */}
      {agentStatuses.map((agent, i) => (
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
            i < agentStatuses.length - 1 && "border-b border-white/[0.03]"
          )}
        >
          {/* Agent name + color */}
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: agent.color }}
            />
            <span className="text-[12px] font-medium text-white">
              {agent.label}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <StatusDot status={agent.status} color={agent.color} />
            <span className="text-[11px] capitalize text-white/[0.50]">
              {agent.status}
            </span>
          </div>

          {/* Last used */}
          <span className="text-[11px] tabular-nums text-white/[0.40]">
            {agent.lastUsed}
          </span>

          {/* Sessions */}
          <span className="text-right text-[12px] font-medium tabular-nums text-white/[0.60]">
            {agent.sessions}
          </span>

          {/* Acceptance rate */}
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
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-white/[0.45]">
              {agent.acceptanceRate}%
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

function StrategiesBlock() {
  return (
    <div className="space-y-3">
      {agentStatuses.map((agent) => (
        <div key={agent.id} className="flex gap-3">
          <span
            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white mb-0.5">
              {agent.label}:
            </p>
            <p className="text-[11px] leading-relaxed text-white/[0.45]">
              {agent.strategy}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  ConnectorsTable                                                     */
/* ================================================================== */

function ConnectorsTable() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 px-4 py-2.5 border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
        <span>Connector</span>
        <span>Status</span>
        <span>Last Sync</span>
        <span className="text-right">Accounts</span>
      </div>

      {/* Connector rows */}
      {connectorHealth.map((conn, i) => (
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
            i < connectorHealth.length - 1 && "border-b border-white/[0.03]"
          )}
        >
          {/* Connector name */}
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
              <span className="text-[12px] font-medium text-white">
                {conn.name}
              </span>
              {conn.errorMessage && (
                <p className="text-[9px] text-[#F87171] truncate mt-0.5">
                  {conn.errorMessage}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <StatusDot status={conn.status} />
            <span className="text-[11px] capitalize text-white/[0.50]">
              {conn.status}
            </span>
          </div>

          {/* Last sync */}
          <span className="text-[11px] tabular-nums text-white/[0.40]">
            {conn.lastSync}
          </span>

          {/* Account count */}
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

function UsageBars() {
  const maxSessions = Math.max(...agentStatuses.map((a) => a.sessions))

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
      <div className="space-y-3">
        {agentStatuses.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3"
          >
            <span className="w-20 text-[11px] text-white/[0.45]">
              {agent.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(agent.sessions / maxSessions) * 100}%`,
                }}
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
/*  AnalyticsPage — Compact Table                                       */
/* ================================================================== */

export function AnalyticsPage() {
  return (
    <PageShell
      title="Analytics"
      subtitle="Agent health, connector status, and system usage"
      maxWidth="wide"
    >
      <div className="space-y-8">
        {/* Agents */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <SectionHeader icon={Activity} label="Agents" />
          <AgentsTable />
        </motion.section>

        {/* Strategies */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
        >
          <SectionHeader icon={Lightbulb} label="Strategies" />
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
            <StrategiesBlock />
          </div>
        </motion.section>

        {/* Connectors */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.16 }}
        >
          <SectionHeader icon={Plug} label="Connectors" />
          <ConnectorsTable />
        </motion.section>

        {/* Usage */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: 0.24 }}
        >
          <SectionHeader
            icon={BarChart3}
            label="Usage"
            right={
              <span className="text-[10px] text-white/[0.25]">
                {totalSessions} total sessions
              </span>
            }
          />
          <UsageBars />
        </motion.section>
      </div>
    </PageShell>
  )
}
