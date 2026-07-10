# Database Schema — Fin MVP

SQLite. WAL mode. Single file. All tables below.

## Conventions

- `UUID` stored as TEXT (SQLite no native UUID)
- Timestamps: ISO 8601 TEXT (`2026-07-09T17:45:00Z`)
- JSON blobs: TEXT columns, parsed in app layer
- Foreign keys: `ON DELETE CASCADE` for child records, `ON DELETE SET NULL` for optional refs
- `created_at` / `updated_at` on every table

---

## users

```sql
-- Core user account. One user = one Fin instance (local-only MVP).
CREATE TABLE users (
    id              TEXT PRIMARY KEY,          -- UUID4
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,             -- bcrypt hash
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);
```

## api_connections

```sql
-- Encrypted API keys for third-party services. One row per service per user.
-- Keys encrypted at rest with Fernet (symmetric). Decrypted only in-memory during API calls.
CREATE TABLE api_connections (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service         TEXT NOT NULL,             -- 'alpaca', 'plaid', 'finnhub'
    encrypted_key   TEXT NOT NULL,             -- Fernet-encrypted API key/secret JSON
    is_active       INTEGER NOT NULL DEFAULT 1,
    last_synced_at  TEXT,                      -- last successful data pull
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, service)
);
CREATE INDEX idx_api_connections_user ON api_connections(user_id);
```

## refresh_tokens

