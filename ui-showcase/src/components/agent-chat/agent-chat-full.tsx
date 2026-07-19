"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAgent, type AgentDef, type AgentId } from "@/lib/agents"
import { useAgentThinking, type AgentMessage } from "@/lib/agents/use-agent-thinking"
import { appendChatSession, type AgentSlug } from "@/lib/memory/data"
import { Timer } from "@/components/ui/timer"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import {
  ModelSettings,
  buildDefaultModelSettingsState,
  type ModelSettingsState,
} from "./model-settings"
import { ChatMessage, ChatEmptyState } from "./chat-message"
import { ChatComposer } from "./chat-composer"
import { ThinkingCard } from "./thinking-card"

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getDefaultCategoryForAgent(agentId: string): string {
  switch (agentId) {
    case "portfolio": return "Rebalancing"
    case "debt": return "Payoff Strategy"
    case "retirement": return "Contribution Strategy"
    default: return "Chat"
  }
}

/* ================================================================== */
/*  AgentChatHeader                                                    */
/* ================================================================== */

function AgentChatHeader({
  agent,
  isThinking,
  hasStartedChat,
  modelState,
  onModelChange,
}: {
  agent: AgentDef
  isThinking: boolean
  hasStartedChat: boolean
  modelState: ModelSettingsState
  onModelChange: (s: ModelSettingsState) => void
}) {
  const router = useRouter()
  const Icon = agent.icon

  return (
    <header
      className={cn(
        "relative z-20 flex shrink-0 items-center justify-between gap-4",
        "border-b border-white/[0.06] bg-black/20 py-3 pl-20 pr-6 backdrop-blur-xl"
      )}
    >
      {/* Left: back + identity */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]",
            "text-white/[0.45] transition-all duration-150",
            "hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
          )}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: agent.gradient,
            boxShadow: agent.glow,
          }}
        >
          <Icon className="h-5 w-5 text-white/90 drop-shadow-md" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[14px] font-semibold tracking-tight text-white">
              {agent.label}
            </h1>
            {isThinking && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: `rgba(${agent.colorRgb}, 0.12)`,
                  color: agent.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: agent.color }}
                />
                thinking
              </motion.span>
            )}
          </div>
          <p className="truncate text-[11px] text-white/[0.38]">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Right: timer + model */}
      <div className="flex shrink-0 items-center gap-2.5">
        {/* Session timer — starts on first chat, keeps running */}
        <Timer
          loading={hasStartedChat}
          format="MM:SS"
          variant="outline"
          size="sm"
          resetOnLoadingChange={false}
          className="border-white/[0.10] text-white/70"
        />

        <div className="h-5 w-px bg-white/[0.08]" />

        <ModelSettings
          agent={agent}
          state={modelState}
          onChange={onModelChange}
        />
      </div>
    </header>
  )
}

/* ================================================================== */
/*  AgentChatFull — Terminal Console                                   */
/* ================================================================== */

interface AgentChatFullProps {
  agentId: string
}

