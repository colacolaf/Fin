# Validation Framework

> Every agent output must self-validate before delivery. This is not optional.

---

## Validation Pipeline

Before presenting any recommendation, calculation, or analysis, run through these checks in order.

### Layer 1: Mathematical Consistency

- [ ] All percentages sum to 100% (or explicitly note why not)
- [ ] Growth calculations use correct compounding (not simple interest unless stated)
- [ ] Rates and periods match (annual rate → annual periods, monthly rate → monthly periods)
- [ ] Inflation adjustments are consistently applied or explicitly excluded
- [ ] Currency amounts are internally consistent (no $500 appearing where $5,000 was used earlier)
- [ ] Unit conversions are correct (e.g., monthly × 12 = annual)

**Flag if:** Any numeric inconsistency is found. Fix before proceeding.

### Layer 2: Accounting Consistency

- [ ] The fundamental identity holds: Assets = Liabilities + Net Worth
- [ ] Cash flows are properly signed (inflows positive, outflows negative — or consistently reversed)
- [ ] Balance sheet changes are explained by income/expense and other changes
- [ ] If projecting: beginning balance + contributions + returns - withdrawals = ending balance

**Flag if:** Any accounting equation doesn't balance. Trace the error.

### Layer 3: Economic Plausibility

- [ ] Projected returns are within realistic long-term bounds:
  - Equities: 6–10% nominal (4–7% real)
  - Bonds: 2–5% nominal (0–3% real)
  - Cash: 0–3% nominal (roughly 0% real)
- [ ] Single-year projections do not exceed historical extremes without explicit justification
- [ ] Risk and return are positively related (higher return → higher risk)
- [ ] Borrowing rates exceed risk-free rate (except promotional offers)
- [ ] Inflation assumptions are reasonable (1–4% for USD long-term)

**Flag if:** Any projection implies market-beating returns with no risk, or violates basic economic relationships. Add a caveat.

### Layer 4: Logical Consistency

- [ ] The recommendation aligns with the user's stated goals
- [ ] The recommendation aligns with the user's risk tolerance
- [ ] The recommendation doesn't contradict a recent recommendation from the same agent
- [ ] The recommendation doesn't contradict a core principle (e.g., "pay off 25% credit card" while recommending new discretionary spending)
- [ ] If trade-offs exist, both sides are presented honestly

**Flag if:** Contradiction detected. Resolve or explain the apparent conflict.

### Layer 5: Cross-Agent Consistency

- [ ] The recommendation doesn't conflict with advice from another agent
- [ ] If cash flow is limited, the recommendation considers competing priorities
- [ ] Tax implications are noted (even if the Tax Agent doesn't exist yet)
- [ ] Portfolio and Retirement recommendations don't double-count the same dollars

**Flag if:** Cross-agent conflict. Note it explicitly and recommend coordination.

### Layer 6: Confidence Calibration

Rate confidence on this scale before delivering:

| Level | Criteria | Action |
|---|---|---|
| **High (80%+)** | Formula is deterministic, inputs are verified, no assumptions needed | Deliver directly |
| **Medium (50–80%)** | Formula is sound but inputs involve estimates or market conditions | Deliver with caveats; state what would change the conclusion |
| **Low (< 50%)** | Major assumptions, volatile inputs, or novel situation | Recommend additional data gathering. State what information is needed to increase confidence. |

**Triggers for confidence downgrade:**
- No current market data (prices, rates)
- User hasn't provided complete information
- Projection horizon > 10 years
- Asset with no market price (private equity, startup equity, real estate)
- Novel financial product or strategy

### Layer 7: Source Transparency

- [ ] Distinguish between: verified data (connected accounts), user-provided data, web research, and assumptions
- [ ] Cite sources for any market data, rates, or external facts
- [ ] Clearly label assumptions as assumptions
- [ ] If no web search was performed, state what was assumed

---

## Pre-Mortem: The Final Check

Before delivering, ask: **"If this recommendation turns out to be wrong, what will be the most likely reason?"**

Address that reason in the output. Example:

> "This payoff plan assumes stable income. If your income drops, the 24-month timeline extends. Consider building a 3-month emergency buffer first."

---

## Validation Severity Levels

| Level | Meaning | Action |
|---|---|---|
| **BLOCKER** | Mathematical impossibility, accounting violation | Do not deliver. Fix the error. |
| **WARNING** | Plausible but aggressive assumption | Deliver with explicit caveat |
| **NOTE** | Minor simplification, rounding | Deliver; mention if asked |

---

## Example: Self-Validation in Practice

**Scenario:** User asks "How much do I need to retire at 65 with $80k/year?"

**AI output (unvalidated):**
> You need $2,000,000. Invest $1,500/month at 7% for 30 years.

**Validation check:**
1. ✗ Math: $1,500/month × 30 years at 7% = ~$1.83M, not $2M. Inconsistency.
2. ✗ SWR: $2M × 4% = $80k. OK (coincidental match).
3. ✗ Real vs. nominal: 7% nominal, but $80k in today's dollars. Need real return (~4% real).
4. ⚠ Inflation: 30 years at 3% inflation → $80k in 30 years = ~$194k nominal.

**Corrected output:**
> To spend $80k/year in today's dollars, you need ~$80k/0.04 = $2M in today's dollars.
> At 4% real return, investing $2,850/month for 30 years gets you there.
> (Assumptions: 7% nominal return, 3% inflation → 4% real. 4% safe withdrawal rate. 30-year retirement.)
