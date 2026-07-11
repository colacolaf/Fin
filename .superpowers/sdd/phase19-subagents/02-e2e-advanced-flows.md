# Subagent 2: E2E Advanced Flows (Specs 06–14 excluding 12–13)

## Scope
Complete the 4 remaining E2E spec files covering retirement, execution/check-ins, community/benchmarks, and cross-agent orchestration. Also create 3 NEW spec files for backtesting, data refresh, and settings.

## Skills to Use
- **`planning-and-task-breakdown`**: Break each spec into implementable test tasks
- **`rtk-tdd`**: Write failing test, mock API, make pass

## MCP Servers
- **playwright** (`@playwright/mcp`): Run tests, debug failures, capture screenshots

## GitHub References
- **Playwright docs**: https://playwright.dev/docs/intro
- **Playwright API mocking**: https://playwright.dev/docs/network#handle-requests

## Current State
| Spec | File | Status |
|------|------|--------|
| 06-retirement | `frontend/e2e/specs/06-retirement.spec.ts` | Exists, needs completion |
| 07-execution | `frontend/e2e/specs/07-execution.spec.ts` | NEEDS CREATION |
| 08-community | `frontend/e2e/specs/08-community.spec.ts` | NEEDS CREATION |
| 14-cross-agent | `frontend/e2e/specs/14-cross-agent.spec.ts` | Exists, needs completion |
| 09-backtest | `frontend/e2e/specs/09-backtest.spec.ts` | NEEDS CREATION |
| 10-data-refresh | `frontend/e2e/specs/10-data-refresh.spec.ts` | NEEDS CREATION |
| 11-settings | `frontend/e2e/specs/11-settings.spec.ts` | NEEDS CREATION |

## Tasks

### 1. Spec 06 — Retirement Agent (Complete existing)
- [ ] Read existing file, assess completeness
- [ ] Test: retirement dashboard renders with projection chart
- [ ] Test: current savings, monthly contribution, retirement age inputs
- [ ] Test: Monte Carlo simulation toggle and results display
- [ ] Test: income replacement ratio gauge
- [ ] Test: shortfall/ surplus indicator
- [ ] Test: scenario comparison (optimistic/pessimistic/baseline)
- [ ] Test: loading state, error state, empty state
- [ ] Target: 10+ tests

### 2. Spec 07 — Execution & Check-ins (Create new)
- [ ] Test: ExecutionDashboard renders with active plans list
- [ ] Test: CheckInBanner appears for pending check-ins
- [ ] Test: complete check-in flow (rating → notes → confirm)
- [ ] Test: BeforeAfter component shows progress (value before vs. now)
- [ ] Test: execution progress bar / step tracker
- [ ] Test: mark step complete / skip step
- [ ] Test: overdue check-in warning
- [ ] Test: empty state (no active execution plans)
- [ ] Target: 10+ tests

### 3. Spec 08 — Community & Benchmarks (Create new)
- [ ] Test: CommunityDashboard renders with leaderboard
- [ ] Test: Leaderboard shows ranked users with scores
- [ ] Test: VoteWidget upvote/downvote on recommendations
- [ ] Test: BenchmarkComparison shows user vs. benchmark metrics
- [ ] Test: filter leaderboard by timeframe (week/month/quarter)
- [ ] Test: anonymous profile display (privacy)
- [ ] Test: empty state (no community data yet)
- [ ] Target: 10+ tests

### 4. Spec 14 — Cross-Agent Orchestration (Complete existing)
- [ ] Read existing file, assess completeness
- [ ] Test: multi-agent mode toggle enables all three agents
- [ ] Test: ocean visualization shows all three fins active
- [ ] Test: cross-agent recommendations appear (e.g., "pay debt before investing")
- [ ] Test: agent priority conflict resolution display
- [ ] Test: combined dashboard shows all agent summaries
- [ ] Target: 8+ tests

### 5. Spec 09 — Backtesting (Create new)
- [ ] Test: BacktestDashboard renders with strategy list
- [ ] Test: StrategyBuilder form with asset allocation inputs
- [ ] Test: run backtest → see results with performance metrics
- [ ] Test: ResultTransition animation between strategy and results
- [ ] Test: HistoricalReplay shows portfolio value over time
- [ ] Test: compare multiple strategies side-by-side
- [ ] Test: loading state during backtest computation
- [ ] Test: validation errors on strategy form
- [ ] Target: 10+ tests

### 6. Spec 10 — Data Refresh & Market Data (Create new)
- [ ] Test: data refresh status indicator (stale/fresh/refreshing)
- [ ] Test: manual refresh trigger button
- [ ] Test: last-updated timestamp display
- [ ] Test: refresh error state with retry
- [ ] Test: market data display (indices, quotes)
- [ ] Test: cache invalidation notice when data is stale
- [ ] Target: 8+ tests

### 7. Spec 11 — Settings (Create new)
- [ ] Test: settings page renders with all sections
- [ ] Test: profile update (name, email)
- [ ] Test: notification preferences toggle
- [ ] Test: data export request
- [ ] Test: account deletion flow (confirm → delete)
- [ ] Test: theme toggle (dark/light)
- [ ] Test: API key management (add/remove connections)
- [ ] Test: validation errors on profile form
- [ ] Target: 10+ tests

## Output Requirements
- All 7 spec files passing in Chromium
- Each spec: 8–12 test cases
- Mock data in `frontend/e2e/fixtures/mock-data.ts` (extend as needed)
- Consistent `page.route()` API mocking pattern
- Test names follow `XX.N — Description` convention

## Done Criteria
- `npx playwright test --project=chromium specs/06-retirement specs/07-execution specs/08-community specs/09-backtest specs/10-data-refresh specs/11-settings specs/14-cross-agent` — all green
- No skipped or fixme tests