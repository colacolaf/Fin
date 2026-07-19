"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowUp,
  Sparkles,
  Plug,
  ChevronDown,
  Check,
  Square,
  Mic,
  MicOff,
  AlertTriangle,
  Settings,
  Globe,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  availableSkills,
  type AgentDef,
  type AgentSkill,
} from "@/lib/agents"

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                                */
/* ------------------------------------------------------------------ */

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null
  try { return localStorage.getItem(key) } catch { return null }
}

function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = safeGet(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ */
/*  SkillsMenu                                                         */
/* ------------------------------------------------------------------ */

function SkillsMenu({
  activeSkills,
  onToggle,
  accentColor,
}: {
  activeSkills: Set<string>
  onToggle: (id: string) => void
  accentColor: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5",
            "text-[11px] font-medium text-white/[0.65] transition-all duration-150",
            "hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white active:scale-[0.97]"
          )}
        >
          <Sparkles className="h-3 w-3" style={{ color: accentColor }} />
          <span>Skills</span>
          {activeSkills.size > 0 && (
            <span
              className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
              style={{ backgroundColor: accentColor, color: "#0F1117" }}
            >
              {activeSkills.size}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 text-white/[0.40] transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-[280px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-1.5 flex items-center justify-between px-2 pt-1">
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.40]">
            Skills
          </span>
          <span className="text-[9px] text-white/[0.30]">
            {activeSkills.size} active
          </span>
        </div>
        {availableSkills.map((skill: AgentSkill) => {
          const isActive = activeSkills.has(skill.id)
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onToggle(skill.id)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-100",
                isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isActive ? "border-transparent" : "border-white/[0.12]"
                )}
                style={isActive ? { backgroundColor: accentColor } : undefined}
              >
                {isActive && <Check className="h-3 w-3 text-[#0F1117]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-white">
                  {skill.label}
                </div>
                <div className="text-[10px] text-white/[0.40]">
                  {skill.description}
                </div>
              </div>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  ConnectorsButton — reads directly from localStorage (no catalog)   */
/* ------------------------------------------------------------------ */

interface RealConnector {
  id: string
  name: string
  category: string
  status: "connected" | "disconnected"
}

function ConnectorsButton({ accentColor }: { accentColor: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  // Read directly from localStorage — bypass useConnectors catalog entirely
  const providers = React.useMemo(
    () => safeGetJSON<Record<string, string>>("fo-connected-providers", {}),
    []
  )
  const apiKeys = React.useMemo(
    () => safeGetJSON<Record<string, string>>("fo-api-keys", {}),
    []
  )

  // Build connector list from ONLY what's in localStorage
  const connectedConnectors: RealConnector[] = React.useMemo(() => {
    const list: RealConnector[] = []
    for (const [category, providerId] of Object.entries(providers)) {
      if (providerId) {
        list.push({
          id: providerId,
          name: providerId.charAt(0).toUpperCase() + providerId.slice(1).replace(/-/g, " "),
          category,
          status: "connected",
        })
      }
    }
    // Also check apiKeys for any provider IDs not in providers map
    for (const keyId of Object.keys(apiKeys)) {
      if (!list.some((c) => c.id === keyId) && apiKeys[keyId]) {
        list.push({
          id: keyId,
          name: keyId.charAt(0).toUpperCase() + keyId.slice(1).replace(/-/g, " "),
          category: "unknown",
          status: "connected",
        })
      }
    }
    return list
  }, [providers, apiKeys])

  const statusDot = (status: string) => {
    if (status === "connected")
      return <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
    return <span className="h-1.5 w-1.5 rounded-full bg-white/[0.25]" />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5",
            "text-[11px] font-medium text-white/[0.65] transition-all duration-150",
            "hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white active:scale-[0.97]"
          )}
        >
          <Plug className="h-3 w-3" style={{ color: accentColor }} />
          <span>Connectors</span>
          {connectedConnectors.length > 0 && (
            <span
              className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
              style={{ backgroundColor: accentColor, color: "#0F1117" }}
            >
              {connectedConnectors.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 text-white/[0.40] transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-[260px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-2 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.40]">
            Connectors
          </span>
          <span className="text-[9px] text-white/[0.30]">
            {connectedConnectors.length} connected
          </span>
        </div>

        {connectedConnectors.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-[12px] text-white/[0.40]">No connectors connected</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/connectors")
              }}
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5",
                "text-[11px] font-medium text-white transition-all duration-150",
                "hover:bg-white/[0.08]"
              )}
            >
              <Plug className="h-3 w-3" />
              Go to Connectors
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
              {connectedConnectors.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                >
                  {statusDot(c.status)}
                  <span className="text-[12px] font-medium text-white">{c.name}</span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider text-[#34D399]">
                    live
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/connectors")
              }}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2",
                "text-[11px] font-medium text-white transition-all duration-150",
                "hover:bg-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]"
              )}
            >
              <Plug className="h-3 w-3" />
              Manage connectors
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  SettingsPopover — web search, quick nav links                      */
/* ------------------------------------------------------------------ */

function SettingsPopover({
  agent,
  accentColor,
}: {
  agent: AgentDef
  accentColor: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [webSearch, setWebSearch] = React.useState(() => {
    try { return localStorage.getItem("fo-web-search") === "true" } catch { return true }
  })

  const toggleWebSearch = () => {
    const next = !webSearch
    setWebSearch(next)
    try { localStorage.setItem("fo-web-search", String(next)) } catch { /* noop */ }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Settings"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]",
            "text-white/[0.40] transition-all duration-150",
            "hover:bg-white/[0.06] hover:text-white/[0.6] active:scale-[0.97]",
            open && "bg-white/[0.06] text-white/[0.7]"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-[260px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-3 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.40]">
            Settings
          </span>
          <span className="text-[9px] font-medium" style={{ color: accentColor }}>
            {agent.shortLabel}
          </span>
        </div>

        {/* Web search toggle */}
        <button
          type="button"
          onClick={toggleWebSearch}
          className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-white/[0.45]" />
              <span className="text-[12px] font-medium text-white">Web search</span>
            </div>
            <div className="text-[10px] text-white/[0.35]">Let the agent search the web for current data</div>
          </div>
          <span
            className={cn(
              "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
              webSearch ? "bg-white/[0.20]" : "bg-white/[0.08]"
            )}
            style={webSearch ? { backgroundColor: accentColor } : undefined}
          >
            <span
              className={cn(
                "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-150",
                webSearch ? "translate-x-3.5" : "translate-x-0.5"
              )}
            />
          </span>
        </button>

        <div className="h-px bg-white/[0.06] my-1.5" />

        <button
          type="button"
          onClick={() => { setOpen(false); router.push(`/agent/${agent.id}/settings`) }}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
        >
          <span className="text-[12px] font-medium text-white">Agent settings</span>
          <span className="text-[10px] text-white/[0.35]">Constraints, learning, model</span>
          <ExternalLink className="ml-auto h-3 w-3 text-white/[0.25]" />
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); router.push("/connectors") }}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
        >
          <span className="text-[12px] font-medium text-white">Connectors</span>
          <span className="text-[10px] text-white/[0.35]">Data sources & API keys</span>
          <ExternalLink className="ml-auto h-3 w-3 text-white/[0.25]" />
        </button>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  ChatComposer                                                       */
/* ------------------------------------------------------------------ */

interface ChatComposerProps {
  agent: AgentDef
  activeSkills: Set<string>
  onToggleSkill: (id: string) => void
  onSend: (text: string) => void
  disabled?: boolean
  /** When the agent is thinking, show a stop button instead of send */
  isThinking?: boolean
  onStop?: () => void
  /** Whether a model is connected — if false, shows error on submit */
  modelConnected?: boolean
}

export function ChatComposer({
  agent,
  activeSkills,
  onToggleSkill,
  onSend,
  disabled = false,
  isThinking = false,
  onStop,
  modelConnected = true,
}: ChatComposerProps) {
  const [value, setValue] = React.useState("")
  const [showModelError, setShowModelError] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null)

  // Auto-resize the textarea
  React.useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  // Cleanup speech recognition on unmount
  React.useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort() } catch { /* already stopped */ }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return

    if (!modelConnected) {
      setShowModelError(true)
      setTimeout(() => setShowModelError(false), 4000)
      return
    }

    onSend(trimmed)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SpeechRecognitionCtor =
      win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setValue((prev) => {
        const sep = prev ? " " : ""
        return prev + sep + transcript
      })
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <div className="relative px-6 pb-5 pt-2">
      {/* Ambient glow under composer */}
      <div
        className="pointer-events-none absolute inset-x-6 -bottom-2 h-12 opacity-[0.10] blur-xl"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${agent.color} 0%, transparent 70%)`,
        }}
      />

      <AnimatePresence>
        {showModelError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 flex items-center gap-2 rounded-lg border border-[#F87171]/30 bg-[#F87171]/8 px-3 py-2"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#F87171]" />
            <span className="text-[11px] text-[#FCA5A5]">
              No AI model connected. Please select a model in the header or{" "}
              <button
                type="button"
                onClick={() => window.location.href = `/agent/${agent.id}/settings`}
                className="underline hover:text-[#F87171] transition-colors"
              >
                agent settings
              </button>
              .
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-2.5"
        style={{
          boxShadow: isThinking
            ? `0 0 0 1px rgba(${agent.colorRgb}, 0.15), 0 8px 32px rgba(${agent.colorRgb}, 0.06)`
            : undefined,
        }}
      >
        {/* Top row: skills + connectors + settings */}
        <div className="mb-2 flex items-center gap-2">
          <SkillsMenu
            activeSkills={activeSkills}
            onToggle={onToggleSkill}
            accentColor={agent.color}
          />
          <ConnectorsButton accentColor={agent.color} />
          <SettingsPopover agent={agent} accentColor={agent.color} />
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white/[0.25]">
            <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono">
              ↵
            </kbd>
            <span>to send</span>
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agent.placeholder}
            aria-label={`Message ${agent.shortLabel}`}
            className={cn(
              "flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-white",
              "placeholder:text-white/[0.25] outline-none border-none py-1.5 px-1"
            )}
          />

          {/* Voice input button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150",
              "active:scale-[0.95]",
              isListening
                ? "border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171]"
                : "border-white/[0.08] bg-white/[0.03] text-white/[0.40] hover:bg-white/[0.06] hover:text-white/[0.6]"
            )}
          >
            {isListening ? (
              <Mic className="h-4 w-4 animate-pulse" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {isThinking ? (
              <motion.button
                key="stop"
                type="button"
                onClick={onStop}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  "border border-white/[0.10] bg-white/[0.04] text-white/[0.55]",
                  "transition-all duration-150 hover:bg-white/[0.08] hover:text-white active:scale-[0.95]"
                )}
                aria-label="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                type="submit"
                disabled={!value.trim()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
                  "active:scale-[0.95]",
                  value.trim()
                    ? "text-[#0F1117]"
                    : "border border-white/[0.08] bg-white/[0.03] text-white/[0.25] cursor-not-allowed"
                )}
                style={
                  value.trim()
                    ? {
                        backgroundColor: agent.color,
                        boxShadow: `0 0 16px rgba(${agent.colorRgb}, 0.4)`,
                      }
                    : undefined
                }
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  )
}
