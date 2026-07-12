# Phase 28 — Execution Flow (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate the Execution dashboard from a queue list to a structured "your broker" feel with outcome accountability. **≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@product-thinking` (domain)

**Hard gates:**
- `@subagent-driven-development`
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Execution_Tracking_and_Follow_Through.md`
2. `frontend/src/pages/ExecutionDashboard.tsx`
3. `frontend/src/components/CheckInBanner.tsx`
4. `frontend/src/styles/ocean.css`
5. `.codebuff/prompts/{fin-multi-agent-stage,fin-recommendation-card}.md`
6. `.codebuff/prompts/fin-execution-flow.md` (this file)

---

## User's report
> Execution dashboard shows pending/done lists but doesn't feel like your broker. No post-execution outcome tracking. Streak/acceptance stats are visible but small.

## What "good" looks like

- **Execution queue list with broker-step mapping** — each pending action shows the broker sub-steps (e.g. `Alpaca → sell NVDA → set limit $X`).
- **Streak / acceptance rate** — hero stats at the top.
- **Mark-Executed confirmation** — modal/dialog with broker step copy.
- **Post-execution outcome tracker** — 30 days after, what happened?
- **Checklist complete celebration** — when all pending actions are executed, soft confetti + reduced-motion fallback.

## GitHub repos referenced

### Broker / execution UX
- [WE-1] `Robinhood/UX-Patterns` — execution review patterns (read-only description).
- [WE-2] `alpaca-py/alpaca-py` — broker step reference.
- [WE-3] `plaid/plaid-python` — side-effects on Liabilities.

### Reference
- [MDC-1] `firefly-cpp/firefly-iii` — transaction tagging + outcome.

### Skills
- [WE-4] `@product-thinking` (domain).

---

## The 6 fixes (execute in order)

### 1 · Execution queue list with broker-step mapping
**Bug:** Pending actions are flat list rows. Not mapped to broker steps.

**Do:**
- Each Pending row expands to a `.broker-step-list` showing the broker steps (e.g. `→ 1. Validate Alpaca link → 2. Submit limit sell → 3. Confirm fills`).
- Steps render with `IconCheck` / `IconChevronRight` / hollow circle based on status.
- Hover hint: "Mumble command X to execute".

### 2 · Streak / acceptance rate hero stats
**Bug:** `ExecutionDashboard.tsx` shows aggregate stats as a small row.

**Do:**
- Hero `.execution-stats` row at top: 3–4 large stat cards.
  - Current streak (e.g. `8 accepted in a row`)
  - Acceptance rate (%)
  - Execution rate (%)
  - Avg. decision time
- Animated number roll per `useAnimatedNumber` (already in hooks).

### 3 · Mark-Executed confirmation
**Bug:** `Mark Executed` triggers an immediate success toast with no confirmation.

**Do:**
- Click `Mark Executed` → confirmation dialog with:
  - The action summary (ticker, shares, broker step)
  - "I confirm I executed this in my broker" with a confirm button (disabled until typed).
- Then → success celebration.

### 4 · Post-execution outcome tracker (30-day)
**Bug:** Once "executed", the action disappears.

**Do:**
- New `.outcome-tracker` panel: actions executed in last 30 days, with how'd-it-go check-in:
  - "Did this help your portfolio?" — Strong positive / positive / neutral / negative / revert
  - Tiny chart: portfolio state before vs after (1W window)
- Aggregated into a confidence-calibration row.

### 5 · Checklist complete celebration
**Bug:** No celebration when queue empties.

**Do:**
- When pending.length drops to 0, trigger:
  - Confetti (using Phase 24's `canvas-confetti` integration if added, else inline CSS sparkle).
  - Banner: "You're caught up — next check-in in {days}d".
- `prefers-reduced-motion` → confetti skipped.

### 6 · Check-in banner integration
**Bug:** `CheckInBanner.tsx` exists but is decoupled.

**Do:**
- Show check-in banner on `/execution` only when overdue items exist.
- Wire to flow once "Mark Executed" is hit → removes overdue state.
- Cap visual: ≤ 2 banners, never accidentally stack.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--executed`, `--executed-faint`. **NO hex.**
2. **Accessibility** — confirmation dialog is keyboard-navigable, focus-trap, escape closes.
3. **No new backend routes** — use existing `/api/execution/*`.
4. **No new heavy deps.**
5. **Strict ≤ 10 files modified.**
6. **`@subagent-driven-development` mandatory.**

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/ExecutionDashboard.tsx src/components/CheckInBanner.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/07-execution.spec.ts`:
- Hero stats render
- Click pending row → broker steps expand
- Mark-Executed → confirmation dialog appears
- Empty queue → celebration with `prefers-reduced-motion` override

## Verification

1. Open `/execution` → hero stats, queue list with broker steps.
2. Click an item → broker-step row expands.
3. Mark Executed → confirmation required.
4. Empty queue → celebration fires (or skipped for reduced-motion).
5. DevTools Console: zero errors.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
