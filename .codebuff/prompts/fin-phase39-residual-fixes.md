# Phase 39 — Residual App-Side Fixes (pasteable brief)

> **Status:** Phase 39 closed at 55 passed / 0 failed / 8 skipped chromium-only across 4 new Playwright specs (40-empty-states-regression, 42-mobile-360, 43-offline-pwa, 44-hydration). 6 of 8 `EMPTY_STATE_SLUGS` routes and 2 of 11 `ROUTES` are currently gated behind `KNOWN_FRAGILE_ROUTES` / `KNOWN_APP_BUG_ROUTES` skip-lists baked into those specs. **This brief removes the gates by fixing the underlying app bugs.** Tasks are sorted into three explicit completion tiers so an agent (or human) can stop after MUST-DO without leaving the suite in a broken state.

**Skills referenced throughout this brief** (govern your judgment): `@ponytail` `@impeccable` `@frontend-design` `@code-review-and-quality` `@subagent-driven-development`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — one subagent per task in this brief where independent (T1, T2.1–T2.5 can split across 5 subagents in parallel).
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff after the MUST-DO pass before declaring done.

**Read the spec IN THIS ORDER before touching code (mandatory):**

1. `frontend/playwright.config.ts` — Phase 39 reporters + retain-on-failure + 180s webServer.timeout.
2. `frontend/e2e/utils/routes.ts` — single source of truth; **the skip-lists live here** (currently inline in each spec, but the *gating* facts come from this file's `EMPTY_STATE_SLUGS`).
3. `frontend/e2e/specs/40-empty-states-regression.spec.ts` — has `KNOWN_FRAGILE_ROUTES` with 6 entries.
4. `frontend/e2e/specs/42-mobile-360.spec.ts` — per-viewport tolerance, TopBar `.first()` workaround.
5. `frontend/e2e/specs/43-offline-pwa.spec.ts` — uses `h1` text check for the offline route.
6. `frontend/e2e/specs/44-hydration.spec.ts` — has `KNOWN_APP_BUG_ROUTES` with 2 entries.
7. `frontend/src/api/execution.ts` — T1 fix locus.
8. `frontend/src/pages/Portfolio.tsx` — T2.1 fix locus (and T3 fix locus for the `<head>` `<div>` bug).
9. `frontend/src/pages/RecommendationsDashboard.tsx` — T2.2 fix locus.
10. `frontend/src/pages/CommunityDashboard.tsx` — T2.3 fix locus.
11. `frontend/src/pages/MultiAgent.tsx` — T2.4 fix locus.
12. `frontend/src/hooks/useMemory.ts` + `frontend/src/pages/MemoryExplorer.tsx` — T2.5 fix locus.
13. `frontend/src/components/layout/TopBar.tsx` — T4 fix locus.
14. `frontend/src/components/wizard/TourGuide.tsx` — pre-existing TS error cleanup.
15. `frontend/src/pages/Settings.tsx` — pre-existing TS error cleanup.
16. `frontend/vite.config.ts` — vite-plugin-pwa bundle split (T6 fix locus).
17. `frontend/src/styles/ocean.css` — already restored orphan `.cm-tooltip` block; do not regress.

---

## User's report

> "Phase 39 ships clean, but `40-empty-states-regression` only runs 2/8 routes and `44-hydration` only runs 9/11. The other 8 routes are gated behind skip-lists because the app behaves badly when I mock just one endpoint. I want the underlying app bugs fixed so the test suite can grow — without re-litigating the mocks we've already approved."

---

## What "good" looks like (per spec)

**After MUST-DO finishes:**
- Every non-skipped `EMPTY_STATE_SLUGS` route renders its `<EmptyState slug="…"/>` element within 5s of navigate, when EITHER (a) the natural API returns `length === 0`, or (b) the new single-endpoint `/api/<route>/empty` returns `{ empty: true }`.
- `/execution` and `/portfolio` are re-enabled in `KNOWN_APP_BUG_ROUTES` and `KNOWN_FRAGILE_ROUTES` (both Set calls return to empty), and the corresponding `test.skip(...)` lines are removed from 40-empty and 44-hydration.
- `npx playwright test 40-empty-states-regression 44-hydration --project=chromium --reporter=list` reports **≥ 18 passed / 0 failed** (formerly 11 passed / 8 skipped / 2 failed).

**After SHOULD-DO finishes:**
- Cross-route slug-leak detection re-enabled (the deleted "slug collisions across pages are zero" test comes back, gated by `for … continue` rather than `test.skip()` short-circuits).
- `cleanConsole.ts` wrapped `test` fixture is the import that ALL active specs use, with each spec's `DEV_NOISE_ALLOWLIST` extended only by what that spec's pages actually emit.
- Empty-state centered-within-parent invariant on desktop width sits inside ±10px instead of ±213px (the latter is a real false-positive leak from the viewport-vs-column heuristic).

**After NICE-TO-HAVE finishes:**
- `data-testid="app-topbar"` exists on TopBar's root `<header>`; `42-mobile-360` uses the testid directly (the `.first()` workaround is deleted).
- `TourGuide.tsx` and `Settings.tsx` no longer trigger `tsc -b` errors.
- `vite build` finishes without exceeding the 2 MiB PWA precache limit (currently the chunk is 2.52 MB).

---

## Tier 1 · MUST-DO (must be completed before Phase 40+)

These two items block adding more test routes. Without them, every route we add next will accumulate the same skip-list baggage.

### T1 · `/execution` returns empty pending for unauthenticated clients (not 401)

**Why this tier:** Every additional Phase 40+ test that touches the execution agent fails the `44-hydration` no-`pageerror` check because the page loops on a `console.error("Not authenticated")`. The fix un-blocks `/execution` re-entry into 40-empty and 44-hydration.

**Do:**
- Open `frontend/src/api/execution.ts`. Locate the request layer that POSTs to `/execution/pending` (or whatever path the page uses for the pending list).
- Return `{ pending: [] }` for unauthenticated clients — not a 401. The page's existing empty-state branch already handles `pending.length === 0`; we just need to reach it.
- In the response interceptor, branch on auth header presence: if no auth header → return `{ pending: [] }` synchronously; otherwise proxy to the real `/execution/pending` endpoint.
- Document the change with a one-line comment: `// Phase 39 fix: unauthenticated requests return empty pending so empty-state path is reachable`.

**Verify (Playwright-based — there is no real backend in local-only mode, so curl against `:5173` is misleading):**
- After T1 lands, mock the response and visit the route. Note: per `frontend/src/api/execution.ts`, `pending()` is typed as `api<ExecutionAction[]>("/execution/pending")` — a top-level array, NOT a wrapped object. The mock body must be a JSON array. Either literal `'[]'` or `JSON.stringify([])` is acceptable — pick whichever your formatter prefers.
  ```ts
  await page.route('**/api/execution/pending', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/execution');
  await expect(page.locator('[data-testid="empty-state-execution-empty"]')).toBeVisible({ timeout: 5000 });
  ```
- `frontend/e2e/specs/40-empty-states-regression.spec.ts` — remove `'/execution'` from `KNOWN_FRAGILE_ROUTES`; the test now passes with the existing single `/api/execution/pending` mock.
- `frontend/e2e/specs/44-hydration.spec.ts` — remove `'/execution'` from `KNOWN_APP_BUG_ROUTES`; the test now passes the no-`pageerror` check.

### T2 · Single-endpoint "is empty" branch for the 5 multi-fetch routes

**Why this tier:** 5 routes are currently gated in `KNOWN_FRAGILE_ROUTES` because they issue parallel fetches that a single-endpoint mock can't satisfy. The user's report explicitly asks for app-side fixes. Each route follows the same shape — implement as 5 parallel subagent tasks (T2.1–T2.5), they are independent.

**Common pattern (apply to all 5):**
- Add ONE new endpoint per route family: `/api/{portfolio|recommendations|community|orchestrate|memory}/empty`.
- Return: `{ empty: true }`. Execute the endpoint through the existing API client (`api.get(...)` or whatever the codebase uses).
- In the corresponding page hook, branch on the FIRST fetch only:
  ```ts
  const { data, error } = await fetchOne();
  if (data?.empty) return renderEmpty();
  if (error)      return renderError();
  if (!data || data.length === 0) return renderEmpty();
  ```
- DO NOT make `loading=true` keep the page stuck — if `/empty` returns `{ empty: true }`, render the empty branch synchronously.

**T2.1 · `/portfolio`** — file: `frontend/src/pages/Portfolio.tsx`. Page currently calls `portfolioApi.getFull()` plus parallel `prices` + `concentration`. After fix: if `getFull()` returns `{ holdings: [], totals: {…} }` (already-the-shape of an empty portfolio) OR a new `/api/portfolio/empty` returns `{ empty: true }`, render `<EmptyState slug="portfolio-empty"/>`. Don't simulate the parallel fetch fan-out in tests.

**T2.2 · `/recommendations`** — file: `frontend/src/pages/RecommendationsDashboard.tsx`. Page issues parallel `list()` + `agentContexts()` + `history()`. Empty when: `list()` returns `[]` AND no agent contexts → render empty OR `/empty` returns `{ empty: true }`. Spy: this needs no MCP integration in tests.

**T2.3 · `/community`** — file: `frontend/src/pages/CommunityDashboard.tsx`. Page issues parallel `posts()` + `optIn()` + `comments()`. Empty when: user has not opted in OR `/empty` returns `{ empty: true }`.

**T2.4 · `/orchestrate`** — file: `frontend/src/pages/MultiAgent.tsx`. Page fans out to N agent endpoints. Empty when: no agents ran in this session OR `/empty` returns `{ empty: true }`.

**T2.5 · `/memory`** — file: `frontend/src/hooks/useMemory.ts`. `useMemory()` currently keeps `loading=true` until first response. Need: if `/api/memory/empty` returns `{ empty: true }`, set `loading=false, notes=[]` and short-circuit before any parallel fetches fire.

**Verify (per T2.x):**
- Each of the 5 newly-emptiable routes can be reached by a 1-line spec: `await page.route('**/api/<route>/empty', r => r.fulfill({ body: '{"empty":true}' })); await page.goto('<route>');`
- `frontend/e2e/utils/routes.ts` — keep `whenMock: '/api/<route>/empty'` for each entry, removing the legacy `/api/<route>/<list.endpoint>` shape OR leaving both as a fallback.
- `KNOWN_FRAGILE_ROUTES` shrinks to ∅ once all 5 compile. Each `test.skip(...)` for the corresponding route is removed.

> **T2.1 cross-impact** — `/portfolio` is in BOTH `KNOWN_FRAGILE_ROUTES` AND `KNOWN_APP_BUG_ROUTES`. T2.1 clears the FRAGILE entry; T3 clears the APP_BUG entry. They are independent (T2.1 = data-shape, so the page reaches its empty branch; T3 = React tree shape — a `<div>` is being mounted inside `<head>` via a likely portal/Helmet misuse, so correct the JSX placement rather than touching `ocean.css`). Either order is fine — pick whichever un-skips the spec you care about first.

---

## Tier 2 · SHOULD-DO (should be completed within Phase 40)

These three items don't block new route coverage, but significantly improve suite ergonomics / signal quality.

### T3 · Fix `/portfolio` `<div>` inside `<head>` (DOM-nesting violation)

**Why this tier:** `44-hydration` flags the `/portfolio` route as a `KNOWN_APP_BUG_ROUTES` because the React-rendered tree includes a `<div>` somewhere under `<head>`. Browsers auto-correct this silently, but it's a real correctness regression that surfaces in React 19 dev-mode as a warning the `cleanConsole` allow-list doesn't forgive.

**Do:**
- Open `frontend/src/pages/Portfolio.tsx`. Find any `<div>`, `<span>`, or other non-`<meta>`/`<link>` element that ends up mounted inside `<head>`. Likely candidates: a top-level `<Helmet>` equivalent, a misconfigured portal, a `<style>`/`<title>` leak.
- Audit `frontend/index.html` and any `<title>`/`<meta>` template literals in Portfolio.tsx that may inject div-shaped content.
- Move the mis-placed element to the appropriate React subtree (or revert it).
- Verify the render result against React's DOM-nesting rules.

**Verify:**
- `kebab-case test page load /portfolio' has no `console.warn('cannot be a child of <head>')`. Remove `'/portfolio'` from `KNOWN_APP_BUG_ROUTES` in 44-hydration. Test now passes.

### T4 · Restore 40-empty "slug collisions across pages are zero" test

**Why this tier:** The collision detection was deleted in Phase 39 because `test.skip()` inside a `for` loop short-circuits on the first fragile route, hiding the rest from the report. A simpler version using `for … continue` keeps the cross-route collision signal alive.

**Do:**
- Open `frontend/e2e/specs/40-empty-states-regression.spec.ts`.
- Add a new test at the end of `test.describe('40 — empty-state regression', …)`:
  ```ts
  test('canonical slugs do not leak across routes', async ({ page }) => {
    for (const { route, slug } of EMPTY_STATE_SLUGS) {
      if (KNOWN_FRAGILE_ROUTES.has(route)) continue; // JS continue, not test.skip()
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      // This route must NOT render a different route's slug.
      const otherSlugs = EMPTY_STATE_SLUGS
        .filter((e) => e.slug !== slug)
        .map((e) => `[data-testid="empty-state-${e.slug}"]`);
      const leaks = await page.locator(otherSlugs.join(', ')).count();
      expect(leaks, `${route} should not render any other route's empty-state slug`).toBe(0);
    }
  });
  ```

**Verify:**
- After all of T2 completes, the test passes for every non-fragile route.
- The Playwright reporter shows one test per non-fragile route in the per-route loop above (each `expect` runs independently within the test body).

### T5 · Wire `cleanConsole.ts` wrapped `test` into the 4 Phase 39 specs

**Why this tier:** `frontend/e2e/utils/cleanConsole.ts` exists and is supposed to be the import every clean-console-aware spec uses. None of the 4 new Phase 39 specs use it. Without wiring, the `DEV_NOISE_ALLOWLIST` does nothing.

**Do:**
- Open each of `frontend/e2e/specs/{40-empty,42-mobile,43-offline,44-hydration}.spec.ts`. Replace `import { test, expect } from '@playwright/test'` with `import { test, expect } from '../utils/cleanConsole'`.
- Run the suite once. If any spec fails with "Console collector hit N issue(s) on …", enumerate the actual issues, add narrowly-scoped regexes to `DEV_NOISE_ALLOWLIST`, and re-run.

**Verify:**
- All 4 specs report 0-failed and the HTML report's "console-collector" section is empty for each run.
- The `DEV_NOISE_ALLOWLIST` is shorter than 15 regexes (we're tuning to actual app needs, not making it grow forever).

---

## Tier 3 · NICE-TO-HAVE (nice to have; non-blocking)

Four quality-of-life cleanups. None of these block new coverage.

### T6 · Add `data-testid="app-topbar"` and replace `.first()` in 42-mobile

**Why this tier:** App shell wraps an additional `<header role="banner">` so 42-mobile's `header[role="banner"]` is ambiguous; `.first()` works but is fragile to DOM reorder.

**Do:**
- Open `frontend/src/components/layout/TopBar.tsx`. Add `data-testid="app-topbar"` to the root `<header role="banner">`.
- Open `frontend/e2e/specs/42-mobile-360.spec.ts`. Change `page.locator('header[role="banner"]').first()` to `page.locator('[data-testid="app-topbar"]')`. Delete the `.first()` workaround comment.

**Verify:**
- 42-mobile topbar bounding-box test passes on all 3 viewports with no ambiguity.

### T7 · Assert empty-state centered-within-parent (not viewport-centered)

**Why this tier:** The current 20%-of-viewport tolerance hack leaks 213px of false-positive at desktop because the empty-state is genuinely inside a content column narrower than the viewport. The viewport-center invariant is structurally wrong.

**Do:**
- Open `frontend/e2e/specs/42-mobile-360.spec.ts`. Rewrite the `empty state is centered when present` test:
  ```ts
  // EmptyState is centered within its content column, not the viewport.
  const empty = page.locator('[data-testid^="empty-state-"]').first();
  const parent = empty.locator('xpath=..');  // the immediate parent
  await expect(empty).toBeVisible();
  const eBox = await empty.boundingBox();
  const pBox = await parent.boundingBox();
  const eCenter = eBox.x + eBox.width / 2;
  const pCenter = pBox.x + pBox.width / 2;
  expect(Math.abs(eCenter - pCenter), `empty state off-center within parent by ${Math.abs(eCenter - pCenter).toFixed(1)}px`).toBeLessThan(20);
  ```
- Delete the `Math.round(vp.width * 0.2)` tolerance hack.

**Verify:**
- 42-mobile empty-state centering test passes on all 3 viewports with a 20px tolerance inside the parent column.

### T8 · Pre-existing TS-error cleanup + bundle split

**Why this tier:** These are independent of Phase 39 but listed for completeness so they're not dropped.

**T8.1 · `frontend/src/components/wizard/TourGuide.tsx`** — drop the `CallBackProps` type import (react-joyride 3.x does not export it). Use a custom local type or the `react-joyride` generic shape. Alternatively pin `react-joyride@2.x` if the 3.x API isn't usable.

**T8.2 · `frontend/src/pages/Settings.tsx`** — the `<Input ariaLabel=…>` calls pass a string that the `Input` component's `Props` interface does not declare. Either extend `Input`'s `Props` to include `ariaLabel?: string` and forward it to the inner `<input aria-label=...>`, OR delete the offending property from Settings.tsx's call sites.

**T8.3 · `frontend/vite.config.ts`** — the SPA bundle is currently 2.52 MB; vite-plugin-pwa's default 2 MiB precache limit rejects it.

> **Pre-step (3 small steps — do all three before running the analyzer):**
> 1. Install: `cd frontend && npm i -D rollup-plugin-visualizer`. (Defaults to the package's named export `visualizer`; verify on `npm view rollup-plugin-visualizer exports` if unsure.)
> 2. Add the import at the top of `vite.config.ts`: `import { visualizer } from 'rollup-plugin-visualizer';`
> 3. Register conditionally inside the build config (place under `plugins:` rather than `build.rollupOptions.plugins:` — the visualizer is a rollup plugin and reads more cleanly there):
> ```ts
> plugins: [
>   react(),
>   VitePWA({ ... }),
>   ...(process.env.BUILD_ANALYZE ? [visualizer({ filename: 'dist/stats.html', gzipSize: true })] : []),
> ],
> ```
> Skip any of these and `BUILD_ANALYZE=true npx vite build` will be a silent no-op.

Once configured, run `BUILD_ANALYZE=true npx vite build`, open `frontend/dist/stats.html`, and read the chart of top-3 contributors by gzipped size. Chunk those, not the four packages listed below (which are reasonable guesses but unverified).

Implement `manualChunks` in `vite.config.ts` for the actual top contributors (likely candidates: `three`, `@uiw/react-codemirror`, `framer-motion`, `recharts` — verify with the analyzer first) via `build.rollupOptions.output.manualChunks`.

**Verify (per T8.x):**
- `npx tsc --noEmit` reports 0 errors.
- `npx vite build` succeeds with `dist/sw.mjs` no longer exceeding 2 MiB.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only.** No new hex / rgb() / hsl() tokens. Reuse Phase 38a's `<EmptyState/>` and Phase 22's ocean tokens.
2. **No per-page custom JSX for empty branches.** Every fix in T2 must route through `<EmptyState/>` from `frontend/src/components/ui/EmptyState.tsx`. Delete any hand-rolled `<div className="*-empty">` that was the problem in the first place.
3. **No new backend routes beyond the new `/api/<route>/empty` endpoints.** T1 strictly changes the request layer's branching; it does NOT add a real auth gate.
4. **No new heavy deps.** Tier 1/2 must be dep-free. Tier 3 may add only `@axe-core/playwright` (already present) if needed.
5. **`@subagent-driven-development` is mandatory for Tier 1.** T2.1–T2.5 are independent and may be parallelized.
6. **Every Tier 1 fix removes a corresponding `test.skip(...)` line from the spec.** Phase 39 spec stays 0-failed after each removal.
7. **Ponytail:** delete hand-rolled `if/else` shapes when introducing the single `/empty` endpoint. One path per route.

---

## Acceptance criteria

- **Phase 39 spec suite:** still 0-failed (likely now 60+ passed, 0 failed, 0–3 skipped).
- **Phase 40 unlocked:** new routes can be added without skip-list accretion.
- **Coverage regression defensive:** no new jest/vitest skipped tests.
- **Bundle hygiene:** `dist/` under 2 MiB precache limit.
- **Self-review** with `@code-review-and-quality` after MUST-DO completes; verify diff ≤ 10 files.

---

## Code checkers — RUN AFTER EVERY TIER (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/ && \
  npx playwright test e2e/specs/40-empty-states-regression.spec.ts e2e/specs/42-mobile-360.spec.ts e2e/specs/43-offline-pwa.spec.ts e2e/specs/44-hydration.spec.ts --project=chromium --workers=1 --reporter=list
```

Tier-by-tier acceptance (delete the corresponding `test.skip(...)` and `KNOWN_FRAGILE/APP_BUG_ROUTES` entry as each fix lands):

| Fix | Trait | 40-empty delta | 44-hydration delta | Spec suite change |
| --- | --- | --- | --- | --- |
| T1 | un-auth empty pending | `KNOWN_FRAGILE_ROUTES` minus `/execution` | `KNOWN_APP_BUG_ROUTES` minus `/execution` | +2 passed (was skipped) |
| T2.1 | portfolio `/empty` | `KNOWN_FRAGILE_ROUTES` minus `/portfolio` | — | +1 passed |
| T2.2 | recommendations `/empty` | minus `/recommendations` | — | +1 passed |
| T2.3 | community `/empty` | minus `/community` | — | +1 passed |
| T2.4 | orchestrate `/empty` | minus `/orchestrate` | — | +1 passed |
| T2.5 | memory `/empty` | minus `/memory` | — | +1 passed |
| T3 | portfolio `<head>` fix | — | `KNOWN_APP_BUG_ROUTES` minus `/portfolio` | +1 passed |
| T4 | collision spec restore | new test | — | +1 test added |
| T5 | cleanConsole wired | no behavior change | no behavior change | allow-list maintained |
| T6 | topbar testid | — | — | code quality |
| T7 | column-centered invariant | — | — | code quality |
| T8 | TS + bundle split | — | — | `tsc --noEmit` clean |

---

## Deliverable format

Reply with: bullet list of files changed (max 10 files per @subagent-driven-development), what `KNOWN_FRAGILE_ROUTES` / `KNOWN_APP_BUG_ROUTES` shrank to, skip-list lines removed from spec files, and any new tech debt (e.g., real auth still TODO — separate Phase 19b brief). **Strict ≤10 file edits per tier.** Stop and ask before ballooning scope.

---

## Out of scope

- Adding new test routes.
- Adding new app routes.
- Implementing real authentication (T1 is purely a mock-friendly branch, not a security boundary).
- LHCI / Lighthouse budget work (separate brief).
- New heavy deps.

---

## Visual continuity — non-negotiable

- Reuse Phase 38a's `<EmptyState/>` styling, `<Welcome/>` shell, and Phase 22's ocean tokens.
- Empty states on dark/light must read identically — `prefers-color-scheme` already handled by `theme.css` + `ocean.css` tokens.
- Reduced-motion respected on any smooth-scroll CTA in the EmptyState — pattern already in `EmptyState.tsx`.
- Icons match `IconShield`/`IconTrade` visual language (36x36, OKLCH tints, no per-page bespoke SVGs).

<task>Now go — Tier 1 first; move to Tier 2 after T1+T2 acceptance; Tier 3 is opportunistic.</task>
