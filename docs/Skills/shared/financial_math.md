# Shared Financial Mathematics

> Reference for all agents. Formulas, assumptions, edge cases, and common mistakes.

---

## Time Value of Money

### Future Value (FV)

```
FV = PV × (1 + r)^n
```

| Variable | Meaning | Constraints |
|---|---|---|
| PV | Present value | > 0 |
| r | Periodic rate (decimal) | Typically 0.01–0.20 annually for realistic returns |
| n | Number of periods | > 0 |

**Assumptions:** Constant rate, no contributions/withdrawals mid-period.  
**Edge case:** When r is negative (deflation/crisis), FV < PV.  
**Common mistake:** Using nominal rate when real rate is needed. Always adjust for inflation when projecting purchasing power.

### Future Value of Periodic Contributions (Annuity Future Value)

```
FV = PMT × ((1 + r)^n - 1) / r
```

| Variable | Meaning |
|---|---|
| PMT | Periodic contribution |
| r | Periodic rate |
| n | Number of periods |

**Assumptions:** Contributions at end of each period, constant rate.  
**Edge case:** For contributions at beginning of period, multiply result by (1 + r).  
**Common mistake:** Forgetting to account for employer match in retirement calculations.

### Present Value (PV)

```
PV = FV / (1 + r)^n
```

Used for: Determining how much to invest today to reach a future goal.  
**Professional usage:** Discount rate should reflect opportunity cost. For personal finance, use expected portfolio return (6–10% nominal, 4–7% real). For risk-free, use Treasury rate.

### Net Present Value (NPV)

```
NPV = Σ (CF_t / (1 + r)^t) - Initial Investment
```

**Decision rule:** NPV > 0 → accept. NPV < 0 → reject.  
**Professional usage:** For debt refinancing, NPV of interest savings minus closing costs.  
**Common mistake:** Using the wrong discount rate. Refinancing should use the risk-free rate, not the portfolio expected return.

### Internal Rate of Return (IRR)

The discount rate that makes NPV = 0.  
**Limitation:** Assumes cash flows reinvested at IRR. Modified IRR (MIRR) uses a separate reinvestment rate.  
**Common mistake:** IRR can produce multiple values when cash flows change sign more than once.

---

## Growth & Return Metrics

### Compound Annual Growth Rate (CAGR)

```
CAGR = (Ending Value / Beginning Value)^(1/n) - 1
```

**Usage:** Smooths out year-to-year volatility to show long-term trend.  
**Limitation:** Does not capture volatility or sequence of returns risk.  
**Common mistake:** Using CAGR to project future returns without acknowledging it's a smoothed historical measure.

### Real vs. Nominal Returns

```
(1 + nominal) = (1 + real) × (1 + inflation)
Real ≈ nominal - inflation  (approximation, OK for rates < 10%)
```

**Professional standard:** Always state whether figures are real or nominal.  
**Conservative assumption:** Use 2–3% for long-term inflation projections.

### Dollar-Weighted Return (IRR of cash flows)

Reflects the investor's actual experience, accounting for timing of contributions/withdrawals.  
**Contrast with:** Time-weighted return (TWR) which removes the effect of cash flows — used for comparing manager performance.

---

## Risk & Volatility

### Standard Deviation (σ)

```
σ = √(Σ(x_i - μ)² / (n - 1))
```

**Usage:** Measure of volatility. Annualized from monthly by multiplying by √12.  
**Professional benchmarks:**
- S&P 500 annual σ: ~15%
- Bonds annual σ: ~3–5%
- Cash: ~0%

### Sharpe Ratio

```
Sharpe = (R_portfolio - R_riskfree) / σ_portfolio
```

**Interpretation:**
- > 1.0: Good
- > 2.0: Excellent
- < 0.5: Poor

**Common mistake:** Using the wrong risk-free rate. Use 3-month T-bill for short-term, 10-year Treasury for long-term.

### Correlation Coefficient (ρ)

```
ρ = Cov(X,Y) / (σ_X × σ_Y)
```

Range: -1 to +1.  
**Usage:** Portfolio diversification. Assets with ρ < 0.7 provide meaningful diversification.

### Herfindahl-Hirschman Index (HHI) for Concentration

