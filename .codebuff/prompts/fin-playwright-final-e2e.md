# Fin Frontend — Final Playwright MCP E2E Dissection & Audit Prompt

You are the **Lead QA engineer auditing the Fin frontend as it ships**. Use the `browser-use` MCP agent (Playwright-driven) to navigate the live local dev server, exercise every user-visible flow that Phases 31–39 introduced, capture every console error and HTTP failure, take screenshots at each step, and produce a **structured report** that the parent agent can act on. **Be exhaustive. Be precise. Be skeptical — the brief asks you to find what we missed, not to confirm what we got right.**

**Context — what has shipped on `main`:**
- Phases 31–34 platform polish (Toast / Skeletons + ErrorBoundary / Form primitives / App shell + Cmd+K Popover + Breadcrumbs + TopBar freshness + decoupled palette).
- Phases 35–39 (per briefs in `.codebuff/prompts/`): `?` overlay, mobile drawer + bottom sheets, accessibility pass, empty states + welcome, coach marks.
- Local-only mode (no auth). Backend stubs only; offline by default.
- Lint: tsc + oxlint are green (0 errors), with pre-existing `no-unused-vars` warnings on Retirement.tsx / DebtSummary.tsx / AllocationPie.tsx / MultiAgent.tsx.

**Spin-up step (parallel with audit):**
1. `cd /Users/coleadams/Fin/frontend`
2. `npm run dev` — Vite serves `http://localhost:5173`. Wait for "ready" on stdout.
3. Browser-use agent navigates this URL with viewport `1280×800` (desktop) AND `390×844` (iPhone 14) via the `Mobile Chrome` project profile already in `frontend/playwright.config.ts`.

**Hard gates (read first):**
- `@impeccable` — every interaction must feel like a Cursor/Linear/Arc-grade product; flag any UX papercut.
- `@web-design-guidelines` — a11y / contrast / focus rings / reduced motion.
- `@owasp-security-check` — XSS in aria-controls / innerHTML safety. Local-only mode means no PII surfaces; flag any data leak via localStorage keys.
- `@code-review-and-quality` — strict ≤-scope, no drive-by.

**Skill files to consult:**
- `frontend/playwright.config.ts` — projects list (chromium, Mobile Chrome, Mobile Safari), baseURL `http://localhost:5173`, webServer pre-boot.
- `frontend/package.json` — `@axe-core/playwright ^4.12.1` available for axe-core injection. `@lhci/cli ^0.15.1` for Lighthouse CI.
- `frontend/e2e/specs/*.spec.ts` — if any pre-existing test spec follows the same shape, MIRROR it.
- `frontend/src/utils/shortcutCatalog.ts` (Phase 35) — the source of truth for ALL shortcuts the app advertises.
- `frontend/src/hooks/useGlobalHotkeys.ts` — runtime registry that backs every `combo` action.

---

## Mission — test flows in order, capture data exhaustively

### FLOW A — Global Command Palette (`⌘K`)
1. Open `http://localhost:5173/`. Dismiss any auto-shown tutorial if it's annoying; just need the route.
2. Press `Meta+K` (use `[page.keyboard.press('Meta+K')]` — fall back to `Control+K`). Palette opens.
3. **Assert**: focus lands on the search input (verify `document.activeElement.tagName === 'INPUT'`).
4. Type `memo`. Fuse.js filters to Memory-related results.
5. Press `Enter` on the highlighted result.
6. **Assert**: route is now `/memory` (matches `/memory` pathname).
7. Press `Meta+K` again → palette opens. Type `sett` → Settings result.
8. Press `Escape` via `keyboard.press('Escape')` → palette closes.
9. **Assert**: focus is restored to whatever was focused before opening (likely the body, but if you tab first and then open, focus returns there).

### FLOW B — TopBar sync popover + freshness pip
1. From `http://localhost:5173/`, observe the sync pill.
2. Click it (use `[data-coach-target='sync-pill']` or `data-testid='topbar-sync-pill'`).
3. **Assert**: popover opens with `data-testid='topbar-sync-menu'` containing "Run sync now" button.
4. Click "Run sync now".
5. **Assert**: a toast appears (`data-testid='toast-info'`) and the freshness pip dots pulse.
6. After ~4 seconds, **assert**: the freshness pill has the label "Synced" or "X min ago".

### FLOW C — QuickSettings Popover (theme/density/motion)
1. TopBar right side has a gear icon → click it (or `data-testid='topbar-quick-settings'`).
2. **Assert**: popover opens with 3 sections: Theme, Density, Motion.
3. Click "Light" theme.
4. **Assert**: `document.documentElement.dataset.theme === 'light'`; page re-styles in < 200ms. **Verify decorative icons are still visible** (no missing contrast).
5. Click the gear again → click "Dark" → restore.

