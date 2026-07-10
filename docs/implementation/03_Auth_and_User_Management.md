# 03 — Auth & User Management

## What & Why
JWT auth with python-jose. Register, login, logout, refresh. Auth middleware on FastAPI. Frontend: login/register pages, AuthContext, protected routes. No OAuth yet — email/password only. YAGNI.

## Files to Create / Modify
```
backend/
├── auth/
│   ├── __init__.py
│   ├── jwt.py          # encode/decode JWT
│   ├── dependencies.py # get_current_user dependency
│   ├── schemas.py      # pydantic: RegisterRequest, LoginRequest, TokenResponse
│   └── router.py       # /auth/register, /auth/login, /auth/refresh
├── main.py             # add auth router, CORS middleware
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   └── api/
│       └── client.ts   # auth header + 401 handling
```

## Steps
1. `backend/auth/jwt.py` — create_access_token(user_id), decode_token(token), create_refresh_token. HS256. Expiry: access=15min, refresh=7d. Secret from config.SECRET_KEY.
2. `backend/auth/schemas.py` — RegisterRequest(email, password, name), LoginRequest(email, password), TokenResponse(access_token, refresh_token, user)
3. `backend/auth/router.py`:
   - POST /auth/register — hash password (bcrypt via passlib), create User, return tokens
   - POST /auth/login — verify password, return tokens
   - POST /auth/refresh — verify refresh token, issue new access token
   - GET /auth/me — return current user (requires auth)
4. `backend/auth/dependencies.py` — get_current_user: extract Bearer token, decode, fetch user. 401 if invalid/expired.
5. Wire router in `backend/main.py`, add CORS middleware (allow localhost:3000)
6. `frontend/src/api/client.ts` — fetch wrapper: attach Authorization header, handle 401 → redirect /login
7. `frontend/src/context/AuthContext.tsx` — user state, login/register/logout, isAuthenticated, loading. On mount: check localStorage token, call /auth/me.
8. `frontend/src/pages/Login.tsx` — email + password form. On submit → auth.login() → redirect dashboard.
9. `frontend/src/pages/Register.tsx` — email + password + name form → auth.register() → redirect wizard.
10. `frontend/src/components/ProtectedRoute.tsx` — not authenticated → redirect /login. Show spinner while loading.
11. Playwright: test register → login → protected route → logout flow.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (JWT storage, password hashing, token refresh)
- `impeccable` (login/register forms)
- `ui-animation` (form transitions)

## GitHub Repos Needed
- `mpdavis/python-jose` (JWT lib)

## Edge Cases & Risks
- Token in localStorage → XSS vulnerable. Acceptable for MVP. Mitigation: CSP headers, httpOnly cookie Phase 2.
- Refresh token rotation → invalidate old refresh token on use.
- Password strength → min 8 chars, 1 uppercase + 1 number. Validate backend AND frontend.
- Duplicate email → 409 Conflict, frontend shows "Email already registered"
- Rate limiting on login → plan 04 covers this

## Done When
- [ ] POST /auth/register creates user, returns JWT tokens
- [ ] POST /auth/login validates credentials, returns tokens
- [ ] POST /auth/refresh issues new access token
- [ ] GET /auth/me returns user data for authenticated requests
- [ ] Protected routes reject without token (401)
- [ ] Frontend: register → auto-login → redirect. Login → redirect. Logout → clear tokens.
- [ ] Passwords bcrypt-hashed in DB (never plaintext)
- [ ] Playwright: register + login + protected route + logout test passes
- [ ] Git: review diff, squash merge to main with `[03] Auth & user management`