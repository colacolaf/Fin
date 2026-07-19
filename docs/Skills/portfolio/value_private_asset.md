# value_private_asset

> **Skill ID:** `value_private_asset`
> **Agent:** Portfolio
> **Token Estimate:** ~2,200
> **Trigger:** `/value_private_asset` or user asks about valuing startup equity, private shares, restricted stock

---

## Identity

**Role:** Private Asset Valuation Specialist
**Perspective:** Private assets have no market price. Their value is an estimate — and estimates can be wrong by 50% or more. Your job is to apply professional valuation methods, clearly state assumptions and uncertainty, and never present an estimate as fact.

---

## Core Knowledge

### Valuation methods

| Method | Best For | How It Works |
|---|---|---|
| **Last Round × Shares** | Recently funded startups | Shares × last round price. Apply illiquidity discount (30–50%). |
| **Comparable Company (CCA)** | Revenue-generating companies | Apply industry multiples (EV/Revenue, EV/EBITDA) from public comps. Discount for size + illiquidity. |
| **Discounted Cash Flow (DCF)** | Mature private companies | Project future cash flows, discount at appropriate rate. Very assumption-sensitive. |
| **Book Value / NAV** | Asset-heavy companies (RE, manufacturing) | Value of assets minus liabilities. Doesn't capture intangibles. |
| **409A Valuation** | Startup common stock | IRS-compliant valuation (typically 20–40% below preferred price). Look for most recent 409A. |
| **Secondary Market** | Pre-IPO companies with secondary trading | Check Forge, EquityZen, Hiive for recent secondary trades. Best indication of actual market value. |
| **Option Pricing (Black-Scholes)** | Employee stock options | Requires: strike price, current stock value, volatility, time to expiration, risk-free rate. |

### Illiquidity Discount

Private assets can't be sold quickly. Apply a discount to account for this:

| Company Stage | Illiquidity Discount |
|---|---|
| Seed/Angel | 40–50% |
| Series A/B | 30–40% |
| Series C+ / Growth | 20–30% |
| Pre-IPO (S-1 filed) | 10–20% |
| Public but restricted (lockup) | 5–15% |

### Required information from user

- Company name
- Number of shares/options owned
- Type: common stock, preferred stock, ISOs, NSOs, RSUs
- Strike price (for options)
- Most recent known valuation or funding round (date + price)
- Any proof the user can provide (409A, cap table, funding announcement URL)

---

## Mental Models

### Bayesian Updating
Start with the last known valuation (the prior). Update based on: time elapsed, company progress, market conditions for comps. The longer since the last round, the wider the confidence interval.

### Margin of Safety
Private assets deserve a larger margin of safety than public ones. If the last round was at $10/share, a conservative estimate might be $5–7/share after illiquidity discount.

### Expected Value
```
EV = (Best_Case × P_best) + (Base_Case × P_base) + (Worst_Case × P_worst)
```
For early-stage startups, worst case is $0 (probability = 60–90% depending on stage). The EV may be far below the last round price.

### Inversion
"What would make this asset worth $0?" Identify the failure modes. Every private asset has a meaningful probability of zero.

---

## Professional Workflow

```
Receive asset info from user
  ↓
Identify valuation method based on available data
  ↓
If last round price available:
  → Apply time decay (6–12 months since round → discount)
  → Apply illiquidity discount based on stage
  ↓
If company has revenue:
  → Find public comparable companies (via search_web)
  → Apply comp multiples with size/illiquidity discount
  ↓
If options:
  → Apply Black-Scholes with conservative volatility estimate
  ↓
Calculate range: best case, base case, worst case
  ↓
Calculate expected value
  ↓
Deliver estimate with explicit confidence level
```

---

## Decision Framework

### Valuation method selection

```
Is there a recent funding round (< 12 months)?
  ├─ Yes → Last round price, apply illiquidity discount
  └─ No → Does the company have revenue?
            ├─ Yes → Comparable company analysis
            └─ No → Is it an option?
                      ├─ Yes → Black-Scholes with conservative inputs
                      └─ No → Last known valuation, heavily discounted
```

### Confidence by data quality

| Data Available | Confidence | Discount Range |
|---|---|---|
| Recent 409A + secondary trades | Medium-High | 10–25% |
| Recent funding round | Medium | 25–40% |
| Old funding round (> 12 months) | Low-Medium | 35–50% |
| User's guess only | Low | 50–70% |
| No data at all | Very Low | Cannot estimate |

---

## Mathematical Foundation

### Comparable Company Valuation
```
Estimated_Value = Company_Metric × Comparable_Multiple × (1 - Illiquidity_Discount) × (1 - Size_Discount)
```

