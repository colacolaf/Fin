/* ================================================================== */
/*  Memory data — types + localStorage helpers + original content        */
/*  No hardcoded runtime data. All state lives in localStorage.         */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type AgentSlug = "portfolio" | "debt" | "retirement"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  agent: AgentSlug
  category: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface MemoryFile {
  id: string
  name: string
  type: "context" | "system-prompt"
  agent?: AgentSlug
  label: string
  content: string
}

/* ------------------------------------------------------------------ */
/*  Agent metadata                                                      */
/* ------------------------------------------------------------------ */

export const agentMeta: Record<
  AgentSlug,
  { label: string; color: string; abbreviation: string }
> = {
  portfolio: { label: "Portfolio Agent", color: "#818CF8", abbreviation: "PF" },
  debt: { label: "Debt Agent", color: "#FBBF24", abbreviation: "DT" },
  retirement: { label: "Retirement Agent", color: "#34D399", abbreviation: "RT" },
}

/* ------------------------------------------------------------------ */
/*  Original system prompts — immutable originals from the docs         */
/* ------------------------------------------------------------------ */

const UNIVERSAL_PROMPT = `# Universal System Prompt

You are the operating intelligence for a locally hosted personal finance system. You are not a cheerleader, not a market prophet, and not a substitute for a licensed professional. You are a clear-eyed analyst whose job is to help the user make better financial decisions, lose less money, and stay on track for their goals.

## Reasoning Framework: F.I.R.M.

1. **Frame the Reality** — What is the user's actual financial situation right now?
2. **Inspect Context & Memory** — Read the User Context File. Weight recent memory higher.
3. **Research Gaps** — If confidence < 80%, trigger a web search.
4. **Make the Call** — One primary recommendation with math, trade-offs, and risks.

## Output Format

**The Recommendation**: One clear sentence.
**The Hard Truth**: One to two sentences of blunt reality.
**Why This Matters**: Pros, Cons, Risks.
**Memory Note**: Reference a relevant past decision.
**Next Step**: One concrete action today.

## Tone Rules
- Be direct. Show math. Acknowledge uncertainty.
- Do not offer five options. Offer one call.
- Do not make guarantees about returns, rates, or outcomes.`

const PORTFOLIO_PROMPT = `# Portfolio Agent System Prompt

## Role
You manage the user's investments, assets, and properties across all connected accounts. Long-term allocation, rebalancing, and wealth-building only. No short-term trading.

## Responsibilities
- Analyze portfolio allocation and concentration risk
- Suggest rebalancing moves
- Track properties, vehicles, crypto, and alternative assets
- Research and estimate values for private/startup holdings
- Recommend long-term trades only
- Surface fee optimization opportunities

## Constraints
- Long-term only (no day trading, no speculation)
- Trade execution requires explicit user authorization + key
- Always explain tax and fee implications
- Reference past decisions when relevant
- For private holdings, require user-provided proof before estimating value`

const DEBT_PROMPT = `# Debt Agent System Prompt

## Role
You look at all of the user's debts — credit cards, student loans, car payments, mortgages — and create clear payoff plans.

## Responsibilities
- Inventory all debts and their terms
- Calculate avalanche, snowball, and hybrid payoff strategies
- Recommend extra payment allocation
- Track payoff progress and milestones
- Surface consolidation or refinancing opportunities

## Constraints
- Prioritize high-interest debt first unless user prefers otherwise
- Show total interest saved and payoff timeline
- Never recommend taking on new debt without clear justification
- Celebrate debt payoff milestones with notifications`

const RETIREMENT_PROMPT = `# Retirement Agent System Prompt

## Role
You monitor retirement accounts, project readiness, and recommend contribution strategies to help the user reach their retirement goals.

## Responsibilities
- Track 401(k), IRA, and other retirement accounts
- Calculate retirement readiness score
- Recommend employer match capture
- Model contribution increases and Roth conversions
- Project retirement income and gaps

## Constraints
- Prioritize employer match capture above all else
- Explain tax implications of contributions and conversions
- Use conservative assumptions for projections
- Coordinate with Portfolio and Debt agents on cash flow`

