"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  Hash,
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
        <div className="text-[10px] text-white/[0.30] px-2 mb-1.5">
          Type <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[9px]">/</kbd> in the chat to quick-add skills
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
/*  ConnectorsButton — reads from localStorage after mount             */
/* ------------------------------------------------------------------ */

interface RealConnector {
  id: string
  name: string
  category: string
}

function ConnectorsButton({ accentColor }: { accentColor: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [connectedConnectors, setConnectedConnectors] = React.useState<RealConnector[]>([])

  // Read from localStorage after mount — avoids SSR staleness
  React.useEffect(() => {
    const providers = safeGetJSON<Record<string, string>>("fo-connected-providers", {})
    const apiKeys = safeGetJSON<Record<string, string>>("fo-api-keys", {})
    const list: RealConnector[] = []
    for (const [category, providerId] of Object.entries(providers)) {
      if (providerId) {
        list.push({
          id: providerId,
          name: providerId.charAt(0).toUpperCase() + providerId.slice(1).replace(/-/g, " "),
          category,
        })
      }
    }
    for (const keyId of Object.keys(apiKeys)) {
      if (!list.some((c) => c.id === keyId) && apiKeys[keyId]) {
        list.push({
          id: keyId,
          name: keyId.charAt(0).toUpperCase() + keyId.slice(1).replace(/-/g, " "),
          category: "unknown",
        })
      }
    }
    setConnectedConnectors(list)
  }, [])

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
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shrink-0" />
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
  const [webSearch, setWebSearch] = React.useState(true)

  // Read from localStorage after mount
  React.useEffect(() => {
    try {
      const val = localStorage.getItem("fo-web-search")
      if (val !== null) setWebSearch(val === "true")
    } catch { /* use default */ }
  }, [])

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
/*  SlashCommandPicker — /skill-name autocomplete                      */
/* ------------------------------------------------------------------ */

function SlashCommandPicker({
  query,
  onSelect,
  accentColor,
  onClose,
}: {
  query: string
  onSelect: (skillId: string) => void
  accentColor: string
  onClose: () => void
}) {
  const filtered = query
    ? availableSkills.filter(
        (s) =>
          s.id.toLowerCase().includes(query.toLowerCase()) ||
          s.label.toLowerCase().includes(query.toLowerCase())
      )
    : availableSkills

  if (filtered.length === 0 && query.length > 0) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-[300px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="h-3 w-3 text-white/[0.35]" />
          <span className="text-[11px] text-white/[0.40]">No skills match &quot;{query}&quot;</span>
        </div>
        <p className="text-[10px] text-white/[0.25]">Type a skill ID like /search_web or /rebalance_recommend</p>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 w-[300px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-1.5 shadow-2xl backdrop-blur-xl z-50">
      <div className="mb-1 flex items-center justify-between px-2 pt-1">
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.40]">
          {query ? `Skills matching "${query}"` : "Skills"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[9px] text-white/[0.30] hover:text-white/60 transition-colors"
        >
          esc to close
        </button>
      </div>
      {filtered.slice(0, 8).map((skill) => (
        <button
          key={skill.id}
          type="button"
          onClick={() => onSelect(skill.id)}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
        >
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-mono font-bold"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            /
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-white">{skill.label}</span>
              <code className="text-[9px] text-white/[0.30] font-mono">/{skill.id}</code>
            </div>
            <div className="text-[10px] text-white/[0.40] truncate">{skill.description}</div>
          </div>
        </button>
      ))}
    </div>
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
  isThinking?: boolean
  onStop?: () => void
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
  const [slashQuery, setSlashQuery] = React.useState<string | null>(null)
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

  // Detect slash command typing
  const detectSlash = React.useCallback((text: string) => {
    // Look for the last `/` that starts a word
    const cursorPos = inputRef.current?.selectionStart ?? text.length
    const textBeforeCursor = text.slice(0, cursorPos)
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/")

    if (lastSlashIdx === -1) {
      setSlashQuery(null)
      return
    }

    // Check if the `/` is at a word boundary (start of text, after space, or after newline)
    const charBefore = lastSlashIdx > 0 ? textBeforeCursor[lastSlashIdx - 1] : " "
    if (charBefore !== " " && charBefore !== "\n") {
      setSlashQuery(null)
      return
    }

    // Get the text after `/` up to the cursor
    const query = textBeforeCursor.slice(lastSlashIdx + 1)
    // Only trigger if query doesn't contain spaces (it's a single word)
    if (query.includes(" ")) {
      setSlashQuery(null)
      return
    }

    setSlashQuery(query)
  }, [])

  const handleSelectSkill = (skillId: string) => {
    // Replace the `/query` with `/skillId ` in the textarea
    const cursorPos = inputRef.current?.selectionStart ?? value.length
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/")

    if (lastSlashIdx !== -1) {
      const before = value.slice(0, lastSlashIdx)
      const after = textAfterCursor
      const newValue = before ? `${before} /${skillId} ${after}`.trimStart() : `/${skillId} ${after}`.trimStart()
      setValue(newValue)
    }

    setSlashQuery(null)
    inputRef.current?.focus()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    detectSlash(newValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return

    if (!modelConnected) {
      setShowModelError(true)
      setTimeout(() => setShowModelError(false), 4000)
      return
    }

    setSlashQuery(null)
    onSend(trimmed)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Close slash picker on Escape
    if (e.key === "Escape" && slashQuery !== null) {
      e.preventDefault()
      setSlashQuery(null)
      return
    }

    if (e.key === "Enter" && !e.shiftKey) {
      // If slash picker is open, select first match or close — never submit
      if (slashQuery !== null) {
        e.preventDefault()
        if (slashQuery.length > 0) {
          const filtered = availableSkills.filter(
            (s) =>
              s.id.toLowerCase().includes(slashQuery.toLowerCase()) ||
              s.label.toLowerCase().includes(slashQuery.toLowerCase())
          )
          if (filtered.length >= 1) {
            handleSelectSkill(filtered[0].id)
            return
          }
        }
        // No matches — just close the picker
        setSlashQuery(null)
        return
      }
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
              /
            </kbd>
            <span>skills</span>
            <span className="text-white/[0.15]">·</span>
            <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono">
              ↵
            </kbd>
            <span>send</span>
          </div>
        </div>

        {/* Input row */}
        <div className="relative flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={agent.placeholder}
            aria-label={`Message ${agent.shortLabel}`}
            className={cn(
              "flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-white",
              "placeholder:text-white/[0.25] outline-none border-none py-1.5 px-1"
            )}
          />

          {/* Slash command picker */}
          <AnimatePresence>
            {slashQuery !== null && (
              <SlashCommandPicker
                query={slashQuery}
                onSelect={handleSelectSkill}
                accentColor={agent.color}
                onClose={() => setSlashQuery(null)}
              />
            )}
          </AnimatePresence>

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

/* ================================================================== */
/*  Custom Popover — avoids Radix dep for simpler use cases            */
/* ================================================================== */

const PopoverContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | null>(null)

function Popover({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const ctx = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onOpenChange])

  return (
    <PopoverContext.Provider value={ctx}>
      <div ref={ref} className="relative inline-flex">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const ctx = React.useContext(PopoverContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    ctx?.onOpenChange(!ctx.open)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        if (!e.defaultPrevented) handleClick(e)
      },
    })
  }
  return <span onClick={handleClick}>{children}</span>
}

function PopoverContent({
  align = "start",
  sideOffset = 6,
  className,
  children,
}: {
  align?: "start" | "end" | "center"
  sideOffset?: number
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(PopoverContext)
  if (!ctx?.open) return null
  return (
    <div
      className={cn(
        "absolute z-50",
        align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
        className,
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  )
}
