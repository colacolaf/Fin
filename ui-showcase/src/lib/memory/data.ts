/* ================================================================== */
/*  Memory data — mock chat sessions, context, and system prompts      */
/*  Based on the memory-system.md design doc and real agent prompts.    */
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
/*  Chat sessions                                                       */
/* ------------------------------------------------------------------ */

export const chatSessions: ChatSession[] = [
  {
    id: "2026-07-13T14-32-00Z_portfolio-agent",
    agent: "portfolio",
    category: "Rebalancing",
    createdAt: "2026-07-13T14:32:00Z",
    updatedAt: "2026-07-13T14:35:00Z",
    messages: [
      { role: "user", content: "Should I rebalance my portfolio? My tech concentration feels too high.", timestamp: "2026-07-13T14:32:00Z" },
      { role: "assistant", content: "Your tech concentration is now 22% of your total portfolio value, up from 18% three months ago. That makes your portfolio 1.8x more volatile than the S&P 500. The math is clear: you should trim NVDA and rotate into broad-market ETFs.", timestamp: "2026-07-13T14:32:15Z" },
      { role: "user", content: "How much should I trim?", timestamp: "2026-07-13T14:33:00Z" },
      { role: "assistant", content: "Sell $4,200 of NVDA and buy $4,200 of VTI. This brings tech from 22% to 17%, within your target range of 15-20%. Tax impact: $380 in short-term gains if you sell the lots purchased in March. Long-term lots from last year would be $120 in gains.", timestamp: "2026-07-13T14:33:30Z" },
    ],
  },
  {
    id: "2026-07-13T15-00-00Z_debt-agent",
    agent: "debt",
    category: "Payoff Strategy",
    createdAt: "2026-07-13T15:00:00Z",
    updatedAt: "2026-07-13T15:08:00Z",
    messages: [
      { role: "user", content: "Pay off my credit card first or keep saving?", timestamp: "2026-07-13T15:00:00Z" },
      { role: "assistant", content: "Your Chase Sapphire has $3,800 at 22.49% APR. That costs you $71/month in interest alone. Every dollar sitting in savings earns 4.5% APY. The math: paying off the card is a guaranteed 22.49% return vs. a 4.5% return. Pay it off today.", timestamp: "2026-07-13T15:01:00Z" },
      { role: "user", content: "What about my student loans?", timestamp: "2026-07-13T15:03:00Z" },
      { role: "assistant", content: "Your federal student loans are at 5.5% — much lower than the credit card. Minimum payments are $280/month. After paying off the credit card, redirect that $280 + $200 extra toward the highest-rate student loan ($12,400 at 6.8%). That saves you $2,100 in interest over 3 years.", timestamp: "2026-07-13T15:04:30Z" },
      { role: "user", content: "And the car payment?", timestamp: "2026-07-13T15:06:00Z" },
      { role: "assistant", content: "Auto loan: $8,200 at 3.9% — your cheapest debt. Keep making minimum payments ($340/month). Invest the freed-up cash instead. At 7% average returns, you come out $1,400 ahead over the remaining 24-month term.", timestamp: "2026-07-13T15:07:00Z" },
    ],
  },
  {
    id: "2026-07-10T11-45-00Z_retirement-agent",
    agent: "retirement",
    category: "Contribution Strategy",
    createdAt: "2026-07-10T11:45:00Z",
    updatedAt: "2026-07-10T11:55:00Z",
    messages: [
      { role: "user", content: "Should I increase my 401(k) contribution?", timestamp: "2026-07-10T11:45:00Z" },
      { role: "assistant", content: "You are currently contributing 6% of your $95,000 salary ($5,700/year). Your employer matches 50% up to 6%, so you are capturing the full $2,850 match. Good. But your retirement readiness is only 68% funded.", timestamp: "2026-07-10T11:46:00Z" },
      { role: "user", content: "How much more should I contribute?", timestamp: "2026-07-10T11:48:00Z" },
      { role: "assistant", content: "Increase to 10% ($9,500/year). That is an extra $316/month. At 7% average returns, this adds $142,000 to your retirement by age 65. Your readiness score would jump from 68% to 79%. If you can stretch to 12%, you hit 85% — within striking distance of your goal.", timestamp: "2026-07-10T11:50:00Z" },
      { role: "user", content: "What about a Roth conversion?", timestamp: "2026-07-10T11:52:00Z" },
      { role: "assistant", content: "You have $42,000 in a traditional IRA. Converting $10,000 this year would cost roughly $2,200 in additional taxes (22% bracket). But that $10,000 grows tax-free forever. Over 30 years at 7%, that is $76,000 in tax-free growth. Worth it if you expect to be in a higher bracket in retirement.", timestamp: "2026-07-10T11:54:00Z" },
    ],
  },
  {
    id: "2026-07-08T09-15-00Z_portfolio-agent",
    agent: "portfolio",
    category: "Tax Optimization",
    createdAt: "2026-07-08T09:15:00Z",
    updatedAt: "2026-07-08T09:22:00Z",
    messages: [
      { role: "user", content: "Can I do any tax-loss harvesting before the end of the quarter?", timestamp: "2026-07-08T09:15:00Z" },
      { role: "assistant", content: "Yes. You have two positions with unrealized losses: INTC (-$1,200) and PYPL (-$800). Selling both and replacing with similar (but not substantially identical) ETFs like SMH and ARKF would harvest $2,000 in losses. That offsets $2,000 of your NVDA gains from last month, saving you roughly $440 in taxes.", timestamp: "2026-07-08T09:16:30Z" },
      { role: "user", content: "What are the wash sale rules I need to watch out for?", timestamp: "2026-07-08T09:18:00Z" },
      { role: "assistant", content: "Do not buy back the same security within 30 days before or after the sale. That means no INTC or PYPL purchases until August 8. The ETF replacements (SMH, ARKF) are different enough to avoid the wash sale rule. Set a calendar reminder for August 9 if you want to re-enter those positions.", timestamp: "2026-07-08T09:20:00Z" },
    ],
  },
  {
    id: "2026-07-05T16-20-00Z_debt-agent",
    agent: "debt",
    category: "Refinancing",
    createdAt: "2026-07-05T16:20:00Z",
    updatedAt: "2026-07-05T16:28:00Z",
    messages: [
      { role: "user", content: "Should I refinance my mortgage? Rates have dropped.", timestamp: "2026-07-05T16:20:00Z" },
      { role: "assistant", content: "Your current mortgage: $285,000 at 6.75%, 28 years remaining. Current market rate: 5.9%. Refinancing to 5.9% would save you $185/month ($2,220/year). Closing costs are roughly $4,500. Break-even: 24 months. If you plan to stay 3+ years, refinance.", timestamp: "2026-07-05T16:22:00Z" },
    ],
  },
  {
    id: "2026-07-02T10-00-00Z_retirement-agent",
    agent: "retirement",
    category: "Employer Match",
    createdAt: "2026-07-02T10:00:00Z",
    updatedAt: "2026-07-02T10:06:00Z",
    messages: [
      { role: "user", content: "Am I getting the full employer match?", timestamp: "2026-07-02T10:00:00Z" },
      { role: "assistant", content: "Yes. Your employer matches 50% of contributions up to 6% of salary. You contribute 6% ($5,700/year), so the match is $2,850/year. That is free money you are already capturing. If you increase to 10%, the match stays at $2,850 (the cap does not change), but your own contributions grow to $9,500/year.", timestamp: "2026-07-02T10:02:00Z" },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Context file                                                        */
/* ------------------------------------------------------------------ */

export const userContextFile: MemoryFile = {
  id: "user-context",
  name: "user-context.json",
  type: "context",
  label: "User Context",
  content: JSON.stringify(
    {
      security: {
        authorization_key_hash: "●●●●●●●●●●●●",
        encryption_key: "●●●●●●●●●●●●",
        key_storage_hint: "1Password vault",
      },
      setup: {
        authorization_key_set: true,
        encryption_key_set: true,
        portfolio_connected: true,
        bank_connected: true,
        debt_connected: true,
        llm_model_selected: true,
        setup_complete: true,
      },
      user_profile: {
        risk_tolerance: "balanced",
        time_horizon_years: 25,
        annual_income: 95000,
        monthly_cash_flow: 2400,
        goals: [
          { type: "retirement", target_amount: 1200000, target_date: "2051-01-01" },
          { type: "emergency_fund", target_amount: 25000, target_date: "2026-12-31" },
        ],
      },
      portfolio: {
        total_value: 124500,
        concentration_risk: "medium",
        last_updated: "2026-07-13T14:00:00Z",
      },
      debts: {
        total_balance: 42300,
        weighted_apr: 8.2,
        monthly_minimum: 980,
      },
      retirement: {
        funded_percentage: 68,
        projected_annual_income: 48000,
        target_retirement_age: 65,
      },
    },
    null,
    2
  ),
}

/* ------------------------------------------------------------------ */
/*  System prompts                                                      */
/* ------------------------------------------------------------------ */

export const systemPromptFiles: MemoryFile[] = [
  {
    id: "prompt-universal",
    name: "00_universal_system_prompt.md",
    type: "system-prompt",
    label: "Universal System Prompt",
    content: `# Universal System Prompt

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
- Do not make guarantees about returns, rates, or outcomes.`,
  },
  {
    id: "prompt-portfolio",
    name: "01_portfolio_agent.md",
    type: "system-prompt",
    agent: "portfolio",
    label: "Portfolio Agent Prompt",
    content: `# Portfolio Agent System Prompt

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
- For private holdings, require user-provided proof before estimating value`,
  },
  {
    id: "prompt-debt",
    name: "02_debt_agent.md",
    type: "system-prompt",
    agent: "debt",
    label: "Debt Agent Prompt",
    content: `# Debt Agent System Prompt

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
- Celebrate debt payoff milestones with notifications`,
  },
  {
    id: "prompt-retirement",
    name: "03_retirement_agent.md",
    type: "system-prompt",
    agent: "retirement",
    label: "Retirement Agent Prompt",
    content: `# Retirement Agent System Prompt

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
- Coordinate with Portfolio and Debt agents on cash flow`,
  },
]

/* ------------------------------------------------------------------ */
/*  Combined file list for the tree                                     */
/* ------------------------------------------------------------------ */

export const allMemoryFiles: MemoryFile[] = [userContextFile, ...systemPromptFiles]
