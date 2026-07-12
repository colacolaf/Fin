# Phase 31 — Toast & Transient Feedback Surface (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to replace silent `console.error` calls with a real toast/snackbar surface so the user knows when a save, vote, sync, or alert fails. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md` — visual thesis (THE OCEAN metaphor + OKLCH)
2. `frontend/src/styles/ocean.css` — OKLCH tokens (do not reinvent)
3. `frontend/src/components/RecommendationCard.tsx` — silent `console.error('Vote failed:', e)` (Fix 1's primary offender)
4. `frontend/src/components/StrategyBuilder.tsx` — silent `console.error('Save failed', e)`
5. `frontend/src/registerSW.ts` — silent `console.error('[SW] Registration failed:', error)`
6. `frontend/src/components/CheckInBanner.tsx` + `OfflineBanner.tsx` — existing banner patterns to imitate
7. `frontend/src/components/layout/ChromeShell.tsx` — global mount point for the toast provider
8. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-cinematic-ocean-dashboard,fin-recommendation-card,fin-execution-flow}.md` — visual language is the established truth
9. `.codebuff/prompts/fin-toast-notification-surface.md` (this file) — re-read before commits

---

## User's report
> RecommendationCard `Vote failed`, StrategyBuilder `Save failed`, and service-worker `Registration failed` all log to `console.error` and tell the user nothing. The Execution Dashboard "Mark Executed" flow has an inline confirmation modal but no toast confirming the action landed. The TopBar sync indicator pulses but doesn't say what just finished. I want a single toast surface — top-right stack, glassmorphic, OKLCH — used by every alert path in the app.

## What "good" looks like (per spec)

- **One toast surface, used everywhere.** Single `<ToastProvider>` mounted in `ChromeShell.tsx`. A `useToast()` hook (`toast.success` / `toast.error` / `toast.info` / `toast.promise`) is the only public API.
- **Severity tone governs color** — error uses `--toast-error`, success uses `--bio-glow`, info uses `--bio-debt`, warning uses `--urgent` — all OKLCH.
- **Auto-dismiss with action affordance** — 4s default lifetime, hover pauses the timer, action button ("Retry", "Undo", "View") extends to 12s.
- **Stacked top-right, glassmorphic, `prefers-reduced-motion`-aware** — slides in from the right (180 ms) and fades out; reduced-motion → instant fade.
- **Stack cap ≤ 4 toasts** — when exceeded, the oldest fades out to make room. Position fixed top-right, z-index above TopBar (z-index 110).
- **ARIA** — `role="status"` for info/success, `role="alert"` for error/warning; each toast `aria-live="polite"` or `"assertive"` accordingly.
- **No new dep** — no `sonner`, no `notistack`, no `react-hot-toast`. Hand-roll with `framer-motion` (already in deps) for the slide. Ponytail: ~140 lines of well-typed code.

**Scope of THIS pass:** `frontend/src/components/ui/Toast.tsx` (NEW), `frontend/src/hooks/useToast.ts` (NEW), `ocean.css` extension (`--toast-*` tokens), `ChromeShell.tsx` mount, plus replace 3 silent `console.error` paths. **Frontend only.**

## GitHub repos referenced

### Toast / snackbar UX
- [WE-1] `sonner` — reference for stack behavior + swipe-to-dismiss (we hand-roll to stay dep-free)
- [WE-2] `radix-ui/primitives` — Toast primitive semantics (`role="status"`, focus management, escape to dismiss)
- [WE-3] `vercel/react-hot-toast` — minimal API shape (`toast.success(msg, { duration: 4000 })`)
- [WE-4] `framer-motion` — already in `package.json`; use `AnimatePresence` for enter/exit

### Skills
- [WE-5] `@emil-design-eng` (this pass's domain skill)

---

## The 6 fixes (execute in order)

### 1 · `useToast` hook + `ToastProvider` (the only public surface)
**Bug:** No toast system in the codebase. Components `console.error` and move on.

**Do:**
- Create `frontend/src/hooks/useToast.ts`. Exposes:
  ```ts
  useToast(): {
    success(message: string, opts?: { action?: { label: string; onClick: () => void }; duration?: number }): string;
    error(message: string, opts?: { action?: { label: string; onClick: () => void }; duration?: number }): string;
    info(message: string, opts?: { action?: { label: string; onClick: () => void }; duration?: number }): string;
    warn(message: string, opts?: { action?: { label: string; onClick: () => void }; duration?: number }): string;
    promise<T>(p: Promise<T>, messages: { loading: string; success: string; error: string }): Promise<T>;
    dismiss(id: string): void;
  }
  ```
  Internally uses a Zustand-style `useSyncExternalStore` against a singleton emitter (Ponytail: do NOT pull in `zustand` — a 30-line `EventTarget`-ish singleton is enough).
- Create `frontend/src/components/ui/Toast.tsx`. Renders a fixed top-right stack with `AnimatePresence`. Each toast: tone pill + icon + message + optional action button + close ×. Stacked ≤ 4. Hover pauses the dismiss timer (`setTimeout` paused; cleared on mouse leave).
- `<ToastProvider>` is just `<Toast>` with the singleton listener. Mount it inside `<ChromeShell>` so it's accessible to every page.

### 2 · Replace silent `console.error` in `RecommendationCard.tsx`
**Bug:** When `recommendationsApi.vote(...)` rejects, only `console.error('Vote failed:', e)` runs. User sees no feedback.

**Do:**
- Inside the existing `handleVote` try/catch, call `toast.error('Could not record your vote', { action: { label: 'Retry', onClick: () => handleVote(vote) } })` on rejection, where `toast = useToast()`.
- On success, suppress the toast (the card visibly flips to "accepted"). Vote ack can be silent — the UI mutation IS the feedback.
- Replace the literal `console.error('Vote failed:', e)` with a single `// user already toast-informed — debug only` comment + keep `console.debug` for dev.

