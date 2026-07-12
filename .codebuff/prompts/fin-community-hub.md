# Phase 29 — Community Hub (pasteable brief)

You are a senior frontend engineer finishing **Fin**. Execute the surgical pass below to elevate the Community Dashboard from a sterile leaderboard to a hub that balances social proof with strong anonymity & percentile-based UX. **≤10 files modified.**

**Skills referenced**: `@impeccable` `@ui-animation` `@emil-design-eng` `@frontend-design` `@community-design` (domain — Strava / levels.fyi / Khan Academy-style collective signal UX)

**Hard gates:**
- `@subagent-driven-development`
- `@ponytail`
- `@code-review-and-quality`

**Read the spec IN THIS ORDER (mandatory):**
1. `docs/Features/Community_voting_and_benchmarks.md`
2. `frontend/src/pages/CommunityDashboard.tsx`
3. `frontend/src/components/Leaderboard.tsx`
4. `frontend/src/components/BenchmarkComparison.tsx`
5. `frontend/src/styles/ocean.css`
6. `.codebuff/prompts/{fin-multi-agent-stage,fin-execution-flow}.md`
7. `.codebuff/prompts/fin-community-hub.md` (this file)

---

## User's report
> Leaderboard and benchmarks exist but feel sterile. No percentile bands — just absolute numbers. Anonymity isn't called out. No trending strategies. The community aspect is "look at anonymized scores", not "you're 23rd percentile — here's what to do".

## What "good" looks like

- **Percentile bands on benchmarks** — "You're in the 78th percentile for execution rate" (anchor inspiration: levels.fyi, Strava's privacy zones).
- **Anonymity indicator prominent** — visible reassurance that data is locked.
- **Trending strategies cards** — what's moving in the community right now.
- **Privacy toggle** — explicit join/leave.
- **Empty / community-onboarding** — "Join anonymously to see your percentile".

## GitHub repos referenced

### Privacy / community UX
- [WE-1] Strava's `privacy zones` — reference for revealing only the percentile, not the location.
- [WE-2] levels.fyi — reference for percentile bands + compensation buckets.
- [WE-3] `kaggle/kaggle-api` — anonymized leaderboard UX.

### Data viz
- [WE-4] `recharts/recharts` — percentile-band overlay.
- [WE-5] `d3/d3-scale` — already in deps; percentile scale.

### Skills
- [WE-6] `@community-design` (domain).

---

## The 6 fixes (execute in order)

### 1 · Percentile bands on benchmarks
**Bug:** `BenchmarkComparison.tsx` shows absolute percentages, no percentile.

**Do:**
- A "percentile band" visual (Recharts `BarChart` with `error bars` or hand-rolled SVG track).
- "You're in the 78th percentile" hero label with OKLCH-glow.
- User's exact position dotted on the band.
- Comparison: "Better than 78% of the anonymized community" copy.

### 2 · Anonymity indicator prominent
**Bug:** Anonymity is mentioned in copy but not visually reinforced.

**Do:**
- A `.anonymity-pill` at the top: `🛡 Anonymous · data is hashed & bucketed · never linked to your account`.
- Hover dropdown: explain `k-anonymity ≥ 5` (no cohort smaller than 5 reports).
- OKLCH-shield icon for trust.

### 3 · Trending strategies cards
**Bug:** No social signal of "what's working now".

**Do:**
- A `.trending-strategies` row at the bottom: 3-5 cards, each with:
  - Strategy shortcut name (e.g. "Tax-loss harvest — weekly")
  - 7-day delta (acceptance %)
  - Inflated adoption count
  - "Try it" CTA → links to the backtest strategy template

### 4 · Privacy toggle (explicit opt-in)
**Bug:** Currently the user is opted-in implicitly.

**Do:**
- An `opt-in` toggle in the page header.
- Off by default. Copy: "Contribute your anonymized metrics to the community pool to see percentile comparisons".
- On click → confirms with a card: "Once turned on, only bucket-level percentiles will be revealed to you".
- Persist to `/api/community/opt-in`.

### 5 · Empty / community-onboarding state
**Bug:** When community is empty or user opted out, page is empty.

**Do:**
- Three onboarding cards (mirror Phase 22): "Opt-in to compare", "See top contributors", "Read privacy policy".
- Cards route to toggle / leaderboard / privacy doc.
- Hero copy: "The community is more useful when you opt-in" + a CTA card.

### 6 · Privacy-first copy editor
**Bug:** No anonymization guarantees surfaced.

**Do:**
- A small `.privacy-policy-card` below the toggle:
  - "We never sell or share data"
  - "All contributions are bucketed (k-anonymity ≥ 5)"
  - "You can delete your data anytime"
- Link to a `/privacy` page if it exists; else inline.

---

## Constraints — NON-NEGOTIABLE

1. **OKLCH palette only** — extend with `--privacy-trust`. **NO hex.**
2. **Accessibility** — toggle has role="switch", aria-checked. Anonymity pill is dismissable.
3. **No new backend routes** — use existing `/api/community/*` (admin/refresh-benchmarks, leaderboard). If privacy toggle needs an endpoint, **defer** — keep toggle local with a TODO to wire.
4. **No new heavy deps.**
5. **Strict ≤ 10 files modified.**
6. **`@subagent-driven-development` mandatory.**

---

## Code checkers

```bash
cd frontend && \
  npx tsc --noEmit && \
  npx oxlint src/pages/CommunityDashboard.tsx src/components/Leaderboard.tsx src/components/BenchmarkComparison.tsx src/styles/ocean.css && \
  npx vitest run --reporter=dot
```

E2E: extend `frontend/e2e/specs/08-community.spec.ts`:
- Anonymity pill visible
- Toggle on → percentile hero updates
- Trending row renders ≥ 3 cards
- Privacy card lists 3 guarantees

## Verification

1. Open `/community` → anonymity pill, percentile hero.
2. Toggle opt-in → sees percentile band overlay.
3. Trending row visible.
4. Lighthouse ≥ 90 perf / 100 a11y.

**Visual continuity — non-negotiable:** match the Phase 20 (Obsidian Memory) and Phase 21 (Settings Pro) visual language. Re-read `frontend/src/styles/ocean.css` and `frontend/src/components/layout/Icons.tsx` for any new glyphs.

<task>Now go.</task>
