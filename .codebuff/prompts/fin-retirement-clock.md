# Phase 25 — Retirement Clock (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate the Retirement page from "data-dense dashboard" to "decades-to-retirement timeline". Ponytail applies. **Maximum ≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@data-visualization` (domain)

**Hard gates:**
- `@subagent-driven-development`
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Retirement.md` (if present)
2. `frontend/src/pages/Retirement.tsx`
3. `frontend/src/components/retirement/` — ContributionOptimizer, AccountBreakdown, ProjectionChart, RetirementScore
4. `frontend/src/styles/ocean.css`
5. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-portfolio-cockpit,fin-debt-strategy-engine}.md`
6. `.codebuff/prompts/fin-retirement-clock.md` (this file)

---

## User's report
> Retirement page is data-dense but lacks the decades-to-retirement feeling. Score gauge is OK but the projection chart could be more visceral. Glide-path is invisible. Tax-advantaged math is hidden behind a small block.

## What "good" looks like

- **Hero "years to retirement" countdown** — animated counter on first visit, OKLCH-glow ring around retirement-age number.
- **Glide-path interactive** — drag equity/bond ratio on a timeline; projection fan updates live.
- **Roth vs Traditional calculator** — toggle that re-paints the projected tax-savings at retirement.
- **Tax-advantaged bucket fill bar** — single-line visualization showing 401k match / IRA / HSA saturation.
- **"Time horizon" capsule** — fade gradient from TODAY to RETIRE on every chart axis.
- **Healthy-coach tone** — copy reads as a fiduciary coach, not a calculator.

## GitHub repos referenced

### Math / forecast
- [WE-1] `numpy/numpy-financial` — NPV, IRR (we use ollama-side but model logic here).
- [WE-2] `firefly-cpp/firefly-iii` — open-source retirement simulator; canonical math reference.
- [WE-3] `ujjwal96/retirement-planner` — open RFC for glide-path rules.

### Visualization
- [WE-4] `d3/d3` — already in deps; use for the timeline capsule / fade.
- [WE-5] `framer-motion` — drag-to-glide interactions.

### MCP
- [MDC-1] `FreddieMG/data-analysis-mcp` — reference for an MCP that fetches retirement math.

### Skills
- [WE-6] `@data-visualization` (domain).

---

## The 6 fixes (execute in order)

### 1 · Hero "years to retirement" countdown
**Bug:** `RetirementScore.tsx` shows a gauge. No animated countdown.

**Do:**
- Big number `current_age + years_until_retirement` centered, with smooth animated roll.
- Surrounding ring: OKLCH glow fill animated to completion on first visit (one-shot, respects prefers-reduced-motion).
- If `years_until_retirement < 5`, swap copy to "Less than 5 years — review your glide-path".

### 2 · Glide-path interactive (drag equity/bond ratio)
**Bug:** Glide-path is invisible. No way to tweak.

**Do:**
- Below the projection chart, a `.glide-path-slider` (Recharts `ComposedChart` with dual y-axis, or a hand-rolled SVG path).
- Two draggable handles: % equity and % bonds. Drag → re-fan the projection.
- Compute update fires `/api/retirement/projection` with new profile; re-render median/10th/90th.
- **Strict cap** — equity `[0, 100]`, bonds `[100 - equity, 0]`. Reset button.

### 3 · Roth vs Traditional calculator
**Bug:** Tax strategy surface is glue-on.

**Do:**
- A `.tax-toggle` segmented control (already in ocean.css) labeled "All Traditional / All Roth / Mix".
- Updating the toggle re-paints the projected tax-savings on the timeline.
- Tooltip explains the calc in plain English: "Roth: pay 24% now, withdraw tax-free. Traditional: deduct now, pay later."

### 4 · Tax-advantaged bucket fill bar
**Bug:** Bucket fill (401k match %, IRA %, HSA %) is not surfaced.

**Do:**
- New `BucketSaturationBar.tsx` — three horizontal progress bars in a single row.
  - 401k Match Capture % (green if matched, amber if missed match)
  - IRA Contributions % (out of $7,000 cap)
  - HSA Contributions % (out of $4,150 individual / $8,300 family)
- Hover card on each with "you've missed $X of annual tax-advantaged potential".

### 5 · Time horizon capsule on every chart
**Bug:** Charts lack a "from now to retirement" visual anchor.

**Do:**
- Add a small horizontal capsule under the X-axis of each chart that tints from `--bio-glow` (today) to `--text-muted` (retirement).
- Width = `100%`. The capsule is a single inline SVG `<linearGradient>`.
- Implementation per chart: `ProjectionChart.tsx`, `AccountBreakdown.tsx` x-axis.

### 6 · Fiduciary coach copy pass
**Bug:** Copy is generic. Doesn't feel like a fiduciary advisor.

**Do:**
- Audit every line on `/retirement` for tone. Replace template messages with personable one-liners.
- Set a `.coach-voice` rule: short sentences, declarative, name the recommended action.
- Example: instead of "Increase IRA contributions to maximize retirement savings", render "You're leaving $4.1k of HSA tax-advantaged growth on the table — bump HSA contributions to your family cap."

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--delta-pos`, `--delta-neg`, `--payoff-glow`. **NO hex.**
2. **Accessibility** — `prefers-reduced-motion: reduce` honored (no animation roll, no glide-path easing). Slider fully keyboard-navigable. `role="slider"` + `aria-valuenow`.
3. **No new backend routes** — use existing `/api/retirement/projection`, `/api/retirement/readiness`, `/api/settings`.
4. **No new heavy deps** — Recharts + framer-motion adequate.
5. **Strict ≤ 10 files modified.** Confirm via `git diff --stat`.
6. **`@subagent-driven-development` mandatory.**
7. **Ponytail principle** — delete before adding. Drop unused variant states.

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/Retirement.tsx src/components/retirement src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/06-retirement.spec.ts`:
- Hero countdown rolls on first visit
- Glide-path slider drags; projection re-fans
- Roth/Traditional toggle recomputes tax-savings
- Bucket fill bar shows three buckets

## Verification

1. Open `/retirement` → countdown rolls on first visit.
2. Drag glide-path slider → projection fan updates.
3. Toggle Roth/Traditional → tax-savings changes.
4. prefers-reduced-motion → no animations.
5. Lighthouse ≥ 90 perf / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
