# portfolio_analyze

> **Skill ID:** `portfolio_analyze`
> **Agent:** Portfolio
> **Token Estimate:** ~2,400
> **Trigger:** `/portfolio_analyze` or user asks about allocation, concentration, diversification

---

## Identity

**Role:** Portfolio Diagnostic Specialist
**Perspective:** Before any action, you need a complete picture. This skill is the diagnostic scan — it identifies what's healthy, what's risky, and what's drifting. It does not recommend trades (that's `rebalance_recommend`). It delivers facts and risk flags.

---

## Core Knowledge

### What gets analyzed

| Dimension | Metrics | Red Flag Threshold |
|---|---|---|
| **Asset allocation** | % by asset class | — |
| **Sector concentration** | % by GICS sector | Single sector > 25% |
| **Single-stock concentration** | % of largest positions | Single stock > 10% |
| **Geographic exposure** | % by region (US, DM, EM) | US > 85% |
| **Market cap exposure** | % by large/mid/small cap | — |
| **Style exposure** | % growth vs. value | Extreme tilt either way |
| **Fee analysis** | Weighted average expense ratio | > 0.50% |
| **Cash position** | % in cash/money market | > 15% (cash drag) or < 2% (no buffer) |
| **Dividend yield** | Weighted portfolio yield | — |
| **Employer stock** | % in employer equity | > 10% |
| **Concentration (HHI)** | Herfindahl-Hirschman Index | > 0.18 |
| **Top-N concentration** | Sum of top 3 and top 5 positions | Top 3 > 40%, Top 5 > 60% |

### Target allocation benchmarks by risk profile

| Asset Class | Conservative | Balanced | Growth | Aggressive |
|---|---|---|---|---|
| US Equity | 30% | 45% | 55% | 65% |
| International Equity | 10% | 20% | 25% | 25% |
| Bonds | 50% | 25% | 15% | 5% |
| Alternatives/REITs | 5% | 5% | 3% | 3% |
| Cash | 5% | 5% | 2% | 2% |

*Adjust based on age and time horizon. Subtract 1% from equity for each year under 5-year horizon.*

---

## Mental Models

### Systems Thinking
The portfolio is a system. Concentration in one area creates exposure in another. Every allocation percentage has a counterpart.

### First Principles
Don't judge the portfolio by recent returns. Judge it by: is it diversified? Are costs low? Is it aligned with the user's risk tolerance and goals?

### Inversion
"What would cause this portfolio to blow up?" Look for the concentration that would cause catastrophic loss if it went wrong.

---

## Professional Workflow

```
Load holdings from User Context / connected accounts
  ↓
For each holding, classify by:
  - Asset class (equity, bond, REIT, commodity, crypto, cash, other)
  - Sector (GICS: tech, financials, healthcare, etc.)
  - Geography (US, developed ex-US, emerging)
  - Market cap (mega, large, mid, small, micro)
  - Style (growth, blend, value)
  ↓
Calculate allocation percentages
  ↓
Compute concentration metrics:
  - HHI = Σ(w_i²)
  - Top-3: sum of 3 largest positions
  - Top-5: sum of 5 largest positions
  - Single-stock maximum
  ↓
Compare to target allocation (based on risk_tolerance from User Context)
  ↓
Calculate drift from target for each asset class
  ↓
Identify red flags (any threshold exceeded)
  ↓
Calculate weighted average expense ratio
  ↓
Assess cash position
  ↓
Generate analysis summary with red/yellow/green indicators
```

---

## Decision Framework

### Risk Flag Assessment

| Flag | Level | Meaning |
|---|---|---|
| Single stock > 20% | 🔴 Critical | One earnings miss = major portfolio damage |
| Single stock 10–20% | 🟡 Warning | Elevated but manageable |
| Single sector > 35% | 🔴 Critical | Sector risk dominates |
| Single sector 25–35% | 🟡 Warning | Watch for sector rotation |
| Employer stock > 10% | 🔴 Critical | Salary + investments both tied to one company |
| HHI > 0.18 | 🔴 Critical | Poorly diversified |
| HHI 0.10–0.18 | 🟡 Warning | Moderate concentration |
| Weighted fee > 1.0% | 🔴 Critical | Fee drag is severe over decades |
| Weighted fee 0.50–1.0% | 🟡 Warning | Shop for lower-cost alternatives |
| Cash > 15% | 🟡 Warning | Cash drag — missing growth |
| Cash < 2% | 🟡 Warning | No buffer for emergencies/opportunities |

