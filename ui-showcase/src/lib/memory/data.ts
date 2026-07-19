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
const USER_CONTEXT_KEY = "fo-user-context"

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
    // Replace if same ID exists (upsert), otherwise prepend
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx >= 0) sessions[idx] = session
    else sessions.unshift(session)
    // Keep last 50 sessions
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

/** Build the user context file from real localStorage state */
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

  // Read real state from localStorage
  const authKey = localStorage.getItem("fo-auth-key") || ""
  const encryptKey = localStorage.getItem("fo-encryption-key") || ""
  const providersRaw = localStorage.getItem("fo-connected-providers")
  const providers: Record<string, string> = providersRaw ? JSON.parse(providersRaw) : {}
  const model = localStorage.getItem("fo-selected-model") || ""
  const primaryModel = localStorage.getItem("fo-primary-model")
  const modelLabel = primaryModel ? JSON.parse(primaryModel).label : ""
  const hint = localStorage.getItem("fo-key-hint") || ""
  const setupComplete = localStorage.getItem("fo-setup-complete") === "true"

  // Read sessions
  const sessionsRaw = localStorage.getItem("fo-agent-sessions")
  const sessions: Record<string, number> = sessionsRaw ? JSON.parse(sessionsRaw) : {}

  const userProfileRaw = localStorage.getItem("fo-user-context-profile")
  const userProfile = userProfileRaw
    ? JSON.parse(userProfileRaw)
    : { risk_tolerance: "balanced", time_horizon_years: 25, annual_income: 95000, monthly_cash_flow: 2400, goals: [] }

  const context = {
    security: {
      authorization_key_hash: authKey ? authKey.replace(/./g, "•") : "(not set)",
      encryption_key: encryptKey ? encryptKey.replace(/./g, "•") : "(not set)",
      key_storage_hint: hint || "(not set)",
    },
    setup: {
      authorization_key_set: !!authKey,
      encryption_key_set: !!encryptKey,
      portfolio_connected: !!providers.portfolio,
      bank_connected: !!providers.bank,
      debt_connected: !!providers.debt,
      llm_model_selected: !!model,
      setup_complete: setupComplete,
    },
    user_profile: userProfile,
    agents: {
      portfolio_sessions: sessions.portfolio ?? 0,
      debt_sessions: sessions.debt ?? 0,
      retirement_sessions: sessions.retirement ?? 0,
      current_model: modelLabel || (model || "(not set)"),
    },
    _editable: "Edit the user_profile section above. It persists across app restarts.",
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

/** Read the editable user profile from localStorage */
export function getUserContextProfile(): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem("fo-user-context-profile")
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
