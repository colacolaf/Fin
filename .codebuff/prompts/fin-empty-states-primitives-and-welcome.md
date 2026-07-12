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
3. `frontend/src/components/dashboard/OnboardingCards.tsx` — existing component
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

- **Single, reusable `<EmptyState/>` primitive** that per-page wiring (Phase 38b) reuses. Props: `{icon?, title, description, cta?: { label, onClick, href? }, secondaryAction?: {label, onClick}, dismissable?: boolean}`. Renders a `<section className="empty-state">` with a centered 36×36 SVG icon, title (lg + weight 600), description (sm + muted), primary CTA (filled), secondary (ghost). Optional dismiss (×) closes the empty state for that session only when `?dismissable=true`.
- **`<Welcome/>`** when `useAgentState().lastSync === null` (i.e. no data has been fetched). 3 vertical sections each with a 1-row copy + CTA: (1) **Connect a brokerage** (CTA: `Run setup →`) (2) **Run your first sync** (CTA: `Sync now`, disabled until a connector shows up) (3) **Open a daily note** (CTA: `Open memory`). Below: 3 minimal cards summarizing the 3 essential shortcuts: `⌘K`, `g d`/`g m`/`g s`, `?` for help. Each card has kbd glyphs rendered via `<kbd>` (mirror `<kbd>` styling from Phase 35).
- **`<CoachTour/>` PLACEHOLDER** — only the empty shell mounts and renders nothing yet, so Phase 39 can wire real spotlight + step catalog without rebuilding this mount point. Phase 39 will replace the placeholder internals; this phase does NOT add the spot-light/reposition logic, the localStorage persistence, or any stateful behavior beyond a `null`/empty render.
- After first sync (`lastSync !== null`), the `<Welcome/>` unmounts and Phase 22 `OnboardingCards` takes over. Phase 38a ships the mount logic; the mount-swap is verified at the end.
- **Reduced-motion** respected everywhere — empty-state entrance fades; the placeholder renders nothing specifically but the surrounding chrome transitions stay consistent.
- **No new dep** — pure React + existing framer-motion + ocean.css tokens.

**Scope of THIS pass (≤10 files — counted & verified):**
- `frontend/src/components/ui/EmptyState.tsx` (NEW)
- `frontend/src/components/dashboard/Welcome.tsx` (NEW)
- `frontend/src/components/dashboard/CoachTour.tsx` (NEW — placeholder only)
- `frontend/src/pages/Dashboard.tsx` (mount Welcome when no sync; otherwise existing onboarding-cards)
- `frontend/src/components/dashboard/CoachTour.tsx` (placeholder code structure — see fix 3 below)
- `frontend/src/App.tsx` (mount `<CoachTour/>` placeholder in the same place the real coach tour will mount in Phase 39)
- `frontend/src/styles/ocean.css` (extend with `--empty-state-*`/`--coach-tour-overlay` tokens)

**Total: 6 source files.** Within budget.

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

## The 6 fixes (execute in order)

### 1 · `<EmptyState/>` primitive — the reusable card
**Bug:** Every page hand-rolls "no data" markup. Copy is inconsistent, CTAs missing, icons arbitrary emoji.

**Do:**
- Create `frontend/src/components/ui/EmptyState.tsx`. Props: `{icon?: ReactNode, title: string, description: string, cta?: {label, onClick, href?}, secondaryAction?: {label, onClick}, dismissable?: boolean, slug?: string}`. Resolved from `frontend/src/components/layout/Icons.tsx` (existing IconShield/IconTrade etc. are 24x24; we add 36x36 versions for empty states: `IconEmptyPortfolio`, `IconEmptyBacktest`, `IconEmptyMemory`, `IconEmptyQuotes`/`IconEmptyCheck`, `IconEmptyCommunity`, `IconEmptyDebt`, `IconEmptyRetire`).
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
- After first sync (`lastSync !== null`), `<Welcome/>` unmounts and Phase 22 `OnboardingCards` takes over.

### 3 · `<CoachTour/>` placeholder shell
**Bug:** Phase 39 needs a stable mount point; building this in 39 only is fine but separating the mount means swapping internals in 39 without touching `<App>`.

**Do:**
- Create `frontend/src/components/dashboard/CoachTour.tsx` as a placeholder. Render a single `<div data-coach-tour-mount data-testid="coach-tour-mount" />` that returns `null` in this phase. Phase 39 will write the body.
- No state, no listeners, no props beyond `null`.
- The file exists; the type contract is stable. Phase 39's diff will be a body-fill on the same file.

