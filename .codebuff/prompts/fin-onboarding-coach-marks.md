# Phase 39 — Onboarding Coach Marks & Spotlight Tour (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **3-step spotlight coach tour** the Welcome screen teaches in `fin-empty-states-and-welcome.md`. Phase 38 left the CoachTour placeholder at `frontend/src/components/dashboard/CoachTour.tsx`; this phase wires it real: actual spotlight positioning (works on resize, sticky elements, dynamic layout), focus restoration during tour pauses, keyboard nav (←/→/Esc), persisted dismissal, and a "Restart tour" affordance in `/settings`. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@web-design-guidelines` `@frontend-design`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — coach tour visual contract
2. `frontend/src/styles/ocean.css` — there are existing `.coach-marks-spotlight` and `.coach-marks-tooltip` rules from Phase 22; extend, don't redeclare
3. `frontend/src/components/dashboard/CoachTour.tsx` — Phase 38's NEW formula
4. `frontend/src/components/dashboard/Welcome.tsx` — Phase 38's NEW formula
5. `frontend/src/pages/Settings.tsx` — adding a "Restart tour" button in the Help or Danger zone area
6. `frontend/src/App.tsx` — the right place to mount `<CoachTour/>` (after PermissionBanner / before ToastViewport)
7. `frontend/src/hooks/useAgentState.ts` — `lastSync` shape (null until first run)
8. `.codebuff/prompts/{fin-empty-states-and-welcome,fin-cinematic-ocean-dashboard,fin-keyboard-shortcuts-overlay}.md` — visual + behavior patterns
9. `.codebuff/prompts/fin-onboarding-coach-marks.md` (this file)

---

## User's report
> When I clicked "Skip" on the first coach-step, it disappeared. But the ResetTour never came back. When I tried `⌘K` for the first time, I wanted the spotlight to point at it, but I'm now 2 weeks in — and I just want to re-watch it for a colleague. I want the tour to actually feel like a tour: pause the rest of the app behind a dim overlay, spotlight an element with a colored ring, explain WHY it's important, and let me step ←/→ or Esc-dismiss. When I resize the window mid-tour, the spotlight must reposition without flicker. Skip must persist so the tour never auto-replays — but `/settings` should have a "Restart tour" button that's obvious.

## What "good" looks like (per spec)

- **CoachTour is a full-page dimmed overlay with one bright spotlight per step** — the rest of the page is `oklch(8% 0.015 210 / 0.62)` overlay (verifies already in `--coach-tour-overlay`). The spotlight box has a 2px `--coach-tour-spotlight-ring` outline + rounded corners. Tooltip floats attached above or below the spotlight depending on available space.
- **Steps** (each is a typed record):
  ```ts
  interface CoachStep {
    id: string;                       // 'palette','sync','execute-marked'
    title: string;                    // '⌘K opens the command palette'
    body: string;                     // 1-2 sentences explaining WHY
    targetSelector: string;           // CSS selector — concrete element spans; e.g. '.search-freshness-pill' (Phase 34 sync pill)
    placement?: 'top'|'bottom'|'left'|'right';  // default auto-fit
    cta?: { label, onClick };        // optional "Try it" affordance (closes overlay and dispatches action)
  }
  ```
