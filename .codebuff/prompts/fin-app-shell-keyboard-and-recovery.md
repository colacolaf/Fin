# Phase 34 — App Shell, Global Cmd+K, & TopBar Recovery (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to make the app shell feel responsive and complete: a global command palette (`⌘K`) that opens from anywhere, breadcrumbs that tell the user where they are, a TopBar freshness pip that surfaces sync freshness at a glance, and a few final touches that move the product from "feature complete" to "Claude-grade". **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified — enforced.**

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@web-design-guidelines` `@vercel-react-best-practices`

**Hard gates:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead of integrating."
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features_Specification.md` — global app behavior + the routes you must serve from the palette
2. `frontend/src/styles/ocean.css` — OKLCH tokens; palette blur/border tokens to mirror
3. `frontend/src/App.tsx` — route definitions + outlet structure
4. `frontend/src/components/layout/ChromeShell.tsx`, `TopBar.tsx`, `Sidebar.tsx`, `Icons.tsx` — current shell
5. `frontend/src/components/memory/MemoryCommandPalette.tsx` — existing local `⌘K` for memory (re-use skills; abstract to app-wide)
6. `frontend/src/hooks/useAgentState.ts`, `useOceanScene.ts`, `useOnlineStatus.ts` — state to surface in the palette
7. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-cinematic-ocean-dashboard,fin-toast-notification-surface}.md` — visual language
8. `.codebuff/prompts/fin-app-shell-keyboard-and-recovery.md` (this file)

---

## User's report
> Memory has a great `⌘K` palette; everywhere else the app has nothing. Confusing — power users expect `⌘K` from anywhere. Also: there's no breadcrumb anywhere, so on `/portfolio/holdings/:ticker` (when that lands), users get lost. TopBar's "last sync" tooltip is hidden behind hover; I want a freshness pip I can see at a glance. Finally, we said local-only mode removed auth — but `⌘K` redirects me nowhere, and there's no `/settings` direct invocation from the bar.

## What "good" looks like (per spec)

- **Global `⌘K` (Ctrl+K on Win/Linux)** — opens app-wide command palette from any page. Search across (1) routes — `Dashboard`, `Portfolio`, `Memory`, `Settings` etc., (2) page-scoped actions — `Mark all read`, `Sync now`, `Open today's daily note`, (3) agent actions — `Run Investment`, `Run Debt`, `Run Retirement`, (4) settings shortcuts — `Toggle theme`, `Open Connections`, `Export crash logs`.
- **Breadcrumbs** under TopBar — path from root → page → sub-section. Compressed on mobile (just the leaf). Click any segment to navigate.
- **Freshness pip on TopBar** — a small dot/ring next to the sync label, color-coded by recency: green `oklch(72% 0.16 170)` if < 5 min, amber `oklch(78% 0.14 75)` if 5–30 min, red `oklch(65% 0.18 25)` if > 30 min. Hover shows exact time. Reduced-motion neuters the pulse.
- **Quick-settings dropdown** trigger on TopBar right — gear icon → menu with: Theme (light/dark/system), Density (compact/comfortable), Motion (auto/reduced). Click-outside closes. Esc closes.
- **`?` shortcut opens keyboard shortcuts help** — glassmorphic pane lists every shortcut.
- **No new dep** — hand-roll palette tooltip + breadcrumbs.

**Scope of THIS pass:** `frontend/src/components/ui/CommandPalette.tsx` (NEW), `frontend/src/components/layout/Breadcrumbs.tsx` (NEW), `frontend/src/hooks/useGlobalHotkeys.ts` (NEW), `frontend/src/components/layout/TopBar.tsx` (rewrite), `frontend/src/components/layout/ChromeShell.tsx` (mount palette + breadcrumbs), `frontend/src/pages/KeyboardShortcuts.tsx` (NEW), `ocean.css` extensions. **Frontend only.**

## GitHub repos referenced

### Command palette UX
- [WE-1] `linear/linear-app` — `⌘K` palette with grouped sections (Navigation · Actions · Settings)
- [WE-2] `raycast/raycast` — keyboard-first navigation; esc dismisses, ⏎ confirms
- [WE-3] `vercel/next.js` — global search experience reference
- [WE-4] `fuse.js` — already in deps for Memory palette; reuse for fuzzy search

