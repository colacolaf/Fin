# Phase 20 — Memory: Obsidian-grade knowledge layer (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate the basic-memory MCP frontend into an Obsidian-grade knowledge layer. **Fix exactly what is listed — no more, no less.** Ponytail applies.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines` `@vercel-react-best-practices` `@systematic-debugging` `@improve-codebase-architecture`

**Hard gates — invoke explicitly:**
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code:**
1. `docs/Features/Memory_system/Memory_system.md` — basic-memory MCP + wikilinks + tags contract
2. `docs/implementation/12_Memory_System.md` — existing implementation plan
3. `docs/Frontend_Architecture.md` — visual thesis, OKLCH palette, typography
4. `frontend/src/styles/ocean.css` — OKLCH token reference (do not reinvent)
5. `frontend/src/pages/MemoryExplorer.tsx` — current 3-tab shell to replace
6. `.codebuff/prompts/fin-ocean-ui-pass.md` — last phase's canonical structure
7. `.codebuff/prompts/fin-memory-obsidian.md` (this file) — re-read before commits

---

## User's report
> The memory page reads like a CMS — basic 3-tab shell, no editorial polish, no Obsidian-feel. We want it to match the THE OCEAN UI: high-end, glassmorphic, OKLCH-only, mirrror Obsidian's "live preview + wikilinks + Cmd+K" quality bar.

## What "good" looks like (per spec)
Lowercase "obsidian-grade" means FIN's Memory page carries Obsidian's signature philosophy, surface-for-surface. Each line below maps to one of the 6 fixes:

- **(Fix 1) 3-pane shell + glassmorphism**: left sidebar (vault tree + recent + pinned + tag tree), center editor with live preview, right panel (outline + backlinks) or overlaid graph. Resizable splits.
- **(Fix 2) Live preview markdown editor**: CodeMirror 6 with inline Obsidian-style rendering — `**bold**` and `# heading` appear formatted as you type, `[[Wikilink]]` is highlighted + clickable. Type `[[` opens an autocomplete dropdown of note titles + a "Create new note" entry; Arrow keys + Enter to insert; Esc to dismiss.
- **(Fix 3) Sidebar** = file tree (recommendations/, decisions/, preferences/, patterns/, daily/) at top, **Recent** (last 5 opened) and **Pinned** (user-pinned notes) in a sticky section, nested tag tree (`#finance/debt/cc` → `finance > debt > cc`) with note counts.
- **(Fix 4) Command Palette (Cmd/Ctrl+K)**: global fuzzy jump-to-note, arrow-key + Enter navigation, centered glassmorphic modal, virtual list when results > 200. Selection flushes editor pending-save before navigating.
- **(Fix 5) Right panel** = outline (`#`–`###` headers, click scrolls editor) + backlinks list (computed from `[[current title]]` occurrences across the cached vault).
- **(Fix 6) Graph polish**: tag/folder filter toggles, hover node → floating preview card, click node → load note in center editor + reveal in sidebar tree.
- **OKLCH tokens from `ocean.css`** — extend with `--memory-pane-bg` etc. as needed. Never invent hex.
- **No per-feature colors** — only functional (green/orange/red) + OKLCH accents.
- **Inter UI + Geist Mono in editor.** Respect `prefers-reduced-motion`.

**Scope of THIS pass:** `MemoryExplorer.tsx` + memory components + one new hook. **Frontend only.** No new backend routes; basic-memory MCP tool calls per `Memory_system.md` § 4. No new auth UI, no fabricated Zustand state. Placeholders OK for fields the backend doesn't yet return.

