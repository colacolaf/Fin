# Phase 38b — Empty State Per-Page Wiring (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **per-page empty-state wiring** that Phase 38a scaffolded. Phase 38a created the `<EmptyState/>` primitive, `<Welcome/>`, and `<CoachTour/>` placeholder; this pass wires those primitives into specific pages — `Portfolio`, `Backtest`, `Memory` — replacing hand-rolled "no Data" paragraphs. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

> **Prereq (NOT in scope here):** Phase 38a's `<EmptyState/>` primitive must be present at `frontend/src/components/ui/EmptyState.tsx` AND the 7 `IconEmpty*` exports at `frontend/src/components/layout/Icons.tsx`. Read both first. If they aren't there, run Phase 38a before this brief.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@emil-design-eng` `@frontend-design` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `frontend/src/components/ui/EmptyState.tsx` — Phase 38a's primitive; understand props API
2. `frontend/src/components/layout/Icons.tsx` — Phase 38a exported `IconEmptyPortfolio`, `IconEmptyBacktest`, `IconEmptyMemory`, etc.
3. `frontend/src/pages/Portfolio.tsx` — currently shows empty `Holdings` rows when `holdings.length === 0`
4. `frontend/src/pages/BacktestDashboard.tsx` — currently shows "No backtest runs yet" message
5. `frontend/src/pages/MemoryExplorer.tsx` — currently empty-state copy in `MemoryExplorer.tsx`'s `memory-empty` div
6. `frontend/src/components/ocean/OnboardingCards.tsx` — leave alone (Phase 22 territory); do not edit for this pass
7. `.codebuff/prompts/{fin-empty-states-primitives-and-welcome,fin-portfolio-cockpit,fin-backtest-lab}.md` — Phase 38a + visual continuity
8. `.codebuff/prompts/fin-empty-states-per-page.md` (this file — Phase 38b)

---

## User's report
> After empty states land via Phase 38a, I want them wired into the pages where the user first lands. Today: Portfolio on a fresh install shows nothing meaningful; Backtest on a fresh install shows a one-line "No backtest runs yet" but doesn't link to a strategy template; Memory on a fresh install says "open one from the sidebar" but the sidebar is empty. After this phase, those pages should each show a real `<EmptyState/>` with a clear primary CTA + secondary.

## What "good" looks like (per spec)

- **Portfolio** — when `holdings.length === 0`: EmptyState with `IconEmptyPortfolio`, title "No holdings yet", description "Connect Alpaca, Fidelity, or import manually", primary CTA `Open Connections` (navigates to `/settings#/connections`), secondary `Browse templates` (navigates to `/backtest`). `slug="portfolio-empty"`.
- **Backtest** — when `runs.length === 0`: EmptyState with `IconEmptyBacktest`, title "No backtest runs yet", description "Pick a curated template or write your own", primary CTA `Open template gallery` (scrolls the gallery into view OR navigates to `/backtest` with anchor `#gallery`), secondary `Write your own` (focuses the StrategyBuilder form). `slug="backtest-empty"`.
- **Memory** — when `notes.length === 0` AND no error: EmptyState with `IconEmptyMemory`, title "Your vault is empty", description "Open a daily note — Fin suggests today's date", primary CTA `Open today's note` (calls `useMemory.ensureDailyNote()` and navigates to that permalink), secondary `Read tour` (placeholder link to the Phase 39 coach tour). `slug="memory-empty"`.
- **Out-of-scope (tracked as tech debt → follow-up brief):** Debt, Retirement, Execution, Recommendations, Community, MultiAgent — empty-state wiring is **NOT** in this brief. Track as a separate `.codebuff/prompts/fin-empty-states-followup.md` for the next session. Phase 38b is intentionally bounded to 3 highest-impact landing pages.
- **Slug regex** — `^[a-z0-9-]+$` is enforced by Phase 38a's primitive; this brief uses `portfolio-empty` / `backtest-empty` / `memory-empty` — all match.
- **Skeleton → Empty transition (HARD RULE):** Empty state replaces the loading skeleton **only when data returns `length === 0` AND not loading AND no error**. Never show Empty + Skeleton concurrently. Never show Empty during initial load (PageSkeleton stays). Never show Empty while `error` is set (an error placeholder is its own concern; this brief doesn't touch error branches).
- **No per-page custom JSX (HARD RULE):** every page in this brief consumes `<EmptyState/>` from Phase 38a — no per-page bespoke "no Data" marker, no inline `<div className="x-empty">`. Delete such markup verbatim when wiring EmptyState.
- **Memory Explorer branch clarification:** `frontend/src/pages/MemoryExplorer.tsx` already has a `memory-empty` div with copy "Open one from the sidebar (⌘K to search)". Phase 38b replaces this exact div with `<EmptyState/>`. Do NOT add a parallel placeholder; do NOT branch on additional conditions beyond the current `notes.length === 0 && !error && !loading` triple.
- **Reduced-motion** respected (smooth-scrolls to gallery/strategy-builder check `reduceMotion`).
- **No new dep**.

**Scope of THIS pass (≤10 files — counted & verified):**

> **File-budget arithmetic:** `0 NEW + 4 EDIT = 4 files`. Well within budget.

- `frontend/src/pages/Portfolio.tsx` (EDIT — replace inline empty state with `<EmptyState/>`)
- `frontend/src/pages/BacktestDashboard.tsx` (EDIT — replace inline "No backtest runs yet" with `<EmptyState/>`)
- `frontend/src/pages/MemoryExplorer.tsx` (EDIT — replace `memory-empty` div with `<EmptyState/>` when `notes.length === 0 && !loading && !error`)
- `frontend/src/styles/ocean.css` (EDIT — extend with one gradient helper if needed for empty-state hover; sub-30 LOC)

> **HARD GUARD — Skeleton/Empty transition:** A page must never render `<PageSkeleton/>` AND `<EmptyState/>` simultaneously. Use one of these branches in this order: (1) `loading ? <PageSkeleton/> : (2) error ? <ErrorPlaceholder/> : (3) data.length === 0 ? <EmptyState/> : (4) <ContentView/>`. Touch ONLY the (3) branch in this brief.

> **OKLCH-only (VISIBLE RULE):** `ocean.css` may only add OKLCH tokens. **No hex. No `rgb()`. No `hsl()`.**

## GitHub repos referenced

### Empty state wiring
- [WE-1] `linear/linear-app` — empty state copy + NextAction CTA convention
- [WE-2] `notion/notion` — database empty illustrations
- [WE-3] `dequeuniversity/deque-university` — plug-in accessibility for empty states

### Skills
- [WE-4] `@frontend-design` (this pass's domain skill)

---

## The 4 fixes (execute in order)

### 1 · Portfolio empty state
**Bug:** A fresh-install `/portfolio` shows an empty contest with no holdings + a confusing UX.

**Do:**
- In `frontend/src/pages/Portfolio.tsx`, find the branch where holdings array is empty (when `summary.holdings.length === 0` OR equivalent). Replace the hand-rolled empty paragraph with:
  ```tsx
  <EmptyState
    icon={<IconEmptyPortfolio />}
    title="No holdings yet"
    description="Connect Alpaca, Fidelity, or import manually."
    slug="portfolio-empty"
    cta={{ label: "Open Connections", onClick: () => navigate('/settings#/connections') }}
    secondaryAction={{ label: "Browse templates", onClick: () => navigate('/backtest') }}
  />
  ```
- The `<EmptyState/>` keeps the surrounding page chrome intact (hero tiles may still render; position the empty state below).
- Delete any redundant inline "No holdings" paragraph verbatim.
- Verify the Skeleton→Empty transition rule: only renders EMPTY when not loading AND no error AND holdings is empty.

### 2 · Backtest empty state
**Bug:** `runs.length === 0` shows "No backtest runs yet" with no path to act.

**Do:**
- In `frontend/src/pages/BacktestDashboard.tsx`, find the empty-runs branch:
  ```tsx
  <EmptyState
    icon={<IconEmptyBacktest />}
    title="No backtest runs yet"
    description="Pick a curated template or write your own."
    slug="backtest-empty"
    cta={{ label: "Open template gallery", onClick: () => {
      document.getElementById('strategy-gallery')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    } }}
    secondaryAction={{ label: "Write your own", onClick: () => {
      document.getElementById('strategy-builder')?.focus();
    } }}
  />
  ```
- Add `id="strategy-gallery"` to the existing `.strategy-gallery` section (1-line HTML id addition).
- Verify the Skeleton→Empty transition rule applies.

### 3 · Memory empty state
**Bug:** `notes.length === 0` shows "open one from the sidebar (⌘K to search)" but the sidebar is also empty.

**Do:**
- In `frontend/src/pages/MemoryExplorer.tsx`, find the branch where `notes.length === 0` AND `error` is null AND not loading. Replace the existing `<div className="memory-empty">` (or `memory-empty` div) with:
  ```tsx
  <EmptyState
    icon={<IconEmptyMemory />}
    title="Your vault is empty"
    description="Open a daily note — Fin suggests today's date."
    slug="memory-empty"
    cta={{ label: "Open today's note", onClick: async () => {
      // Read frontend/src/hooks/useMemory.ts first: if `openNote` accepts a permalink-shaped
      // string ('daily/YYYY-MM-DD'), no change. If it accepts an object ({permalink: ''}),
      // adapt to that shape — the placeholder above assumes the string form.
      await openNote('daily/' + new Date().toISOString().slice(0, 10));
    } }}
    secondaryAction={{ label: "Read tour", onClick: () => {
      // Placeholder: Phase 39 wires this; for now, scroll coach-tour mount into view
      document.querySelector('[data-coach-tour-mount]')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    } }}
  />
  ```
- The existing `loading?: <MemorySkeleton />` branch renders the skeleton; we only show EmptyState when NOT loading AND `notes.length === 0` AND no error.
- The Hard Rule on Skeleton→Empty applies: never render `<MemorySkeleton/>` + `<EmptyState/>` together.

### 4 · Reduced-motion polish + final verify
**Bug:** Smooth-scrolls don't honor `prefers-reduced-motion`.

**Do:**
- Verify Phase 38a's reduced-motion block covers `.empty-state` (it does). Add individual `reduceMotion` checks on scroll-into-view calls if needed.
- Run axe-core sweep on `/portfolio`, `/backtest`, `/memory` — assert zero violations.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only — VISIBLE RULE:** `EmptyState` reuses Phase 38a's tokens. **NO hex. NO `rgb()`. NO `hsl()`.**
2. **Skeleton→Empty transition (HARD RULE):** Skeleton and Empty never co-render. Loading branch uses `<PageSkeleton/>`; loaded-empty branch uses `<EmptyState/>`. If a page already errors, an ErrorPlaceholder owns the slot — do NOT show Empty in an error state.
3. **No per-page custom JSX (HARD RULE):** all empty branches consume `<EmptyState/>`. Do not reintroduce hand-rolled `<div className="x-empty">` markup.
4. **Accessibility** — CTAs are real buttons (`EmptyState` handles this). Reduced-motion respected on the smooth-scroll path.
5. **No new backend routes.**
6. **No new heavy deps.**
7. **Performance** — EmptyState renders at most once per page render; no double-mounts.
8. **Micro-interactions < 300ms** — phase 38a's top-level fade-in 180ms.
9. **Ponytail principle** — delete hand-rolled empty paragraphs verbatim. **One** `data-testid` per state (`empty-state-portfolio-empty`, etc.).
10. **Out-of-scope (HARD):** Debt/Retirement/Execution/Recommendations/Community/MultiAgent empty-state wiring is NOT in this brief. Branch tracking: create `.codebuff/prompts/fin-empty-states-followup.md` (a separate brief for the next session) listing each page's intended CTA ladder. Do NOT execute the follow-up in this brief.
11. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 (verifier). Ship exactly 4 files.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/Portfolio.tsx src/pages/BacktestDashboard.tsx src/pages/MemoryExplorer.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/38b-empty-per-page.spec.ts`:

- Fresh install + `/portfolio` → `data-testid="empty-state-portfolio-empty"`; "Open Connections" CTA navigates to `/settings#/connections`; **verify PageSkeleton NOT in DOM (`document.querySelector('.page-skeleton'))` is null)**
- `/backtest` empty → `data-testid="empty-state-backtest-empty"`; "Open template gallery" scrolls to `#strategy-gallery`; **verify PageSkeleton NOT in DOM**
- `/memory` empty (clear notes) → `data-testid="empty-state-memory-empty"`; "Open today's note" calls `ensureDailyNote`; **verify PageSkeleton NOT in DOM**
- Reduced-motion: smooth-scrolls are instant
- **Hard rule verify:** while `loading=true`, EmptyState does NOT mount (PageSkeleton owns the slot). Inject a stub `holdings=[]` with `loading=true` and assert `data-testid="empty-state-portfolio-empty"` is absent.

```bash
cd frontend && npx playwright test e2e/specs/38b-empty-per-page.spec.ts --reporter=line
```

---

## Verification before declaring done (concrete, not vague)

1. `npm run dev` with cleared `localStorage`:
   - `/portfolio` shows `<EmptyState/>` with "Open Connections" CTA → navigates correctly **Assert: `data-testid="empty-state-portfolio-empty"` is in DOM AND `*.page-skeleton` is absent.**
   - `/backtest` shows `<EmptyState/>` with "Open template gallery" CTA → scrolls to gallery **Assert: `data-testid="empty-state-backtest-empty"` is in DOM AND gallery section focused after scroll.**
   - `/memory` shows `<EmptyState/>` with "Open today's note" → calls ensureDailyNote **Assert: `data-testid="empty-state-memory-empty"` is in DOM AND `useMemory.ensureDailyNote()` is called once.**
2. axe-core: zero WCAG2AA violations on `/portfolio`, `/backtest`, `/memory` empty branches. **Assert: `runAxeCheck(page)` returns 0 violations.**
3. Lighthouse a11y ≥ 95.
4. Playwright e2e 38b-empty-per-page passes (including the Skeleton-co-render hard-rule verify).
5. Self-review with `@code-review-and-quality`: tight diff ≤ 4 files (you counted 4 EDIT + 0 NEW = 4; no extras). Search the diff for: any NEW file → revert. Hand-rolled `<div className="*-empty">` markup → verify it was the OLD code we deleted.

---

## Deliverable format

Reply with: bullet list of files changed (must be exactly 4), anything skipped (with reason — e.g. "Debt/Retirement/Execution/Recommendations/Community/MultiAgent empty-state wiring is tracked as tech debt for `.codebuff/prompts/fin-empty-states-followup.md`"), and any new tech debt. **Strict ≤10 files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** reuses Phase 38a's EmptyState styling. Icons match `IconShield`/`IconTrade` visual language at 36x36. Reduced-motion respected. Re-read `frontend/src/styles/ocean.css` + Phase 38a's tokens.

<task>Now go.</task>
