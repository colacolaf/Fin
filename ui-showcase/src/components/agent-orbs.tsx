"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { TrendingUp, TrendingDown, PiggyBank, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dock,
  DockCard,
  DockCardInner,
} from "@/components/ui/dock"

/* ================================================================== */
/*  Agent definitions — each gets a unique gradient orb                */
/* ================================================================== */

const agents = [
  {
    id: "portfolio",
    label: "Portfolio Agent",
    icon: <TrendingUp className="h-6 w-6 text-white/90 drop-shadow-md" />,
    gradient:
      "radial-gradient(ellipse at 30% 25%, #c4b5fd 0%, #818cf8 40%, #6366f1 70%, #4338ca 100%)",
    glow: "0 0 24px rgba(129,140,248,0.5), 0 0 48px rgba(129,140,248,0.2)",
    color: "#818CF8",
    placeholder: "Ask about performance, allocation, holdings...",
  },
  {
    id: "debt",
    label: "Debt Agent",
    icon: <TrendingDown className="h-6 w-6 text-white/90 drop-shadow-md" />,
    gradient:
      "radial-gradient(ellipse at 35% 30%, #fde68a 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)",
    glow: "0 0 24px rgba(251,191,36,0.5), 0 0 48px rgba(251,191,36,0.2)",
    color: "#FBBF24",
    placeholder: "Ask about payoff strategy, balances, interest...",
  },
  {
    id: "retirement",
    label: "Retirement Agent",
    icon: <PiggyBank className="h-6 w-6 text-white/90 drop-shadow-md" />,
    gradient:
      "radial-gradient(ellipse at 30% 25%, #a5f3fc 0%, #67e8f9 40%, #22d3ee 70%, #0891b2 100%)",
    glow: "0 0 24px rgba(103,232,249,0.5), 0 0 48px rgba(103,232,249,0.2)",
    color: "#67E8F9",
    placeholder: "Ask about projections, savings, retirement plan...",
  },
] as const

type Agent = (typeof agents)[number]

/** Convert hex color to "r,g,b" string for use in rgba() */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}

/* ================================================================== */
/*  InlineChat — appears below dock when an orb is clicked             */
/* ================================================================== */

function InlineChat({
  agent,
  onClose,
}: {
  agent: Agent
  onClose: () => void
}) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim()) return
      // In a real app this would send to the agent API
      setMessage("")
    },
    [message]
  )

  const rgb = hexToRgb(agent.color)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="relative mt-3 w-full"
    >
      {/* Ambient glow behind the chat box */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-xl opacity-20 blur-[20px]"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${agent.color} 0%, transparent 70%)`,
        }}
      />

      {/* Chat container */}
      <div
        className="relative rounded-lg border p-2.5"
        style={{
          borderColor: `rgba(${rgb}, 0.15)`,
          backgroundColor: `rgba(${rgb}, 0.04)`,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: agent.color }}
            />
            <span className="text-[10px] font-semibold text-white/[0.70]">
              {agent.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/[0.08] active:scale-95"
            aria-label="Close chat"
          >
            <X className="h-3 w-3 text-white/[0.35]" />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={agent.placeholder}
            className={cn(
              "flex-1 bg-transparent text-[11px] text-white placeholder:text-white/[0.25]",
              "outline-none border-none py-1.5 px-2"
            )}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-all duration-100",
              "active:scale-95",
              message.trim()
                ? "opacity-100 hover:bg-white/[0.08]"
                : "opacity-30 cursor-not-allowed"
            )}
            style={{
              color: message.trim() ? agent.color : "rgba(255,255,255,0.2)",
            }}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </motion.div>
  )
}

/* ================================================================== */
/*  AgentOrbs — real Dock with magnification + bounce + click-to-chat  */
/* ================================================================== */

export function AgentOrbs() {
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)

  const handleOrbClick = useCallback(
    (agent: Agent) => {
      setActiveAgent((prev) => (prev?.id === agent.id ? null : agent))
    },
    []
  )

  const handleClose = useCallback(() => setActiveAgent(null), [])

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.65] text-center">
        Agent Chat
      </h4>

      {/* Horizontal dock with magnification effect */}
      <div className="flex justify-center">
        <Dock>
          {agents.map((agent, index) => (
            <DockCard
              key={agent.id}
              id={agent.id}
              index={index}
              onClick={() => handleOrbClick(agent)}
            >
              <DockCardInner
                id={agent.id}
                style={{
                  background: agent.gradient,
                  boxShadow: agent.glow,
                }}
              >
                {agent.icon}
              </DockCardInner>
            </DockCard>
          ))}
        </Dock>
      </div>

      {/* Agent labels — match dock's gap-3 spacing */}
      <div className="flex justify-center gap-3 mt-2 px-2">
        {agents.map((agent) => (
          <span
            key={agent.id}
            className={cn(
              "text-[9px] font-medium text-center transition-colors duration-150",
              activeAgent?.id === agent.id
                ? "text-white/[0.80]"
                : "text-white/[0.55]"
            )}
            style={{ width: 40 }}
          >
            {agent.label.replace(" Agent", "")}
          </span>
        ))}
      </div>

      {/* Inline chat — animates in when an orb is clicked */}
      <AnimatePresence mode="wait">
        {activeAgent && (
          <InlineChat
            key={activeAgent.id}
            agent={activeAgent}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