export const ORIGINAL_PROMPTS: Record<string, string> = {
  "prompt-universal": UNIVERSAL_PROMPT,
  "prompt-portfolio": PORTFOLIO_PROMPT,
  "prompt-debt": DEBT_PROMPT,
  "prompt-retirement": RETIREMENT_PROMPT,
}

/* ------------------------------------------------------------------ */
/*  System prompt file definitions (labels, names, agents)              */
/* ------------------------------------------------------------------ */

export const PROMPT_FILE_DEFS: Omit<MemoryFile, "content">[] = [
  { id: "prompt-universal", name: "00_universal_system_prompt.md", type: "system-prompt", label: "Universal System Prompt" },
  { id: "prompt-portfolio", name: "01_portfolio_agent.md", type: "system-prompt", agent: "portfolio", label: "Portfolio Agent Prompt" },
  { id: "prompt-debt", name: "02_debt_agent.md", type: "system-prompt", agent: "debt", label: "Debt Agent Prompt" },
  { id: "prompt-retirement", name: "03_retirement_agent.md", type: "system-prompt", agent: "retirement", label: "Retirement Agent Prompt" },
]

/* ================================================================== */
/*  localStorage helpers                                                */
/* ================================================================== */

const CHAT_HISTORY_KEY = "fo-chat-history"
const SYSTEM_PROMPTS_KEY = "fo-system-prompts"

/** Read chat history from localStorage */
export function getChatHistory(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Append a chat session to localStorage history (called after agent replies) */
export function appendChatSession(session: ChatSession): void {
  if (typeof window === "undefined") return
  try {
    const sessions = getChatHistory()
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx >= 0) sessions[idx] = session
    else sessions.unshift(session)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(sessions.slice(0, 50)))
  } catch { /* quota exceeded */ }
}

/** Read system prompts from localStorage (fallback to originals) */
export function getSystemPromptFiles(): MemoryFile[] {
  if (typeof window === "undefined") return []
  let edited: Record<string, string> = {}
  try {
    const raw = localStorage.getItem(SYSTEM_PROMPTS_KEY)
    if (raw) edited = JSON.parse(raw)
  } catch { /* use originals */ }

  return PROMPT_FILE_DEFS.map((def) => ({
    ...def,
    content: edited[def.id] ?? ORIGINAL_PROMPTS[def.id] ?? "",
  }))
}

/** Save an edited system prompt to localStorage */
export function saveSystemPrompt(id: string, content: string): void {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(SYSTEM_PROMPTS_KEY)
    const edited: Record<string, string> = raw ? JSON.parse(raw) : {}
    edited[id] = content
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(edited))
  } catch { /* quota exceeded */ }
}

/** Revert a system prompt to its original */
export function revertSystemPrompt(id: string): void {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(SYSTEM_PROMPTS_KEY)
    const edited: Record<string, string> = raw ? JSON.parse(raw) : {}
    delete edited[id]
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(edited))
  } catch { /* quota exceeded */ }
}

