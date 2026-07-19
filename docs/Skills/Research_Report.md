# Skills System Research Report

> **Date:** July 19, 2026
> **Status:** Phase 1 — Analysis & Architecture
> **Objective:** Transform shallow skill definitions into institutional-grade knowledge systems usable by any modern LLM via `/skill` commands.

---

## 1. Major Weaknesses in Current Finance Skills

### 1.1 Skills are skeletal function signatures, not knowledge systems

The current skill definitions average **3–5 lines** each. Example:

```
### `portfolio_analyze`
- Compute allocation, concentration, and diversification metrics.
- Inputs: `holdings`
- Outputs: `total_value`, `allocation`, `concentration_risk`
```

**Problem:** This tells the AI *what* to do but not *how*. An LLM given only this prompt has zero guidance on methodology, formulas, interpretation thresholds, common pitfalls, or professional standards. Every invocation produces inconsistent, unreliable output that depends entirely on the model's pretraining.

### 1.2 System prompts are thin role descriptions, not knowledge repositories

The four system prompts (`00_universal`, `01_portfolio`, `02_debt`, `03_retirement`) average **~30 lines** each. They define a role and constraints but contain **zero financial knowledge**. The AI must rely entirely on its pretraining, which is:
- **Inconsistent across models** — GPT, Claude, Gemini, Llama, DeepSeek all have different finance knowledge
- **Impossible to update** — Adding new knowledge requires retraining, not editing a file
- **No shared institutional memory** — Each agent cannot learn from the others

### 1.3 No validation layer

There is zero instruction for the AI to self-validate its outputs. Missing:
- Mathematical consistency checks (e.g., do the numbers sum correctly?)
- Accounting identity verification (e.g., Assets = Liabilities + Equity)
- Economic plausibility checks (e.g., is a 50% annual return realistic?)
- Logical consistency (e.g., does the recommendation contradict a previous one?)
- Confidence calibration (e.g., when should the AI admit low confidence?)

### 1.4 No cross-skill awareness

Skills are siloed. The `debt_vs_invest_analyze` skill should coordinate with `portfolio_analyze`, but there's no mechanism for it. Each skill is an island.

### 1.5 No mathematical foundation

Skills mention inputs/outputs but contain **zero formulas, equations, or quantitative methods**. The AI must guess at:
- What formula to use for concentration risk (HHI? Top-N? Gini?)
- What discount rate for retirement projections
- What assumptions for debt payoff simulations
- What statistical methods for private asset valuation

### 1.6 No professional heuristics

Missing the shortcuts and rules of thumb that experienced professionals use:
- "What would invalidate this thesis?"
- "What assumptions drive 80% of the valuation?"
- "Where is the market probably wrong?"
- "What information would change my conclusion?"

### 1.7 No educational layer

The system makes recommendations but doesn't teach. A user who receives a rebalancing recommendation should also learn *why* and *how* to think about rebalancing.

### 1.8 No edge case handling

No guidance for situations where standard approaches fail: negative real rates, liquidity crises, startup equity with no market price, high-growth companies with negative earnings, hyperinflation environments, etc.

---

## 2. Missing Institutional Knowledge

### 2.1 What institutional knowledge means

Institutional knowledge is the accumulated wisdom of how professionals *think*, not just what they *know*. It includes mental models, workflows, decision hierarchies, validation methods, and communication standards.

### 2.2 Currently missing from every skill

| Dimension | Current State | What's Missing |
|---|---|---|
| **Identity** | Brief role sentence | Full professional persona with specialization, experience level, perspective |
| **Core Knowledge** | None explicit | Foundational + advanced concepts, terminology, relationships, historical context |
| **Mental Models** | None | First Principles, Expected Value, Systems Thinking, Bayesian Updating, etc. |
| **Workflow** | None | How professionals structure work from receiving information to delivering recommendations |
| **Decision Frameworks** | None (F.I.R.M. is generic) | Domain-specific decision trees, criteria matrices, scoring systems |
| **Validation** | None | Self-checking, consistency verification, sanity testing |
| **Heuristics** | None | Professional shortcuts, rules of thumb, diagnostic questions |
| **Teaching** | None | Explanations at multiple expertise levels, examples, analogies |
| **Edge Cases** | None | Handling of non-standard situations |

---

## 3. Missing Reasoning Frameworks

The F.I.R.M. framework (Frame, Inspect, Research, Make the Call) is a good start but is **too generic**. It applies identically to portfolio analysis, debt strategy, and retirement planning without any domain-specific reasoning.

