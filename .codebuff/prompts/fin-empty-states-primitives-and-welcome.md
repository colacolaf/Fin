# Phase 38a — Empty States, Welcome Screen, & Coach Tour Placeholder (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **graceful-empty UX layer** that's missing today. Fresh installs land on `/` and see nothing the user understands; per-page empty states currently use placeholder copy; first-run power users have no tour. This pass ships the **shared primitives** + the `<Welcome/>` screen for `/` + a `<CoachTour/>` PLACEHOLDER that Phase 39 wires real. **A companion brief, `fin-empty-states-per-page.md` (Phase 38b),** handles per-page empty-state wiring so this phase stays inside the 10-file budget. **Fix exactly what Phase 38a lists — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@emil-design-eng` `@frontend-design` `@ui-animation` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — the empty-state visual contract
2. `frontend/src/pages/Dashboard.tsx` — currently a `.dashboard-onboarding-shell` with three cards (Phase 22) but they go away after first sync; we extend to a permanent Welcome when `useAgentState` shows `lastSync === null`
3. `frontend/src/components/dashboard/OnboardingCards.tsx` — existing component, props `visible` / `onSelect` / `onDismiss`. Phase 22 territory — do NOT refactor.
4. `frontend/src/components/ui/PageSkeleton.tsx` — to see existing variants (pattern parity)
5. `frontend/src/pages/SetupWizard.tsx` — the entrypoint path that onboarding CTAs link to
6. `frontend/src/styles/ocean.css` — reuse `.onboarding-card-bg`/`.onboarding-card-border` patterns
7. `.codebuff/prompts/{fin-cinematic-ocean-dashboard,fin-app-shell-keyboard-and-recovery}.md` — visual language
8. `.codebuff/prompts/fin-empty-states-primitives-and-welcome.md` (this file — Phase 38a)
9. `.codebuff/prompts/fin-empty-states-per-page.md` (companion — Phase 38b; do NOT execute here)

---

## User's report
> I just installed Fin. I opened `/`, saw the ocean scene + the three onboarding cards, clicked one, and got sent to `/portfolio` which was blank. I had no idea what to do. The cards didn't say "click here to set up your first run" — they said "01 · Privacy". I want a polished Welcome screen that says "Oceans are empty until you load data. Here's a 60-second setup." Then per-page EmptyStates that always lead to the next action, and a coach-tour that walks through the 3 essential features on first launch (the tour is wired in Phase 39 separately). This phase ships the primitives and Welcome; the per-page wiring comes in 38b.

## What "good" looks like (per spec)

- **Single, reusable `<EmptyState/>` primitive** that per-page wiring (Phase 38b) reuses. Props: `{icon?, title, description, cta?: { label, onClick, href? }, secondaryAction?: {label, onClick}, dismissable?: boolean, slug?: string}`. Renders a `<section className="empty-state">` with a centered 36×36 SVG icon, title (lg + weight 600), description (sm + muted), primary CTA (filled), secondary (ghost). Optional dismiss (×) closes the empty state for that session only when `?dismissable=true`.
- **`<Welcome/>`** when `useAgentState().lastSync === null` (i.e. no data has been fetched). 3 vertical sections each with a 1-row copy + CTA: (1) **Connect a brokerage** (CTA: `Run setup →`) (2) **Run your first sync** (CTA: `Sync now`, disabled until a connector shows up) (3) **Open a daily note** (CTA: `Open memory`). Below: 3 minimal cards summarizing the 3 essential shortcuts: `⌘K`, `g d`/`g m`/`g s`, `?` for help. Each card has kbd glyphs rendered via `<kbd>` (mirror `<kbd>` styling from Phase 35).
- **`<CoachTour/>` PLACEHOLDER** — only the empty shell mounts and renders nothing yet, so Phase 39 can wire real spotlight + step catalog without rebuilding this mount point. Phase 39 will replace the placeholder internals; this phase does NOT add the spot-light/reposition logic, the localStorage persistence, or any stateful behavior beyond a `null`/empty render.
- **REPLACE-semantics with OnboardingCards (explicit decision):** Welcome REPLACES the existing Phase 22 `OnboardingCards` (`frontend/src/components/ocean/OnboardingCards.tsx`) on `/` while `lastSync === null`. Once `lastSync !== null`, `OnboardingCards` takes over. The two are NOT co-mounted. This is a hard replace — NOT coexist — to avoid two first-run surfaces competing for the user's attention. **Phase 22 territory is left untouched** — `<Welcome/>` simply branches BEFORE the OnboardingCards render path in Dashboard.tsx. Once `lastSync` is non-null, the React tree unwinds naturally. Visible/onSelect/onDismiss props remain supported for backwards-compat with any callers (none currently).
- **CoachTour mount order:** in App.tsx, render `<CoachTour />` after `<ToastViewport />` and `<CommandPalette />`. Phase 39 will replace the placeholder internals without touching mount position.
- **Reduced-motion** respected everywhere — empty-state entrance fades; the placeholder renders nothing specifically but the surrounding chrome transitions stay consistent.
- **No new dep** — pure React + existing framer-motion + ocean.css tokens.