## GitHub repos referenced
- [`basicmachines-co/basic-memory`](https://github.com/basicmachines-co/basic-memory) — MCP server, vault store at `~/.fin/memory/`
- [`brianpetro/obsidian-smart-connections`](https://github.com/brianpetro/obsidian-smart-connections) — semantic search (Phase 21+ follow-up)
- [`TencentCloud/TencentDB-Agent-Memory`](https://github.com/TencentCloud/TencentDB-Agent-Memory) — short-term context compression (Phase 21+ follow-up)
- [`@uiw/react-codemirror`](https://github.com/uiwjs/react-codemirror) — markdown editor (allowed new dep; lightweight vs Slate/Lexical)
- [`fuse.js`](https://github.com/krisk/Fuse) — fuzzy search for command palette

---

## The 6 fixes (execute in order)

### 1 · 3-pane shell + glassmorphism + daily notes auto-creation
**Bug:** `MemoryExplorer.tsx` is a flat 3-tab shell. No sidebar, no editor pane. No "today" note.

**Do:**
- Refactor `frontend/src/pages/MemoryExplorer.tsx` into a 3-pane flex/grid layout: **left sidebar** (file tree + tag tree + pinned/recent), **center editor** (current note), **right panel** (outline + backlinks) OR graph overlay toggle.
- Glassmorphic panes via existing tokens (`--sidebar-bg`, `backdrop-filter: blur(16px)` from `ocean.css`). Add a `--memory-pane-bg` token if needed (OKLCH only).
- Wire `frontend/src/hooks/useMemory.ts` (NEW) to call the backend MCP proxy: `list_notes`, `read_note`, `search_notes`, `create_note`, `update_note`. Ponytail: signatures mirror `Memory_system.md` § 4 verbatim. Do NOT call MCP directly from the frontend.
- Add `ensureDailyNote(date)` to the same hook: on first MemoryExplorer mount of a new day, if `daily/{{YYYY-MM-DD}}.md` doesn't exist, call `create_note` with template (frontmatter `date`, `type=daily`, `tags=[daily]`, sections `## Today's Decisions` / `## Agent Notes` / `## Tomorrow`). If a new note was created, set it as the active editor note.
- delete `frontend/src/components/memory/MemorySearch.tsx` and `frontend/src/components/memory/MemoryTimeline.tsx` if their responsibilities are absorbed by the new command palette + outline panel.

### 2 · Live preview markdown editor (CodeMirror 6) + wikilink autocomplete
**Bug:** No in-app editor. Viewing = read-only rendering. No wikilink support.

**Do:**
- Create `frontend/src/components/memory/MemoryNoteEditor.tsx`.
- Use `@uiw/react-codemirror` (allowed new dep) with the `markdown` CodeMirror 6 language pack.
- **Obsidian-style Live Preview**: build a CodeMirror 6 `StateField` + `Decoration.set` plugin that **inline-renders** markdown as you type — `#` lines styled as headings, `**bold**` rendered bold, `*italic*` rendered italic, `` `code` `` rendered as inline code, links underlined. Underlying text remains plain (the `*`/`#`/etc. characters are visually replaced with a 0-width placeholder or hidden by an inline decoration). This is NOT a split-pane; this is true live preview.
- **Wikilink highlight**: a second `StateField` decoration marks `[[Title]]` spans with a token class; clicking the highlight jumps to that note in the center pane.
- **Wikilink autocomplete**: typing `[[` opens an overlay dropdown below the caret listing (a) matching note titles from the `useMemory.ts` local cache, (b) a trailing "Create note: …" entry if no exact match. Debounce 150ms. Arrow keys + Enter to insert; Esc to dismiss. Trigger only the first `[[` per line; subsequent `]]` close the link.
- **Write-through**: debounced `update_note` (800ms) preserves Obsidian-compatible YAML frontmatter; do NOT strip wikilinks or mangle tags. The editor must expose `flushPendingUpdate()` so the command palette can call it before navigating.
- Install via: `npm install @uiw/react-codemirror @codemirror/lang-markdown @codemirror/theme-one-dark fuse.js`.

### 3 · Sidebar — file tree + Recent + Pinned + nested tag explorer
**Bug:** No navigation. Notes appear only via global search.

**Do:**
- Create `frontend/src/components/memory/MemoryTagExplorer.tsx`.
- Top of sidebar: **file tree** (recommendations/, decisions/, preferences/, patterns/, daily/). Click = open in editor.
- Below the file tree: **Pinned** (user-pinned notes) + **Recent** (last 5 opened), each as a sticky quick-access section — Obsidian Quick Switcher parity.
- Below: **tag tree**. Parse frontmatter tags → nested tree (e.g. `#finance/debt/cc` → `finance > debt > cc`).
- Each leaf shows note count. Click filters the editor's note list.
- Pinned state persists in localStorage; Recent comes from the same store.

### 4 · Command Palette (Cmd/Ctrl+K)
**Bug:** Search = static input box on a separate tab. No keyboard-first navigation.

**Do:**
- Create `frontend/src/components/memory/MemoryCommandPalette.tsx`.
- Use `fuse.js` (allowed new dep) against note titles + content + tags. Threshold 0.4.
- Global `Cmd+K` / `Ctrl+K` shortcut opens modal. `Esc` closes. `↑/↓/Enter` navigates.
- Modal is centered, glassmorphic, max-height with virtual list when results > 200.
- Selecting a note loads it in the center editor.
- The editor's save-debounce must flush before navigation (call `flushPendingUpdate()` from the editor on Enter).

### 5 · Right panel — outline + backlinks
**Bug:** No header navigation; relationships only visible in the graph.

**Do:**
- Create `frontend/src/components/memory/MemoryOutlinePanel.tsx`.
- Extract `^#+ ` headers from current note (simple regex acceptable for MVP; upgrade to remark-parse if cheap).
- Clicking a header scrolls the editor to that line (CodeMirror API).
- Build a backlink index inside `useMemory.ts`: scan all cached notes for `[[current title]]` patterns; cache invalidates on note update.
- Render backlinks list below the outline. Each backlink title opens that note.

### 6 · Graph polish + tag/folder filters
**Bug:** Graph is generic force-directed with no filters and no hover preview.

**Do:**
- Polish `frontend/src/components/memory/MemoryGraph.tsx`. Keep D3 (already present) OR upgrade to `react-force-graph-2d` (allowed new dep IF justified by feature parity). Ponytail: stay on D3 unless rewrite reduces LOC.
- Add toggle buttons for tag/folder filters (top-right of the graph pane).
- Hover a node → floating preview card (note title + first 200 chars of content).
- Click a node → load the note into the center editor + reveal it in the sidebar tree.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — use existing tokens from `ocean.css`. Extend with memory-specific tokens (`--memory-pane-bg`, `--memory-editor-bg`, etc.) inside the same OKLCH palette family. NO hex.
2. **Accessibility** — `prefers-reduced-motion: reduce` honored on tree collapse, palette open/close, graph hover preview, live preview decorations. Touch targets ≥ 44px. Full keyboard nav: Tab order = sidebar → editor → right panel. ARIA labels on CodeMirror (`role="textbox"`, `aria-label`), palette modal (`role="dialog"`, `aria-modal="true"`), tree items (`role="treeitem"`, `aria-expanded`).
3. **No new backend routes** — every CRUD operation goes through the basic-memory MCP tool calls (`list_notes`, `read_note`, `search_notes`, `create_note`, `update_note`). Frontend talks to the backend proxy only. The `useMemory` hook implementation in `frontend/src/hooks/useMemory.ts` extends the design in `docs/implementation/12_Memory_System.md` Step 6 — do NOT duplicate or fork it.
4. **No new App.tsx edit** — the existing `/memory` route in `App.tsx` already maps to `MemoryExplorer.tsx`. Ponytail.
5. **basic-memory MCP server is already configured** in `.rowboat/config/mcp.json` and writes to `~/.fin/memory/` per `12_Memory_System.md` Step 1. Assume vault bootstrapped; do NOT re-init.
6. **No heavyweight deps** — `@uiw/react-codemirror` + `@codemirror/lang-markdown` + `@codemirror/theme-one-dark` + `fuse.js` are the only allowed new deps. **Do NOT** add Slate, Lexical, TipTap, Monaco, react-markdown, or markdown-it for the editor surface. `d3` already present.
7. **Micro-interactions < 300ms** per Emil Kowalski. Glassmorphism via `ocean.css` `backdrop-filter` tokens (`blur(12-16px)`). Tree expand/collapse 180ms ease-out. Palette open 150ms ease-out. Live preview decoration refresh on each transaction (CodeMirror handles internally).
8. **Ponytail principle** — delete before adding. Drop `MemorySearch.tsx` + `MemoryTimeline.tsx` if folded. One `data-testid` per surface, not per inner element. No fabricated Zustand state — observe what backend returns. Obsidian **Canvas** deferred to follow-up.

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
  ls e2e/specs/ | grep -i memory || \
  echo "(write e2e/specs/20-memory.spec.ts covering: 3-pane renders, Cmd+K palette opens + filters + selects, wikilink autocomplete inserts + jumps, daily note auto-created, graph filter toggles, graph click loads editor)"
```

After the spec exists:

```bash
cd frontend && npx playwright test e2e/specs/20-memory.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/memory`:
   - 3-pane shell renders (sidebar / editor / outline) with glassmorphism.
   - Tag tree shows nested tags with note counts.
   - Cmd+K opens the palette; fuzzy finds an existing note; Enter loads it.
   - Typing `[[` in editor triggers autocomplete dropdown; selecting a title inserts the wikilink; clicking a wikilink in the rendered preview jumps to the target.
   - Daily note auto-created on first load of a new day under `daily/{{YYYY-MM-DD}}.md`.
   - Graph filters by tag/folder; click node loads editor + reveals in sidebar tree.
2. DevTools → Rendering → "Emulate CSS media: `prefers-reduced-motion: reduce`" → re-check (tree collapse, palette open, graph hover preview must not animate).
3. DevTools Console: zero errors / zero warnings.
4. Lighthouse mobile + desktop ≥ 90 perf, 100 a11y.
5. Playwright e2e memory suite passes. Capture screenshots: (a) 3-pane shell landing with sidebar tree visible, (b) editor with live preview rendering `# heading` + `**bold**` inline, (c) Cmd+K palette open with fuzzy results, (d) wikilink autocomplete dropdown after typing `[[`, (e) graph with hover node preview, (f) daily note auto-created on first visit.
6. Self-review with `@code-review-and-quality`: tight diff ≤ 10 files, no drive-by refactors, no dead code added, no fabricated Zustand state.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. Stop and ask before ballooning scope.

**Begin.**