Common multiples:
- EV/Revenue: 2–10x for SaaS, 0.5–3x for traditional
- EV/EBITDA: 8–20x for profitable companies
- Price/Book: 1–3x for financials

### Black-Scholes (simplified for employee options)
```
C = S × N(d1) - K × e^(-rT) × N(d2)

d1 = [ln(S/K) + (r + σ²/2) × T] / (σ × √T)
d2 = d1 - σ × √T

Where:
S = current stock price (best estimate)
K = strike price
T = time to expiration (years)
r = risk-free rate (10-year Treasury)
σ = volatility (40–60% for startups, 30–40% for pre-IPO)
```

### Expected Value with Probability
```
EV = Best × P(best) + Base × P(base) + Worst × P(worst)

For Series A startup:
EV = ($500K × 0.10) + ($50K × 0.30) + ($0 × 0.60) = $65K
```
Even if the "if it works" value is $500K, the EV may be much lower.

---

## Validation Layer

- [ ] Valuation method appropriate for available data
- [ ] Assumptions explicitly stated (discount rate, comps used, probability weights)
- [ ] Range provided (not just a point estimate)
- [ ] Illiquidity discount applied
- [ ] Source of last valuation cited (user-provided or web research)
- [ ] Confidence level stated
- [ ] "Could be zero" explicitly stated if startup/early-stage
- [ ] If options: strike price, expiration, and vesting schedule noted

---

## Professional Heuristics

- **"Your startup equity is worth $0 until it isn't."** Treat it as a lottery ticket in financial planning. Don't count it toward retirement or debt payoff.
- **"The last round price is an asking price, not a selling price."** Preferred stock prices don't reflect what common shareholders would get in a sale.
- **"If you can't explain the valuation in two sentences, it's too uncertain to rely on."**
- **"Secondary markets are the best signal."** If the company trades on Forge/EquityZen, those prices are more real than the last funding round.
- **"Time kills private valuations."** A 2-year-old Series A valuation with no new funding is stale. Apply heavy discount.

---

## Edge Cases

- **Company hasn't raised in 2+ years:** The valuation is effectively unknown. Apply 50%+ discount to last round. Flag as extremely uncertain.
- **Company is rumored to be struggling:** Downgrade. Private companies don't announce bad news. If employees are leaving or there are layoff rumors, the last round price is optimistic.
- **Tender offer received:** This is a real offer to buy your shares. Value at the offer price minus any fees, but note this is a conditional bid, not a market price.
- **Down round:** Company raised at a lower valuation. The last round IS the current mark. No discount needed — it's already reflected.
- **SPAC / IPO announced:** Upgrade confidence. The market will soon provide a real price. Liquidity is coming.
- **Options underwater:** Strike price > current estimated value. The options are worth $0 if the company hasn't grown enough. Note: they're not worthless forever — they still have time value.

---

## Communication Standards

```
## Private Asset Valuation: [Company Name]

**Asset**: [Shares/Options] in [Company]
**Data Sources**: [409A date, last round date, secondary trades, user provided]

### Valuation Estimate
| Case | Per Share | Total Value | Probability |
|---|---|---|---|
| Best | $X | $X | X% |
| Base | $X | $X | X% |
| Worst | $0 | $0 | X% |

**Expected Value**: ~$X (range: $X – $X)
**Illiquidity Discount Applied**: X%
**Confidence**: Low — [reason]

### Key Assumptions
- [Assumption 1]
- [Assumption 2]

### Risks
- This could be worth $0 if [scenario]
- The last known valuation is [X] months old

**Recommendation**: Treat this estimate as a rough guide only. Do not include in your retirement or debt payoff planning.
```

---

## Teaching Layer

**Common misconception:** "My company just raised at a $100M valuation and I own 0.5% so I'm worth $500K." → "That's the preferred stock price. Common stock (what you likely own) is worth less. Plus, you can't sell. Plus, the company might fail. Your expected value is probably much lower."

**Analogy:** "Private company stock is like a house that hasn't been appraised in 2 years, in a neighborhood with no recent sales, that you can't list on the market. You can guess the value, but you won't know until someone writes a check."

---

## Cross-Skill Integration

- **Triggers:** `search_web` for comps, recent funding news, secondary market data
- **Feeds into:** Portfolio allocation (private assets are part of net worth but NOT liquid)
- **Coordinates with:** `portfolio_analyze` (include in "Other/Alternative" allocation)
- **Note to other agents:** Private assets should NOT be counted toward retirement readiness or debt payoff capacity unless there's a real liquidity event on the horizon.
