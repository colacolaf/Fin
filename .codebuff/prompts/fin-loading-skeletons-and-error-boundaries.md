# Phase 32 — Loading Skeletons, Suspense, & Error Boundaries (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to replace blank-screen loads and silent React crashes with shimmering skeleton states and a meaningful recovery surface. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@vercel-react-best-practices` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — visual thesis (THE OCEAN metaphor + OKLCH)
2. `frontend/src/styles/ocean.css` — OKLCH tokens (do not reinvent; Phase 23 hero/sparkline/radar blanks are already token-shaped)
3. `frontend/src/App.tsx` — route surface area
4. `frontend/src/pages/Dashboard.tsx`, `Portfolio.tsx`, `DebtDashboard.tsx`, `Retirement.tsx`, `MultiAgent.tsx`, `RecommendationsDashboard.tsx`, `ExecutionDashboard.tsx`, `CommunityDashboard.tsx`, `BacktestDashboard.tsx` — current loading patterns
5. `frontend/src/components/dashboard/{PortfolioSummary,PerformanceLine,HoldingsTable,SectorRadar,ConcentrationMeter,HistoricalReplay}.tsx` — child components that gate on isLoading
6. `backend/routers/*` — the API endpoints being loaded
7. `.codebuff/prompts/{fin-cinematic-ocean-dashboard,fin-portfolio-cockpit,fin-debt-strategy-engine,fin-retirement-clock}.md` — the visual surface these skeletons must feel native to
8. `.codebuff/prompts/fin-loading-skeletons-and-error-boundaries.md` (this file)

---

## User's report
> Open `/portfolio` on a fresh machine and watch the page: 800ms of blank gray abyss, then a hard pop-in of 5 hero tiles and a chart. There's no skeleton, no shimmer, no anticipation. Hit `/execution` on a 3G connection → same blank. Meanwhile `/orchestrate` crashed once when `run_history` returned a malformed row — the entire app went white with a React error in console. We need skeletons everywhere a fetch is in flight, and we need a global ErrorBoundary that surfaces a recovery UI instead of a blank screen.

## What "good" looks like (per spec)

- **`<Skeleton>` primitive** — shimmering, glassmorphic, OKLCH `--skeleton-shimmer` token (uses a CSS `@keyframes` linear gradient sweep). Variants: `.text`, `.rect`, `.circle`. No JS animation — pure CSS, GPU-cheap.
- **Per-page skeletons** that match the **shape** of the actual content they replace (hero-tile for Portfolio, side-by-side cards for Debt, etc.) — so when real data lands it morphs in instead of jumping in.
- **`<ErrorBoundary>` global + page-level** — wraps each route in `App.tsx`. Catches render-phase crashes, renders a glassmorphic recovery surface with the error class hidden but a "Reload section" / "Reload app" / "Send crash report (local copy)" trio of buttons.
- **Suspense fallbacks** match skeletons. `<Suspense fallback={<PageSkeleton variant="portfolio" />}>...</Suspense>` is the new pattern for any code-split heavy component.
- **`prefers-reduced-motion`** honored — skeleton shimmer becomes a static fill-pulse.
- **No new dep** — no `react-loading-skeleton`, no `react-error-boundary`. Hand-roll. Both are ≤200 LOC of well-typed React + CSS.

**Scope of THIS pass:** `frontend/src/components/ui/Skeleton.tsx` (NEW), `frontend/src/components/ui/ErrorBoundary.tsx` (NEW), `frontend/src/components/ui/PageSkeleton.tsx` (NEW), `ocean.css` extension, plus per-page skeleton wiring on the 9 page surfaces from Phases 22-30. **Frontend only.**

## GitHub repos referenced

### Loading UX / skeletons
- [WE-1] `facebook/flux` patterns → modernized in `vercel/react-loading-skeleton` — implementation reference
- [WE-2] `Vercel Commerce` — hero skeleton → real content swap pattern
- [WE-3] `linear/linear-app` — `Theme-aware` skeleton shimmer that respects reduced-motion (we use OKLCH instead of theme attrs)

### Error boundaries
- [WE-4] `reactjs/react.dev` — class-component `ErrorBoundary` is the canonical reference
- [WE-5] `vercel/next.js` — `app/error.tsx` semantics (we hand-roll the equivalent)
- [WE-6] `bugsnag/bugsnag-js` — local-only "Send crash report" copies `~/Library/Application Support/fin/crashes/` (NO network call — privacy first)

