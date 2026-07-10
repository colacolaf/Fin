# Backend Architecture — Fin MVP

FastAPI + SQLite + Ollama. Keep it flat, keep it obvious.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Web framework | FastAPI | async, Pydantic-native, WebSocket built-in |
| ORM | SQLAlchemy (async) | Mature, works with SQLite |
| DB | SQLite | Zero-ops, single-file, fine for MVP |
| LLM runtime | Ollama (local) | Privacy-first, no API costs |
| Structured output | Instructor | Pydantic models → LLM → validated Pydantic back |
| Cache | Redis (optional) | Rate limits only; in-memory config cache |
| Auth | JWT (python-jose) | Stateless, simple |

## Directory Layout

```
backend/
├── main.py              # FastAPI app, lifespan, CORS, router mounts
├── config.py            # Settings from env vars (pydantic-settings)
├── database.py          # SQLAlchemy engine, session factory
├── models/
│   ├── __init__.py
│   ├── user.py          # User, ApiConnection
│   ├── portfolio.py     # Holding, Allocation
│   ├── recommendation.py # Recommendation, Vote
│   ├── debt.py          # Debt, PaymentLog
│   ├── retirement.py    # RetirementProfile
│   ├── execution.py     # ExecutionLog
│   └── memory.py        # MemoryNode, MemoryEdge
├── schemas/             # Pydantic request/response models
│   ├── auth.py
│   ├── portfolio.py
│   ├── recommendation.py
│   ├── debt.py
│   ├── retirement.py
│   ├── execution.py
│   └── settings.py
├── services/
│   ├── auth.py          # Register, login, JWT issue/verify
│   ├── portfolio.py     # Holdings CRUD, Alpaca sync
│   ├── recommendations.py # C.O.R.E. pipeline
│   ├── agents.py        # Agent orchestration (Investment, Debt, Retirement)
│   ├── settings.py      # Agent + global settings CRUD
│   ├── memory.py        # Memory node store/retrieve
│   └── execution.py     # Trade execution logging
├── routers/
│   ├── auth.py
│   ├── portfolio.py
│   ├── recommendations.py
│   ├── debt.py
│   ├── retirement.py
│   ├── execution.py
│   ├── memory.py
│   ├── integrations.py
│   └── settings.py
├── agent_runtime/
│   ├── __init__.py
│   ├── base.py          # Base agent: call Ollama, parse with Instructor
│   ├── investment.py    # Investment Agent (C.O.R.E. structured output)
│   ├── debt.py          # Debt Agent (avalanche/snowball strategy)
│   └── retirement.py    # Retirement Agent (readiness scoring)
├── websocket/
│   ├── __init__.py
│   └── chat.py          # WebSocket chat lifecycle
├── middleware/
│   ├── auth.py          # JWT dependency, get_current_user
│   └── rate_limit.py    # Optional Redis rate limiter
└── utils/
    ├── encryption.py    # Fernet encrypt/decrypt for API keys
    └── logging.py       # Structured logger setup
```

## Service Layer

### Auth Service (`services/auth.py`)

```
register(email, password) → User
login(email, password) → JWT tokens
refresh_token(refresh_token) → new access token
```

- Passwords hashed with `passlib[bcrypt]`
- Access token: short-lived (15 min). Refresh token: 7 days, stored in DB for revocation.
- `get_current_user` dependency extracts and validates JWT from `Authorization: Bearer` header.

### Portfolio Service (`services/portfolio.py`)

```
get_holdings(user_id) → list[Holding]
refresh_holdings(user_id) → fetches from Alpaca, upserts
get_allocation(user_id) → current vs target allocation
```

- Holdings stored flat: `(user_id, ticker, shares, cost_basis, last_price, updated_at)`.
- On `/refresh`: calls Alpaca API, diffs with DB, upserts changed rows.
- Allocation targets pulled from `settings` JSON blob.

### Recommendations Service (`services/recommendations.py`)

```
get_recommendations(user_id, status_filter) → list[Recommendation]
get_recommendation(rec_id) → RecommendationDetail
vote_recommendation(rec_id, user_id, vote) → Vote
get_history(user_id) → list[Recommendation] (resolved/expired)
```

- Recommendations flow through `pending → active → resolved|dismissed`.
- Voting: up/down with optional comment. Aggregated confidence score updated on each vote.

### Agent Service (`services/agents.py`)

```
run_investment_agent(user_id, prompt) → AgentResponse
run_debt_agent(user_id, prompt) → AgentResponse
run_retirement_agent(user_id, prompt) → AgentResponse
```

Each call:
1. Loads per-agent settings + user context from DB.
2. Builds system prompt from template + settings.
3. Calls `agent_runtime.investment.run()` (or debt/retirement).
4. Returns structured response (Pydantic model) + raw text.
5. Stores result in memory graph if persistence needed.

### Settings Service (`services/settings.py`)

```
get_global_settings(user_id) → dict
update_global_settings(user_id, settings) → dict
get_agent_settings(user_id, agent_type) → dict
update_agent_settings(user_id, agent_type, settings) → dict
```

- Settings stored as JSON blob in `settings` table.
- Agent-specific overrides merge with global defaults at read time.
- In-memory cache (dict keyed by user_id + agent_type), invalidated on write.

## Agent Orchestration Runtime

### How Investment Agent calls Ollama

