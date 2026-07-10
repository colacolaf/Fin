# 17 — Data Refresh Pipeline & Market Data

## What & Why
Finnhub for market data. APScheduler for daily sync. News sentiment aggregation via agent-reach. Connector orchestration: Alpaca + Plaid + Finnhub. Staleness detection, cache invalidation, credential encryption. Per Data_refresh_pipeline.md.

## Files to Create / Modify
```
backend/
├── services/
│   ├── scheduler.py          # APScheduler setup + jobs
│   ├── refresh_gate.py       # Staleness detection per-source
│   ├── recalculation.py      # Post-refresh metric recalculation
│   ├── cache_invalidation.py # TTL-based cache, SWR pattern
│   └── retry_handler.py      # Exponential backoff, circuit breaker
├── routers/
│   └── data.py               # manual refresh, staleness status
├── integrations/
│   ├── finnhub.py            # Finnhub API client
│   └── alpaca_data.py        # Alpaca market data (add quotes endpoint)
└── models/
    └── refresh.py            # RefreshJob, StalenessReport
```

## Steps
1. `backend/services/scheduler.py` — APScheduler BackgroundScheduler with 4 jobs:
   - Alpaca quotes: every 15 min, Mon-Fri (paper trading available 24/7)
   - Finnhub quotes: hourly, Mon-Fri, market hours only
   - Plaid sync: daily 06:00 UTC
   - Debt snapshot: daily 06:05 UTC (5 min after Plaid)
   Job store: SQLite (survives restarts). coalesce=True, max_instances=1.
2. `backend/integrations/finnhub.py` — Finnhub client. fetch_quote(symbol) → price/change/%. fetch_candles(symbol, resolution='D') → OHLCV. Rate limit aware: 60 calls/min. Batch quotes for all held symbols.
3. `backend/services/refresh_gate.py` — staleness_gate(user_id, source, threshold_seconds). Check last_refresh timestamp. Skip if fresh. TTLs: alpaca=900s, finnhub=3600s, plaid=86400s, debts=86400s.
4. `backend/services/recalculation.py` — recalculate_pipeline(user_id, sources): portfolio_metrics (allocation%, concentration, beta) → DTI → retirement_readiness → write_user_context.
5. `backend/services/cache_invalidation.py` — TTL per domain. Stale-while-revalidate: serve cached → background refresh. Invalidate on: trade_executed, account_update, debt_updated, manual_refresh.
6. `backend/services/retry_handler.py` — Exponential backoff: 10s → 60s → 230s (max 5 min window). Jitter ±25%. Circuit breaker: open after 5 consecutive failures, half-open probe every 10 min.
7. `backend/models/refresh.py` — RefreshJob: source, last_refresh, status, next_scheduled. StalenessReport: source, staleness_seconds, threshold, quality_flag, agent_diagnosis.
8. `backend/routers/data.py` — POST /data/refresh (manual trigger, 1 per 60s rate limit). GET /data/staleness (current staleness report). GET /admin/scheduler/health (job status + circuit breaker state).
9. `data_quality_flags` — generate flags with agent_diagnosis. Stale → inject into user context. Agent reads flags, hedges recommendations. confidence_penalty: 0.15 on stale-data recommendations.
10. Wire into existing Alpaca + Plaid integrations. Unified connector orchestrator: resolve credentials → parallel calls → merge → invalidate caches → recalculate → emit event.
11. Playwright: trigger manual refresh, verify stale-while-revalidate pattern, check admin health endpoint shows jobs.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (credential encryption, audit logging)

## GitHub Repos Needed
- `agronholm/apscheduler` (Python task scheduler)
- `FinnhubStockAPI/finnhub-python` (official Python client)

## Edge Cases & Risks
- Rate limits exhausted → skip scheduled run, log quota flag, try next interval
- Credential decryption fails → circuit open immediately, alert, 0 retries for auth failures
- All sources stale → serve last known snapshot, flag EVERYTHING, agent warns prominently
- Market closed → skip Finnhub, use Alpaca only, mark data as "last close"
- Circuit breaker open → all requests short-circuit, status endpoint shows breaker state
- Recursion: refresh triggers recalculation triggers context update triggers… → once per refresh cycle, dedup by run_id

## Done When
- [ ] APScheduler running with 4 persistent jobs (Alpaca, Finnhub, Plaid, Debt)
- [ ] Finnhub client fetches quotes + candles for all held symbols, rate-limit aware
- [ ] Staleness gate skips fresh data, triggers stale data refreshes
- [ ] Recalculation pipeline: portfolio → DTI → retirement → user context
- [ ] Cache invalidation on trade, account update, debt change, manual refresh
- [ ] SWR pattern: serve stale, refresh in background
- [ ] Exponential backoff retry (3 attempts, 5 min window) + circuit breaker
- [ ] data_quality_flags with agent_diagnosis generated for stale/error states
- [ ] Manual refresh endpoint with 60s rate limit
- [ ] Admin health endpoint: job status + circuit breaker state
- [ ] Playwright: manual refresh, staleness report, admin health check
- [ ] Git: review diff, squash merge to main with `[17] Data refresh pipeline & market data`