# Phase 38c — Empty State Follow-Up Wiring for Secondary Pages (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Phase 38a shipped the `<EmptyState/>` primitive + `<Welcome/>` + `<CoachTour/>` placeholder. Phase 38b wired `<EmptyState/>` into Portfolio, BacktestDashboard, and MemoryExplorer — the 3 highest-impact landing pages. **THIS brief** wires `<EmptyState/>` into the remaining 6 pages that ship empty states for typical first-run users. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

> **Prereq (NOT in scope here):** Phase 38a's `<EmptyState/>` primitive + 7 `IconEmpty*` exports must be present at `frontend/src/components/ui/EmptyState.tsx` and `frontend/src/components/layout/Icons.tsx`. Read both first.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@emil-design-eng` `@frontend-design` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `frontend/src/components/ui/EmptyState.tsx` — Phase 38a's primitive; understand props API
2. `frontend/src/components/layout/Icons.tsx` — Phase 38a's 7 `IconEmpty*` exports (`IconEmptyDebt`, `IconEmptyRetire`, `IconEmptyQuotes`/`IconEmptyCheck`, `IconEmptyCommunity`)
3. `.codebuff/prompts/fin-empty-states-per-page.md` (Phase 38b — copies its Skeleton→Empty transition rule + no-per-page-custom-JSX rule)
4. `.codebuff/prompts/fin-empty-states-followup.md` (this file)

---

## Pages in scope (6 total — verified counted)

The 6 pages tracked as tech debt by Phase 38b. Each gets exactly one EmptyState slot below its loading branch. Order from highest to lowest first-run likelihood:

1. **DebtDashboard** — `holdings-of-debts` empty: when `debts.length === 0 && !loading && !error`. `IconEmptyDebt` + title "No debts tracked" + CTA "Add a debt" → opens SetupWizard's debt section, secondary "Read tour" → scrolls coach-tour mount (Phase 39).
2. **Retirement** — goals empty: when `goals.length === 0 && !loading && !error`. `IconEmptyRetire` + title "No retirement goal yet" + CTA "Set a goal" → opens SetupWizard's retirement section, secondary "Estimate baseline" → calls a baseline estimator.
3. **Execution** — pending actions empty: when `pendingActions.length === 0 && !loading && !error`. `IconEmptyQuotes` + title "No pending follow-throughs" + CTA "Review plans" → `/recommendations`, secondary "Mark all read" (disabled when 0).
4. **Recommendations** — active recs empty: when `recs.length === 0 && !loading && !error`. `IconEmptyQuotes` + title "No active recommendations" + CTA "Run investment agent" → triggers the Investment agent's recommendation pipeline (calls existing service), secondary "Configure risk" → `/settings#/agent-prefs`.
5. **Community** — votes empty: when `communityItems.length === 0 && !loading && !error`. `IconEmptyCommunity` + title "No shared signals yet" + CTA "Browse open votes" → `/community?tab=open`, secondary "Submit a signal" → `/community/submit`.
6. **MultiAgent** — agent-with-no-result empty: when `agentResults.every(r => r.result === null) && !loading && !error`. `IconEmptyCheck` + title "No agent results yet" + CTA "Run orchestrated analysis" → calls the orchestrator's `runAll()` (existing service), secondary "View history" → scrolls the orchestrator's history list to the top.

---

## What "good" looks like (per spec)

