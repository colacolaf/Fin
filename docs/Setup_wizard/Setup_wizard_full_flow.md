# FIN SETUP WIZARD — FULL USER FLOW
**Version**: 1.0 | **Purpose**: Complete step-by-step onboarding journey for new Fin users | **Last Updated**: July 2026

---

## OVERVIEW

The Setup Wizard is the first thing a new user sees after creating their account. It walks them through understanding Fin, configuring their financial profile, optionally connecting external APIs, and setting agent behavior preferences. The wizard populates the User Context File (`user_context_file_schema`) so agents can personalize recommendations from day one.

**Design principles:**
- One unified flow — user completes all agents' basics in one pass
- Friendly but clear tone — warm without being fluffy
- Every form field maps directly to a User Context File field
- All API connections are optional (user can skip and add later)
- Simplicity first — no overwhelming detail, progressive disclosure

**Total time to complete:** ~5–8 minutes
**Total steps:** 5 (plus intro/outro)

---

## STEP 0: WELCOME — "WHAT IS FIN?"

### Purpose
Introduce Fin at a mid-level depth: what it is, how agents work, privacy guarantees, and what the user is about to set up.

### Screen Content

**Header:** "Welcome to Fin"  
**Subheader:** "Your private financial intelligence, running locally on your machine."

**Three explainer cards (horizontal, tappable/swipeable on mobile):**

#### Card 1: "What Fin Does"
- Fin is an AI-powered financial assistant that helps you make smarter decisions about your money.
- Three specialized agents work together: Investment, Debt, and Retirement.
- Each agent analyzes your financial data, gives you personalized recommendations with confidence scores, and learns from your decisions over time.
- You stay in control — Fin suggests, you decide. Fin never auto-executes trades.

#### Card 2: "How Agents Work"
- Agents use the **C.O.R.E. framework**: Clarify your goals → Organize your data → Reason through options → Explain recommendations clearly.
- Every recommendation comes with a confidence score (0–100%), reasoning, and before/after impact.
- You vote on each recommendation: Accept, Reject, or "Tell me more."
- Agents remember your patterns — if you tend to prefer gradual changes, they adapt.

#### Card 3: "Your Data Stays Private"
- Fin runs entirely on your machine. Your financial data never leaves your computer.
- API credentials are encrypted at rest (AES-256). Agents process everything locally via Ollama.
- No cloud storage, no third-party access, no data sharing.
- You can choose different security and permission modes for each agent (set up in Step 4).

**Bottom:** "Let's get your financial world in order. This takes about 5 minutes."

**CTA Button:** "Get Started →"

### User Context Fields Populated
- `context_version`: set to 1
- `last_updated`: current timestamp

---

## STEP 1: YOUR PROFILE

### Purpose
Capture the essential personal and financial details that every agent needs to give relevant recommendations. These fields map directly to `user_profile` in the User Context File.

### Screen Content

**Header:** "Tell us about yourself"  
**Subheader:** "This helps agents understand your financial situation. Everything stays private."

#### Form Fields (in order)

| # | Field | Type | Required | Maps To | Help Text |
|---|-------|------|----------|----------|-----------|
| 1 | **Age** | Number input | ✅ Yes | `user_profile.age` | "Used for retirement projections and risk calculations" |
| 2 | **Annual Income (Gross)** | Currency input ($) | ✅ Yes | `user_profile.annual_income_gross` | "Before taxes. Helps agents calculate debt-to-income ratio and savings capacity" |
| 3 | **Employment Status** | Dropdown select | ✅ Yes | `user_profile.employment_status` | Options: W-2 Employee, Self-Employed (1099), Retired, Student, Other |
| 4 | **Location (State)** | Dropdown select | ⬜ Optional | `user_profile.location` | "Affects state tax calculations. US states + 'Outside US'" |
| 5 | **Federal Tax Bracket** | Slider or dropdown | ⬜ Optional | `user_profile.tax_bracket_federal` | "Estimate: 10%–37%. Don't worry if you're not sure — agents can work with estimates." |
| 6 | **State Tax Bracket** | Slider or dropdown | ⬜ Optional | `user_profile.tax_bracket_state` | "If you know it. Otherwise leave blank." (only shown if state selected) |
| 7 | **Risk Tolerance** | Visual slider with labels | ✅ Yes | `user_profile.risk_tolerance` | Preset options: **Conservative** (more bonds, less volatility), **Balanced** (mix of growth and stability), **Growth** (mostly stocks, comfortable with swings), **Aggressive** (maximum growth, high volatility tolerance) |
| 8 | **Primary Time Horizon** | Text field or dropdown | ✅ Yes | `user_profile.time_horizon_primary` | "What's your main investing timeline? e.g., '15 years to retirement', '5 years for house down payment'" |

