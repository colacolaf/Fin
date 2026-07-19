"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  Hash,
  User,
  Bot,
  Pencil,
  Check,
  RotateCcw,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import {
  getChatHistory,
  getSystemPromptFiles,
  buildUserContextFile,
  saveSystemPrompt,
  revertSystemPrompt,
  saveUserContextProfile,
  ORIGINAL_PROMPTS,
  agentMeta,
  type ChatSession,
  type MemoryFile,
} from "@/lib/memory/data"

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

type TreeItem =
  | { kind: "chat"; session: ChatSession }
  | { kind: "file"; file: MemoryFile }

type SectionId = "chats-portfolio" | "chats-debt" | "chats-retirement" | "context" | "prompts"

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function sessionDuration(session: ChatSession): string {
  const first = new Date(session.createdAt).getTime()
  const last = new Date(session.updatedAt).getTime()
  const mins = Math.round((last - first) / 60000)
  return mins < 1 ? "< 1 min" : `${mins} min`
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#818CF8]/20 text-[#818CF8] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ================================================================== */
/*  FolderTreeSection — collapsible section in the sidebar              */
/* ================================================================== */

function FolderTreeSection({
  id,
  label,
  count,
  icon,
  expanded,
  onToggle,
  children,
}: {
  id: SectionId
  label: string
  count: number
  icon: React.ReactNode
  expanded: boolean
  onToggle: (id: SectionId) => void
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium transition-colors",
          "text-white/[0.60] hover:bg-white/[0.04] hover:text-white/[0.80]"
        )}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-white/[0.30]" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-white/[0.30]" />
        )}
        {icon}
        <span className="flex-1 truncate">{label}</span>
        <span className="tabular-nums text-[10px] text-white/[0.25]">{count}</span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-3 border-l border-white/[0.06] pl-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================================================================== */
/*  TreeItem — a single clickable row in the folder tree                */
/* ================================================================== */

function TreeItemRow({
  item,
  selected,
  query,
  onSelect,
}: {
  item: TreeItem
  selected: boolean
  query: string
  onSelect: (item: TreeItem) => void
}) {
  const isChat = item.kind === "chat"
  const agent = isChat ? agentMeta[item.session.agent] : null
  const label = isChat ? `${item.session.category} · ${formatDate(item.session.createdAt)}` : item.file.label

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-all duration-100",
        selected
          ? "bg-[#818CF8]/10 text-white border border-[#818CF8]/20"
          : "text-white/[0.45] hover:bg-white/[0.03] hover:text-white/[0.70] border border-transparent"
      )}
    >
      {isChat ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: agent?.color }} />
      ) : (
        <FileText className="h-3 w-3 shrink-0 text-white/[0.25]" />
      )}
      <span className="truncate">{highlightMatch(label, query)}</span>
    </button>
  )
}

/* ================================================================== */
/*  ChatViewer — renders a chat transcript                              */
/* ================================================================== */