```sql
-- JWT refresh token store for session management + revocation.
CREATE TABLE refresh_tokens (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,      -- SHA-256 of refresh token
    expires_at      TEXT NOT NULL,
    revoked         INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

## holdings

```sql
-- Portfolio positions. Upserted on each Alpaca sync.
CREATE TABLE holdings (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker          TEXT NOT NULL,
    shares          REAL NOT NULL,
    cost_basis      REAL NOT NULL,             -- avg cost per share
    last_price      REAL,                      -- latest market price
    asset_class     TEXT,                      -- 'stock', 'etf', 'bond', 'crypto', 'cash'
    sector          TEXT,                      -- 'Technology', 'Healthcare', etc.
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, ticker)
);
CREATE INDEX idx_holdings_user ON holdings(user_id);
```

## allocation_targets

```sql
-- Target allocation percentages by asset class. Source: user settings.
CREATE TABLE allocation_targets (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_class     TEXT NOT NULL,             -- 'stocks', 'bonds', 'cash', 'crypto', 'international'
    target_pct      REAL NOT NULL,             -- 0.0–1.0
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, asset_class)
);
```

## recommendations

```sql
-- Agent-generated recommendations. C.O.R.E. pipeline output.
CREATE TABLE recommendations (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type      TEXT NOT NULL,             -- 'investment', 'debt', 'retirement'
    recommendation_type TEXT NOT NULL,         -- 'BUY', 'SELL', 'HOLD', 'REBALANCE', 'TAX_LOSS_HARVEST', 'PAYOFF', 'CONTRIBUTE'
    ticker          TEXT,                      -- NULL for non-equity recs (debt, retirement)
    action          TEXT NOT NULL,             -- human-readable action
    quantity        REAL,                      -- shares or dollar amount
    rationale       TEXT NOT NULL,             -- agent's reasoning
    confidence_score REAL NOT NULL,            -- 0.0–1.0
    risks           TEXT,                      -- JSON array of risk strings
    alternatives    TEXT,                      -- JSON array of alternative actions
    before_state    TEXT,                      -- JSON: portfolio state before rec
    after_state     TEXT,                      -- JSON: projected state after rec
    status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'accepted', 'rejected', 'expired', 'executed'
    model_used      TEXT,                      -- e.g. 'llama3.1:8b'
    tokens_used     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at      TEXT,                      -- recommendations expire after 30 days
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_recs_user ON recommendations(user_id);
CREATE INDEX idx_recs_user_status ON recommendations(user_id, status);
CREATE INDEX idx_recs_agent ON recommendations(agent_type);
```

## votes

```sql
-- User votes on recommendations. From Voting_and_feedback_system.md.
CREATE TABLE votes (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id TEXT NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    vote            TEXT NOT NULL,             -- 'up', 'down'
    comment         TEXT,                      -- optional feedback
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, recommendation_id)
);
CREATE INDEX idx_votes_rec ON votes(recommendation_id);
CREATE INDEX idx_votes_user ON votes(user_id);
```

## debts

```sql
-- Debt accounts tracked by Debt Agent.
CREATE TABLE debts (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,             -- 'Chase CC', 'Student Loan', 'Mortgage'
    debt_type       TEXT NOT NULL,             -- 'credit_card', 'student_loan', 'mortgage', 'auto', 'personal', 'other'
    balance         REAL NOT NULL,             -- current balance
    interest_rate   REAL NOT NULL,             -- APR as decimal (0.25 = 25%)
    minimum_payment REAL NOT NULL,
    extra_payment   REAL NOT NULL DEFAULT 0,   -- additional beyond minimum
    due_date        TEXT,                      -- next payment due
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_debts_user ON debts(user_id);
```

## payment_log

```sql
-- Payment history for each debt. Supports payoff strategy tracking.
CREATE TABLE payment_log (
    id              TEXT PRIMARY KEY,          -- UUID4
    debt_id         TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          REAL NOT NULL,
    payment_date    TEXT NOT NULL,
    balance_after   REAL NOT NULL,             -- balance after payment applied
    method          TEXT,                      -- 'manual', 'auto_pay', 'extra'
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_payment_log_debt ON payment_log(debt_id);
CREATE INDEX idx_payment_log_user ON payment_log(user_id);
```

## payoff_strategies

```sql
-- Debt payoff plans generated by Debt Agent.
CREATE TABLE payoff_strategies (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_type   TEXT NOT NULL,             -- 'avalanche', 'snowball', 'consolidation'
    monthly_budget  REAL NOT NULL,             -- total monthly payment budget
    projected_payoff_date TEXT,                -- estimated debt-free date
    total_interest_saved REAL,                 -- vs minimum payments
    strategy_json   TEXT NOT NULL,             -- JSON: full step-by-step plan
    is_active       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_payoff_user ON payoff_strategies(user_id);
```

## retirement_profiles

```sql
-- Retirement planning data. One row per user (MVP: single profile).
CREATE TABLE retirement_profiles (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_age     INTEGER NOT NULL,
    retirement_age  INTEGER NOT NULL,
    current_savings REAL NOT NULL,             -- total retirement account balance
    annual_income   REAL NOT NULL,
    contribution_rate REAL NOT NULL,           -- % of income (0.0–1.0)
    employer_match  REAL,                      -- % employer matches
    desired_income  REAL NOT NULL,             -- target annual retirement income
    assumed_return  REAL NOT NULL DEFAULT 0.07,-- conservative estimate
    inflation_rate  REAL NOT NULL DEFAULT 0.03,
    social_security REAL,                      -- estimated monthly SS benefit
    readiness_score REAL,                      -- 0.0–1.0, calculated by agent
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_retirement_user ON retirement_profiles(user_id);
```

## settings

```sql
-- Per-agent + global settings as JSON blobs. One row per user per scope.
CREATE TABLE settings (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope           TEXT NOT NULL,             -- 'global', 'investment', 'debt', 'retirement'
    config_json     TEXT NOT NULL,             -- JSON blob of settings
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, scope)
);
CREATE INDEX idx_settings_user ON settings(user_id);
```

## execution_log

```sql
-- Trade execution tracking. Records when user acts on a recommendation.
CREATE TABLE execution_log (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id TEXT REFERENCES recommendations(id) ON DELETE SET NULL,
    ticker          TEXT NOT NULL,
    action          TEXT NOT NULL,             -- 'BUY', 'SELL'
    shares          REAL NOT NULL,
    price           REAL NOT NULL,             -- execution price
    total_value     REAL NOT NULL,             -- shares * price
    executed_at     TEXT NOT NULL,             -- when trade happened
    broker          TEXT NOT NULL DEFAULT 'alpaca',
    order_id        TEXT,                      -- broker order ID
    impact_json     TEXT,                      -- JSON: before/after portfolio impact
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_exec_log_user ON execution_log(user_id);
CREATE INDEX idx_exec_log_rec ON execution_log(recommendation_id);
```

## memory_nodes

```sql
-- Memory graph nodes. From Memory_system.md. Stores conversation context, decisions, user preferences.
CREATE TABLE memory_nodes (
    id              TEXT PRIMARY KEY,          -- UUID4
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_type       TEXT NOT NULL,             -- 'conversation', 'decision', 'preference', 'goal', 'context', 'feedback'
    agent_type      TEXT,                      -- 'investment', 'debt', 'retirement', NULL for cross-agent
    content_json    TEXT NOT NULL,             -- JSON: full node payload
    importance      REAL NOT NULL DEFAULT 0.5, -- 0.0–1.0, used for retrieval priority
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memory_user ON memory_nodes(user_id);
CREATE INDEX idx_memory_user_type ON memory_nodes(user_id, node_type);
CREATE INDEX idx_memory_agent ON memory_nodes(agent_type);
```

## memory_edges

```sql
-- Edges in the memory graph. Connect related nodes (e.g., decision → consequence).
CREATE TABLE memory_edges (
    id              TEXT PRIMARY KEY,          -- UUID4
    source_node_id  TEXT NOT NULL REFERENCES memory_nodes(id) ON DELETE CASCADE,
    target_node_id  TEXT NOT NULL REFERENCES memory_nodes(id) ON DELETE CASCADE,
    edge_type       TEXT NOT NULL,             -- 'follows', 'informs', 'contradicts', 'refines', 'triggers'
    weight          REAL NOT NULL DEFAULT 1.0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source_node_id, target_node_id, edge_type)
);
CREATE INDEX idx_edges_source ON memory_edges(source_node_id);
CREATE INDEX idx_edges_target ON memory_edges(target_node_id);
```

## Index Summary

| Table | Indexes |
|-------|---------|
| users | `email` |
| api_connections | `user_id` + unique `(user_id, service)` |
| refresh_tokens | `user_id`, `token_hash` |
| holdings | `user_id` + unique `(user_id, ticker)` |
| allocation_targets | unique `(user_id, asset_class)` |
| recommendations | `user_id`, `(user_id, status)`, `agent_type` |
| votes | `recommendation_id`, `user_id` + unique `(user_id, recommendation_id)` |
| debts | `user_id` |
| payment_log | `debt_id`, `user_id` |
| payoff_strategies | `user_id` |
| retirement_profiles | `user_id` |
| settings | `user_id` + unique `(user_id, scope)` |
| execution_log | `user_id`, `recommendation_id` |
| memory_nodes | `user_id`, `(user_id, node_type)`, `agent_type` |
| memory_edges | `source_node_id`, `target_node_id` + unique `(source, target, edge_type)` |

## Foreign Key Map

```
users ──┬── api_connections (CASCADE)
        ├── refresh_tokens (CASCADE)
        ├── holdings (CASCADE)
        ├── allocation_targets (CASCADE)
        ├── recommendations (CASCADE)
        │       └── votes (CASCADE)
        │       └── execution_log (SET NULL)
        ├── debts (CASCADE)
        │       └── payment_log (CASCADE)
        ├── payoff_strategies (CASCADE)
        ├── retirement_profiles (CASCADE)
        ├── settings (CASCADE)
        ├── execution_log (CASCADE)
        └── memory_nodes (CASCADE)
                └── memory_edges (CASCADE, both directions)