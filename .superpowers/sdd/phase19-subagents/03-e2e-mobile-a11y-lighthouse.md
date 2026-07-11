# Subagent 3: E2E Mobile, Accessibility & Lighthouse CI

## Scope
Complete the mobile-responsive and accessibility E2E specs (12, 13), and implement the Lighthouse CI pipeline to achieve the target scores from Phase 19b.

## Skills to Use
- **`planning-and-task-breakdown`**: Break audits into actionable items
- **`impeccable`**: For accessibility UX review (contrast, focus rings, ARIA labels)
- **`ponytail`**: Simplest fixes that actually work for a11y issues

## MCP Servers
- **playwright** (`@playwright/mcp`): Mobile viewport testing, a11y tree inspection
- **exa** (`https://mcp.exa.ai/mcp`): Search for a11y best practices if needed

## GitHub References
- **Playwright mobile testing**: https://playwright.dev/docs/emulation
- **Playwright a11y**: https://playwright.dev/docs/accessibility-testing
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **axe-core**: https://github.com/dequelabs/axe-core — a11y rules reference
- **WCAG 2.1 AA**: https://www.w3.org/TR/WCAG21/

## Current State
| Item | File | Status |
|------|------|--------|
| 12-mobile | `frontend/e2e/specs/12-mobile.spec.ts` | Exists, needs completion |
| 13-a11y | `frontend/e2e/specs/13-a11y.spec.ts` | Exists, needs completion |
| Lighthouse config | `frontend/lighthouserc.js` | Exists |
| PWA manifest | `frontend/public/manifest.json` | Exists |
| Service worker | `frontend/src/sw.ts`, `registerSW.ts` | Exists |

## Target Scores (from Phase 19 spec)
- Performance ≥ 85
- Accessibility ≥ 90
- Best Practices ≥ 85
- SEO ≥ 80

## Tasks

### 1. Spec 12 — Mobile Responsiveness (Complete)
- [ ] Read existing file, assess completeness
- [ ] Configure Playwright mobile projects: `mobile-chrome` (Pixel 5, 393×851) and `mobile-safari` (iPhone 14, 390×844)
- [ ] Test: all pages render without horizontal scroll at 320px width
- [ ] Test: hamburger menu / bottom nav appears on mobile
- [ ] Test: touch-friendly tap targets (≥ 44×44px minimum)
- [ ] Test: forms are usable on mobile (no zoom-in on input focus via `maximum-scale=1`)
- [ ] Test: charts resize responsively (D3/Recharts adapt to viewport)
- [ ] Test: offline banner visible when network disconnected
- [ ] Test: Capacitor-native interactions (safe area insets, notch handling)
- [ ] Test: PWA install prompt appears
- [ ] Target: 12+ tests

### 2. Spec 13 — Accessibility (Complete)
- [ ] Read existing file, assess completeness
- [ ] Integrate `@axe-core/playwright` for automated a11y audits
- [ ] Test: all pages pass axe-core scan (0 violations, or only known acceptable)
- [ ] Test: keyboard navigation — Tab through all interactive elements
- [ ] Test: focus rings visible on all focusable elements
- [ ] Test: form inputs have associated `<label>` elements
- [ ] Test: color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Test: screen reader announces page titles, form errors, loading states
- [ ] Test: `aria-live` regions announce dynamic content changes
- [ ] Test: skip-to-content link present
- [ ] Target: 12+ tests

### 3. Lighthouse CI Pipeline
- [ ] Audit existing `frontend/lighthouserc.js` configuration
- [ ] Configure LHCI to run on: Ocean Dashboard, Portfolio, Recommendations, Debt, Retirement
- [ ] Add Lighthouse CI GitHub Action or local run script
- [ ] Run audits, capture baseline scores
- [ ] Identify failing categories (below thresholds)
- [ ] Implement fixes for each failing category:
  - **Performance**: Code splitting, image optimization, font loading strategy, bundle size audit
  - **Accessibility**: Fix any a11y violations found by axe-core in Spec 13
  - **Best Practices**: HTTPS, correct image aspect ratios, no deprecated APIs
  - **SEO**: Meta tags, semantic HTML, robots.txt, sitemap
- [ ] Re-run Lighthouse until all scores meet targets
- [ ] Add Lighthouse CI budget assertions to prevent regression

### 4. PWA Audit
- [ ] Verify `manifest.json` has all required fields: name, short_name, icons, start_url, display
- [ ] Verify service worker registers and caches app shell
- [ ] Test offline page (`offline.html`) renders correctly
- [ ] Verify installability criteria met

## Output Requirements
- `frontend/e2e/specs/12-mobile.spec.ts` — completed, 12+ tests passing
- `frontend/e2e/specs/13-a11y.spec.ts` — completed, 12+ tests passing
- `frontend/lighthouserc.js` — updated with all URL assertions
- Lighthouse HTML/JSON reports showing scores ≥ targets
- Any source fixes needed to pass audits (focus rings CSS, ARIA labels, meta tags, etc.)

## Done Criteria
- `npx playwright test --project=mobile-chrome specs/12-mobile` — all green
- `npx playwright test --project=mobile-safari specs/12-mobile` — all green
- `npx playwright test --project=chromium specs/13-a11y` — all green
- `npx lighthouse-ci` or `lhci autorun` — all 5 URLs pass thresholds