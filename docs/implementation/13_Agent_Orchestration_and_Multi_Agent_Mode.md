# 13 — Agent Orchestration & Multi-Agent Mode

## What & Why
Agent runtime: Investment/Debt/Retirement agents run concurrently. Cross-agent recommendations (debt vs. invest dilemma). WebSocket streaming for agent reasoning transparency. Per AI_Agent_Modes.md and Subagent_orchestration.md.

## Files to Create / Modify
```
backend/
├── agents/
│   ├── orchestrator.py      # Multi-agent orchestrator
│   ├── base.py              # add async run(), streaming
│   └── cross_agent.py       # Debt-vs-invest, retirement-vs-debt resolvers
├── routers/
│   └── ws.py                # WebSocket endpoint
├── services/
│   └── agent_runtime.py     # Concurrent agent execution
frontend/
├── src/
│   ├── components/
│   │   └── agents/
│   │       ├── AgentSelector.tsx
│   │       ├── AgentReasoningStream.tsx
│   │       ├── CrossAgentCard.tsx
│   │       └── AgentStatusBar.tsx
│   ├── hooks/
│   │   └── useAgentStream.ts
│   └── api/
│       └── agents.ts
```

## Steps
1. `backend/agents/orchestrator.py` — Orchestrator: receives trigger (manual "Run All" or scheduled). Spawns InvestmentAgent, DebtAgent, RetirementAgent concurrently via asyncio.gather. Collects results. Passes results to cross_agent resolver.
2. `backend/agents/base.py` — add async run_async() method. Add streaming: yield reasoning steps via async generator. Instrument with token counting + timing.
3. `backend/services/agent_runtime.py` — AgentRuntime: manages agent lifecycle. queue_agent_run(agent_name, user_id), get_run_status(run_id), cancel_run(run_id). In-memory state + DB for persistence.
4. `backend/agents/cross_agent.py` — debt_vs_invest_solver: if debt interest > expected investment return, recommend debt first. retirement_vs_debt: if tax-advantaged match > debt interest, split recommendation. Generate CrossAgentRecommendation.
5. `backend/routers/ws.py` — WebSocket /ws/agents/{user_id}. Stream agent reasoning steps, results, cross-agent analysis. Heartbeat every 15s. JSON message format: {type, agent, step, data}.
6. `frontend/src/hooks/useAgentStream.ts` — hook: connect WebSocket, parse stream messages, update per-agent state. Reconnect on disconnect (exponential backoff).
7. `AgentSelector.tsx` — checkboxes: Investment, Debt, Retirement. "Run Selected" / "Run All" button. Shows last run time per agent.
8. `AgentReasoningStream.tsx` — live stream of agent thinking. Animated text appear. C.O.R.E. steps visible (Collecting data... → Orchestrating... → Reasoning... → Generating...).
9. `CrossAgentCard.tsx` — shows cross-agent recommendations. "Pay debt or invest?" → shows both sides. Debt payoff timeline vs investment growth projection side-by-side.
10. `AgentStatusBar.tsx` — top bar: which agents are running, spinner, results count. "3 agents running..." → "2 recommendations ready".
11. `frontend/src/api/agents.ts` — triggerRun(agents[]), getRunStatus(runId), getRecommendations(agent?).
12. `backend/scheduler.py` — add scheduled orchestration: every 24h, run all agents. Configurable per user.
13. Playwright: trigger "Run All", verify WebSocket streams appear, recommendations populate, cross-agent card renders.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `ui-animation` (streaming text, status transitions)

## GitHub Repos Needed
- (none — FastAPI built-in WebSocket + asyncio)

## Edge Cases & Risks
- Agent run timeout → 2min max per agent, kill + return partial results
- WebSocket disconnect mid-stream → reconnect, resume from last step (via run_id)
- All agents produce zero recommendations → show "All clear" with reasoning why
- Conflicting cross-agent advice → present both with numbers, let user decide
- High concurrency → queue, max 3 concurrent orchestrations
- Agent crash → isolate failures, other agents continue, log + alert

## Done When
- [ ] Orchestrator runs all 3 agents concurrently via asyncio.gather
- [ ] WebSocket /ws/agents/{user_id} streams reasoning steps
- [ ] Frontend shows live agent reasoning stream
- [ ] Agent selector with checkboxes, "Run Selected" triggers only those agents
- [ ] Cross-agent resolver shows debt-vs-invest, retirement-vs-debt analysis
- [ ] AgentStatusBar shows running/success/failed states
- [ ] Scheduled orchestration runs every 24h
- [ ] Playwright: full "Run All" flow, stream visible, cross-agent cards render
- [ ] Git: review diff, squash merge to main with `[13] Agent orchestration & multi-agent`