# Community Voting & Benchmarks

**Version:** 1.1 | **Status:** Draft | **Phase:** 4 (per `docs/Features_reccomendations`)

## Overview

Opt-in anonymous aggregation of recommendation quality across all Fin users. Users see how their agent's recommendations compare to community benchmarks. No PII, no portfolio data — only anonymized vote patterns and confidence scores. This is the last major feature phase, building on the voting system.

Reference: `docs/Features/Voting_and_feedback_system.md` (prerequisite), `docs/Features_reccomendations` (Phase 4 mention)

## What Gets Shared (Opt-In Only)

| Data shared | Data NOT shared |
|-------------|-----------------|
| Vote outcome (accept/reject/defer) | User ID, name, email |
| Agent type (investment/debt/retirement) | Portfolio value, holdings |
| Confidence score (overall + sub-scores) | Debt amounts, income |
| Recommendation category (rebalance, payoff, contribution) | Location, age |
| Time to execute (days, anonymized) | Any PII |
| Anonymized user cohort tag (e.g., "cohort_balanced_30-45") | Raw recommendation text |

## Cohort Design

**3-axis broad bucketing** for MVP. Fine-grained cohorts added if user base exceeds 10,000.

| Axis | Buckets |
|------|---------|
| Risk tolerance | Conservative, Balanced, Growth, Aggressive |
| Age decade | 18-29, 30-39, 40-49, 50-59, 60+ |
| Income tercile | Lower third, Middle third, Upper third (relative to all opted-in users) |

Example cohort tag: `"Balanced | 30-39 | Middle income"`

### Rationale
- 3 axes × 4-5 buckets = ~60 possible cohorts. Statistically meaningful, anonymity-preserving.
- Broad buckets protect against re-identification better than fine-grained (age 35-40 + CA + $80-120k could narrow to single digits).
- Income terciles (relative) avoid exposing absolute income while still providing meaningful peer grouping.
- ponytail: add location/state axis in phase 5 if cohort sizes allow.

## Aggregation Pipeline

```
User votes → Local DB
    │
    ├─ If opted in: Anonymize + hash → Local aggregate
    │
    └─ Weekly sync → Community aggregation server
         │
         ├─ Validate: min cohort size ≥ 10 (k-anonymity)
         ├─ Aggregate: per-cohort, per-agent-type stats
         └─ Publish: benchmarks available to all opted-in users
```

### Cohort Minimums
- No cohort published with < 10 users (k-anonymity, k=10)
- If cohort too small, merge up to parent cohort (drop finest axis: income → age → risk)
- Minimum k=10 is sufficient for non-sensitive aggregate stats; financial data sensitivity is mitigated by stripping all PII and dollar amounts before upload

### Stats Published

| Benchmark | Calculation |
|-----------|-------------|
| Community acceptance rate (per agent) | avg acceptance rate across cohort |
| Community execution rate | avg execution rate across cohort |
| Avg confidence score (overall) | mean of overall confidence |
| Avg confidence sub-scores | mean of reasoning/data/alignment |
| Top recommendation categories | most common recommendation types |
| Decision speed distribution | P50, P75, P90 days to execute |

## User-Facing Benchmarks

```
┌─────────────────────────────────────────────────┐
│ 📊 Your Investment Stats vs Community           │
│                                                  │
│ Acceptance Rate:   65%  ████████░░  (Comm: 58%) │
│ Execution Rate:    80%  █████████░  (Comm: 72%) │
│ Avg Confidence:    82   ████████░░  (Comm: 76)  │
│ Decision Speed:    4.2d ███░░░░░░░  (Comm: 6.1d)│
│                                                  │
│ Your cohort: Balanced | 30-39 | Middle (1,247)   │
│                                                  │
│ [Opt Out]  [View Details]                        │
└─────────────────────────────────────────────────┘
```

## Privacy Architecture

### Anonymization
1. Strip all PII before leaving local machine
2. Hash user ID with per-deployment salt (not reversible)
3. Assign to cohort based on binned attributes (risk tolerance, age decade, income tercile)
4. Only aggregate stats leave local machine — never raw votes, never individual data

### Opt-In Flow
1. Default: OFF. User explicitly enables in Settings.
2. Clear language: "Share anonymous recommendation stats to see how you compare to similar investors."
3. **All-or-nothing opt-in** per MVP. User shares stats for all three agents or none. Per-agent granularity adds UI complexity and confusion ("why can't I see debt benchmarks?"). ponytail: add per-agent in phase 5 if users request it.
4. Revocable: Opt-out deletes all previously shared data from server.
5. Data deletion: Server-side purge within 48h of opt-out, verified by audit log.

### Why all-or-nothing instead of per-agent?
- Per-agent opt-in creates fragmented benchmarks (some users share investment only, some debt only)
- UI complexity: three toggles instead of one, users confused about what they're missing
- ponytail: simpler UX, cleaner data. Add per-agent if >20% of users request it.

### Security Review (OWASP)