### 4 · Wire Welcome → Dashboard branch
**Bug:** Phase 22 onboarding-cards has no freshness-aware handoff.

**Do:**
- In `frontend/src/pages/Dashboard.tsx`, before the existing render path, read `useAgentState()`. If `agentState.lastSync == null`, render `<Welcome/>` ON TOP of (or replacing) the onboarding-cards. Branch logic:
  ```tsx
  const { agentState } = useAgentState();
  return (
    <div className="dashboard-onboarding-shell">
      {agentState.lastSync === null && <Welcome />}
      {/* ...existing 22 onboarding cards fade-out when Welcome mounts */}
    </div>
  );
  ```
- The cards existing on `lastSync !== null` paths continue to render.

### 5 · Mount CoachTour placeholder in `App.tsx`
**Bug:** Phase 39 will look for a mount point.

**Do:**
- In `frontend/src/App.tsx`'s `AppBody`, import and mount `<CoachTour />` alongside `<CommandPalette />` and `<ToastViewport />`. Order: Toast → CommandPalette → CoachTour. Phase 39 will swap the placeholder internals without touching mount position.
- No new state; placeholder returns null.

### 6 · CSS tokens + reduced-motion override block + final polish
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
- Add the 7 new `IconEmpty*` SVGs to `frontend/src/components/layout/Icons.tsx` (no separate file).
- Lighthouse a11y ≥ 95 on `/` after this phase lands.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--empty-state-*`, `--coach-tour-overlay`. **NO hex.**
2. **Accessibility** — EmptyState icons have `role="img"` + `aria-label`. CTAs are real `<button>` or `<a>` (not `<div onClick>`). Reduced-motion respected.
3. **No new backend routes.**
4. **No new heavy deps.**
5. **Performance** — Welcome / CoachTour placeholder only mount once per mount cycle; no per-second re-renders.
6. **Micro-interactions < 300ms** per Emil Kowalski. Empty-state fade-in 180ms reduced-motion → instant.
7. **Ponytail principle** — delete before adding. Drop duplicated "no Data" paragraphs. **One** `data-testid` per empty state (`empty-state-{slug}`). Reuse existing Icons & the existing `.onboarding-card` styling pattern.
8. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6 (CSS last). Ship exactly 6 source files.

**Hand-off to Phase 38b (companion brief):** per-page empty state wiring across `Portfolio.tsx`, `BacktestDashboard.tsx`, `ExecutionDashboard.tsx`, `MemoryExplorer.tsx`, etc. Phase 38b reuses the `<EmptyState/>` primitive from this phase without re-creating it.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/EmptyState.tsx src/components/dashboard/Welcome.tsx src/components/dashboard/CoachTour.tsx src/pages/Dashboard.tsx src/components/layout/Icons.tsx src/App.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/38a-empty-primitives.spec.ts` (Phase 38a — placeholder empty state unit tests):

- `/` on fresh localStorage → `<Welcome/>` mounts; "Run setup →" CTA visible
- Once `lastSync != null`, `<Welcome/>` unmounts; onboarding-cards take over
- `<EmptyState slug="portfolio-empty" title="..."/>` renders; key prop on data-testid is `"empty-state-portfolio-empty"` (slug regex `/^[a-z0-9-]+$/`)

```bash
cd frontend && npx playwright test e2e/specs/38a-empty-primitives.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` with cleared `localStorage`:
   - `/` → Welcome renders; "Run setup →" navigates to `/setup`
   - After `/setup` completes + first sync runs → Welcome unmounts; onboarding cards take over
2. EmptyState primitive accepts the right props; renders without crash.
3. CoachTour placeholder mounts a single `<div data-coach-tour-mount>` for Phase 39 to populate.
4. Icons.tsx now has 7 new `IconEmpty*` exports.
5. Lighthouse a11y ≥ 95 on `/`.
6. Playwright e2e 38a-empty-primitives passes.
7. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed (must be exactly 6), anything skipped (with reason), and any new tech debt. **Strict ≤10 files.** Stop and ask before ballooning scope. Outline the Phase 38b companion brief's expected scope so the next agent knows what to ship.

**Visual continuity — non-negotiable:** Welcome + EmptyState feel like the same glassmorphic surface. EmptyState icons match the existing IconShield/IconTrade visual language. Reduced-motion respected. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
