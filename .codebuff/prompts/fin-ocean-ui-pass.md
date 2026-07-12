# Fin — Turn the UI into "THE OCEAN" (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to align the live UI with the design spec. **Fix exactly what is listed — no more, no less.** Ponytail applies.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines` `@vercel-react-best-practices` `@systematic-debugging` `@improve-codebase-architecture`

**Hard gates — invoke explicitly:**
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code:**
1. `docs/Frontend_Architecture.md` — visual thesis, palette, typography, components
2. `docs/implementation/05_Ocean_Dashboard_Shell.md` — component breakdown
3. `.superpowers/sdd/phase19-subagents/04-ui-polish-animation.md` — full polish checklist
4. `frontend/src/styles/ocean.css` — the OKLCH tokens; **do not reinvent**

---

## User's report
> Side panels not working. UI doesn't match the design spec.

## What "good" looks like (per spec)
- Ocean canvas = THE canvas. Everything else floats glassmorphically on top.
- Sidebar starts **collapsed** (~64px icons only). Hamburger/hover expands to ~280px (icons + labels). Claude.ai-style.
  - Top nav: Dashboard · Portfolio · Debt · Retirement · Questions · Research
  - Bottom nav: Settings · Memory · Chat · Trade · Analytics
- Fins = animated SVG/3D shapes that swim in the ocean. Clicking one opens an **Agent Context View** ("submarine cabin"): left = memory + agent info, center = recommendation cards + chat.
- **No per-agent colors** (functional only: green/orange/red).
- Inter + Geist Mono. OKLCH tokens from `ocean.css`. Respect `prefers-reduced-motion`.

**Scope of THIS pass:** Dashboard + Ocean + Sidebar + Agent landing. Portfolio/Retirement/Debt (and the secondary tabs Settings/Memory/Chat/Trade/Analytics) are linked from the sidebar but their internal empty states stay as-is — wiring those pages is a separate pass.

---

## The 4 fixes (execute in order)

### 1 · Sidebar — collapse-to-icons, not slide-off-screen
**Bug:** `.sidebar` toggles via `transform: translateX(-100%)` (slides off-screen). Only lists 3 agents.

**Do:**
- In `frontend/src/styles/ocean.css`: replace the translateX toggle with **width-based collapse** (`.sidebar` collapsed ≈ 64px, expanded = `var(--sidebar-width)`). Keep `--transition-sidebar` for the easing.
- In `frontend/src/components/layout/Sidebar.tsx`: render the full top nav (6 items) + bottom nav (5 items). When collapsed: icon only. When expanded: icon + label + status dot (if agent).
- In `frontend/src/pages/Dashboard.tsx`: default `sidebarOpen = false` on desktop ≥ 1024px.
- Mobile (< 768px): sidebar becomes a full-width overlay drawer; toggle from hamburger.

### 2 · Layout hierarchy — ocean stays the canvas (incl. fin position + motion)
**Bug:** `<main className="dashboard-main">` is `position: fixed` and pushes an opaque block over the ocean. Fins are pinned to the bottom — they should swim mid-viewport.

**Do:**
- Ocean canvas: `position: fixed; inset: 0; z-index: 0`.
- Sidebar: z-index ~50. TopBar: z-index 100. Main content area: z-index 20 with `transparent` background; cards inside use glassmorphic background.
- Fin-overlay (in `frontend/src/components/ocean/OceanCanvas.tsx`): position fins at the **upper-middle third** of the canvas, not bottom (`padding-bottom: 12%` → `padding-top: 35%`, adjust `justify-content`).
- Spec says fins "swim in slow circles". Currently they only bob. Add a sustained circular drift via CSS transform on `.fin-model` (a slow `translate` circular path, 30–60s loop, layered with the existing idle bob).

### 3 · Agent Context View (replace the narrow `AgentPanel` card)
**Bug:** Clicking a fin shows a tiny status card, not the workspace described in the spec.

**Do:**
- Refactor `frontend/src/components/layout/AgentPanel.tsx` into a **two-area glassmorphic workspace**:
  - Left aside: agent role, recent stats, memory list (placeholder data OK).
  - Center: a recommendation-card skeleton + chat input row (placeholder OK, no fake responses).
- Make it float over the ocean (not opaque). Backdrop blur already in palette tokens; use them.
- Triggered by clicking a fin (already wired via `onSelectFin`). Closing = clicking the `< Back` button or the fin again.

### 4 · Three.js memory leak in `useOceanScene.ts` (ponytail-minimal)
**Bug:** Inside `animate()`, the wireframe clone is recreated every frame:
```ts
wireOcean.geometry.dispose();
wireOcean.geometry = oceanGeom.clone();
```
This churns ~60 disposable geometries per second.

**Do:**
- Use a single shared `BufferGeometry`, or update vertex positions in place via `posAttr.setXYZ(...)` + `needsUpdate = true`.
- Do NOT dispose/clone inside the animation loop.
- Recompute vertex normals only when displacement actually changes (cache + threshold), not every frame.
- Dispose once on unmount (cleanup return is already correct — keep it).

---

## Constraints — NON-NEGOTIABLE
1. **OKLCH palette only** — use existing tokens from `ocean.css`. No hex, no new colors.
2. **Accessibility** — honor `prefers-reduced-motion: reduce` (existing media query is your reference), touch targets ≥ 44px, icons-only sidebar must remain keyboard-tabbable.
3. **No new dependencies, no auth UI** (user menu stays empty), no fabricated Zustand state — placeholders only for new tabs/cards.
4. **Micro-interactions < 300ms** per Emil Kowalski. Glassmorphism (`backdrop-filter: blur()`) on floating panels, using existing surface tokens.
5. **Ponytail principle** — delete before adding. If a fix isn't strictly required for THE OCEAN compliance, skip it.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)
```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src && \
  npx vitest run --reporter=dot
```

E2E:
```bash
cd frontend && \
  ls e2e/specs/ && \
  echo "(pick the spec closest to dashboard/ocean/sidebar, or write one if none exists)"
```

---

## Verification before declaring done
1. `npm run dev` and open `http://localhost:5173`:
   - Sidebar starts collapsed (icons only).
   - Hamburger smoothly toggles width (no translateX).
   - All 6 top-nav + 5 bottom-nav items render and route correctly.
   - Ocean canvas is visible behind everything.
   - Click a fin → Agent Context View opens with two areas.
2. DevTools → Rendering → "Emulate CSS media: prefers-reduced-motion: reduce" → re-check (no animations should remain).
3. DevTools Console: zero errors / zero warnings.
4. Lighthouse mobile + desktop ≥ 95 perf, 100 a11y.
5. Playwright e2e: locate the relevant dashboard/ocean/sidebar spec via `ls frontend/e2e/specs/` first, then run it. Capture screenshots of: (a) sidebar collapsed, (b) sidebar expanded, (c) one fin interaction opening the Agent Context View.
6. Self-review with `@code-review-and-quality`: the diff should be tight (~5–10 files), no drive-by refactors, no dead code added.

---

## Deliverable format
Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. Stop and ask before ballooning scope.

**Begin.**