| Concern | Mitigation |
|---------|------------|
| Re-identification via small cohorts | k-anonymity minimum (k=10); merge up if below threshold |
| Inference of portfolio size from confidence | Confidence scores don't encode portfolio value |
| Server breach exposing raw votes | Server never receives raw votes, only aggregates |
| Malicious user poisoning benchmarks | Rate limiting, outlier detection (z-score > 3 discarded) |
| Opt-out data retention | Hard delete within 48h, verified by audit log |
| Cohort inference attack (combining multiple benchmarks to narrow identity) | Differential privacy: add ±2% noise to published stats |

## Server Architecture

**Phase 1: Synthetic baselines (no server).** MVP ships with hardcoded benchmark ranges sourced from public financial behavior research. Users see their stats alongside research-backed typical ranges. No data leaves their machine. No server to maintain.

**Phase 2: Central server (when user base > 100 opted-in).** Lightweight FastAPI service. Weekly aggregate upload. The jump from synthetic to real benchmarks only matters when there are enough users for statistically meaningful cohorts.

### Why synthetic first?
- Ships immediately with zero server infrastructure
- No privacy concerns (nothing leaves the machine)
- Research-backed baselines are good enough for early users: "Typical Balanced investors accept 50-65% of robo-advisor recommendations" (based on Vanguard/Schwab behavioral studies)
- ponytail: don't build a server for 10 users. Build it when 100+ users are opted in and synthetic baselines feel fake.

### Synthetic Baseline Examples

| Metric | Conservative | Balanced | Growth | Aggressive |
|--------|-------------|----------|--------|------------|
| Acceptance rate | 45-60% | 50-65% | 55-70% | 60-75% |
| Execution rate | 55-70% | 60-75% | 65-80% | 70-85% |
| Avg decision speed | 5-8 days | 4-7 days | 3-6 days | 2-5 days |

Sources: Vanguard "How America Saves", Schwab "Modern Wealth Survey", FINRA Investor Education Foundation studies. Stale after 2 years — refresh from latest research annually.

### Phase 2: Central Server Spec
```
Fin Client (local)                    Community Server (FastAPI)
─────────────────                    ──────────────────────────
                                     POST /api/community/upload
Local aggregate JSON ──────────────→ Validate + store aggregate
                                     │
                                     ├─ Recalculate cohort stats
                                     ├─ Apply differential privacy noise (±2%)
                                     └─ Publish updated benchmarks

                                     GET /api/community/benchmarks?cohort=X
Client polls weekly ←─────────────── Return aggregated stats
```

## Sync Frequency

**Weekly** for both synthetic refresh checks and (future) server sync.

Rationale:
- Daily is overkill — behavioral patterns don't shift meaningfully in 24 hours
- Weekly keeps benchmarks reasonably fresh without excessive network calls
- On-demand "Refresh Benchmarks" button available if user wants latest

## Benchmark Quality Metrics

Track benchmark usefulness over time:

| Metric | Phase 1 Target | Phase 2 Target |
|--------|---------------|----------------|
| Cohort coverage | N/A (synthetic) | >80% of opted-in users in cohorts with k≥10 |
| Benchmark refresh frequency | Annual (research refresh) | Weekly |
| Outlier filtering accuracy | N/A | <1% false positive rate |
| Opt-in rate | Tracked, not targeted | Tracked, not targeted (privacy-first) |

## Edge Cases

| Case | Behavior |
|------|----------|
| User is only person in cohort | Phase 1: synthetic baseline shown. Phase 2: merge up to parent cohort. |
| User opts out mid-benchmark cycle | Remove from next aggregation, delete existing data within 48h |
| Massive vote pattern change (e.g., user was conservative, now aggressive) | Cohort reassignment on next sync (risk tolerance change triggers re-bucketing) |
| Server down (Phase 2) | Client shows last-known benchmarks with "Updated X days ago" + synthetic fallback |
| Malicious bulk voting detected | Rate limit, flag account, exclude from benchmarks |
| All cohorts below k=10 (Phase 2, early days) | Show synthetic baselines until real cohorts fill; don't show "not enough data" |

## Verification

- [ ] Opt-in flow: default OFF, user enables, synthetic benchmarks display immediately
- [ ] Synthetic baselines match research sources (audit annually)
- [ ] Phase 2: Anonymization — no PII in uploaded aggregate (audit the JSON payload)
- [ ] Phase 2: k-anonymity — cohorts with <10 users suppressed or merged up
- [ ] Phase 2: Opt-out — data deleted from server within 48h
- [ ] Phase 2: Differential privacy noise applied (±2%)
- [ ] Benchmarks display correctly vs. user's stats across all three agent types
- [ ] Server downtime handled gracefully (synthetic fallback)

## Resolved Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cohort granularity | 3-axis broad: risk tolerance + age decade + income tercile | Statistically meaningful, anonymity-preserving, ~60 possible cohorts |
| Per-agent opt-in | All-or-nothing | Simpler UX, cleaner data; add per-agent if users request it |
| Server infrastructure | Phase 1: synthetic baselines (no server). Phase 2: central FastAPI server when >100 users | Ships immediately with zero infra; real benchmarks only matter at scale |
| Sync frequency | Weekly | Behavior doesn't shift daily; keeps benchmarks fresh without excess calls |
| Minimum viable cohort | k=10 | Sufficient for non-sensitive aggregate stats stripped of PII and dollar amounts |