#### Smart Defaults
- If user enters age < 30, risk tolerance auto-suggests "Growth"
- If age 30–50, auto-suggests "Balanced"
- If age 50+, auto-suggests "Conservative"
- User can always override

#### Income Estimation
- After gross income is entered, show estimated after-tax income inline: "Estimated take-home: ~$XX,XXX/year (based on your tax bracket)"
- Maps to `user_profile.annual_income_after_tax`

**Progress indicator:** Step 1 of 5  
**CTA Button:** "Continue →"  
**Back button:** ← (returns to Welcome)

---

## STEP 2: YOUR FINANCIAL GOALS

### Purpose
Define what the user is working toward. Goals help agents prioritize recommendations (e.g., "house fund in 3 years" means keep money in safer assets).

### Screen Content

**Header:** "What are you working toward?"  
**Subheader:** "You can add up to 5 goals. Agents use these to tailor every recommendation."

#### Goal Card (repeatable — user can add multiple)

Each goal has:
| Field | Type | Required | Maps To |
|-------|------|----------|---------|
| **Goal Name** | Text input (preset options available) | ✅ | `financial_goals[].name` |
| **Target Amount** | Currency input ($) | ⬜ Optional | `financial_goals[].target_amount` |
| **Target Date** | Date picker | ⬜ Optional | `financial_goals[].target_date` |
| **Priority** | High / Medium / Low toggle | ✅ | `financial_goals[].priority` |

#### Preset Goal Templates (quick-add buttons)
- 🏠 "Buy a house" — suggests target date ~3–5 years out
- 💼 "Retire comfortably" — suggests target date at age 65
- 🚗 "Pay off debt" — priority auto-set to High
- 📚 "Build emergency fund" — suggests $10k–$30k target
- ✏️ "Custom goal"

#### Goal Status
- Goals start with status `"not_started"` or `"in_progress"`
- Agents will update status to `"on_track_X%"` or `"at_risk"` after analyzing portfolio/debt data

**Progress indicator:** Step 2 of 5  
**CTA Button:** "Continue →" (disabled if no goals added)  
**Skip link:** "I'll add goals later" (creates one default goal: "General financial growth")

---

## STEP 3: CONNECT YOUR ACCOUNTS (OPTIONAL)

### Purpose
Let users optionally connect external APIs. All connections are optional — users can skip entirely and add later from the sidebar. Connecting APIs dramatically improves agent recommendation quality.

### Screen Content

**Header:** "Connect your financial accounts"  
**Subheader:** "Optional — but highly recommended. Connected accounts let agents see your real portfolio, debts, and market data. You can skip and add these later."

#### Three Connector Cards (side-by-side on desktop, stacked on mobile)

---

#### Card A: Alpaca (Investment Agent)
| Property | Detail |
|----------|--------|
| **What it does** | Pulls your real stock/ETF holdings, cost basis, and portfolio value |
| **Agent impact** | Investment Agent can see exact positions and give precise rebalancing recommendations |
| **Data pulled** | Holdings, tickers, shares, cost basis, current prices, unrealized gains/losses |
| **Setup** | Enter Alpaca API Key + Secret Key (or OAuth redirect) |
| **Status after connection** | "✅ Connected — Found 6 holdings worth $225,000" |
| **Maps to** | `portfolio.holdings[]`, `portfolio.total_value`, `portfolio.asset_allocation`, `portfolio.sector_allocation` |

**Fields for Alpaca connection:**
- API Key (masked input)
- Secret Key (masked input)
- "Test Connection" button → shows success/failure + holdings count summary
- "Connected" badge when successful

---

