# 06 — Setup Wizard

## What & Why
Multi-step onboarding: connect broker (Alpaca), risk tolerance quiz, financial goals, monthly budget. React Hook Form + Zod validation. React Joyride tour for first-time users. Per Setup_wizard_full_flow.md and Setup_wizard_frontend_spec.md.

## Files to Create / Modify
```
backend/
├── routers/
│   └── settings.py       # PUT /settings/onboarding
frontend/
├── src/
│   ├── pages/
│   │   └── SetupWizard.tsx
│   ├── components/
│   │   └── setup/
│   │       ├── StepBrokerConnect.tsx
│   │       ├── StepRiskTolerance.tsx
│   │       ├── StepGoals.tsx
│   │       ├── StepBudget.tsx
│   │       ├── StepReview.tsx
│   │       ├── ProgressBar.tsx
│   │       └── TourGuide.tsx
│   ├── hooks/
│   │   └── useSetupWizard.ts
│   └── schemas/
│       └── setupWizard.ts
```

## Steps
1. `setupWizard.ts` — Zod schemas:
   - brokerStep: Alpaca API key, secret, paper/live toggle
   - riskStep: risk_tolerance (1-10), investment_horizon (years), loss_reaction (enum)
   - goalsStep: goals array (retirement, house, education, freedom, other), target amounts
   - budgetStep: monthly_income, monthly_expenses, investable_amount
2. `useSetupWizard.ts` — wizard state: currentStep (0-4), form data accumulated, next/back/complete. On complete: POST to PUT /settings/onboarding.
3. `StepBrokerConnect.tsx` — Alpaca API key + secret fields (masked), paper trading checkbox. "Get API Keys" link. POST /integrations/alpaca/test to verify.
4. `StepRiskTolerance.tsx` — Slider 1-10 (Conservative ↔ Aggressive). Horizon dropdown. Loss reaction: Sell/Hold/Buy more. Visual risk meter.
5. `StepGoals.tsx` — Checkbox grid for goals. Target amount + timeline per selected goal.
6. `StepBudget.tsx` — Monthly income/expenses inputs. Auto-calculate investable amount.
7. `StepReview.tsx` — Summary of all selections. Edit button per section. "Complete Setup" button.
8. `ProgressBar.tsx` — 5 steps, current position, completed checkmarks.
9. `TourGuide.tsx` — React Joyride. Steps: sidebar, sync indicator, agent cards, settings. Run after wizard if `onboarding_complete`.
10. `SetupWizard.tsx` — compose steps with progress bar. Fade transition (200ms). Mobile responsive.
11. Wire PUT /settings/onboarding — save broker config, risk profile, goals, budget. Set `onboarding_complete=true`.
12. Playwright: full wizard flow. Fill each step, validate, complete, verify redirect + Joyride tour.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (wizard UX, form design, step transitions, mobile)
- `ui-animation` (step transitions, progress bar)

## GitHub Repos Needed
- `react-hook-form/react-hook-form` (form state)
- `colinhacks/zod` (validation)
- `gilbarbara/react-joyride` (onboarding tour)

## Edge Cases & Risks
- API key validation fails → friendly error, allow skip
- Mid-flow abandonment → persist to localStorage, resume on next visit
- Risk slider accessibility → keyboard navigable, aria labels
- Budget: expenses > income → warning not error, show negative investable in red
- Paper trading → default ON for new users
- Mobile: touch targets ≥44px

## Done When
- [ ] 5-step wizard with progress bar
- [ ] Zod validation catches invalid inputs
- [ ] Broker connection test endpoint returns success/failure
- [ ] Settings saved to DB, onboarding_complete flag set
- [ ] Redirect to dashboard after wizard complete
- [ ] React Joyride tour triggers on first dashboard visit
- [ ] Form state persists in localStorage
- [ ] Playwright: full wizard flow (all 5 steps + broker test + complete + redirect)
- [ ] Git: review diff, squash merge to main with `[06] Setup wizard`