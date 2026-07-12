# Phase 21 — Settings: Claude-grade configuration surface (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to ship the Settings page and sidebar polish. **Fix exactly what is listed — no more, no less.** Ponytail applies.

**Skills referenced throughout this pass** (govern your judgment): `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@design-taste-frontend` `@web-design-guidelines` `@vercel-react-best-practices` `@systematic-debugging` `@improve-codebase-architecture`

**Hard gates — invoke explicitly:**
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code:**
1. `docs/Features_Specification.md` — global feature inventory
2. `docs/Frontend_Architecture.md` — visual thesis, OKLCH palette, typography
3. `frontend/src/styles/ocean.css` — OKLCH token reference (do not reinvent)
4. `frontend/src/components/layout/Sidebar.tsx` — current sidebar to refine
5. `frontend/src/pages/SetupWizard.tsx` — wizard data shape mirrors Settings
6. `backend/routers/settings.py` + `backend/routers/integrations.py` — authoritative API surface
7. `backend/integrations/{alpaca,plaid,finnhub,ollama,upstash}.py` — connector truth sources
8. `docs/SystemPrompts/01-03_*.md` — the actual prompts to surface
9. `docs/Skills_Connectors_Models/` — connector catalog
10. `.codebuff/prompts/fin-memory-obsidian.md` (this file) — re-read before commits

---

## User's report
> The sidebar reads like a dev demo — emoji icons, scattered bottom tabs, no Settings page loads. The Settings page (where people connect brokers, configure MCP servers, audit prompts) looks generic. Make the side panel + Settings feel like Claude / Cursor / v0 — professional, glassmorphic but not boring, with deep cross-links to docs.

## What "good" looks like (per spec)
Lowercase "claude-grade settings" means FIN's Settings page carries the signature depth of a coding-platform configuration surface. Each line below maps to one of the 6 fixes:

- **(Fix 1) Hand-rolled inline SVG icon set** in `frontend/src/components/layout/Icons.tsx` — full 24px stroke-based glyphs for Dashboard, Portfolio, Debt, Retirement, Questions, Research, Memory, Chat, Trade, Analytics, Settings, Prompts, User, Shield, Brain, Danger, Check, Plus, Chevron. Currentcolor-friendly. **No emoji. No extra dep.**
- **(Fix 2) Single-scrolling sidebar with H2 dividers** — `WORKSPACE / AGENTS / TOOLS / SYSTEM`. Avatar + email card at the bottom-left as identity anchor (matches Cursor/v0 pattern). Collapsed = icon-only rail with avatar circle.
- **(Fix 3) Settings page = 6-section Cursor-style layout**: Account, Connections, Agent Preferences, Knowledge Layer (MCP), System Prompts, Danger Zone. Left-rail sub-navigation with sub-text blurb per tab. Glassmorphic cards per section.
- **(Fix 4) Connections section** = connector cards (Alpaca, Plaid, Finnhub, Ollama, basic-memory) with inline-expandable key inputs (no modals, like Vercel/Stripe). Status pill (Connected / Not connected / Syncing / Error) renders from `/api/integrations/`. Pluggable for future Notion/Slack.
- **(Fix 5) Agent Preferences** = per-agent card with risk slider (1–10), cadence segmented control (daily/weekly/monthly), confidence floor slider (0–100, step 5). Mock state for now; backend PUT `/api/settings` is wired.
- **(Fix 6) System Prompts viewer** = `<details>` cards per agent that unfold a read-only CodeMirror 6 markdown surface. Pre-renders the markdown inside the editor; honors One Dark theme. Front door to the "developer under-the-hood" feel.
- **OKLCH tokens extended in `ocean.css`** — `--settings-noise` (SVG grain data-URI), `--settings-section-radius`. **Never invent hex.**
- **No per-feature colors** — only functional (green/orange/red) + OKLCH accents.
- **Inter UI + Geist Mono for code/yaml/key fields.** Respect `prefers-reduced-motion` (noise disabled, lift hovers neutered).

**Scope of THIS pass:** `Settings.tsx`, Sidebar rewrite, `Icons.tsx`, ocean.css extensions, `App.tsx` route. **Frontend only.** No new backend routes; reuse `/api/settings`, `/api/integrations/`, `/api/integrations/alpaca/test`, `/api/integrations/sync`. No fabricated Zustand state — observed state only.

## GitHub repos referenced

