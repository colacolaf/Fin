# Subagent 5: Security Audit & Hardening

## Scope
Execute the full `owasp-security-check` and `security-review` audit across the entire backend (FastAPI) and frontend (React). Find and fix vulnerabilities, then verify fixes don't regress.

## Skills to Use
- **`owasp-security-check`**: OWASP Top 10 audit — injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging
- **`security-review`**: Systematic security review with confidence-based reporting
- **`code-review-and-quality`**: Verify fixes maintain code quality
- **`ponytail-review`**: Ensure security fixes aren't over-engineered

## MCP Servers
- **exa** (`https://mcp.exa.ai/mcp`): Look up latest CVEs for dependencies, OWASP cheat sheets
- **playwright** (`@playwright/mcp`): Verify frontend security headers, CSP, cookie attributes

## GitHub References
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP Cheat Sheet Series**: https://cheatsheetseries.owasp.org/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **Python-JOSE (JWT)**: https://python-jose.readthedocs.io/
- **Fernet (cryptography)**: https://cryptography.io/en/latest/fernet/
- **SQLAlchemy injection prevention**: https://docs.sqlalchemy.org/en/20/core/sqlelement.html

## Backend Files to Audit
```
backend/
├── main.py                         # App configuration, CORS, middleware
├── config.py                       # Secrets, env vars
├── database.py                     # DB connection
├── auth/
│   ├── jwt.py                      # Token generation/validation
│   ├── router.py                   # Login/register endpoints
│   ├── schemas.py                  # Pydantic validation
│   └── dependencies.py             # Auth dependency injection
├── routers/
│   ├── auth.py, portfolio.py, recommendations.py
│   ├── debt.py, retirement.py, execution.py
│   ├── community.py, backtest.py, data.py
│   ├── integrations.py, memory.py, orchestration.py, settings.py
├── services/
│   ├── input_sanitizer.py          # Input validation
│   ├── structured_output.py        # LLM output parsing
│   ├── confidence.py, recommendation_engine.py
│   ├── backtest_engine.py, benchmarks.py
│   └── (all other services)
├── models/                         # SQLAlchemy models
├── middleware/
│   ├── error_handler.py
│   └── rate_limiter.py
└── utils/
    └── encryption.py               # Fernet encryption
```

## Frontend Files to Audit
```
frontend/src/
├── context/AuthContext.tsx          # Token storage, auth state
├── api/                            # All API client functions
├── hooks/                          # useOnlineStatus, useOfflineQueue
├── services/                       # sync-queue, offline-cache, network-status
├── db.ts                           # IndexedDB/localStorage usage
└── components/                     # XSS vectors in rendered content
```

## Tasks

### 1. Dependency Vulnerability Scan
- [ ] Run `pip-audit` or `safety check` on `backend/pyproject.toml` dependencies
- [ ] Run `npm audit` on `frontend/package.json` dependencies
- [ ] Fix any HIGH/CRITICAL vulnerabilities (upgrade or patch)
- [ ] Document any accepted risks (low severity, no feasible fix)

### 2. Authentication & Session Management (OWASP A2, A7)
- [ ] Audit JWT implementation in `backend/auth/jwt.py`:
  - Token expiration: max 15 min access, 7 day refresh
  - Algorithm: verify it's pinned to specific algo (not `none` attack)
  - Secret key: minimum 256-bit, loaded from env not hardcoded
- [ ] Audit login/register in `backend/auth/router.py`:
  - Rate limiting on login (prevent brute force)
  - Password complexity enforced server-side
  - Generic error messages (no "user exists" leak)
- [ ] Audit `frontend/src/context/AuthContext.tsx`:
  - Tokens stored in httpOnly cookie vs localStorage (current: localStorage)
  - Token refresh flow handles expiry gracefully
  - Logout clears all stored credentials
- [ ] Verify refresh token rotation