### Breadcrumbs UX
- [WE-5] `github/primer` — accessible breadcrumb component (`aria-label="breadcrumb"`, `aria-current="page"` on current)
- [WE-6] `atlassian/design-system` — breadcrumb with hover preview of sub-sections

### TopBar refresh pip
- [WE-7] `trello/web` — freshness indicators on boards (similar green/amber/red traffic-light)
- [WE-8] `slack/web` — last-active indicator on channel list

### Skills
- [WE-9] `@web-design-guidelines` (this pass's domain skill)

---

## The 6 fixes (execute in order)

### 1 · Global Command Palette (`⌘K` / `Ctrl+K`) with grouped sections
**Bug:** Only Memory page has a palette. Power users hit `⌘K` everywhere else and nothing happens.

**Do:**
- Create `frontend/src/components/ui/CommandPalette.tsx`. Glassmorphic centered modal that **supersedes Phase 20's local `MemoryPalette`** — keep `frontend/src/components/memory/MemoryCommandPalette.tsx` around as a barrel of `Memory`-scoped commands the global palette imports, then delete the duplicated wrapper. Both share the same `fuse.js` search runtime (`PALETTE_INDEX ⊃ MEMORY_PALETTE_INDEX`) so Memory's [[wikilink]] results appear inside `⌘K` when on `/memory` and hide elsewhere. Reuse the existing `.memory-palette` CSS classes (don't duplicate `copalette-*`).
- Three section groups in results:
  - **NAVIGATE** — all 13 routes from Sidebar Phase 21 (`Dashboard`, `Portfolio`, `Debt`, `Retirement`, `Multi-Agent`, `Recommendations`, `Execution`, `Memory`, `Community`, `Analytics`, `Backtest`, `Questions`, `Research`, `Settings`)
  - **ACTIONS** — `Sync now`, `Run Investment agent`, `Run Debt agent`, `Run Retirement agent`, `Open today's daily note (memory)`, `Mark all recommendations read`
  - **SETTINGS** — `Go to Connections`, `Toggle theme (dark/light/system)`, `Open System Prompts`, `Export crash logs (Phase 32)`
- Index source: a static `PALETTE_INDEX = [{ group, items: [{ id, label, hint?, action, keywords? }] }]`. Each item's `action` is a callback: `navigate(to)`, `triggerSync()`, `agentOrchestrator.run('investment')`, etc.
- Use `fuse.js` (already in deps) on the flat index, threshold 0.4, include `keywords`. Group results by section, sorted by query relevance within section. Show section headers.
- Search input autofocuses; `Esc` closes; `↑/↓` moves; `Enter` activates. No virtualization needed for ~30 items.
- Hotkey: `Cmd+K` on Mac, `Ctrl+K` on Win/Linux. Listen at `window` level in the `useGlobalHotkeys` hook (Fix 3).
- ARIA: `role="dialog"` + `aria-modal="true"`; input has `aria-label="Search Fin"`. Trap focus within palette when open.

### 2 · Breadcrumbs under TopBar (`Dashboard › Portfolio › Holdings › NVDA`)
**Bug:** No breadcrumbs anywhere. Multi-level pages feel disorienting.

**Do:**
- Create `frontend/src/components/layout/Breadcrumbs.tsx`. Renders below the TopBar inside the `dashboard-main` content area.
- Source: `useLocation()` + a small static `BREADCRUMB_SEGMENTS` map: `{ '/': 'Dashboard', '/portfolio': 'Portfolio', '/portfolio/holdings': 'Holdings', '/debt': 'Debt', '/retirement': 'Retirement', '/orchestrate': 'Multi-Agent', '/recommendations': 'Recommendations', '/execution': 'Execution', '/memory': 'Memory', '/community': 'Community', '/analytics': 'Analytics', '/backtest': 'Backtest', '/questions': 'Questions', '/research': 'Research', '/settings': 'Settings' }`.
- Custom hook `useBreadcrumbs()` derives segments by matching `pathname` against the route prefixes. Renders `<nav aria-label="Breadcrumb" className="breadcrumbs"><ol>` with `<li><Link>{label}</Link><span aria-hidden>›</span></li>...`. The current (last) segment is `<span aria-current="page">` (no Link).
- Mobile (< 767px): show only the current segment ("Portfolio" only, not the full chain). On Tab navigation the arrow separator text is hidden via `aria-hidden`.
- Styling: `oklch(0.22 0.02 210 / 0.45)` background, OKLCH blur, Inter font-sm. Current segment `text-primary`; segments `text-muted` with `:hover` → `text-secondary`.

### 3 · Global hotkeys (`Cmd+K`, `?`, `g d`, `esc`, etc.) via `useGlobalHotkeys`
**Bug:** No app-wide hotkey layer. Future shortcuts (g+i/d/r for agents, `/` for search) require a foundation.

**Do:**
- Create `frontend/src/hooks/useGlobalHotkeys.ts`. Subscribes to `window.addEventListener('keydown', ...)`. Maintains a `{ combo: string; handler: (e) => void; preventDefault?: boolean }[]` registry. `combo` parses strings like `cmd+k`, `ctrl+k`, `?`, `g`, `g d`, `esc`, `/`.
- Mount it inside `<ChromeShell>` with a static registry:
  - `cmd+k` / `ctrl+k` → toggle CommandPalette
  - `?` (shift+/) → open KeyboardShortcuts pane
  - `g` then `d/i/m/r/s/e/c/b/n` within 1.5s → navigate to Dashboard / Portfolio / Memory / Retirement / Settings / Execution / Community / Backtest / Questions/Research
  - `esc` → close CommandPalette OR KeyboardShortcuts OR any open modal (one of: topmost)
- `preventDefault` unless focus is in a text input (we DO want `?` in a textarea to type "?", but not for `g d`). Detect via `document.activeElement?.tagName === 'INPUT' || 'TEXTAREA'` with exceptions for `Escape`.
- Trigger on `keydown`, fire handler once. Do not consume the event if the combo didn't match.

### 4 · TopBar refresh pip + quick-settings menu
**Bug:** TopBar's "Last sync" info is hidden in the `title` tooltip on hover. The gear-icon menu doesn't exist.

**Do:**
- In `frontend/src/components/layout/TopBar.tsx`:
  - Replace the single `<button className="sync-indicator">` with a richer surface. Visual: pill with a 6px dot + label + tiny chevron. Dot color: green/amber/red based on `lastSync` age (read `useAgentState()`).
  - On hover or click → a small dropdown panel showing: "Last sync: 4 min ago", "Refresh", "View sync history (deferred Phase 35+)", divider, "All integrations" with mini status pills.
  - Click-outside closes. `Esc` closes.
- Add a **quick-settings gear** icon button on the topbar-right (right of the brand area, before hamburger in some layouts). On click → dropdown menu with:
  - **Theme**: ⌃ toggles Dark / Light / System (RadioGroup look — defer to Phase 33 reuse)
  - **Density**: Compact / Comfortable
  - **Motion**: Auto (respect prefers-reduced-motion) / Force reduce / Always animate
  - Divider → "Keyboard shortcuts (?)"
- Both dropdowns reuse a single `Popover` primitive. If `Popover` doesn't yet exist, hand-roll in `frontend/src/components/ui/Popover.tsx` (~80 LOC).
- ARIA: dropdown toggles get `aria-haspopup="menu"`, `aria-expanded` toggling, focus trap inside.

### 5 · Keyboard Shortcuts help pane (`?`)
**Bug:** Users discover shortcuts only by accident. No documentation surface.

**Do:**
- Create `frontend/src/pages/KeyboardShortcuts.tsx`. Renders inside `ChromeShell`. Two-column layout: section name + shortcut list.
- Sections:
  - **Navigation** — `g d` Dashboard, `g i`, `g m`, etc.
  - **Global** — `⌘K` palette, `?` this help, `Esc` close, `/` search (deferred)
  - **Page-specific** — Memory: `⌘K`, `[[` wikilink autocomplete; Execution: `e` mark executed; Backtest: `r` re-run
- Each shortcut row: key glyph (kbd with OKLCH bg like Settings page) + label. Glassmorphic surface.
- Press `?` to toggle; press any other key to fade out (ignore `?` followed by a letter since it's used by combos like `g d`). Actually simpler: only `?` opens it; ESC closes.

### 6 · Wire everything in `ChromeShell.tsx` + final polish
**Bug:** Even with the new components, they must mount somewhere. Currently they're isolated.

**Do:**
- Mount `<CommandPalette />`, `<Breadcrumbs />`, and the TopBar rewrites inside `<ChromeShell>`. Order: TopBar → Breadcrumbs → Main (with `<ErrorBoundary>` from Phase 32 wrapping the page slot).
- `useGlobalHotkeys` mounts here too — one global listener, controlled by ChromeShell state.
- Add `data-testid`s: `breadcrumb-root`, `copalette-root`, `topbar-sync-pill`, `topbar-quick-settings`, `shortcuts-pane`.
- Add 3 CSS tokens to `ocean.css` and final reduced-motion overrides:
  ```css
  :root {
    --copalette-bg: oklch(15% 0.015 210 / 0.92);
    --copalette-section: oklch(75% 0.04 200);
    --breadcrumbs-bg: oklch(22% 0.02 210 / 0.45);
    --freshness-ok: oklch(72% 0.16 170);
    --freshness-warn: oklch(78% 0.14 75);
    --freshness-stale: oklch(65% 0.18 25);
  }
  @media (prefers-reduced-motion: reduce) {
    .popover-enter, .copalette-enter, .topbar-freshness-pulse { animation: none !important; transition: none !important; }
  }
  ```
- Verify mount order: TopBar (z 100) → Breadcrumbs (z 95 — under main but above content) → Main (z 20) → CommandPalette overlay (z 60, above sidebar) → KeyboardShortcuts overlay (z 70, above palette).

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--copalette-bg`, `--copalette-section`, `--freshness-ok/-warn/-stale`, `--breadcrumbs-bg`. **NO hex.**
2. **Accessibility** — every shortcut has a screen-reader-compatible key glyph (e.g. `<kbd>⌘</kbd><kbd>K</kbd>`). Palette trap-focuses. Breadcrumbs `<nav aria-label="Breadcrumb">`. TopBar buttons all `aria-label`. Dropdowns `aria-haspopup`, `aria-expanded`. Reduced-motion respected across pulse + slide.
3. **No new backend routes.**
4. **No new heavy deps.** `fuse.js` and `framer-motion` already in deps. Reuse them.
5. **Performance** — palette renders lazily (only when open); ✗ don't mount on every page navigation. Hotkey listener attaches once globally. Sync pill updates on `setInterval(60_000)` (60s tick) — no per-second re-renders.
6. **Micro-interactions < 300ms** per Emil Kowalski. Palette open 150ms (no slide, just fade), quick-settings dropdown 180ms (fade + scale up), TopBar pip pulse 1.5s ease-in-out infinite (slow presence, not nervous).
7. **Ponytail principle** — delete before adding. Drop the old `<button title="Last sync: ...">`-only approach; the new pip is far richer. **One** `data-testid` per surface. No fabricated state (read from existing hooks).
8. **`@subagent-driven-development` mandatory** — spawn one subagent per fix where independent. Sequence 1-2 in parallel → 3 (hotkey foundation) → 4-5 → 6 (mount + wire).

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/components/ui src/components/layout src/hooks/useGlobalHotkeys.ts src/pages/KeyboardShortcuts.tsx src/App.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: create `frontend/e2e/specs/34-app-shell.spec.ts`:
- `⌘K` opens CommandPalette from `/portfolio`, `/settings`, `/memory`
- Search "memo" → only Memory route matches; Enter navigates
- Search "sync" → Sync now action appears; Enter triggers
- Breadcrumb on `/portfolio`: `Fin › Portfolio`
- TopBar pip: green dot at T+0, amber at T+5min, red at T+30min (mock time)
- `?` opens shortcuts pane; `Esc` closes
- `g d` from `/settings` → routes to `/`
- Focus on Input → `⌘K` STILL opens palette (text inputs exempt for `g` combos only)

```bash
cd frontend && npx playwright test e2e/specs/34-app-shell.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/`:
   - Press `⌘K` → palette opens, search "sett", Enter → `/settings`
   - Press `?` → shortcuts pane opens
   - TopBar shows green dot (recent sync), wait 5 min tick → amber, etc.
   - Click gear → quick-settings menu, change theme → UI re-themes
   - Breadcrumb: `Fin` only on `/`; `Fin › Portfolio` on `/portfolio`; etc.
2. DevTools Console: zero errors.
3. DevTools → Rendering → Reduced motion → pip pulse stops, palette opens instantly.
4. DevTools Lighthouse a11y = 100, perf ≥ 90.
5. Playwright e2e 34-app-shell passes.
6. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. **Strict ≤10 modified files.** Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match Phases 19-30 visual language. The palette shares memory's glassmorphic style. Breadcrumbs match the dark-cinema feel. TopBar pip is THE OCEAN's bio-glow. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx`.

<task>Now go.</task>