function ChatViewer({ session }: { session: ChatSession }) {
  const agent = agentMeta[session.agent]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold"
          style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}30` }}
        >
          {agent.abbreviation}
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-white">{agent.label}</h3>
          <p className="text-[10px] text-white/[0.35]">
            {session.category} · {formatDate(session.createdAt)} · {session.messages.length} messages · {sessionDuration(session)}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {session.messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold mt-0.5"
                style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
              >
                <Bot className="h-3 w-3" style={{ color: agent.color }} />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                msg.role === "user"
                  ? "bg-[#818CF8]/10 border border-[#818CF8]/15 text-white/[0.85]"
                  : "bg-white/[0.03] border border-white/[0.06] text-white/[0.70]"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-[9px] text-white/[0.20]">{formatTime(msg.timestamp)}</p>
            </div>
            {msg.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] border border-white/[0.08] mt-0.5">
                <User className="h-3 w-3 text-white/[0.40]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  FileViewer — renders context or system prompt with edit mode         */
/* ================================================================== */

function FileViewer({ file, onFileChanged }: { file: MemoryFile; onFileChanged: () => void }) {
  const isContext = file.type === "context"
  const isSystemPrompt = file.type === "system-prompt"
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(file.content)
  const [saved, setSaved] = React.useState(false)
  const agent = file.agent ? agentMeta[file.agent] : null
  const hasOriginal = isSystemPrompt && !!ORIGINAL_PROMPTS[file.id]
  const isModified = isSystemPrompt && ORIGINAL_PROMPTS[file.id] && file.content !== ORIGINAL_PROMPTS[file.id]

  const handleSave = () => {
    if (isSystemPrompt) {
      saveSystemPrompt(file.id, draft)
    } else if (isContext) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.user_profile) {
          saveUserContextProfile(parsed.user_profile)
        }
      } catch {
        // If JSON is invalid, save raw content
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setEditing(false)
    onFileChanged()
  }

  const handleRevert = () => {
    if (isSystemPrompt) {
      revertSystemPrompt(file.id)
      setDraft(ORIGINAL_PROMPTS[file.id] ?? "")
      setEditing(false)
      onFileChanged()
    }
  }

  const handleCancel = () => {
    setDraft(file.content)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
            {isContext ? (
              <FileText className="h-4 w-4 text-[#818CF8]" />
            ) : (
              <Settings className="h-4 w-4 text-white/[0.40]" />
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white">{file.label}</h3>
            <p className="text-[10px] text-white/[0.35]">
              {file.name}
              {isContext && " · Auto-generated from app state"}
              {isSystemPrompt && (isModified ? " · Edited" : " · Original")}
              {agent ? ` · ${agent.label}` : ""}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!editing ? (
          <button
            type="button"
            onClick={() => { setDraft(file.content); setEditing(true) }}
            className="flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-medium text-white/[0.55] transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {hasOriginal && (
              <button
                type="button"
                onClick={handleRevert}
                className="flex h-7 items-center gap-1 rounded-md border border-[#FBBF24]/20 bg-[#FBBF24]/8 px-2.5 text-[11px] font-medium text-[#FBBF24] transition-all hover:bg-[#FBBF24]/12 active:scale-[0.97]"
                title="Revert to original"
              >
                <RotateCcw className="h-3 w-3" />
                Revert
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-7 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[11px] font-medium text-white/[0.45] transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition-all active:scale-[0.97]",
                saved
                  ? "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]"
                  : "border-[#818CF8]/30 bg-[#818CF8]/10 text-[#818CF8] hover:bg-[#818CF8]/15"
              )}
            >
              {saved ? <Check className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[400px] w-full rounded-xl border border-[#818CF8]/20 bg-white/[0.02] p-4 font-mono text-[11px] leading-relaxed text-white/[0.80] outline-none resize-y placeholder:text-white/[0.20]"
          spellCheck={false}
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-white/[0.60]">
            {file.content}
          </pre>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  EmptyState                                                          */
/* ================================================================== */

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <Search className="h-5 w-5 text-white/[0.25]" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-white/[0.50]">
          {query ? "No results found" : "Select a file to view"}
        </p>
        <p className="text-[11px] text-white/[0.30]">
          {query ? "Try a different search term." : "Browse the folder tree or search above."}
        </p>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  MemoryPage — Two-panel File Browser, all data from localStorage      */
/* ================================================================== */

export function MemoryPage() {
  const [query, setQuery] = React.useState("")
  const [fileVersion, setFileVersion] = React.useState(0) // bump to re-read files
  const [expanded, setExpanded] = React.useState<Record<SectionId, boolean>>({
    "chats-portfolio": true,
    "chats-debt": true,
    "chats-retirement": true,
    context: true,
    prompts: true,
  })
  const [selected, setSelected] = React.useState<TreeItem | null>(null)

  const toggleSection = React.useCallback((id: SectionId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // Read all data from localStorage (re-reads when fileVersion changes)
  const chatSessions = React.useMemo(() => getChatHistory(), [fileVersion])
  const systemPromptFiles = React.useMemo(() => getSystemPromptFiles(), [fileVersion])
  const userContextFile = React.useMemo(() => buildUserContextFile(), [fileVersion])

  const allMemoryFiles: MemoryFile[] = React.useMemo(
    () => [userContextFile, ...systemPromptFiles],
    [userContextFile, systemPromptFiles]
  )

  const q = query.toLowerCase().trim()

  const portfolioChats = React.useMemo(
    () => chatSessions.filter((s) => s.agent === "portfolio" && (!q || s.category.toLowerCase().includes(q) || s.messages.some((m) => m.content.toLowerCase().includes(q)))),
    [chatSessions, q]
  )
  const debtChats = React.useMemo(
    () => chatSessions.filter((s) => s.agent === "debt" && (!q || s.category.toLowerCase().includes(q) || s.messages.some((m) => m.content.toLowerCase().includes(q)))),
    [chatSessions, q]
  )
  const retirementChats = React.useMemo(
    () => chatSessions.filter((s) => s.agent === "retirement" && (!q || s.category.toLowerCase().includes(q) || s.messages.some((m) => m.content.toLowerCase().includes(q)))),
    [chatSessions, q]
  )
  const contextFiles = React.useMemo(
    () => allMemoryFiles.filter((f) => f.type === "context" && (!q || f.label.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))),
    [allMemoryFiles, q]
  )
  const promptFiles = React.useMemo(
    () => allMemoryFiles.filter((f) => f.type === "system-prompt" && (!q || f.label.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))),
    [allMemoryFiles, q]
  )

  const totalResults = portfolioChats.length + debtChats.length + retirementChats.length + contextFiles.length + promptFiles.length

  // Callback for when a file is edited/saved/reverted
  const handleFileChanged = React.useCallback(() => {
    setFileVersion((v) => v + 1)
    // Refresh selected item
    setSelected((prev) => {
      if (!prev || prev.kind !== "file") return prev
      if (prev.file.type === "context") {
        return { kind: "file" as const, file: buildUserContextFile() }
      }
      const files = getSystemPromptFiles()
      const refreshed = files.find((f) => f.id === prev.file.id)
      if (refreshed) return { kind: "file" as const, file: refreshed }
      return prev
    })
  }, [])

  return (
    <PageShell
      title="Memory"
      subtitle="Search chats, context files, and system prompts"
    >
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.30]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats, context, prompts…"
          aria-label="Search memory"
          className={cn(
            "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
            "pl-10 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors",
            "placeholder:text-white/[0.25] focus:border-[#818CF8]/30"
          )}
        />
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Left panel: folder tree */}
        <div className="w-[260px] shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-3 overflow-y-auto">
          <div className="mb-3 flex items-center gap-2 px-2 text-[10px] text-white/[0.25]">
            <Hash className="h-3 w-3" />
            <span>{chatSessions.length} chats · {allMemoryFiles.length} files</span>
          </div>

          <FolderTreeSection
            id="chats-portfolio"
            label="Portfolio"
            count={portfolioChats.length}
            icon={<span className="h-2 w-2 rounded-full bg-[#818CF8]" />}
            expanded={expanded["chats-portfolio"]}
            onToggle={toggleSection}
          >
            {portfolioChats.map((s) => (
              <TreeItemRow key={s.id} item={{ kind: "chat", session: s }} selected={selected?.kind === "chat" && selected.session.id === s.id} query={query} onSelect={setSelected} />
            ))}
          </FolderTreeSection>

          <FolderTreeSection
            id="chats-debt"
            label="Debt"
            count={debtChats.length}
            icon={<span className="h-2 w-2 rounded-full bg-[#FBBF24]" />}
            expanded={expanded["chats-debt"]}
            onToggle={toggleSection}
          >
            {debtChats.map((s) => (
              <TreeItemRow key={s.id} item={{ kind: "chat", session: s }} selected={selected?.kind === "chat" && selected.session.id === s.id} query={query} onSelect={setSelected} />
            ))}
          </FolderTreeSection>

          <FolderTreeSection
            id="chats-retirement"
            label="Retirement"
            count={retirementChats.length}
            icon={<span className="h-2 w-2 rounded-full bg-[#34D399]" />}
            expanded={expanded["chats-retirement"]}
            onToggle={toggleSection}
          >
            {retirementChats.map((s) => (
              <TreeItemRow key={s.id} item={{ kind: "chat", session: s }} selected={selected?.kind === "chat" && selected.session.id === s.id} query={query} onSelect={setSelected} />
            ))}
          </FolderTreeSection>

          <div className="my-2 border-t border-white/[0.04]" />

          <FolderTreeSection
            id="context"
            label="Context"
            count={contextFiles.length}
            icon={<FileText className="h-3 w-3 text-white/[0.30]" />}
            expanded={expanded.context}
            onToggle={toggleSection}
          >
            {contextFiles.map((f) => (
              <TreeItemRow key={f.id} item={{ kind: "file", file: f }} selected={selected?.kind === "file" && selected.file.id === f.id} query={query} onSelect={setSelected} />
            ))}
          </FolderTreeSection>

          <FolderTreeSection
            id="prompts"
            label="System Prompts"
            count={promptFiles.length}
            icon={<Settings className="h-3 w-3 text-white/[0.30]" />}
            expanded={expanded.prompts}
            onToggle={toggleSection}
          >
            {promptFiles.map((f) => (
              <TreeItemRow key={f.id} item={{ kind: "file", file: f }} selected={selected?.kind === "file" && selected.file.id === f.id} query={query} onSelect={setSelected} />
            ))}
          </FolderTreeSection>

          {q && (
            <div className="mt-3 px-2 text-[10px] text-white/[0.25]">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Right panel: content viewer */}
        <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.kind === "chat" ? selected.session.id : selected.file.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              >
                {selected.kind === "chat" ? (
                  <ChatViewer session={selected.session} />
                ) : (
                  <FileViewer file={selected.file} onFileChanged={handleFileChanged} />
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState query={query} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  )
}