### 3. Authorization & Access Control (OWASP A1, A5)
- [ ] Audit `backend/auth/dependencies.py`:
  - Every protected endpoint requires valid auth
  - User-scoped data: verify user can only access own data (no IDOR)
  - Admin-only endpoints have role check
- [ ] Test every router endpoint for auth bypass:
  - Missing token → 401
  - Expired token → 401
  - Wrong user's data → 403 or 404 (don't reveal existence)
- [ ] Verify CORS in `backend/main.py`: restrictive origins, not wildcard in production

### 4. Injection Prevention (OWASP A3)
- [ ] SQL Injection: verify all DB queries use parameterized SQLAlchemy ORM (no raw SQL)
- [ ] NoSQL Injection: if any JSON queries, verify they're sanitized
- [ ] Command Injection: if any `subprocess` calls, verify input sanitization
- [ ] LLM Prompt Injection: audit `backend/agents/prompts/` for injection hardening
- [ ] Audit `backend/services/input_sanitizer.py` for comprehensive coverage

### 5. Sensitive Data Exposure (OWASP A3)
- [ ] Audit `backend/utils/encryption.py`: Fernet key management, rotation
- [ ] Audit `backend/config.py`: no secrets hardcoded, all from env
- [ ] Verify `.env.example` doesn't contain real secrets
- [ ] Audit API responses: no passwords, tokens in response body (except initial auth)
- [ ] Verify database: sensitive fields encrypted at rest (Fernet for API keys)
- [ ] Check logging: no sensitive data in logs (passwords, tokens, PII)

### 6. Security Misconfiguration (OWASP A6)
- [ ] Verify HTTPS enforced in production (HSTS header)
- [ ] Security headers audit:
  - Content-Security-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 0 (deprecated, CSP covers)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
- [ ] CORS: verify allowed origins list is explicit, not `*`
- [ ] Verify debug mode disabled in production
- [ ] Verify no default credentials (admin/admin) in seed data

### 7. XSS Prevention (OWASP A7)
- [ ] Frontend: verify React's default XSS protection isn't bypassed with `dangerouslySetInnerHTML`
- [ ] Frontend: verify user-generated content is sanitized before render
- [ ] Backend: verify all user input reflected in responses is escaped
- [ ] Check URL parameters reflected in DOM

### 8. Rate Limiting & DoS Prevention (OWASP A4, new)
- [ ] Audit `backend/middleware/rate_limiter.py`:
  - Login: 5 attempts per minute per IP
  - API: 100 req/min per user general
  - LLM endpoints: 10 req/min (expensive)
- [ ] Verify rate limit headers returned (X-RateLimit-*)
- [ ] Check for unbounded operations: no pagination on list endpoints, large file uploads

### 9. CSRF Protection
- [ ] Since using JWT in localStorage (not cookie), verify SameSite cookie attributes
- [ ] If API is cookie-based at any point, add CSRF token validation
- [ ] Verify state-changing operations (POST/PUT/DELETE) require valid auth

### 10. Logging & Monitoring
- [ ] Verify all auth events logged (login success/failure, password change)
- [ ] Verify security events logged (rate limit hits, 403s, data access)
- [ ] Verify logs don't contain PII or secrets
- [ ] Verify error handler in `backend/middleware/error_handler.py` doesn't leak stack traces

## Output Requirements
- Security audit report in `docs/security-audit-phase19.md` (or `.superpowers/sdd/`)
- Each finding: severity (Critical/High/Medium/Low), location, description, fix
- All Critical/High findings fixed with code changes
- All Medium findings either fixed or documented with acceptance rationale
- No new vulnerabilities introduced by fixes

## Done Criteria
- `pip-audit` or `safety check` — 0 HIGH/CRITICAL
- `npm audit` — 0 HIGH/CRITICAL (with `.npmrc` overrides documented for accepted risks)
- All OWASP Top 10 categories reviewed and documented
- Security headers verified via browser DevTools or `curl -I`
- JWT implementation audited and hardened
- Input sanitization verified across all user-input endpoints