```
HHI = Σ(w_i²)  where w_i = weight of holding i in portfolio
```

| HHI Range | Concentration Level |
|---|---|
| < 0.10 | Well diversified |
| 0.10–0.18 | Moderate concentration |
| > 0.18 | High concentration |

**Alternative:** Top-N concentration = sum of top 3 or top 5 holdings as % of portfolio.

---

## Tax-Adjusted Math

### Tax-Equivalent Yield

```
Tax-Equivalent Yield = Tax-Free Yield / (1 - Marginal Tax Rate)
```

**Usage:** Compare municipal bonds (tax-free) to taxable bonds.  
**Common mistake:** Using federal + state rate when munis are only federally tax-exempt.

### After-Tax Return

```
After-Tax Return = Nominal Return × (1 - Tax Rate)

For capital gains (long-term):
After-Tax Return = Nominal Return × (1 - LTCG Rate)

For qualified dividends:
After-Tax Return = Nominal Return × (1 - Qualified Dividend Rate)
```

**Important:** Tax rates differ by holding period, income level, and asset location (taxable vs. tax-advantaged account).

---

## Debt Mathematics

### Monthly Payment (Amortizing Loan)

```
PMT = P × [r(1 + r)^n] / [(1 + r)^n - 1]

Where:
P = Principal
r = Monthly interest rate (APR / 12)
n = Total number of payments
```

### Interest Portion of Payment k

```
Interest_k = Remaining Balance × Monthly Rate
Principal_k = PMT - Interest_k
```

### Remaining Balance After k Payments

```
Balance_k = P × [(1 + r)^n - (1 + r)^k] / [(1 + r)^n - 1]
```

### Weighted Average APR

```
Weighted APR = Σ(Balance_i × APR_i) / Σ(Balance_i)
```

**Usage:** Quick health check of debt portfolio. Compare to expected investment return for debt-vs-invest decisions.

---

## Retirement Mathematics

### Funding Ratio

```
Funding Ratio = Total Retirement Assets / PV of Future Retirement Expenses
```

**Interpretation:**
- > 1.0: Fully funded
- 0.8–1.0: Near funded
- < 0.8: Underfunded

### Safe Withdrawal Rate (SWR)

**Trinity Study baseline:** 4% of initial portfolio, inflation-adjusted annually, for 30-year retirement.  
**Bengen (1994):** 4% rule origin.  
**Modern adjustments:**
- 3.5% for early retirement (40+ year horizon)
- 3.0% for very conservative
- 4.5% may work with flexible spending

**Calculation:**
```
Annual Safe Withdrawal = Portfolio Value × SWR
```

**Required Portfolio:**
```
Required Portfolio = Desired Annual Income / SWR
```

### Replacement Ratio

```
Replacement Ratio = Projected Retirement Income / Pre-Retirement Income
```

**Typical target:** 70–80% of pre-retirement income.  
**Adjustment:** Lower for high savers (they live on less of their income). Higher for low savers.

### Social Security Claiming

- **Full Retirement Age (FRA):** 67 for those born 1960+
- **Early claiming (62):** ~30% reduction from FRA benefit
- **Delayed claiming (70):** ~24% increase over FRA benefit (8% per year after FRA)
- **Breakeven age:** Typically 78–82 for delaying from 62 to 70

---

## Statistical Quick Reference

| Measure | Formula | Usage |
|---|---|---|
| Mean | Σx/n | Average return |
| Median | Middle value | Robust center (less affected by outliers) |
| Percentile | Value below which p% fall | Risk measures (VaR) |
| Beta | Cov(stock, market) / Var(market) | Market sensitivity |
| R² | 1 - (SS_res / SS_tot) | How much variance is explained |

---

## Common Validation Checks

After any calculation, verify:

1. **Sum check:** Percentages total to 100% (or explicitly state if not)
2. **Magnitude check:** Result is within realistic bounds (e.g., annual returns rarely exceed 100% or below -50%)
3. **Sign check:** Positive/negative makes economic sense
4. **Unit check:** Dollars, percentages, years are consistent
5. **Identity check:** Fundamental accounting identities hold (e.g., Assets = Liabilities + Equity)
6. **Sensitivity:** State which inputs drive the result most