**Scope of THIS pass (≤10 files — counted & verified):**

> **File-budget arithmetic:** `3 NEW + 3 EDIT = 6 source files`. Within ≤10 budget.

- `frontend/src/components/ui/EmptyState.tsx` (NEW)
- `frontend/src/components/dashboard/Welcome.tsx` (NEW)
- `frontend/src/components/dashboard/CoachTour.tsx` (NEW — placeholder only — see constraint below)
- `frontend/src/pages/Dashboard.tsx` (EDIT — branch on `lastSync === null` to render Welcome vs OnboardingCards; REPLACE semantic, not coexist)
- `frontend/src/components/layout/Icons.tsx` (EDIT — extend with 7 new 36x36 `IconEmpty*` SVGs: `IconEmptyPortfolio`, `IconEmptyBacktest`, `IconEmptyMemory`, `IconEmptyQuotes`/`IconEmptyCheck`, `IconEmptyCommunity`, `IconEmptyDebt`, `IconEmptyRetire`)
- `frontend/src/styles/ocean.css` (EDIT — extend with `--empty-state-*`/`--coach-tour-overlay` tokens and reduced-motion override)

> **HARD GUARD — Phase 22 territory:** `frontend/src/components/ocean/OnboardingCards.tsx` is Phase 22's domain. Phase 38a does NOT edit it. The replace semantics are entirely the caller's choice in Dashboard.tsx; OnboardingCards gets unmounted by React, no source change needed.

> **HARD RULE — CoachTour.tsx location:** Create `frontend/src/components/dashboard/CoachTour.tsx` here. The shared `frontend/src/components/ui/CoachTour.tsx` is **NOT** the right home — Phase 39 will swap the placeholder internals without touching `<AppBody>` import, and keeping the placeholder co-located with `Welcome.tsx` (both first-run surfaces) reflects their shared role. If a conflict emerges later (e.g. another dashboard component needs coach-marks), Phase 39 can promote it to `ui/`. Tracked as tech debt.

> **OKLCH-only (VISIBLE RULE):** ocean.css additions use `--empty-state-bg: oklch(...)` / `--empty-state-fg: oklch(...)` / etc. **NO hex. NO `rgb()`. NO `hsl()`.** Reviewer will grep for these; any hit → revert.

## GitHub repos referenced

### Empty state UX
- [WE-1] `linear/linear-app` — empty state copy ("Inbox zero", "What's next")
- [WE-2] `notion/notion` — empty database illustrations
- [WE-3] `github/primer` — "Blankslate" component pattern
- [WE-4] `vercel/error` — empty state with NextAction

### First-run tour (placeholder only)
- [WE-5] `react-joyride/react-joyride` — declarative JoyRide pattern (already in deps, but Phase 39 will use our hand-roll)
- [WE-6] `maken8/chardin.js` — minimal-coach-marks reference