### 3.1 Frameworks that should be embedded into specific skills

**Portfolio / Investing:**
- **MECE Analysis** (Mutually Exclusive, Collectively Exhaustive) — for allocation breakdowns
- **First Principles Valuation** — for private assets and non-standard holdings
- **Margin of Safety** — for any recommendation involving estimates
- **Scenario Planning** (bull/base/bear) — for projections
- **Sensitivity Analysis** — identify which variables drive outcomes
- **Kelly Criterion / Position Sizing** — for trade sizing

**Debt / Credit:**
- **Waterfall Analysis** — for structured debt payoff
- **Opportunity Cost Framework** — for debt vs. invest decisions
- **Liquidity Preference** — for emergency fund vs. extra payments
- **Refinancing Breakeven** — for consolidation decisions

**Retirement:**
- **Monte Carlo Simulation Logic** — for probabilistic projections
- **Safe Withdrawal Rate Framework** — Trinity Study, Bengen, Guyton-Klinger
- **Tax Bracket Optimization** — Roth vs. Traditional, conversion ladders
- **Sequence of Returns Risk** — for withdrawal phase planning

### 3.2 Universal reasoning frameworks all agents should share

- **Bayesian Updating** — how new information should shift confidence
- **Inversion** — "What would cause this plan to fail?"
- **Second-Order Thinking** — "And then what?"
- **Pre-Mortem Analysis** — "Assume the recommendation failed. Why?"
- **Confidence Calibration** — explicitly state confidence and what would change it

---

## 4. Missing Finance Domains

The current system covers Portfolio, Debt, and Retirement. These are a good foundation but incomplete.

### 4.1 High-priority missing domains

| Domain | Why Critical | Skills Needed |
|---|---|---|
| **Tax Planning** |Taxes are the largest expense for most users. Portfolio, debt, and retirement decisions all have tax implications. | Tax-loss harvesting, bracket optimization, deduction strategy, estimated tax planning |
| **Cash Flow / Budgeting** | Foundation for all other decisions. Without cash flow data, debt and investing advice is incomplete. | Budget analysis, emergency fund adequacy, savings rate optimization, spending categorization |
| **Insurance** | Risk management is fundamental. Underinsurance destroys wealth. | Coverage adequacy, term vs. permanent, disability need, umbrella policy |
| **Estate Planning** | Legacy and wealth transfer are part of comprehensive planning. | Beneficiary audit, basic will/trust guidance, gifting strategy |

### 4.2 Medium-priority missing domains

| Domain | Why Important |
|---|---|
| **College Savings** (529 plans) | Common goal competing with retirement and debt payoff |
| **Real Estate** (primary residence decisions) | Rent vs. buy, mortgage selection, HELOC strategy |
| **Equity Compensation** (RSUs, ISOs, NSOs) | Critical for tech workers; complex tax and concentration issues |
| **Side Business / Self-Employment** | SEP IRA, Solo 401(k), estimated taxes, entity selection |

---

## 5. Missing Validation Systems

### 5.1 What a validation layer should do

Every AI response should automatically verify:

1. **Mathematical consistency** — Do numbers sum? Do percentages total 100%? Are growth rates applied correctly?
2. **Accounting consistency** — Do debits equal credits? Is the balance sheet identity maintained?
3. **Economic plausibility** — Are projected returns within realistic bounds? Are assumptions consistent with current market conditions?
4. **Logical consistency** — Does this recommendation align with the user's stated goals and risk tolerance?
5. **Cross-agent consistency** — Does this recommendation conflict with recommendations from other agents?
6. **Source transparency** — Are claims sourced? Is the AI clear about what it knows vs. what it's assuming?

### 5.2 Implementation approach

Each skill should include a `VALIDATION` section with:
- A checklist of specific checks to perform before delivering output
- Acceptable ranges for numeric outputs
- Conditions that should trigger a confidence downgrade
- Rules for when to consult another agent

---

## 6. Missing Educational Components

### 6.1 Current state

The system makes recommendations but doesn't teach. It's a black box.

### 6.2 What's needed

Each skill should include a `TEACHING` section with:

- **Concept explanations** at 5 levels (Beginner → Expert)
- **Analogies** for complex concepts
- **Common misconceptions** to correct
- **Practice scenarios** the user can think through
- **Recommended next topics** for continued learning
- **Why this matters** — connecting the recommendation to the user's goals

---

## 7. Missing Professional Workflows

### 7.1 Current state

