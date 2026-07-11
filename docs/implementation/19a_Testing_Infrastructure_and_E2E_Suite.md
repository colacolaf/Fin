# 19a — Testing Infrastructure & E2E Suite

## What & Why
First half of Phase 19. Set up comprehensive Playwright E2E test infrastructure with fixtures, API mocking, multi-browser support, and Lighthouse CI integration. This establishes the testing foundation before the polish pass in 19b.

## Scope: Parts A + B from Phase 19

### Part A: Playwright E2E Suite
- Upgrade `playwright.config.ts` with multi-browser projects, retries, global setup
- Create `e2e/fixtures/auth.setup.ts` — authentication fixture with storageState
- Create `e2e/fixtures/mock-data.ts` — seed data factories for all domains
- Create `e2e/fixtures/api-mocks.ts` — mock all external APIs (Alpaca, Plaid, Finnhub, Upstash)
- Write 14 spec files covering all features
- Achieve 100+ test cases across all specs

### Part B: Lighthouse CI
- Set up `lighthouserc.js` configuration
- Target scores: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 85, SEO ≥ 80
- Add npm scripts for Lighthouse runs

## Files to Create / Modify

```
frontend/
├── playwright.config.ts          (MODIFY — add projects, fixtures, globalSetup)
├── package.json                  (MODIFY — add lighthouse scripts)
├── lighthouserc.js               (CREATE — LH CI config)
├── e2e/
│   ├── fixtures/
│   │   ├── auth.setup.ts         (CREATE)
│   │   ├── mock-data.ts          (CREATE)
│   │   └── api-mocks.ts          (CREATE)
│   ├── specs/                    (CREATE dir, move existing specs here)
│   │   ├── 01-auth.spec.ts       (CREATE)
│   │   ├── 02-onboarding.spec.ts (CREATE — extends wizard.spec.ts)
│   │   ├── 03-portfolio.spec.ts  (CREATE — extends dashboard.spec.ts)
│   │   ├── 04-recommendations.spec.ts (CREATE)
│   │   ├── 05-debt.spec.ts       (CREATE)
│   │   ├── 06-retirement.spec.ts (CREATE — extends retirement.spec.ts)
│   │   ├── 07-agent-streaming.spec.ts (CREATE — extends orchestration.spec.ts)
│   │   ├── 08-execution-tracking.spec.ts (CREATE — extends execution.spec.ts)
│   │   ├── 09-community.spec.ts  (CREATE — extends community.spec.ts)
│   │   ├── 10-backtest.spec.ts   (CREATE — extends backtest.spec.ts)
│   │   ├── 11-offline.spec.ts    (CREATE — extends offline.spec.ts)
│   │   ├── 12-mobile.spec.ts     (CREATE)
│   │   ├── 13-a11y.spec.ts       (CREATE)
│   │   └── 14-cross-agent.spec.ts (CREATE)
│   └── reports/
│       └── lighthouse/           (CREATE dir — LH output)
```

## Steps

### Step 1: Upgrade Playwright Config
1. Modify `playwright.config.ts`:
   - Projects: chromium (Desktop), mobile-chrome (Pixel 5), mobile-safari (iPhone 13)
   - BaseURL: `http://localhost:5173`
   - Retries: 2 in CI, 0 locally
   - Timeout: 30s per test
   - Global setup: seed DB + mock external APIs
   - StorageState for auth reuse
   - Disable animations via `prefers-reduced-motion: reduce`

### Step 2: Create Test Fixtures
2. `e2e/fixtures/auth.setup.ts`:
   - Authenticated page fixture using storageState
   - Login once per worker, reuse across tests
   - Clear state between specs via test isolation
   - Helper: `authenticatedPage` fixture that auto-attaches auth state

3. `e2e/fixtures/mock-data.ts`:
   - Factory functions for: user, portfolio, holdings, recommendations, debts, retirement projections, community votes, backtest results
   - Deterministic seed data (no randomness in tests)
   - Helper: `seedDatabase()` for backend seeding

4. `e2e/fixtures/api-mocks.ts`:
   - Mock Alpaca: positions, orders, account info
   - Mock Plaid: linked accounts, transactions
   - Mock Finnhub: quotes, candles, news
   - Mock Upstash: cache get/set
   - All mocks return realistic, deterministic data
   - No real API calls in CI

### Step 3: Write 14 Spec Files
5. Migrate existing e2e specs into `e2e/specs/` directory (rename/extend):
   - `dashboard.spec.ts` → `03-portfolio.spec.ts`
   - `wizard.spec.ts` → `02-onboarding.spec.ts`
   - `retirement.spec.ts` → `06-retirement.spec.ts`
   - `orchestration.spec.ts` → `07-agent-streaming.spec.ts`
   - `execution.spec.ts` → `08-execution-tracking.spec.ts`
   - `community.spec.ts` → `09-community.spec.ts`
   - `backtest.spec.ts` → `10-backtest.spec.ts`
   - `offline.spec.ts` → `11-offline.spec.ts`

6. Create new specs:
   - `01-auth.spec.ts`: register, login, logout, token refresh, protected routes, invalid credentials
   - `04-recommendations.spec.ts`: C.O.R.E. pipeline display, accept/reject, agent reasoning visible
   - `05-debt.spec.ts`: link Plaid, debt list, avalanche/snowball toggle, payoff timeline, empty state
   - `12-mobile.spec.ts`: mobile viewport rendering, touch interactions, PWA install prompt
   - `13-a11y.spec.ts`: axe-core integration, tab navigation, screen reader labels, focus management
   - `14-cross-agent.spec.ts`: debt-vs-invest dilemma, retirement-vs-debt, conflicting recommendations

### Step 4: Lighthouse CI Setup
7. Create `lighthouserc.js`:
   - URLs to audit: `/`, `/dashboard`, `/portfolio`, `/debt`, `/retirement`, `/backtest`, `/settings`
   - Assertions: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 85, SEO ≥ 80
   - Run 3x, take median

8. Add npm scripts to `package.json`:
   - `"test:e2e": "playwright test"`
   - `"test:e2e:ui": "playwright test --ui"`
   - `"test:e2e:mobile": "playwright test --project=mobile-chrome --project=mobile-safari"`
   - `"lh": "lhci autorun"`

### Step 5: Dependencies
9. Install required dev dependencies:
   - `@playwright/test` (already present — verify version)
   - `@axe-core/playwright` (for a11y tests)
   - `@lhci/cli` (Lighthouse CI CLI)

## Skills to Use
- `caveman` — concise communication throughout
- `ponytail` — simplest solution that works
- `subagent-driven-development` — parallel spec creation
- `code-review-and-quality` — review all test code
- `superpowers-lab` — experimental testing patterns
- Playwright MCP — browser verification

## Edge Cases & Risks
- Flaky tests → retry: 2, deterministic seed data, mock Date.now()
- Lighthouse variance → run 3x, take median
- Animation tests → disable animations in test (prefers-reduced-motion)
- External API mocks drift → use factory pattern for easy updates
- Existing specs have unknown quality → review and fix before extending

## Done When
- [ ] `playwright.config.ts` upgraded with 3 browser projects
- [ ] 3 fixture files created and working
- [ ] 14 spec files with 100+ total test cases
- [ ] All tests pass on chromium, mobile-chrome, mobile-safari
- [ ] `lighthouserc.js` created with assertions
- [ ] Lighthouse scores meet thresholds (P≥85, A≥90, BP≥85, SEO≥80)
- [ ] `npm run test:e2e` runs successfully
- [ ] Git: squashed commit with `[19a] E2E testing infrastructure`