### Skills
- [WE-7] `@emil-design-eng` (this pass's domain skill)
- [WE-8] `@frontend-design`

---

## The 5 fixes (execute in order — was 6, OnboardingCards surface removed)

### 1 · `<EmptyState/>` primitive — the reusable card
**Bug:** Every page hand-rolls "no data" markup. Copy is inconsistent, CTAs missing, icons arbitrary emoji.

**Do:**
- Create `frontend/src/components/ui/EmptyState.tsx`. Props: `{icon?: ReactNode, title: string, description: string, cta?: {label, onClick, href?}, secondaryAction?: {label, onClick}, dismissable?: boolean, slug?: string}`. Icons are pulled from `frontend/src/components/layout/Icons.tsx` (existing IconShield/IconTrade etc. are 24x24; we add 36x36 versions for empty states).
  - Validate the optional `slug` prop matches `/^[a-z0-9-]+$/` — otherwise `data-testid={...}` would be malformed. Bail with a console warn if invalid (the consumer is the bug, not us).
- Visual: centered, generous vertical padding (60px top/bottom), `--onboarding-card-bg` background blur, max width 480px.
- `data-testid="empty-state-{slug}"` when `slug` is passed.
- ARIA: `role="status"` for non-actionable empty states, `role="group"` for actionable ones.
- Reduce-motion: fade-in only (no rise).

### 2 · `<Welcome/>` for Dashboard when `lastSync === null`
**Bug:** Fresh installs land on a sparse onboarding-cards view that's hard to follow.

**Do:**
- Create `frontend/src/components/dashboard/Welcome.tsx`. Renders the 3-section vertical layout when `useAgentState().lastSync == null`. Section breakdown in `## What "good" looks like` above.
- The first CTA "Run setup →" navigates to `/setup`.
- Style: glassmorphic sections reusing `--onboarding-card-bg` token.
- After first sync (`lastSync !== null`), `<Welcome/>` UNMOUNTS and Phase 22 `OnboardingCards` takes over. See scope-block "REPLACE-semantics".

### 3 · `<CoachTour/>` placeholder shell at `components/dashboard/CoachTour.tsx`
**Bug:** Phase 39 needs a stable mount anchor in the React tree; building this in 39 only would mean cascading changes through `<App>` for the spotlight internals.

**Do:**
- Create `frontend/src/components/dashboard/CoachTour.tsx` returning **`<div data-coach-tour-mount data-testid="coach-tour-mount" />`** — an empty mount anchor for Phase 39's spotlight + reposition internals to fill in. Do NOT return `null`; cross-brief references (Phase 38b Memory's "Read tour" CTA + Phase 38a Verification step 3) call `document.querySelector('[data-coach-tour-mount]')` and expect the element to be in the DOM.
- No state, no listeners, no props (this phase).
- The file exists; the type contract is stable. Phase 39's diff will be a body-fill on the same file.

### 4 · Wire Welcome REPLACES OnboardingCards on Dashboard
**Bug:** Phase 22 onboarding-cards has no freshness-aware handoff to Welcome.

**Do:**
- In `frontend/src/pages/Dashboard.tsx`, before the existing render path, read `useAgentState()`. The render is mutually exclusive:
  ```tsx
  const { agentState } = useAgentState();
  if (agentState.lastSync === null) {
    return (
      <div className="dashboard-onboarding-shell">
        <Welcome />
        {/* OnboardingCards does NOT mount here */}
      </div>
    );
  }
  // existing onboarding-cards path
  return (
    <div className="dashboard-onboarding-shell">
      <OnboardingCards visible onSelect={...} />
    </div>
  );
  ```
- Branch is a clean early-return; the existing `OnboardingCards` import stays in case a child component or future branch needs it (YAGNI keeps it as a no-op path).
- The two surfaces are NEVER co-mounted. This avoids two first-run experiences stacking visually.

### 5 · Mount CoachTour placeholder in `App.tsx`
**Bug:** Phase 39 will look for a mount point.

**Do:**
- In `frontend/src/App.tsx`'s `AppBody`, import and mount `<CoachTour />` alongside `<CommandPalette />` and `<ToastViewport />`. Order: Toast → CommandPalette → CoachTour. Phase 39 will swap the placeholder internals without touching mount position.
- No new state; placeholder returns null.

### 6 · CSS tokens + reduced-motion override block + 7 new empty-state icons + final polish
**Bug:** No `empty-state` tokens. Reduced-motion override needed for Welcome + placeholder.

**Do:**
- Add to `ocean.css`:
  ```css
  :root {
    --empty-state-bg: oklch(20% 0.02 210 / 0.6);
    --empty-state-fg: oklch(85% 0.04 200);
    --empty-state-desc: oklch(70% 0.02 200);
    --coach-tour-overlay: oklch(8% 0.015 210 / 0.62);
  }
  .empty-state { /* centered, generous padding */ }
  .empty-state-title { font-size: var(--text-lg); font-weight: 700; }
  .empty-state-desc { color: var(--text-secondary); font-size: var(--text-sm); max-width: 38ch; }
  .welcome-section { /* glass card with vertical spacing */ }
  .welcome-cta-row { display: flex; gap: 12px; margin-top: 16px; }
  @media (prefers-reduced-motion: reduce) {
    .welcome-section, .empty-state { transition: none !important; animation: none !important; }
  }
  ```
