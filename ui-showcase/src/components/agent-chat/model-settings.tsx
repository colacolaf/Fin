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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { availableModels, type AgentDef, type ModelOption } from "@/lib/agents"

/* ------------------------------------------------------------------ */
/*  ModelPicker                                                        */
/* ------------------------------------------------------------------ */

function ModelPicker({
  value,
  onChange,
}: {
  value: ModelOption
  onChange: (m: ModelOption) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5",
            "text-[11px] font-medium text-white transition-colors duration-150",
            "hover:bg-white/[0.06] hover:border-white/[0.12] active:scale-[0.97]"
          )}
        >
          <Zap className="h-3 w-3 text-[#67E8F9]" />
          <span>{value.label}</span>
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
        className="z-50 w-[240px] rounded-lg border border-white/[0.08] bg-[#0F1117]/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-1.5 px-2 pt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white/[0.35]">
          Model
        </div>
        {availableModels.map((m) => {
          const isActive = m.id === value.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onChange(m)
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
                  <span className="text-[12px] font-medium text-white">{m.label}</span>
                  {isActive && <Check className="h-3 w-3 text-[#67E8F9]" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">
                    {m.vendor}
                  </span>
                  <span className="text-[9px] text-white/[0.25]">·</span>
                  <span className="text-[10px] text-white/[0.40]">{m.description}</span>
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
            <span className="text-[12px] font-medium text-white">Temperature</span>
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
/*  ModelSettings — composed cluster                                   */
/* ------------------------------------------------------------------ */

export interface ModelSettingsState {
  model: ModelOption
  voice: boolean
  settings: SettingsState
}

export function ModelSettings({
  agent,
  state,
  onChange,
}: {
  agent: AgentDef
  state: ModelSettingsState
  onChange: (s: ModelSettingsState) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <ModelPicker
        value={state.model}
        onChange={(m) => onChange({ ...state, model: m })}
      />
      <VoiceToggle
        enabled={state.voice}
        onToggle={(v) => onChange({ ...state, voice: v })}
      />
      <SettingsGear
        agent={agent}
        state={state.settings}
        onChange={(s) => onChange({ ...state, settings: s })}
      />
    </div>
  )
}

export const defaultModelSettingsState: ModelSettingsState = {
  model: availableModels[0],
  voice: false,
  settings: {
    temperature: 0.4,
    streamThinking: true,
    autoExecute: false,
    citations: true,
  },
}
