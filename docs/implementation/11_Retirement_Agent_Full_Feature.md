# 11 — Retirement Agent: Full Feature

## What & Why
401k/IRA projection engine. Monte Carlo simulation. Retirement readiness score 0-100. Contribution optimizer. Tax-advantaged account strategy. Per 03_Retirement_agent_system_prompt.md and Retirement_agent_skills.

## Files to Create / Modify
```
backend/
├── agents/
│   ├── retirement.py           # Retirement agent runner
│   └── prompts/
│       └── retirement.py       # Retirement agent prompt
├── services/
│   ├── retirement_projection.py # Monte Carlo engine
│   └── readiness_scorer.py      # 0-100 score
├── routers/
│   └── retirement.py            # endpoints
frontend/
├── src/
│   ├── pages/
│   │   └── Retirement.tsx
│   ├── components/
│   │   └── retirement/
│   │       ├── RetirementScore.tsx
│   │       ├── ProjectionChart.tsx
│   │       ├── AccountBreakdown.tsx
│   │       ├── ContributionOptimizer.tsx
│   │       └── TaxStrategy.tsx
│   ├── api/
│   │   └── retirement.ts
│   └── hooks/
│       └── useRetirement.ts
```

## Steps
1. `backend/agents/prompts/retirement.py` — port 03_Retirement_agent_system_prompt.md. R.C.T.F. structure. C.O.R.E. reasoning. Account hierarchy: match → tax-advantaged → Roth vs Traditional.
2. `backend/services/retirement_projection.py` — Monte Carlo engine: inputs (current_age, retirement_age, current_savings, annual_contribution, expected_return, inflation, withdrawal_rate). 1000 simulations. Return median, p10, p90. Success rate (not running out).
3. `backend/services/readiness_scorer.py` — dimensions: savings_rate (0-30), age_alignment (0-25), diversification (0-20), tax_efficiency (0-15), income_replacement (0-10). Weighted → 0-100.
4. `backend/agents/retirement.py` — RetirementAgent(BaseAgent): Pull retirement accounts, user context. Run Monte Carlo. Calculate readiness score. Generate contribution optimization. Emit RetirementRecommendation.
5. `backend/routers/retirement.py` — GET /retirement/projection, GET /retirement/score, POST /retirement/recommendations, GET /retirement/accounts.
6. `RetirementScore.tsx` — gauge/meter 0-100. Color: red (<40), yellow (40-70), green (>70). Sub-score breakdown tooltip.
7. `ProjectionChart.tsx` — Recharts area chart. Median line with p10/p90 confidence band. Target retirement income reference line.
8. `AccountBreakdown.tsx` — per-account cards: 401k, Roth IRA, Traditional IRA, HSA. Balance, contribution rate, employer match %.
9. `ContributionOptimizer.tsx` — ordered list: 1. Max employer match, 2. Max Roth IRA, 3. Max 401k, 4. HSA, 5. Taxable. Current vs recommended amounts.
10. `TaxStrategy.tsx` — Roth vs Traditional recommendation based on current vs expected retirement tax bracket.
11. Playwright: load retirement page, verify score meter, projection chart with band, optimizer list, account cards.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (retirement dashboard, score meter design)
- `ui-animation` (score gauge animation, chart transitions)

## GitHub Repos Needed
- `numpy/numpy` (Monte Carlo simulation math)

## Edge Cases & Risks
- Young user (<25) → low savings, wide confidence bands. Positive framing, show compound growth potential.
- Near-retirement (>55) → urgent tone, higher precision. Focus on withdrawal strategy.
- No retirement accounts → prompt to add manually. Pre-fill common account types.
- Simulation perf → cap 1000 runs, cache results, recalc only on input change.
- Employer match tiers → handle 100% of first 3%, 50% of next 2%, etc.
- Social Security → use SSA quick calc formula, flag as estimate not guarantee.

## Done When
- [ ] Monte Carlo runs 1000 simulations, returns median + percentile bands
- [ ] Readiness score 0-100 with sub-score breakdown
- [ ] Projection chart renders with confidence band
- [ ] Contribution optimizer shows prioritized list, current vs recommended
- [ ] Tax strategy recommends Roth vs Traditional with reasoning
- [ ] Retirement page loads: score, projection, accounts, optimizer
- [ ] Playwright: full page renders, score meter visible, projection chart interactive
- [ ] Git: review diff, squash merge to main with `[11] Retirement agent full feature`