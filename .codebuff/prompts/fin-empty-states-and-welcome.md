# Phase 38 — Empty States, Welcome Screen, & First-Run Tour (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **graceful-empty UX layer** that's missing today. Fresh installs land on `/` and see nothing the user understands; `CommunityDashboard` when opted-out shows three skeleton-ish cards that say "Opt-in", "Browse", "Read"; `Portfolio` on a brand-new install is just empty rows. We need: a **`/` Welcome experience** (3 onboarding tickets but with concrete copy + CTAs to actually run `/setup`), **per-page empty states** that tell the user where they are and what to do next, **a "no data" component primitive** that paged components reuse, and the **first-run coach tour** that walks users through ⌘K + Sync + Mark Executed (a 3-step spotlight, dismissable, persisted). **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@emil-design-eng` `@frontend-design` `@ui-animation` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — the empty-state visual contract
2. `frontend/src/pages/Dashboard.tsx` — currently a `.dashboard-onboarding-shell` with three cards (Phase 22) but they go away after first sync; we extend to a permanent Welcome when `useAgentState` shows `lastSync === null`
3. `frontend/src/components/dashboard/OnboardingCards.tsx` — existing component mentioned
4. `frontend/src/components/ui/PageSkeleton.tsx` — to add a `<EmptyState>` primitive that mirrors its variants
5. `frontend/src/pages/Portfolio.tsx`, `BacktestDashboard.tsx`, `RecommendationsDashboard.tsx`, `ExecutionDashboard.tsx`, `CommunityDashboard.tsx`, `DebtDashboard.tsx`, `Retirement.tsx`, `MemoryExplorer.tsx` — current "empty" states in each
6. `frontend/src/pages/SetupWizard.tsx` — the entrypoint path that onboarding CTAs link to
7. `frontend/src/components/dashboard/CoachMarks.tsx` (or similar — check if exists) — Phase 22 had a coach-marks CSS surface (`coach-marks-spotlight`, `coach-marks-tooltip`) that we re-purpose for the first-run tour
8. `frontend/src/hooks/useGlobalHotkeys.ts`, `hooks/useAgentState.ts`, `hooks/useToast.ts` — the wiring points for tour events
9. `.codebuff/prompts/{fin-cinematic-ocean-dashboard,fin-app-shell-keyboard-and-recovery,fin-keyboard-shortcuts-overlay}.md` — visual language + verification patterns
10. `.codebuff/prompts/fin-empty-states-and-welcome.md` (this file)

---

## User's report
> I just installed Fin. I opened `/`, saw the ocean scene + the three onboarding cards, clicked one, and got sent to `/portfolio` which was blank. I had no idea what to do. The cards didn't say "click here to set up your first run" — they said "01 · Privacy". The Community page has a "no cohort smaller than 10 reports" pitch but doesn't explain how to opt in. Backtest on a fresh install shows "No backtest runs yet" but doesn't link to a template. Memory on a fresh install says "No note open — open one from the sidebar (⌘K to search)" but the sidebar is empty. Everywhere the user lands on a screen with no data, they don't know the next step. I want a polished Welcome screen that says "Oceans are empty until you load data. Here's a 60-second setup.", then per-page EmptyStates that always lead to the next action, and a coach-tour that walks through the 3 essential features on first launch.

## What "good" looks like (per spec)

- **`/` Welcome** when `useAgentState().lastSync === null` (i.e. no data has been fetched):
  - Title: "Welcome to Fin — your local-first finance agent."
  - 3 vertical sections each with a 1-row copy + CTA: (1) **Connect a brokerage** (CTA: `Run setup →`) (2) **Run your first sync** (CTA: `Sync now`, disabled until a connector shows up) (3) **Open a daily note** (CTA: `Open memory`).
  - Below: 3 minimal cards summarizing Capacity (Irrelevant — defer or remove) + the 3 essential shortcuts: `⌘K`, `g d`/`g m`/`g s`, `?` for help. Each card has the kbd glyphs rendered (mirror `<kbd>` styling from Phase 35).
  - When `lastSync` updates to a real timestamp (sync ran), the Welcome gives way to the Phase 22 cinematic dashboard onboarding-cards (existing).
