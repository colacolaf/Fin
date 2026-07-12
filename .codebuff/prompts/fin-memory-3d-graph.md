# Phase 40 — Memory: 3D Graph (pasteable brief)

You are a senior frontend + backend engineer finishing **Fin**. Execute the surgical pass below to ship the **2D-mini + 3D-fullscreen memory graph** with self-curating colorway and chat-lineage edges. **Read the design spec IN FULL before touching code.** Ponytail applies.

**Authoritative spec** (do not deviate from visual tokens, scene params, or the agent contract):
- `docs/Features/Memory_system/Memory_system_3D_Graph.md` — visual-first, AI-replicable, with exact OKLCH/hex, three.js params, and the end-of-chat colorway contract.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines` `@vercel-react-best-practices` `@systematic-debugging` `@improve-codebase-architecture` `@ponytail` `@code-review-and-quality`

**Hard gates — invoke explicitly:**
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read IN THIS ORDER before touching code:**
1. `docs/Features/Memory_system/Memory_system_3D_Graph.md` — **the spec** (read all 17 sections; this is your source of truth)
2. `docs/Features/Memory_system/Memory_system.md` — prior spec; only the parts kept per §16.1 of the new spec
3. `docs/Frontend_Architecture.md` — "The Ocean" visual thesis (the 3D graph lives inside the ocean, not in place of it)
4. `.codebuff/prompts/fin-memory-obsidian.md` — DEPRECATED; understand what it tried, then deliberately do the opposite (no editor, no file tree, no daily note)
5. `.codebuff/prompts/fin-ocean-ui-pass.md` — canonical structure for Fin phase briefs
6. `.codebuff/prompts/fin-memory-3d-graph.md` (this file) — re-read before commits

---

## User's report

> The memory system doesn't look like the reference. AI can't replicate the look from the existing .md. The new design has been written; your job is to ship it without losing the visual fidelity the spec guarantees. The reference image shows a 3D force-directed graph with dark background, multi-colored nodes, chat-lineage edges, mini graph in the chat top-left, fullscreen on expand. Agents curate their own colorway at end of chat.

## What "good" looks like (per spec)

- **(P0 — Visual fidelity)** A side-by-side screenshot of the shipped fullscreen view next to the reference image should be **indistinguishable** to a non-engineer. Same background OKLCH, same node colors, same depth fog, same edge opacity, same rail widths, same "Open Memory 3D" button.
- **(P0 — Replicability)** An AI reading `Memory_system_3D_Graph.md` alone could rebuild what you ship. The tokens, the scene params, the data model are all in the spec — your job is to honor them, not reinterpret them.
- **(P0 — Self-curating colorway)** A user opens a debt chat about "car loan refinance". The agent ends the chat with a `colorway_proposal` block. The new memory nodes appear amber. Next time the user opens a debt chat about car loan, the agent proposes the same amber (or skips proposing because the category exists). A new "car insurance" category that never existed before gets a fresh color from the seed palette.
- **(P1 — Mini graph)** A 220×140 2D graph sits in the top-left of every chat. Hover a node → tooltip. Click a node → opens the originating chat. Click outside the graph or the "Open Memory 3D" button → opens fullscreen.
- **(P1 — Performance)** 60fps with 3,000 nodes / 6,000 edges on a 2019 MBP. Auto-degrade at <30fps.
- **(P2 — Accessibility)** Lighthouse 90+ perf, 100 a11y. `prefers-reduced-motion` freezes drift. Full keyboard nav. Color is never the only signal.
- **(P2 — Prompt provenance)** Click any node → right rail drawer shows the full system prompt version, user input, agent output, and tool calls that produced it.

**Scope of THIS pass:** all 7 phases (A–G) of §15 in the spec. Frontend + backend. Includes deprecation of the 3-tab shell from `fin-memory-obsidian.md`.

---

## GitHub repos referenced (allowed new deps)

- [`react-force-graph-2d`](https://github.com/vasturiano/react-force-graph) — 2D force graph; reads positions from our shared d3-force-3d simulation (see spec §12.3)
- [`react-force-graph-3d`](https://github.com/vasturiano/react-force-graph) — three.js + d3-force-3d wrapper
- [`three`](https://github.com/mrdoob/three.js) — WebGL renderer (peer of `react-force-graph-3d`; lazy-load only when fullscreen opens; add EXPLICITLY to `package.json` to avoid tree-shaking)
- [`@fontsource/inter`](https://github.com/fontsource/font-files) + [`@fontsource/geist-mono`](https://github.com/fontsource/font-files) — typography tokens
- [`fuse.js`](https://github.com/krisk/Fuse) — Cmd+K fuzzy search
- [`lucide-react`](https://github.com/lucide-icons/lucide) — icon library (Search, FileText, Settings, LocateFixed); ~30KB tree-shakeable; required by spec §3.4, §7.1, §7.2

**Banned**: Slate, Lexical, TipTap, Monaco, react-markdown, markdown-it, Cytoscape, Sigma.js.

---

## The 7 phases (execute in order; each independently shippable)

### Phase A — Data + API (no UI yet)

**Bug:** No `/api/memory/graph` endpoint. No `colorway.json`. No `prompt_provenance` field. No chat metadata notes.

**Do:**
- Add `GET /api/memory/graph?user_id=X&include=nodes,edges,colorway` returning the shape in spec §13.1. Compute and include `is_recent: boolean` per node per the definition in spec §5.2 (`created_at` within last 30 days OR referenced by a chat the user has opened in the last 7 days).
- Add `PATCH /api/memory/colorway` for user overrides (spec §13.1).
- On chat-save: write a metadata note at `~/.fin/memory/chats/{YYYY-MM-DD}-{slug}.md` with the frontmatter from spec §9.3 (`next_chat_id`, `continuation_of_chat_id`, `related_chat_ids`, `memory_node_ids`).
- On recommendation save / decision save / pattern save: add `prompt_provenance` YAML block to the note (spec §11.1).
- Initialize `~/.fin/memory/colorway.json` with the seed palette from spec §3.2 on first run (default: pre-seed per §17.6).
- Update the orchestrator wrapper that loads agent system prompts: append the `colorway_proposal` addendum from spec §10.1 to every agent's prompt.
- After the agent's final response: parse the `colorway_proposal` JSON block; merge into `colorway.json` per the rules in spec §10.2; emit `memory:graph-updated` WebSocket event.
- Extend `agent_memory` in the user context to include the current `colorway.json` so the agent can match prior colors (spec §16.3).

**Done when:** `GET /api/memory/graph` returns the right shape with seed colors; a new chat adds nodes/edges to the response; `colorway.json` updates when an agent emits a proposal.

### Phase B — Force engine + shared data layer (no rendering yet)

**Do:**
- `frontend/src/hooks/useGraphData.ts` — fetches and caches `/api/memory/graph`.
- `frontend/src/hooks/useColorway.ts` — fetches and patches `colorway.json`.
- `frontend/src/components/graph/ForceEngineContext.tsx` — shared `d3-force-3d` instance; mounted at app root; reset only on user logout.
- `frontend/src/hooks/useMemoryGraph.ts` — subscribes to `memory:graph-updated` + `memory:colorway-updated` WebSocket events; refetches and re-heats the simulation by `0.3` alpha for 1 tick.
- `frontend/src/graph/buildEdges.ts` — edge computation per spec §9.4. Unit tests for: temporal, continuation, related, chat_to_memory, plus the 5 deprecated wikilink edges (now `memory_to_pattern`).

**Done when:** hooks return correct data; edge computation is unit-tested; WebSocket updates propagate to a stub subscriber.

### Phase C — Mini 2D graph

**Do:**
- `frontend/src/components/memory/MiniMemoryGraph.tsx` — 220×140 mounted in the top-left of the chat surface (12px from edges, 12px below header).
- Use `react-force-graph-2d` reading the shared `ForceEngineContext` simulation.
- Render exactly per spec §5.2: bg `--bg-graph`, 1px `--border-subtle`, radius 2–4px nodes, 0.4px edges at 0.25 opacity.
- Auto-cap at 500 visible nodes (oldest non-recent fade to 0.3 opacity); cull edges if FPS < 30.
- "Open Memory 3D" button per spec §5.3: 22×22 in the top-right corner of the mini, 2px stroke ring, hover brightens, click → `router.push("/memory/3d")`.
- Hover node: floating HTML tooltip (NOT canvas) with title (12px Inter 500), category (11px Geist Mono 500 in node color).
- Click node: `router.push(/chats/{node.chat_id})`.
- Animation: simulation at 0.3× speed; settles in 2s of mount.
- WebSocket `memory:graph-updated` → fade new nodes in over 400ms ease-out.
- `prefers-reduced-motion: reduce` → freeze simulation on mount.

**Done when:** open a chat, see the mini graph, hover shows tooltip, click opens chat, "Open Memory 3D" button works.

### Phase D — Fullscreen 3D shell

**Do:**
- `frontend/src/pages/MemoryGraph3D.tsx` — route `/memory/3d`. Hides the app shell (header, sidebar). Dismissed by `Esc` with 200ms fade.
- `frontend/src/components/memory/MemoryGraph3DCanvas.tsx` — `react-force-graph-3d` with **EXACT** parameters from spec §6.2–§6.6 (camera FOV 50, position 0,0,240, fog 80→480, OrbitControls damping 0.08, etc.). **Do not invent your own values.** In dev mode only, expose the camera ref on `window.__FORCE_GRAPH__.camera` (and a handle to the force simulation) so Playwright can assert scene params. Strip in production builds (use `import.meta.env.DEV` guard).
- Use `nodeThreeObject` for custom node geometry (`SphereGeometry(d.radius * 0.18, 12, 12)` + `MeshBasicMaterial` with node color + opacity per state).
- Use `nodeThreeObjectExtend(true)` for hover halo (sprite 1.6× node, 30% opacity, same color).
- Floating label on hover/select: HTML overlay (NOT WebGL) at the projected 2D position of the node. Contains title, category, 1-line preview.
- Bottom-right counter: `graph: {N} nodes · {M} edges` in Geist Mono 11px `--text-muted` (per spec §3.5 — replaces the reference's `3,200 × 2,000` which was a viewport artifact).
- `frontend/src/components/memory/MemoryLeftRail.tsx` — 48px wide, `--bg-rail`. Top: `Search` (opens `MemoryCommandPalette` modal) and `FileText` (opens recent-files popover).
- `frontend/src/components/memory/MemoryRightRail.tsx` — 48px wide, `--bg-rail`. Top: `Settings` (opens `MemorySettingsPanel` drawer) and `LocateFixed` (re-centers camera on selected node or most recent).
- `frontend/src/components/memory/MemoryCommandPalette.tsx` — Cmd+K modal per spec §7.3. 560px max-width, glass, Fuse.js threshold 0.4, virtualized list, up/down/enter, selecting opens chat.
- Performance: lazy-load `three` only when fullscreen opens (code-split at the page level). InstancedMesh for nodes. Pause simulation when tab hidden.
- `prefers-reduced-motion: reduce` → no autoRotate, no drift, freeze on mount.

**Done when:** `/memory/3d` opens with the correct scene params, rails work, Cmd+K searches, click node opens chat, ESC returns, bottom-right counter is correct, perf holds 60fps with 3k nodes. **Verifiable assertions** (Playwright; camera ref must be exposed on `window.__FORCE_GRAPH__` for testing): `document.querySelector('canvas').width >= 1280`; `window.__FORCE_GRAPH__.camera.fov === 50`; `window.__FORCE_GRAPH__.camera.position` has `.z >= 200`; no element matches `[data-testid='camera-button']`; the bottom-right counter's `textContent` matches `/^graph: \d+ nodes · \d+ edges$/`; Tab key cycles node aria-labels in degree-descending order.

### Phase E — Right rail panels (colorway + provenance)

**Do:**
- `frontend/src/components/memory/MemorySettingsPanel.tsx` — 320px drawer from right, 240ms slide. Contains:
  - **Color legend** (top): every category in `colorway.json`, swatch + label + count.
  - **Settings** (middle): animation speed slider, node size slider, edge opacity slider, auto-rotate toggle, reset view button.
  - **Selected node info** (bottom): when selected, shows title, category, chat_id, created_at, "View chat" link.
- Native `<input type="color">` for color override; on change, PATCH `/api/memory/colorway`. "×" button next to swatch resets to agent proposal (Ponytail: don't add a separate "reset all" button).
- `frontend/src/components/memory/MemoryProvenanceDrawer.tsx` — 480px drawer from right. Reads `prompt_provenance` from the selected node's frontmatter. Shows system prompt version + hash (clickable diff if previous version), user input (monospace gray bg), agent output (rendered markdown), tool calls (collapsible per call), model + temperature.
- `LocateFixed` icon: tweens camera to selected node (or most recent) over 600ms ease-in-out.

**Done when:** open settings, override a color, graph updates. Open provenance, see the full prompt that created the node. LocateFixed re-centers the camera.

### Phase F — Polish + accessibility

**Do:**
- Keyboard nav: `Tab` cycles nodes in degree-descending order; `Enter` selects; arrow keys pan camera; `R` resets view; `Cmd/Ctrl+Shift+M` opens fullscreen; `Esc` closes.
- Auto-rotate on idle: 30s of no interaction → `autoRotate=true, autoRotateSpeed=0.3`. Stops on any user input.
- Screen-reader live region: aria-label updates on node hover/select with the node's title.
- `aria-label` on the canvas; ARIA on command palette (`role="dialog"`, `aria-modal="true"`); ARIA on settings drawer (`role="dialog"`, `aria-modal="true"`).
- Lighthouse mobile + desktop ≥ 90 perf, 100 a11y.
- Playwright e2e: `e2e/specs/40-memory-3d.spec.ts` covering (a) mini renders in chat, (b) fullscreen opens via button + keyboard, (c) Cmd+K searches + selects, (d) click node opens chat, (e) color override updates graph, (f) provenance drawer opens, (g) keyboard nav cycles nodes, (h) `prefers-reduced-motion` freezes drift.
- Bundle-size guard: alert in CI if `three` chunk > 700KB gz.

**Done when:** Lighthouse passes, e2e green, no console errors, no `any` types in new code.

### Phase G — Deprecation cleanup

**Do:**
- Delete `frontend/src/pages/MemoryExplorer.tsx` (3-tab shell).
- Delete `frontend/src/components/memory/MemorySearch.tsx`, `MemoryTimeline.tsx`, `MemoryNoteEditor.tsx`, `MemoryTagExplorer.tsx`, `MemoryOutlinePanel.tsx`, prior `MemoryGraph.tsx`.
- Remove `/memory` route from `App.tsx` (replaced by `/memory/3d` + the in-chat mini).
- Remove the daily-note auto-create logic from the prior spec.
- Update `Sidebar.tsx`: remove the "Memory" secondary tab; the graph is now ambient (in every chat) and explicit (fullscreen via Cmd+Shift+M).
- Update any feature spec references that point to deleted files.
- Verify bundle is SMALLER than before this pass started (Ponytail: prove the deletion was worth it). Create `scripts/measure-bundle.sh` that records `dist/assets/*.js` total gzipped size as the baseline before Phase A, runs again at the end of Phase G, and fails CI if the delta exceeds +700KB (the budget for the added `three` + `react-force-graph-3d` + `lucide-react` deps). Paste the script's output in the PR description.

**Done when:** `git status` shows only the new files + the deletions. No drive-by edits to unrelated components. **Bundle diff is negative** — verified by `scripts/measure-bundle.sh` (added in this phase), which runs before and after, fails CI if `dist/assets/*.js` total gz size grows beyond the budget (`baseline + 700KB` for the added `three` + `react-force-graph-3d` + `lucide-react` deps). The script's output MUST be pasted in the PR description.

---

## Constraints — NON-NEGOTIABLE

1. **The spec is the source of truth.** Every visual token, every three.js param, every d3-force value, every data field comes from `docs/Features/Memory_system/Memory_system_3D_Graph.md`. If you think the spec is wrong, STOP and ask — do not improvise.
2. **OKLCH palette only** — use the tokens from spec §3. NO new hex values. If you need a color that isn't in §3, add it to the spec first.
3. **No new backend routes beyond §13.1** — every CRUD op goes through basic-memory MCP or the two new endpoints. Do not add `/api/memory/create`, `/api/memory/update`, etc.
4. **No new global state in Zustand** — extend `useFinStore.memoryGraph` slice. Ponytail.
5. **No new heavy deps** — only the 5 listed above. `three` is lazy-loaded. No other 3D libs.
6. **Micro-interactions < 300ms** per Emil Kowalski. Glassmorphism via `backdrop-filter: blur(16px)`. Panel slide 240ms ease-out. Tooltip 180ms ease-out. Node hover scale 1.4× with no transition (instant feedback). Selected node scale 1.6× over 120ms.
7. **Ponytail principle** — delete before adding. Drop `MemorySearch.tsx` + `MemoryTimeline.tsx` + `MemoryNoteEditor.tsx` + `MemoryTagExplorer.tsx` + `MemoryOutlinePanel.tsx` + `MemoryGraph.tsx` + `MemoryExplorer.tsx` + the daily-note logic. One `data-testid` per surface, not per inner element. No fabricated Zustand state.
8. **The 5 open decisions in spec §17** — confirm with the user before Phase A. Don't silently default.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src && \
  npx vitest run --reporter=dot
```

Backend:

```bash
cd backend && \
  npx tsc --noEmit && \
  npx oxlint src && \
  npx vitest run --reporter=dot
```

E2E (after Phase F):

```bash
cd frontend && npx playwright test e2e/specs/40-memory-3d.spec.ts --reporter=line
```

---

## Verification before declaring done

1. Open `http://localhost:5173/` and start a chat:
   - The 220×140 mini graph appears in the top-left within 500ms.
   - Hover a node → tooltip with title + category appears within 200ms.
   - Click a node → the originating chat opens.
   - Click "Open Memory 3D" → fullscreen 3D view opens in 600ms.
2. In fullscreen:
   - The scene matches the reference: dark background, depth fog, multi-color nodes, thin edges, 48px rails on both sides, no camera button, counter in bottom-right.
   - OrbitControls work: drag to rotate, scroll to zoom, right-drag to pan.
   - Cmd+K opens the palette; type a category name; Enter opens the chat.
   - Click a node → right rail settings panel shows it; "View chat" opens the chat; "Why did the agent create this?" opens the provenance drawer.
   - Click the color swatch in the legend → native color picker; change a color → graph updates within 200ms.
   - R key resets the camera view.
   - Esc returns to the previous page.
3. Self-curating colorway test:
   - In a fresh vault (no `colorway.json`), open a debt chat. The agent emits `colorway_proposal` for "car loan refinance" with amber. Memory nodes for that chat are amber.
   - Open a different debt chat mentioning car loan. The agent's context shows the existing amber. Either the agent skips proposing (smart) or proposes the same amber (acceptable).
   - Open a debt chat about credit cards. The agent proposes red. New memory nodes are red.
   - Open a debt chat about student loans. The agent proposes indigo. New memory nodes are indigo.
4. Edge model test:
   - Open chat A about refinancing. Then chat B that continues chat A. Verify the `continuation_of_chat_id` edge connects B to A.
   - Open chat C about the same car loan later. Verify the `related_chat_ids` edge connects C to A.
5. Performance:
   - Seed 3,000 nodes / 6,000 edges in a test vault. Fullscreen view holds 60fps on a 2019 MBP. Below 30fps triggers the auto-degrade path.
6. Accessibility:
   - DevTools → Rendering → "Emulate CSS media: `prefers-reduced-motion: reduce`" → re-check (drift and auto-rotate disabled).
   - Lighthouse mobile + desktop ≥ 90 perf, 100 a11y.
   - Tab key cycles nodes; Enter selects; screen reader announces node titles.
7. DevTools Console: zero errors, zero warnings.
8. Self-review with `@code-review-and-quality`: tight diff per phase, no drive-by refactors, no dead code added, no fabricated Zustand state, no unstated visual deviations from the spec.

---

## Deliverable format

Reply with: bullet list of files added/changed/deleted per phase, anything skipped (with reason), any new tech debt, and a side-by-side screenshot of the shipped fullscreen view next to the reference image. Stop and ask before ballooning scope.

**Begin.**