```
1. user sends chat message via WebSocket
2. chat.py WebSocket handler:
   - parses message, determines target agent (investment/debt/retirement)
   - calls services.agents.run_investment_agent(user_id, message)

3. agent_runtime/investment.py:
   a. loads Investment_agent_system_prompt from template
   b. appends user context (holdings, risk profile, recent recs)
   c. calls ollama.chat(model="llama3.1:8b", messages=[system, user])
   d. passes raw response to Instructor with Pydantic response_model
   e. Instructor extracts + validates structured fields:
      - recommendation_type (BUY/SELL/HOLD)
      - ticker, action, quantity, rationale
      - confidence_score (0.0–1.0)
      - risks, alternatives
   f. returns parsed AgentResponse (structured + raw_text)

4. agent service stores recommendation in DB
5. WebSocket sends structured response back to frontend
6. memory service appends node for conversation continuity
```

### Instructor integration (ponytail: one pattern for all agents)

```python
# agent_runtime/base.py
import instructor
from ollama import AsyncClient
from pydantic import BaseModel

class AgentResponse(BaseModel):
    agent_type: str
    structured_output: dict
    raw_text: str
    model_used: str
    tokens_used: int

async def run_with_instructor(
    model: str,
    system_prompt: str,
    user_message: str,
    response_model: type[BaseModel],
) -> AgentResponse:
    client = instructor.from_ollama(AsyncClient())
    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        response_model=response_model,
    )
    return AgentResponse(
        agent_type=response_model.__name__,
        structured_output=resp.model_dump(),
        raw_text=resp._raw_response.choices[0].message.content,
        model_used=model,
        tokens_used=resp._raw_response.usage.total_tokens,
    )
```

Each agent defines its own Pydantic response model (e.g., `InvestmentRecommendation`, `DebtStrategy`, `RetirementPlan`). Base handles Ollama + Instructor plumbing.

## WebSocket Lifecycle

```
Client connects:     ws://localhost:8000/ws/chat?token=<jwt>
Server authenticates: validate JWT, reject if invalid (1008 policy violation)
Connection established: add to active connections dict {user_id: websocket}

Message loop:
  client → {"type": "chat", "agent": "investment", "message": "..."}
  server → parse, route to agent, await response
  server → {"type": "agent_response", "agent": "investment", "data": {...}}
  server → {"type": "recommendation", "data": {...}} (if generated)
  server → {"type": "error", "code": "...", "message": "..."} (on failure)

Disconnect:
  server → remove from active connections
  server → cleanup any in-flight agent tasks for that user

Heartbeat:
  server → ping every 30s, expect pong within 10s, disconnect on timeout
```

One WebSocket per user session. All agent chat flows through this. Frontend renders streaming-like UX by showing `"status": "thinking"` then swapping to structured response. No actual SSE streaming in MVP — ponytail: add streaming when latency > 3s is measured.

## Caching Strategy

| What | How | TTL | Why |
|------|-----|-----|-----|
| Rate limits | Redis (optional) | Per-window | `rate_limit.py` middleware: sliding window counter. Falls back to in-memory if no REDIS_URL. |
| Agent settings config | In-memory dict | Until write | Loaded once per agent run, invalidated on settings update. |
| JWT blacklist | In-memory set | Token expiry | Refresh token revocation. Restart clears it — fine for MVP. |
| Market data (holdings prices) | None | — | Fetch fresh from Alpaca each `/refresh`. Cache when rate-limited. |

## Error Handling Patterns

All routers use a shared exception handler pattern:

```python
# main.py
from fastapi import Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
```

Concrete errors:
- `auth/unauthorized` (401) — missing/invalid/expired JWT
- `auth/forbidden` (403) — valid JWT but wrong user
- `resource/not-found` (404) — holding, rec, debt, etc. not found
- `resource/conflict` (409) — duplicate (email already registered)
- `validation/invalid-input` (422) — Pydantic validation failure (FastAPI built-in)
- `integration/api-error` (502) — Alpaca/Plaid/Finnhub API call failed
- `agent/timeout` (504) — Ollama took > 60s
- `agent/parse-error` (500) — Instructor couldn't parse LLM output
- `rate/limit-exceeded` (429) — rate limiter tripped

Services raise `AppError`, routers don't catch — exception handler does.

## Logging

Structured JSON logs to stdout (12-factor):

```python
# utils/logging.py
import logging
import json
import sys
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[1]:
            log["exception"] = str(record.exc_info[1])
        return json.dumps(log)

def setup_logging(level: str = "INFO"):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper()))
    root.handlers = [handler]
```

Key log points:
- Every HTTP request: method, path, status, duration (via middleware)
- Agent runs: user_id, agent_type, model, tokens_used, duration
- External API calls: service, endpoint, status, duration
- Errors: full exception + request context

## Key Design Decisions (ponytail annotations)

- **Single-file DB (SQLite)**: No Postgres for MVP. SQLite handles concurrent reads fine with WAL mode. Migrate when write contention appears.
- **No task queue**: Agent calls are blocking in the WebSocket handler. Ollama runs locally so latency is GPU-bound, not queue-bound. Add Celery/Redis when Ollama moves to separate host.
- **No caching layer for LLM responses**: Deterministic? Maybe. Worth the cache invalidation headache? No.
- **Fernet for API key encryption**: Symmetric, stdlib-adjacent (`cryptography` already a dep). Not HSM-grade but fine for local-only MVP.
- **In-memory settings cache**: Invalidated on write. Restart clears it. Good enough.
- **No dependency injection framework**: Functions take `db: AsyncSession` parameter. Obvious, testable, zero magic.