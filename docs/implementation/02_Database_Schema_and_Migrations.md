# 02 — Database Schema & Migrations

## What & Why
Implement all SQLAlchemy models from docs/Database_Schema.md. Alembic for migrations. SQLite for dev (single file, zero config). Seed script with test data for all 3 agents.

## Files to Create / Modify
```
backend/
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── portfolio.py
│   ├── debt.py
│   ├── retirement.py
│   ├── recommendation.py
│   ├── execution.py
│   └── settings.py
├── database.py
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
├── seed.py
└── pyproject.toml          # add alembic dep
```

## Steps
1. `backend/database.py` — SQLAlchemy engine + sessionmaker + Base. SQLite at `./data/fin.db`. Auto-create data dir.
2. Models (one file each, per Database_Schema.md tables):
   - `user.py`: User (id, email, hashed_password, created_at, updated_at)
   - `portfolio.py`: Portfolio, Holding, Transaction, Account
   - `debt.py`: DebtAccount, DebtPayment, PayoffPlan
   - `retirement.py`: RetirementAccount, Projection, ContributionPlan
   - `recommendation.py`: Recommendation, RecommendationFeedback, AgentRun
   - `execution.py`: ExecutionLog, FollowThroughCheck
   - `settings.py`: UserSettings, BrokerConnection (encrypted API keys — field only, crypto in plan 07)
3. `models/__init__.py` imports all models so Alembic sees them
4. Run `alembic init alembic`, configure `env.py` to use `database.py` Base metadata
5. Run `alembic revision --autogenerate -m "initial"` → `alembic upgrade head`
6. `seed.py` — create test user, sample holdings (AAPL, VTI, BND), debt accounts (CC, student loan), retirement accounts (401k, Roth IRA). Run `python seed.py`
7. Verify: `sqlite3 data/fin.db ".tables"` shows all tables
8. Verify: `python seed.py` populates without errors, query confirms rows

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`

## GitHub Repos Needed
- `sqlalchemy/sqlalchemy` (model patterns)

## Edge Cases & Risks
- SQLite vs PostgreSQL type differences → avoid PG-specific types (JSON, ARRAY). Use Text + json.dumps for JSON fields.
- Alembic autogenerate misses some constraints → verify `foreign_keys` pragma is on for SQLite
- Seed script idempotency → check if data exists before seeding, or use `--reset` flag
- Circular imports with models → all relationships use string references or `back_populates`

## Done When
- [ ] All 7 model files match Database_Schema.md table specs
- [ ] `alembic upgrade head` creates all tables in SQLite
- [ ] `python seed.py` populates all tables with test data
- [ ] No import errors: `from backend.models import *` works
- [ ] Foreign key relationships resolve correctly (test in sqlite3 shell)
- [ ] Git: review diff, squash merge to main with `[02] Database schema & migrations`