- Add the 7 new `IconEmpty*` SVGs (36x36) to `frontend/src/components/layout/Icons.tsx` (no separate file). Each carries `role="img"` + an `aria-label` matching its name.
- Lighthouse a11y ≥ 95 on `/` after this phase lands.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only — VISIBLE RULE:** extend with `--empty-state-*`, `--coach-tour-overlay`. **NO hex. NO `rgb()`. NO `hsl()`.**
2. **OnboardingCards freeze (HARD GUARD):** Phase 22 territory. Phase 38a does NOT edit `frontend/src/components/ocean/OnboardingCards.tsx`. Branches are caller-only (Dashboard.tsx renders one or the other, never both).
3. **CoachTour location (HARD RULE):** place at `frontend/src/components/dashboard/CoachTour.tsx` (not `ui/`) — see scope-block rationale.
4. **Accessibility** — EmptyState icons have `role="img"` + `aria-label`. CTAs are real `<button>` or `<a>` (not `<div onClick>`). Reduced-motion respected.
5. **No new backend routes.**
6. **No new heavy deps.**
7. **Performance** — Welcome / CoachTour placeholder only mount once per mount cycle; no per-second re-renders.
8. **Micro-interactions < 300ms** per Emil Kowalski. Empty-state fade-in 180ms reduced-motion → instant.
9. **Ponytail principle** — delete before adding. Drop duplicated "no Data" paragraphs. **One** `data-testid` per empty state (`empty-state-{slug}`). Reuse existing Icons & the existing `.onboarding-card` styling pattern.
10. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6 (CSS last). Ship exactly 6 source files.

**Hand-off to Phase 38b (companion brief):** per-page empty state wiring across `Portfolio.tsx`, `BacktestDashboard.tsx`, `MemoryExplorer.tsx`, etc. Phase 38b reuses the `<EmptyState/>` primitive from this phase without re-creating it. Phase 38b imports `IconEmpty*` from `Icons.tsx` (added here in Fix 6) — **do not re-add them in Phase 38b**.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/EmptyState.tsx src/components/dashboard/Welcome.tsx src/components/dashboard/CoachTour.tsx src/pages/Dashboard.tsx src/components/layout/Icons.tsx src/App.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/38a-empty-primitives.spec.ts` (Phase 38a — placeholder empty state unit tests):

- `/` on fresh localStorage → `<Welcome/>` mounts; OnboardingCards does NOT mount; "Run setup →" CTA visible
- Once `lastSync != null`, `<Welcome/>` unmounts; OnboardingCards mounts (REPLACE verify: not both)
- `<EmptyState slug="portfolio-empty" title="..."/>` renders; key prop on data-testid is `"empty-state-portfolio-empty"` (slug regex `/^[a-z0-9-]+$/`)

```bash
cd frontend && npx playwright test e2e/specs/38a-empty-primitives.spec.ts --reporter=line
```

---

## Verification before declaring done (concrete, not vague)

1. `npm run dev` with cleared `localStorage`:
   - `/` → ONLY Welcome renders (NOT OnboardingCards); "Run setup →" navigates to `/setup`
   - After `/setup` completes + first sync runs → ONLY OnboardingCards renders (NOT Welcome); REPLACE semantics verified
   **Assert: `document.querySelectorAll('[data-testid="welcome-section"], .onboarding-card').length === 1` — never 2.**
2. EmptyState primitive accepts the right props; renders without crash. **Assert: `render(<EmptyState slug="test" title="t" description="d" />)` mounts without warning.**
3. CoachTour placeholder renders **the empty `<div data-coach-tour-mount>`** (NOT `null`) for Phase 39 to fill in. **Assert: `document.querySelector('[data-coach-tour-mount]')?.tagName === 'DIV'`.**
4. Icons.tsx now has 7 new `IconEmpty*` exports. **Assert: `Object.keys(import('../../components/layout/Icons.tsx')).filter(k => k.startsWith('IconEmpty')).length === 7`.**
5. Lighthouse a11y ≥ 95 on `/`.
6. Playwright e2e 38a-empty-primitives passes.
7. Self-review with `@code-review-and-quality`: tight diff ≤ 6 files, no drive-by refactors. Search the diff for forbidden strings: any edit to `OnboardingCards.tsx` → revert. Any hex literal in `ocean.css` additions → revert.

---

## Deliverable format

Reply with: bullet list of files changed (must be exactly 6), anything skipped (with reason — e.g. "OnboardingCards.tsx untouched per Phase 22 freeze"), and any new tech debt (e.g. "CoachTour.tsx location may need to promote to `ui/` once Phase 39 adds multi-surface support"). **Strict ≤10 files.** Stop and ask before ballooning scope. Outline the Phase 38b companion brief's expected scope so the next agent knows what to ship.

**Visual continuity — non-negotiable:** Welcome + EmptyState feel like the same glassmorphic surface. EmptyState icons match the existing IconShield/IconTrade visual language, but at 36x36 instead of 24x24. Reduced-motion respected. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
