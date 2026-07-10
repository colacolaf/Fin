# Prompt: Generate 15+ Implementation Plan Files for Fin

Create `docs/implementation/` with 15+ files, one per feature/phase. Each file is a self-contained implementation plan. Follow these rules:

## Global Rules
- **Caveman + Ponytail ideology**: minimal text, shortest path. YAGNI. One library per need. Standard library before dependencies.
- **Skills**: Every coding task uses `subagent-driven-development`, `code-review-and-quality`, `superpowers-lab`. Frontend tasks also use `impeccable`, `ui-animation`. Security-sensitive tasks use `owasp-security-check`.
- **Testing**: Frontend changes verified via `playwright` MCP (browser). Backend via pytest.
- **Git**: Each plan ends with: review diff, squash merge to `main`.
- **GitHub refs**: Pull from `docs/GitHub_References.md` — primary repo first, fallback only if needed.
- **Source docs**: Plans reference `docs/Backend_Architecture.md`, `docs/Frontend_Architecture.md`, `docs/Database_Schema.md`, `docs/Features_Specification.md`.

## Each Plan File Structure
```markdown
# [NN] — [Feature Name]
## What & Why (2-3 lines)
## Files to Create / Modify (tree)
## Steps (numbered, ~5-10)
## Skills to Use (list)
## GitHub Repos Needed (from GitHub_References.md)
## Edge Cases & Risks (bullet list)
## Done When (verifiable conditions)
```

## The 15+ Plans (in order)

1. **01 — Project Scaffold & Monorepo Setup**
   - Init `backend/` (FastAPI + SQLAlchemy + SQLite), `frontend/` (Vite + React + TypeScript), shared `packages/`. Configure ESLint, Prettier, tsconfig, pyproject.toml. Wire `npm workspaces`.

2. **02 — Database Schema & Migrations**
   - Implement all SQLAlchemy models from `docs/Database_Schema.md`. Set up Alembic. Create initial migration. Seed script with test data.

3. **03 — Auth & User Management**
   - JWT auth (python-jose). Register, login, logout, refresh. Auth middleware. Frontend: login/register pages, auth context, protected routes.

4. **04 — API Foundation & Router Skeleton**
   - All FastAPI routers (auth, portfolio, recommendations, debt, retirement, execution, memory, integrations, settings). Error handling, rate limiting, CORS. Frontend: API client layer (fetch wrapper, typed responses).

5. **05 — Ocean Dashboard Shell**
   - Frontend: ocean canvas with Three.js/Canvas API. Animated SVG fins. Collapsible sidebar (Claude.ai-style). Top bar with sync status. `impeccable` for design, `ui-animation` for fin motion.

6. **06 — Setup Wizard**
   - Multi-step onboarding: connect broker (Alpaca), risk tolerance, goals, budget. React Hook Form + Zod. React Joyride tour. `impeccable` for UX. Playwright test the full flow.

7. **07 — Investment Agent: Portfolio Data Pipeline**
   - Alpaca API integration (alpaca-py). Pull holdings, positions, orders. Store in DB. AES-256 encrypt API keys (cryptography.fernet). Background sync (APScheduler). `owasp-security-check` for key storage.

8. **08 — Investment Agent: Dashboard & Visualization**
   - Portfolio holdings table, allocation pie (Recharts), performance line chart, concentration alerts. Asset class breakdown. Top 10 holdings. Playwright verify charts render with real data.

9. **09 — Investment Agent: Recommendations Engine**
   - C.O.R.E. pipeline (Collect → Orchestrate → Reason → Execute). Structured output via Instructor/Ollama. Portfolio rebalancing, tax-loss harvesting, buy/sell signals. `owasp-security-check` for prompt injection.

10. **10 — Debt Agent: Full Feature**
    - Plaid integration for liabilities. Debt avalanche/snowball payoff calculator. Payment tracking. Payoff timeline visualization. Debt-to-income ratio. Playwright test payoff scenarios.

11. **11 — Retirement Agent: Full Feature**
    - 401k/IRA projection engine. Monte Carlo simulation. Retirement readiness score. Contribution optimizer. Tax-advantaged account strategy. Playwright test projections.

12. **12 — Memory System**
    - basic-memory MCP integration for persistent markdown memory. TencentDB Agent Memory for short-term context compression. Per-agent memory nodes. Obsidian-compatible output.

13. **13 — Agent Orchestration & Multi-Agent Mode**
    - Agent runtime: Investment/Debt/Retirement agents run concurrently. Cross-agent recommendations (debt vs. invest dilemma). WebSocket streaming for agent reasoning. `docs/AI_Agent_Modes.md` integration.

14. **14 — Execution Tracking & Follow-Through**
    - User accepts/rejects recommendations. Execution log. Before/after impact visualization. Follow-through scoring. "Did you do it?" check-ins.

15. **15 — Community Voting & Benchmarks**
    - Upstash Redis for rate-limited voting. Recommendation voting (agree/disagree). Leaderboards. Anonymous benchmark comparisons. `owasp-security-check` for voting integrity.

16. **16 — Backtesting & Training Mode**
    - Backtrader integration. Strategy sandbox. Historical data replay. Parameter sweeps. Training mode: paper trades, risk-free experimentation.

17. **17 — Data Refresh Pipeline & Market Data**
    - Finnhub for market data. APScheduler for daily sync. News sentiment aggregation via agent-reach. Crypto via CCXT (Phase 2 prep).

18. **18 — Mobile & Offline Support**
    - Capacitor wrapper. IndexedDB offline cache (idb). Service worker (Workbox). PWA manifest. Background sync when online.

19. **19 — End-to-End Testing & Polish Pass**
    - Full Playwright E2E suite (happy paths, error states, edge cases). Lighthouse audit. Accessibility check. Final `impeccable` + `ui-animation` polish. Security audit (`owasp-security-check` full pass).

## Execution Instructions
- Work through plans 01→19 sequentially.
- After each plan: verify with tests, review diff, squash merge to `main` with plan number in commit message.
- If a plan is unclear, ask 1-2 clarifying questions BEFORE coding. Do not guess architecture.
- Use `subagent-driven-development` for any plan with >3 independent parallel tasks.
- Every plan that touches frontend MUST end with `playwright` browser verification.
- Reference `docs/GitHub_References.md` primary repos. No new dependencies without justification.