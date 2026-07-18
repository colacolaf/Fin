"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ChevronRight } from "lucide-react"
import type { AgentDef } from "@/lib/agents"
import type { AgentMessage } from "@/lib/agents/use-agent-thinking"
import { ThinkingCard } from "./thinking-card"

/* ------------------------------------------------------------------ */
/*  Time label                                                         */
/* ------------------------------------------------------------------ */

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m} ${ampm}`
}

/* ------------------------------------------------------------------ */
/*  AgentAvatar                                                        */
/* ------------------------------------------------------------------ */

function AgentAvatar({ agent, size = 28 }: { agent: AgentDef; size?: number }) {
  const Icon = agent.icon
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: agent.gradient,
        boxShadow: agent.glow,
      }}
      aria-hidden
    >
      <Icon className="text-white/90 drop-shadow-md" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ChatMessage                                                        */
/* ------------------------------------------------------------------ */

interface ChatMessageProps {
  message: AgentMessage
  agent: AgentDef
  /** When true and message is the latest agent message, render an expanded thinking card */
  isLive?: boolean
  /** Live step statuses to render in the expanded card (only used when isLive) */
  liveSteps?: import("@/lib/agents/use-agent-thinking").StepStatus[]
  liveTotalElapsed?: number
}

export function ChatMessage({
  message,
  agent,
  isLive = false,
  liveSteps,
  liveTotalElapsed = 0,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  // Initial collapse state: live thinking starts expanded, saved traces collapsed.
  // No effect needed — each message is its own instance, so the initial value
  // is correct and avoids a cascading setState-in-effect.
  const [thinkingCollapsed, setThinkingCollapsed] = useState(!isLive)

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="flex justify-end gap-3 px-1"
      >
        <div className="flex max-w-[80%] flex-col items-end gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/[0.30]">{formatTime(message.createdAt)}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.55]">
              you
            </span>
          </div>
          <div
            className="rounded-2xl rounded-tr-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] leading-relaxed text-white"
          >
            {message.text}
          </div>
        </div>
      </motion.div>
    )
  }

  // Agent message
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="flex gap-3 px-1"
    >
      <AgentAvatar agent={agent} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.70]">
            {agent.shortLabel}
          </span>
          <span className="text-[10px] text-white/[0.30]">{formatTime(message.createdAt)}</span>
          {message.thinkingElapsed != null && (
            <span className="text-[10px] font-mono text-white/[0.25]">
              · {message.thinkingElapsed.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Live or saved thinking trace */}
        {(isLive && liveSteps) || message.thinking ? (
          <ThinkingCard
            steps={isLive && liveSteps ? liveSteps : message.thinking!}
            agent={agent}
            totalElapsed={isLive ? liveTotalElapsed : message.thinkingElapsed ?? 0}
            collapsed={thinkingCollapsed}
            onToggleCollapse={() => setThinkingCollapsed((c) => !c)}
          />
        ) : null}

        {/* Agent reply text */}
        {message.text && (
          <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white">
              {message.text}
            </p>
            {/* Faint footer: disclaimer + next step marker */}
            <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.04] pt-2">
              <ChevronRight className="h-3 w-3 text-white/[0.25]" />
              <span className="text-[10px] text-white/[0.35]">
                Analysis, not advice. Confirm before executing.
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  EmptyState — first conversation prompt                            */
/* ------------------------------------------------------------------ */

export function ChatEmptyState({ agent }: { agent: AgentDef }) {
  const Icon = agent.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center gap-5 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: agent.gradient,
          boxShadow: `0 0 32px rgba(${agent.colorRgb}, 0.4), 0 0 64px rgba(${agent.colorRgb}, 0.2)`,
        }}
      >
        <Icon className="h-8 w-8 text-white/90 drop-shadow-md" />
      </motion.div>

      <div className="space-y-1.5">
        <h2 className="text-[15px] font-semibold text-white tracking-tight">
          {agent.label}
        </h2>
        <p className="max-w-[320px] text-[12px] leading-relaxed text-white/[0.45]">
          {agent.tagline}
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {[
          "How am I doing?",
          "What should I do next?",
          "Show me the numbers",
        ].map((prompt) => (
          <div
            key={prompt}
            className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-white/[0.45]"
          >
            {prompt}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