- **Reposition on resize / scroll** — listen to window `resize` and a debounced `scroll` event; recompute the spotlight via `targetEl.getBoundingClientRect()`. The dimming overlay's `box-shadow: 0 0 0 9999px var(--coach-tour-overlay)` already adapts because it inherits from the spotlight's `box-shadow` rectangle. We need to set the rectangle position explicitly with `top/left/width/height` on the spotlight box.
- **Keyboard nav** — `←` previous, `→` / `Enter` next, `Esc` dismiss. Document this in the tooltip footer with kbd glyphs.
- **Tooltip auto-positions** above or below the spotlight depending on available space; flips if the spotlight is too high/low on the viewport. Use `getBoundingClientRect` + viewport size math.
- **"Try it" CTA on the third step** — "Mark Executed closes the loop" — the CTA actually invokes the action and closes the tour. (We can't fire on `/portfolio` — but we can navigate to `/execution` and the manual UI works.) For now, CTA navigates to `/execution` with `?from=tour` query param so we can attribute the entry.
- **Persistence** — `localStorage['fin:coach-tour-dismissed'] = 'true'` on Skip or Esc. Tour loads on first mount when key is missing. Each step's `seen` timestamp can be in `localStorage['fin:coach-tour-step-{id}-seen']` (optional for `finished` UX, not required this phase).
- **Setting: "Restart tour" button in `/settings`** — labelled clearly, in Help (NEW section) or Danger zone. Clicking it removes both localStorage keys.
- **No focus trap needed** — the dim overlay is a passive element; focus stays on the trigger button (Skip). Tab/Shift+Tab don't cycle within the overlay (a key design choice to avoid disorienting users whose spotlight element is on the page already).
- **Reduced-motion respected** — the spotlight ring fades instead of pulsing; the tooltip rises 220ms once then stays; reduced-motion → instant.
- **No new dep** — pure React + framer-motion (already in deps).

**Scope of THIS pass:** `frontend/src/components/dashboard/CoachTour.tsx` (wire real, was placeholder), `frontend/src/components/dashboard/CoachSteps.tsx` (NEW: typed step records), `frontend/src/hooks/useCoachTour.ts` (NEW: state + persistence + resize/scroll tracking), `frontend/src/App.tsx` (mount `<CoachTour/>` once, drive `open`/`step` state), `frontend/src/components/layout/TopBar.tsx` (give the sync pill a stable selector — `data-coach-target="sync-pill"` if missing), `frontend/src/components/ui/CommandPalette.tsx` (give its root a stable selector — `data-coach-target="copalette"` if missing), `frontend/src/pages/Settings.tsx` (new "Help & Onboarding" section with "Restart tour" button), `frontend/src/styles/ocean.css` (extend with reduced-motion + repositioned spotlight tokens). **Frontend only.**

## GitHub repos referenced

### Coach tour UX
- [WE-1] `react-joyride/react-joyride` — declarative step pattern (we hand-roll)
- [WE-2] `kamranahmedse/driver.js` — step positioning + scroll-into-view
- [WE-3] `maken8/chardin.js` — minimal-spotlight reference
- [WE-4] `stripe/stripe-react-native` — overlay positioning for sticky bottom-sheets (cross-reference pattern for resize behavior)

### Skills
- [WE-5] `@emil-design-eng` (this pass's domain skill)
- [WE-6] `@ui-animation`

---

## The 6 fixes (execute in order)

### 1 · `useCoachTour` — singleton state + persistence + resize tracking
**Bug:** No state container for tour. Phase 38 placeholder can't persist across reloads.

**Do:**
- Create `frontend/src/hooks/useCoachTour.ts`:
  ```ts
  interface TourState {
    open: boolean;
    step: number;             // 0..N-1
    dismissed: boolean;       // user pressed Skip or Esc
    finish: () => void;       // mark complete
    dismiss: () => void;      // mark dismissed (don't show on next mount)
    restart: () => void;      // admin reset
    goto: (step: number) => void;
  }
  export function useCoachTour(): TourState
  ```
- On mount, read `localStorage['fin:coach-tour-dismissed']`. If `'true'`, `open=false` and never auto-replays. Else, `open=true`.
- On `dismiss()`, write the localStorage key. Same on `finish()`.
- On `restart()`: clear keys + force `open=true`, step=0.
- Window resize/scroll listener updates internal `targetRect` — exposed via `getTargetRect(selector) => DOMRect | null` if needed.

### 2 · `CoachSteps.tsx` — the typed catalog
**Bug:** Steps are scattered between patches. No source of truth.

**Do:**
- Create `frontend/src/components/dashboard/CoachSteps.tsx`:
  ```ts
  export const COACH_STEPS: CoachStep[] = [
    {
      id: 'palette',
      title: '⌘K opens the command palette',
      body: 'From anywhere, hit ⌘K to navigate Fin, run agents, or change settings — without leaving your keyboard.',
      targetSelector: '[data-coach-target="topbar-brand"]',  // or topbar-left — anchor hint
      placement: 'bottom',
    },
    {
      id: 'sync',
      title: 'Sync runs all three agents',
      body: 'Click the freshness pill to trigger a manual sync. The agents re-derive their recommendations in seconds.',
      targetSelector: '[data-coach-target="sync-pill"]',
      placement: 'bottom',
    },
    {
      id: 'execute-marked',
      title: 'Mark Executed closes the loop',
      body: 'When you act on a recommendation, mark it executed here. Outcome tracking feeds back into Memory.',
      targetSelector: '[data-coach-target="execution-cta"]',
      placement: 'top',
      cta: { label: 'Open execution', onClick: 'navigate-to-execution' },
    },
  ];
  ```
- Add 3rd step's CTA handler via a global event so `App.tsx`'s `navigate` callback is reachable from the tour:
  ```ts
  window.dispatchEvent(new CustomEvent('fin:coach-tour-cta', { detail: { stepId: 'execute-marked' } }));
  ```
  App.tsx listens once and `navigate('/execution')`.

### 3 · `<CoachTour/>` — real spotlight with reposition
**Bug:** Phase 38 placeholder renders but doesn't position; doesn't reposition on resize.

**Do:**
- Wire `CoachTour.tsx` (it was a stub). On `state.step` change OR window resize, find the target element via `document.querySelector(step.targetSelector)`. Compute its `getBoundingClientRect()`. Render a `<div data-coach-tour-spotlight>` with `top/left/width/height` matching the rect. Render a `<div data-coach-tour-overlay>` with `box-shadow: 0 0 0 9999px var(--coach-tour-overlay); clip-path: polygon(0 0, <rect.x>px 0, <rect.x>px <rect.y>px, <rect.x + rect.w>px <rect.y>px, <rect.x + rect.w>px <rect.y + rect.h>px, <rect.x>px <rect.y + rect.h>px, <rect.x>px 0, 100% 0, 100% 100%, 0 100%);` — actually simpler: use two layered divs: a full-viewport dark layer + a small bright `<div>` for the rectangle. The existing `.coach-marks-spotlight` from Phase 22 CSS uses `box-shadow: 0 0 0 9999px var(--bio-glow)` — adopt this pattern with the dim color.
- Tooltip: position fixed, `top: rect.bottom + 12px` (default below) or `rect.top - tooltipHeight - 12px` (above) depending on viewport space.
- Footer: `<kbd>←</kbd> prev · <kbd>→</kbd>/<kbd>Enter</kbd> next · <kbd>Esc</kbd> skip`.

### 4 · Stable target selectors on TopBar + CommandPalette + Mark Executed button
**Bug:** Spotlight can't find its target reliably (CSS classes might be obfuscated in production; tree mutates on render).

**Do:**
- In `frontend/src/components/layout/TopBar.tsx`:
  - The TopBar root gets `data-coach-target="topbar-shell"`.
  - The sync pill gets `data-coach-target="sync-pill"`.
  - The brand span gets `data-coach-target="topbar-brand"`.
- In `frontend/src/components/ui/CommandPalette.tsx`:
  - The dialog overlay gets `data-coach-target="copalette"` (when open).
- In `frontend/src/pages/ExecutionDashboard.tsx`:
  - The "Mark Executed" button on each row gets `data-coach-target="execution-cta"`. (If we can ensure the first row's button is rendered; it's behind the filtered `filtered` array — if filter is `pending` and queue is empty, button doesn't render. Add a synthetic `data-coach-target="execution-cta"` fallback that the tour maps to "if not found, fallback to first pending row once a real row exists, or fall back to navigate-to-execution".)
- Each adds `data-testid` of the same slug for testability.

### 5 · Settings → "Help & Onboarding" → "Restart tour"
**Bug:** No way to re-watch the tour.

**Do:**
- In `frontend/src/pages/Settings.tsx`, add a new section between Knowledge and Prompts (or fold into Knowledge):
  - `<SettingsSection eyebrow="Onboarding" title="Help & tour" description="Re-watch the 3-step coach tour any time.">`
  - `<Button onClick={() => { restartCoachTour(); toast.info('Tour reset — refresh to play it again.', { duration: 6000 }); }}>Restart tour</Button>`
- The `restartCoachTour()` call is provided via `useCoachTour()` exposed through a context or imported directly. Pass it down via `useOutletContext`-equivalent or a thin context wrapper.
- (We don't ship the `Help` tab content yet — defer docs site / F.A.Q. page; track as tech debt.)

### 6 · Reduced-motion + reposition tokens + final polish
**Bug:** Spotlight ring pulses on screen; tooltip rises; the dim layer fades in.

**Do:**
- Add to `ocean.css`:
  ```css
  .coach-tour-spotlight {
    position: fixed;
    border-radius: 8px;
    box-shadow: 0 0 0 9999px var(--coach-tour-overlay),
                inset 0 0 0 2px var(--coach-tour-spotlight-ring);
    pointer-events: none;
    transition: top 220ms cubic-bezier(0.22, 1, 0.36, 1),
                left 220ms cubic-bezier(0.22, 1, 0.36, 1),
                width 220ms cubic-bezier(0.22, 1, 0.36, 1),
                height 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .coach-tour-tooltip {
    position: fixed;
    min-width: 280px; max-width: 360px;
    transition: top 220ms cubic-bezier(0.22, 1, 0.36, 1),
                left 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    .coach-tour-spotlight, .coach-tour-tooltip { transition: none !important; }
  }
  ```
- Verify: when the user resizes the window mid-tour, the spotlight rect recomputes and glides (or snaps under reduced-motion) to the new position without leaving a stale rectangle.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--coach-tour-overlay`/`--coach-tour-spotlight-ring`. **NO hex.**
2. **Accessibility** — spotlight `aria-hidden`; tooltip `role="dialog"` with `aria-labelledby` → title, `aria-describedby` → body. Skip button is `<button>`. Screen readers should announce every step transition. Reduced-motion honored.
3. **No new backend routes.**
4. **No new heavy deps.** `framer-motion` already in tree; existing CSS variables unchanged.
5. **Performance** — spotlight reposition fires on resize, debounced 16ms (1 frame); no layout thrash. The dim layer is a single absolutely-positioned div behind the spotlight.
6. **Micro-interactions < 300ms** per Emil Kowalski. Spotlight reposition 220ms ease-out; tooltip "rise" 220ms; step transitions 180ms. Reduced-motion → instant.
7. **Ponytail principle** — drop any inline JSX `style={...}` for spotlight positioning. **One** `data-testid` per step (`coach-tour-step-{id}`). **One** `data-coach-target` per targeted element.
8. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4 → 5 → 6. Ship ≤10 files.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/dashboard/CoachTour.tsx src/components/dashboard/CoachSteps.tsx src/hooks/useCoachTour.ts src/App.tsx src/components/layout/TopBar.tsx src/components/ui/CommandPalette.tsx src/pages/ExecutionDashboard.tsx src/pages/Settings.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/39-coach-tour.spec.ts`:

- Fresh install (localStorage cleared) → CoachTour auto-opens with step 1
- Step 1 → forward click → step 2; spotlight glides to sync pill
- Step 2 → forward click → step 3; spotlight glides to first Mark Executed button (or CTA navigates to /execution)
- Esc on step 1 → tour dismissed; reload doesn't show
- `?from=tour` query param on /execution when CTA dispatched
- Resize window → spotlight reposition without flicker
- Reduced-motion → instant transitions
- Settings → Help & Onboarding → Restart tour → clears localStorage; refresh starts tour again

```bash
cd frontend && npx playwright test e2e/specs/39-coach-tour.spec.ts --reporter=line
```

---

## Verification before declaring done

1. LocalStorage `fin:coach-tour-dismissed` cleared → reload `/` → tour auto-opens.
2. Resize window mid-step → spotlight recomputes.
3. Esc → tour closes; reload → no tour.
4. Tablet view (iPad portrait) → spotlight positioning still works (no overflow).
5. VoiceOver: each step is announced ("Coach tour step 1 of 3 · ⌘K opens the command palette").
6. Settings → Restart tour → refresh → tour reopens.
7. Lighthouse perf ≥ 90 + a11y ≥ 95 on `/`.
8. Playwright e2e 39-coach-tour passes.
9. Self-review with `@code-review-and-quality`.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** spotlight ring matches existing `--bio-glow` family. Tooltip glassmorphic same as Memory's palette. Re-read `frontend/src/styles/ocean.css`.

<task>Now go.</task>
