# RECOMMENDATION ENGINE

**Version**: 1.0 | **Last Updated**: July 2026

---

## 1. OVERVIEW

The Recommendation Engine is the core intelligence layer of the FIN system. It takes a user's financial context (portfolio, debts, retirement accounts, behavioral patterns), routes it to the appropriate specialized agent, applies the **C.O.R.E. reasoning framework**, and produces structured, confidence-scored recommendations.

### Architecture Placement

The engine sits within the Backend layer (FastAPI), orchestrated by four coordinated components:

```
User Request
    │
    ▼
┌──────────────────────────────────────────────────────┐
│ REQUEST ROUTER                                        │
│ /api/recommendations/{investment|debt|retirement}     │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│ CONTEXT MANAGER                                       │
│ Loads User Context File → Verifies Freshness          │
│ (<24h portfolio, daily debt) → Triggers API Refresh   │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│ LLM CALL MANAGER                                      │
│ [System Prompt] + [Context] + [User Message]          │
│ → Ollama (Mistral 7B, temp=0.3)                      │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│ RESPONSE HANDLER                                      │
│ Parse JSON confidence → Validate format               │
│ → Save to DB → Return to Frontend                     │
└──────────────────────────────────────────────────────┘
```

Refer to `docs/SystemPrompts/System_architecture_(Agent_orchestration_flow)` for the full request-response lifecycle including voting and context update flows.

---

## 2. THE C.O.R.E. FRAMEWORK

All three agents (Investment, Debt, Retirement) reason through the same four-stage framework. Each agent specializes within each stage based on its domain.

### 2.1 CLARIFY — Establish Constraints & Goals

The agent reads user context to answer: *What is this user actually trying to achieve, and what constraints am I working within?*

| Axis | Investment Agent | Debt Agent | Retirement Agent |
|------|-----------------|------------|------------------|
| Primary question | What's the user's risk tolerance, time horizon, and rebalancing preference? | What's the user's primary goal — debt-free by date? Minimize interest? Improve cash flow? | What's the retirement target date, desired income replacement %, and current funded ratio? |
| Critical context | Portfolio composition, sector allocation, unrealized gains, past rebalancing decisions | Debt stack (rates, balances, minimums), emergency fund status, cash flow, credit score | Retirement savings total, employer match %, projected Social Security, expected expenses |
| When to ask user | Only if risk tolerance, goal timing, or tax bracket are genuinely ambiguous | Only if emergency fund status or upcoming life events (job change, home purchase) are unknown | Only if retirement age, desired lifestyle, or spousal situation is incomplete |
| Default assumption | Uses context file; asks clarifying question only when critical decision branch depends on unknown | Uses context file; defaults to mathematical optimization (avalanche method) unless behavioral data shows emotional preference | Uses context file; assumes 80% income replacement target if not specified |

### 2.2 ORGANIZE — Structure the Data

The agent maps raw context into a structured analysis that makes the problem legible.

**Investment Agent** organization:
- Categorize holdings by asset class (stocks, bonds, cash, alternatives)
- Map sector allocation vs. market benchmark (e.g., S&P 500 sector weights)
- Flag concentration risks (>20% single holding, >35% single sector)
- Calculate fee drag (weighted average expense ratio)
- Score diversification (0–100 composite)

**Debt Agent** organization:
- Build debt ladder sorted by interest rate (avalanche) and by balance (snowball)
- Calculate total monthly minimums, discretionary cash flow available
- Project total interest cost if paying minimums only (1-year, 5-year, full-term)
- Map the debt-vs-invest decision: for each debt, compare guaranteed interest saved vs. expected market return
- Flag special cases: employer 401(k) match, tax-deductible interest, forgiveness eligibility

**Retirement Agent** organization:
- Calculate current funded ratio: `total_retirement_savings / projected_need`
- Project savings trajectory with current contribution rate
- Identify shortfall: `projected_need − projected_savings_at_retirement`
- Model scenarios: increase contributions, delay retirement, reduce expenses
- Flag time-sensitive opportunities: catch-up contributions (age 50+), employer match cliffs

