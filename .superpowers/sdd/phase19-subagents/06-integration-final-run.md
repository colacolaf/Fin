# Subagent 6: Integration, Final Test Run & Launch Readiness

## Scope
The final integration subagent — run the entire E2E suite across all browsers, verify everything works together, fix regressions, produce the launch-readiness report.

## Skills to Use
- **`planning-and-task-breakdown`**: Create the final execution plan
- **`code-review-and-quality`**: Review all changes from subagents 1-5 for conflicts/regressions
- **`ponytail`**: Simplest fixes for any last integration issues

## MCP Servers
- **playwright** (`@playwright/mcp`): Full test suite execution across all browser projects
- **basic-memory** (`~/.fin/memory/`): Record launch-readiness decision for future reference

## GitHub References
- **Playwright test runner**: https://playwright.dev/docs/running-tests
- **Playwright reporters**: https://playwright.dev/docs/test-reporters
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci

## Prerequisites (from subagents 1–5)
- [ ] Subagent 1: 5 spec files passing (01-auth, 02-portfolio, 03-wizard, 04-recommendations, 05-debt) + auth.setup.ts
- [ ] Subagent 2: 7 spec files passing (06-retirement, 07-execution, 08-community, 09-backtest, 10-data-refresh, 11-settings, 14-cross-agent)
- [ ] Subagent 3: 12-mobile + 13-a11y passing, Lighthouse scores ≥ targets
- [ ] Subagent 4: UI polish implemented, no visual regressions
- [ ] Subagent 5: Security audit complete, all Critical/High fixed

## Tasks

### 1. Playwright Config Finalization
- [ ] Verify `frontend/playwright.config.ts` has all browser projects:
  - `chromium` (desktop, 1280×720)
  - `mobile-chrome` (Pixel 5, 393×851)
  - `mobile-safari` (iPhone 14, 390×844)
- [ ] Configure `auth.setup.ts` as global setup dependency
- [ ] Verify storage state reuse across specs
- [ ] Configure test retries: 1 retry on CI, 0 locally
- [ ] Configure parallel workers: 4 workers max
- [ ] Configure HTML reporter output: `frontend/test-results/`
- [ ] Set global timeout: 60s per test

### 2. Full Suite Execution — Chromium
- [ ] Run: `npx playwright test --project=chromium` — all 14 spec files
- [ ] Capture full HTML report
- [ ] Document all failures:
  - Flaky tests: fix with proper `waitForSelector` / `waitForResponse` instead of `waitForTimeout`
  - Selector mismatches: update selectors to match actual rendered UI
  - API mock gaps: add missing route mocks
- [ ] Re-run until 100% pass rate (2 consecutive green runs)

### 3. Full Suite Execution — Mobile Browsers
- [ ] Run: `npx playwright test --project=mobile-chrome` — all mobile tests
- [ ] Run: `npx playwright test --project=mobile-safari` — all mobile tests
- [ ] Fix mobile-specific issues (viewport, touch events, safe areas)
- [ ] Verify 100% pass rate on both mobile projects

### 4. Cross-Browser Visual Consistency
- [ ] Screenshot comparison: same page across Chromium, mobile-Chrome, mobile-Safari
- [ ] Check for: layout shifts, font rendering differences, SVG/Canvas differences
- [ ] Document any acceptable differences (WebKit vs Blink rendering)
- [ ] Fix any broken differences (elements cut off, overlapping)

### 5. Regression Check — UI Polish
- [ ] Verify subagent 4's CSS/animation changes didn't break any E2E selectors
- [ ] Verify animation-related `waitForTimeout` calls still work (or replace with proper waits)
- [ ] Check for `prefers-reduced-motion` in test environment (should not cause failures)

### 6. Regression Check — Security
- [ ] Verify subagent 5's security headers don't block playwright's test runner
- [ ] Verify rate limiter doesn't interfere with E2E tests (bypass in test mode or mock)
- [ ] Verify CSP doesn't block test fixtures or mock scripts

### 7. Lighthouse Final Verification
- [ ] Run `lhci autorun` against production build
- [ ] Verify all 5 URLs pass all 4 category thresholds
- [ ] Generate Lighthouse report JSON + HTML
- [ ] If any URL fails, fix and re-run

### 8. Performance Baseline
- [ ] Measure: full test suite runtime (all 3 projects)
- [ ] Measure: per-spec runtime (identify slowest specs)
- [ ] Bundle size check: `vite build` output analysis
- [ ] API response time check: mock latency < 200ms in tests

### 9. Launch Readiness Report
Create `docs/implementation/19_Launch_Readiness_Report.md`:

```markdown
# Phase 19 — Launch Readiness Report

## E2E Test Suite
| Project | Specs | Tests | Pass | Fail | Skip |
|---------|-------|-------|------|------|------|
| chromium | 14 | XX | XX | 0 | 0 |
| mobile-chrome | 14 | XX | XX | 0 | 0 |
| mobile-safari | 14 | XX | XX | 0 | 0 |

## Lighthouse Scores
| URL | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
| /dashboard | XX | XX | XX | XX |
| /portfolio | XX | XX | XX | XX |
| /recommendations | XX | XX | XX | XX |
| /debt | XX | XX | XX | XX |
| /retirement | XX | XX | XX | XX |

## Security Audit
- Critical: 0
- High: 0
- Medium: X (documented)
- Low: X (documented)

## UI Polish
- [x] All pages responsive 320-2560px
- [x] Loading states present
- [x] Empty states present
- [x] Error states present
- [x] Animations at 60fps
- [x] prefers-reduced-motion respected

## Known Issues (Non-blocking)
1. ...
2. ...

## Launch Recommendation
[ ] READY — All criteria met, proceed to production
[ ] CONDITIONAL — Ready with documented known issues
[ ] NOT READY — Critical issues remaining: ...
```

### 10. Git Tag & Documentation
- [ ] Verify all changes committed to feature branch
- [ ] Create PR description summarizing Phase 19
- [ ] Tag: `git tag -a v1.0.0-phase19 -m "Phase 19: E2E testing, polish, security complete"`
- [ ] Update `docs/implementation/19_End_to_End_Testing_and_Polish_Pass.md` with completion status

## Output Requirements
- Playwright HTML report: `frontend/test-results/report.html`
- Lighthouse reports: `frontend/test-results/lighthouse/`
- Launch readiness report: `docs/implementation/19_Launch_Readiness_Report.md`
- All 14 spec files × 3 projects = 42 green runs

## Done Criteria
- `npx playwright test` — 100% pass across all 3 projects, 2 consecutive runs
- Lighthouse: all 5 URLs pass all 4 thresholds
- Security: 0 Critical, 0 High
- Launch readiness report complete with GO/NO-GO recommendation
- Git tag applied