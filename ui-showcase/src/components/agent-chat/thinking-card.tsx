"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StepStatus } from "@/lib/agents/use-agent-thinking"
import type { AgentDef } from "@/lib/agents"

/* ------------------------------------------------------------------ */
/*  StepRow — one F.I.R.M. step                                        */
/* ------------------------------------------------------------------ */

function StepRow({
  step,
  index,
  agent,
  isLast,
}: {
  step: StepStatus
  index: number
  agent: AgentDef
  isLast: boolean
}) {
  const isRunning = step.state === "running"
  const isDone = step.state === "done"

  const Icon = isDone ? Check : isRunning ? Loader2 : Circle

  return (
    <div className="relative flex gap-3 pb-3 last:pb-0">
      {/* Connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-[11px] top-6 bottom-0 w-px",
            isDone ? "bg-white/[0.10]" : "bg-white/[0.04]"
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors duration-200",
          isDone && "bg-white/[0.08]",
          isRunning && "bg-white/[0.06]",
          !isDone && !isRunning && "bg-white/[0.02]"
        )}
        style={
          isDone || isRunning
            ? { boxShadow: `0 0 12px rgba(${agent.colorRgb}, 0.35)` }
            : undefined
        }
      >
        <Icon
          className={cn(
            "h-3 w-3 transition-colors duration-200",
            isDone && "text-white",
            isRunning && cn("animate-spin", "text-white"),
            !isDone && !isRunning && "text-white/[0.25]"
          )}
          style={
            isDone
              ? { color: agent.color }
              : isRunning
                ? { color: agent.color }
                : undefined
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-[9px] font-mono tabular-nums text-white/[0.25]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-[12px] font-medium transition-colors duration-200 truncate",
                isDone || isRunning ? "text-white" : "text-white/[0.45]"
              )}
            >
              {step.label}
            </span>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-white/[0.30] shrink-0">
            {step.elapsed > 0 ? `${step.elapsed.toFixed(1)}s` : "—"}
          </span>
        </div>

        {/* Streaming text */}
        <AnimatePresence mode="wait">
          {step.text && (isRunning || isDone) && (
            <motion.p
              key={step.text}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "mt-1 text-[11px] leading-relaxed font-mono",
                isDone ? "text-white/[0.45]" : "text-white/[0.65]"
              )}
            >
              {step.text}
              {isRunning && (
                <span
                  className="ml-0.5 inline-block h-[10px] w-[6px] translate-y-[1px] animate-pulse"
                  style={{ backgroundColor: agent.color }}
                />
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ThinkingCard                                                       */
/* ------------------------------------------------------------------ */

interface ThinkingCardProps {
  steps: StepStatus[]
  agent: AgentDef
  /** Total elapsed seconds (live) */
  totalElapsed: number
  /** When collapsed, shows a compact summary instead */
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function ThinkingCard({
  steps,
  agent,
  totalElapsed,
  collapsed = false,
  onToggleCollapse,
  className,
}: ThinkingCardProps) {
  const runningStep = steps.find((s) => s.state === "running")
  const doneCount = steps.filter((s) => s.state === "done").length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "relative rounded-xl border backdrop-blur-xl",
        className
      )}
      style={{
        borderColor: `rgba(${agent.colorRgb}, 0.12)`,
        backgroundColor: `rgba(${agent.colorRgb}, 0.03)`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-xl opacity-[0.12] blur-md"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${agent.color} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="relative flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-mono uppercase tracking-[0.14em]"
            style={{ color: agent.color }}
          >
            thinking
          </span>
          <span className="text-[9px] font-mono text-white/[0.30]">
            {doneCount}/{steps.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {runningStep && (
            <span className="text-[10px] text-white/[0.45] truncate max-w-[160px]">
              {runningStep.label}
            </span>
          )}
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{ color: agent.color }}
          >
            {totalElapsed.toFixed(1)}s
          </span>
        </div>
      </button>

      {/* Steps */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-0.5">
              {steps.map((step, i) => (
                <StepRow
                  key={step.key}
                  step={step}
                  index={i}
                  agent={agent}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