### 2.3 REASON — Apply Domain Logic

This is where the agent applies its specialized reasoning heuristics.

**Investment Agent reasoning priorities** (evaluated in order):
1. **Concentration Risk** — Single holding >20% of portfolio → recommend trim to 10–15%
2. **Sector Concentration** — Single sector >35% → recommend gradual rebalancing to market weight ±5%
3. **Asset Class Drift** — Actual vs. target allocation >10% off → recommend shift over 3–6 months
4. **Fee Inefficiency** — Holdings with expense ratio >0.40% → recommend lower-cost equivalent
5. **Tax-Loss Harvesting** — Unrealized loss >$500 → recommend harvest opportunity

**Debt Agent reasoning** (the debt-vs-invest dilemma):
- If APR >12%: Always pay off first (guaranteed 20%+ loss avoided beats uncertain 8% market return)
- Exception: Employer 401(k) match (50%+ guaranteed return) > any debt payoff → capture match first, then attack debt
- If APR <6%: Hybrid approach — minimums on low-rate debt, extra to retirement/investments; depends on risk tolerance and tax implications
- If 6% ≤ APR ≤ 12%: Judgment zone — weigh user's risk tolerance, emotional relationship to debt, and market conditions
- Automatically web-searches: current consolidation loan rates, balance transfer offers, forgiveness program eligibility

**Retirement Agent reasoning**:
- Funded ratio <50%: Critical — recommend immediate contribution increase, prioritize over discretionary spending
- Funded ratio 50–80%: Moderate gap — recommend systematic increase, explore catch-up strategies
- Funded ratio >80%: On track — validate assumptions, recommend optimization (Roth conversions, fee reduction)
- Always checks: employer match capture (free money), tax-advantaged account ordering (401(k) match → HSA → Roth IRA → 401(k) max → taxable)

### 2.4 EXPLAIN — Build the Output

The EXPLAIN stage transforms the reasoning into a structured, user-facing recommendation with:
- Clear actionable directive
- Multi-point justification with trade-offs
- Confidence decomposition
- Quantified before/after impact
- Risk acknowledgment ("What Could Go Wrong")
- Known unknowns
- Verification steps
- Legal disclaimer

Full output format specified in **Section 5**.

---

## 3. RECOMMENDATION GENERATION PIPELINE

### 3.1 End-to-End Flow

```
STEP 1: FRONTEND INITIATES
  User clicks "Analyze My Portfolio" / "Get Debt Recommendations" / "Check Retirement"
  → POST /api/recommendations/{agent_type}
  → Includes user_id from session

STEP 2: ROUTE TO AGENT
  Request Router maps endpoint to agent type:
  ├─ /investment → Investment Agent system prompt
  ├─ /debt → Debt Agent system prompt
  └─ /retirement → Retirement Agent system prompt

STEP 3: LOAD SYSTEM PROMPT
  System Prompt Manager loads from cache:
  ├─ 01_investment_agent_system_prompt.md
  ├─ 02_debt_agent_system_prompt.md
  └─ 03_retirement_agent_system_prompt.md

STEP 4: LOAD & VALIDATE CONTEXT
  Context Manager loads User Context File from database
  Checks freshness:
  ├─ Portfolio data: must be <24h old (sync_freshness_minutes < 1440)
  │   └─ If stale → call Alpaca API → refresh holdings → recalculate allocations
  ├─ Debt data: refreshed daily via Plaid
  │   └─ If stale → call Plaid API → refresh accounts/liabilities
  └─ Data quality flags set: portfolio_data_stale, debt_data_stale

STEP 5: INJECT CONTEXT
  Combine into single system message:
  full_system = f"{system_prompt}\n---\n## USER CONTEXT\n{json.dumps(context)}"
  Total size: ~2.5 KB (system prompt ~1.5 KB + context ~1 KB)

STEP 6: LLM INFERENCE
  Call Ollama at localhost:11434
  Model: mistral:7b (or llama2:13b)
  Temperature: 0.3 (deterministic, consistent outputs)
  Context window: 32K tokens

STEP 7: AGENT REASONING (C.O.R.E.)
  Agent processes: CLARIFY → ORGANIZE → REASON → EXPLAIN
  Optionally triggers web search for current rates/valuations
  Generates markdown response with embedded JSON confidence block

STEP 8: PARSE RESPONSE
  Response Handler extracts JSON confidence via regex: ```json ... ```
  Validates recommendation structure (required fields present)
  If validation fails → error response to frontend

STEP 9: PERSIST
  Save to database:
  ├─ recommendation_id (UUID)
  ├─ user_id
  ├─ agent_type
  ├─ title
  ├─ recommendation_text (full markdown)
  ├─ confidence_overall
  ├─ confidence_reasoning
  ├─ confidence_data
  ├─ confidence_user_alignment
  ├─ created_at
  └─ status: "pending" (awaiting user vote)

STEP 10: RETURN TO FRONTEND
  Response: { recommendation_id, text, confidence, created_at }
  Frontend renders Recommendation Card with Accept/Reject/Learn More buttons
```

