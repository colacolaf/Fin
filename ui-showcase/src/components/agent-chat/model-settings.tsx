"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import {
  ChevronDown,
  Mic,
  MicOff,
  Settings2,
  Check,
  Zap,
  Cpu,
  ExternalLink,
  AlertCircle,
  Brain,
  FileDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  availableModels,
  thinkingModes,
  tokenModes,
  type AgentDef,
  type ModelOption,
  type ThinkingMode,
  type TokenMode,
} from "@/lib/agents"
import {
  getAgentModel,
  getAgentConfig,
  saveAgentModel,
  saveAgentConfig,
} from "@/lib/agent-settings/data"
import { getProviderSetupUrl, isProviderLocal } from "@/lib/settings/provider-keys"
import { useLocalStorage } from "@/lib/use-local-storage"
import type { AgentId } from "@/lib/agents"

/* ------------------------------------------------------------------ */
/*  Derived: models from configured providers only                     */
/* ------------------------------------------------------------------ */

function useConfiguredModels() {
  const [keys] = useLocalStorage<Record<string, string>>("fo-provider-keys", {})
  const configuredIds = React.useMemo(() => new Set(Object.keys(keys)), [keys])
  return React.useMemo(
    () => availableModels.filter(
      (m) => configuredIds.has(m.providerId) || isProviderLocal(m.providerId)
    ),
    [configuredIds],
  )
}

/* ------------------------------------------------------------------ */
/*  Setup link helper — reads provider setup URL from the registry     */
/* ------------------------------------------------------------------ */

function getSetupLink(providerId: string): { label: string; url: string } | null {
  const url = getProviderSetupUrl(providerId)
  if (!url) return null
  return { label: providerId === "local" ? "Download" : "Get API key", url }
}

/* ------------------------------------------------------------------ */
/*  ModelPicker                                                        */
/* ------------------------------------------------------------------ */

