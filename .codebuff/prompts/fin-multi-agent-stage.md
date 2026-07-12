# Phase 26 — Multi-Agent Stage (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate Multi-Agent page from "selector + run" to an actual "stage theater" where the three agents perform and the user can audit cross-agent reasoning. **Fix exactly what is listed — no more, no less.** **≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@agentic-ux` (domain)

**Hard gates:**
- `@subagent-driven-development` — one subagent per fix where independent.
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/AI_Agent_Modes.md` — agent thinking modes
2. `frontend/src/pages/MultiAgent.tsx`
3. `frontend/src/components/orchestration/{AgentStream,AgentSelector}.tsx`
4. `frontend/src/hooks/useAgentStream.ts` — streaming
5. `frontend/src/styles/ocean.css`
6. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-portfolio-cockpit,fin-debt-strategy-engine,fin-retirement-clock}.md`
7. `.codebuff/prompts/fin-multi-agent-stage.md` (this file)

---

## User's report
> Orchestration page has skill chips and agent selector. Cross-agent insights buried. Streaming output exists but feels like raw logs instead of a performance stage. No conflict highlighting when Investment says "trim NVDA" and Debt says "hold cash for emergency fund".

## What "good" looks like

- **Stage visualization** — three agent slots (`Investment | Debt | Retirement`) shown as glassmorphic cards on a "stage" surface, each with a status ring (idle / thinking / running / done).
- **Cross-agent diff panel** — "Where they agree / disagree", grouped by ticker or topic. Color-coded stops (red = conflicted, OK = aligned).
- **Skill library browser** — categorized view of all skills with `recently used`, `recommended`.
- **Run history timeline** — past runs with replay-against-current-context.
- **Run-cost-tracker** — token spend + elapsed time at top of the page.
- **Conflict highlights** — when two agents recommend divergent actions on the same ticker, a prominent card appears.

## GitHub repos referenced

### Streaming / agent protocols
- [WE-1] `modelcontextprotocol/specification` — MCP streaming semantics.
- [WE-2] `openai/openai-agents` — agent streaming output UX inspiration.
- [WE-3] `vercel/ai-chatbot` — streaming render patterns.

### Animation
- [WE-4] `framer-motion` — for stage choreography.
- [WE-5] `pmndrs/zustand` — already in deps; use for cross-agent shared state if helpful.

### Skills
- [WE-6] `@agentic-ux` (domain).

---

## The 6 fixes (execute in order)

### 1 · Stage visualization with 3 agent slot cards
**Bug:** `MultiAgent.tsx` shows `AgentSelector` (a chip list) and streaming output side-by-side. No "stage" metaphor.

**Do:**
- A horizontal stage row at the top: three `.agent-stage-slot` cards (Investment, Debt, Retirement), each with a 1-line ring (`idle → thinking → running → done`) and a small ticker (run cost + elapsed).
- Center-justify on desktop, scroll on mobile.
- Clicking any slot focuses its stream output.

### 2 · Cross-agent diff panel
**Bug:** Cross-agent insights live in a `summary` block at the bottom. Buried.

**Do:**
- Floating right-rail (or below the stage on mobile) showing **`Aligned (green)`** | **`Divergent (orange)`** | **`Conflicts (red)`** sections.
- Each entry: agent1 says "…" / agent2 says "…" with a 1-line synthesis.
- Pulls from `/api/agents/summary` if it returns cross-agent deltas; else compute client-side from current stream outputs.

### 3 · Skill library browser (categorized)
**Bug:** Skill chip display is a flat bar.

**Do:**
- Grouped chips: `📊 Portfolio | 💳 Liabilities | 🎯 Goals | 🔍 Research | ⚡ Tax`.
- Each chip has a `?` tooltip explaining the skill in plain English.
- Recently-used chips float to the top, persisted in localStorage.

### 4 · Run history timeline
**Bug:** No history of past runs.

**Do:**
- A `.run-history-timeline` collapsible at the bottom.
- Each entry: timestamp, agent mix, duration, total cost (token estimate), summary.
- Click expands a `.run-history-detail` replay view (re-stream the prior reasoning over a virtual cursor at 1×).

### 5 · Run-cost-tracker prominent at top
**Bug:** No visibility into how much the run is costing.

**Do:**
- A `.run-cost-tracker` bar at the top of the page.
- Live counters: token estimate + elapsed wall time + per-agent progress.
- When `free_local_mode`, show "0 tokens (local)" — never alarm.
- When over a soft cap (configurable), soft amber glow.

### 6 · Conflict highlight (when agents disagree on the same ticker)
**Bug:** No detection of cross-agent disagreement.

**Do:**
- After every streamed message, parse for `[[Symbol]]` references that appear in 2+ agents with conflicting directions (`sell` vs `buy`, `hold` vs `trim`).
- When detected: spawn a `.conflict-card` at the top of the diff panel, sticky-pinned until resolution.
- "Resolve" CTA lets the user pick one agent's direction and dismisses the other.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--stage-spotlight`, `--aligned`, `--divergent`, `--conflict`. **NO hex.**
2. **Accessibility** — `prefers-reduced-motion: reduce` honored (no stage choreography). Diff panel fully keyboard-reachable.
3. **No new backend routes** — use existing `/api/agents/run-all`, `/api/agents/summary`, `/api/agent_state/...`.
4. **No new heavy deps** — `@uiw/react-codemirror` family already present from Phase 20. Do not add streaming-SSE libs unless justified.
5. **Strict ≤ 10 files modified** — confirm via `git diff --stat`.
6. **`@subagent-driven-development` mandatory.**
7. **Ponytail principle** — delete before adding. Drop unused agent state hooks.

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/MultiAgent.tsx src/components/orchestration src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/14-cross-agent.spec.ts`:
- 3 stage slot cards render
- Diff panel has 3 sections (Aligned / Divergent / Conflict)
- Run history shows a prior run after clicking
- Conflict highlight fires on synthetic disagreement

## Verification

1. Open `/orchestrate` → 3 stage slots visible at top.
2. Run any 2 agents → diff panel populates with their summaries.
3. Inject a synthesized conflict (test fixture) → conflict card appears.
4. prefers-reduced-motion → no animation roll-in.
5. Lighthouse ≥ 90 perf / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
