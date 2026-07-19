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
/*  Thinking Modes — controls reasoning depth                         */
/* ------------------------------------------------------------------ */

export type ThinkingMode = "full" | "fast"

export interface ThinkingModeOption {
  id: ThinkingMode
  label: string
  description: string
}

export const thinkingModes: ThinkingModeOption[] = [
  { id: "full", label: "Full reasoning", description: "Runs complete F.I.R.M. framework with all mental models, validation, and teaching layers." },
  { id: "fast", label: "Fast inference", description: "Skips teaching layer and redundant validation. Faster, fewer tokens." },
]

/* ------------------------------------------------------------------ */
/*  Token Modes — controls output compression level                    */
/* ------------------------------------------------------------------ */

export type TokenMode = "normal" | "compressed" | "ultra" | "bare"

export interface TokenModeOption {
  id: TokenMode
  label: string
  description: string
  /** What compression techniques are applied */
  techniques: string
}

export const tokenModes: TokenModeOption[] = [
  {
    id: "normal",
    label: "Normal",
    description: "Full institutional prose — no compression.",
    techniques: "Standard output with complete explanations, teaching layers, and structured formatting.",
  },
  {
    id: "compressed",
    label: "Compressed",
    description: "Caveman lite + Ponytail lite — moderate token reduction.",
    techniques: "Trim filler words, collapse redundant explanations, prefer concise structures. ~40% token reduction.",
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "Caveman full + Ponytail full — aggressive compression.",
    techniques: "Caveman prose, single-sentence explanations, eliminate teaching layer, minimal formatting. ~65% token reduction.",
  },
  {
    id: "bare",
    label: "Bare",
    description: "Caveman ultra + Ponytail ultra + RTK filtering — maximum density.",
    techniques: "Keyword-dense output, no prose, output filtering applied, only raw essential facts. ~80% token reduction.",
  },
]

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
  /** Path to the rich skill document the AI reads when this skill is invoked */
  docPath: string
  /** Agent category this skill belongs to */
  agent: AgentId | "universal"
  /** Approximate token count of the skill doc (for context budgeting) */
  tokenEstimate: number
}

export const availableSkills: AgentSkill[] = [
  /* Universal skills */
  { id: "route_skills", label: "Skill Router", description: "Auto-detect which skills to use based on user intent — runs every session.", docPath: "docs/Skills/universal/route_skills.md", agent: "universal", tokenEstimate: 1800 },
  { id: "fetch_user_context", label: "Fetch User Context", description: "Load the read-only User Context File at start of conversation.", docPath: "docs/Skills/universal/fetch_user_context.md", agent: "universal", tokenEstimate: 1200 },
  { id: "search_web", label: "Search Web", description: "Retrieve recent market, macro, or product data when confidence < 80%.", docPath: "docs/Skills/universal/search_web.md", agent: "universal", tokenEstimate: 1800 },
  { id: "log_decision", label: "Log Decision", description: "Persist a user's decision and update behavioral patterns.", docPath: "docs/Skills/universal/log_decision.md", agent: "universal", tokenEstimate: 1500 },
  { id: "send_desktop_notification", label: "Desktop Notifications", description: "Send a native desktop notification on task complete or milestones.", docPath: "docs/Skills/universal/send_desktop_notification.md", agent: "universal", tokenEstimate: 1200 },
  /* Portfolio skills */
  { id: "portfolio_analyze", label: "Portfolio Analyzer", description: "Compute allocation, concentration, and diversification metrics.", docPath: "docs/Skills/portfolio/portfolio_analyze.md", agent: "portfolio", tokenEstimate: 2400 },
  { id: "rebalance_recommend", label: "Rebalance Recommender", description: "Generate a rebalancing recommendation with before/after metrics.", docPath: "docs/Skills/portfolio/rebalance_recommend.md", agent: "portfolio", tokenEstimate: 2400 },
  { id: "value_private_asset", label: "Value Private Asset", description: "Research and estimate the value of private holdings.", docPath: "docs/Skills/portfolio/value_private_asset.md", agent: "portfolio", tokenEstimate: 2200 },
  { id: "execute_trade", label: "Execute Trade", description: "Place a long-term trade through connected brokerage (auth required).", docPath: "docs/Skills/portfolio/execute_trade.md", agent: "portfolio", tokenEstimate: 2000 },
  { id: "enable_paper_trading", label: "Paper Trading", description: "Toggle paper trading mode for testing without real execution.", docPath: "docs/Skills/portfolio/enable_paper_trading.md", agent: "portfolio", tokenEstimate: 1500 },
  /* Debt skills */
  { id: "debt_payoff_simulate", label: "Payoff Simulator", description: "Calculate payoff timelines and total interest for each strategy.", docPath: "docs/Skills/debt/debt_payoff_simulate.md", agent: "debt", tokenEstimate: 2200 },
  { id: "debt_vs_invest_analyze", label: "Debt vs Invest", description: "Compare debt payoff vs. investment return with employer match.", docPath: "docs/Skills/debt/debt_vs_invest_analyze.md", agent: "debt", tokenEstimate: 2200 },
  /* Retirement skills */
  { id: "retirement_readiness_score", label: "Readiness Score", description: "Calculate funded percentage and projected retirement income.", docPath: "docs/Skills/retirement/retirement_readiness_score.md", agent: "retirement", tokenEstimate: 2300 },
  { id: "match_capture_recommend", label: "Match Capture", description: "Recommend contribution rate to capture full employer match.", docPath: "docs/Skills/retirement/match_capture_recommend.md", agent: "retirement", tokenEstimate: 1800 },
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
/*  Connectors                                                          */
/*                                                                    */
/*  Source of truth for connection state is localStorage (`fo-connected-*/
/*  providers`, `fo-api-keys`, `fo-connector-status`) merged at read   */
/*  time by `useConnectors()` in `lib/settings/use-connectors.ts`.     */
/*  No static `connectors` array here — keep this file free of mock    */
/*  connection state names ("Schwab", "SoFi", "Chase", "Vanguard")     */
/*  that would leak through as "connected" when nothing is.            */
/* ------------------------------------------------------------------ */
