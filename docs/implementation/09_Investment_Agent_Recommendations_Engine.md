# 09 — Investment Agent: Recommendations Engine

## What & Why
C.O.R.E. pipeline (Collect → Orchestrate → Reason → Execute). Structured output via Instructor/Ollama. Portfolio rebalancing, tax-loss harvesting, buy/sell signals. Per Recommendation_engine.md and 01_Investment_agent_system_prompt.md. owasp-security-check for prompt injection.

## Files to Create / Modify
```
backend/
├── agents/
│   ├── __init__.py
│   ├── base.py            # Base agent class
│   ├── investment.py      # Investment agent runner
│   └── prompts/
│       └── investment.py  # C.O.R.E. prompt template
├── services/
│   ├── recommendation_engine.py  # C.O.R.E. pipeline
│   ├── structured_output.py      # Instructor + Pydantic schemas
│   └── confidence.py             # scoring (0-100)
├── models/
│   └── recommendation.py  # schemas refined
├── routers/
│   └── recommendations.py # GET, POST /feedback
frontend/
├── src/
│   ├── components/
│   │   ├── RecommendationCard.tsx
│   │   └── RecommendationsList.tsx
│   └── api/
│       └── recommendations.ts
```

## Steps
1. `backend/agents/prompts/investment.py` — port 01_Investment_agent_system_prompt.md to Python template. R.C.T.F. structure. User context placeholder. C.O.R.E. reasoning instructions.
2. `backend/agents/base.py` — BaseAgent: __init__(model, prompts), run(user_context), _call_llm(messages). Token counting. Retry logic (max 3). Output parse via Instructor.
3. `backend/services/structured_output.py` — Pydantic schemas: Recommendation (id, agent, type, title, summary, reasoning, action_steps, confidence, urgency), RecommendationResponse (recommendations[], metadata). Wire Instructor with Ollama.
4. `backend/agents/investment.py` — InvestmentAgent(BaseAgent): runs C.O.R.E. Collect: pull portfolio, market data, user context. Orchestrate: select subagents (rebalance, tax_loss, buy_sell). Reason: per skill doc. Execute: emit Recommendation objects.
5. `backend/services/recommendation_engine.py` — run_agent(agent_name, user_id): load agent, build context, invoke, store results. Returns recommendations list.
6. `backend/services/confidence.py` — score: reasoning_quality (0-40), data_completeness (0-30), user_alignment (0-30). Weighted sum → 0-100. Store per recommendation.
7. `backend/routers/recommendations.py` — GET /recommendations?agent=investment (list recent), POST /recommendations/:id/feedback (accept/reject/comment), GET /recommendations/:id (detail).
8. `RecommendationCard.tsx` — card with confidence badge, title, summary, "Accept"/"Reject" buttons. Expandable reasoning section.
9. `RecommendationsList.tsx` — feed of cards, filter by agent/status/urgency. Pull-to-refresh.
10. owasp-security-check: sanitize user context, validate Instructor output, prevent prompt injection.
11. Playwright: run investment agent (mock or real), verify recommendations appear with scores, accept/reject flow.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (prompt injection, output validation, input sanitization)

## GitHub Repos Needed
- `jxnl/instructor` (structured LLM output, Python client)
- `ollama/ollama` (local LLM runtime)

## Edge Cases & Risks
- LLM hallucination → Pydantic validation fails → retry stricter prompt, fallback empty recommendation
- Low confidence (<40) → flag clearly, "Low confidence — review carefully"
- Prompt injection via user context → sanitize all user-provided text, limit context size
- Ollama rate limiting → queue agent runs, max 1 concurrent
- Empty portfolio → agent returns "no recommendations" with reason
- Model timeout → 30s timeout, retry once, then fail with error message

## Done When
- [ ] C.O.R.E. pipeline end-to-end: Collect → Orchestrate → Reason → Execute
- [ ] Instructor returns validated Pydantic Recommendation objects
- [ ] Confidence score calculated per dimension (reasoning, data, user_alignment)
- [ ] Recommendations stored in DB with all fields
- [ ] GET /recommendations returns list with confidence scores
- [ ] POST /recommendations/:id/feedback updates status
- [ ] Frontend shows recommendation cards with accept/reject
- [ ] Low-confidence (<40) recommendations flagged visually
- [ ] owasp-security-check: prompts sanitized, output validated
- [ ] Playwright: recommendation generation + display + accept/reject flow
- [ ] Git: review diff, squash merge to main with `[09] Investment recommendations engine`