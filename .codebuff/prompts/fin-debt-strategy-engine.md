# Phase 24 — Debt Strategy Engine (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate Debt Dashboard from "comparison page" to "decision theater". **Fix exactly what is listed — no more, no less.** Ponytail applies. **Maximum ≤10 files modified** — enforced.

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@product-thinking` (domain)

**Hard gates:**
- `@subagent-driven-development` — spawn one subagent per fix.
- `@ponytail` — delete before adding.
- `@code-review-and-quality` — self-review before done.

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Recommendation_engine.md`
2. `frontend/src/pages/DebtDashboard.tsx`
3. `frontend/src/components/debt/` — PayoffStrategyToggle, DebtAccountCard, etc.
4. `frontend/src/styles/ocean.css` — OKLCH tokens
5. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-cinematic-ocean-dashboard,fin-portfolio-cockpit}.md`
6. `.codebuff/prompts/fin-debt-strategy-engine.md` (this file)

---

## User's report
> Debt dashboard has the avalanche/snowball toggle but lacks decision theater. User can't see the actuarial. No celebration on milestone payoffs. Strategy cards look static; payoff timeline feels like a Gantt, not a story.

## What "good" looks like

- **Strategy comparison hero** — avalanche vs snowball side-by-side with total interest cost, payoff date, monthly commitment — graphically distinct, not as a toggle.
- **Interactive payoff timeline** — animated, ordered by current strategy, with milestone celebrations on cross.
- **Per-debt what-if simulator** — extra $X/month to one card → projects new payoff date live across all cards.
- **Strategy card animation** — strategy cards animate between avalanche/snowball with cross-fade + small spillover effect.
- **Payoff progress ring per debt** — micro progress % per card.
- **Done-state celebration** — confetti or expanding ring + sound cue on the exact day a debt is paid off (date display).

## GitHub repos referenced

### Math
- [WE-1] `amortization-schedule` — standard snowball/avalanche math; we'll write our own but the algorithm is canonical.
- [WE-2] `mathjs/finance` — NPV, IRR for interest-saved math.

### Animation
- [WE-3] `react-spring` — already in deps via `framer-motion`; use it for strategy card cross-fade.
- [WE-4] `catdad/canvas-confetti` — the standard lightweight confetti lib. ≤2 KB.

### MCP / connectors
- [MDC-1] `plaid-python` — debt data source (already integrated via Plaid Liability sync).

### Skills
- [WE-5] `@product-thinking` (domain).

---

## The 6 fixes (execute in order)

### 1 · Strategy comparison hero (avalanche vs snowball)
**Bug:** Avalanche/Snowball lives as a small toggle. Hard to compare.

**Do:**
- Replace toggle with two `.strategy-card` blocks side-by-side, each showing:
  - Strategy name + icon
  - Total interest paid (animated number roll)
  - Payoff date (countdown from today)
  - Monthly cash commitment graph (RadarChart will be insufficient — use Recharts AreaChart with payment-over-time curve)
  - "Choose" CTA that highlights one and dims the other
- Both cards visible always; user can switch instantly.

### 2 · Interactive payoff timeline (story, not Gantt)
**Bug:** Payoff timeline reads as a static Gantt chart.

**Do:**
- Animate the timeline mount (cards slide in left-to-right when strategy is picked).
- Crossing a milestone (e.g. "60% debt cleared") plays a soft OKLCH-tinted glow pulse on the card.
- Inline bar with `IntersectionObserver` hint (segment scrolled into view).

### 3 · Per-debt what-if simulator
**Bug:** `extra_payment` is a single global input.

**Do:**
- Per-card "Try +$50/month to this one" affordance — expands inline to a slider.
- Live recompute: when slider changes, recompute the entire payoff schedule (`/api/debt/strategy-comparison` for fresh payload).
- Show delta: "Saves $X, Y months earlier" in a `.savings-badge`.
- Reset button per card.

### 4 · Strategy card cross-fade animation
**Bug:** Strategy switch is instant.

**Do:**
- Use `framer-motion` `AnimatePresence` between strategy views (timeline + payoff schedule).
- Outgoing: fades + slight y-translate (-4px) over 180ms.
- Incoming: fades in + slight scale (0.97 → 1.0).

### 5 · Payoff progress ring per debt
**Bug:** `DebtAccountCard.tsx` shows balance but no payment-progress.

**Do:**
- Add a circular progress ring outside the balance number (`0%` → `100%` cleared).
- Color shifts OKLCH: red @ 0%, amber @ 50%, bio-glow @ ≥75%.
- Hover: tooltip with "X payments left at current pace".

### 6 · Done-state celebration + sound cue (prefers-reduced-motion aware)
**Bug:** No visible milestone celebration when a debt moves to "Paid off".

**Do:**
- When a debt's `current_balance === 0` AND today's date matches the projected payoff date in the calendar → trigger confetti.
- Sound: short < 300ms rising tone. **Skip sound + skip confetti motion** under `prefers-reduced-motion`.
- Card expands + glassmorphic overlay banner: "🎉 {Debt name} paid off on {date} — saved $X vs minimums."

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend `ocean.css` with `--delta-pos`, `--delta-neg`, `--payoff-glow`. **NO hex.**
2. **Accessibility** — `prefers-reduced-motion: reduce` honored (no confetti, no cross-fade, no glow pulses). Tooltips and progress rings fully keyboard-navigable. ARIA `role="progressbar"` on rings.
3. **No new backend routes** — use existing `/api/debt/strategy-comparison`, `/api/debt/payments`, `/api/debt/summary`.
4. **No new heavy deps** — `canvas-confetti` (1.4 KB minified), `react-spring` (already via framer-motion). No `moment`, no `date-fns` heavy add.
5. **Strict ≤ 10 files modified.** Tee-up a soft check `git diff --stat | tail -1` — if > 10 files, split into two passes.
6. **`@subagent-driven-development` mandatory.**

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/DebtDashboard.tsx src/components/debt src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/05-debt.spec.ts`:
- 2 strategy cards visible (avalanche + snowball)
- Per-debt slider recomputes payoff
- Reduction-motion variant skips confetti

## Verification

1. Open `/debt` → both strategies visible; animated timeline.
2. Slide extra payment on one card → savings badge updates live.
3. Trigger paid-off state via debug toolbar → confetti or OKLCH glow fires.
4. prefers-reduced-motion → confetti + glow suppressed, slider/timeline still functional.
5. DevTools Console: zero errors.
6. Lighthouse desktop ≥ 90 / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
