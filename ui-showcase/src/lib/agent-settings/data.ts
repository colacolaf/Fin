import type { AgentId, ThinkingMode, TokenMode } from "@/lib/agents"

/* ================================================================== */
/*  Agent settings data — types + localStorage helpers + recommended    */
/*  No hardcoded runtime data. Everything persisted per agent.         */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface AgentConfigState {
  temperature: number
  streamThinking: boolean
  citations: boolean
  autoExecute: boolean
  voiceInput: boolean
  thinkingMode: ThinkingMode
  tokenMode: TokenMode
}

export interface AgentConstraint {
  id: string
  text: string
  /** Whether this was selected by the user (vs. recommended/unselected) */
  enabled: boolean
  /** Whether this is user-added (custom) or from the recommended list */
  custom: boolean
}

export interface AgentConnectorAccess {
  id: string
  label: string
  type: string
  granted: boolean
}

/* ------------------------------------------------------------------ */
/*  Recommended constraints — from system prompts, used as defaults     */
/* ------------------------------------------------------------------ */

export const RECOMMENDED_CONSTRAINTS: Record<AgentId, Omit<AgentConstraint, "enabled" | "custom">[]> = {
  portfolio: [
    { id: "rc-p1", text: "Long-term trades only — no day trading or short-term speculation." },
    { id: "rc-p2", text: "Explain tax and fee implications before any trade execution." },
    { id: "rc-p3", text: "Require proof (documents, cap table) before estimating private holdings." },
    { id: "rc-p4", text: "Reference past decisions when relevant." },
    { id: "rc-p5", text: "Surface fee optimization opportunities." },
    { id: "rc-p6", text: "Only propose trades the user explicitly authorizes." },
  ],
  debt: [
    { id: "rc-d1", text: "Prioritize high-interest debt first (avalanche method)." },
    { id: "rc-d2", text: "Show total interest saved and payoff timeline for each strategy." },
    { id: "rc-d3", text: "Never recommend taking on new debt without clear justification." },
    { id: "rc-d4", text: "Celebrate payoff milestones with desktop notifications." },
    { id: "rc-d5", text: "Suggest redirecting freed cash flow when a debt is paid off." },
    { id: "rc-d6", text: "Surface consolidation or refinancing opportunities." },
  ],
  retirement: [
    { id: "rc-r1", text: "Prioritize employer match capture above all else." },
    { id: "rc-r2", text: "Explain tax implications of contributions and conversions." },
    { id: "rc-r3", text: "Use conservative assumptions for all projections." },
    { id: "rc-r4", text: "Coordinate with Portfolio and Debt agents on cash flow." },
    { id: "rc-r5", text: "Recommend Roth conversions when tax-advantageous." },
    { id: "rc-r6", text: "Project retirement income with and without Social Security." },
  ],
}

/* ------------------------------------------------------------------ */
/*  Recommended learning notes — draft suggestions for the user         */
/* ------------------------------------------------------------------ */

export const RECOMMENDED_LEARNING: Record<AgentId, string[]> = {
  portfolio: [
    "User prefers gradual rebalancing over 2-3 weeks.",
    "User comfortable with 15% drawdown limit.",
    "User skips quarterly reviews — prefers monthly.",
  ],
  debt: [
    "User responds well to avalanche strategy visualization.",
    "User prefers to redirect freed cash flow rather than spend it.",
    "User interested in refinancing when rates drop below 5%.",
  ],
  retirement: [
    "User wants to retire at 65, not 67 — projections adjusted.",
    "User interested in Roth conversions but defers on tax timing.",
    "User open to increasing contributions by 1% per year.",
  ],
}

/* ------------------------------------------------------------------ */
/*  Default config per agent                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_CONFIG: Record<AgentId, AgentConfigState> = {
  portfolio: { temperature: 0.4, streamThinking: true, citations: true, autoExecute: false, voiceInput: false, thinkingMode: "full", tokenMode: "normal" },
  debt: { temperature: 0.3, streamThinking: true, citations: true, autoExecute: false, voiceInput: false, thinkingMode: "full", tokenMode: "normal" },
  retirement: { temperature: 0.3, streamThinking: true, citations: true, autoExecute: false, voiceInput: false, thinkingMode: "full", tokenMode: "normal" },
}

/* ================================================================== */
/*  localStorage helpers — per-agent config, constraints, learning      */
/* ================================================================== */

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null
  try { return localStorage.getItem(key) } catch { return null }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, value) } catch { /* quota */ }
}

function configKey(agentId: string): string {
  return `fo-agent-config-${agentId}`
}

function constraintsKey(agentId: string): string {
  return `fo-agent-constraints-${agentId}`
}

function learningKey(agentId: string): string {
  return `fo-agent-learning-${agentId}`
}

function modelKey(agentId: string): string {
  return `fo-agent-model-${agentId}`
}

/** Read per-agent config from localStorage */
export function getAgentConfig(agentId: AgentId): AgentConfigState {
  try {
    const raw = safeGet(configKey(agentId))
    if (raw) return { ...DEFAULT_CONFIG[agentId], ...JSON.parse(raw) }
  } catch { /* corrupt — use default */ }
  return { ...DEFAULT_CONFIG[agentId] }
}

/** Save per-agent config to localStorage */
export function saveAgentConfig(agentId: AgentId, config: AgentConfigState): void {
  safeSet(configKey(agentId), JSON.stringify(config))
}

/** Read per-agent constraints from localStorage */
export function getAgentConstraints(agentId: AgentId): AgentConstraint[] {
  try {
    const raw = safeGet(constraintsKey(agentId))
    if (raw) return JSON.parse(raw)
  } catch { /* corrupt — return empty */ }
  return []
}

/** Save per-agent constraints to localStorage */
export function saveAgentConstraints(agentId: AgentId, constraints: AgentConstraint[]): void {
  safeSet(constraintsKey(agentId), JSON.stringify(constraints))
}

/** Read per-agent learning notes from localStorage */
export function getAgentLearning(agentId: AgentId): string[] {
  try {
    const raw = safeGet(learningKey(agentId))
    if (raw) return JSON.parse(raw)
  } catch { /* corrupt — return empty */ }
  return []
}

/** Save per-agent learning notes to localStorage */
export function saveAgentLearning(agentId: AgentId, notes: string[]): void {
  safeSet(learningKey(agentId), JSON.stringify(notes))
}

/** Read per-agent selected model from localStorage */
export function getAgentModel(agentId: AgentId): string | null {
  return safeGet(modelKey(agentId))
}

/** Save per-agent selected model to localStorage */
export function saveAgentModel(agentId: AgentId, modelId: string): void {
  safeSet(modelKey(agentId), modelId)
}