- **Each page exactly one EmptyState instance.** No per-page bespoke `<div className="x-empty">` markup. DELETE hand-rolled copy verbatim.
- **Skeleton → Empty transition (HARD RULE — mirrors Phase 38b):** the render order is `loading ? <PageSkeleton/> : error ? <ErrorPlaceholder/> : data.length === 0 ? <EmptyState/> : <ContentView/>`. Replace ONLY the `data.length === 0` branch.
- **Slug regex** `^[a-z0-9-]+$` enforced by Phase 38a's primitive. Slugs: `debt-empty`, `retirement-empty`, `execution-empty`, `recommendations-empty`, `community-empty`, `multiagent-empty`.
- **Reduced-motion** respected (Phase 38a's block covers; verify).
- **No new dep**.

**Scope of THIS pass (≤10 files — counted & verified):**

> **File-budget arithmetic:** `0 NEW + 6 EDIT = 6 files`. Within budget. Each page is one EDIT.

- `frontend/src/pages/DebtDashboard.tsx` (EDIT — wire `EmptyState` for empty-debts branch with `slug="debt-empty"`)
- `frontend/src/pages/Retirement.tsx` (EDIT — wire `EmptyState` for empty-goals branch with `slug="retirement-empty"`)
- `frontend/src/pages/ExecutionDashboard.tsx` (EDIT — wire `EmptyState` for empty-pending-actions branch with `slug="execution-empty"`)
- `frontend/src/pages/RecommendationsDashboard.tsx` (EDIT — wire `EmptyState` for empty-active-recs branch with `slug="recommendations-empty"`)
- `frontend/src/pages/CommunityDashboard.tsx` (EDIT — wire `EmptyState` for empty-votes branch with `slug="community-empty"`)
- `frontend/src/pages/MultiAgent.tsx` (EDIT — wire `EmptyState` for empty-agent-results branch with `slug="multiagent-empty"`)

> **HARD GUARD — Skeleton/Empty transition:** same rule as Phase 38b. Never render `<PageSkeleton/>` AND `<EmptyState/>` concurrently.

> **OKLCH-only (VISIBLE RULE):** no CSS edits in this brief — EmptyState uses Phase 38a's tokens. **No new stylesheet rules.**

## GitHub repos referenced

### Skills
- [WE-1] `@frontend-design` (this pass's domain skill)

---

## The 6 fixes (execute in order — one per page)

For each page: find the `data.length === 0 && !loading && !error` branch → replace any hand-rolled copy/markup with `<EmptyState/>`. Use Phase 38a's `<EmptyState/>` primitive + a Phase 38a `IconEmpty*` SVG. Verify the Skeleton→Empty transition rule applies (no co-render).

Each fix is mechanically identical to Phase 38b's 3 fixes — read those for the exact pattern. Only the page-specific copy/icon/CTA varies.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only — VISIBLE RULE.** No CSS edits. Reuse Phase 38a tokens.
2. **Skeleton→Empty transition (HARD RULE):** Skeleton and Empty never co-render. Loading branch uses `<PageSkeleton/>`; loaded-empty branch uses `<EmptyState/>`. If a page already errors, an ErrorPlaceholder owns the slot — do NOT show Empty in an error state.
3. **No per-page custom JSX (HARD RULE):** all empty branches consume `<EmptyState/>`. Do not reintroduce hand-rolled `<div className="x-empty">` markup.
4. **Accessibility** — CTAs are real buttons (`EmptyState` handles this).
5. **No new backend routes.**
6. **No new heavy deps.**
7. **Performance** — EmptyState renders at most once per page render; no double-mounts.
8. **Micro-interactions < 300ms** — phase 38a's top-level fade-in 180ms.
9. **Ponytail principle** — delete hand-rolled empty paragraphs verbatim. **One** `data-testid` per state.
10. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6. Ship exactly 6 files.

---

## Code checkers — RUN AFTER EVERY FIX (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/DebtDashboard.tsx src/pages/Retirement.tsx src/pages/ExecutionDashboard.tsx src/pages/RecommendationsDashboard.tsx src/pages/CommunityDashboard.tsx src/pages/MultiAgent.tsx && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/38c-empty-followup.spec.ts`:

- `/debt` empty (no debts) → `data-testid="empty-state-debt-empty"`; "Add a debt" CTA navigates to `/setup#/debt`
- `/retirement` empty → `data-testid="empty-state-retirement-empty"`; "Set a goal" CTA navigates to `/setup#/retirement`
- `/execution` empty → `data-testid="empty-state-execution-empty"`; "Review plans" navigates to `/recommendations`
- `/recommendations` empty → `data-testid="empty-state-recommendations-empty"`; "Run investment agent" triggers pipeline
- `/community` empty → `data-testid="empty-state-community-empty"`; "Browse open votes" navigates to `/community?tab=open`
- `/orchestrate` empty → `data-testid="empty-state-multiagent-empty"`; "Run orchestrated analysis" calls orchestrator
- **Hard rule verify:** while `loading=true`, EmptyState does NOT mount on any of the 6 routes.

```bash
cd frontend && npx playwright test e2e/specs/38c-empty-followup.spec.ts --reporter=line
```

---

## Verification before declaring done (concrete)

1. `npm run dev` with cleared `localStorage` and stub data:
   - Each of the 6 routes shows `<EmptyState/>` with the right slug + CTA navigates correctly **Assert: `data-testid="empty-state-{slug}"` is in DOM AND `*.page-skeleton` is absent.**
2. axe-core: zero WCAG2AA violations on the 6 empty branches.
3. Lighthouse a11y ≥ 95.
4. Playwright e2e 38c-empty-followup passes (including the Skeleton-co-render hard-rule verify).
5. Self-review with `@code-review-and-quality`: tight diff ≤ 6 files. Search the diff for: any NEW file → revert. Hand-rolled `<div className="*-empty">` markup → verify it was the OLD code we deleted.

---

## Deliverable format

Reply with: bullet list of files changed (must be exactly 6), anything skipped (with reason), and any new tech debt. **Strict ≤10 files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** reuses Phase 38a's EmptyState styling. Reduced-motion respected. Re-read Phase 38a + 38b for the established pattern.

<task>Now go.</task>
