"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Check,
  Cpu,
  Mic,
  MicOff,
  Plug,
  Search,
  Plus,
  Trash2,
  Lock,
  BookOpen,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell, SectionCard, SettingRow } from "@/components/page-shell/page-shell"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useLocalStorage } from "@/lib/use-local-storage"
import {
  getAgent,
  availableModels,
  type ModelOption,
  type AgentDef,
  type AgentId,
} from "@/lib/agents"
import {
  getAgentConfig,
  saveAgentConfig,
  getAgentConstraints,
  saveAgentConstraints,
  getAgentLearning,
  saveAgentLearning,
  getAgentModel,
  saveAgentModel,
  RECOMMENDED_CONSTRAINTS,
  RECOMMENDED_LEARNING,
  type AgentConfigState,
  type AgentConstraint,
} from "@/lib/agent-settings/data"

/* ================================================================== */
/*  Model section                                                      */
/* ================================================================== */

function ModelSection({
  agent,
  modelId,
  onModelChange,
  voiceInput,
  onVoiceInputChange,
  temp,
  onTempChange,
}: {
  agent: AgentDef
  modelId: string | null
  onModelChange: (id: string) => void
  voiceInput: boolean
  onVoiceInputChange: (v: boolean) => void
  temp: number
  onTempChange: (v: number) => void
}) {
  const [listening, setListening] = React.useState(false)
  const hasModel = !!modelId

  const testMic = () => {
    if (!voiceInput) return
    setListening(true)
    setTimeout(() => setListening(false), 2500)
  }

  return (
    <SectionCard
      label="AI Model"
      description={hasModel ? `Connected to ${modelId}. This model powers the agent's reasoning.` : "No model connected. Select one below to enable this agent."}
    >
      {/* Connection status */}
      {hasModel ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#34D399]/20 bg-[#34D399]/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" />
          <span className="text-[11px] font-medium text-[#34D399]">Connected</span>
          <span className="text-[11px] text-white/[0.40]">· {modelId}</span>
        </div>
      ) : (
        <div className="mb-3 rounded-lg border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-2">
          <p className="text-[11px] font-medium text-[#FBBF24]">No model selected</p>
          <p className="text-[10px] text-white/[0.40] mt-0.5">
            Choose a model below. API keys can be configured in{" "}
            <a href="/settings" className="text-[#818CF8] hover:underline">Settings</a>.
          </p>
        </div>
      )}

      {/* Model selection */}
      <div className="space-y-1">
        {availableModels.map((m) => {
          const isActive = m.id === modelId
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModelChange(m.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100",
                isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <Cpu className="h-4 w-4 text-white/[0.55]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-white">{m.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" style={{ color: agent.color }} />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">{m.vendor}</span>
                  <span className="text-[9px] text-white/[0.25]">·</span>
                  <span className="text-[11px] text-white/[0.40]">{m.description}</span>
                </div>
              </div>
              {/* Setup link per vendor */}
              <a
                href={m.vendor === "OpenAI" ? "https://platform.openai.com/api-keys" : m.vendor === "Anthropic" ? "https://console.anthropic.com" : "https://ollama.com"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-[9px] text-[#818CF8] hover:underline flex items-center gap-1"
              >
                Setup <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </button>
          )
        })}
      </div>

      {/* Voice Input + Temperature */}
      <div className="mt-4 divide-y divide-white/[0.04] border-t border-white/[0.04]">
        <SettingRow
          label="Voice Input"
          description="Speak your messages instead of typing. Uses your browser's speech recognition."
          accentColor={agent.color}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVoiceInputChange(!voiceInput)}
              aria-pressed={voiceInput}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95",
                voiceInput
                  ? "border-white/[0.12] bg-white/[0.06] text-white"
                  : "border-white/[0.08] bg-white/[0.03] text-white/[0.55] hover:bg-white/[0.06]"
              )}
              style={
                voiceInput
                  ? { borderColor: `rgba(${agent.colorRgb}, 0.30)`, backgroundColor: `rgba(${agent.colorRgb}, 0.10)`, color: agent.color }
                  : undefined
              }
            >
              {voiceInput ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              {voiceInput ? "On" : "Off"}
            </button>
            {voiceInput && (
              <button
                type="button"
                onClick={testMic}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95",
                  listening ? "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]" : "border-white/[0.08] bg-white/[0.03] text-white/[0.50] hover:bg-white/[0.06]"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", listening ? "bg-[#FBBF24] animate-pulse" : "bg-white/[0.40]")} />
                {listening ? "Listening…" : "Test mic"}
              </button>
            )}
          </div>
        </SettingRow>

        <div className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
              <div>
                <div className="text-[13px] font-medium text-white">Temperature</div>
                <div className="mt-0.5 text-[11px] text-white/[0.35]">
                  Lower = more precise, higher = more creative. Fed to the model on every request.
                </div>
              </div>
            </div>
            <span className="font-mono text-[14px] tabular-nums" style={{ color: agent.color }}>{temp.toFixed(1)}</span>
          </div>
          <Slider min={0} max={1} step={0.1} value={[temp]} onValueChange={(v) => onTempChange(Array.isArray(v) ? v[0] : v)} />
          <div className="mt-2 flex justify-between text-[10px] text-white/[0.25]">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Behavior section                                                   */
/* ================================================================== */

function BehaviorSection({
  agent,
  state,
  onChange,
}: {
  agent: AgentDef
  state: AgentConfigState
  onChange: (s: AgentConfigState) => void
}) {
  return (
    <SectionCard label="Behavior" description="Control how this agent responds and acts. Changes are sent with every request.">
      <div className="divide-y divide-white/[0.04]">
        <SettingRow label="Stream thinking" description="Show F.I.R.M. reasoning steps live while the agent thinks." accentColor={agent.color}>
          <Switch checked={state.streamThinking} onCheckedChange={(v) => onChange({ ...state, streamThinking: v })} />
        </SettingRow>
        <SettingRow label="Citations" description="Cite sources in replies when web research is used." accentColor={agent.color}>
          <Switch checked={state.citations} onCheckedChange={(v) => onChange({ ...state, citations: v })} />
        </SettingRow>
        <SettingRow label="Auto-execute" description="Run approved actions without re-confirming. Dangerous." accentColor="#F87171">
          <Switch checked={state.autoExecute} onCheckedChange={(v) => onChange({ ...state, autoExecute: v })} />
        </SettingRow>
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Connector Access section                                           */
/* ================================================================== */

function ConnectorAccessSection() {
  const [providers] = useLocalStorage<Record<string, string>>("fo-connected-providers", {})
  const [apiKeys] = useLocalStorage<Record<string, string>>("fo-api-keys", {})

  // Build connected list directly from localStorage — no catalog, no defaults
  const connectedIds = new Set<string>()
  for (const v of Object.values(providers)) connectedIds.add(v)
  for (const k of Object.keys(apiKeys)) connectedIds.add(k)
  const connectedList = Array.from(connectedIds)

  return (
    <SectionCard label="Connector Access" description="Which connected data sources this agent can read.">
      {connectedList.length === 0 ? (
        <div className="flex flex-col items-start gap-2 py-2">
          <p className="text-[11px] text-white/[0.30]">
            No connectors connected. Link your financial accounts to grant this agent data access.
          </p>
          <a
            href="/connectors"
            className="flex items-center gap-1.5 rounded-md border border-[#818CF8]/30 bg-[#818CF8]/10 px-3 py-1.5 text-[11px] font-medium text-[#818CF8] transition-all hover:bg-[#818CF8]/15 active:scale-[0.97]"
          >
            <Plug className="h-3 w-3" />
            Go to Connectors
          </a>
        </div>
      ) : (
        <div className="space-y-1">
          {connectedList.map((id) => (
            <div key={id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.02]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white bg-white/[0.06] border border-white/[0.10]">
                {id.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-white capitalize">{id.replace(/-/g, " ")}</span>
                  {apiKeys[id] ? (
                    <span className="rounded-full bg-[#34D399]/10 border border-[#34D399]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#34D399]">Key set</span>
                  ) : (
                    <span className="rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#FBBF24]">No key</span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">Connected</span>
              </div>
              <span className="text-[10px] text-[#34D399]">Connected</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

/* ================================================================== */
/*  Constraints section — searchable, recommended + custom              */
/* ================================================================== */

function ConstraintsSection({ agentId, constraints, onChange }: { agentId: AgentId; constraints: AgentConstraint[]; onChange: (c: AgentConstraint[]) => void }) {
  const [search, setSearch] = React.useState("")
  const [customInput, setCustomInput] = React.useState("")
  const [showRecommended, setShowRecommended] = React.useState(false)

  const enabledIds = new Set(constraints.filter((c) => c.enabled).map((c) => c.id))
  const recommended = RECOMMENDED_CONSTRAINTS[agentId]
  const q = search.toLowerCase().trim()

  // Filter recommended constraints by search
  const filteredRecommended = q
    ? recommended.filter((r) => r.text.toLowerCase().includes(q))
    : recommended

  const addCustom = () => {
    const text = customInput.trim()
    if (!text) return
    onChange([...constraints, { id: `custom-${Date.now()}`, text, enabled: true, custom: true }])
    setCustomInput("")
  }

  const toggleConstraint = (id: string) => {
    const existing = constraints.find((c) => c.id === id)
    if (existing) {
      onChange(constraints.map((c) => c.id === id ? { ...c, enabled: !c.enabled } : c))
    } else {
      const rec = recommended.find((r) => r.id === id)
      if (rec) onChange([...constraints, { ...rec, enabled: true, custom: false }])
    }
  }

  const removeConstraint = (id: string) => {
    onChange(constraints.filter((c) => c.id !== id))
  }

  const enabledCount = constraints.filter((c) => c.enabled).length

  return (
    <SectionCard label="Agent Constraints" description={`${enabledCount} active constraint${enabledCount !== 1 ? "s" : ""}. These rules are sent with every request to guide the agent.`}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.25]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search constraints or add custom…"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-9 pr-3 py-2 text-[12px] text-white outline-none placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
        />
      </div>

      {/* Active constraints */}
      {constraints.filter((c) => c.enabled).length > 0 && (
        <div className="space-y-1 mb-3">
          {constraints.filter((c) => c.enabled).map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 group">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]" />
              <span className="flex-1 text-[12px] leading-relaxed text-white/[0.70]">{c.text}</span>
              <button type="button" onClick={() => removeConstraint(c.id)} className="shrink-0 rounded p-0.5 text-white/[0.25] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recommended constraints (collapsible) */}
      <button type="button" onClick={() => setShowRecommended((v) => !v)} className="flex items-center gap-1.5 text-[11px] font-medium text-[#818CF8] hover:underline mb-2">
        {showRecommended ? "Hide" : "Show"} recommended constraints
      </button>

      <AnimatePresence>
        {showRecommended && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-1 mb-3">
              {filteredRecommended.map((r) => {
                const isEnabled = enabledIds.has(r.id)
                return (
                  <button key={r.id} type="button" onClick={() => toggleConstraint(r.id)} className={cn("flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors", isEnabled ? "border-[#818CF8]/20 bg-[#818CF8]/5" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03]")}>
                    <span className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border flex items-center justify-center transition-colors", isEnabled ? "border-[#818CF8] bg-[#818CF8]" : "border-white/[0.15]")}>
                      {isEnabled && <Check className="h-2 w-2 text-white" />}
                    </span>
                    <span className={cn("text-[12px] leading-relaxed", isEnabled ? "text-white/[0.80]" : "text-white/[0.45]")}>{r.text}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom constraint input */}
      <div className="flex gap-2">
        <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustom() }}
          placeholder="Add a custom constraint…"
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
        />
        <button type="button" onClick={addCustom} disabled={!customInput.trim()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/[0.50] hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Learning section — searchable, recommended + custom                */
/* ================================================================== */

function LearningSection({ agentId, notes, onChange }: { agentId: AgentId; notes: string[]; onChange: (n: string[]) => void }) {
  const [search, setSearch] = React.useState("")
  const [customInput, setCustomInput] = React.useState("")
  const [showRecommended, setShowRecommended] = React.useState(false)

  const recommended = RECOMMENDED_LEARNING[agentId]
  const q = search.toLowerCase().trim()
  const filteredRecommended = q ? recommended.filter((r) => r.toLowerCase().includes(q)) : recommended

  const addCustom = () => {
    const text = customInput.trim()
    if (!text) return
    onChange([...notes, text])
    setCustomInput("")
  }

  const addRecommended = (note: string) => {
    if (notes.includes(note)) return
    onChange([...notes, note])
  }

  const removeNote = (idx: number) => {
    onChange(notes.filter((_, i) => i !== idx))
  }

  return (
    <SectionCard label="Agent Learning" description={`${notes.length} learned preference${notes.length !== 1 ? "s" : ""}. These are sent with every request to personalize responses.`}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.25]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learning notes or add custom…"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-9 pr-3 py-2 text-[12px] text-white outline-none placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
        />
      </div>

      {/* Active notes */}
      {notes.length > 0 && (
        <div className="space-y-1 mb-3">
          {notes.map((note, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 group">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34D399]" />
              <span className="flex-1 text-[12px] leading-relaxed text-white/[0.70]">{note}</span>
              <button type="button" onClick={() => removeNote(i)} className="shrink-0 rounded p-0.5 text-white/[0.25] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recommended (collapsible) */}
      <button type="button" onClick={() => setShowRecommended((v) => !v)} className="flex items-center gap-1.5 text-[11px] font-medium text-[#818CF8] hover:underline mb-2">
        {showRecommended ? "Hide" : "Show"} recommended preferences
      </button>

      <AnimatePresence>
        {showRecommended && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-1 mb-3">
              {filteredRecommended.map((rec, i) => {
                const isActive = notes.includes(rec)
                return (
                  <button key={i} type="button" onClick={() => addRecommended(rec)} disabled={isActive}
                    className={cn("flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors", isActive ? "border-[#818CF8]/20 bg-[#818CF8]/5 opacity-50" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03]")}>
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: isActive ? "#818CF8" : "rgba(255,255,255,0.25)" }} />
                    <span className={cn("text-[12px] leading-relaxed", isActive ? "text-white/[0.50]" : "text-white/[0.55]")}>{rec}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom input */}
      <div className="flex gap-2">
        <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustom() }}
          placeholder="Add a custom preference…"
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
        />
        <button type="button" onClick={addCustom} disabled={!customInput.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/[0.50] hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  AgentSettingsPage — fully localStorage-backed                       */
/* ================================================================== */

export function AgentSettingsPage({ agentId }: { agentId: string }) {
  const agent = getAgent(agentId)
  if (!agent) return null
  return <AgentSettingsPageInner agent={agent} agentId={agentId as AgentId} />
}

function AgentSettingsPageInner({ agent, agentId }: { agent: AgentDef; agentId: AgentId }) {
  const Icon = agent.icon
  const [saved, setSaved] = React.useState(false)

  // Read all state from localStorage
  const [config, setConfig] = React.useState<AgentConfigState>(() => getAgentConfig(agentId))
  const [modelId, setModelId] = React.useState<string | null>(() => getAgentModel(agentId))
  const [constraints, setConstraints] = React.useState<AgentConstraint[]>(() => getAgentConstraints(agentId))
  const [learning, setLearning] = React.useState<string[]>(() => getAgentLearning(agentId))

  const handleSave = () => {
    saveAgentConfig(agentId, config)
    if (modelId) saveAgentModel(agentId, modelId)
    saveAgentConstraints(agentId, constraints)
    saveAgentLearning(agentId, learning)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <PageShell
      title={`${agent.shortLabel} Settings`}
      subtitle={agent.description}
      backHref={`/agent/${agentId}`}
      backLabel={`Back to ${agent.shortLabel} chat`}
      accentColor={agent.color}
      accentRgb={agent.colorRgb}
      headerIcon={<Icon className="h-5 w-5" style={{ color: agent.color }} />}
      actions={
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-all duration-200 active:scale-95",
            saved
              ? "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]"
              : "border-white/[0.12] bg-white/[0.06] text-white"
          )}
          style={!saved ? { borderColor: `rgba(${agent.colorRgb}, 0.30)`, backgroundColor: `rgba(${agent.colorRgb}, 0.10)`, color: agent.color } : undefined}
        >
          <Check className="h-3.5 w-3.5" />
          {saved ? "Saved" : "Save changes"}
        </button>
      }
      maxWidth="default"
    >
      <div className="space-y-4">
        <ModelSection
          agent={agent}
          modelId={modelId}
          onModelChange={setModelId}
          voiceInput={config.voiceInput}
          onVoiceInputChange={(v) => setConfig({ ...config, voiceInput: v })}
          temp={config.temperature}
          onTempChange={(v) => setConfig({ ...config, temperature: v })}
        />
        <BehaviorSection agent={agent} state={config} onChange={setConfig} />
        <ConnectorAccessSection />
        <ConstraintsSection agentId={agentId} constraints={constraints} onChange={setConstraints} />
        <LearningSection agentId={agentId} notes={learning} onChange={setLearning} />
      </div>
    </PageShell>
  )
}
