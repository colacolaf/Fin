import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"

/* ================================================================== */
/*  Agent definitions — shared between the dock and the chat page      */
/* ================================================================== */

export interface AgentDef {
  id: AgentId
  label: string
  shortLabel: string
  icon: LucideIcon
  /** Radial gradient string used for the orb fill */
  gradient: string
  /** CSS box-shadow glow string */
  glow: string
  /** Primary hex used for tints, borders, accents */
  color: string
  /** rgba(r,g,b) string for the primary color */
  colorRgb: string
  /** A secondary color for the liquid glass background */
  secondary: string
  /** Input placeholder */
  placeholder: string
  /** One-line description shown in headers */
  description: string
  /** Tagline shown on the empty state */
  tagline: string
}

export const agents = [
  {
    id: "portfolio",
    label: "Portfolio Agent",
    shortLabel: "Portfolio",
    icon: TrendingUp,
    gradient:
      "radial-gradient(ellipse at 30% 25%, #c4b5fd 0%, #818cf8 40%, #6366f1 70%, #4338ca 100%)",
    glow: "0 0 24px rgba(129,140,248,0.5), 0 0 48px rgba(129,140,248,0.2)",
    color: "#818CF8",
    colorRgb: "129,140,248",
    secondary: "#67E8F9",
    placeholder: "Ask about performance, allocation, holdings...",
    description: "Performance, allocation, and strategy",
    tagline: "Analyzes your holdings and rebalancing opportunities.",
  },
  {
    id: "debt",
    label: "Debt Agent",
    shortLabel: "Debt",
    icon: TrendingDown,
    gradient:
      "radial-gradient(ellipse at 35% 30%, #fde68a 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)",
    glow: "0 0 24px rgba(251,191,36,0.5), 0 0 48px rgba(251,191,36,0.2)",
    color: "#FBBF24",
    colorRgb: "251,191,36",
    secondary: "#FB7171",
    placeholder: "Ask about payoff strategy, balances, interest...",
    description: "Payoff strategy, balances, and interest",
    tagline: "Builds your fastest path to debt-free.",
  },
  {
    id: "retirement",
    label: "Retirement Agent",
    shortLabel: "Retirement",
    icon: PiggyBank,
    gradient:
      "radial-gradient(ellipse at 30% 25%, #a5f3fc 0%, #67e8f9 40%, #22d3ee 70%, #0891b2 100%)",
    glow: "0 0 24px rgba(103,232,249,0.5), 0 0 48px rgba(103,232,249,0.2)",
    color: "#67E8F9",
    colorRgb: "103,232,249",
    secondary: "#818CF8",
    placeholder: "Ask about projections, savings, retirement plan...",
    description: "Projections, savings, and retirement readiness",
    tagline: "Projects your retirement timeline and savings gaps.",
  },
] as const

export type AgentId = (typeof agents)[number]["id"]

export function getAgent(id: string): AgentDef | undefined {
  return agents.find((a) => a.id === id)
}

/* ------------------------------------------------------------------ */
/*  F.I.R.M. framework steps — shared with the thinking visualisation  */
/* ------------------------------------------------------------------ */

export type FirmStepKey = "frame" | "inspect" | "research" | "call"

export interface FirmStep {
  key: FirmStepKey
  label: string
  /** A short description of what this step does */
  hint: string
}

export const firmSteps: FirmStep[] = [
  {
    key: "frame",
    label: "Frame Reality",
    hint: "Assess the current situation and the gap to the goal.",
  },
  {
    key: "inspect",
    label: "Inspect Context",
    hint: "Read the user context and relevant memories.",
  },
  {
    key: "research",
    label: "Research Gaps",
    hint: "Search the web when confidence is below 80%.",
  },
  {
    key: "call",
    label: "Make the Call",
    hint: "Deliver one recommendation with the math.",
  },
]

/* ------------------------------------------------------------------ */
/*  Available skills (mock data for the skills dropdown)               */
/* ------------------------------------------------------------------ */

export interface AgentSkill {
  id: string
  label: string
  description: string
}

export const availableSkills: AgentSkill[] = [
  { id: "rebalance", label: "Rebalance Analyzer", description: "Compute drift and suggest trades." },
  { id: "tax", label: "Tax Estimator", description: "Estimate capital gains impact." },
  { id: "risk", label: "Risk Profiler", description: "Score portfolio volatility." },
  { id: "forecast", label: "Cash Flow Forecast", description: "Project 12-month liquidity." },
]

/* ------------------------------------------------------------------ */
/*  Available models (mock data for the model selector)                */
/* ------------------------------------------------------------------ */

export interface ModelOption {
  id: string
  label: string
  vendor: string
  description: string
}

export const availableModels: ModelOption[] = [
  { id: "gpt-5", label: "GPT-5", vendor: "OpenAI", description: "Reasoning, fast." },
  { id: "claude-4", label: "Claude Sonnet 4", vendor: "Anthropic", description: "Long context, careful." },
  { id: "llama-3", label: "Llama 3 70B", vendor: "Local", description: "On-device, private." },
]

/* ------------------------------------------------------------------ */
/*  Connectors (mock data — full page designed later)                  */
/* ------------------------------------------------------------------ */

export interface Connector {
  id: string
  label: string
  status: "connected" | "disconnected" | "syncing"
  detail: string
}

export const connectors: Connector[] = [
  { id: "portfolio", label: "Portfolio", status: "connected", detail: "Schwab · synced 2m ago" },
  { id: "bank", label: "Bank", status: "connected", detail: "Chase · synced 5m ago" },
  { id: "debt", label: "Debt", status: "connected", detail: "3 accounts · synced 1m ago" },
  { id: "retirement", label: "Retirement", status: "syncing", detail: "Vanguard · syncing now" },
]
