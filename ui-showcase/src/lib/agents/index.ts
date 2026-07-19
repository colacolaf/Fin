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
/*  Provider & Model Registry                                          */
/* ------------------------------------------------------------------ */

export interface ProviderOption {
  id: string
  name: string
  /** Environment variable name for the API key (e.g. OPENAI_API_KEY) */
  apiKeyEnv: string
  /** Base URL for the chat completions endpoint */
  baseUrl: string
  /** URL where users can get an API key */
  setupUrl: string
  /** Documentation URL for the provider's API */
  docUrl?: string
  /** Whether this is a locally-hosted provider (Ollama) */
  local?: boolean
  /** Models offered by this provider */
  models: ModelOption[]
}

export interface ModelOption {
  id: string
  label: string
  vendor: string
  /** Provider this model belongs to */
  providerId: string
  description: string
  /** Pricing per 1M tokens (input) */
  pricing: string
  /** Maximum context window */
  contextWindow: string
  /** Key strengths (e.g. ["Reasoning", "Fast", "Long context"]) */
  strengths: string[]
}

/* ── Providers ── */

export const availableProviders: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    setupUrl: "https://platform.openai.com/api-keys",
    docUrl: "https://platform.openai.com/docs",
    models: [
      { id: "gpt-4o", label: "GPT-4o", vendor: "OpenAI", providerId: "openai", description: "Fast, multimodal. Best all-rounder.", pricing: "$2.50/$10.00", contextWindow: "128K", strengths: ["Reasoning", "Fast", "Multimodal"] },
      { id: "gpt-4o-mini", label: "GPT-4o-mini", vendor: "OpenAI", providerId: "openai", description: "Cheap, fast. Good for quick Q&A.", pricing: "$0.15/$0.60", contextWindow: "128K", strengths: ["Fast", "Cheap"] },
      { id: "o3", label: "o3", vendor: "OpenAI", providerId: "openai", description: "Advanced reasoning for complex multi-step analysis.", pricing: "$10.00/$40.00", contextWindow: "200K", strengths: ["Reasoning", "Math", "Coding"] },
      { id: "o4-mini", label: "o4-mini", vendor: "OpenAI", providerId: "openai", description: "Fast reasoning. Good balance of speed and depth.", pricing: "$1.10/$4.40", contextWindow: "200K", strengths: ["Reasoning", "Fast"] },
      { id: "gpt-4.1", label: "GPT-4.1", vendor: "OpenAI", providerId: "openai", description: "Latest flagship. Excellent instruction following.", pricing: "$2.00/$8.00", contextWindow: "1M", strengths: ["Reasoning", "Long context", "Coding"] },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    baseUrl: "https://api.anthropic.com/v1",
    setupUrl: "https://console.anthropic.com",
    docUrl: "https://docs.anthropic.com",
    models: [
      { id: "claude-opus-4", label: "Claude Opus 4", vendor: "Anthropic", providerId: "anthropic", description: "Most capable. Best for complex financial analysis.", pricing: "$15.00/$75.00", contextWindow: "200K", strengths: ["Reasoning", "Careful", "Long context", "Coding"] },
      { id: "claude-sonnet-4", label: "Claude Sonnet 4", vendor: "Anthropic", providerId: "anthropic", description: "Balanced performance. Great for financial writing.", pricing: "$3.00/$15.00", contextWindow: "200K", strengths: ["Careful", "Long context", "Writing"] },
      { id: "claude-haiku", label: "Claude Haiku", vendor: "Anthropic", providerId: "anthropic", description: "Fastest Claude. Good for quick checks.", pricing: "$0.80/$4.00", contextWindow: "200K", strengths: ["Fast", "Cheap"] },
    ],
  },
  {
    id: "google",
    name: "Google",
    apiKeyEnv: "GOOGLE_API_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    setupUrl: "https://aistudio.google.com/apikey",
    docUrl: "https://ai.google.dev/gemini-api/docs",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", vendor: "Google", providerId: "google", description: "Large context, strong reasoning. 1M token window.", pricing: "$1.25/$5.00", contextWindow: "1M", strengths: ["Reasoning", "Long context", "Multimodal"] },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", vendor: "Google", providerId: "google", description: "Fast, affordable. 1M context.", pricing: "$0.15/$0.60", contextWindow: "1M", strengths: ["Fast", "Cheap", "Long context"] },
      { id: "gemini-flash-lite", label: "Gemini Flash-Lite", vendor: "Google", providerId: "google", description: "Cheapest option. Good for simple tasks.", pricing: "$0.075/$0.30", contextWindow: "1M", strengths: ["Cheap", "Fast"] },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    apiKeyEnv: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    setupUrl: "https://console.groq.com/keys",
    docUrl: "https://console.groq.com/docs",
    models: [
      { id: "llama-4-maverick", label: "Llama 4 Maverick", vendor: "Meta (Groq)", providerId: "groq", description: "128B open model. Strong general reasoning.", pricing: "$0.20/$0.60", contextWindow: "128K", strengths: ["Reasoning", "Fast", "Open"] },
      { id: "llama-4-scout", label: "Llama 4 Scout", vendor: "Meta (Groq)", providerId: "groq", description: "17B compact model. Very fast.", pricing: "$0.09/$0.30", contextWindow: "128K", strengths: ["Fast", "Cheap", "Open"] },
      { id: "deepseek-r1-groq", label: "DeepSeek R1 (Groq)", vendor: "DeepSeek (Groq)", providerId: "groq", description: "Open-weight reasoning model, hosted on Groq.", pricing: "$0.55/$2.19", contextWindow: "128K", strengths: ["Reasoning", "Math", "Open"] },
    ],
  },
  {
    id: "together",
    name: "Together AI",
    apiKeyEnv: "TOGETHER_API_KEY",
    baseUrl: "https://api.together.xyz/v1",
    setupUrl: "https://api.together.ai",
    docUrl: "https://docs.together.ai",
    models: [
      { id: "llama-4-together", label: "Llama 4 (Together)", vendor: "Meta (Together)", providerId: "together", description: "Latest Llama on Together's fast infra.", pricing: "$0.20/$0.60", contextWindow: "128K", strengths: ["Fast", "Open"] },
      { id: "mixtral-8x22b", label: "Mixtral 8x22B", vendor: "Mistral (Together)", providerId: "together", description: "MoE model. Strong for structured analysis.", pricing: "$0.90/$0.90", contextWindow: "64K", strengths: ["Reasoning", "Multilingual"] },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    apiKeyEnv: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1",
    setupUrl: "https://console.mistral.ai/api-keys",
    docUrl: "https://docs.mistral.ai",
    models: [
      { id: "mistral-large", label: "Mistral Large 2", vendor: "Mistral", providerId: "mistral", description: "Top-tier. Strong reasoning and multilingual.", pricing: "$2.00/$6.00", contextWindow: "128K", strengths: ["Reasoning", "Multilingual", "Coding"] },
      { id: "mistral-small", label: "Mistral Small", vendor: "Mistral", providerId: "mistral", description: "Fast, efficient. Good for everyday use.", pricing: "$0.30/$0.90", contextWindow: "128K", strengths: ["Fast", "Cheap"] },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com/v1",
    setupUrl: "https://platform.deepseek.com/api_keys",
    docUrl: "https://platform.deepseek.com/docs",
    models: [
      { id: "deepseek-v3", label: "DeepSeek V3", vendor: "DeepSeek", providerId: "deepseek", description: "General purpose. Excellent value.", pricing: "$0.14/$0.28", contextWindow: "128K", strengths: ["Cheap", "Reasoning", "Coding"] },
      { id: "deepseek-r1", label: "DeepSeek R1", vendor: "DeepSeek", providerId: "deepseek", description: "Open-weight reasoning. Great for math and logic.", pricing: "$0.55/$2.19", contextWindow: "128K", strengths: ["Reasoning", "Math", "Open"] },
    ],
  },
  {
    id: "xai",
    name: "xAI",
    apiKeyEnv: "XAI_API_KEY",
    baseUrl: "https://api.x.ai/v1",
    setupUrl: "https://x.ai/api",
    docUrl: "https://docs.x.ai",
    models: [
      { id: "grok-3", label: "Grok 3", vendor: "xAI", providerId: "xai", description: "Latest Grok. Real-time knowledge, strong reasoning.", pricing: "$2.00/$8.00", contextWindow: "128K", strengths: ["Reasoning", "Real-time"] },
      { id: "grok-3-mini", label: "Grok 3 Mini", vendor: "xAI", providerId: "xai", description: "Faster, cheaper Grok.", pricing: "$0.40/$1.60", contextWindow: "128K", strengths: ["Fast", "Cheap"] },
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    apiKeyEnv: "COHERE_API_KEY",
    baseUrl: "https://api.cohere.ai/v1",
    setupUrl: "https://dashboard.cohere.com/api-keys",
    docUrl: "https://docs.cohere.com",
    models: [
      { id: "command-r-plus", label: "Command R+", vendor: "Cohere", providerId: "cohere", description: "Enterprise-grade. Strong for structured data.", pricing: "$2.50/$10.00", contextWindow: "128K", strengths: ["Reasoning", "Structured", "Enterprise"] },
      { id: "command-r", label: "Command R", vendor: "Cohere", providerId: "cohere", description: "Efficient. Good for data extraction.", pricing: "$0.50/$1.50", contextWindow: "128K", strengths: ["Fast", "Structured"] },
    ],
  },
  {
    id: "local",
    name: "Local (Ollama)",
    apiKeyEnv: "",
    baseUrl: "http://localhost:11434/v1",
    setupUrl: "https://ollama.com",
    docUrl: "https://github.com/ollama/ollama",
    local: true,
    models: [
      { id: "llama3.1-local", label: "Llama 3.1 (Local)", vendor: "Local", providerId: "local", description: "On-device, private. No API costs.", pricing: "Free", contextWindow: "128K", strengths: ["Private", "Free", "Offline"] },
      { id: "mistral-local", label: "Mistral (Local)", vendor: "Local", providerId: "local", description: "Efficient local model. Runs on consumer hardware.", pricing: "Free", contextWindow: "32K", strengths: ["Private", "Free", "Fast"] },
      { id: "gemma2-local", label: "Gemma 2 (Local)", vendor: "Local", providerId: "local", description: "Google's open model. Small but capable.", pricing: "Free", contextWindow: "8K", strengths: ["Private", "Free", "Compact"] },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    setupUrl: "https://openrouter.ai/keys",
    docUrl: "https://openrouter.ai/docs",
    models: [
      { id: "openrouter-auto", label: "OpenRouter (Auto)", vendor: "OpenRouter", providerId: "openrouter", description: "Auto-routes to best model. Unified billing.", pricing: "Varies", contextWindow: "Varies", strengths: ["Flexible", "Unified"] },
    ],
  },
]

/** Flat array of all models from all providers — backward compatible with existing consumers */
export const availableModels: ModelOption[] = availableProviders.flatMap((p) => p.models)

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