export function AgentChatFull({ agentId }: AgentChatFullProps) {
  const agent = getAgent(agentId)

  const [messages, setMessages] = React.useState<AgentMessage[]>([])
  const [activeSkills, setActiveSkills] = React.useState<Set<string>>(new Set())
  const [hasStartedChat, setHasStartedChat] = React.useState(false)

  // Read model + config from localStorage on mount
  const [modelState, setModelState] = React.useState<ModelSettingsState>(() =>
    buildDefaultModelSettingsState(agentId)
  )

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const [sessionId] = React.useState(`agent-${agentId}-${Date.now()}`)
  const sessionCategoryRef = React.useRef(getDefaultCategoryForAgent(agentId))

  const { isThinking, steps, totalElapsed, send, cancel } = useAgentThinking({
    onReply: (reply) => {
      setMessages((prev) => [...prev, reply])
    },
  })

  // Persist chat history to localStorage when messages change
  React.useEffect(() => {
    if (messages.length === 0) return
    const session: import("@/lib/memory/data").ChatSession = {
      id: sessionId,
      agent: agentId as AgentSlug,
      category: sessionCategoryRef.current,
      createdAt: new Date(messages[0].createdAt).toISOString(),
      updatedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text,
        timestamp: new Date(m.createdAt).toISOString(),
      })),
    }
    appendChatSession(session)
  }, [messages, agentId])

  // Auto-scroll to bottom
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isThinking])

  /**
   * Increment analytics counters on the FIRST user send of a session —
   * not on mount. Visiting the chat page is not a session; only sending
   * a message is. Previously this used a mount-time effect, which double-
   * counted in dev mode (React Strict Mode) and counted every navigation.
   */
  const recordFirstSessionUse = React.useCallback(() => {
    if (!agent) return
    const id = agent.id

    const sessionDefaults: Record<string, number> = { portfolio: 0, debt: 0, retirement: 0 }
    const lastUsedDefaults: Record<string, number | null> = {
      portfolio: null,
      debt: null,
      retirement: null,
    }

    try {
      const sessions = {
        ...sessionDefaults,
        ...JSON.parse(localStorage.getItem("fo-agent-sessions") || "null"),
      } as Record<string, number>
      sessions[id] = (sessions[id] ?? 0) + 1
      localStorage.setItem("fo-agent-sessions", JSON.stringify(sessions))

      const lastUsed = {
        ...lastUsedDefaults,
        ...JSON.parse(localStorage.getItem("fo-agent-last-used") || "null"),
      } as Record<string, number | null>
      lastUsed[id] = Date.now()
      localStorage.setItem("fo-agent-last-used", JSON.stringify(lastUsed))
    } catch {
      // localStorage unavailable
    }
  }, [agent])

  const handleSend = (text: string) => {
    if (!hasStartedChat) {
      setHasStartedChat(true)
      recordFirstSessionUse()
    }
    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    send(text)
  }

  const handleToggleSkill = (id: string) => {
    setActiveSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Unknown agent — graceful fallback
  if (!agent) {
    return (
      <div className="dark flex h-screen w-full items-center justify-center bg-[#08090C] text-white/60">
        <div className="text-center">
          <p className="text-[14px]">Unknown agent: {agentId}</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#818CF8] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isModelConnected = !!modelState.modelId

  return (
    <AgentChatFullInner
      agent={agent}
      messages={messages}
      isThinking={isThinking}
      steps={steps}
      totalElapsed={totalElapsed}
      onSend={handleSend}
      onStop={cancel}
      activeSkills={activeSkills}
      onToggleSkill={handleToggleSkill}
      modelState={modelState}
      onModelChange={setModelState}
      scrollRef={scrollRef}
      bottomRef={bottomRef}
      hasStartedChat={hasStartedChat}
      isModelConnected={isModelConnected}
    />
  )
}

/* ================================================================== */
/*  Inner — split so the agent lookup is clean and hooks stay ordered  */
/* ================================================================== */

interface AgentChatFullInnerProps {
  agent: AgentDef
  messages: AgentMessage[]
  isThinking: boolean
  steps: import("@/lib/agents/use-agent-thinking").StepStatus[]
  totalElapsed: number
  onSend: (text: string) => void
  onStop: () => void
  activeSkills: Set<string>
  onToggleSkill: (id: string) => void
  modelState: ModelSettingsState
  onModelChange: (s: ModelSettingsState) => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  bottomRef: React.RefObject<HTMLDivElement | null>
  hasStartedChat: boolean
  isModelConnected: boolean
}

function AgentChatFullInner({
  agent,
  messages,
  isThinking,
  steps,
  totalElapsed,
  onSend,
  onStop,
  activeSkills,
  onToggleSkill,
  modelState,
  onModelChange,
  scrollRef,
  bottomRef,
  hasStartedChat,
  isModelConnected,
}: AgentChatFullInnerProps) {
  const hasMessages = messages.length > 0
  const lastMessage = messages[messages.length - 1]
  const showLiveThinking = isThinking && (!lastMessage || lastMessage.role === "user")

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      {/* Liquid glass background tinted to the agent */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#08090C]" />
        <div
          className="absolute -top-[15%] -left-[10%] h-[55%] w-[45%] rounded-full opacity-[0.10] blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${agent.color} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[40%] rounded-full opacity-[0.06] blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${agent.secondary} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-[30%] right-[8%] h-[28%] w-[22%] rounded-full opacity-[0.05] blur-[80px]"
          style={{
            background: `radial-gradient(circle, ${agent.color} 0%, transparent 70%)`,
          }}
        />
        {/* Subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,9,12,0.5)_100%)]" />
      </div>

      <AppSidebar triggerPosition="top-left" />

      <main className="flex flex-1 flex-col overflow-hidden">
        <AgentChatHeader
          agent={agent}
          isThinking={isThinking}
          hasStartedChat={hasStartedChat}
          modelState={modelState}
          onModelChange={onModelChange}
        />

        {/* Chat body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex min-h-full max-w-[860px] flex-col px-6 py-6">
            {!hasMessages ? (
              <ChatEmptyState agent={agent} />
            ) : (
              <div className="flex flex-col gap-5">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      agent={agent}
                      isLive={
                        msg.role === "agent" &&
                        msg.id === lastMessage?.id &&
                        isThinking
                      }
                      liveSteps={steps}
                      liveTotalElapsed={totalElapsed}
                    />
                  ))}
                </AnimatePresence>

                {/* Live thinking card */}
                {showLiveThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 px-1"
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: agent.gradient,
                        boxShadow: `0 0 16px rgba(${agent.colorRgb}, 0.3)`,
                      }}
                    >
                      <agent.icon className="h-4 w-4 text-white/90" />
                    </div>
                    <LiveThinking
                      agent={agent}
                      steps={steps}
                      totalElapsed={totalElapsed}
                    />
                  </motion.div>
                )}
              </div>
            )}
            <div ref={bottomRef} className="h-px shrink-0" />
          </div>
        </div>

        {/* Composer */}
        <ChatComposer
          agent={agent}
          activeSkills={activeSkills}
          onToggleSkill={onToggleSkill}
          onSend={onSend}
          disabled={isThinking}
          isThinking={isThinking}
          onStop={onStop}
          modelConnected={isModelConnected}
        />
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  LiveThinking — wraps ThinkingCard for the in-flight run            */
/* ------------------------------------------------------------------ */

function LiveThinking({
  agent,
  steps,
  totalElapsed,
}: {
  agent: AgentDef
  steps: import("@/lib/agents/use-agent-thinking").StepStatus[]
  totalElapsed: number
}) {
  return (
    <ThinkingCard
      steps={steps}
      agent={agent}
      totalElapsed={totalElapsed}
      collapsed={false}
    />
  )
}
