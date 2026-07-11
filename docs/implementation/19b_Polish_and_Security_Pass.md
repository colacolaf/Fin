# 19b — Polish & Security Pass

## What & Why
Second half of Phase 19. After the E2E suite is green (19a), apply impeccable UI polish, ui-animation motion audit, and OWASP security audit. This is the final production-readiness pass — every pixel, every animation, every security boundary.

## Prerequisites
- Phase 19a must be complete (all tests green, Lighthouse passing)
- This phase depends on all UI components from phases 1-18 existing

## Scope: Parts C + D from Phase 19

### Part C: Polish Pass (impeccable + ui-animation)
- Ocean dashboard polish (Fin animation, sidebar transitions, loading states, empty states)
- Typography & spacing audit (4px grid, font hierarchy, color contrast)
- Motion audit (page transitions, card hover, count-up, typewriter, toast animations)
- Responsive audit (320px → 2560px, all pages)

### Part D: Security Audit (owasp-security-check)
- Auth security (JWT expiry, refresh rotation, CSRF, secure cookies)
- Injection prevention (SQL, NoSQL, command)
- XSS protection (CSP headers, output encoding)
- Credential management
- Rate limiting verification
- CORS configuration
- Dependency audit

## Files to Modify

```
frontend/src/
├── App.tsx                          (MODIFY — page transitions)
├── App.css                          (MODIFY — global polish, typography, motion tokens)
├── components/
│   ├── Ocean.tsx / FinAnimation     (MODIFY — smooth sine-wave, scroll-responsive)
│   ├── Sidebar.tsx                  (MODIFY — transitions, backdrop blur)
│   ├── LoadingSkeleton.tsx          (MODIFY — shimmer effect)
│   ├── EmptyState.tsx               (MODIFY — illustrations, helpful copy)
│   ├── Toast.tsx / ToastContainer   (MODIFY — slide-in-right, auto-dismiss)
│   ├── CountUp.tsx                  (CREATE — animated number transitions)
│   └── TypewriterText.tsx           (CREATE — agent streaming effect)
├── pages/
│   ├── Dashboard.tsx                (MODIFY — polish)
│   ├── Portfolio.tsx                (MODIFY — polish)
│   ├── Debt.tsx                     (MODIFY — polish)
│   ├── Retirement.tsx               (MODIFY — polish)
│   ├── BacktestDashboard.tsx        (MODIFY — polish)
│   ├── CommunityDashboard.tsx       (MODIFY — polish)
│   ├── ExecutionDashboard.tsx       (MODIFY — polish)
│   └── Settings.tsx                 (MODIFY — polish)
├── index.html                       (MODIFY — CSP headers, meta tags)
└── vite.config.ts                   (MODIFY — CSP plugin if needed)

backend/
├── main.py                          (MODIFY — CSP middleware, CORS tighten)
├── middleware/
│   ├── rate_limiter.py              (MODIFY — verify all limits)
│   └── error_handler.py             (MODIFY — security hardening)
├── auth/
│   ├── jwt.py                       (MODIFY — expiry audit, rotation)
│   └── dependencies.py              (MODIFY — CSRF checks)
└── pyproject.toml                   (MODIFY — dependency audit fixes)

docs/
└── security/
    └── audit-report.md              (CREATE — OWASP findings & remediations)
```

## Steps

### Step 1: Impeccable UI Polish
1. Ocean Dashboard Polish:
   - Fin animation: smooth sine-wave oscillation using CSS transform + requestAnimationFrame
   - Responsive to scroll position (parallax depth effect)
   - Sidebar: 200ms ease-out transition, backdrop-filter: blur(8px)
   - Loading states: shimmer skeleton with gradient animation, not spinners
   - Empty states: SVG illustrations + helpful copy ("Connect Alpaca to see your portfolio" with fish graphic)

2. Typography & Spacing:
   - Enforce 4px vertical rhythm grid via CSS custom properties
   - Font hierarchy: headings = 2× body size, labels = 0.875× body
   - Color contrast audit: all text ≥ 4.5:1 on backgrounds
   - Consistent spacing tokens: --space-xs(4px) through --space-3xl(48px)

3. Motion Audit:
   - Page transitions: 150ms fade + 50px translateY slide-up (framer-motion AnimatePresence)
   - Card hover: `transform: translateY(-2px)` + `box-shadow` elevation increase, 200ms ease
   - Number changes: animated count-up component using requestAnimationFrame
   - Agent streaming: typewriter effect with blinking cursor component
   - Toast notifications: slide-in-right 300ms spring, auto-dismiss 5s with progress bar
   - Respect `prefers-reduced-motion: reduce` — disable all animations

4. Responsive Audit:
   - Test every page at 320px, 768px, 1024px, 1440px, 2560px
   - Table layouts → stacked card layouts on mobile
   - Touch targets ≥ 44px (finger-friendly)
   - No horizontal scroll anywhere
   - Mobile navigation: bottom tab bar or hamburger