#### Card B: Plaid (Debt Agent)
| Property | Detail |
|----------|--------|
| **What it does** | Links your bank accounts and credit cards to pull debt balances, interest rates, and payment history |
| **Agent impact** | Debt Agent can see exact debts and give precise payoff strategies |
| **Data pulled** | Debt types, balances, interest rates, minimum payments, creditor names |
| **Setup** | Plaid OAuth flow (redirect to Plaid, select bank, authorize) |
| **Status after connection** | "✅ Connected — Found 3 accounts, $50,000 total debt" |
| **Maps to** | `debts.debts[]`, `debts.total_balance`, `debts.monthly_payment_obligation`, `debts.weighted_average_interest_rate` |

**Fields for Plaid connection:**
- "Connect with Plaid" button (launches OAuth)
- Institution selector (bank/credit union search)
- Credentials handled entirely by Plaid (Fin never sees bank login)
- "Connected" badge when successful

---

#### Card C: Finnhub (Research Agent)
| Property | Detail |
|----------|--------|
| **What it does** | Provides live market data, stock fundamentals, news, and sector performance |
| **Agent impact** | Research Agent can pull real-time data for stock research and market context |
| **Data pulled** | Real-time quotes, company fundamentals (P/E, market cap), news sentiment |
| **Setup** | Enter Finnhub API Key |
| **Status after connection** | "✅ Connected — Live market data active" |
| **Maps to** | Enables web search and live data for all agents (indirectly improves `confidence` scores) |

**Fields for Finnhub connection:**
- API Key (masked input)
- "Test Connection" button
- "Connected" badge when successful

---

#### Connection Status Summary
At the bottom of the step, show a summary:
- "0 of 3 connected — agents will work with what you tell them manually"
- "2 of 3 connected — Investment and Debt agents have live data. Research will use web estimates."
- "3 of 3 connected — All agents operating with live financial data. 🎉"

**Progress indicator:** Step 3 of 5  
**CTA Button:** "Continue →" (always enabled — connections are optional)  
**Skip link:** "Skip for now — I'll connect accounts later"

---

## STEP 4: AGENT MODES & PERMISSIONS

### Purpose
Let users configure how much power and autonomy each agent has. This covers thinking depth, trading permissions, and data access levels — what you called "security modes."

### Screen Content

**Header:** "How should your agents behave?"  
**Subheader:** "Set the thinking depth, permissions, and data access for each agent. You can change these anytime from Settings."

#### Three Agent Configuration Cards (one per agent)

---

#### Card: Investment Agent 🏦
| Setting | Type | Options | Default | What it means |
|---------|------|---------|---------|---------------|
| **Thinking Depth** | Slider/select | Low / Medium / High / Extreme | Medium | Low = quick surface analysis. Medium = balanced reasoning. High = deep multi-angle analysis. Extreme = exhaustive Monte Carlo + web research (slower, most thorough). Affects Ollama inference time and response detail. |
| **Recommendation Autonomy** | Toggle/select | "Suggest only" / "Suggest + Notify" / "Suggest + Simulate" | "Suggest only" | How proactive the agent is. "Suggest only" = only when you ask. "Suggest + Notify" = agent alerts you when it detects opportunities. "Suggest + Simulate" = agent runs dry-run simulations and presents ready-to-review plans. |
| **Trading Permissions** | Select | "View-only (no trading)" / "Paper trading (simulated)" / "Read-only API (can see orders, can't place)" | "View-only" | What the agent can do with your brokerage. Fin never auto-executes real trades. Paper trading lets the agent simulate trades for learning. |
| **Data Access** | Checkboxes | ☑ Portfolio holdings, ☑ Cost basis, ☑ Transaction history, ☐ Order placement (disabled) | Holdings + Cost basis | What data the agent can read from your connected accounts. |
| **Web Search** | Toggle | On / Off | On | Whether agent can search the web for market context. Off = agent uses only your local data. |

---

#### Card: Debt Agent 💳
| Setting | Type | Options | Default | What it means |
|---------|------|---------|---------|---------------|
| **Thinking Depth** | Slider/select | Low / Medium / High / Extreme | Medium | Same scale as Investment Agent. Debt payoff math is straightforward (avalanche vs. snowball), so Medium is usually sufficient. |
| **Recommendation Autonomy** | Toggle/select | "Suggest only" / "Suggest + Notify" / "Suggest + Simulate" | "Suggest + Notify" | Debt agent is slightly more proactive by default since debt payoff opportunities are time-sensitive. |
| **Debt Data Access** | Checkboxes | ☑ All debts (balances + rates), ☑ Payment history, ☑ Income verification (for DTI), ☐ Bank transaction detail | All debts + Payment history | What debt/payment data the agent can see. |
| **Consolidation Suggestions** | Toggle | On / Off | On | Whether agent can suggest balance transfers, consolidation loans, or refinancing options. |
| **Spending Analysis** | Toggle | On / Off | Off | Whether agent analyzes spending patterns to find extra payoff capacity. Off by default for privacy. |

