# 15 — Community Voting & Benchmarks

## What & Why
Upstash Redis for rate-limited voting. Recommendation voting (agree/disagree). Leaderboards. Anonymous benchmark comparisons. Per Community_voting_and_benchmarks.md and Voting_and_feedback_system.md. owasp-security-check for voting integrity.

## Files to Create / Modify
```
backend/
├── routers/
│   └── community.py          # voting + leaderboard endpoints
├── services/
│   ├── voting.py             # vote counting + rate limiting
│   └── benchmarks.py         # anonymous peer comparisons
├── integrations/
│   └── upstash.py            # Upstash Redis client
frontend/
├── src/
│   ├── components/
│   │   └── community/
│   │       ├── VoteWidget.tsx
│   │       ├── Leaderboard.tsx
│   │       ├── BenchmarkComparison.tsx
│   │       └── CommunityFeed.tsx
│   └── api/
│       └── community.ts
```

## Steps
1. `backend/integrations/upstash.py` — Upstash Redis client. rate_limit(key, max_requests, window_secs) via Redis INCR + EXPIRE. vote(rec_id, user_id, direction). get_votes(rec_id).
2. `backend/services/voting.py` — vote_on_recommendation(recommendation_id, user_id, direction: agree/disagree). Rate limit: 20 votes/hour per user. Store aggregate counts. Prevent duplicate votes (one per rec per user).
3. `backend/services/benchmarks.py` — anonymize portfolio data. Calculate percentile rankings (portfolio size, returns, savings rate, debt ratio). Return user's percentile vs community. No PII in response.
4. `backend/routers/community.py` — POST /community/vote, GET /community/votes/:rec_id, GET /community/leaderboard (top voted recommendations), GET /community/benchmarks (anonymous comparisons).
5. `VoteWidget.tsx` — Agree / Disagree buttons. Show current vote counts. Thumbs up/down icons. Disabled state after voting.
6. `Leaderboard.tsx` — top 10 most-agreed recommendations. Cards with vote counts, agent, confidence. "See what others are acting on."
7. `BenchmarkComparison.tsx` — "You vs Community" cards: portfolio size percentile, returns percentile, savings rate percentile, debt ratio percentile. Privacy notice: "All data anonymous".
8. `CommunityFeed.tsx` — stream of recent recommendations + votes. Real-time-ish (poll every 30s). Filter by agent.
9. owasp-security-check: rate limiting prevents abuse, no PII in benchmark responses, vote tampering prevention, input sanitization on all endpoints.
10. Playwright: vote on recommendation, verify count updates, rate limit triggers at 21st vote, benchmark comparison renders.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (voting integrity, rate limiting, data anonymization)

## GitHub Repos Needed
- `upstash/upstash-redis` (serverless Redis)

## Edge Cases & Risks
- No community data (new app) → show "Building community..." placeholder, don't show empty percentiles
- User with extreme outlier data → cap percentiles at 1-100, flag "top 1%" etc.
- Vote manipulation → rate limiting per user + IP, duplicate vote prevention
- Privacy concerns → all benchmarks fully anonymous, no opt-out needed (it's opt-in by design)
- Upstash Redis connection lost → graceful degradation, voting unavailable but app works
- High-traffic voting on popular rec → Redis handles it, but cache read counts in frontend

## Done When
- [ ] Upstash Redis client connected, rate limiting functional
- [ ] Vote endpoint: one vote per user per recommendation, 20 votes/hour cap
- [ ] Agree/disagree counts returned per recommendation
- [ ] Leaderboard shows top-voted recommendations
- [ ] Benchmark comparison shows user percentiles (portfolio, returns, savings, debt)
- [ ] No PII in any community endpoint responses
- [ ] owasp-security-check: rate limiting, no PII, input sanitized
- [ ] Playwright: vote flow, rate limit test, benchmark display
- [ ] Git: review diff, squash merge to main with `[15] Community voting & benchmarks`