### 3.2 Data Freshness & Staleness Handling

| Data Type | Source | Refresh Trigger | Stale Threshold | Action on Stale |
|-----------|--------|----------------|-----------------|-----------------|
| Portfolio holdings & quotes | Alpaca API | On-demand or scheduled (6 AM daily) | >24 hours | Call Alpaca → update positions → recalculate allocation % |
| Debt accounts & balances | Plaid API | Scheduled daily | >24 hours | Call Plaid → refresh accounts → update balances/rates |
| Market data (fundamentals, news) | Finnhub | Per-request (if web search triggered) | N/A | Real-time fetch during REASON stage |
| User profile (age, goals, risk tolerance) | User Context File | Manual (user updates settings) | N/A (assumed current) | Flag if age/risk tolerance missing → agent asks user |
| Behavioral patterns | User Context File | Updated on every vote | N/A (always current) | Recalculated after each Accept/Reject vote |

When context is stale at request time, the refresh is **synchronous** — the request blocks until fresh data is loaded. This ensures the agent always reasons on current information. The `data_completeness` confidence score reflects whether data was fresh or required a refresh.

### 3.3 Web Search Integration

During the REASON stage, agents may trigger web searches for external context:

**Investment Agent searches:**
- Current sector P/E ratios to justify concentration concerns
- Recent analyst downgrades/upgrades on overweight holdings
- Alternative ETF options with lower expense ratios

**Debt Agent searches:**
- Current personal loan consolidation rates
- Balance transfer credit card offers (0% intro APR periods)
- Student loan forgiveness program eligibility (PSLF, IDR)
- Current federal student loan interest rates

**Retirement Agent searches:**
- Social Security benefit estimates and claiming strategies
- Current IRA/401(k) contribution limits
- Required Minimum Distribution (RMD) age and rules

Search results feed into the REASON stage and, if used, add a **+5 bonus** to the overall confidence score.

---

## 4. CONFIDENCE SCORING ALGORITHM

Every recommendation carries a structured confidence score with four dimensions. This allows users to understand *why* the system is confident (or not) and make informed decisions.

### 4.1 Component Scores

#### 4.1.1 REASONING QUALITY (0–100)

*How solid is the logic behind this recommendation?*