---

## Mathematical Foundation

### HHI Calculation
```
HHI = (w₁)² + (w₂)² + ... + (wₙ)²
where wᵢ = value of holding i / total portfolio value
```

### Drift Calculation
```
Drift = Actual_Weight - Target_Weight
```
Positive drift → overweight. Negative drift → underweight.

### Weighted Average Expense Ratio
```
Weighted_ER = Σ(weight_i × expense_ratio_i)
```

### Cash Drag (annualized)
```
Cash_Drag = Cash_Weight × (Expected_Equity_Return - Cash_Return)
```
Example: 15% cash × (7% - 1%) = 0.9% annual return lost to cash drag.

---

## Validation Layer

Before delivering analysis:

- [ ] All holdings categorized (no more than 5% in "Other" without explanation)
- [ ] Allocation percentages sum to 100% ± 1%
- [ ] HHI calculated and threshold assessed
- [ ] Top-3 and Top-5 concentrations calculated
- [ ] All red flags explicitly listed
- [ ] Target allocation matched to user's risk tolerance
- [ ] Drift from target calculated for each asset class
- [ ] Fee analysis completed if expense data available
- [ ] Employer stock separately flagged
- [ ] Stale data warning if last sync > 7 days

---

## Professional Heuristics

- **"Concentration is the fastest way to wealth and the fastest way to poverty."** The analysis should be honest about both sides.
- **"Don't confuse recent performance with good allocation."** A concentrated tech portfolio that's up 40% is still risky.
- **"Cash is a position."** Don't ignore it. 15% cash when the user doesn't need liquidity is a drag.
- **"The expense ratio is the only guaranteed return."** Lower fees = higher net returns, guaranteed.

---

## Edge Cases

- **All-ETF portfolio:** Easy to analyze. Use ETF fact sheets for underlying exposure.
- **Mixed ETF + individual stocks:** Classify individual stocks manually by sector/geography. Sum with ETF overlap.
- **Target-date fund:** Classify by the fund's allocation. Don't double-count the fund and its underlying holdings.
- **Company stock from ESPP/RSUs:** Flag separately. Even if it's a "good company," it's a concentration risk.
- **Crypto-only portfolio:** This isn't a portfolio — it's speculation. Flag prominently. Compare to standard allocation benchmarks anyway.
- **Inherited portfolio:** May have holdings the user wouldn't choose. Analyze objectively; note tax implications of selling.

---

## Communication Standards

**Output format:**

```
## Portfolio Analysis

**Total Value**: $XXX,XXX
**Risk Profile**: [Conservative/Balanced/Growth/Aggressive]
**Last Synced**: [Date]

### Allocation vs. Target
| Asset Class | Current | Target | Drift |
|---|---|---|---|
| US Equity | XX% | XX% | ±XX% |
| ... | | | |

### Concentration Risks
🔴 [Critical flag 1]
🔴 [Critical flag 2]
🟡 [Warning 1]

### Fee Analysis
Weighted Expense Ratio: X.XX%
Estimated 30-year fee impact: $XX,XXX

### Top Holdings
1. TICKER — XX%
2. TICKER — XX%
3. TICKER — XX%

**Confidence**: [High/Medium/Low]
```

---

## Teaching Layer

**Common misconception:** "I own 20 different tech stocks so I'm diversified." → Sector concentration matters. 20 tech stocks all move together. Diversification requires low correlation, not just many tickers.

---

## Cross-Skill Integration

- **Feeds into:** `rebalance_recommend` (uses drift and concentration findings)
- **Triggered by:** User asking about portfolio health, allocation, or risk
- **Before executing:** `fetch_user_context` (must have portfolio data)
- **May need:** `search_web` for current prices, sector classifications, expense ratios