- **`<EmptyState/>` primitive** at `frontend/src/components/ui/EmptyState.tsx`:
  - Props: `{icon?, title, description, cta?: { label, onClick, href? }, secondaryAction?: {label, onClick}, dismissable?: boolean}`.
  - Renders a `<section className="empty-state">` with a centered 36×36 SVG icon (`IconEmpty*` from existing Icons.tsx, or a new one), title (lg + weight 600), description (sm + muted), primary CTA (filled), secondary (ghost). Optional dismiss (×) closes the empty state for that session only when `?dismissable=true`.
  - `data-testid="empty-state-{slug}"`.
- **Per-page empty states** below (replace current "no Data" messages):
  - **Portfolio** — no holdings. EmptyState: icon `wallet`, title "No holdings yet", description "Connect Alpaca, Fidelity, or import manually", cta `Open Connections`, secondary `Browse trends`.
  - **Backtest** — no runs yet. EmptyState: icon `chart`, title "No backtest runs", description "Pick a strategy template and run", cta `Open template gallery` (scrolls to gallery), secondary `Write your own`.
  - **Recommendations** — none pending. EmptyState: icon `thumbs-up`, title "All caught up", description "The Investment agent runs on a schedule — next around 4h".
  - **Execution** — queue empty. EmptyState: icon `check-circle`, title "No recommendations pending", description "Once the agents think, executions queue here".
  - **Debt** — no accounts. EmptyState: icon `card`, title "Add your first debt", description "Cards, student loans, mortgages — your call", cta `Add account` (existing flow).
  - **Community** — opted out (existing three cards but better copy); replace the copy: leaderboard metric, percentile compare offer.
  - **MultiAgent** — first-run helper is good. Don't change.
  - **Memory** — `notes.length === 0`. EmptyState: icon `pencil`, title "Your vault is empty", description "Open a daily note — Fin suggests today's date", cta `Open today's note` (calls `useMemory.ensureDailyNote()`), secondary `Read tour`.
  - **Retirement** — no profile. EmptyState: icon `retire`, title "Set up your retirement profile", description "Age, target, current savings takes 30 seconds", cta `Start` (focuses first field).
- **First-run coach tour** — 3 spotlight steps: (1) "⌘K opens the command palette" pointing at the search bar, (2) "Sync runs the agents" pointing at the TopBar sync pill, (3) "Mark Executed closes the loop" pointing at the first action row on `/execution`. Each step has a dimmed spotlight overlay (`coach-marks-spotlight` from Phase 22) + a tooltip (`coach-marks-tooltip`) with title, body, Next, Skip. Persisted in `localStorage['fin:coach-tour-complete']`.
- **Coach-tour resets if user dismisses everything then runs `/setup` again** — opt-in flag in settings. Don't implement the reset switch this phase; just persist the `complete` flag and stop showing.
- **Reduced-motion** respected everywhere — empty-state entrance fades; coach tour spotlight fades instead of pulse.
- **No new dep** — pure React + existing framer-motion + ocean.css tokens.

**Scope of THIS pass:** `frontend/src/components/ui/EmptyState.tsx` (NEW), `frontend/src/components/dashboard/Welcome.tsx` (NEW), `frontend/src/components/dashboard/CoachTour.tsx` (NEW), `frontend/src/pages/Dashboard.tsx` (mount Welcome when no sync), `frontend/src/pages/Portfolio.tsx`/BacktestDashboard/RecommendationsDashboard/ExecutionDashboard/DebtDashboard/CommunityDashboard/MemoryExplorer/Retirement (`<EmptyState/>` wired into each), `frontend/src/App.tsx` (mount `<CoachTour/>`), `frontend/src/styles/ocean.css` (extend with empty-state tokens + a coach-tour token block, fewer than 100 LOC). **Frontend only.**

## GitHub repos referenced

### Empty state UX
- [WE-1] `linear/linear-app` — empty state copy ("Inbox zero", "What's next")
- [WE-2] `notion/notion` — empty database illustrations
- [WE-3] `github/primer` — "Blankslate" component pattern
- [WE-4] `vercel/error` — empty state with NextAction

### First-run tour
- [WE-5] `kamranahmedse/driver.js` — coach marks pattern
- [WE-6] `react-joyride/react-joyride` — declarative JoyRide pattern (already in deps, but verify we can use it OR hand-roll more idiomatic single-feature tour)
- [WE-7] `maken8/chardin.js` — minimal-coach-marks reference

