# Phase 35 — KeyboardShortcuts Overlay (`?`) (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the **`?` keyboard-shortcut help pane** that we referenced in Phase 34's TopBar QuickSettings menu but never built. Today the menu item says `?` but does nothing. Power users discover shortcuts only by accident — we need a polished, glassmorphic, focus-trapped overlay that documents every hotkey the app ships with, and that can be opened from anywhere via `?` (and closeable via `Esc`/`?`). **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines`

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Features_Specification.md` — keyboard shortcut taxonomy already promised to users in the QuickSettings popover
2. `frontend/src/styles/ocean.css` — `--copalette-bg`, `--copalette-section`, `--copalette-result-hover`, `--copalette-empty` and the reduced-motion block your overlay must honor
3. `frontend/src/hooks/useGlobalHotkeys.ts` — exact API to register the new `?` combo (Phase 34 set this up; reuse, don't fork)
4. `frontend/src/components/ui/CommandPalette.tsx` — the `<div className="copalette-overlay">` shell you will mirror visually (smaller/pinned layout, no search bar)
5. `frontend/src/hooks/useFocusTrap.ts` — your overlay needs the same focus cycle + Escape forwarding + restore-on-close contract
6. `frontend/src/App.tsx` — the right place to mount the overlay once + drive its `open` state via the new `?` combo
7. `frontend/src/components/layout/TopBar.tsx` — the existing QuickSettings popover item references `?` and must now actually open your overlay (currently a no-op `close()` call)
8. `.codebuff/prompts/{fin-app-shell-keyboard-and-recovery,fin-toast-notification-surface,fin-form-components-and-validation}.md` — visual language + verification patterns you mirror
9. `.codebuff/prompts/fin-keyboard-shortcuts-overlay.md` (this file) — re-read before commits

---

## User's report
> I opened the gear menu on the TopBar, hovered over "Keyboard shortcuts", and clicked. Nothing happened. As a power user I want to discover `⌘K`, the `g d` letter combos, `?` itself, and the upcoming page-specific shortcuts without opening a doc site. I want `?` to show a glassmorphic pane that lists every shortcut, grouped by navigation / global / page-scoped. The pane should be searchable, closeable, and — like the CommandPalette — feel shippable and tactile. Today there's no path to discover the app.

## What "good" looks like (per spec)

- **`?` opens an overlay from anywhere** — `useGlobalHotkeys` registers `?` (shift+/) with `allowInInputs: false` so it doesn't fire when typing in text fields, and `Esc` / a second `?` / clicking the overlay backdrop closes it. Initial focus lands on the search input so keyboard users can search immediately. `Tab`/`Shift+Tab` cycle within the overlay (re-use `useFocusTrap`). Focus restores to the trigger button on close.
- **Two-column glassmorphic layout** — left rail: short section labels (Navigation · Global · Memory · Execution · Backtest · Settings). Right column: shortcut rows. Each row: a `<kbd>` pill with the key glyph (mono font, OKLCH `--ocean-shallows` background, gentle inner shadow) + a 1-line description. Rows are 36px tall, focusable, clickable to "press" the shortcut (closes the overlay and runs the action).
- **Searchable** — typing filters the rows. Each shortcut row has searchable text in `label`, `hint`, and `keywords[]`. Use `fuse.js` (already in deps) with `threshold: 0.3`, `keys: ['label','hint','keywords']`, `ignoreLocation: true`. Empty state when no matches.
- **Sections** — START_NOW:
  - **Navigation** — `g d` Dashboard, `g i` Portfolio, `g o` Debt, `g r` Retirement, `g m` Memory, `g u` Multi-Agent, `g a` Recommendations, `g e` Execution, `g c` Community, `g b` Backtest, `g n` Questions, `g x` Research, `g s` Settings
  - **Global** — `⌘K` / `Ctrl+K` open CommandPalette, `?` open this overlay, `Esc` close topmost, `/` focus CommandPalette search (deferred Phase 36+)
  - **Memory** — `⌘K` open Memory palette (overrides global on `/memory`), `[[` open wikilink autocomplete (auto-fires from CodeMirror 6), `j`/`k` move focus down/up in tree
  - **Execution** — `e` mark executed, `s` skip, `b` open broker steps
  - **Backtest** — `r` re-run last config, `o` open active run's trades CSV
  - **Settings** — `t` jump to Theme row (focus SegmentedControl), `m` jump to Motion toggle
  - **Help** — `?` this panel (shown for discoverability)
- **Click-to-invoke** — clicking a shortcut row runs its action. Navigating via a `g d` row navigates AND closes the overlay (the user is "asking" to do the thing). For page-specific shortcuts (Memory's `⌘K`, Execution's `e`), the row says "open on current page" and dispatches the action through the same `useGlobalHotkeys` registry.
- **Single declaration of truth** — the LIST of shortcuts lives in one TypeScript file (`frontend/src/utils/shortcutCatalog.ts`), exported as `SHORTCUT_CATALOG: ShortcutEntry[]`. The overlay reads it. A flat `ACTION_MAP` lives inside `App.tsx`'s AppBody mapping `id → handler`. There must be ONE source of truth — drifting catalogs are tech debt.
- **`prefers-reduced-motion` respected** — open animation: 180ms ease-out fade; reduced-motion → instant.
- **No new dep**: `fuse.js` is already a dep; `framer-motion` is already a dep (used by Toast viewport for the same fade pattern).

**Scope of THIS pass (≤10 files — counted & verified):**

> **File-budget arithmetic:** `2 NEW + 4 EDIT = 6 source files` + `1 NEW spec file` = **7 total**. Within ≤10 budget.

- `frontend/src/components/ui/KeyboardShortcutsOverlay.tsx` (NEW)
- `frontend/src/utils/shortcutCatalog.ts` (NEW)
- `frontend/src/hooks/useGlobalHotkeys.ts` (extend registry — no new file)
- `frontend/src/App.tsx` (mount overlay + register `?` + inline `ACTION_MAP` at bottom of `AppBody`)
- `frontend/src/components/layout/TopBar.tsx` (QuickSettings "Keyboard shortcuts" item opens overlay via prop callback)
- `frontend/src/styles/ocean.css` (extend with `--kbd-*` tokens + `.kbd` styling + reduced-motion overrides)
- `frontend/e2e/specs/35-shortcuts.spec.ts` (NEW — covered by Code checkers / E2E block)

> **YAGNI applied:** `useShortcutActions.ts` (a `useSyncExternalStore`-backed dispatcher) considered and DROPPED — actions are bounded to ~25 entries and live as a flat inline `ACTION_MAP` in `App.tsx`. No second consumer justifies the indirection. **Ponytail wins.**

> **Phase 34 exclusion (HARD GUARD — NON-NEGOTIABLE):** Phase 35 must NOT register `cmd+k` / `ctrl+k` / `⌘K` / `Ctrl+K` handlers anywhere. Phase 34 owns the global CommandPalette combo, and `App.tsx`'s `useLocation()`-scoped suppression on `/memory` owns the Memory-style palette override. Anything phase 35 writes that touches `cmd+k` / `mod+k` is a regression. The only combo Phase 35 adds is `?` (shift+/) + `cmd+/`/`ctrl+/` synonyms — all `allowInInputs: false`.

## GitHub repos referenced

### Keyboard shortcut overlay UX
- [WE-1] `linear/linear-app` — `?` opens searchable shortcuts panel; clickable rows
- [WE-2] `raycast/raycast` — `⌘` slash key for command bar + `?` help; Tap to invoke
- [WE-3] `github/primer` — accessible `<kbd>` rendering conventions
- [WE-4] `vercel/geist` — minimal `<kbd>` styling as OKLCH-tokened chips

### Skills
- [WE-5] `@emil-design-eng` (this pass's domain skill)

---

## The 5 fixes (execute in order — was 6, one inline below)

### 1 · `shortcutCatalog.ts` — the single source of truth
**Bug:** Shortcuts are scattered between `useGlobalHotkeys` registry, `QuickSettings` menu labels, and individual components' `onKeyDown` handlers. There's no place to read the canonical list from.

**Do:**
- Create `frontend/src/utils/shortcutCatalog.ts`:
  ```ts
  export interface ShortcutEntry {
    id: string;                         // unique, stable, used as registry key (g-d, global-palette, etc.)
    combo: string;                      // human-readable, "g d" / "⌘K" / "?"
    label: string;                      // 1-line label
    section: 'Navigation' | 'Global' | 'Memory' | 'Execution' | 'Backtest' | 'Settings' | 'Help';
    hint?: string;
    keywords?: string[];
    allowInInputs?: boolean;            // default false — duplicates useGlobalHotkeys option
  }
  export const SHORTCUT_CATALOG: ShortcutEntry[] = [
    // Navigation
    { id: 'g-d', combo: 'g d', section: 'Navigation', label: 'Dashboard', hint: '/', keywords: ['home','overview'] },
    // ...etc (12 nav + 4 global + ~5 memory + 3 exec + 2 backtest + 2 settings + 1 help)
  ];
  export function getShortcutById(id: string): ShortcutEntry | undefined;
  ```
- Catalog has NO `run` lambda — the `ACTION_MAP` in App.tsx (fix 4) maps `id → handler` at runtime; the catalog imports nothing from App.tsx and App.tsx imports the catalog.

### 2 · `KeyboardShortcutsOverlay.tsx` — searchable, clickable, focus-trapped
**Bug:** No overlay exists. `?` does nothing.

**Do:**
- Create `frontend/src/components/ui/KeyboardShortcutsOverlay.tsx`. Mirrors the visual structure of `CommandPalette.tsx` but smaller — 560px wide, two-column with section rail on left, rows on right.
- Top: search input with `<input className="copalette-input">` + `<button className="copalette-close">` (`aria-label="Close shortcuts"`) on the right. Below: scrollable region of group-by-section rows.
- Group rows via a `Map<Section, ShortcutEntry[]>` derived from a flat list. Section header row in `--copalette-section` color (already a token).
- Each row is a `<button>` with role="button", fully focusable; rendered with `<kbd>` chips on the left. On click → `props.dispatch(entry.id)` (the inline `ACTION_MAP` from fix 4) and `props.onClose()`.
- Empty state: `<div className="copalette-empty">No shortcuts match "{query}"</div>`.
- Footer: muted kbd hint line: `<kbd>?</kbd> open at any time · <kbd>esc</kbd> close`.
- Use `useFocusTrap(overlayRef, { active: open, initialFocus: searchInputRef.current, onEscape: onClose, restoreFocus: true })`. Don't `stopPropagation` on Escape (MemoryExplorer subscribes to it too).
- Add `data-testid`s: `kbd-overlay-root`, `kbd-search-input`, `kbd-row-{id}`.

### 3 · Wire `?` via `useGlobalHotkeys`
**Bug:** `?` is not registered.

**Do:**
- In `frontend/src/App.tsx`'s `AppBody`, register a new combo: `{ combo: '?', allowInInputs: false, handler: () => setShortcutsOpen(o => !o) }`. Provide a `setShortcutsOpen` method that TopBar QuickSettings calls directly through props (avoids router state coupling).
- Add `cmd+/` and `ctrl+/` as synonyms (mac/linux conventions) — both `allowInInputs: false`.
- `Esc` already closes the palette; ensure it ALSO closes the shortcuts overlay if it's open (the overlay's `useFocusTrap` handles its own Escape, so no global change needed).
- On open: focus search input via `useFocusTrap` initial-focus (verified by reviewer pass).
- **Hard exclusion:** DO NOT register `cmd+k`, `ctrl+k`, `mod+k`, `⌘K` here — Phase 34 already owns those in App.tsx's existing `useGlobalHotkeys` invocation. Search the App.tsx diff for those strings; if any sneak in, the commit is wrong.

### 4 · Make the TopBar "Keyboard shortcuts" menu item actually open the overlay + inline `ACTION_MAP` in App.tsx
**Bug:** The menu item currently calls a no-op (`close()` only). The catalog has no place to declare a runtime handler — but we decided against `useShortcutActions.ts` (YAGNI), so actions live inline in App.tsx.

**Do:**
- In `frontend/src/components/layout/TopBar.tsx`'s `QuickSettings`, replace the no-op click with a prop callback. QuickSettings accepts a new `onOpenShortcuts: () => void` prop. `App.tsx`'s `AppBody` passes `() => setShortcutsOpen(true)`. Cleaner separation; one prop, one consumer.
- Add a test-id `qs-shortcuts` (already there — verify) and `aria-label="Open keyboard shortcuts"`.
- In `frontend/src/App.tsx`'s `AppBody`, after the existing state declarations + effects, declare an inline `ACTION_MAP: Record<string, () => void>`. Mount once in a `useEffect(() => { /* registerAction for each id */ }, [navigate, deps])`. Roughly:
  ```ts
  const ACTION_MAP = {
    'g-d':            () => navigate('/'),
    'g-i':            () => navigate('/portfolio'),
    // ...one entry per shortcut id
    'global-palette': () => setPaletteOpen((o) => !o),
    'memory-palette': () => setMemoryPaletteOpen((o) => !o),
    'qs-shortcuts':   () => setShortcutsOpen(true),
    'sw-refresh':     () => applySWUpdate(),
  };
  const dispatch = (id: string) => { ACTION_MAP[id]?.(); };
  ```
- Pass `dispatch={dispatch}` to `<KeyboardShortcutsOverlay>` and `setShortcutsOpen={setShortcutsOpen}` as well.
- Keep `ACTION_MAP` flat and inline — don't grow it into a hook. If we ever need 50 entries, that's Phase 36+ / `(useShortcutActions)`/revisit.

### 5 · Visual polish (`.kbd`, CSS tokens, reduced-motion) + mount
**Bug:** No `<kbd>` styling exists in the codebase. Reduced-motion handling for the overlay open/close.

**Do:**
- Add to `ocean.css`:
  ```css
  :root {
    --kbd-bg: oklch(20% 0.02 210 / 0.65);
    --kbd-border: oklch(35% 0.04 195 / 0.45);
    --kbd-fg: oklch(85% 0.06 180);
    --kbd-radius: 5px;
  }
  .kbd {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; min-width: 22px;
    background: var(--kbd-bg); border: 1px solid var(--kbd-border);
    border-radius: var(--kbd-radius);
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 11px; line-height: 1.4;
    color: var(--kbd-fg);
    box-shadow: 0 1px 0 oklch(0% 0 0 / 0.4) inset;
  }
  .kbd-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .kbd-row-label { color: var(--text-secondary); font-size: var(--text-sm); }
  ```
- Extend reduced-motion block to also cover the overlay open animation.
- The overlay mount point: in `App.tsx`'s `AppBody`, render `<KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} dispatch={dispatch} />` after `<CommandPalette />`. Pass `paletteItems` and `shortcutsOpen` to AppBody via local state.
- Add `data-testid` to the TopBar QuickSettings "Keyboard shortcuts" button → already `qs-shortcuts` (verify).

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only — VISIBLE RULE:** extend `ocean.css` with `--kbd-bg`/`--kbd-border`/`--kbd-fg`/`--kbd-radius`. **NO hex anywhere. NO `rgb()`. NO `hsl()`.** Reuse existing `--copalette-*` tokens where possible. (If a reviewer spots hex in the diff, it's wrong.)
2. **Phase 34 exclusion (HARD GUARD):** Phase 35 must NOT touch `cmd+k` / `ctrl+k` / `mod+k` dispatches. Search the diff before commit; if any of those strings appear in new code, revert.
3. **Accessibility** — overlay has `role="dialog"` + `aria-modal="true"`; kbd chips have descriptive `aria-label` (e.g. `aria-label="Press Command and K simultaneously"`). Section headers `aria-hidden` (visual labels only). Clickable rows are buttons with full text in their accessible name. Reduced-motion honored (open fade 180ms; reduced-motion → instant).
4. **No new backend routes.**
5. **No new heavy deps** — `fuse.js` and `framer-motion` already in `package.json`. Reuse them.
6. **Performance** — overlay renders lazily on `open` only; no per-keystroke re-renders outside the search input's bound subset; the catalog has at most ~30 entries so no virtualization.
7. **Micro-interactions < 300ms** per Emil Kowalski. Open fade 180ms, row hover 120ms. `Esc` close is instant. Kbd chip tap is instant.
8. **Ponytail principle** — delete before adding. Drop duplicated shortcut strings between TopBar menu label and `useGlobalHotkeys` registry. **One** declaration in `shortcutCatalog.ts`. **One** kbd CSS class (`.kbd`). **No** `useShortcutActions.ts` (we proved it YAGNI).
9. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent. Sequence 1 → 2 → 3 → 4 → 5. Ship ≤7 total (≤6 source + ≤1 spec).

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui/KeyboardShortcutsOverlay.tsx src/utils/shortcutCatalog.ts src/hooks/useGlobalHotkeys.ts src/App.tsx src/components/layout/TopBar.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/35-shortcuts.spec.ts`:

- Press `?` from `/portfolio` → overlay opens; first focusable is the search input
- Type "mem" → only Memory-related rows visible; `Esc` clears + restores focus to opener
- Click `g d` row → navigates to `/` AND closes overlay; focus on main h1
- From `/memory`, Press `?` twice → opens → closes (toggle)
- From inside a textarea input, press `?` → typing `?` (combo suppressed)
- `Tab` from search input cycles through rows; `Shift+Tab` reverses; never escapes
- DevTools reduced-motion: overlay opens instantly
- **Hard guard:** Pressing `cmd+k` opens the existing CommandPalette, NOT the shortcuts overlay. Pressing `?` opens the overlay.

```bash
cd frontend && npx playwright test e2e/specs/35-shortcuts.spec.ts --reporter=line
```

---

## Verification before declaring done (concrete, not vague)

1. `npm run dev` and from any route press `?` → overlay opens with all sections visible. **Assert: data-testid `kbd-overlay-root` is in DOM, focus is on `kbd-search-input`, 12 navigation rows + 4 memory rows etc. visible.**
2. Search "nav" → only Navigation rows visible. **Assert: count of visible rows == length of SHORTCUT_CATALOG filtered by section=='Navigation'.**
3. Click a `g r` row → navigates to `/retirement`; overlay closes. **Assert: `window.location.pathname === '/retirement'` AND `data-testid kbd-overlay-root` no longer in DOM.**
4. From topbar QuickSettings gear → click "Keyboard shortcuts" → overlay opens. **Assert: `qs-shortcuts` button has `aria-label="Open keyboard shortcuts"`, click triggers `setShortcutsOpen(true)`.**
5. DevTools Console: zero errors. `console.error` not called from any new code path. **Assert: page.on('console', e => e.type() === 'error') never fires during e2e.**
6. Lighthouse a11y ≥ 100 on overlay route. **Assert: `axe-core` run with `runAxeCheck(page)` returns 0 violations on `/?shortcuts=open` or similar.**
7. Playwright e2e 35-shortcuts passes (all 7 assertions above).
8. Self-review with `@code-review-and-quality`: tight diff ≤ 7 files (counted: 2 NEW + 4 EDIT + 1 spec = 7; no extras). Search the diff for `cmd+k`/`ctrl+k`/`mod+k`/`⌘K` strings; if any appear in NEW lines (not existing), revert.

---

## Deliverable format

Reply with: bullet list of files changed (must be ≤6 source files + ≤1 spec = ≤7), anything skipped (with reason — e.g. dropped `useShortcutActions.ts` due to YAGNI), and any new tech debt. **Strict ≤10 files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** overlay mirrors `CommandPalette`'s glassmorphic surface but smaller + 2-column. Kbd chips match the Settings page's `<kbd>⌘K</kbd>` rendering. Reduced-motion block extended. Re-read `frontend/src/styles/ocean.css` for tokens.

<task>Now go.</task>
