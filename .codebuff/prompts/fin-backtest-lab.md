# Phase 30 — Backtest Lab (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate Backtest from "run, see curves" to a lab notebook feel with curated strategy templates, multi-run overlays, and inline paper trading. **≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@quant-fin-eng` (domain)

**Hard gates:**
- `@subagent-driven-development`
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Backtesting_and_Training.md`
2. `frontend/src/pages/BacktestDashboard.tsx`
3. `frontend/src/components/HistoricalReplay.tsx`
4. `frontend/src/components/StrategyBuilder.tsx`
5. `frontend/src/styles/ocean.css`
6. `.codebuff/prompts/{fin-portfolio-cockpit,fin-debt-strategy-engine}.md`
7. `.codebuff/prompts/fin-backtest-lab.md` (this file)

---

## User's report
> Backtest exists but lacks "lab notebook" feel. Strategy templates scattered. Equity curve alone isn't enough — no trade markers, no comparison overlay. CSV export missing inline.

## What "good" looks like

- **Strategy template gallery (curated)** — 6-10 hand-curated strategies with categories.
- **Trade markers on equity curve** — annotated entry/exit dots (anchor: tradingview.com).
- **Equity curve multi-run overlay** — compare 2-3 prior runs side-by-side.
- **Paper trading dashboard inline** — current portfolio state from the last backtest.
- **CSV export of trades + equity**.
- **Strategy code preview in glassmorphic pane**.

## GitHub repos referenced

### Backtesting / open-source
- [WE-1] `vectorbt-dev/vectorbt` — vectorized backtesting framework; inspiration for run output.
- [WE-2] `nautilus-trader/nautilus_trader` — reference for trade markers + replay.
- [WE-3] `freqtrade/freqtrade` — strategy templates.

### Visualization
- [WE-4] `recharts/recharts` — Recharts `ScatterChart` for trade markers.
- [WE-5] `tradingview/lightweight-charts` — chart UX inspiration (do not import; just emulate style).

### Skills
- [WE-6] `@quant-fin-eng` (domain).

---

## The 6 fixes (execute in order)

### 1 · Strategy template gallery (curated)
**Bug:** `StrategyBuilder.tsx` has a code editor but no gallery of curated templates.

**Do:**
- A `.strategy-gallery` row above the builder.
- 6-10 templates (e.g. "RSI Reversion", "Buy-the-Dip SPY", "Tax-Loss Harvest Weekly").
- Each card: name, 1-line description, expected Sharpe, code-preview "Try" CTA that fills the editor.
- Categories filterable: `📈 Trend | 🌀 Mean Reversion | 💰 Income | 🛡 Defensive`.

### 2 · Trade markers on equity curve
**Bug:** Equity curve is a smooth line. Trades invisible.

**Do:**
- Overlay `ScatterChart` on the equity curve: entry (buy) → green up-arrow, exit (sell) → red down-arrow.
- Hover trade marker → popover: `{date} {action} {ticker} @ {price} · p/l {delta}`.
- Compute trades client-side from `HistoricalReplay` ticks (already in component).

### 3 · Equity curve multi-run overlay
**Bug:** Only one curve visible per run.

**Do:**
- A `.multi-run-overlay` control at the top of the chart: select up to 3 prior runs.
- Each run's curve overlay (different OKLCH line color per run via `--bio-investment`, `--bio-debt`, `--bio-retirement`).
- Cursor crosshair shows price at each run's time.

### 4 · Paper trading dashboard inline
**Bug:** Paper trading lives at `/backtest` but is decoupled from the run.

**Do:**
- At the bottom of the backtest results: a `.paper-trading-portfolio` card showing:
  - Cash, total value, holdings, latest trade.
  - Track equity vs benchmark S&P 500 over time (smaller chart).
- Pulls from `/api/backtest/paper-trades/...`.

### 5 · CSV export of trades + equity
**Bug:** No export.

**Do:**
- Two `.btn-secondary` buttons: "Export trades CSV" and "Export equity CSV".
- File downloads with key columns (timestamp, ticker, action, price, qty, pnl).
- Format compatible with common backtest tools (Backtrader, vectorbt).

### 6 · Strategy code preview glassmorphic pane
**Bug:** `StrategyBuilder.tsx` shows raw code editor. Visually noisy.

**Do:**
- Wrap the code editor in a glassmorphic pane (`.code-pane`) with subtle syntax theme (code already exists).
- Add a `data-testid="strategy-code"` for tests.
- Strip unnecessary color noise from the code editor — let the OKLCH page chrome carry the color, code stays readable.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--run-1`, `--run-2`, `--run-3`. **NO hex.**
2. **Accessibility** — strategy gallery cards tabbable; CSV downloads keyboard-triggered.
3. **No new backend routes** — use existing `/api/backtest/strategies`, `/api/backtest/runs`, `/api/backtest/paper-trades/...`.
4. **No new heavy deps** — `recharts` + `papaparse` (already in deps via Recharts).
5. **Strict ≤ 10 files modified.**
6. **`@subagent-driven-development` mandatory.**

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/BacktestDashboard.tsx src/components/HistoricalReplay.tsx src/components/StrategyBuilder.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/09-backtest.spec.ts`:
- Gallery renders 6 templates
- Run a strategy → equity curve + trade markers + paper trading card
- Multi-run overlay shows ≥ 2 prior runs
- Export buttons initiate downloads

## Verification

1. Open `/backtest` → gallery above the editor.
2. Click a strategy template → editor pre-filled.
3. Run → equity curve with trade markers renders.
4. Multi-run overlay: pick 2 prior runs → both visible.
5. Export trades → CSV file downloads.
6. Lighthouse ≥ 90 perf / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
