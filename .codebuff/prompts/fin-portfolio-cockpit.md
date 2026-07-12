# Phase 23 — Portfolio Performance Cockpit (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate Portfolio from a list of widgets to a Bloomberg-feel performance cockpit. **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified** — enforced.

**Skills referenced throughout this pass**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@data-visualization` (domain)

**Hard gates — invoke explicitly:**
- `@subagent-driven-development` — spawn one subagent per fix where independent.
- `@ponytail` — before adding, ask "delete instead?"
- `@code-review-and-quality` — run on your own diff before declaring done

**Read the spec IN THIS ORDER before touching code (mandatory):**
1. `docs/Frontend_Architecture.md`
2. `frontend/src/styles/ocean.css` — OKLCH tokens
3. `frontend/src/pages/Portfolio.tsx`
4. `frontend/src/components/dashboard/PortfolioSummary.tsx` + `AllocationPie.tsx` + `HoldingsTable.tsx` + `PerformanceLine.tsx` + `ConcentrationMeter.tsx`
5. `.codebuff/prompts/fin-memory-obsidian.md`
6. `.codebuff/prompts/fin-settings-pro.md`
7. `.codebuff/prompts/fin-cinematic-ocean-dashboard.md`
8. `.codebuff/prompts/fin-portfolio-cockpit.md` (this file)

---

## User's report
> Portfolio is a stack of widgets — no clear hierarchy. Charts look like dashboards, not cockpits. Sparklines absent. Empty state on a fresh install is "no data" instead of "connect → see".

## What "good" looks like

- **Hero metrics row** — Portfolio value (huge), daily P&L (with sparkline), YTD return, cash, allocation drift.
- **Tabbed chart switcher** — `1D / 1W / 1M / 3M / 1Y / YTD / All` with smooth transitions and a "what happened today" hover.
- **Holdings table v2** — sort, search, sticky header, sparkline-on-hover per row, infinite-scroll, density toggle (compact/comfortable).
- **Sector breakdown radar chart** — Recharts RadarChart, 6-9 sectors, hover shows allocation as percentage + comparison to S&P 500 weight.
- **Empty state** — connect-a-broker onboarding copy mirroring Phase 22 onboarding cards style.

## GitHub repos referenced

### Visualization
- [WE-1] `recharts/recharts` — the rendering library we use. v3.x supports `ResponsiveContainer` + `AreaChart` reliably.
- [WE-2] `framer-motion` — already in deps; use for hero metric tab transitions.
- [WE-3] `iampawan/chart-spark` — inspiration for sparkline UX.
- [WE-4] `TanStack/virtual` — TanStack's virtualization lib for the holdings table.

### MCP / connectors
- [MDC-1] `modelcontextprotocol/servers` — backend integration source of truth.
- [MDC-2] `alpaca-py/alpaca-py` — historical bars API; we already call via `/api/portfolio/full`.

### Skills
- [WE-5] `@data-visualization` (domain).

---

## The 6 fixes (execute in order)

### 1 · Hero metrics row with sparklines
**Bug:** `PortfolioSummary.tsx` shows 4 cards in a flex wrap. No sparklines.

**Do:**
- A `.portfolio-hero` row with 5 metric tiles (Total Value, Daily P&L, YTD Return, Cash, Allocation Drift).
- Each tile: number, label, tiny 7-day sparkline (`PerformanceLine` mini variant), delta-percent badge.
- Number transitions via `useAnimatedNumber`. Sparkline updates through real historical bars.

### 2 · Tabbed chart switcher (1D / 1W / 1M / 3M / 1Y / YTD / All)
**Bug:** `PerformanceLine.tsx` takes a `period` prop but the surrounding UX is a single dropdown. No segmented control.

**Do:**
- Replace the dropdown with a `.seg` segmented control (already in `ocean.css` from Phase 21).
- Tabs: `1D / 1W / 1M / 3M / 1Y / YTD / ALL`.
- State persists to URL (`?range=1M`) for shareable views.
- Animate y-axis re-fit (subtle 180ms ease-out) so tab change doesn't jank.

### 3 · Holdings table v2 — sort / search / sticky / sparkline-on-hover
**Bug:** `HoldingsTable.tsx` uses `framer-motion` row animations but no search, no density toggle.

**Do:**
- Sticky header + sticky first column (ticker).
- Search input (debounce 150ms).
- Sort: ticker, allocation, value, daily P&L, weight-percent — click cycles asc/desc/none.
- Density toggle: compact (36px row) / comfortable (52px row). Persisted to localStorage.
- Hover row: reveal 30-day sparkline inline. Click → modal detail (or navigate to holding-specific page if it exists; else just reveal a single column drawer).
- Infinite scroll (or simple pagination ≥ 50 rows; use `TanStack/virtual` if heavy).

### 4 · Sector breakdown radar chart
**Bug:** `AllocationPie.tsx` shows asset-class donut. No sector breakdown.

**Do:**
- New `SectorRadar.tsx` — Recharts `RadarChart` with 6-9 sectors (Tech, Finance, Healthcare, Energy, Consumer, Industrial, Utilities, RealEstate, Other).
- Hover: allocation %, comparison to S&P 500 weight (hard-coded current weights; update from Finnhub in follow-up).
- Companion ring: portfolio weight vs market weight — percentage delta in card.

### 5 · Allocation drift meter (already exists in `ConcentrationMeter`, repurpose)
**Bug:** `ConcentrationMeter.tsx` highlights single highest allocation. Useful but one-off. Expand to second metric.

**Do:**
- Already in `ConcentrationMeter.tsx`. Extend the meter to a dual gauge: "concentration %" (largest holding) AND "top-5 concentration %".
- Add `data-testid="concentration-warning"` (already in testids).
- Threshold-grade badge: OK / Watch / Reduce.

### 6 · Empty + onboarding state
**Bug:** When `/api/portfolio/full` returns empty, Portfolio shows... nothing. Confusing.

**Do:**
- Replace empty state with three onboarding cards (mirror Phase 22): "Connect Alpaca", "Add a manual holding", "Backtest a strategy".
- Cards route to `/settings` (Alpaca connect flow), inline-add form, `/backtest` respectively.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--delta-pos` / `--delta-neg`. NV. Never invent hex.
2. **Accessibility** — table cells clickable + keyboard sortable; tab focusable. Hold laser-pointer on tooltip text.
3. **No new backend routes** — use existing `/api/portfolio/full`, `/api/portfolio/holdings`, `/api/portfolio/performance`.
4. **No new heavy deps** — `recharts` and `framer-motion` are sufficient. Don't add `@tanstack/table-virtual` unless the row count justifies (>200 rows).
5. **60fps animations** — use `requestAnimationFrame`, no setInterval inside render. Animations ≤ 300ms.
6. **Ponytail principle** — delete before adding. Drop unused motion variants. **≤10 files modified.**
7. **`@subagent-driven-development` mandatory** — parallelize independent fixes 1, 3, 4, 6.

