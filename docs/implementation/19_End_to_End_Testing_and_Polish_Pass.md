# 19 — End-to-End Testing & Polish Pass

## What & Why
Full Playwright E2E suite: happy paths, error states, edge cases across all 18 plans. Lighthouse audit for perf/accessibility/SEO. Final impeccable + ui-animation polish on all UI surfaces. Full owasp-security-check audit. This is the final pass before launch.

## Files to Create / Modify
```
e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.setup.ts          # login + state setup
│   ├── mock-data.ts           # seed data factories
│   └── api-mocks.ts           # mock all external APIs
├── specs/
│   ├── 01-auth.spec.ts
│   ├── 02-onboarding.spec.ts
│   ├── 03-portfolio.spec.ts
│   ├── 04-recommendations.spec.ts
│   ├── 05-debt.spec.ts
│   ├── 06-retirement.spec.ts
│   ├── 07-agent-streaming.spec.ts
│   ├── 08-execution-tracking.spec.ts
│   ├── 09-community.spec.ts
│   ├── 10-backtest.spec.ts
│   ├── 11-offline.spec.ts
│   ├── 12-mobile.spec.ts
│   ├── 13-a11y.spec.ts
│   └── 14-cross-agent.spec.ts
├── reports/
│   └── lighthouse/            # LH output
frontend/src/
│   (all components touched for polish)
```

## Steps

### Part A: Playwright E2E Suite
1. `e2e/playwright.config.ts` — projects: chromium, mobile-chrome (Pixel 5), mobile-safari (iPhone 13). BaseURL localhost:5173. Retries: 2. Timeout: 30s. Global setup: seed DB + mock external APIs.
2. `e2e/fixtures/auth.setup.ts` — authenticated page fixture. Login once, save storageState. Reuse across tests. Clear state between specs.
3. `e2e/fixtures/api-mocks.ts` — mock all external APIs (Alpaca, Plaid, Finnhub, Upstash). Return realistic data from seed factories. No real API calls in CI.
4. Spec coverage (one file per feature):
   - `01-auth.spec.ts` — register, login, logout, token refresh, protected routes, invalid credentials
   - `02-onboarding.spec.ts` — full setup wizard flow, skip option, resume later, validation errors
   - `03-portfolio.spec.ts` — holdings table, allocation pie, performance chart, empty state, loading skeleton
   - `04-recommendations.spec.ts` — C.O.R.E. pipeline display, accept/reject, agent reasoning visible
   - `05-debt.spec.ts` — link Plaid, debt list, avalanche/snowball toggle, payoff timeline, empty state
   - `06-retirement.spec.ts` — projection chart, Monte Carlo histogram, readiness score, contribution slider
   - `07-agent-streaming.spec.ts` — WebSocket streaming, live reasoning text, agent selector, "Run All"
   - `08-execution-tracking.spec.ts` — accept → execute flow, check-in banner, follow-through score update
   - `09-community.spec.ts` — vote widget, rate limit, leaderboard, benchmark percentiles
   - `10-backtest.spec.ts` — strategy builder, run backtest, parameter sweep, paper trade
   - `11-offline.spec.ts` — emulate offline, cached data renders, queue mutations, reconnect drain
   - `12-mobile.spec.ts` — mobile viewport rendering, touch interactions, PWA install prompt
   - `13-a11y.spec.ts` — axe-core integration, tab navigation, screen reader labels, focus management
   - `14-cross-agent.spec.ts` — debt-vs-invest dilemma, retirement-vs-debt, conflicting recommendations

### Part B: Lighthouse Audit
5. Run Lighthouse CI on all pages: dashboard, portfolio, debt, retirement, backtest, settings.
   Targets: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 85, SEO ≥ 80.
   Fix low scores: code splitting, image optimization, meta tags, aria labels, color contrast.

### Part C: Polish Pass (impeccable + ui-animation)
6. Ocean dashboard polish:
   - Fin animation: smooth sine-wave oscillation, responsive to scroll position
   - Sidebar transitions: 200ms ease-out, backdrop blur
   - Loading states: subtle shimmer/skeleton, not jarring spinners
   - Empty states: helpful illustrations, not blank screens. "Connect Alpaca to see your portfolio" with cute fish graphic
7. Typography & spacing audit:
   - Consistent vertical rhythm (4px grid)
   - Font hierarchy: headings 2x body, labels 0.875x
   - Color contrast: all text ≥ 4.5:1 on backgrounds
8. Motion audit:
   - Page transitions: 150ms fade + 50px slide-up
   - Card hover: subtle lift (2px translateY + box-shadow)
   - Number changes: animated count-up
   - Agent streaming: typewriter effect with cursor
   - Toast notifications: slide-in-right 300ms, auto-dismiss 5s
9. Responsive audit:
   - All pages work at 320px → 2560px
   - Table → card layout on mobile
   - Touch targets ≥ 44px
   - No horizontal scroll

### Part D: Security Audit (owasp-security-check)
10. Full OWASP pass:
    - Auth: JWT expiry, refresh rotation, CSRF tokens, secure httpOnly cookies
    - Injection: SQL (parameterized), NoSQL, command injection
    - XSS: CSP headers, output encoding, React's built-in XSS protection
    - Credentials: encryption verified, key material in env only, audit log
    - Rate limiting: all POST endpoints, login (5/min), voting (20/hr), refresh (1/min)
    - CORS: strict origin list, no wildcard
    - Dependencies: npm audit, pip audit, no critical vulns

## Skills to Use
- `subagent-driven-development` (parallel spec creation)
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (full polish pass)
- `ui-animation` (motion audit)
- `owasp-security-check` (security audit)
- Playwright MCP (all browser verification)

## GitHub Repos Needed
- `microsoft/playwright` (E2E testing)
- `GoogleChrome/lighthouse-ci` (performance + a11y audits)

## Edge Cases & Risks
- Flaky tests → retry: 2, deterministic seed data, no time-based assertions, mock Date.now()
- Lighthouse variance → run 3x, take median. CI environment stable.
- Animation tests → disable animations in test (prefers-reduced-motion), test logic, not pixels
- External API mocks drift → regenerate mocks from real API snapshots monthly
- Performance regression from polish → lazy load animations, use will-change sparingly, CSS GPU compositing
- Security audit false positives → triage each finding, document false-positives

## Done When
- [ ] 14 spec files with 100+ total test cases, all passing
- [ ] Chromium + mobile Chrome + mobile Safari projects all green
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 85, SEO ≥ 80
- [ ] All pages responsive (320px → 2560px), no horizontal scroll
- [ ] Ocean fin animation smooth, loading states present, empty states helpful
- [ ] Motion: page transitions, card hover, count-up, typewriter, toast animations
- [ ] Typography: 4px grid, clear hierarchy, 4.5:1 contrast minimum
- [ ] OWASP check: no critical/high findings, all medium remediated or documented
- [ ] npm audit + pip audit: 0 critical/high
- [ ] CSP headers set, CORS strict, rate limiting on all mutations
- [ ] Full CI pipeline: lint → type-check → unit tests → Playwright E2E → Lighthouse → deploy preview
- [ ] Git: review diff, squash merge to main with `[19] E2E testing & polish pass`