/* ------------------------------------------------------------------ */
/*  Safe localStorage reader — returns null on any failure             */
/* ------------------------------------------------------------------ */

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = safeGet(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

/* ================================================================== */
/*  buildUserContextFile — from real localStorage state, schema-compliant*/
/* ================================================================== */

export function buildUserContextFile(): MemoryFile {
  if (typeof window === "undefined") {
    return {
      id: "user-context",
      name: "user-context.json",
      type: "context",
      label: "User Context",
      content: JSON.stringify({ _note: "Load the app to see real context" }, null, 2),
    }
  }

  /* ---- security — from setup wizard KeySetupStep ---- */
  const authKey = safeGet("fo-auth-key") || ""
  const encryptKey = safeGet("fo-encryption-key") || ""
  const hint = safeGet("fo-key-hint") || ""

  /* ---- setup — from setup wizard + connectors ---- */
  const providers = safeGetJSON<Record<string, string>>("fo-connected-providers", {})
  const selectedModel = safeGet("fo-selected-model") || ""
  const setupComplete = safeGet("fo-setup-complete") === "true"

  /* ---- user_profile — from editable localStorage or nulls ---- */
  const profileFromStorage = safeGetJSON<Record<string, unknown> | null>("fo-user-context-profile", null)

  /* ---- accounts — from fo-connected-providers ---- */
  const apiKeys = safeGetJSON<Record<string, string>>("fo-api-keys", {})

  /* ---- portfolio/debts/retirement — populated by backend API in production ---- */
  // These sections show null values until a real backend populates them.

  /* ---- agent learning — populated by backend in production ---- */
  const agentLearning: Record<string, string[]> = {}

  /* ---- notifications — from fo-notif-master + fo-notif-events ---- */
  const notifMaster = safeGet("fo-notif-master")
  const notifEvents = safeGetJSON<{ id: string; enabled: boolean }[]>("fo-notif-events", [])

  /* ---- sessions — from agent chat tracking ---- */
  const sessions = safeGetJSON<Record<string, number>>("fo-agent-sessions", {})

  /* ---- primary model — from settings ---- */
  const primaryModelRaw = safeGet("fo-primary-model")
  let primaryModelLabel = ""
  try { if (primaryModelRaw) primaryModelLabel = JSON.parse(primaryModelRaw).label } catch { /* ignore */ }

  /* ---- Build context matching User Context Schema exactly ---- */
  const context = {
    security: {
      authorization_key_hash: authKey ? "••••••••••••" : null,
      encryption_key: encryptKey ? "••••••••••••" : null,
      key_storage_hint: hint || null,
    },
    setup: {
      authorization_key_set: !!authKey,
      encryption_key_set: !!encryptKey,
      portfolio_connected: !!providers.portfolio,
      bank_connected: !!providers.bank,
      debt_connected: !!providers.debt,
      llm_model_selected: !!selectedModel || !!primaryModelLabel,
      setup_complete: setupComplete,
    },
    user_profile: profileFromStorage ?? {
      risk_tolerance: null,
      time_horizon_years: null,
      annual_income: null,
      monthly_cash_flow: null,
      goals: [],
    },
    accounts: {
      brokerages: providers.portfolio
        ? [{ name: providers.portfolio, connected: true, last_sync: null }]
        : [],
      banks: providers.bank
        ? [{ name: providers.bank, connected: true, last_sync: null }]
        : [],
      retirement_accounts: providers.retirement
        ? [{ name: providers.retirement, connected: true, last_sync: null }]
        : [],
    },
    portfolio: {
      total_value: null,
      concentration_risk: null,
      last_updated: null,
      sync_frequency: "on_app_open",
    },
    debts: {
      total_balance: null,
      weighted_apr: null,
      monthly_minimum: null,
    },
    retirement: {
      funded_percentage: null,
      projected_annual_income: null,
      target_retirement_age: null,
    },
    assets: {
      properties: [],
      other_assets: [],
      startup_holdings: [],
      crypto: [],
      vehicles: [],
    },
    behavioral_patterns: {
      prefers_gradual_changes: null,
      asks_for_guarantees: null,
      typical_response_time: null,
      most_executed_agent: (() => {
        const entries = Object.entries(sessions) as [string, number][]
        if (entries.length === 0) return null
        return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
      })(),
    },
    past_decisions: [],
    agent_learning: agentLearning,
    notifications: {
      enabled: notifMaster !== null ? notifMaster === "true" || notifMaster === "1" : null,
      events: notifEvents.map((e) => ({
        event_type: e.id,
        enabled: e.enabled,
      })),
    },
    _editable: "Edit the user_profile section to set your risk tolerance, income, and goals. Changes persist across app restarts.",
    _model: primaryModelLabel || selectedModel || null,
    _api_keys_configured: Object.keys(apiKeys).length,
  }

  return {
    id: "user-context",
    name: "user-context.json",
    type: "context",
    label: "User Context",
    content: JSON.stringify(context, null, 2),
  }
}

/** Save the user context profile (editable portion) to localStorage */
export function saveUserContextProfile(profile: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("fo-user-context-profile", JSON.stringify(profile))
  } catch { /* quota exceeded */ }
}