---

#### Card: Retirement Agent 📅
| Setting | Type | Options | Default | What it means |
|---------|------|---------|---------|---------------|
| **Thinking Depth** | Slider/select | Low / Medium / High / Extreme | Medium | Retirement projections benefit from High/Extreme (Monte Carlo simulations). Medium is good for straightforward contribution advice. |
| **Recommendation Autonomy** | Toggle/select | "Suggest only" / "Suggest + Notify" / "Suggest + Simulate" | "Suggest + Notify" | Employer match capture and contribution changes are time-sensitive — slightly proactive default. |
| **Account Access** | Checkboxes | ☑ 401(k) balance + allocation, ☑ IRA balance + allocation, ☑ Contribution rates, ☑ Employer match details | All account data | What retirement account data the agent can see. |
| **Projection Detail** | Select | "Simple (linear)" / "Moderate (historical returns)" / "Advanced (Monte Carlo)" | "Moderate" | How sophisticated the retirement projections are. Advanced uses 10,000 simulations for probability-based forecasts. |
| **Social Security Estimator** | Toggle | On / Off | On | Whether agent includes estimated Social Security in retirement projections. |

---

#### Global Agent Settings
| Setting | Type | Options | Default | What it means |
|---------|------|---------|---------|---------------|
| **Cross-Agent Learning** | Toggle | On / Off | On | When on, agents share insights. e.g., Debt Agent sees Investment Agent's decisions and adapts. |
| **Notification Preference** | Select | "In-app only" / "In-app + Email" / "None" | "In-app only" | How you receive agent alerts and recommendation summaries. |
| **Auto-Logout (Inactivity)** | Select | "15 minutes" / "30 minutes" / "1 hour" / "Never" | "30 minutes" | Security auto-logout timer. |

**Progress indicator:** Step 4 of 5  
**CTA Button:** "Continue →"  
**Back button:** ←

---

## STEP 5: REVIEW & LAUNCH

### Purpose
Show the user everything they've configured in one summary view. Let them go back and edit anything before finishing.

### Screen Content

**Header:** "You're all set. Ready to dive in?"  
**Subheader:** "Review your setup below. You can change anything later from Settings."

#### Summary Sections (collapsible/expandable)

**📋 Profile Summary**
- Age, Income, Employment, Tax Brackets, Risk Tolerance
- "Edit" link → jumps back to Step 1

**🎯 Goals**
- List of goals with target amounts, dates, priorities
- "Edit" link → jumps back to Step 2

**🔌 Connected Accounts**
- Alpaca: ✅ Connected (6 holdings) or ⬜ Not connected
- Plaid: ✅ Connected (3 accounts) or ⬜ Not connected
- Finnhub: ✅ Connected or ⬜ Not connected
- "Edit" link → jumps back to Step 3

**⚙️ Agent Configuration**
- Investment Agent: Medium thinking, Suggest only, View-only
- Debt Agent: Medium thinking, Suggest + Notify, Full debt access
- Retirement Agent: Medium thinking, Suggest + Notify, Moderate projections
- "Edit" link → jumps back to Step 4

#### What Happens Next (info box)
Three things that happen when you click "Launch Fin":
1. Your User Context File is created using everything you entered
2. If you connected Alpaca/Plaid, agents pull your live data immediately
3. Your homepage loads showing all three agent "fins" ready for your first interaction

**CTA Button:** "Launch Fin 🌊"  
**Back button:** ← (returns to Step 4)

---

## POST-WIZARD: FIRST LANDING EXPERIENCE

After clicking "Launch Fin," the user arrives at the main dashboard. Here's what they see:

### Homepage Layout
- **Ocean-inspired calm aesthetic** — spacious, soothing, clean (no specific mandatory colors; design should feel like a calm ocean surface)
- Three "fin" cards visible (Investment, Debt, Retirement) — each agent is a distinct card on the water-like surface
- A **left sidebar** (persistent, collapsible — like ChatGPT/Codex/Cursor) with navigation items:
  - 🏠 Home (current)
  - 📊 Analytics (overall)
  - ⚙️ Settings
  - 🔌 Connectors
  - 📚 Documentation / Help