### FLOW D — `?` KeyboardShortcuts overlay (Phase 35)
1. Press `?` (use `keyboard.press('Shift+/')` to be safe).
2. **Assert**: overlay opens (`data-testid='kbd-overlay-root'`).
3. **Assert**: search input has focus.
4. Type `g d` → only the "Dashboard" row remains.
5. Click that row.
6. **Assert**: navigated to `/`; overlay closes; main h1 gets focus.
7. From `/`, press `?` → opens again → press `Esc` → closes.

### FLOW E — Settings page: form primitives
1. Navigate to `/settings`. Wait for hydration.
2. Click "Connections" tab.
3. Find the Alpaca card (test-id `connector-alpaca`). Click "Connect".
4. **Assert**: expanded card shows: API key Input, Secret Input with eye toggle, Environment RadioGroup, Test & save button.
5. Type `AK` + 20 chars into API key (or a too-short string). **Assert**: either accepted or an inline error shows on blur (verify if validation runs; some forms accept on submit).
6. Click the eye toggle on secret input. **Assert**: type swaps from "password" to "text".
7. Click Environment "Live" radio. **Assert**: aria-checked="true" on that radio.
8. Click "Agent Preferences" tab.
9. **Assert**: 3 agent preference cards (investment, debt, retirement) each with: title, description, risk tolerance slider, cadence segmented, min-confidence slider.
10. Move risk slider via keyboard Arrow Right (focus the slider, press ArrowRight). **Assert**: `aria-valuetext` updates (check the slider's `aria-valuetext` attribute).
11. Click "Account" tab → click "Theme" → toggle "Light"/"Dark"/"System" with keyboard Arrow keys.

### FLOW F — Skeletons wired on 4 pages
1. Throttle network: open `frontend/playwright.config.ts` to see the dev pattern, OR use `page.route('**/api/**', route => route.fulfill({ status: 200, body: '{}', delay: 1500 })` to slow API responses.
2. Navigate to `/portfolio` while API is slow.
3. **Assert**: skeleton renders (look for `[data-testid='portfolio-skeleton']`).
4. Wait for skeleton to disappear → **assert**: real content visible.
5. Repeat for `/debt`, `/retirement`, `/execution`. (Memory's skeleton is the `<MemorySkeleton>` variant.)

### FLOW G — Empty states & Welcome
1. Clear localStorage. Reload `/`.
2. **Assert**: `<Welcome/>` renders with 3 CTAs ("Run setup →", "Sync now", "Open memory"). NOT the Phase 22 onboarding-cards.
3. Click "Run setup →" → `/setup` loads.
4. Click "Back" to `/`. Visit `/portfolio` with no holdings. **Assert**: EmptyState renders with `data-testid='empty-state-portfolio'` and a "Connect broker" or similar CTA.
5. Visit `/memory` with no notes. **Assert**: "Your vault is empty" empty state.

### FLOW H — Coach tour (Phase 39) on fresh install
1. Clear localStorage. Reload `/`.
2. **Assert**: CoachTour auto-opens with step 1: spotlight on TopBar.
3. Click "Next" → spotlight glides to sync pill.
4. Click "Next" → spotlight glides to Mark Executed area (or to `/execution`).
5. Click "Skip" → tour dismisses + persists (`localStorage.fin.coach-tour-dismissed === 'true'`).
6. Navigate to `/settings` → Help & Onboarding → "Restart tour".
7. Reload → tour reopens.

### FLOW I — Mobile drawer + bottom sheets
1. Set viewport to iPhone 14 (390×844).
2. Hamburger has the standard 3-line icon. Tap it → drawer opens.
3. **Assert**: sidebar visible; main content scrim visible.
4. Tap scrim → drawer closes.
5. Tap TopBar sync pill → bottom sheet appears from bottom with drag handle.
6. Drag handle down → bottom sheet closes.
7. Press `?` on mobile → overlay opens; **assert** it adapts (mobile variant if Phase 36 wired it).

### FLOW J — Accessibility (axe-core)
1. After Flows A–I pass, run axe-core on EVERY route:
   ```js
   const AxeBuilder = require('@axe-core/playwright').default;
   const violations = await new AxeBuilder({ page })
     .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])
     .analyze();
   ```
2. **Report each violation category**: `impact: critical|serious|moderate|minor`. `critical`/`serious` = blocker; `moderate`/`minor` = tech debt.
3. Routes: `/`, `/portfolio`, `/debt`, `/retirement`, `/memory`, `/orchestrate`, `/recommendations`, `/execution`, `/community`, `/backtest`, `/settings`, `/?from=tour` (deferred), `/offline`.

### FLOW K — Toast promise + ErrorBoundary smoke
1. From `/backtest`, click "Run backtest" → toast.promise loading → success info.
2. Visit `/settings` → Danger Zone → "Clear vault" → confirm. Toast warn appears.
3. **Visual check**: Does the toast stack include an action button ("Undo")? (Phase 31 spec said optional.)
4. Trigger ErrorBoundary: navigate to a route whose component throws on render. (If none, skip — there's no trivial way to inject.) **Skip this flow unless a route has been demonstrated to fail** during a non-trivial automated assertion.

### FLOW L — Reduced-motion final pass
1. Open Chrome DevTools → Rendering → "Emulate CSS media: prefers-reduced-motion: reduce".
2. Reload all 11 routes. **Assert**: no animations running (search console for `css-animation-fps` events). Toast fade-in is instant. Bottom-sheet slides no longer glide. Skeletons are static-pulse only.

### FLOW M — LocalStorage hygiene + PII sensitivity
1. After all flows, dump all `localStorage` keys.
2. **Flag any key** that contains: raw email address (`fin@local.app`), API key prefix (`AK...`), or anything that smells like user data without being clearly intentional (`fin.crashes.*` is fine; `user.email` is fine; `fin.settings.theme` is fine; a key containing a 20-char Alphanumeric after a real connect is NOT fine).
3. **Report** any PII leakage.

### FLOW N — Console error sweep
1. Maintain a running array `consoleErrors: { timestamp, page, type, message, stack }[]` per flow.
2. Group identical errors. De-duplicate after count >= 3.
3. Report each unique error with file:line if available, and the user-facing scenario that triggered it.

### FLOW O — Network failure sweep
1. Run all flows with `page.context().setOffline(true)` for 5 seconds mid-test.
2. **Assert**: Online/offline banners behave per spec (`OfflineBanner` shows).
3. **Assert**: Toast surfaces introduced in Phase 31 are reachable when SW registration fails.
4. **Assert**: `<ErrorBoundary>` IS NOT triggered unless a real render error occurs. Don't ship flaky assertions for this.

---

## Capture & report structure

When the audit completes, produce a **structured report** with these sections:

```
═══════════════════════════════════════════════════════
FIN FRONTEND — FINAL E2E DISSECTION REPORT
Run at: <iso8601>
Viewport: 1280×800 desktop + 390×844 mobile (iPhone 14)
Browser: <chromium / Mobile Chrome>
Backend: local-only stub (no backend calls expected)
═══════════════════════════════════════════════════════

## Console errors (deduped)
1. <file:line> — "<message>" — severity: high/medium/low — flows that hit it: [...]

## Network failures
- (none / N)

## axe-core violations (grouped by impact)
### Critical / serious (blocker)
- /<route>: <rule-id> — <description> — element: <CSS selector>
### Moderate / minor (tech debt)
- ...

## Functional findings per flow
### Flow A — Cmd+K palette
- ✅ / ❌ / ⚠ — <short finding>

## PII leakage (localStorage dump)
- fin.user.email = "<masked>" — OK to retain? (yes, by spec)
- <other key> = "<value>" — flag if unexpected

## Performance / Lighthouse
- Lighthouse desktop perf score: <value>
- Lighthouse accessibility score: <value>
- TTFB / FCP / LCP per route (top 3 outliers)

## Skeleton flicker
- /<route>: skeleton-to-content morph respects shape? yes/no (with screenshot if no)

## Coach tour positioning
- Resize: spotlight reposition is smooth / flickers
- Mobile: layouts still sensible

## Spec drift (per Phase)
- Phase 31: toast.actions.count = expected 1 (Retry) where applicable — PASS / FAIL
- Phase 35: ? overlay button click on `g d` does navigate; focus returns to <target> — PASS / FAIL
- ... etc

## Recommended follow-ups (≤3)
1. ...
2. ...
3. ...

═══════════════════════════════════════════════════════
```

**Attach**: A JSON artifact at `frontend/e2e-reports/final-dissection-<timestamp>.json` with full per-flow data + screenshots saved to `frontend/e2e-reports/screenshots/`. Use `await page.screenshot({ path: ... })` at the end of each flow.

**Exit semantics**: this prompt produces a report — it does NOT modify code. If unverified **show-stoppers** are found (anything that blocks manual use): surface them in the report above and tag them CRITICAL in a top-level summary so the parent agent can dispatch targeted fixes. If only `moderate` / `minor` issues: report and EXIT — do not recommend changes you can't articulate precisely.

<task>Now run the audit and produce the report.</task>
