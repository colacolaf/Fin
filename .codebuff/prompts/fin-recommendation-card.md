# Phase 27 — Recommendation Card (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate a single recommendation from "dense list row" to a fiduciary-grade card. **Fix exactly what is listed.** **≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@product-thinking` (domain)

**Hard gates:**
- `@subagent-driven-development`
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Recommendation_engine.md`
2. `frontend/src/pages/RecommendationsDashboard.tsx`
3. `frontend/src/components/RecommendationsList.tsx`
4. `frontend/src/components/VoteWidget.tsx`
5. `frontend/src/styles/ocean.css`
6. `.codebuff/prompts/{fin-memory-obsidian,fin-settings-pro,fin-portfolio-cockpit,fin-debt-strategy-engine,fin-retirement-clock,fin-multi-agent-stage}.md`
7. `.codebuff/prompts/fin-recommendation-card.md` (this file)

---

## User's report
> Recommendation cards exist but lack confidence + impact as a hero. Action bar (Accept / Later / Detail / Simulate) is functional, not premium. No filter UX. Voting streak invisible.

## What "good" looks like

- **Confidence ring big** with impact bars (Before/After).
- **Sticky bottom action bar** — Accept / Later / Detail / Simulate.
- **C.O.R.E. detail view** — expandable card body.
- **Filter strip** — agent type, status, freshness, confidence range.
- **Voting streak indicator** — "12 accepted in a row / 3 declined in a row".
- **I-have-a-sense-of-urgency**: time-sensitive recs wear a quiet glow border.

## GitHub repos referenced

### Decision UX
- [WE-1] `Notion-Product-Design/notion-decision-cards` — open-source design pattern inspiration.
- [WE-2] `behavioural-economics-team/decisions` — academic patterns.
- [WE-3] `jxnblk/decision-tree` — card pattern library.

### Animation
- [WE-4] `framer-motion` — already in deps; for hero ring reveals.

### Skills
- [WE-5] `@product-thinking` (domain).

---

## The 6 fixes (execute in order)

### 1 · Confidence ring hero + impact bars
**Bug:** Confidence is a label ("85%"), not a ring. Impact is one number.

**Do:**
- Big circular confidence ring on the right of each card (Recharts `RadialBarChart` or hand-rolled SVG `<circle>`).
- Color shift OKLCH: success → bio-glow when ≥80%, amber when 50–80%, status-error when <50%.
- Impact: two horizontal bars (Before | After), labels readable at glance (`Concentration 22% → 12%`).

### 2 · Sticky bottom action bar (Accept / Later / Detail / Simulate)
**Bug:** Actions sit inline with the card body.

**Do:**
- Card-scoped action bar pinned to bottom of each card, with `position: sticky; bottom: 0`.
- 4 actions, each w/ icon (`IconCheck` Accept, `IconChevronDown` Later, `IconBrain` Detail, `IconDashboard` Simulate).
- Submit returns the selected action to the parent list state.

### 3 · C.O.R.E. detail expansion
**Bug:** Clicking "Details" shows a modal dump.

**Do:**
- Inline expansion of the card body — Clarify / Organize / Reason / Risks, each a labeled section.
- A "What could go wrong" callout with OKLCH-amber border.
- "What this assumes (Unknowns)" callout at the bottom.

### 4 · Filter strip (agent, status, confidence, freshness)
**Bug:** No filter UX. Long list with full scroll.

**Do:**
- Filter strip at the top of the list: agent chips (already exist in `RecommendationsList`), then `status`, `confidence range`, `freshness` (last 7d, 30d, all).
- Each filter is a `.seg` segmented control or chip stack.
- Persist to URL params (?agent=investment&status=newer:fresh).

### 5 · Voting streak indicator
**Bug:** No visible streak.

**Do:**
- A `.voting-streak` card in the list header: "12 accepted in a row / 0 declined · running".
- Streak breaks on a decline → reset to 0. Add a "skip" affordance for non-actionable recs.
- Compute from `/api/recommendations/votes/summary` client-side.

### 6 · Time-sensitive recs get a quiet glow border
**Bug:** Urgency is invisible.

**Do:**
- If `rec.expires_at` < 7 days AND `status === new`, add `box-shadow: 0 0 0 1px oklch(80% 0.12 60 / 0.5)` inner border + a tiny "Expires in 4d" badge.
- Update via `setInterval` once per minute.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--urgent`. **NO hex.**
2. **Accessibility** — `<button role="button">` everywhere, focus ring, screen reader announces confidence percent + impact.
3. **No new backend routes** — use existing `/api/recommendations`, `/api/recommendations/{id}/vote`.
4. **No new heavy deps.**
5. **Strict ≤ 10 files modified.**
6. **`@subagent-driven-development` mandatory.**
7. **Ponytail principle** — delete before adding.

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/RecommendationsDashboard.tsx src/components/RecommendationsList.tsx src/components/VoteWidget.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/04-recommendations.spec.ts`:
- Hero confidence ring renders
- Sticky action bar persists at bottom on scroll
- Filter strip narrows results
- Streak indicator updates after a vote

## Verification

1. Open `/recommendations` → confidence ring hero + impact bars render on every card.
2. Click "Detail" → inline expansion; no modal.
3. Apply filter → list narrows.
4. Vote on any card → streak updates; URL reflects filter state.
5. Lighthouse ≥ 90 perf / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
