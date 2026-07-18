"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Check,
  Cpu,
  Mic,
  MicOff,
  Plug,
  Lock,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell, SectionCard, SettingRow } from "@/components/page-shell/page-shell"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  getAgent,
  availableModels,
  type ModelOption,
  type AgentDef,
} from "@/lib/agents"
import {
  agentConstraints,
  agentLearningNotes,
  agentConnectorAccess,
  defaultAgentConfig,
  type AgentConfigState,
  type AgentConnectorAccess,
} from "@/lib/agent-settings/data"

/* ================================================================== */
/*  Model section                                                      */
/* ================================================================== */

function ModelSection({
  agent,
  model,
  onModelChange,
  voice,
  onVoiceChange,
  temp,
  onTempChange,
}: {
  agent: AgentDef
  model: ModelOption
  onModelChange: (m: ModelOption) => void
  voice: boolean
  onVoiceChange: (v: boolean) => void
  temp: number
  onTempChange: (v: number) => void
}) {
  return (
    <SectionCard
      label="AI Model"
      description="The model and parameters this agent uses to reason."
    >
      <div className="space-y-1">
        {availableModels.map((m) => {
          const isActive = m.id === model.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModelChange(m)}
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
                  <span className="text-[13px] font-medium text-white">
                    {m.label}
                  </span>
                  {isActive && (
                    <Check
                      className="h-3.5 w-3.5"
                      style={{ color: agent.color }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">
                    {m.vendor}
                  </span>
                  <span className="text-[9px] text-white/[0.25]">·</span>
                  <span className="text-[11px] text-white/[0.40]">
                    {m.description}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Voice + Temperature */}
      <div className="mt-4 divide-y divide-white/[0.04] border-t border-white/[0.04]">
        <SettingRow
          label="Voice Output"
          description="Read this agent's replies aloud."
          accentColor={agent.color}
        >
          <button
            type="button"
            onClick={() => onVoiceChange(!voice)}
            aria-pressed={voice}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95",
              voice
                ? "border-white/[0.12] bg-white/[0.06] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/[0.55] hover:bg-white/[0.06]"
            )}
            style={
              voice
                ? {
                    borderColor: `rgba(${agent.colorRgb}, 0.30)`,
                    backgroundColor: `rgba(${agent.colorRgb}, 0.10)`,
                    color: agent.color,
                  }
                : undefined
            }
          >
            {voice ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
            {voice ? "On" : "Off"}
          </button>
        </SettingRow>

        <div className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <div>
                <div className="text-[13px] font-medium text-white">
                  Temperature
                </div>
                <div className="mt-0.5 text-[11px] text-white/[0.35]">
                  Lower = more precise, higher = more creative.
                </div>
              </div>
            </div>
            <span
              className="font-mono text-[14px] tabular-nums"
              style={{ color: agent.color }}
            >
              {temp.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[temp]}
            onValueChange={(v) => onTempChange(Array.isArray(v) ? v[0] : v)}
          />
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
    <SectionCard
      label="Behavior"
      description="Control how this agent responds and acts."
    >
      <div className="divide-y divide-white/[0.04]">
        <SettingRow
          label="Stream thinking"
          description="Show the F.I.R.M. steps live while the agent reasons."
          accentColor={agent.color}
        >
          <Switch
            checked={state.streamThinking}
            onCheckedChange={(v) => onChange({ ...state, streamThinking: v })}
          />
        </SettingRow>
        <SettingRow
          label="Citations"
          description="Cite sources in replies when web research is used."
          accentColor={agent.color}
        >
          <Switch
            checked={state.citations}
            onCheckedChange={(v) => onChange({ ...state, citations: v })}
          />
        </SettingRow>
        <SettingRow
          label="Auto-execute"
          description="Run approved actions without re-confirming. Dangerous."
          accentColor="#F87171"
        >
          <Switch
            checked={state.autoExecute}
            onCheckedChange={(v) => onChange({ ...state, autoExecute: v })}
          />
        </SettingRow>
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Connector Access section                                           */
/* ================================================================== */

function ConnectorAccessSection({
  agentId,
}: {
  agentId: string
}) {
  const access = agentConnectorAccess[agentId as keyof typeof agentConnectorAccess] ?? []
  const [granted, setGranted] = React.useState(
    access.map((a) => ({ ...a }))
  )

  const toggle = (id: string) => {
    setGranted((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, granted: !a.granted } : a
      )
    )
  }

  return (
    <SectionCard
      label="Connector Access"
      description="Which data sources this agent can read."
    >
      <div className="space-y-1">
        {granted.map((c: AgentConnectorAccess) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
              <Plug className="h-4 w-4 text-white/[0.50]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-medium text-white">
                {c.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">
                {c.type}
              </span>
            </div>
            <Switch
              checked={c.granted}
              onCheckedChange={() => toggle(c.id)}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Constraints section (read-only)                                    */
/* ================================================================== */

function ConstraintsSection({ agentId }: { agentId: string }) {
  const constraints =
    agentConstraints[agentId as keyof typeof agentConstraints] ?? []

  return (
    <SectionCard
      label="Agent Constraints"
      description="Hard rules from this agent's system prompt. Read-only."
    >
      <div className="space-y-2.5">
        {constraints.map((c) => (
          <div
            key={c.id}
            className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/[0.30]" />
            <span className="text-[12px] leading-relaxed text-white/[0.60]">
              {c.text}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  Agent Learning section (read-only)                                 */
/* ================================================================== */

function LearningSection({ agentId }: { agentId: string }) {
  const notes =
    agentLearningNotes[agentId as keyof typeof agentLearningNotes] ?? []

  return (
    <SectionCard
      label="Agent Learning"
      description="What this agent has learned about you. Read-only."
    >
      <div className="space-y-2.5">
        {notes.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
          >
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/[0.30]" />
            <span className="text-[12px] leading-relaxed text-white/[0.60]">
              {note}
            </span>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ================================================================== */
/*  AgentSettingsPage — Config Form                                    */
/* ================================================================== */

export function AgentSettingsPage({ agentId }: { agentId: string }) {
  const agent = getAgent(agentId)
  if (!agent) return null

  return <AgentSettingsPageInner agent={agent} agentId={agentId} />
}

function AgentSettingsPageInner({
  agent,
  agentId,
}: {
  agent: AgentDef
  agentId: string
}) {
  const Icon = agent.icon
  const defaults = defaultAgentConfig[agentId as keyof typeof defaultAgentConfig]
  const [config, setConfig] = React.useState<AgentConfigState>(defaults)
  const [model, setModel] = React.useState<ModelOption>(availableModels[0])

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
          className="flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95"
          style={{
            borderColor: `rgba(${agent.colorRgb}, 0.30)`,
            backgroundColor: `rgba(${agent.colorRgb}, 0.10)`,
            color: agent.color,
          }}
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </button>
      }
      maxWidth="default"
    >
      <div className="space-y-4">
        <ModelSection
          agent={agent}
          model={model}
          onModelChange={setModel}
          voice={config.voice}
          onVoiceChange={(v) => setConfig({ ...config, voice: v })}
          temp={config.temperature}
          onTempChange={(v) => setConfig({ ...config, temperature: v })}
        />
        <BehaviorSection
          agent={agent}
          state={config}
          onChange={setConfig}
        />
        <ConnectorAccessSection agentId={agentId} />
        <ConstraintsSection agentId={agentId} />
        <LearningSection agentId={agentId} />
      </div>
    </PageShell>
  )
}
