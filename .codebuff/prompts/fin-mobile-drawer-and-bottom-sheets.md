# Phase 36 — Mobile Drawer + Bottom Sheets (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **mobile-first interactions** that the app currently fakes: sidebar drawer on swipe, Popover → bottom sheet conversion at `@media (max-width: 767px)`, and a swipe-back-to-close gesture on the TopBar sync popover. Today mobile users see the sidebar in fullscreen mode, but there's no swipe-to-open drawer gesture and popovers overflow the viewport on small screens. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@web-design-guidelines` `@vercel-react-best-practices`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Features/Mobile_and_offline_support.md` — what we already promised users on mobile
2. `frontend/src/components/layout/Sidebar.tsx` — currently `position: fixed` + `@media (max-width: 767px) { .sidebar.collapsed { transform: translateX(-100%); } }` (Phase 21 polish); we are extending with swipe gestures + an overlay scrim + focus-trap when open
3. `frontend/src/components/layout/TopBar.tsx` — TopBar already contains a `<Popover>` for sync + QuickSettings; we'll convert those to `<BottomSheet>` at the mobile breakpoint
4. `frontend/src/components/layout/Popover.tsx` — extend `align: 'bottom-sheet'` prop variant (no existing primitive; we'll add it inline or as a sibling component if ≤10-file budget allows)
5. `frontend/src/components/layout/ChromeShell.tsx` — wrapper that mounts Sidebar + TopBar (currently lives in `App.tsx`'s `AppBody`)
6. `frontend/src/App.tsx` — the `sidebarOpen` state we already manage; we add a new `sidebarDragEdge` state for swipe-from-left-edge gestures
7. `frontend/src/hooks/useSwipeGesture.ts` — NEW or hand-rolled (a 60-line pointer-events listener is enough; DO NOT add `react-swipeable` or similar dep)
8. `frontend/src/styles/ocean.css` — `--bottom-sheet-radius`, `--bottom-sheet-bg`, `--scrim-bg` tokens + reduced-motion overrides for the slide-in
9. `.codebuff/prompts/{fin-app-shell-keyboard-and-recovery,fin-keyboard-shortcuts-overlay,fin-toast-notification-surface}.md` — pattern: popovers with focus trap + Escape
10. `.codebuff/prompts/fin-mobile-drawer-and-bottom-sheets.md` (this file)

---

## User's report
> I opened Fin on my iPhone. The sidebar was fullscreen over the route (good). I tapped a sidebar item — the menu closed. But I couldn't reopen it: the TopBar hamburger in mobile is the same as desktop, and there's no swipe-from-edge gesture like every modern app has. QuickSettings in TopBar on mobile shows the menu as a tiny popover clipped to the right — the labels "Theme" / "Density" / "Motion" are unreadable. Sync pill's popover is also clipped. I want a real mobile pattern: horizontal swipe from the left edge opens the drawer (~280ms slide-in with a semi-transparent scrim), a tap on the scrim closes the drawer, and popovers render as bottom sheets on phones with a drag handle.

## What "good" looks like (per spec)

- **Swipe-from-left-edge opens the Sidebar drawer** — pointerdown on the leftmost 24px of the viewport; horizontal motion > 80px in < 250ms opens; horizontal motion < -80px (right to left) closes. The drawer slides in 280ms ease-out from `translateX(-100%)` to `0`, with a scrim that fades from 0% to ~50% opacity. Reduced-motion → instant.
- **Sidebar is focus-trapped + Escape closes + scrim-click closes when open on mobile**. (Already works on desktop via Popover's mousedown pattern; we extend.)
- **Sidebar swipe-closes from inside (swipe left while open with sufficient velocity)** — pointerdown anywhere on the open drawer, horizontal motion > -120px in <250ms closes.
- **`@media (max-width: 767px)` → Popover becomes a `<BottomSheet>`** — anchor is `bottom: 0` + `left: 0` + `right: 0`, height auto up to 75vh, drag handle at the top (a 36px-tall pill in `--text-muted`), drag down > 120px closes.
- **Bottom sheet preserves all existing Popover behavior** — focus trap, Escape, click-outside (now the scrim above), mousedown mousedown fallback. The trigger button stays focused on close (restored via `useFocusTrap`).
- **TopBar hamburger on mobile stays** — but motion gestures are the primary trigger on touch; hamburger remains visible for accessibility (users with motor impairments may not produce the gesture). Hamburger state must sync with drawer state via the same `sidebarOpen` boolean.
- **Touch targets ≥ 44px on mobile** — sidebar items already comply; bottom sheet drag handle is 44px tall, not just 36px (we'll widen it for mobile).
- **`pointerCancel` correctly closes** — if a swipe is interrupted by `<input>` focus or browser navigation, the drawer stays in its previous state (no half-open).
- **No new dep** — `pointerdown`/`pointermove`/`pointerup` listeners, framer-motion handles the slide with `useReducedMotion()` already in deps.

**Scope of THIS pass:** `frontend/src/hooks/useSwipeGesture.ts` (NEW), `frontend/src/components/layout/BottomSheet.tsx` (NEW), `frontend/src/components/layout/Sidebar.tsx` (mount scrim + swipe-state + sync hamburger), `frontend/src/components/layout/TopBar.tsx` (existing Popover on sync + QuickSettings gets `mobileVariant="bottom-sheet"` prop), `frontend/src/components/layout/Popover.tsx` (extend API: `mobileVariant?: 'popover' | 'bottom-sheet'` default), `frontend/src/App.tsx` (mount swipe gesture on outer content div for left-edge detection), `frontend/src/styles/ocean.css` (extend with bottom-sheet tokens + scrim + reduced-motion). **Frontend only.**

## GitHub repos referenced

### Mobile drawer + bottom sheet UX
- [WE-1] `vercel/geist` — mobile sub-component patterns with consistent radii
- [WE-2] `tailwindlabs/tailwindui` — bottom sheet component specs
- [WE-3] `figma/figma-mobile` — drag handle pill conventions
- [WE-4] `expo/expo` — `react-native-screens` swipe-back patterns (pointer-event cross-reference values)
- [WE-5] `react-native-gesture-handler` — `PanGestureHandler` thresholds (we mirror the same `_, 80px` constraint without the dep)

### Skills
- [WE-6] `@vercel-react-best-practices` (this pass's domain skill)

---

## The 6 fixes (execute in order)

### 1 · `useSwipeGesture` hook — pointer-events friendly, axis-aware
**Bug:** No swipe gesture support. Mobile drawer requires user to find the hamburger.

**Do:**
- Create `frontend/src/hooks/useSwipeGesture.ts`:
  ```ts
  interface SwipeGestureOptions {
    /** X axis swipe threshold in px (positive for right-opening, negative for left-close) */
    onSwipeHorizontal?: (deltaX: number, velocity: number) => void;
    /** Restrict pointerdown to a target selector (e.g. leftmost edge strip) */
    edgeSelector?: string;
    /** Time window to consider motion as a swipe, default 280ms */
    maxDuration?: number;
    /** Disable when reduced-motion is honored (auto-detected via matchMedia) */
    respectReducedMotion?: boolean;
  }
  export function useSwipeGesture(opts: SwipeGestureOptions): void {
    // useEffect with window pointerdown/pointermove/pointerup
    // measure distance + velocity, fire onSwipeHorizontal if exceeded
  }
  ```
- Inspector: ignore touch events when `pointerType === 'mouse'`; only fire on actual touch (pointerType === 'touch') OR pen. Velocity = `|deltaX| / (t_end - t_start)`.
- Respect `data-noswipe` attribute on elements — don't steal gesture from DOM subregions. (Useful for the editor and other interactive surfaces.)
- Tests: no React Testing Library pass; we ship at the integration / Playwright level only.

### 2 · `<BottomSheet>` primitive — popover for `@media (max-width: 767px)`
**Bug:** Existing `<Popover>` renders as a small absolute-positioned card on mobile, clipping content.

**Do:**
- Create `frontend/src/components/layout/BottomSheet.tsx`. Same props as `<Popover>` (`trigger`, `children | (close) => children`, `label?`, `testId?`). Renders:
  - Anchor: `position: fixed; bottom: 0; left: 0; right: 0; max-height: 75vh;`
  - Drag handle: a `<div className="bottom-sheet-handle" />` pill at the top, 36px×5px, centered, `color: var(--text-muted)`. 44px padding for hit area.
  - Slide animation: framer-motion `useReducedMotion` → 280ms ease-out `translateY(100%) → 0`. Reduced-motion → instant.
  - Focus trap reused (`useFocusTrap`): `active: open, onEscape: onClose, restoreFocus: true` — same as Popover.
  - Scrim: an `<div className="bottom-sheet-scrim">` sibling, fixed, bg `--scrim-bg`, opacity transition. Click closes.
  - Drag-down to close: `pointerdown` on handle area; vertical drag > 120px OR velocity > 0.5px/ms closes.
- `<BottomSheet>` is rendered ONLY at the mobile breakpoint (via inline `<style>` query + JS detection). On desktop, plain `<Popover>` is used.

### 3 · Extend `<Popover>` with `mobileVariant` prop + auto-bottom-sheet
**Bug:** TopBar QuickSettings is unreadable on phones.

**Do:**
- In `frontend/src/components/layout/Popover.tsx`, add `mobileVariant?: 'popover' | 'bottom-sheet' | 'auto'` (default `'auto'` = matches media query).
- When `'bottom-sheet'` or `'auto'` at the mobile breakpoint, the popover body is rendered via `<BottomSheet>` (imported here) with all the same props. Same accessibility contract — `aria-haspopup="menu"` on trigger, focus trap inside, etc.
- Existing call sites (TopBar sync, QuickSettings) work unchanged: pass `mobileVariant="auto"` and they'll detect.
- Preserve `align` for desktop mode — only mobile-style switches to bottom sheet.

### 4 · Wire swipe-from-left-edge on App.tsx outer container
**Bug:** Hamburger on mobile is the only path to Sidebar.

**Do:**
- In `frontend/src/App.tsx`'s `AppBody`, add a thin invisible `pointer-event` zone on the leftmost 24px of the viewport — a `<div className="edge-swipe-zone" />` absolutely positioned, fixed-top to fixed-bottom, very narrow (~24px). Only registered when viewport < 1024px (use a `matchMedia` state).
- Use `useSwipeGesture({ edgeSelector: '.edge-swipe-zone', onSwipeHorizontal: (deltaX) => deltaX > 80 && setSidebarOpen(true) })`.
- The zone itself has `touch-action: pan-y` so vertical scroll isn't blocked.
- Optional: also wire horizontal-swipe-closes-drawer inside the open drawer. Toggle: when `sidebarOpen === true` AND `viewport < 1024`, swipe-left on the drawer (`document.querySelector('.sidebar')`) closes it. Use the same hook with a negative threshold.
- Both gestures must `stopPropagation` to prevent bubble to app hotkeys.
- Reduced-motion: useSwipeGesture short-circuits and we fall back to hamburger tap.

### 5 · Sidebar scrim + focus trap when open on mobile
**Bug:** When mobile sidebar is open, there's no scrim and no click-to-close.

**Do:**
- Add `frontend/src/components/layout/SidebarScrim.tsx` (or inline in Sidebar.tsx if ≤10-file budget allows). Renders when `sidebarOpen === true` at `@media (max-width: 767px)`. Fixed bg `--scrim-bg` opacity 0.4 fades in 180ms. Click → `setSidebarOpen(false)`.
- Add focus trap on the sidebar when open AT MOBILE (skip on desktop so tab-navigation flows naturally). Reuse `useFocusTrap(sidebarRef, { active: sidebarOpen && isMobile, onEscape: () => setSidebarOpen(false), restoreFocus: true })`.
- Hamburger button's `aria-expanded` and `aria-label` ("Open sidebar"/"Close sidebar") already there in TopBar — verify.

### 6 · CSS tokens + reduced-motion + final polish
**Bug:** No tokens for bottom sheets or scrim.

**Do:**
- Add to `ocean.css`:
  ```css
  :root {
    --bottom-sheet-bg: oklch(20% 0.02 210 / 0.96);
    --bottom-sheet-radius: 18px;
    --bottom-sheet-handle: oklch(55% 0.04 200 / 0.7);
    --scrim-bg: oklch(8% 0.015 210 / 0.55);
  }
  .bottom-sheet { animation: bottomsheet-rise 280ms cubic-bezier(0.22, 1, 0.36, 1); }
  .bottom-sheet-handle { /* 36x5 pill, 44px tall hit area */ }
  .bottom-sheet-scrim { /* fixed overlay, opacity 0 → 0.4 */ }
  .edge-swipe-zone { touch-action: pan-y; }
  @keyframes bottomsheet-rise { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) {
    .bottom-sheet, .bottom-sheet-scrim, .sidebar { animation: none !important; transition: none !important; }
    .edge-swipe-zone { display: none; } /* fallback to hamburger */
  }
  ```
- Extend `.sidebar.collapsed` mobile rule with `transform-origin: left center` so the slide-in feels natural.
- The scrim element must be keyboard-focusable (`tabIndex={-1}`) so the focus trap can pass through, and `aria-hidden="true"` so SRs don't announce it.
- Verify on Chrome DevTools Mobile (Pixel 5) and iPhone 14 viewports at 360–414px wide.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--bottom-sheet-bg`/`--bottom-sheet-radius`/`--bottom-sheet-handle`/`--scrim-bg`. **NO hex.** Reuse existing `--copalette-*` tokens.
2. **Accessibility** — drag handle has descriptive `aria-label="Drag down to dismiss"`; scrim is `aria-hidden`. Bottom sheet has `role="dialog"` + `aria-modal="true"`. Sidebar drawer has `aria-hidden` toggling when open/closed. Hamburger remains the primary keyboard-accessible path; swipe is a bonus.
3. **No new backend routes.**
4. **No new heavy deps.** `framer-motion` already in tree for the slide. **NO** `react-swipeable`, `react-gesture-responder`, `react-spring`. Hand-roll `useSwipeGesture` in ~60 LOC.
5. **Performance** — pointer listeners attach once globally; no per-page re-renders; the scrim is one element. Mobile breakpoint detected via `matchMedia` (no JS resize listener).
6. **Micro-interactions < 300ms** per Emil Kowalski. Drawer slide 240ms ease-out, scrim fade 180ms, bottom sheet rise 260ms, drag-to-close threshold at 120px.
7. **Ponytail principle** — drop any inline `style={\`transform: ...\`}` left over from earlier phases; consolidate into `.sidebar.collapsed` mobile rule. **One** `data-testid` per top-level container (`sidebar-root`, `bottom-sheet-{testid}`, `edge-swipe-zone`).
8. **`@subagent-driven-development` mandatory** — sequence 1 → 2 → 3 → 4-5 → 6 (CSS last since both 4 & 5 may need final polish). Ship ≤10 files.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/hooks/useSwipeGesture.ts src/components/layout/BottomSheet.tsx src/components/layout/Popover.tsx src/components/layout/Sidebar.tsx src/components/layout/TopBar.tsx src/App.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/36-mobile-drawer.spec.ts`:

- Mobile viewport (Pixel 5): swipe from left edge → drawer opens; scrim visible; `Esc` closes
- Tap scrim → drawer closes
- Tap a sidebar item → route changes; drawer closes
- Hamburger still works (assistive tech)
- QuickSettings popover on mobile renders as bottom sheet with drag handle
- Drag handle down > 120px → sheet closes
- Reduced-motion: edge swipe zone is hidden; hamburger is the only path

```bash
cd frontend && npx playwright test e2e/specs/36-mobile-drawer.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` with Chrome DevTools mobile emulator (iPhone 14 + Pixel 5):
   - Swipe from left 24px → drawer opens
   - Hamburger still functional (a11y users)
   - TopBar QuickSettings → bottom sheet drag handle visible; drag-down closes
2. Drag handle has ≥44px tap target.
3. Reduced-motion: swipe disabled; hamburger works; bottom sheet opens instantly.
4. DevTools Console: zero `handleEvent`/deprecated warnings.
5. Lighthouse mobile ≥ 90 perf, 100 a11y.
6. Playwright e2e 36-mobile-drawer passes.
7. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** drawer + bottom sheet feel like the same glassmorphic surface — popover caught mid-fade feels like a sheet sliding up. Re-read the existing `--copalette-*`, `--toast-*`, `--popover-*` (or `--freshness-*`) tokens.

<task>Now go.</task>
