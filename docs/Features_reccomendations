FIN Features Specification
Privacy-First, Multi-Agent Financial AI Assistant

RESEARCH-BACKED CONTEXT
Based on 2025-2026 financial behavior data:

79% of Americans find at least one financial topic intimidating (crypto, investing, budgeting)
Top financial priorities: Save more (66%), pay down debt (63%), build emergency fund (79%)
Biggest decision struggle: Debt vs. investing dilemma — people don't know if they should attack high-interest debt or invest for future
Key behavioral problem: Emotional decision-making drives portfolio drift (rebalancing helps only 34% of people actually stick to discipline)
Transparency demand: 72% of users say they need to understand why AI recommends something (not just what to do)
Execution gap: Most users get recommendations but never execute them — tracking follow-through is critical

Fin solves this by:

Making financial responsibility actionable (one agent at a time, not overwhelming)
Showing how and why trades/debt moves help with before/after impact
Tracking execution and learning from user behavior
Building systems (not stress) — turning anxiety into plans


CORE ARCHITECTURE: "OCEAN WITH FINS"
Visual Metaphor: Main dashboard as calm ocean surface, different agent "fins" users can dive into.
┌─────────────────────────────────────────┐
│  FIN: Your Financial Intelligence       │
│  (Ocean dashboard - calm, clear)        │
├─────────────────────────────────────────┤
│                                         │
│  ═════════════════════════════════════ │
│  Fin 1: Investment (Portfolio Mgmt)     │
│  ═════════════════════════════════════ │
│  Fin 2: Debt (Payoff Strategy)          │
│  ═════════════════════════════════════ │
│  Fin 3: Retirement (401k/IRA Planning)  │
│  ═════════════════════════════════════ │
│  Fin 4: Questions (Ad-hoc queries)      │
│  ═════════════════════════════════════ │
│  Fin 5: Research (Market/company data)  │
│  ═════════════════════════════════════ │
│  & Community (voting, shared insights)  │
│                                         │
└─────────────────────────────────────────┘

FEATURE ROADMAP
PHASE 1 (MVP): INVESTMENT AGENT + INFRASTRUCTURE
Goal: Build one agent perfectly before expanding. Prove the "ocean" metaphor works.
INVESTMENT AGENT FEATURES
1.1 Portfolio Dashboard

Real-time holdings display (connected to Alpaca API)

Ticker, shares, cost basis, current value, unrealized gain/loss
Asset class labels (stocks, ETFs, bonds, cash)
Last data sync timestamp
"Refresh Now" button (manual pull, hard-limited to prevent API abuse)


Diversification visualization

Sector allocation pie chart (Tech, Healthcare, Finance, etc.)
Asset class breakdown (stocks/ETFs: %, bonds: %, cash: %)
Geographic spread (US, International, Emerging Markets)
Top 10 holdings by weight
Concentration risk alerts (e.g., "NVDA is 22% of portfolio — high concentration risk")


Performance metrics