The F.I.R.M. framework is a one-size-fits-all 4-step process. Real professional workflows are domain-specific and much more detailed.

### 7.2 Workflows that should be embedded

**Portfolio Analysis Workflow:**
```
Receive holdings data
  → Categorize by asset class, sector, geography
  → Compute allocation percentages
  → Identify concentration (>5% single stock, >25% single sector)
  → Calculate diversification metrics (HHI, correlation matrix)
  → Compare to target allocation
  → Identify drift > threshold (typically 5%)
  → Generate rebalancing candidates
  → Filter by tax impact, trading costs
  → Prioritize by impact
  → Validate against risk tolerance
  → Deliver recommendation with trade list
```

**Debt Payoff Workflow:**
```
Inventory all debts with rates, balances, minimums
  → Calculate weighted average APR
  → Determine cash available for extra payments
  → Run avalanche simulation (highest rate first)
  → Run snowball simulation (smallest balance first)
  → Run hybrid simulation (custom priorities)
  → Compare total interest, payoff timeline, psychological factors
  → Check for refinancing opportunities
  → Validate against emergency fund requirement
  → Deliver recommendation with monthly plan
```

---

## 8. Missing Decision Frameworks

### 8.1 Current state

F.I.R.M. is the only decision framework, and it's generic. There are no domain-specific decision trees.

### 8.2 Decision frameworks needed

**Investment Decisions:**
- Asset allocation decision matrix (age, risk tolerance, time horizon → target allocation)
- Rebalancing decision tree (drift threshold, tax impact, trading costs → action)
- Stock concentration decision framework (position size, company quality, diversification benefit → hold/reduce)