### Step 2: Motion Components
5. Create `CountUp.tsx`:
   - Animates number from 0 to target using easing
   - Handles currency, percentages, integers
   - Uses requestAnimationFrame, not setInterval
   - Respects reduced-motion

6. Create `TypewriterText.tsx`:
   - Character-by-character reveal for agent streaming
   - Blinking cursor at end
   - Configurable speed (fast for streaming)
   - Pause/resume for live WebSocket data

7. Add `AnimatePresence` wrapper in `App.tsx` for page transitions
   - Each route child gets fade+slide-up on enter, fade on exit

### Step 3: OWASP Security Audit
8. Auth Security:
   - Verify JWT expiry: access 15min, refresh 7d with rotation
   - Verify refresh token rotation (old token invalidated on use)
   - Add CSRF token for state-changing requests
   - Verify cookies: httpOnly, secure, SameSite=Strict

9. Injection Prevention:
   - Audit all SQL queries: parameterized only (SQLAlchemy ORM)
   - Audit NoSQL: no user input in raw queries
   - Audit command execution: none, or strict allowlist

10. XSS Protection:
    - Set CSP header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.alpaca.markets https://finnhub.io`
    - Verify React's built-in XSS (no dangerouslySetInnerHTML without sanitization)
    - Verify DOMPurify or eqv for any raw HTML rendering

11. Credential Management:
    - Verify encryption at rest for API keys (AES-256-GCM)
    - Verify key material only in environment variables, never in code or logs
    - Verify audit log for sensitive operations

12. Rate Limiting:
    - Login: 5 attempts/minute/IP
    - Registration: 3/hour/IP
    - Voting: 20 votes/hour/user
    - Data refresh: 1/minute/user
    - All POST endpoints have rate limits

13. CORS:
    - Strict origin list (localhost:5173 dev, production domain)
    - No wildcard `*`
    - Credentials: true only for whitelisted origins

14. Dependency Audit:
    - `cd frontend && npm audit --production` → 0 critical/high
    - `cd backend && pip-audit` → 0 critical/high
    - Document any false positives

15. Security Report:
    - Create `docs/security/audit-report.md`
    - Document all findings, severity, remediation
    - Document false positives with justification

### Step 4: Global CSS Tokens
16. Update `App.css` with design tokens:
    ```css
    :root {
      --space-unit: 4px;
      --space-xs: 4px;   --space-sm: 8px;   --space-md: 16px;
      --space-lg: 24px;  --space-xl: 32px;   --space-2xl: 40px;  --space-3xl: 48px;
      --font-body: 1rem;  --font-label: 0.875rem;  --font-h1: 2rem;
      --font-h2: 1.5rem;  --font-h3: 1.25rem;
      --transition-page: 150ms ease-out;
      --transition-hover: 200ms ease;
      --transition-toast: 300ms cubic-bezier(0.16, 1, 0.3, 1);
      --color-text-primary: #0f172a;
      --color-text-secondary: #475569;
      --color-bg-primary: #ffffff;
      --color-bg-secondary: #f8fafc;
      /* Verify all combos ≥ 4.5:1 */
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```

## Skills to Use
- `caveman` — concise communication
- `ponytail` — simplest polish that looks good
- `impeccable` — full polish pass on all UI surfaces
- `ui-animation` — motion audit and animation implementation
- `owasp-security-check` — security audit
- `code-review-and-quality` — review all changes

## Edge Cases & Risks
- Polish breaking responsive layout → test at every breakpoint per change
- Animation performance → use CSS GPU compositing (transform + opacity only), avoid layout thrashing
- CSP too strict breaks app → test thoroughly, start strict, relax only if needed
- Rate limiting too aggressive in dev → environment-aware limits
- Dependency audit noise → triage each finding individually

## Done When
- [ ] Ocean fin animation smooth, scroll-responsive
- [ ] Sidebar transitions: 200ms ease-out, backdrop blur
- [ ] Loading states: shimmer skeletons on all pages
- [ ] Empty states: helpful illustrations on all pages
- [ ] Typography: 4px grid, clear hierarchy, 4.5:1 contrast minimum (verified)
- [ ] Motion: page transitions (150ms), card hover (2px lift), count-up, typewriter, toast animations
- [ ] Responsive: all pages work 320px → 2560px, no horizontal scroll, touch targets ≥ 44px
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] OWASP: no critical/high findings, all medium remediated or documented
- [ ] CSP headers set and verified
- [ ] CORS strict (no wildcard)
- [ ] Rate limiting on all mutation endpoints
- [ ] npm audit: 0 critical/high
- [ ] pip audit: 0 critical/high
- [ ] Security audit report written to `docs/security/audit-report.md`
- [ ] Git: squashed commit with `[19b] Polish & security pass`