Total portfolio value and gain/loss (MTD, YTD, All-time)
Daily price change with % and $ amount
Volatility score (based on holdings' beta)
Annualized return estimate (if user has enough history)



1.2 Investment Agent Recommendations

Portfolio rebalancing recommendations

Agent analyzes: diversification drift, sector concentration, allocation vs. user's stated risk tolerance
Recommendation format: "Sell X shares of AAPL, buy Y shares of VTI to reduce tech overweight"
Confidence score (0-100): how strongly the agent believes in this move
Reasoning: "Your portfolio is 35% tech (target: 25%). Tech volatility is 1.8x market. Selling winners, buying diversifiers locks in discipline."
Before/after impact (detailed):

New allocation percentages
New sector distribution
Estimated diversification improvement (Herfindahl index)
Estimated volatility change
Tax implications (long-term vs. short-term cap gains, if known)
Fee impact (if any trading costs apply)
Performance projection (Monte Carlo: 10,000 simulations of next 5 years)


User can simulate on their account without voting (dry-run)


Tax-loss harvesting opportunities

Agent identifies positions with losses available for harvest
Recommendation: "Harvest $2,400 loss in COIN, replace with similar (GBTC or other crypto proxy)"
Tax impact: "$2,400 deduction vs. continued loss risk"
Confidence: varies (high if similar replacement exists, lower if unique position)


Fee optimization

Analyze holdings for hidden fees or high expense ratios
Recommendation: "Migrate from SCHX (0.04%) to VTI (0.03%) — saves ~$15/year on $50k portfolio"
Annual savings estimate


Dividend optimization

Identify dividend-paying positions
Opportunity: "You're in VTI (1.2% yield). Consider moving to SCHD (3.1% yield) for income focus"
Confidence depends on alignment with goals
Reinvestment vs. cash-out implications



1.3 Recommendation Voting & Execution Tracking

Vote Cards (accept/reject/review-later)

Clear title: "Rebalance tech overweight"
Confidence badge: "85% confidence"
3 buttons: "I'll do this" / "Not now" / "Tell me more"
Toggle: Show/hide full reasoning and impact projections


Custom feedback on votes

User can add notes: "Holding for tax reasons" / "Plan to execute this month" / "Don't trust tech index now"
Agents learn from feedback (stored for future iterations)
Users can rate recommendation quality: "Helpful" / "Off-target" / "Too aggressive"


Execution tracking

After user votes "I'll do this", show a checklist:

 Log into broker
 Execute trades (with link to recommendation details)
 Mark as "Executed" in Fin


"Execution due date" (optional): user can set a deadline
Reminders (if user opts in): "You accepted rebalancing recommendation 2 days ago — did you execute?"


Performance analytics on executed trades

Track which recommendations user actually executed
Compare pre-trade and post-trade portfolio metrics:

Diversification improvement (yes/no)
Performance (did portfolio outperform after trade?)
Volatility (did risk decrease as promised?)


Display: "You executed 3 recommendations this month. 2 improved diversification as expected. 1 reduced volatility by 1.2%."
Builds trust: "Agents are getting better at predicting outcomes"


Recommendation history

Sortable table: date, recommendation, confidence, user vote, execution status
Filter: "All" / "Accepted" / "Rejected" / "Executed" / "Pending"
Search: find old recommendations by ticker or type



1.4 Agent Memory & Conversation History

Persistent memory across sessions

Agent remembers user's:

Portfolio composition (updated daily)
Risk tolerance (set once, updateable)
Financial goals (e.g., "retire by 60 with $1.5M", "build house fund of $100k")
Past decisions (recommendations user accepted vs. rejected)
Execution patterns (fast executor vs. waits; prefers stability vs. growth)


Use memory to tailor future recommendations:

"You typically reject aggressive rebalancing; I'm suggesting a 3% shift instead of 7%"
"You executed the last 2 dividend recommendations quickly; I'm confident in this one"




Conversation view (optional, for power users)

Thread of agent interactions: "You asked about NVDA, I recommended trimming, you rejected it (noted)"
Agents can reference past conversations: "Last month you said you'd hold tech — portfolio has shifted more since then"
User can ask agent follow-up questions in chat interface (e.g., "Why not ETFs instead of individual stocks?")



1.5 Settings & Customization for Investment Agent

Risk tolerance slider

Visual scale: Conservative (20% stocks, 80% bonds) to Aggressive (95% stocks, 5% bonds)
Preset options: "Capital preservation" / "Balanced" / "Growth" / "Aggressive growth"
User's current allocation vs. risk target shown side-by-side
Help text: "Risk tolerance assumes 10+ year time horizon. Adjust if shorter."


Financial goals input

Time horizon: "Retire in 10 years with $1.5M"
Near-term goals: "Save $50k for house in 3 years"
Agent adapts recommendations based on goals
e.g., for house goal: "I recommend keeping $50k in cash/bonds for stability"


Rebalancing strategy selection

Option A: "Calendar-based — rebalance quarterly" (simple, automated mindset)
Option B: "Threshold-based — rebalance when drift > 5%" (disciplined, requires monitoring)
Option C: "Let agent decide" (agent monitors continuously, alerts when threshold hit)


Recommendation frequency

Daily (agent reviews portfolio, surfaces daily insights)
Weekly (one consolidated recommendation email/notification)
Monthly (most common; agent batches recommendations)
On-demand only (user requests analysis, doesn't auto-generate)


Confidence score threshold

User can set: "Only show me recommendations with 75%+ confidence"
Helps avoid low-conviction trades



1.6 Welcome/Onboarding Flow for Investment Fin

Step 1: Connect brokerage

"Link your Alpaca account to get started"
OAuth or API key input (encrypted, stored securely)
Verify connection: "Found 42 holdings across 5 asset classes"


Step 2: Set risk tolerance

Simple questionnaire: age, time horizon, comfort with volatility
Auto-suggest: "Based on your age (35) and goals, we suggest Balanced (60% stocks)"
User adjusts slider if desired


Step 3: Define goals

"What are you investing toward?" (retirement, house, just growth, etc.)
Time horizon for each goal
Target amount (if applicable)


Step 4: Review first recommendation

Agent generates initial analysis on existing portfolio
"Your portfolio is 35% concentrated in 3 stocks. Here's a rebalancing option..."
User can accept, reject, or "learn more"


Step 5: Set preferences

Recommendation frequency, confidence threshold, rebalancing strategy
Opt-in to notifications/reminders




PHASE 2 (POST-MVP): DEBT AGENT
DEBT AGENT FEATURES
2.1 Debt Dashboard

Debt inventory

Source: Plaid (auto-imported) or manual entry
For each debt: creditor, balance, interest rate, minimum payment, type (CC/student loan/personal loan)
Monthly payment obligation (sum of all minimums)
"Debt-free date" if following minimum payments (auto-calculated)


Debt analysis metrics

Total debt balance
Weighted average interest rate
Total interest paid in next 5 years (if minimum payments only)
Monthly cash flow tied up in debt service
Debt-to-income ratio (rough estimate based on Plaid income data if available)


Payoff strategy visualization

Waterfall chart showing payoff over time
Compare: Avalanche (highest interest first) vs. Snowball (smallest balance first)
Show which strategy saves more interest



2.2 Debt Payoff Recommendations

Optimal payoff strategy

Agent analyzes interest rates, balances, minimum payments
Recommendation: "Attack high-interest CC ($2,400 @ 22%) while minimum-paying student loan ($18k @ 4%). Saves $2,100 in interest vs. equal split."
Confidence score: high if clear rate differentials


Accelerated payoff plan

Recommendation: "Increase debt payment by $200/month → debt-free in 3 years (save $1,800 interest)"
Show cashflow impact: "Reduces monthly discretionary by $200, but eliminates debt sooner"
Alternative: "Put $200 extra toward high-interest CC; minimum on student loans → balanced approach"


Consolidation opportunities

If multiple CCs: "Consolidate 3 cards (avg 18% APR) into personal loan at 12% → saves $300/year"
Caveat: "Consolidation has $500 origination fee; breakeven in 20 months"
Agent doesn't execute; just flags opportunity for user research


Balance transfer analysis (for high-APR credit cards)

"Consider 0% APR balance transfer card (12-month offer). Transfer $5k @ 20% CC to 0% → interest savings $1,000"
Caution: "New card has $150 annual fee; net savings $850"


Income-driven student loan repayment

If Plaid provides income data: "Switch to income-based repayment → lower payment by $150/month"
Trade-off: "Total repayment increases (interest accrues longer), but improves short-term cash flow"
Agent flags trade-off; doesn't recommend without user alignment on goals



2.3 Debt vs. Investment Decision

The core dilemma: Should user pay debt faster or invest?

Agent analyzes: interest rate on debt vs. expected return on investments
Recommendation: "Your CC debt is 18% APR (guaranteed loss). Expected stock market return is 8-10%. Guaranteed win: attack CC debt first."
Alternative: "Student loan at 4% APR vs. expected 8% market return. Hybrid approach: minimum payments + extra into retirement account (401k/IRA)."


Confidence scoring

High confidence (>80%): Clear rate differential (CC debt vs. market returns)
Medium confidence (60-79%): Depends on user's tax situation and employer match
Low confidence (<60%): User's personal risk tolerance matters too much; agent provides both options


Employer 401(k) match consideration

"Your employer matches 50% up to 6%. That's a guaranteed 50% return. Prioritize capturing full match before attacking debt."
Agent factors this into debt vs. invest analysis



2.4 Tracking Debt Progress

Monthly debt payment log

User (or Plaid auto-sync) logs payment made
Compare vs. agent recommendation
If user overpays: "Good! You paid $500 (target $300). Accelerating payoff by 2 months."


Debt payoff milestones

"Credit card paid off!" celebration
Show updated metrics: remaining debt, new payoff date
Celebrate freed-up cash flow: "Freed $150/month — consider directing to high-yield savings or investment"


Interest saved tracking

Cumulative: "By following aggressive payoff plan, you've saved $340 vs. minimum payments"
Builds accountability and motivation



2.5 Welcome/Onboarding for Debt Fin

Step 1: Input debts (Plaid or manual)

Connect Plaid for auto-import, or manually enter each debt
Verify: balance, rate, minimum payment


Step 2: Goal setting

"When do you want to be debt-free?" (target date)
How much extra can you pay monthly? (if any)


Step 3: Review payoff strategy

Agent shows: avalanche vs. snowball, acceleration options
User selects preferred approach


Step 4: Set tracking preferences

Monthly payment reminders (optional)
Milestone celebrations
Frequency of strategy reassessment




PHASE 3 (EXTENDED): RETIREMENT AGENT
RETIREMENT AGENT FEATURES
3.1 Retirement Readiness Dashboard

Current retirement savings

Linked accounts: 401(k), IRA (Traditional/Roth), brokerage
Total balance and year-to-date contributions


Retirement readiness score

Simple formula: current savings vs. estimated need at target retirement age
Percentage to target: "55% funded for retirement at 65"
Color-coded: red (< 50%), yellow (50-75%), green (75%+)


Projected retirement income

Estimated Social Security (SSA data if available, or user input)
Projected portfolio income (4% rule: current balance × 0.04 / 12)
Any pension income (if applicable)
Total monthly retirement income estimate


Retirement gap analysis

Estimated retirement expenses (user input or estimate)
Shortfall or surplus
Recommendation: "You need $4,000/month. Currently on track for $2,200. Gap: $1,800/month."



3.2 Retirement Agent Recommendations

Contribution optimization

"Increase 401(k) to $500/month to capture full employer match ($250/month free money)"
Confidence: high (guaranteed return via match)
Tax benefit: "Contributes $500/month = ~$6,000/year tax deduction (saves ~$1,500 in taxes @ 25% bracket)"


Account type selection

"You have $50k in taxable brokerage. Consider Roth conversion → tax-free growth, withdraw tax-free in retirement"
Caveat: "Conversion triggers taxes now (~$12.5k owed in year of conversion), but saves $30k+ in future taxes"
Confidence depends on user's current tax bracket vs. projected retirement bracket


Asset allocation for retirement

Age-based: "At 45 with 20 years to retirement, 75% stocks / 25% bonds recommended"
Shows target allocation and current allocation
Recommendation: "Shift $10k from bonds to stocks to match 75/25 target"


Required Minimum Distribution (RMD) planning (age 72+)

Calculate RMD amount from 401(k), IRA
Flag: "You have $500k in Traditional IRA. Age 73 = $18,200 RMD required"
Strategy: "Consider Qualified Charitable Distribution (QCD) if charitably inclined — satisfies RMD tax-free"


Social Security optimization

Show break-even analysis: claim at 62 vs. 70
"Claiming at 62: $2,000/month × 360 months = $720k total"
"Claiming at 70: $2,800/month × 240 months = $672k total (if live to 85)"
Recommendation varies by health, life expectancy, need for immediate income



3.3 Welcome/Onboarding for Retirement Fin

Step 1: Link retirement accounts

401(k), IRA, brokerage


Step 2: Set retirement target

Target retirement age (e.g., 65)
Estimated annual expenses in retirement (e.g., $50k/year)
Current age, income


Step 3: Review current trajectory

Agent calculates: "On track (100%)" or "Underfunded (60%)"
Show gap and contribution needed to close it


Step 4: Explore optimization strategies

Employer match capture, Roth conversion, asset allocation
User selects which strategies to explore




PHASE 4 (EXTENDED): QUESTIONS AGENT (Ad-Hoc)
QUESTIONS AGENT FEATURES
4.1 Chat Interface

Free-form query capability

User asks questions: "Should I sell AAPL?" / "Is now a good time to rebalance?" / "What's dividend yield vs. capital appreciation?"
Agent responds with reasoning, not just answers
Stays within user's financial context (pulls holdings, debt, retirement goals)


Question routing

System detects topic: "investing", "debt", "retirement", "general finance"
Routes to appropriate agent or hybrid reasoning
Shows: "[Investment Agent] thinking..." or "[Debt + Retirement Agent analysis]"



4.2 Follow-up Conversation

Multi-turn dialogue

User: "Should I sell AAPL?" → Agent: "Depends on your goals. Tell me more about why you're considering it."
User: "It's overconcentrated and I'm nervous about tech" → Agent: "Understood. Here's your tech allocation..."
Back-and-forth until clarity reached



4.3 Market Research Integration

Pull live data for questions

"What's the dividend yield of VTI?" → Agents query Finnhub API
"Is TSLA expensive right now?" → Compare P/E to peers, historical average
"How's the tech sector performing?" → Show sector momentum, top gainers/losers




PHASE 5 (EXTENDED): RESEARCH AGENT (Market Data)
RESEARCH AGENT FEATURES
5.1 Company/Stock Research

Fundamental analysis

P/E ratio, dividend yield, market cap, 52-week range
Earnings growth, debt levels
Compare to peers and index benchmarks


Technical analysis (optional)

Price momentum (vs. 50/200-day moving average)
Volatility (beta)
Support/resistance levels (if user is technically inclined)


News & sentiment

Recent news headlines (from Finnhub API)
Sentiment score (positive, negative, neutral)
Agent summary: "NVDA released Q3 earnings today. Beat revenue expectations by 8%. Stock up 3%."



5.2 Sector & Index Research

Sector performance

YTD performance by sector (tech, healthcare, finance, etc.)
Which sectors are leading, lagging
Concentration risk: "Tech is 28% of S&P 500 (highest since dot-com era)"


Index tracking

S&P 500, Nasdaq, Russell 2000 metrics
Dividend yield by index
Performance comparison: user's portfolio vs. benchmarks



5.3 Economic Research

Macro data summaries (optional, for advanced users)

Inflation, interest rates, unemployment trends
Fed policy changes
Agent explains impact: "Higher rates → lower bond prices. Your portfolio is 20% bonds."




COMMUNITY VOTING & INSIGHTS
Community Hub Features
6.1 Public Recommendation Voting

Recommendation submissions

Each user can submit their own custom recommendations to public GitHub/database
Format: { recommendation_text, agent_reasoning, confidence_score, tag: investment|debt|retirement }
Example: "Dividend trap avoidance: avoid yields >6% in mature sectors (often unsustainable)"


Voting on community recommendations

Other Fin users vote: "Helpful" / "Misleading" / "Outdated"
Leaderboard: most-voted recommendations by category
Users can see: "5,234 users found this helpful"


Local ranking

Each user sees: "Most voted by your peers (similar risk profile / age)"
Personalized: filters recommendations by relevance to user's situation



6.2 Recommendation Insights

Trending strategies (across all users)

"70% of users with >$500k portfolios rebalanced quarterly (vs. 40% overall)"
"Users who accepted agent tax-loss harvesting recommendations saved avg. $2,100/year"
Privacy: no individual names, aggregated stats only


Success metrics

"Of users who executed [recommendation], 75% saw expected outcome within 6 months"
Builds confidence in agent recommendations



6.3 User-Submitted Strategies

Custom playbooks

Users can document their own strategies: "I'm using a 70/30 dividend strategy for retirement"
Others can: view, vote on, adapt for their own portfolio
Agents can learn from community strategies



6.4 Welcome for Community Hub

Opt-in privacy

User can choose: share anonymized recommendations (or stay private)
Explicit consent: "Share my voted recommendations for research purposes"
Data is aggregated, never identifies individual user




AUTHENTICATION & SECURITY
6.5 Account Setup & Login

Initial setup

Username/password (or passkey option for newer browsers)
Email (for password recovery, notifications)
Password strength requirements (NIST guidance: 16+ character minimum or passphrase)
Explicit security onboarding: "Your data never leaves this server. Only you can see your portfolio."


Session management

JWT-based tokens (httpOnly, secure flag, 1-hour expiry)
Refresh token (7-day expiry, used to issue new access token)
Auto-logout after 30 minutes of inactivity (configurable)


High-security operations

Any new API credential connection requires password re-entry
Reason: extra confirmation step for high-sensitivity changes


Encrypted credential storage

All API keys (Alpaca, Plaid, Finnhub) encrypted at rest (AES-256)
Decrypted only when needed for API calls (never logged, never shown to user after initial entry)
Rotation/revocation: user can disconnect any API account anytime



6.6 Consent & Disclaimers

Prominent disclaimer on login

"Fin is an AI tool, not financial advice. You are responsible for your financial decisions."
"Past performance ≠ future results. All recommendations carry risk."
"Tax implications vary by situation; consult a tax professional."
Checkbox: "I understand and accept these terms" (must check to proceed)


Recommendation disclaimer

Every recommendation displays: "This is an analysis suggestion, not financial advice. Do your own research."
Agents explicitly say: "I don't know your full financial picture or tax situation. Verify with a professional."


Data privacy statement

"Your financial data stays on this machine. We never send it to cloud services."
"API credentials are encrypted and used only to fetch your data."
"Community submissions are anonymized and aggregated."




MULTI-AGENT MEMORY & ORCHESTRATION
7.1 Persistent Cross-Session Memory

User profile storage (in database)

Risk tolerance, goals, constraints
Past decision history (what user accepted/rejected)
Execution patterns (fast vs. slow, aggressive vs. conservative)


Agent learning

Investment Agent: "User rejected aggressive rebalancing twice → suggest gentler moves (3% instead of 7%)"
Debt Agent: "User has prioritized CC payoff → align recommendations with aggressive CC focus"
Retirement Agent: "User is conservative → suggest stable allocations"


Cross-agent communication

When user accepts a debt payoff recommendation, Retirement Agent sees: "Cash flow freed up, consider directing $200/month to 401(k)"
Investment Agent may suggest: "With extra $200/month, consider dollar-cost averaging into equity ETFs"



7.2 Conversation Context

Stateful conversations

Agent remembers: "2 weeks ago you asked about NVDA. You decided to hold because of AI exposure bet. Has that thesis changed?"
Shows continuity and builds trust


Decision reasoning trail

Agent: "You rejected dividend-focused fund in Jan (said wanted growth, not income). Recommending it now because portfolio concentration changed."
Users appreciate: "Agent is paying attention, not just auto-generating noise."



7.3 Agent Orchestration Rules

When to recommend what

Investment Agent: active if portfolio balance > $5k, recommends monthly or when allocation drifts >5%
Debt Agent: active if user has debt, recommends after any major debt change or monthly
Retirement Agent: active if user has retirement accounts, recommends quarterly
Questions Agent: always available for ad-hoc queries
Research Agent: on-demand for specific company/sector research


Prioritization

If multiple recommendations available: show highest-confidence first
User can browse all or filter by agent/confidence/type




DATA & ANALYTICS
8.1 User Dashboard Analytics

Recommendations sent vs. accepted

"You received 12 recommendations this month. Accepted 4 (33% acceptance rate)."
Comparison: "Average user accepts 28% of recommendations."
Insight: User may be more conservative than average


Execution tracking

"Of 4 accepted recommendations, you executed 2 (50%)"
Breakdown: "1 tax-loss harvest, 1 rebalancing, 0 debt moves"


Performance impact of executed recommendations

"Diversification improved by 8% after rebalancing"
"Interest saved from debt payoff plan: $340"
"Captured $1,200 in employer 401(k) match by increasing contributions"


Agent accuracy metrics (user's view)

"Investment Agent's diversification recommendations: 75% matched expectation"
Helps user trust (or question) specific agents



8.2 Portfolio Metrics Over Time

Historical tracking

Total portfolio value (monthly snapshots)
Allocation drift (how far from target)
Volatility (rolling 30-day, 90-day, 1-year)
Performance vs. benchmark (S&P 500, custom)


Goal progress tracking

"House savings goal: $50k target, $30k saved (60%)"
"Retirement funded at 58% → will be 92% by target date (if continue current contributions)"
Projected outcomes shown as chart



8.3 Export & Reporting

Monthly summary report (optional)

PDF or email: recommendations sent, accepted, executed
Net impact: diversification, tax savings, performance
Next month's priority recommendations


Tax reporting (preliminary)

Gains/losses summary (for accountant)
Not tax advice; just data export
User responsible for verifying with tax professional




FRONTEND UX/UI PRINCIPLES
9.1 "Ocean" Visual Design

Color palette

Primary: deep ocean blue (#1a3a52)
Accent: silver/foam white (#e8f4f8) for highlights
Status colors: green (positive), orange (warning), red (loss/risk)
Neutral: light gray (#f5f5f5) for sections


Typography

Headlines: clean, sans-serif (Geist or Inter)
Body: readable, high contrast
Data: monospace for numbers/prices


Layout

Calm, spacious (lots of whitespace)
Fin tabs as horizontal nav (no deep menus)
Cards for individual recommendations
Smooth animations (no jank)



9.2 Mobile Responsiveness

Tablet layout

Sidebar nav (Fin list collapses at <768px)
Charts adapt (smaller, still readable)
Touch-friendly buttons (48px minimum)


Mobile layout

Full-screen single view (one fin at a time)
Bottom nav for fin switching
Swipe gestures for navigation
Charts use mobile-optimized library (recharts)



9.3 Accessibility

WCAG 2.1 AA compliance

Color contrast ratio ≥ 4.5:1 (text)
Keyboard navigation throughout
ARIA labels for charts and interactive elements
Alt text for all images


Reduced motion option

User can disable animations (prefers-reduced-motion)
Still functional, just less visual flourish




BACKEND API ENDPOINTS (SUMMARY)
9.4 Authentication

POST /auth/register — create account
POST /auth/login — get JWT token
POST /auth/logout — invalidate token
POST /auth/refresh — refresh access token

9.5 Portfolio Management

GET /api/holdings — user's current holdings
GET /api/holdings/{ticker} — details for one holding
POST /api/holdings/refresh — manual data refresh (rate-limited)
GET /api/allocation — sector/asset class breakdown
POST /api/allocation/sync — calculate new allocation based on current prices

9.6 Recommendations

GET /api/recommendations — all pending recommendations
GET /api/recommendations/{id} — details for one recommendation
POST /api/recommendations/{id}/vote — accept/reject + feedback
GET /api/recommendations/history — past recommendations and votes
POST /api/recommendations/simulate — simulate trade impact before voting

9.7 Execution Tracking

POST /api/executions/log — user marks recommendation as executed
GET /api/executions — log of executed recommendations
GET /api/executions/{id}/impact — measure actual impact of executed trade

9.8 Debt Management

POST /api/debts — add debt (manual or from Plaid)
GET /api/debts — list all debts
PUT /api/debts/{id} — update debt balance/rate
GET /api/debts/payoff-strategy — current optimal strategy
POST /api/debts/{id}/payment-log — log debt payment

9.9 Retirement Accounts

POST /api/retirement — link retirement account
GET /api/retirement — combined retirement account data
GET /api/retirement/readiness — funded percentage, gap analysis

9.10 API Connections

POST /api/integrations/alpaca — connect Alpaca (store encrypted key)
POST /api/integrations/plaid — link Plaid (OAuth)
POST /api/integrations/finnhub — set Finnhub API key
DELETE /api/integrations/{service} — disconnect service
GET /api/integrations/status — see which services are connected

9.11 Settings

PUT /api/settings/profile — update risk tolerance, goals, preferences
GET /api/settings/profile — get current settings
PUT /api/settings/agents — customize recommendation frequency, thresholds
GET /api/settings/agents — current agent settings

9.12 Community

GET /api/community/recommendations — public recommendations (anonymized)
POST /api/community/recommendations — submit own recommendation
POST /api/community/recommendations/{id}/vote — vote on community recommendation
GET /api/community/trending — trending strategies and insights
GET /api/community/leaderboard — most-voted recommendations by category


WELCOME EXPERIENCE
10.1 Onboarding Flow

Landing page → "What's Fin?" explainer (30 seconds)

Shows: "Your AI financial advisor, locally hosted, no cloud data, agents help you make confident decisions"
CTAs: "Create Account" or "Learn More"


Account creation → username, password, email

Security tips: password strength feedback


Initial agent selection → "Which financial challenge matters most right now?"

Options: "Optimize my portfolio" / "Pay down debt" / "Plan retirement" / "All of the above (let me explore)"
Routes to appropriate agent onboarding


Agent-specific onboarding → varies by choice

Investment: connect Alpaca, set risk tolerance, review first recommendation
Debt: input debts (Plaid or manual), see payoff options
Retirement: link accounts, set target age/expenses, see funding status


Preference setting → notification frequency, recommendation thresholds, etc.
Post-onboarding tour → interactive walkthrough

"Click here to see your portfolio"
"This is where recommendations appear"
"You can vote accept/reject on each one"
"Agents remember your decisions and improve"



10.2 In-App Guidance

Help tooltips (?) icons on confusing fields

"Risk tolerance: how much comfort do you have with portfolio swings?"
"Confidence score: how certain is the agent in this recommendation? (0-100%)"


Detailed documentation page

"How Fin works" (5 min read)
"FAQ" (common questions)
"Glossary" (financial terms)
"How agents make recommendations" (explainability)
"Privacy & security" (how data is protected)




DEPLOYMENT & INFRASTRUCTURE
11.1 Docker Compose

Services

backend: FastAPI (port 8000)
ollama: LLM inference (port 11434)
frontend: React app (port 3000, dev) or nginx (prod)
db: SQLite (persisted volume)


Volumes

/data: SQLite database file
/models: Ollama model storage (~7-13GB)
/config: .env file with API keys


Environment variables

ALPACA_API_KEY (user sets during onboarding)
PLAID_CLIENT_ID, PLAID_SECRET (optional, for Debt Agent)
FINNHUB_API_KEY (optional, for Research Agent)
JWT_SECRET (generated at first run)
DB_PATH (default: /data/fin.db)



11.2 One-Command Install
bashgit clone https://github.com/yourname/fin.git
cd fin
docker compose up
# → Navigate to localhost:3000
# → Create account
# → Connect broker
# → Start getting recommendations
11.3 Post-Install

Docker Compose automatically:

Downloads Ollama (if not cached)
Downloads LLM model (Mistral 7B or Llama 2, ~5-7 GB)
Initializes SQLite database
Starts all services


First run: "Downloading models, this may take 5-10 minutes..."


GLOSSARY OF FEATURES BY PRIORITY
Must Have (MVP)

 Investment Agent with basic recommendations (rebalancing, concentration)
 Portfolio dashboard (holdings, allocation, diversification)
 Vote on recommendations (accept/reject + feedback)
 Execution tracking (user marks as done)
 Local LLM (Ollama + Mistral 7B)
 Alpaca API integration
 Secure authentication (JWT, password hashing)
 Docker Compose deployment
 Welcome onboarding flow
 Recommendations history/log
 Basic analytics (acceptance rate, execution rate)

Should Have (Phase 1 Extensions)

 Tax-loss harvesting recommendations
 Portfolio simulation before voting
 Performance tracking of executed trades
 Agent memory across sessions
 Mobile-responsive design
 Detailed recommendation reasoning
 Confidence scoring on recommendations

Nice to Have (Phase 2+)

 Debt Agent (full-featured)
 Retirement Agent (full-featured)
 Questions Agent (chat interface)
 Research Agent (market data)
 Community voting hub
 Plaid integration for banking data
 Finnhub integration for research
 Multi-broker support (Fidelity, E*Trade)
 Email/SMS notifications
 Advanced analytics (Monte Carlo simulations, tax projections)
 Tax reporting export
 Dark mode UI
 Webhook support (broker API pushes)


SUCCESS METRICS
User Engagement

DAU (Daily Active Users): target 60%+ over 3 months
Recommendation acceptance rate: target 30%+ (users who accept at least 1 recommendation)
Execution rate: target 50%+ (of accepted recommendations, users execute at least 1)
Feature adoption: target 80%+ (users visit Investment tab, 40% visit Debt tab)

Agent Quality

Recommendation confidence accuracy: >70% of high-confidence recommendations achieve intended outcome
User feedback: >80% of executed recommendations rated "helpful"
Memory effectiveness: users report agent understands their preferences better after 5 interactions

Privacy & Trust

Zero data breaches (target: 100%)
User trust score (survey): target 8/10+
Privacy complaints: target 0

Retention

Monthly churn rate: <10%
Return rate (users who come back after 1 month): >50%


EXAMPLE USER JOURNEYS
Journey 1: Portfolio Rebalancing (Investment)

User opens Fin → Portfolio tab shows: "Your tech allocation is 35% (target 25%)"
Clicks "Get Recommendations" → Agent analyzes, suggests: "Sell $5k NVDA, buy $5k VTI"
Confidence: 82%, Reasoning shown with before/after impact
User clicks "Simulate" → sees projected allocation, fees, tax impact
User votes "I'll do this" → adds note "Will execute this weekend"
Reminder 2 days later: "You accepted rebalancing. Did you execute?"
User logs trade in broker, comes back to Fin, marks "Executed"
30 days later: "Your diversification improved 8% as expected. Agent's next recommendation confidence increased."

Journey 2: Debt Payoff Decision (Debt + Investment)

User opens Fin → Debt tab shows: "$2,400 CC @ 22%, $18k student loan @ 4%"
Debt Agent recommends: "Attack CC first (guaranteed 22% return). Student loan can wait."
Investment Agent offers alternative: "If you're risk-tolerant, invest in 401(k) (capture 50% match = 50% return), pay CC minimally"
User sees both options, votes to follow Investment Agent's hybrid approach
Confirms: paying $200 extra to CC, $200 extra to 401(k)
Debt Agent tracks: "CC payoff accelerated by 6 months"
Retirement Agent tracks: "Increased 401(k) contributions will fund 15% of retirement goal"
6 months later, portfolio shows: "CC balance $1,200, 401(k) up $2,400, freed up $200/month after CC paid off"

Journey 3: One-Time Question (Questions Agent)

User has NVIDIA at $8k, stock up 40% this year
Asks: "Should I sell NVDA and lock in gains?"
Questions Agent engages: "Why are you considering selling? Is it emotional or strategic?"
User: "Nervous about valuation at $140/share, feels overextended"
Agent: "Your tech allocation is 35% (target 25%). Reducing NVDA would also address diversification issue. Recommendation: trim 50% (sell $4k). Lock in gains, reduce concentration risk. Confidence: 78%."
User votes "I'll do this"
Agent tracks: if/when user executes, how the stock performs after, whether recommendation was validated


DISCLAIMER & LIABILITY
For Developers

Not financial advice: Every recommendation explicitly states "This is analysis, not advice. Consult a financial professional."
No liability assumption: Users understand they are responsible for their financial decisions.
Open source: MIT/Apache license shields contributors from enterprise liability.
Community-driven: Voting system and shared responsibility (recommendations from other users, not just proprietary AI).

For Users

Fin is a tool to support your thinking, not replace professional advice.
Your data is private, but you are responsible for securing your account (strong password, 2FA if offered).
Past performance ≠ future results.
Tax implications vary; consult a tax professional before executing recommendations.


NEXT STEPS

Validate MVP scope with real users (5-10 beta testers)
Build Investment Agent first → launch Phase 1
Gather feedback on agent quality, UX, performance tracking
Iterate on recommendation confidence, memory, cross-session learning
Add Debt Agent → launch Phase 2
Expand to Retirement + Questions + Research → Phases 3-5
Build Community Hub → enable public voting, trending strategies
Scale → expand broker support, add more agents, improve LLM accuracy


Last updated: June 2026
Status: Features specification (ready for development)
