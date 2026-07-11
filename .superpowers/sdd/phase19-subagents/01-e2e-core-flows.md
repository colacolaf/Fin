# Subagent 1: E2E Core Flows (Specs 01–05 + auth setup)

## Scope
Complete the 5 existing E2E spec files (auth, portfolio, wizard, recommendations, debt) and the auth setup fixture — fully passing, all edge cases covered.

## Skills to Use
- **`planning-and-task-breakdown`**: Break each spec into implementable test tasks before coding
- **`rtk-tdd`**: (adapt for Playwright) Red-Green-Refactor — write failing test, mock API, make pass

## MCP Servers
- **playwright** (`@playwright/mcp`): Run tests, debug failures, capture screenshots

## GitHub References (from `docs/GitHub_References.md`)
- **Playwright docs**: https://playwright.dev/docs/intro — API reference, selectors, fixtures
- **Playwright API mocking**: https://playwright.dev/docs/network#handle-requests — `page.route()` patterns

## Current State
Existing spec files that need completion/fixing:
| Spec | File | Status |
|------|------|--------|
| Auth setup | `frontend/e2e/specs/auth.setup.ts` | Needs review+completion |
| 01-auth | `frontend/e2e/specs/01-auth.spec.ts` | 10 tests, needs runner validation |
| 02-portfolio | `frontend/e2e/specs/02-portfolio.spec.ts` | 8 tests, needs runner validation |
| 03-wizard | `frontend/e2e/specs/03-wizard.spec.ts` | Exists, needs completion |
| 04-recommendations | `frontend/e2e/specs/04-recommendations.spec.ts` | Exists, needs completion |
| 05-debt | `frontend/e2e/specs/05-debt.spec.ts` | Exists, needs completion |

## Tasks

### 1. Auth Setup Fixture (`auth.setup.ts`)
- [ ] Create a reusable `authenticatedState` fixture that logs in once and saves storage state
- [ ] Configure Playwright `projects` to use this as a dependency for all other spec files
- [ ] Verify login flow: navigate → fill credentials → submit → verify token in localStorage
- [ ] Handle token refresh: mock `/api/auth/refresh` endpoint in setup
- [ ] Save `storageState` to `.auth/state.json` for reuse across specs

### 2. Spec 01 — Auth (Refine existing)
- [ ] Run existing 10 tests, fix any failures
- [ ] Add missing edge cases: empty fields validation, password < 8 chars, email format validation
- [ ] Add: rate limiting 429 response handling
- [ ] Add: network timeout / offline during login
- [ ] Verify all 14+ tests pass

### 3. Spec 02 — Portfolio Dashboard (Refine existing)
- [ ] Run existing 8 tests, fix any failures
- [ ] Add: empty portfolio state (new user, no holdings)
- [ ] Add: single-holding concentration warning
- [ ] Add: pagination if holdings > 20
- [ ] Add: daily change color coding (green positive, red negative)
- [ ] Verify all 12+ tests pass

### 4. Spec 03 — Setup Wizard (Complete)
- [ ] Read existing file, assess completeness
- [ ] Cover all wizard steps: risk profile → account linking → goals → confirmation
- [ ] Mock Plaid Link integration flow
- [ ] Test: skip step, back navigation, progress persistence
- [ ] Test: validation errors on each step
- [ ] Test: successful completion → redirect to dashboard
- [ ] Target: 10+ tests

### 5. Spec 04 — Recommendations (Complete)
- [ ] Read existing file, assess completeness
- [ ] Test: recommendations list renders with cards
- [ ] Test: each card shows confidence score, impact, rationale
- [ ] Test: accept/reject/snooze actions
- [ ] Test: filter by agent (investment/debt/retirement)
- [ ] Test: sort by confidence / impact
- [ ] Test: empty state (no recommendations)
- [ ] Test: loading state, error state
- [ ] Target: 10+ tests

### 6. Spec 05 — Debt Agent (Complete)
- [ ] Read existing file, assess completeness
- [ ] Test: debt summary dashboard renders
- [ ] Test: debt payoff strategy display (avalanche/snowball toggle)
- [ ] Test: debt timeline/projection chart
- [ ] Test: add debt form with validation
- [ ] Test: payoff calculator with extra payment slider
- [ ] Test: empty state (no debts)
- [ ] Test: multiple debt accounts display
- [ ] Target: 10+ tests

## Output Requirements
- All 5 spec files + auth setup passing in Chromium
- Each spec file: 10–15 test cases with descriptive names
- Mock data uses `frontend/e2e/fixtures/mock-data.ts` (already exists — extend if needed)
- API mocking uses `page.route()` pattern consistent with existing specs
- Test names follow `XX.N — Description` convention

## Done Criteria
- `npx playwright test --project=chromium specs/01-auth specs/02-portfolio specs/03-wizard specs/04-recommendations specs/05-debt` — all green
- No `test.skip()` or `test.fixme()` — every test actually runs and passes