| Score Range | Criteria |
|-------------|----------|
| 90–100 | Clear mathematical basis (e.g., interest rate comparison, concentration math). Trade-offs are explicit. Multiple equally valid approaches don't exist — this is the clear optimal path. |
| 70–80 | Good logic with some judgment calls. Trade-offs are present but one path is notably better. Minor assumptions required. |
| 50–70 | Multiple valid approaches exist. The recommendation is defensible but other paths could also be reasonable. Significant uncertainty in the premises. |
| <50 | Insufficient data to form a strong conclusion. Recommendation is speculative. (Recommendations scoring <50 overall are not published.) |

**Adjustment factors:**
- Web search supports the thesis: +5
- Agent is aware of counterarguments and addresses them: +5
- Recommendation contradicts a previously accepted recommendation: −10

#### 4.1.2 DATA COMPLETENESS (0–100)

*How complete and current is the data this recommendation is based on?*

Base score: 100

Deductions:
| Gap | Penalty |
|-----|---------|
| Portfolio data >24h old (required refresh) | −10 |
| Missing cost basis on holdings | −15 |
| Tax bracket unknown/estimated | −10 |
| Income is estimated (not verified) | −5 |
| Debt APR missing (using assumed rate) | −15 |
| Retirement expenses only estimated | −10 |
| Credit score unknown | −5 |
| Emergency fund status unknown | −5 |

**Score ranges:**
- 95–100: Complete, fresh data across all relevant dimensions
- 80–90: Small gaps (e.g., missing tax bracket, estimated income)
- 60–75: Major gaps (missing cost basis, stale portfolio, unknown debt rates)
- <60: Critical data missing; recommendation quality severely impacted

#### 4.1.3 USER ALIGNMENT (0–100)

*Does this recommendation fit the user's demonstrated preferences, goals, and past behavior?*

Base score: 50 (neutral)

Additions:
| Factor | Bonus |
|--------|-------|
| Recommendation directly supports stated financial goals | +20 |
| Matches user's risk tolerance profile | +15 |
| User has consistently executed this type of recommendation | +10 |
| Aligns with user's preferred pace (gradual vs. aggressive) | +10 |
| User's past decisions suggest receptiveness to this domain | +5 |

Deductions:
| Factor | Penalty |
|--------|---------|
| User previously rejected a similar recommendation | −20 |
| Recommendation conflicts with stated goals | −15 |
| Recommendation pace contradicts user's stated preference | −10 |
| User has low acceptance rate in this agent domain (<40%) | −10 |
| Recommendation requires action user has avoided before | −5 |

**Score ranges:**
- 90–100: Perfect fit — aligns with goals, risk tolerance, and past behavior
- 70–80: Good fit — mostly aligned, minor tension with past behavior
- 50–60: Misaligned — contradicts stated preferences or past rejections
- <50: Strongly misaligned — recommendation would likely be rejected

### 4.2 Overall Confidence Calculation

```
OVERALL = (reasoning_quality + data_completeness + user_alignment) / 3

Bonus: +5 if recommendation is supported by web search
Cap: 100 maximum
Floor: 50 minimum (recommendations scoring <50 overall are not published)
```

### 4.3 Example Calculation

**Scenario**: Investment agent recommends trimming NVDA from 22% to 19%.

| Component | Score | Justification |
|-----------|-------|---------------|
| Reasoning Quality | 90 | Math is solid: 22% → 19% is a clear concentration reduction. Trade-offs explicit (tax impact, potential regret if NVDA rallies). |
| Data Completeness | 85 | Portfolio synced 2 hours ago (fresh). Missing cost basis (−15) prevents exact tax calculation. |
| User Alignment | 75 | User prefers gradual moves (+10). Previously rejected aggressive 22%→12% trim (−20). This 3% recommendation respects that feedback. |
| **Raw Average** | **83.3** | (90 + 85 + 75) / 3 |
| Web Search Bonus | +0 | No web search used for this recommendation |
| **Overall** | **83** | Rounded down |

### 4.4 Confidence Display Format

Confidence is displayed to the user as both a numeric score and a visual bar:

```
Confidence: 83%  [████████░░]

Breakdown:
  Reasoning: 90%  (math is solid)
  Data: 85%       (portfolio fresh, missing cost basis)
  Alignment: 75%  (respects your preference for gradual moves)
```

---

## 5. RECOMMENDATION OUTPUT FORMAT

Every recommendation follows a consistent markdown structure with an embedded JSON confidence block. This format is enforced by the Response Handler during validation.

### 5.1 Full Output Schema

```markdown
## [Recommendation Title]

**What to do**: [Clear, 1-sentence actionable directive]

**Why**: 
- [Reason 1: Primary driver — e.g., concentration risk, interest rate differential]
- [Reason 2: Behavioral or contextual — e.g., aligns with past preferences]
- [Reason 3: Secondary benefit — e.g., fee reduction, tax efficiency]

**Confidence Score**:
```json
{
  "overall": 83,
  "reasoning_quality": 90,
  "data_completeness": 85,
  "user_alignment": 75,
  "explanation": "High confidence in the concentration risk math. Medium alignment with your risk tolerance — you rejected aggressive rebalancing before, so this recommendation is more gradual."
}
```

**Impact (Before/After)**:
- [Metric 1]: [Before] → [After]
- [Metric 2]: [Before] → [After]
- [Metric 3]: [Before] → [After]
- Estimated tax: $[amount] ([short-term/long-term] gains)
- Annual fee impact: [$saved or neutral]

**What Could Go Wrong**:
- [Risk 1: Market or behavioral risk]
- [Risk 2: External factor]
- [Risk 3: Psychological risk (regret, stress)]

**Unknowns**:
- [Unknown 1: Data gap affecting precision]
- [Unknown 2: User circumstance not captured in context]
- [Unknown 3: External variable]

**How to Verify This**:
1. [Actionable verification step]
2. [Actionable verification step]
3. [Actionable verification step]

---

**DISCLAIMER**: *This is analysis, not financial advice. I don't know your full tax situation, investment constraints, or personal circumstances. Consult a tax professional or financial advisor before executing any trades.*
```

### 5.2 Agent-Specific Impact Metrics

**Investment recommendations** include:
- Concentration: [Holding %] → [Target %]
- Sector allocation: [Sector %] → [Target %]
- Diversification score: [0–100] → [0–100]
- Estimated tax impact
- Annual fee impact (expense ratio difference × position size)

**Debt recommendations** include:
- Monthly payment: [$current] → [$proposed]
- Payoff timeline: [current months] → [proposed months]
- Total interest saved: $[amount]
- Debt-to-income ratio: [current %] → [proposed %]
- Cash flow freed per month: $[amount]

**Retirement recommendations** include:
- Funded ratio: [current %] → [projected %]
- Monthly contribution: [$current] → [$proposed]
- Projected retirement income: [$current projection] → [$proposed projection]
- Retirement age feasibility: [current projection] → [proposed projection]
- Employer match capture: [$currently captured] → [$proposed capture]

### 5.3 Validation Rules

The Response Handler enforces these validation rules before accepting a recommendation:

1. **Title**: Must start with `## ` and be a non-empty heading
2. **What to do**: Must contain `**What to do**:` followed by a non-empty directive
3. **Why**: Must contain `**Why**:` followed by at least one bullet point (`-`)
4. **Confidence JSON**: Must contain a valid JSON block with keys: `overall`, `reasoning_quality`, `data_completeness`, `user_alignment`, `explanation`
5. **Confidence values**: Each score must be an integer between 0 and 100. `overall` must be ≥50.
6. **Impact**: Must contain `**Impact` followed by at least one before/after metric
7. **What Could Go Wrong**: Must contain `**What Could Go Wrong**` with at least one risk bullet
8. **Unknowns**: Must contain `**Unknowns**` with at least one acknowledged gap
9. **How to Verify**: Must contain `**How to Verify This**` with at least one numbered step
10. **Disclaimer**: Must contain the required legal disclaimer text