### 3 · Replace silent `console.error` in `StrategyBuilder.tsx`
**Bug:** Same shape — `handleSave`'s catch only logs.

**Do:**
- Wrap `handleSave` with `toast.promise(promise, { loading: 'Saving strategy…', success: (\`Saved "${name}"\`) || 'Saved', error: 'Save failed — your code is preserved in the editor' })`.
- Same treatment for `handleDelete`: `toast.promise(..., { loading: 'Deleting…', success: 'Deleted', error: 'Delete failed — try again' })`.
- Replace the literal `console.error("Save failed", e)` with the equivalent `// toast informs user` comment + `console.debug` for dev.

### 4 · Replace silent `console.error` in `registerSW.ts`
**Bug:** Service worker reg failures are invisible — users never know they're on a stale cache.

**Do:**
- Wrap the `onRegisterError(error)` callback in `registerSW.ts`: dispatch a `CustomEvent('sw:registration-failed', { detail: error })` on `window`.
- In `ChromeShell.tsx`, listen once for `sw:registration-failed` and call `toast.warn('Offline cache could not be registered — you may not see updates without refreshing')`.
- Also dispatch + handle `sw:update-available` → `toast.info('New version available', { action: { label: 'Refresh', onClick: applySWUpdate }, duration: 12000 })`. This wires up `applySWUpdate` from `registerSW.ts` (already there, not yet wired to UI).
- Replace the literal `console.error('[SW] Registration failed:', error)` with `console.debug` for dev-only.

### 5 · Wire TopBar sync-indicator into the toast surface
**Bug:** User clicks "Sync" → indicator pulses → 4 seconds later it goes idle. User has no idea what just synced.