function ModelPicker({
  modelId,
  onSelect,
}: {
  /** Currently selected model ID from localStorage, or null if none */
  modelId: string | null
  onSelect: (m: ModelOption) => void
}) {
  const [open, setOpen] = React.useState(false)
  const configuredModels = useConfiguredModels()

  // Always include the currently selected model in the list, even if its provider
  // was later unconfigured — avoids the user losing their choice.
  const visibleModels = React.useMemo(() => {
    if (!modelId) return configuredModels
    if (configuredModels.some((m) => m.id === modelId)) return configuredModels
    const selected = availableModels.find((m) => m.id === modelId)
    return selected ? [selected, ...configuredModels] : configuredModels
  }, [modelId, configuredModels])

  const selectedModel = modelId
    ? availableModels.find((m) => m.id === modelId) ?? null
    : null

  const hasConfiguredModels = configuredModels.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5",
            "text-[11px] font-medium transition-colors duration-150",
            "hover:bg-white/[0.06] active:scale-[0.97]",
            selectedModel
              ? "border-white/[0.08] bg-white/[0.03] text-white"
              : "border-[#FBBF24]/30 bg-[#FBBF24]/6 text-[#FBBF24]"
          )}
        >
          {selectedModel ? (
            <>
              <Zap className="h-3 w-3 text-[#67E8F9]" />
              <span>{selectedModel.label}</span>
              {selectedModel.vendor && (
                <span className="text-[9px] text-white/[0.35]">
                  · {selectedModel.vendor}
                </span>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              <span>No model</span>
            </>
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
        align="end"
        sideOffset={6}
        className="z-50 w-[280px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-1.5 px-2 pt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.35]">
          Select model
        </div>

        {visibleModels.map((m) => {
          const isActive = m.id === modelId
          const setup = getSetupLink(m.providerId)
          const isReady = configuredModels.some((cm) => cm.id === m.id)
          return (
            <div key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-100",
                  isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                )}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                  <Cpu className="h-3 w-3 text-white/[0.55]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-white">
                      {m.label}
                    </span>
                    {isActive && <Check className="h-3 w-3 text-[#67E8F9]" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">
                      {m.vendor}
                    </span>
                    <span className="text-[9px] text-white/[0.25]">·</span>
                    <span className="text-[10px] text-white/[0.40]">
                      {m.description}
                    </span>
                    {isReady ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shrink-0" title="API key configured" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24] shrink-0" title="Needs API key" />
                    )}
                  </div>
                </div>
              </button>
              {setup && !isReady && (
                <a
                  href={setup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-10 mb-1 inline-flex items-center gap-1 text-[10px] text-[#67E8F9]/70 hover:text-[#67E8F9] transition-colors"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {setup.label}
                </a>
              )}
            </div>
          )
        })}

        {!hasConfiguredModels && (
          <div className="px-2 py-4 text-center">
            <p className="text-[11px] text-white/[0.45]">No models configured.</p>
            <p className="text-[10px] text-white/[0.30] mt-1">
              Add API keys in{" "}
              <a href="/settings" className="text-[#67E8F9] hover:underline">Settings → AI Models</a>
            </p>
          </div>
        )}

        {hasConfiguredModels && (
          <div className="mt-1.5 border-t border-white/[0.06] pt-1.5 px-2">
            <p className="text-[10px] text-white/[0.30] leading-relaxed">
              Manage API keys in{" "}
              <a
                href="/settings"
                className="text-[#67E8F9]/70 hover:text-[#67E8F9] underline underline-offset-2"
              >
                Settings → AI Models
              </a>
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  VoiceToggle                                                        */
/* ------------------------------------------------------------------ */

function VoiceToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      title={enabled ? "Voice on" : "Voice off"}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-150 active:scale-[0.97]",
        enabled
          ? "border-[#67E8F9]/30 bg-[#67E8F9]/10 text-[#67E8F9]"
          : "border-white/[0.08] bg-white/[0.03] text-white/[0.40] hover:bg-white/[0.06] hover:text-white/[0.6]"
      )}
    >
      {enabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  SettingsGear — popover with agent-specific preferences            */
/* ------------------------------------------------------------------ */

interface SettingsState {
  temperature: number
  streamThinking: boolean
  autoExecute: boolean
  citations: boolean
  thinkingMode: ThinkingMode
  tokenMode: TokenMode
}

/* ── Collapsible mode section (accordion) ── */

function CollapsibleModeSection({
  icon,
  label,
  options,
  activeId,
  onSelect,
  accentColor,
}: {
  icon: React.ReactNode
  label: string
  options: { id: string; label: string; description: string }[]
  activeId: string
  onSelect: (id: string) => void
  accentColor: string
}) {
  const [expanded, setExpanded] = React.useState(false)
  const active = options.find((o) => o.id === activeId) ?? options[0]

  return (
    <div className="mb-3 px-1 py-1">
      {/* Header — click to toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        {icon}
        <span className="flex-1 text-[10px] font-medium uppercase tracking-[0.10em] text-white/[0.40]">
          {label}
        </span>
        <span className="text-[11px] font-medium text-white/[0.70] truncate max-w-[120px]">
          {active.label}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-white/[0.35] shrink-0 transition-transform duration-150",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded options */}
      {expanded && (
        <div className="mt-1 space-y-1">
          {options.map((mode) => {
            const isActive = mode.id === activeId
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => { onSelect(mode.id); setExpanded(false) }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border flex items-center justify-center",
                    isActive ? "border-transparent" : "border-white/[0.15]"
                  )}
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                >
                  {isActive && <Check className="h-2 w-2 text-[#0F1117]" />}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-white">{mode.label}</div>
                  <div className="text-[10px] text-white/[0.35]">{mode.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* Hoisted to module scope — defining Toggle inside SettingsGear would
   recreate the component type on every render and remount its subtree. */
function SettingsToggle({
  label,
  description,
  checked,
  onToggle,
  accentColor,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: (v: boolean) => void
  accentColor: string
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
    >
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-white">{label}</div>
        <div className="text-[10px] text-white/[0.35]">{description}</div>
      </div>
      <span
        className={cn(
          "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-white/[0.20]" : "bg-white/[0.08]"
        )}
        style={checked ? { backgroundColor: accentColor } : undefined}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-150",
            checked ? "translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  )
}

function SettingsGear({
  agent,
  state,
  onChange,
}: {
  agent: AgentDef
  state: SettingsState
  onChange: (s: SettingsState) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Agent settings"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]",
            "text-white/[0.40] transition-all duration-150",
            "hover:bg-white/[0.06] hover:text-white/[0.6] active:scale-[0.97]",
            open && "bg-white/[0.06] text-white/[0.7]"
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="z-50 w-[260px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-3 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.40]">
            Agent settings
          </span>
          <span
            className="text-[9px] font-medium"
            style={{ color: agent.color }}
          >
            {agent.shortLabel}
          </span>
        </div>

        {/* Temperature slider */}
        <div className="mb-3 rounded-md px-1 py-1.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[12px] font-medium text-white">
              Temperature
            </span>
            <span className="font-mono text-[11px] tabular-nums text-white/[0.55]">
              {state.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={state.temperature}
            onChange={(e) =>
              onChange({ ...state, temperature: Number(e.target.value) })
            }
            className="w-full accent-white/60"
            style={{ accentColor: agent.color }}
          />
          <div className="mt-0.5 flex justify-between text-[9px] text-white/[0.25]">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] my-1.5" />

        {/* ── Thinking Mode (collapsible) ── */}
        <CollapsibleModeSection
          icon={<Brain className="h-3 w-3 text-white/[0.45]" />}
          label="Think Mode"
          options={thinkingModes}
          activeId={state.thinkingMode}
          onSelect={(id) => onChange({ ...state, thinkingMode: id as ThinkingMode })}
          accentColor={agent.color}
        />

        <div className="h-px bg-white/[0.06] my-1.5" />

        {/* ── Token Mode (collapsible) ── */}
        <CollapsibleModeSection
          icon={<FileDown className="h-3 w-3 text-white/[0.45]" />}
          label="Token Mode"
          options={tokenModes}
          activeId={state.tokenMode}
          onSelect={(id) => onChange({ ...state, tokenMode: id as TokenMode })}
          accentColor={agent.color}
        />

        <div className="h-px bg-white/[0.06] my-1.5" />

        <SettingsToggle
          label="Stream thinking"
          description="Show F.I.R.M. steps live"
          checked={state.streamThinking}
          onToggle={(v) => onChange({ ...state, streamThinking: v })}
          accentColor={agent.color}
        />
        <SettingsToggle
          label="Citations"
          description="Cite sources in replies"
          checked={state.citations}
          onToggle={(v) => onChange({ ...state, citations: v })}
          accentColor={agent.color}
        />
        <SettingsToggle
          label="Auto-execute"
          description="Run approved trades without re-confirm"
          checked={state.autoExecute}
          onToggle={(v) => onChange({ ...state, autoExecute: v })}
          accentColor={agent.color}
        />
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  ModelSettings — composed cluster, localStorage-backed              */
/* ------------------------------------------------------------------ */

export interface ModelSettingsState {
  /** The currently selected model ID (or null if none) */
  modelId: string | null
  model: ModelOption
  voice: boolean
  settings: SettingsState
}

export interface ModelSettingsProps {
  agent: AgentDef
  state: ModelSettingsState
  onChange: (s: ModelSettingsState) => void
}

export function ModelSettings({
  agent,
  state,
  onChange,
}: ModelSettingsProps) {
  // Persist model selection to localStorage whenever it changes
  const handleModelSelect = React.useCallback(
    (m: ModelOption) => {
      saveAgentModel(agent.id as AgentId, m.id)
      onChange({ ...state, modelId: m.id, model: m })
    },
    [agent.id, state, onChange],
  )

  // Persist settings to localStorage whenever they change
  const handleSettingsChange = React.useCallback(
    (s: SettingsState) => {
      saveAgentConfig(agent.id as AgentId, {
        temperature: s.temperature,
        streamThinking: s.streamThinking,
        citations: s.citations,
        autoExecute: s.autoExecute,
        voiceInput: state.voice,
        thinkingMode: s.thinkingMode,
        tokenMode: s.tokenMode,
      })
      onChange({ ...state, settings: s })
    },
    [agent.id, state, onChange],
  )

  const handleVoiceToggle = React.useCallback(
    (v: boolean) => {
      saveAgentConfig(agent.id as AgentId, {
        temperature: state.settings.temperature,
        streamThinking: state.settings.streamThinking,
        citations: state.settings.citations,
        autoExecute: state.settings.autoExecute,
        voiceInput: v,
        thinkingMode: state.settings.thinkingMode,
        tokenMode: state.settings.tokenMode,
      })
      onChange({ ...state, voice: v })
    },
    [agent.id, state, onChange],
  )

  return (
    <div className="flex items-center gap-2">
      <ModelPicker
        modelId={state.modelId}
        onSelect={handleModelSelect}
      />
      <VoiceToggle
        enabled={state.voice}
        onToggle={handleVoiceToggle}
      />
      <SettingsGear
        agent={agent}
        state={state.settings}
        onChange={handleSettingsChange}
      />
    </div>
  )
}

/** Build default model settings for a given agent.
 *  SSR-safe: always returns defaults on both server and client.
 *  The caller re-syncs from localStorage after mount. */
export function buildDefaultModelSettingsState(
  _agentId: string,
): ModelSettingsState {
  return {
    modelId: availableModels[0].id,
    model: availableModels[0],
    voice: false,
    settings: {
      temperature: 0.4,
      streamThinking: true,
      autoExecute: false,
      citations: true,
      thinkingMode: "full" as ThinkingMode,
      tokenMode: "normal" as TokenMode,
    },
  }
}

/** Legacy default for non-agent-specific contexts */
export const defaultModelSettingsState: ModelSettingsState = {
  modelId: availableModels[0].id,
  model: availableModels[0],
  voice: false,
  settings: {
    temperature: 0.4,
    streamThinking: true,
    autoExecute: false,
    citations: true,
    thinkingMode: "full",
    tokenMode: "normal",
  },
}