### Skills
- [WE-8] `@emil-design-eng` (this pass's domain skill)
- [WE-9] `@frontend-design`

---

## The 6 fixes (execute in order)

### 1 · `<EmptyState/>` primitive — the reusable card
**Bug:** Every page hand-rolls "no data" markup. Copy is inconsistent, CTAs missing, icons arbitrary emoji.

**Do:**
- Create `frontend/src/components/ui/EmptyState.tsx`. Props surface described above. Resolved from `frontend/src/components/layout/Icons.tsx`: add a small set of domain icons (`IconEmptyPortfolio`, `IconEmptyBacktest`, `IconEmptyMemory`, `IconEmptyQuotes`/`IconEmptyCheck`, `IconEmptyCommunity`, `IconEmptyDebt`, `IconEmptyRetire`). Each is a hand-rolled 36×36 SVG using the existing `IconShield`/`IconTrade` patterns (no font emoji).
- Optional clickable area, primary + secondary button slots. Visually: centered, generous vertical padding (60px top/bottom), `--onboarding-card-bg` background blur, max width 480px.
- `data-testid="empty-state-{slug}"` when prop `slug` is passed.
- Aria: `role="status"` for non-actionable empty states, `role="group"` for actionable ones.

### 2 · Per-page empty states — wire each page
**Bug:** 7 pages show "no data" bullets or dummy copy.

**Do:**
- In each page file (`Portfolio.tsx`, `BacktestDashboard.tsx`, `RecommendationsDashboard.tsx`, `ExecutionDashboard.tsx`, `DebtDashboard.tsx`, `CommunityDashboard.tsx`, `MemoryExplorer.tsx`, `Retirement.tsx`), replace the "empty" branch with `<EmptyState/>`. List of CTAs and copy as described in Fix 6 above.

### 3 · `<Welcome/>` for Dashboard when `lastSync === null`
**Bug:** Fresh installs land on a sparse onboarding-cards view that's hard to follow.

**Do:**
- Create `frontend/src/components/dashboard/Welcome.tsx`. Renders the 3-section vertical layout when `useAgentState().lastSync == null`. Section breakdown in Fix 6 above.
- The first CTA "Run setup →" navigates to `/setup` (existing setup wizard). Add a route guard so `/setup` doesn't loop if it's already done.
- Style: glassmorphic sections with the existing `--onboarding-card-bg` token. Reduced-motion: fade-in only (no rise).
- After first sync (`lastSync !== null`), `<Welcome/>` unmounts and Phase 22 `OnboardingCards` takes over.

### 4 · `<CoachTour/>` — 3-step spotlight
**Bug:** First-run users don't know what to try first.

**Do:**
- Create `frontend/src/components/dashboard/CoachTour.tsx`.
- 3 steps:
  1. Spotlight the TopBar — "⌘K opens the command palette from anywhere."
  2. Spotlight the TopBar sync pill — "Sync runs the investment, debt, and retirement agents."
  3. Spotlight the first row on `/execution` (getBoundingClientRect via a stable ref) — "Mark Executed closes the feedback loop — and updates Memory."
- State: `currentStep: 0 | 1 | 2`, `complete: boolean`. Persist `localStorage['fin:coach-tour-complete'] = 'true'` once any step is dismissed OR completed.
- Spotlight overlay uses the existing `.coach-marks-spotlight` from ocean.css (Phase 22). Coach-tour tooltip reuses `.coach-marks-tooltip` + `.coach-marks-actions`.
- Skip / Next buttons. Re-enter on `localStorage.removeItem('fin:coach-tour-complete')` from Settings (defer Settings reset).
- `data-testid="coach-tour-overlay"` and `coach-tour-step-{n}`.

### 5 · Welcome → Onboarding-cards handoff + reduced-motion final pass
**Bug:** The two surfaces overlap visually but not logically.

**Do:**
- In `frontend/src/pages/Dashboard.tsx`, the page branches on `agentState.lastSync === null` → render `<Welcome/>`. Else render existing Phase 22 onboarding-cards. Both can be on screen simultaneously? No: when `<Welcome/>` mounts, the cards fade out (read OnboardingCards.tsx for the dismiss mechanism).
- Reduced-motion: both Welcome and CoachTour fade-in only. Spotlight overlay should NOT pulse-animate. Set transitions to fade instead of bounce in `ocean.css`'s reduced-motion block.

### 6 · CSS tokens + reduced-motion override block + final polish
**Bug:** No `empty-state` tokens. Coach-tour spotlight already has CSS but lives in Phase 22 namespace.

**Do:**
- Add to `ocean.css`:
  ```css
  :root {
    --empty-state-bg: oklch(20% 0.02 210 / 0.6);
    --empty-state-fg: oklch(85% 0.04 200);
    --coach-tour-overlay: oklch(8% 0.015 210 / 0.62);
    --coach-tour-spotlight-ring: oklch(80% 0.10 180);
  }
  .empty-state { /* centered, generous padding */ }
  .empty-state-title { font-size: var(--text-lg); font-weight: 700; }
  .empty-state-desc { color: var(--text-secondary); font-size: var(--text-sm); max-width: 38ch; }
  .welcome-section { /* glass card with vertical spacing */ }
  .welcome-cta-row { display: flex; gap: 12px; margin-top: 16px; }
  @media (prefers-reduced-motion: reduce) {
    .welcome-section, .empty-state, .coach-marks-spotlight { transition: none !important; animation: none !important; }
  }
  ```
- Verify a Lighthouse a11y run after — the new components comply with `role="status"`/`role="group"`.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--empty-state-*`, `--coach-tour-*`. **NO hex.**
2. **Accessibility** — EmptyState icons have `role="img"` + `aria-label`. CTAs are real `<button>` or `<a>` (not `<div onClick>`). Coach-tour Skip button is `<button>`. Reduced-motion respected.
3. **No new backend routes.**
4. **No new heavy deps.** The `react-joyride ^3.2.0` already in `package.json` COULD be used, but we hand-roll a simpler 3-step coach in fewer than 200 LOC. Don't open the integration unless the hand-roll proves insufficient.
5. **Performance** — Welcome / CoachTour only mount once per mount cycle; no per-second re-renders.
6. **Micro-interactions < 300ms** per Emil Kowalski. Empty-state fade-in 180ms; coach-tour spotlight fade 180ms; tooltip rise 220ms.
7. **Ponytail principle** — delete before adding. Drop duplicated "no Data" paragraphs. **One** `data-testid` per empty state (`empty-state-{slug}`). Reuse existing Icons & the existing `.onboarding-card` styling pattern.
8. **`@subagent-driven-development` mandatory** — sequence 1 → 2 (consumer) → 3 → 4 → 5 → 6 (CSS final). Ship ≤10 files.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/EmptyState.tsx src/components/dashboard/Welcome.tsx src/components/dashboard/CoachTour.tsx src/pages/Dashboard.tsx src/pages/Portfolio.tsx src/pages/BacktestDashboard.tsx src/pages/RecommendationsDashboard.tsx src/pages/ExecutionDashboard.tsx src/pages/MemoryExplorer.tsx src/styles/ocean.css src/App.tsx && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/38-empty-and-welcome.spec.ts`:

- Fresh install (clear localStorage reset → reload `/`) → Welcome screen visible with 3 CTAs
- Click "Run setup →" → `/setup` loads
- Navigate to `/portfolio` with no holdings → EmptyState with `Connect broker` CTA, secondary `Browse trends`
- Navigate to `/backtest` empty → EmptyState with `Open template gallery`
- Coach-tour on fresh install: 3 spotlight steps visible; Skip closes + persists; reload doesn't show
- Reduced-motion: Welcome + EmptyState + CoachTour appear instantly

```bash
cd frontend && npx playwright test e2e/specs/38-empty-and-welcome.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` with cleared `localStorage`:
   - `/` → Welcome renders; "Run setup →" navigates to `/setup`
   - After `/setup` completes + first sync runs → Welcome unmounts; onboarding cards take over
2. Visit each empty page (with `lastSync == null` data shaping) → `<EmptyState/>` renders with correct CTA; CTAs work.
3. Coach tour: 3 steps render; Skip persists; reload doesn't show.
4. VoiceOver on macOS: EmptyState icon has `aria-label`; CTA is a real button.
5. Lighthouse a11y ≥ 95 on `/`, `/portfolio`, `/backtest`, `/memory` empty branches.
6. Playwright e2e 38-empty-and-welcome passes.
7. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** Welcome + EmptyState + CoachTour feel like the same glassmorphic surface. EmptyState icons match the existing IconShield/IconTrade visual language. Coach-tour spotlight matches the existing `.coach-marks-spotlight` from Phase 22. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