### Skills
- [WE-7] `@vercel-react-best-practices` (this pass's domain skill)

---

## The 6 fixes (execute in order)

### 1 · `<Skeleton>` primitive (CSS-shimmer, OKLCH, GPU-cheap)
**Bug:** No skeleton primitive in the codebase. Every page uses `<Spinner>` or just blank space.

**Do:**
- Create `frontend/src/components/ui/Skeleton.tsx`. Pure CSS shape with optional variants:
  ```tsx
  <Skeleton variant="text" width="120px" />
  <Skeleton variant="rect" height="96px" radius={14} />
  <Skeleton variant="circle" size={32} />
  ```
  Internally renders a `<span>`/`<div>` with `className={\`skel skel--\${variant}\`}` + inline `style` overrides.
- Add to `ocean.css`:
  ```css
  :root { --skeleton-bg: oklch(0.25 0.02 210 / 0.55); --skeleton-shimmer: oklch(0.35 0.03 200 / 0.7); }
  @keyframes skel-sweep { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .skel {
    display: inline-block;
    background: linear-gradient(90deg, var(--skeleton-bg) 0%, var(--skeleton-shimmer) 50%, var(--skeleton-bg) 100%);
    background-size: 200% 100%;
    animation: skel-sweep 1.6s ease-in-out infinite;
    color: transparent;
    user-select: none;
    pointer-events: none;
  }
  .skel--text { height: 1em; border-radius: 4px; width: 100%; }
  .skel--rect { width: 100%; border-radius: var(--skeleton-radius, 12px); }
  .skel--circle { border-radius: 50%; }
  @media (prefers-reduced-motion: reduce) {
    .skel { animation: skeleton-pulse 1.8s ease-in-out infinite; background: var(--skeleton-bg); }
    @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
  }
  ```
- Export `Skeleton`, `SkeletonGroup`, `SkeletonLine` (composes 3-4 Skeletons for paragraphs).

### 2 · `<ErrorBoundary>` global component (recovery surface, no console pollution)
**Bug:** No `ErrorBoundary` anywhere. Unhandled render error → blank screen + console.error.

**Do:**
- Create `frontend/src/components/ui/ErrorBoundary.tsx`. Standard React class component with `getDerivedStateFromError` + `componentDidCatch`. State shape: `{ hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }`.
- Default `fallbackRender`: glassmorphic pane with:
  - title "Something went wrong here"
  - 1-line summary (error class name only — NO message in production build; trust-gated)
  - 3 buttons: **Reload section** (reset state via `reset()` — re-mounts children), **Reload app** (`window.location.reload()`), **Save crash log** (writes `error.toString() + stack` to `localStorage['fin:crash-recent']` and offers "Copy to clipboard")
- `props: { fallbackRender?: (props: { error, reset }) => ReactNode; onError?: (error, info) => void; children }`. Defaults are sensible.
- Always log to `console.error` — but ALSO show the user a recovery UI. Never silent again.

### 3 · `<PageSkeleton>` per page variant (shape-matches the content it replaces)
**Bug:** Even with skeletons, a hero-tile skeleton that doesn't match the final shape reads as "loading a different page". This destroys the perceived smoothness.

**Do:**
- Create `frontend/src/components/ui/PageSkeleton.tsx`. Exports one component per page: `PortfolioSkeleton`, `DebtSkeleton`, `RetirementSkeleton`, `OrchestrateSkeleton`, `RecommendationsSkeleton`, `ExecutionSkeleton`, `CommunitySkeleton`, `BacktestSkeleton`, `MemorySkeleton`, `DashboardSkeleton`.
- Each renders the page's skeleton shape using the `<Skeleton>` primitive. Examples:
  - `PortfolioSkeleton`: 5 hero tiles (`<Skeleton variant="rect" height={96}>`) in a row, then 1 large chart `<Skeleton variant="rect" height={300}>`.
  - `DebtSkeleton`: 2 strategy cards side-by-side, then 4 debt-account rows.
  - `MemorySkeleton`: 3-pane shell with file tree, editor body, outline panel.
  - `DashboardSkeleton`: large dim canvas area + 3 onboarding card placeholders.
- All page-level `<PageSkeleton>` components MUST honor the actual layout of their target page (read the page's CSS or component to verify column counts, gap, padding). If shapes diverge, the morph-in will look like a jump.

### 4 · Wire skeletons into the 6 pages that gate on fetch (Portfolio, Debt, Retirement, MultiAgent, Recommendations, Execution)
**Bug:** `Portfolio.tsx` shows nothing during fetch. Same for the other pages. Blank screens feel broken.

**Do:**
- Each of these pages already does `const [loading, setLoading] = useState(true)`. Replace the `if (loading) return <Spinner />;` (or the comment "loading data…" text) with `if (loading) return <PortfolioSkeleton />;` (or the appropriate variant).
- Sidebar already appears because it's outside the page component — leave it.
- Where pages already have inline skeleton blocks (e.g. Phase 23 already includes `.agent-recommend-skeleton`), replace those with the consistent `<Skeleton>` primitive usage too.
- Files to touch (counted toward the 10-file budget):
  - `frontend/src/pages/Portfolio.tsx`
  - `frontend/src/pages/DebtDashboard.tsx`
  - `frontend/src/pages/Retirement.tsx`
  - `frontend/src/pages/MultiAgent.tsx`
  - `frontend/src/pages/RecommendationsDashboard.tsx`
  - `frontend/src/pages/ExecutionDashboard.tsx`
  - `frontend/src/pages/CommunityDashboard.tsx`
  - `frontend/src/pages/BacktestDashboard.tsx`
  - `frontend/src/components/memory/MemoryExplorer.tsx` — Memory page also benefits

### 5 · Wrap routes in `ErrorBoundary` + Suspense in `App.tsx`
**Bug:** A single component crash blanks the entire app.

**Do:**
- In `frontend/src/App.tsx`, wrap every `<Route element={<Page />}>` with `<Route element={<ErrorBoundary><Page /></ErrorBoundary>} />`. The default fallback handles all unhandled errors.
- For the 5 heaviest pages that load big code (Memory's CodeMirror, Backtest's Recharts + strategy builder, Retirement's Recharts, MultiAgent's `useAgentStream`, Dashboard's `useOceanScene`), wrap additionally in `<Suspense fallback={<PageSkeleton variant="..." />}>`.
- Global catch: mount a SECOND `<ErrorBoundary onError={(err, info) => writeCrashReport(err, info)}>` at the top of the route tree as a safety net. The inner boundaries handle normal page-level errors; the outer catches escaping ones.

### 6 · Crash-reporter writes a local log (privacy-first)
**Bug:** "Send crash report" buttons are useless without writing data — and uploading to a cloud is hostile to Fin's local-only mode.

**Do:**
- Add `frontend/src/utils/crashReporter.ts`:
  ```ts
  export function writeCrashReport(error: Error, info: { componentStack?: string }): void {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };
      const key = `fin:crash-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(report));
      localStorage.setItem('fin:crash-recent', key);
      // Cap to last 20 reports so localStorage doesn't grow unbounded
      pruneOldReports();
    } catch { /* ignore — crash reporting must never itself throw */ }
  }
  function pruneOldReports() {
    const prefix = 'fin:crash-';
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix)).sort();
    while (keys.length > 20) localStorage.removeItem(keys.shift()!);
  }
  ```
- The "Save crash log" button on the ErrorBoundary fallback calls this. The "Copy to clipboard" button copies the most recent report's JSON.
- This is **purely local**. NO network call. Hidden from the user but accessible via `/settings` Danger Zone ("Export crash logs…") — Phase 33 work, defer.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--skeleton-bg`, `--skeleton-shimmer`, `--error-pane-bg`, `--error-accent`. **NO hex.**
2. **Accessibility** — skeletons MUST be `aria-busy="true"` + `aria-live="polite"` and not consume tab order (`tabIndex={-1}`, `pointer-events: none`). ErrorBoundary fallback pane has `role="alert"`, reset button is focus-visible on mount, full keyboard navigation.
3. **No new backend routes.**
4. **No new heavy deps.** `framer-motion` already in tree but we DON'T need it for skeletons (pure CSS).
5. **Performance** — skeletons render in 1 frame; no JS animation; the shimmer effect is GPU-cheap (`background-position` change only). At most 6-8 skeleton nodes per page.
6. **Micro-interactions < 300ms** per Emil Kowalski. Skeleton-to-content morph is instantaneous (no transition) — the difference between skeletons and real content is the user's signal that loading is done.
7. **Ponytail principle** — delete before adding. Delete any `if (loading) return <Spinner />` paths in favor of skeletons. **One** `data-testid` per skeleton variant (`data-testid="skel"`, `data-variant="text|rect|circle"`). No fabricated state.
8. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent. Sequence 1 → 2 → 3 → 4-5 → 6.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui src/utils/crashReporter.ts src/pages src/App.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/32-skeletons-and-errors.spec.ts`:
- Throttle network on `/portfolio` → skeleton appears, then real content morphs in
- Force a render error in a hidden dev-only panel → ErrorBoundary fallback appears with 3 buttons
- Click "Save crash log" → verify `localStorage['fin:crash-recent']` exists
- Reduced-motion → skeleton uses static pulse, no shimmer
- Lighthouse `total-blocking-time < 50ms` on `/portfolio` cold load

```bash
cd frontend && npx playwright test e2e/specs/32-skeletons-and-errors.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/portfolio`:
   - 0-150ms: skeleton hero tiles appear (5 matching the final layout)
   - 150-800ms: shimmer sweeps across each tile
   - 800ms+: real content lands, skeletons disappear instantly, no jump
2. Same for `/debt`, `/retirement`, `/multi-agent`, `/recommendations`, `/execution`.
3. Force an error in `Portfolio` (comment out a required field in the data shape) → ErrorBoundary fallback renders, 3 buttons work, "Reload section" recovers.
4. DevTools Console: zero `Uncaught Error` from React.
5. DevTools → Rendering → "Reduced motion" → skeletons static-pulse, no shimmer animation.
6. Lighthouse desktop ≥ 90 perf, 100 a11y.
7. Playwright e2e 32-skeletons-and-errors passes.
8. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match Phases 19-30 visual language. Skeletons feel like the same glassmorphic surface but blurred/inert. Re-read `frontend/src/styles/ocean.css` for tokens.

<task>Now go.</task>
