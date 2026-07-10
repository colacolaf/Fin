# 04 — API Foundation & Router Skeleton

## What & Why
All FastAPI routers stubbed out. Error handling middleware. Rate limiting. CORS finalized. Frontend API client layer (typed fetch wrapper). Foundation for plans 05-19.

## Files to Create / Modify
```
backend/
├── routers/
│   ├── __init__.py
│   ├── auth.py           # move from backend/auth/router.py
│   ├── portfolio.py
│   ├── recommendations.py
│   ├── debt.py
│   ├── retirement.py
│   ├── execution.py
│   ├── memory.py
│   ├── integrations.py
│   └── settings.py
├── middleware/
│   ├── __init__.py
│   ├── error_handler.py
│   └── rate_limiter.py
├── main.py
frontend/
├── src/
│   └── api/
│       ├── client.ts
│       ├── auth.ts
│       ├── portfolio.ts
│       ├── recommendations.ts
│       ├── debt.ts
│       ├── retirement.ts
│       ├── execution.ts
│       ├── memory.ts
│       ├── integrations.ts
│       └── settings.ts
```

## Steps
1. Create `backend/routers/` with all 9 router files. Each has stub endpoints returning empty arrays or placeholder messages. Use APIRouter(prefix="/api/...", tags=["..."]).
2. Move auth router logic into `backend/routers/auth.py` (keep auth logic in `backend/auth/`, import from there).
3. `backend/middleware/error_handler.py` — catch all unhandled exceptions, return `{"detail": str(e), "type": type(e).__name__}`. Log full traceback server-side.
4. `backend/middleware/rate_limiter.py` — slowapi Limiter. 60 req/min default, 5 req/min for /auth/login and /auth/register. Expose X-RateLimit-Remaining header.
5. `backend/main.py` — include all routers. CORS: allow localhost:3000, localhost:5173. Middleware stack: CORS first, then rate limiter, then error handler.
6. `frontend/src/api/client.ts` — base fetch wrapper: prepend `VITE_API_URL` (default http://localhost:8000/api), attach Authorization header, handle 401 → redirect /login, parse errors.
7. Create all 9 frontend API modules. Each exports typed async functions matching backend endpoints. Use types from `@fin/shared`.
8. Add `shared/src/types.ts` — API response types: Portfolio, Holding, Recommendation, DebtAccount, RetirementProjection, etc.
9. Add `shared/src/constants.ts` — API route constants, agent IDs, default settings.
10. Verify: `curl localhost:8000/api/portfolio` returns 200 (or 401 if auth required)
11. Verify: All routers appear in FastAPI docs at `localhost:8000/docs`
12. Playwright: load frontend, check API client initializes without errors in console

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (rate limiting, error exposure)

## GitHub Repos Needed
- `laurents/slowapi` (rate limiting for FastAPI)

## Edge Cases & Risks
- Router prefix collisions → all use `/api/{resource}`. Verify no overlap.
- Error handler swallowing important exceptions → log full traceback, hide sensitive details from client.
- Rate limiter blocking legitimate use → burst allowance, X-RateLimit-Reset header.
- Shared package imports → verify npm workspaces resolve `@fin/shared` in Vite config.

## Done When
- [ ] All 9 routers appear in /docs with correct prefixes
- [ ] Error handler returns JSON for any unhandled exception
- [ ] Rate limiter returns 429 after exceeding limit (test: rapid curl)
- [ ] CORS allows frontend origin, blocks others
- [ ] Frontend API client types compile without errors
- [ ] `npm run build` (frontend) succeeds with shared package imports
- [ ] Playwright: frontend loads, no network errors to API
- [ ] Git: review diff, squash merge to main with `[04] API foundation & router skeleton`