### MCP servers / connectors (the integration sources of truth)
- [WE-1] `modelcontextprotocol/servers` — the canonical MCP server list we're modeling on (`@modelcontextprotocol/server-fetch`, `@modelcontextprotocol/server-memory`, etc.)
- [WE-2] `basicmachines-co/basic-memory` — already wired. Its `~/.fin/memory/` vault is the **Knowledge Layer** storage; UI surfaces "Running/Stopped" pill per server.
- [WE-3] `upstash/context7` — context7 MCP injected into agent prompt windows; appears as MCP card in the Knowledge section.
- [WE-4] `alpacahq/alpaca-py` — Alpaca broker SDK; the `/api/integrations/alpaca/test` endpoint stores encrypted creds (already implemented).
- [WE-5] `plaid/plaid-python` — Plaid SDK; `link-token-create` flow is the Connect button hook (frontend reads token, opens Plaid Link).
- [WE-6] `Finnhub-Stock-API/finnhub-python` — Finnhub quotes/news; settings page references for `finnhub_api_key`.
- [WE-7] `ollama/ollama-python` — local LLM runtime. Settings shows the configured model + endpoint.
- [WE-8] `upstash/ratelimit` + `upstash/redis-py` — used by middleware/rate_limiter.py. Settings shows "Redis connected" pill in the Engineering Diagnostics sub-card.

### Design references (what "professional, not boring" looks like)
- [WE-9] `vercel/next.js` — Vercel dashboard sidebar + connectors panel (`vercel.com/dashboard/integrations`) is the closest reference for tone.
- [WE-10] `claude-code/claude-code` (Anthropic) — Claude Code's `~/.claude/` config style + segmented controls + monospaced YAML editing.
- [WE-11] `cursor/cursor` — Cursor Settings layout: left rail of subsections + glassmorphic pane; bottom-left user card.
- [WE-12] `tailwindlabs/ui` / `shadcn/ui` — segmented control / switch / card primitives are mirrored in `ocean.css` token primitives here.

---

## The 6 fixes (execute in order)

### 1 · Hand-rolled inline SVG icon set (`Icons.tsx`)
**Bug:** Sidebar uses emoji icons (⚙ ◌ ◑ ⇄ ⌬) — inconsistent across OSes, breaks the Ocean aesthetic.

**Do:**
- Create `frontend/src/components/layout/Icons.tsx`. Hand-roll 24px stroke-width 1.6 Lucide/Feather paths for: Dashboard, Portfolio, Debt, Retirement, Questions, Research, Memory, Chat, Trade, Analytics, Settings, Prompts (for System Prompts / Recommendations), User, Shield, Brain, Danger, Check, Plus, ChevronRight, ChevronDown. Bash-only function comps that accept a `size` prop and spread SVG attrs.
- All use `stroke="currentColor"` so `color` cascades. Export each as a named component.
- Do **NOT** add `lucide-react`. Hand-roll the ~20 glyphs.

### 2 · Sidebar rewrite — single scroll with section dividers + user card footer
**Bug:** Sidebar is two flat clusters (top + bottom). No identity anchor. Emoji icons. Settings anchored at the bottom is fragile on tall screens.

**Do:**
- Refactor `frontend/src/components/layout/Sidebar.tsx`. Sectioned list with sidebar-section-label H2s ("WORKSPACE", "AGENTS", "TOOLS", "SYSTEM"). Each item uses the new SVG icons.
- Top header: small `F` brand mark. Bottom-left: `.sidebar-user-card` with avatar circle (initials from email) + email + "Local · v20" plan badge. Click → routes to `/settings`.
- 11 nav items total: Workspace (Dashboard/Portfolio/Debt/Retirement/Questions/Research = 6), Agents (Multi-Agent/Recommendations/Execution = 3), Tools (Memory/Community/Analytics/Backtest = 4 — most live under existing routes), System (Settings = 1). Total 14, not 11 — adjust based on what already routes. **Ponytail: do not add new backend routes.**
- Collapsed: icon-only, no labels, no section labels. Brand mark + bottom avatar circle visible.

### 3 · Settings page — `Settings.tsx` orchestrator (6 sections)
**Bug:** `/settings` 404s. Backend routes exist (`/api/settings`, `/api/integrations/...`) but no UI.

**Do:**
- Create `frontend/src/pages/Settings.tsx`. Two-pane layout: left rail (`settings-rail` with 6 tabs each having label + blurb), right pane (`.settings-main`).
- Tabs: Account, Connections, Agent Preferences, Knowledge Layer, System Prompts, Danger Zone.
- Hash deep-linking: `#settings/connections` (or via window.location.hash) routes directly.
- Each section uses a glassmorphic `.settings-section` card with `<Eyebrow>` + title + opt. description + body.

### 4 · Connections section — inline-expandable connector cards
**Bug:** Bitwarden / Cursor / v0 connector UX is anchored on the page; modal popups break flow.

**Do:**
- `.connector-grid` of `.connector-card` items. Each card: mark (logo placeholder), name, description, status pill (Connected/Syncing/Error/Not connected), action button (Connect / Disconnect).
- Click "Connect" on Alpaca → `.connector-expand` panel slides open inline. Three rows: API key input, secret input, environment segmented (Paper/Live). Save button calls `/api/integrations/alpaca/test`; on success, status pill flips to `Connected` + paper-trading chip displayed.
- Fetch live status from `/api/integrations/` on mount; gracefully fall back to `CATALOG` if backend returns `[]`.
- "Sync all" button header-right calls `/api/integrations/sync`.