---

## Code checkers — RUN AFTER EVERY PHASE (parallel)

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/Portfolio.tsx src/components/dashboard src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/02-portfolio.spec.ts`:
- Hero row renders 5 tiles with sparklines
- Tabbed chart switcher toggles period; URL reflects `?range=`
- Holdings table sorts by allocation descending on first click
- Sector radar renders N sectors with hover-able sectors

```bash
cd frontend && npx playwright test e2e/specs/02-portfolio.spec.ts --reporter=line
```

---

## Verification before declaring done

1. `npm run dev` and open `http://localhost:5173/portfolio`:
   - 5 hero tiles display numbers + sparklines
   - Segmented control at top of chart; clicking `1D` shows today only, etc.
   - Holdings table sorts on any column
   - Sector radar renders ≥ 6 sectors
   - Empty state shows 3 onboarding cards if no data
2. DevTools → "Emulate CSS media: `prefers-reduced-motion: reduce`" → sparklines skip animation, tabs animate ≤ 80ms.
3. DevTools Console: zero errors / zero warnings.
4. Lighthouse mobile ≥ 80 perf / 100 a11y; desktop ≥ 95 perf / 100 a11y.
5. Playwright e2e 02-portfolio passes.
6. `git diff --stat` confirms ≤ 10 files modified.
7. Self-review with `@code-review-and-quality`: tight diff, no drive-by refactors.

---

## Deliverable format

Reply with: bullet list of files changed, anything skipped (with reason), and any new tech debt. Stop and ask before ballooning scope.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