If any validation rule fails, the recommendation is rejected with an error response. The frontend displays a fallback message: "Unable to generate a valid recommendation. Please try again."

---

## 6. MULTI-AGENT COORDINATION

Agents do not communicate directly. They coordinate through the **User Context File**, which is updated after every user vote.

### 6.1 Learning Loop

```
Day 1: Investment Agent → User Accepts
  → Context updated: acceptance_rate = 0.60, investment_acceptance = 0.70
  → agent_learning: "User willing to increase bonds"

Day 3: Debt Agent reads updated context
  → Sees: User accepted bond increase → might have freed cash
  → Recommends accordingly, with higher confidence in alignment

Day 5: Retirement Agent reads fully updated context
  → Sees both Investment and Debt decision history
  → Patterns: moderate risk, prefers stability
  → Tailors recommendation to match observed preferences
```

### 6.2 Shared Behavioral Signals

All agents read from the same behavioral patterns section:

| Signal | How It's Updated | How Agents Use It |
|--------|-----------------|-------------------|
| `acceptance_rate` (overall) | Recalculated on every vote: `accepted / total_decisions` | Sets baseline expectation for user receptiveness |
| `breakdown_by_agent[agent].acceptance_rate` | Per-agent acceptance calculated separately | Investment agent knows if user trusts investment advice specifically |
| `prefers_gradual_changes` | Boolean: inferred from rejections of "aggressive" recommendations | Agents choose pace (3% trim vs. 10% trim) |
| `decision_speed.average_days_to_execute` | Mean of execution time for accepted recommendations | Agents set timeline expectations |
| `emotional_vs_mathematical` | "emotional" / "balanced" / "mathematical" from debt context | Debt agent chooses avalanche vs. snowball strategy |
| `past_decisions` (full array) | Appended on every vote with `user_reasoning` text | Agents search for similar past recommendations; adjust alignment score |

---

## 7. EDGE CASES & FAILURE MODES

| Scenario | Detection | Handling |
|----------|-----------|----------|
| **No portfolio data** | Context file has empty `holdings` array or `total_value = 0` | Return message: "Connect your brokerage account to get investment recommendations." Do not invoke agent. |
| **No debt data** | Context file has empty `debts` array | Return message: "Connect your bank accounts to get debt recommendations." Do not invoke agent. |
| **Ollama unavailable** | Connection refused at `localhost:11434` | Return HTTP 503: "Recommendation engine is temporarily unavailable. Ensure Ollama is running." |
| **LLM response fails validation** | JSON parse error or missing required fields | Retry once with same prompt. If still invalid, return HTTP 500 with error detail. |
| **Context refresh fails** | Alpaca/Plaid API error | Proceed with stale data but set `data_completeness` penalty (−10 for stale). Flag in response: "Using cached data from [timestamp]." |
| **Recommendation scores overall <50** | Confidence calculation result below floor | Discard recommendation silently. Log for debugging. Return: "Unable to generate a high-confidence recommendation at this time." |
| **User has no behavioral history** | `past_decisions` array is empty | USER_ALIGNMENT defaults to 50 (neutral). Agent has no behavioral signals to adjust from. |
| **Conflicting goals** | Context shows contradictory goals (e.g., "debt-free ASAP" + "maximize investments") | Agent surfaces the conflict in EXPLAIN stage. Presents trade-off. User chooses. |

---

## 8. REFERENCES

- **Agent System Prompts**: `docs/SystemPrompts/Investment_agent_system_prompt`, `docs/SystemPrompts/Debt_agent_system_prompt`, `docs/SystemPrompts/Retirement_System_Prompt`
- **Architecture & Orchestration Flow**: `docs/SystemPrompts/System_architecture_(Agent_orchestration_flow)`
- **User Context Schema**: `docs/SystemPrompts/User_context_file_shema`
- **Implementation Guide**: `docs/SystemPrompts/Fin_system_prompts_implemtation_guide`