**Do:**
- In `ChromeShell.tsx`'s `handleSync`, wrap the simulated pipeline in `toast.promise(new Promise(...), { loading: 'Syncing portfolio data…', success: 'Synced', error: 'Sync failed — we'll retry on next interaction' })`.
- Should feel like Sonner/Vercel — a small loader pill appears top-right during the sync, then snaps to a success toast on resolve.

### 6 · Apple-polish micro-interactions (stack cap, pause-on-hover, swipe-to-dismiss)
**Bug:** Even a well-built toast can become annoying — too many at once, won't dismiss on hover, can't swipe away.

**Do:**
- **Stack cap ≤ 4**: when a 5th would-be toast arrives, the oldest fades out (180ms) and is dropped. Persistent toasts (action button present, `duration >= 12000`) DO NOT count toward the cap — they live below the transient stack.
- **Hover pauses dismiss**: while mouse is over a toast, clear the dismiss `setTimeout`; on mouse leave, restart it. The `prefers-reduced-motion` user gets instant fade only (no slide).
- **Dismiss affordances**: (1) close × button (2) click anywhere on the toast (3) `Escape` closes the topmost (4) when a `success` toast is followed by another of the same `toast.success('Saved')` within 1.5 s, deduplicate into a count badge (`Saved · ×3`).
- **Keyboard focus**: after an action button is interacted, focus moves to it; on close, focus returns to the originating trigger element if focusable (use `useRef` of last triggering element from each `useToast()` call).
- **OfflineBanner / CheckInBanner are NOT toasts** — keep them at their existing mount points. Toasts are for transient async feedback only.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--toast-bg`, `--toast-error`, `--toast-info`, `--toast-warn`, `--toast-accent-shadow`. **NO hex.**
2. **Accessibility** — `role="status"` (info/success) with `aria-live="polite"`, `role="alert"` (error/warn) with `aria-live="assertive"`. Each toast keyboard-focusable; `Escape` closes the topmost; reduced-motion respected.
3. **No new backend routes.**
4. **No new heavy deps** — `framer-motion` already in `package.json`. **NO** `sonner`, `notistack`, `react-hot-toast`, `radix-ui/react-toast`, `zustand`.
5. **Performance** — at most 4 DOM nodes per toast + 1 for the stack wrapper. No re-renders outside the affected toast when one dismisses.
6. **Micro-interactions < 300ms** per Emil Kowalski. Enter 180ms ease-out (slide + fade), exit 150ms ease-in (fade only).
7. **Ponytail principle** — delete before adding. Drop redundant `console.error` calls. One `data-testid` per toast (`data-testid={`toast-${tone}`}`). No fabricated state layer (singleton emitter).
8. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent. Sequence only 1 → 2-5 (need hook first) → 6.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/Toast.tsx src/hooks/useToast.ts src/components/layout/ChromeShell.tsx src/components/RecommendationCard.tsx src/components/StrategyBuilder.tsx src/registerSW.ts src/components/layout/TopBar.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/15-ocean-dashboard.spec.ts` (or create `frontend/e2e/specs/31-toast.spec.ts`):
- Mount ChromeShell → useToast.success mount → toast visible top-right
- Hover over toast dismiss timer pauses
- 5 rapid calls → stack caps at 4
- Vote rejection → toast.error appears with Retry action that re-fires the call
- StrategyBuilder save → toast.promise transitions loading → success
- Service worker registration error → toast.warn appears

```bash
cd frontend && npx playwright test e2e/specs/31-toast.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/recommendations`:
   - Throttle network → vote a recommendation → toast.error top-right, hover pauses, action "Retry" works.
2. Open `/backtest` → save a strategy → toast.promise shows "Saving strategy…" → "Saved …" on resolve.
3. Block SW register in DevTools → refresh → toast.warn tells user offline cache couldn't register.
4. Click sync indicator in TopBar → loader pill (toast.promise loading state) → success toast.
5. DevTools → Rendering → "Emulate CSS media: `prefers-reduced-motion: reduce`" → re-check (no slide, instant fade; stack cap still works).
6. DevTools Console: zero errors. `console.error` is no longer called from the 3 fixed paths.
7. Lighthouse desktop ≥ 95 perf, 100 a11y.
8. Playwright e2e 31-toast passes.
9. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors, no new deps.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory), Phase 21 (Settings Pro), and Phase 22 (Cinematic Ocean) visual language. Re-read `frontend/src/styles/ocean.css` and reference `Icons.tsx` for any new glyphs (toast close ×, success ✓, error ⚠, info ⓘ).

<task>Now go.</task>