### Agent Cards on Homepage
Each agent card shows:
- Agent name and icon
- Quick status: "Ready" / "3 pending recommendations" / "Connected to Alpaca"
- Mini confidence indicator (dot: green/yellow/red based on data quality)
- Hover reveals: last active time, confidence score, tool calling status, memory usage summary
- Click takes user into that agent's full interface

### Analytics Sidebar Section
When user clicks "📊 Analytics" in the left sidebar:
- Overall agent health: confidence score trends, recommendation acceptance rate, execution rate
- Per-agent breakdown: investment decisions, debt payoff progress, retirement funding %
- Data freshness indicators (when portfolio/debts were last synced)
- Agent activity log (recent recommendations, tool calls, memory updates)

---

## APPENDIX: FIELD-TO-CONTEXT MAPPING

Complete mapping of Setup Wizard fields → User Context File schema fields:

### Step 1 → `user_profile`
| Wizard Field | Context Path |
|-------------|-------------|
| Age | `user_profile.age` |
| Annual Income (Gross) | `user_profile.annual_income_gross` |
| Annual Income (After Tax) | `user_profile.annual_income_after_tax` (auto-calculated) |
| Employment Status | `user_profile.employment_status` |
| Location (State) | `user_profile.location` |
| Federal Tax Bracket | `user_profile.tax_bracket_federal` |
| State Tax Bracket | `user_profile.tax_bracket_state` |
| Risk Tolerance | `user_profile.risk_tolerance` |
| Time Horizon | `user_profile.time_horizon_primary` |

### Step 2 → `financial_goals`
| Wizard Field | Context Path |
|-------------|-------------|
| Goal Name | `financial_goals[].name` |
| Target Amount | `financial_goals[].target_amount` |
| Target Date | `financial_goals[].target_date` |
| Priority | `financial_goals[].priority` |
| (auto) | `financial_goals[].status` = `"not_started"` |
| (auto) | `financial_goals[].goal_id` = auto-generated UUID |

### Step 3 → `portfolio`, `debts`, data quality
| Connection | Context Path(s) Populated |
|-----------|--------------------------|
| Alpaca | `portfolio.*` (holdings, total_value, asset_allocation, sector_allocation, diversification_metrics) |
| Plaid | `debts.*` (debts array, total_balance, monthly_payment_obligation, weighted_average_interest_rate, debt_to_income_ratio) |
| Finnhub | Enables `web_search` tool for agents; improves confidence scores indirectly |
| None connected | `data_quality_flags` set appropriately (low_confidence_data populated) |

### Step 4 → agent behavior (stored in settings, not in User Context File)
| Setting | Storage |
|---------|---------|
| Thinking depth per agent | Agent settings config (database) |
| Recommendation autonomy | Agent settings config |
| Trading/data permissions | Agent settings config |
| Cross-agent learning | Global settings |
| Notification preferences | User preferences |
| Auto-logout timer | Session config |

---

## EDGE CASES & STATES

### Empty/First-Time States
- **No goals added:** One default goal created ("General financial growth") so agents have something to work with
- **No APIs connected:** Agents work with manually-entered data where possible; confidence scores will reflect lower data completeness
- **No debts:** Debt Agent card shows "No debts detected. Agent will activate when debts are added."
- **No retirement accounts:** Retirement Agent shows "Add retirement accounts to get started."

### Error States
- **API connection fails:** Show specific error ("Invalid API key", "Connection timeout", "Plaid link expired") with retry button
- **Ollama not running:** On wizard completion, check if Ollama is reachable. If not, show "Ollama is not running. Start it with `docker compose up ollama` or `ollama serve`."
- **Portfolio data stale:** If Alpaca sync fails after connection, flag with "Data sync failed. Agents will use last known data."

### Mid-Wizard Abandonment
- Wizard progress is saved after each step (localStorage or backend)
- If user closes and returns, they resume where they left off
- "Resume setup" prompt on next login if wizard incomplete

### Post-Wizard Editing
- All wizard settings are editable from the Settings and Connectors pages in the left sidebar
- Agent mode changes take effect immediately (no restart needed)
- Adding/removing API connections updates User Context File automatically

---

*End of Setup Wizard Full Flow*