### 5 · Agent Preferences — risk slider + cadence + confidence floor
**Bug:** Per-agent prefs live in `Setting.scope = "investment" | "debt" | "retirement"` but no UI is wired to edit them visually.

**Do:**
- `.agent-pref-grid` of `.agent-pref-card` per agent. Each card: title + description + three rows:
  - Risk tolerance (slider 1–10)
  - Cadence (`daily|weekly|monthly` segmented control)
  - Min confidence (slider 0–100 step 5)
- State local for now (mock); PUT `/api/settings` already accepts `{scope: 'agent:X', ...}` — leave a TODO to wire.

### 6 · System Prompts viewer — read-only CodeMirror cards + Danger Zone
**Bug:** Agent prompts (`docs/SystemPrompts/01-03_*.md`) are invisible to the user. Power users want a "transparency" affordance.

**Do:**
- `.prompts-stack` of `<details.prompt-card>` per Investment / Debt / Retirement agent. Collapsed = title + meta. Expanded = `.prompt-viewer` wrapping a `CodeMirror` with `editable={false}`, `markdown(...)`, `oneDark`.
- Danger Zone: 3 `.danger-card` items (Clear memory vault / Re-run setup wizard / Export all data). Red-tinted backgrounds. Confirmation button toggles between "Cancel / Yes, delete" inline pair.
- Reduced-motion handles: noise disabled, lift hovers neutered (already in ocean.css).

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — use existing tokens from `ocean.css`. New tokens (`--settings-noise`, `--settings-section-radius`) inside the same OKLCH/contemporary family. **NO hex.**
2. **Accessibility** — `prefers-reduced-motion: reduce` honored (noise + lift hovers). All touch targets ≥ 36px (settings CTAs are 36–44px). Full keyboard nav for tabs and sliders. ARIA: `role="tab"` on segmented controls + `aria-pressed`, `role="switch"` + `aria-checked` on toggles, `aria-label` on icon-only buttons.
3. **No new backend routes** — all data from existing `/api/settings`, `/api/integrations/*`, plus the system-prompts slide is static content (read from `docs/SystemPrompts/*.md` ahead-of-time). Frontend talks to backend proxy only.
4. **No new `App.tsx` logo edit beyond adding the route** — keep the rest of the routes untouched. The only addition is the `/settings` line.
5. **No new heavy deps** — `@uiw/react-codemirror` family already wired from Phase 20. Use it for the prompt viewer. No icon library imports.
6. **Micro-interactions < 300ms** per Emil Kowalski. Lift hover `translateY:-2px` < 180ms ease-out. Tabs < 150ms color/bg transition. Pills snap (no ease).
7. **Ponytail principle** — delete before adding. Drop redundant emoji in Sidebar. One `data-testid` per surface. No fabricated Zustand store shape for Settings. The Settings section roster is 6 max — anything more is out of scope.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/Settings.tsx src/components/layout/Sidebar.tsx src/components/layout/Icons.tsx src/api/integrations.ts src/styles/ocean.css src/App.tsx && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/11-settings.spec.ts` with:
- Account tab renders, theme segmented control toggles
- Connections tab loads, Alpaca Connect expands inline, key inputs present
- Agent Prefs tab sliders / segmented controls render with default values
- Knowledge Layer tab shows MCP cards
- System Prompts tab renders 3 prompt cards
- Danger Zone renders 3 cards

```bash
cd frontend && npx playwright test e2e/specs/11-settings.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/settings`:
   - Left rail glides into focus; sections appear one at a time when clicked.
   - Sidebar bottom-left user card visible; click → routes to Account tab.
   - Connections tab: connector cards shown; Alpaca inline expand works end-to-end.
   - System Prompts: open Investment card → reveals read-only CodeMirror with the prompt text.
2. DevTools → Rendering → "Emulate CSS media: `prefers-reduced-motion: reduce`" → re-check (noise hidden, no lifts).
3. DevTools Console: zero errors / zero warnings.
4. Lighthouse mobile + desktop ≥ 90 perf, 100 a11y (Settings is mostly static; should be fast).
5. Playwright e2e on `11-settings.spec.ts` passes. Capture screenshots: (a) `/settings` landing with Connections tab active, (b) Alpaca inline expand, (c) System Prompts viewer, (d) Danger Zone, (e) mobile viewport with rail collapsed into top dropdown (deferred).
6. Self-review with `@code-review-and-quality`: tight diff ≤ 12 files, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. Stop and ask before ballooning scope.

**Begin.**
