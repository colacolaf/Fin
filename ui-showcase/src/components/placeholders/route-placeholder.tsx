"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Sparkles, type LucideIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { getAgent, type AgentDef } from "@/lib/agents"

/* ================================================================== */
/*  RoutePlaceholder — shared shell for stub routes                     */
/* ================================================================== */

interface RoutePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  /** Optional accent color (defaults to the finance indigo) */
  accentColor?: string
  /** Optional accent rgb (defaults to the finance indigo) */
  accentRgb?: string
  /** Optional secondary text shown under the title */
  secondary?: string
}

export function RoutePlaceholder({
  title,
  description,
  icon: Icon,
  accentColor = "#818CF8",
  accentRgb = "129,140,248",
  secondary,
}: RoutePlaceholderProps) {
  return (
    <div className="dark relative flex min-h-screen w-full flex-col bg-[#08090C]">
      {/* Liquid glass background tinted to the accent */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#08090C]" />
        <div
          className="absolute -top-[15%] -left-[10%] h-[55%] w-[45%] rounded-full opacity-[0.08] blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[40%] rounded-full opacity-[0.05] blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,9,12,0.5)_100%)]" />
      </div>

      <AppSidebar triggerPosition="top-left" />

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex max-w-md flex-col items-center gap-5 text-center"
        >
          {/* Icon in a glass tile */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `rgba(${accentRgb}, 0.10)`,
              borderColor: `rgba(${accentRgb}, 0.20)`,
              boxShadow: `0 0 32px rgba(${accentRgb}, 0.20)`,
            }}
          >
            <Icon className="h-8 w-8" style={{ color: accentColor }} />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-[18px] font-semibold tracking-tight text-white">
              {title}
            </h1>
            <p className="text-[13px] leading-relaxed text-white/[0.45]">
              {description}
            </p>
            {secondary && (
              <p className="text-[11px] text-white/[0.30]">{secondary}</p>
            )}
          </div>

          {/* Coming soon chip */}
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{
              borderColor: `rgba(${accentRgb}, 0.15)`,
              backgroundColor: `rgba(${accentRgb}, 0.05)`,
            }}
          >
            <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
            <span className="text-[11px] font-medium" style={{ color: accentColor }}>
              Coming soon
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Specific placeholders per route                                    */
/* ------------------------------------------------------------------ */

export function AnalyticsPlaceholder() {
  return (
    <RoutePlaceholder
      title="Analytics"
      description="Cross-account trends, performance benchmarks, and spending insights across all your connected accounts."
      icon={Sparkles}
      secondary="This page will be designed in a later phase."
    />
  )
}

export function SettingsPlaceholder() {
  return (
    <RoutePlaceholder
      title="Settings"
      description="App preferences, encryption keys, data sync, and notification controls for your Finance OS."
      icon={Sparkles}
      secondary="This page will be designed in a later phase."
    />
  )
}

export function AgentSettingsPlaceholder({ agentId }: { agentId: string }) {
  const agent = getAgent(agentId)
  if (!agent) return null
  return (
    <AgentSettingsPlaceholderInner agent={agent} />
  )
}

function AgentSettingsPlaceholderInner({ agent }: { agent: AgentDef }) {
  const Icon = agent.icon
  return (
    <RoutePlaceholder
      title={`${agent.shortLabel} Settings`}
      description={`Configure ${agent.label}: model selection, temperature, citations, auto-execute, and connector access for this agent.`}
      icon={Icon}
      accentColor={agent.color}
      accentRgb={agent.colorRgb}
      secondary="Agent-specific settings will be designed in a later phase."
    />
  )
}
