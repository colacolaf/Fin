# 10 — Debt Agent: Full Feature

## What & Why
Plaid integration for liabilities. Debt avalanche/snowball payoff calculator. Payment tracking. Payoff timeline visualization. Debt-to-income ratio. Per 02_Debt_agent_system_prompt.md and Debt_agent_skills.

## Files to Create / Modify
```
backend/
├── agents/
│   ├── debt.py              # Debt agent runner
│   └── prompts/
│       └── debt.py          # Debt agent prompt template
├── services/
│   ├── debt_calculator.py   # avalanche/snowball math
│   └── plaid_integration.py # Plaid Link wrapper
├── integrations/
│   └── plaid.py             # plaid-python client
├── routers/
│   └── debt.py              # endpoints
frontend/
├── src/
│   ├── pages/
│   │   └── Debt.tsx
│   ├── components/
│   │   ├── debt/
│   │   │   ├── DebtSummary.tsx
│   │   │   ├── DebtAccountCard.tsx
│   │   │   ├── PayoffTimeline.tsx
│   │   │   ├── PayoffStrategyToggle.tsx
│   │   │   ├── DebtToIncomeRatio.tsx
│   │   │   └── PaymentTracker.tsx
│   │   └── charts/
│   │       └── PayoffChart.tsx
│   └── api/
│       └── debt.ts
```

## Steps
1. `backend/agents/prompts/debt.py` — port 02_Debt_agent_system_prompt.md. R.C.T.F. structure. C.O.R.E. reasoning. Behavioral personalization for payoff style.
2. `backend/integrations/plaid.py` — Plaid client (plaid-python). create_link_token(user_id), exchange_public_token(public_token) → access_token + item_id. get_liabilities(access_token) → debts.
3. `backend/services/plaid_integration.py` — store Plaid access_tokens encrypted (Fernet, same as Alpaca). Pull liabilities → upsert DebtAccount rows.
4. `backend/services/debt_calculator.py` — calculate_payoff(debt_accounts, strategy, extra_payment): avalanche (highest interest first) vs snowball (lowest balance first). Returns monthly schedule until full payoff.
5. `backend/agents/debt.py` — DebtAgent(BaseAgent): Pull debts from Plaid + manual. Generate payoff plan. Recommend strategy based on user psychology. Emit DebtRecommendation objects.
6. `backend/routers/debt.py` — GET /debt/accounts, POST /debt/link-token (create Plaid link token), POST /debt/exchange-token, GET /debt/payoff-plan?strategy=avalanche|snowball, POST /debt/recommendations (trigger agent run).
7. `DebtSummary.tsx` — total debt, total monthly payments, avg interest rate, debt-to-income ratio. Stat cards.
8. `DebtAccountCard.tsx` — per-account card: name, balance, APR, min payment, progress bar toward payoff.
9. `PayoffStrategyToggle.tsx` — Avalanche vs Snowball toggle. Description of each. Visual preview: which debts get paid first.
10. `PayoffTimeline.tsx` — Recharts line/area chart: total debt declining over months. Projected payoff date marker.
11. `PaymentTracker.tsx` — log manual payments, track against plan. Show ahead/behind indicator.
12. Playwright: full flow — connect Plaid (sandbox), view debts, toggle strategy, see timeline change, accept recommendation.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (Plaid token storage, financial data exposure)
- `impeccable` (debt dashboard, payoff visualization)
- `ui-animation` (strategy toggle, progress bars)

## GitHub Repos Needed
- `plaid/plaid-python` (Plaid API client)

## Edge Cases & Risks
- No debts → show "Debt-free! 🎉" with DTI confirmation
- Single debt → both strategies identical, show explanation why
- Many debts (>20) → scrollable, group by type (credit card, student, mortgage)
- Plaid sandbox vs production → use sandbox for dev, document setup steps
- Manual debt entry → fallback if no Plaid. Add debt account form with fields.
- Payoff projection accuracy → fixed-rate calc sufficient for MVP, no Monte Carlo needed

## Done When
- [ ] Plaid Link integration works (create link token, exchange, pull liabilities)
- [ ] Debt accounts displayed with correct balances, APRs, min payments
- [ ] Avalanche and snowball payoff plans calculate correctly
- [ ] Strategy toggle switches between plans, timeline chart updates
- [ ] Debt-to-income ratio displayed and color-coded
- [ ] Manual payment logging updates balances and timeline
- [ ] Playwright: mock Plaid flow, debt dashboard renders, strategy toggle + timeline verified
- [ ] Git: review diff, squash merge to main with `[10] Debt agent full feature`