**Debt Decisions:**
- Payoff strategy selector (APR spread, balance sizes, psychological profile → avalanche/snowball/hybrid)
- Debt-vs-invest decision matrix (after-tax debt rate, expected return, employer match, risk tolerance → priority)
- Refinancing breakeven analysis (closing costs, rate reduction, time to stay → refinance/don't)

**Retirement Decisions:**
- Contribution priority waterfall (employer match → HSA → Roth IRA → 401(k) → taxable)
- Roth vs. Traditional decision matrix (current bracket, expected future bracket, time horizon → account type)
- Withdrawal sequence optimization (taxable → tax-deferred → tax-free → order)

---

## 9. Missing Mathematical Foundations

### 9.1 Current state

Zero formulas, equations, or quantitative methods in any skill definition.

### 9.2 Mathematical foundations that should be embedded

**Portfolio Mathematics:**
- Herfindahl-Hirschman Index (HHI) for concentration
- Modern Portfolio Theory (expected return, variance, covariance)
- Sharpe Ratio for risk-adjusted return
- Tracking error vs. benchmark
- Tax-equivalent yield formula
- Dollar-cost averaging impact calculation
- Rebalancing band trigger formulas

**Debt Mathematics:**
- Amortization formulas (monthly payment, interest/principal split)
- APR to effective rate conversion
- Avalanche total interest formula
- Snowball payoff timeline
- Debt-to-income ratio thresholds
- Refinancing NPV calculation
- Present value of interest savings

**Retirement Mathematics:**
- Future value of periodic contributions
- Safe withdrawal rate calculations (Trinity Study methodology)
- Required minimum distribution (RMD) formulas
- Social Security claiming optimization
- Monte Carlo success probability
- Replacement ratio calculation
- Funding ratio (assets / PV of liabilities)

**Shared Mathematics:**
- Time value of money (PV, FV, NPV, IRR)
- Compound annual growth rate (CAGR)
- Inflation adjustment (real vs. nominal)
- Tax-equivalent yield
- Dollar-weighted vs. time-weighted returns
- Statistical measures (mean, median, std dev, correlation, percentiles)

---

## 10. Recommendations Ranked by Impact

| Rank | Recommendation | Impact | Effort | Rationale |
|---|---|---|---|---|
| **1** | **Expand Universal System Prompt with institutional reasoning frameworks** | 🔴 Critical | Medium | Every agent uses this. The F.I.R.M. framework is the foundation. Adding mental models, validation rules, and professional heuristics here lifts all agents simultaneously. |
| **2** | **Create per-skill knowledge documents with full institutional content** | 🔴 Critical | High | This is the core of the redesign. Each skill becomes a rich document the AI reads when the skill is invoked. Without this, skills remain shallow wrappers. |
| **3** | **Add validation layer to every skill** | 🔴 Critical | Medium | Without validation, the AI cannot self-correct. This is the single highest-leverage quality improvement. |
| **4** | **Embed mathematical foundations in skill docs** | 🟡 High | Medium-High | Formulas, assumptions, edge cases, and common mistakes make the AI's quantitative work reliable instead of guesswork. |
| **5** | **Add cross-skill integration rules** | 🟡 High | Medium | Skills must know when to defer to other agents and what context to pass. Breaks the silo problem. |
| **6** | **Add educational/teaching layer** | 🟡 High | Medium | Transforms the system from a black-box recommender into a teaching tool. Increases user trust and understanding. |
| **7** | **Expand to missing finance domains (tax, insurance, cash flow)** | 🟢 Medium | High | Important but lower priority than making existing skills excellent. New domains without institutional depth would repeat current problems. |
| **8** | **Build professional workflow templates per domain** | 🟢 Medium | Medium | Detailed step-by-step workflows make AI responses structured and thorough instead of ad-hoc. |
| **9** | **Add domain-specific decision frameworks** | 🟢 Medium | Medium-High | Decision trees and matrices make AI recommendations consistent and defensible. |
| **10** | **Document edge cases and non-standard situations** | 🟢 Medium | Low | Prevents AI from applying standard approaches in situations where they don't work. |

---

## 11. New Architecture for the Finance Skills

### 11.1 Core principle: skills as knowledge documents, not function signatures

When a user invokes `/portfolio_analyze`, the AI should:
1. Read the skill document for `portfolio_analyze`
2. Absorb its identity, core knowledge, mental models, workflow, math, validation rules
3. Execute the skill following the embedded professional workflow
4. Self-validate using the validation checklist
5. Deliver the output in the prescribed communication format
6. Optionally include teaching elements

### 11.2 Skill document template

Every skill document follows this structure:

```markdown
# {Skill Name}

## Identity
(Professional role, specialization, perspective)

## Core Knowledge
(Foundational concepts, advanced concepts, terminology, relationships)

## Mental Models
(Which mental models apply to this skill and how to use them)

## Professional Workflow
(Step-by-step process from input to output)

## Decision Framework
(Domain-specific decision trees, criteria, scoring)

## Mathematical Foundation
(Formulas, assumptions, edge cases, common mistakes, interpretation)

## Validation Layer
(Self-checking checklist before delivering output)

## Professional Heuristics
(Shortcuts, rules of thumb, diagnostic questions)

## Edge Cases
(Situations where standard approaches fail)

## Communication Standards
(How to present the output — structure, tone, uncertainty)

## Teaching Layer
(Explanations at multiple levels, analogies, misconceptions)

## Cross-Skill Integration
(When to consult other skills, what context to pass)

## References
(Sources, further reading, professional standards)
```

### 11.3 How the AI consumes skills

**At skill invocation (`/portfolio_analyze`):**
1. System reads the skill document
2. Injects the full document content into the AI's context
3. The skill document's workflow and validation rules guide execution
4. The skill document's communication standards shape the output

**Token budgeting:**
- Skill documents target **2,000–4,000 tokens** each (detailed enough for quality, short enough to fit in context with the conversation)
- Core knowledge sections can be longer since they're reference material
- The AI can skip sections not relevant to the current query

### 11.4 Relationship between system prompts and skill docs

**System prompts** define the agent's identity, constraints, and general behavior.

**Skill documents** define how to execute specific tasks.

The system prompt for Portfolio Agent might say: "You are the Portfolio Agent. When the user invokes a skill like `/portfolio_analyze`, read the skill document and follow its workflow exactly."

---

## 12. Suggested Folder/File Structure

```
docs/Skills/
├── Skills_Registry.md              # Master index (expanded) — maps skill IDs to file paths
├── Research_Report.md               # This document
│
├── universal/
│   ├── F.I.R.M._Framework.md       # Expanded reasoning framework (mental models, validation, heuristics)
│   ├── fetch_user_context.md       # Skill doc
│   ├── search_web.md               # Skill doc
│   ├── log_decision.md             # Skill doc
│   └── send_desktop_notification.md # Skill doc
│
├── portfolio/
│   ├── Portfolio_Agent.md          # Agent identity, core investing knowledge, shared portfolio math
│   ├── portfolio_analyze.md        # Skill doc
│   ├── rebalance_recommend.md      # Skill doc
│   ├── value_private_asset.md      # Skill doc
│   ├── execute_trade.md            # Skill doc
│   └── enable_paper_trading.md     # Skill doc
│
├── debt/
│   ├── Debt_Agent.md               # Agent identity, core credit knowledge, shared debt math
│   ├── debt_payoff_simulate.md     # Skill doc
│   └── debt_vs_invest_analyze.md   # Skill doc
│
├── retirement/
│   ├── Retirement_Agent.md         # Agent identity, core retirement knowledge, shared math
│   ├── retirement_readiness_score.md # Skill doc
│   └── match_capture_recommend.md  # Skill doc
│
└── shared/
    ├── financial_math.md           # Shared formulas (TVM, CAGR, inflation, stats)
    ├── validation_framework.md     # Cross-cutting validation rules
    ├── communication_standards.md  # Shared output formatting rules
    └── glossary.md                 # Finance terminology reference
```

### 12.1 TypeScript integration

Update `ui-showcase/src/lib/agents/index.ts`:

```typescript
export interface AgentSkill {
  id: string
  label: string
  description: string
  /** Path to the rich skill document that the AI reads when this skill is invoked */
  docPath: string
  /** Agent category this skill belongs to */
  agent: AgentId | "universal"
  /** Approximate token count of the skill doc (for context budgeting) */
  tokenEstimate: number
}

export const availableSkills: AgentSkill[] = [
  {
    id: "portfolio_analyze",
    label: "Portfolio Analyzer",
    description: "Compute allocation, concentration, and diversification metrics.",
    docPath: "docs/Skills/portfolio/portfolio_analyze.md",
    agent: "portfolio",
    tokenEstimate: 2500,
  },
  // ...
]
```

### 12.2 UI integration

Update `skills-page.tsx` to:
- Show `docPath` as a reference link
- Display `tokenEstimate` as a metadata badge
- Allow clicking a skill to preview its document content

---

## 13. Future Expansion Opportunities

### 13.1 Short-term (after core redesign)

- **Add Tax Agent** with skills: `tax_loss_harvest`, `bracket_optimize`, `deduction_review`, `estimated_tax_calc`
- **Add Cash Flow Agent** with skills: `budget_analyze`, `emergency_fund_check`, `savings_rate_optimize`
- **Add Insurance Agent** with skills: `coverage_gap_analyze`, `term_life_calc`, `disability_need`

### 13.2 Medium-term

- **Semantic search over skill docs** — when the user asks a question without invoking a skill, search across skill documents to find relevant knowledge
- **Skill composition** — allow skills to chain: `debt_vs_invest_analyze` automatically fetches portfolio context from `portfolio_analyze`
- **User-customizable skill parameters** — let power users adjust assumptions (discount rate, inflation, safe withdrawal rate)
- **Skill versioning** — track changes to skill documents, allow reverting

### 13.3 Long-term

- **Community skill marketplace** — users can publish custom skill documents
- **Skill effectiveness tracking** — measure which skills produce the best user outcomes (acceptance rate, follow-through)
- **Auto-generated skill docs** — use LLMs to draft new skill documents from minimal specs
- **Multi-agent collaboration** — a user query automatically routes to multiple agents, each applying their skills, then synthesizing a joint recommendation

---

## Appendix: Current vs. Proposed Comparison

| Metric | Current | Proposed |
|---|---|---|
| Skills count | 13 | 13 (same, but richer) |
| Avg. skill doc size | 5 lines | 200–400 lines |
| Mental models per skill | 0 | 5–10 |
| Formulas per skill | 0 | 5–15 |
| Validation checks per skill | 0 | 8–12 |
| Workflow steps per skill | 0 (just F.I.R.M.) | 8–15 domain-specific steps |
| Educational levels | 0 | 5 (Beginner → Expert) |
| Cross-skill references per skill | 0 | 3–5 |
| Edge cases documented | 0 | 5–10 per skill |
| Total institutional knowledge | ~200 lines | ~5,000+ lines |

---

## Next Steps (Phase 2)

1. **Redesign `00_universal_system_prompt.md`** — Expand F.I.R.M. with mental models, validation rules, professional heuristics, and communication standards. This is the foundation.
2. **Create `shared/` documents** — `financial_math.md`, `validation_framework.md`, `communication_standards.md`
3. **Redesign Portfolio Agent skills** — `Portfolio_Agent.md` + 5 skill docs
4. **Redesign Debt Agent skills** — `Debt_Agent.md` + 2 skill docs
5. **Redesign Retirement Agent skills** — `Retirement_Agent.md` + 2 skill docs
6. **Update TypeScript definitions** — `availableSkills` to include `docPath`, `agent`, `tokenEstimate`
7. **Update skills-page.tsx** — Show expanded metadata, preview capabilities
