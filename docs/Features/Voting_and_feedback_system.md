# Voting & Feedback System
## User Votes on Agent Recommendations → Behavioral Pattern Updates → Agent Improvement Loop

**Version:** 1.0
**Status:** Specification
**Last Updated:** July 9, 2026
**Depends On:** `docs/Memory_system/Memory_system`, `docs/SystemPrompts/User_context_file_shema`, `docs/SystemPrompts/System_architecture_(Agent_orchestration_flow)` 
**GitHub Refs:** Upstash Redis (serverless REST API rate limiting), Flask-Limiter (not needed — Upstash covers it)

---

## 1. OVERVIEW

User votes accept/reject/reconsider on every agent recommendation. Vote triggers three downstream effects: (1) behavioral pattern recalculation in memory, (2) agent confidence calibration adjustment, (3) anonymized community benchmark aggregation.

### 1.1 Vote States

| Vote | Meaning | Memory Effect |
|------|---------|---------------|
| `accept` | I will act on this | +weight on recommendation category + decision pattern |
| `reject` | I won't act on this | −weight, agent learns what NOT to recommend |
| `reconsider` | Not now, remind me later | Neutral weight; schedules re-prompt at +7d |

### 1.2 Flow

```
Agent → Recommendation (with rec_id)
  → User votes (accept | reject | reconsider)
    → POST /api/votes  (Upstash rate limited: 30/min per user)
      → SQLite: votes table INSERT
      → Memory: recalculate behavioral_patterns
      → Upstash: increment global counter for community stats
      → Agent: next session loads updated patterns → confidence calibrated
```

---

## 2. VOTE SCHEMA

### 2.1 `votes` Table (SQLite/Postgres)

```sql
CREATE TABLE votes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('investment', 'debt', 'retirement')),
  recommendation_id TEXT NOT NULL,
  recommendation_category TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('accept', 'reject', 'reconsider')),
  reason TEXT,                         -- optional user reason
  confidence_delta REAL,               -- agent's original confidence - user perceived
  agent_run_id TEXT,                   -- links to agent_training_runs if fine-tuned
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reconsider_at TIMESTAMP,             -- NULL unless vote='reconsider', then +7d
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_votes_user_rec ON votes(user_id, recommendation_id);
CREATE INDEX idx_votes_agent_type ON votes(agent_type, vote, created_at);
CREATE INDEX idx_votes_reconsider ON votes(reconsider_at) WHERE vote = 'reconsider';
```

### 2.2 Vote Constraints

- **Idempotent**: one vote per `(user_id, recommendation_id)`. Duplicate POST = 409.
- **Changeable**: user can change vote within 24h of creation. After 24h, vote locked.
- **Reconsider lifecycle**: at `reconsider_at` (created_at + 7d), system re-prompts user. If user ignores → auto-reconsider extends 7d. After 30d total → auto-converts to `reject` with reason "timed out".

### 2.3 JSON Shapes

**POST /api/votes request:**
```json
{
  "recommendation_id": "rec_abc123",
  "vote": "accept",
  "reason": "Makes sense given my risk tolerance",
  "confidence_delta": 0.1
}
```

**GET /api/votes response (user's history):**
```json
{
  "votes": [
    {
      "id": "v_xyz",
      "agent_type": "investment",
      "recommendation_id": "rec_abc123",
      "category": "rebalance",
      "vote": "accept",
      "reason": "Makes sense",
      "created_at": "2026-07-09T12:00:00Z"
    }
  ],
  "summary": {
    "total": 87,
    "accept_rate": 0.71,
    "reject_rate": 0.21,
    "reconsider_rate": 0.08
  }
}
```

---

## 3. UPSTASH REDIS INTEGRATION

### 3.1 Why Upstash

Serverless Redis. REST API — no connection pooling, no self-hosted. Free tier: 10K commands/day. Ponytail pick.

### 3.2 Rate Limiting (Sliding Window)

```
User → POST /api/votes
  → Upstash: INCR user:{user_id}:votes:{minute_timestamp}
  → If count > 30 → 429 Too Many Requests
  → EXPIRE key 60s
```

```python
# middleware/rate_limit.py
import httpx

UPSTASH_URL = "https://{db}.upstash.io"
UPSTASH_TOKEN = os.getenv("UPSTASH_TOKEN")

async def check_rate_limit(user_id: str, limit: int = 30, window: int = 60) -> bool:
    key = f"user:{user_id}:votes:{int(time.time() // window)}"
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{UPSTASH_URL}/incr/{key}",
            headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"}
        )
        count = r.json()["result"]
        if count == 1:
            await client.post(
                f"{UPSTASH_URL}/expire/{key}/60",
                headers={"Authorization": f"Bearer {UPSTASH_TOKEN}"}
            )
        return count <= limit
```

### 3.3 Vote Counters (Real-Time Aggregation)

```python
# After each vote INSERT:
# Global counter: total votes per agent type
await upstash_incr(f"stats:{agent_type}:{vote}:total")  # stats:investment:accept:total

# Per-category counter
await upstash_incr(f"stats:{agent_type}:{category}:{vote}")  # stats:investment:rebalance:accept

# Leaderboard: top accepting users (anonymized)
await upstash_zincrby("leaderboard:accept_rate", 1, user_id)
```

### 3.4 Key Namespace

```
user:{user_id}:votes:{window}     — rate limiting
stats:{agent}:{vote}:total         — global counters
stats:{agent}:{category}:{vote}    — per-category counters
leaderboard:{metric}               — sorted sets
community:{agent}:{cohort}:{metric} — community benchmarks
```

### 3.5 Fail-Open

Upstash unavailable → rate limiting skipped (log warning). Voting continues with local DB only. Upstash counters eventually consistent (periodic reconciliation job).

---

## 4. MEMORY SYSTEM WRITE-BACK

### 4.1 Behavioral Pattern Recalculation

After each vote INSERT → trigger background recalculation:

```python
# Triggered async after vote commit
async def update_behavioral_patterns(user_id: str, agent_type: str):
    votes = await db.fetch_all(
        "SELECT category, vote, created_at FROM votes WHERE user_id = ? AND agent_type = ?",
        user_id, agent_type
    )

    patterns = {
        "accept_rate": accept_count / total,
        "reject_rate": reject_count / total,
        "by_category": {},          # { "rebalance": { accept: 12, reject: 3 } }
        "trend": "improving",      # accept_rate last 30d vs prior 30d
        "recent_3": [...],          # last 3 votes for quick context
    }

    # Write to user context file: behavioral_patterns.{agent_type}
    await update_user_context(user_id, {
        f"behavioral_patterns.{agent_type}": patterns
    })
```

### 4.2 User Context File Update

```json
// In user_context_file.json → behavioral_patterns
{
  "behavioral_patterns": {
    "investment": {
      "accept_rate": 0.71,
      "reject_rate": 0.21,
      "reconsider_rate": 0.08,
      "total_votes": 87,
      "by_category": {
        "rebalance": { "accept": 18, "reject": 4 },
        "tax_loss_harvest": { "accept": 12, "reject": 2 },
        "sector_rotation": { "accept": 5, "reject": 8 }
      },
      "trend": "improving",           // accept_rate rising last 30d
      "top_accepted_categories": ["rebalance", "tax_loss_harvest"],
      "top_rejected_categories": ["sector_rotation"],
      "last_updated": "2026-07-09T12:00:00Z"
    }
  }
}
```

### 4.3 Rules Engine (No Second LLM — Ponytail)

Pattern matching rules derive insights from vote ratios. No LLM call needed:

| Rule | Condition | Insight Written to `agent_insights` |
|------|-----------|--------------------------------------|
| Conservative sizing | reject rate on moves >7% portfolio > 50% | "User prefers smaller position adjustments (3-5% range)" |
| Tax-aware | accept rate on tax-loss harvesting > 80% | "User values tax optimization highly" |
| Fee-sensitive | reject rate on fee-related moves > 50% | "User prioritizes low-fee alternatives" |
| Growth-biased | accept rate on growth-sector recommendations > reject rate | "User favors growth over value in sector decisions" |
| Defensive | high accept rate on diversification + low-volatility recommendations | "User prioritizes downside protection" |
| Decision fatigue | reconsider rate trending up over 3 months | "User may be experiencing decision fatigue; simplify recommendations" |

These insights populate `agent_insights.{agent_type}_notes` in the user context file.

---

## 5. AGENT FEEDBACK LOOP

### 5.1 Confidence Calibration

Agent confidence (0–1) from skill catalog formulas. Votes provide ground truth:

```
calibration_error = agent_confidence - outcome
  where outcome = 1 for accept, 0 for reject, 0.5 for reconsider

Running calibration score = 1 - mean(abs(calibration_error))
  Score near 1 = agent well-calibrated
  Score near 0 = agent over/under-confident
```

After 20+ votes in a category: adjust confidence by calibration error.

```python
# Per-agent, per-category calibration
calibration = {
    "investment": {
        "rebalance": { "calibration_score": 0.82, "bias": -0.08 },
        "tax_loss_harvest": { "calibration_score": 0.91, "bias": +0.03 }
    }
}
```

Agent uses this at recommendation time: `adjusted_confidence = computed_confidence + bias` (clamped 0.15–0.95).

### 5.2 Agent Preamble Injection

At conversation start, agent system prompt includes:

```
[VOTING FEEDBACK] This user's accept rate for your investment recommendations
is 71% (trend: improving). They most frequently accept rebalance recommendations
(78%) and reject sector rotation suggestions (38%). Your calibration score is 0.82
(-0.08 bias: you overestimate acceptance). Adjust confidence downward slightly
for rebalance recommendations.
```

### 5.3 `agent_insights` Structure (from votes)

```json
{
  "agent_insights": {
    "investment_agent_notes": "User accepts 71% of recommendations (improving). Prefers 3-5% position adjustments. Values tax optimization (88% accept on TLH). Bias: -0.08 (agent slightly overconfident). Top rejected: sector rotation (38%).",
    "investment_agent_learning": {
      "calibration_score": 0.82,
      "bias": -0.08,
      "by_category": {
        "rebalance": { "calibration": 0.78, "bias": -0.05 },
        "tax_loss_harvest": { "calibration": 0.91, "bias": +0.03 }
      }
    }
  }
}
```

---

## 6. COMMUNITY BENCHMARKS

### 6.1 Opt-In, Anonymized

Users opt in via Settings: "Share anonymous voting stats to improve recommendations for everyone." Default: OFF.

### 6.2 Aggregate Schema

```sql
CREATE TABLE community_aggregates (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  metric TEXT NOT NULL,              -- e.g., "accept_rate", "avg_rebalance_accept"
  cohort TEXT NOT NULL DEFAULT 'all', -- e.g., "risk_moderate", "age_35_44", "income_100k_plus"
  value REAL NOT NULL,
  sample_size INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 Cohorts

Split by three axes for meaningful comparisons:

| Axis | Buckets |
|------|---------|
| Risk tolerance | conservative, moderate, aggressive |
| Age decade | 18-24, 25-34, 35-44, 45-54, 55-64, 65+ |
| Income tercile | bottom, middle, top |

Each cohort must have ≥ 10 users to show (k-anonymity, k=10). Below threshold → "not enough data."

### 6.4 Benchmarks Computed

```
Per agent type, per cohort:
  - Global accept rate
  - Per-category accept rates
  - Avg calibration score
  - Top-3 most-accepted categories
  - Top-3 most-rejected categories
  - Avg votes per active user (engagement)
```

### 6.5 Privacy Guarantees

- No individual vote data leaves device
- Only aggregate stats (mean, count) uploaded
- Differential privacy: ±2% noise added to all community numbers
- No cross-cohort inference (can't deduce "user in 35-44 age bracket who is conservative")
- Server stores only: `{agent_type, cohort, metric, value, sample_size}`
- k-anonymity strictly enforced: query returns NULL if sample_size < 10

### 6.6 Community API

```
GET /api/community/benchmarks?agent_type=investment&cohort=risk_moderate
→ {
    "accept_rate": 0.68,
    "sample_size": 142,
    "top_accepted": ["rebalance", "tax_loss_harvest"],
    "calibration_avg": 0.79
  }
```

### 6.7 Phase 1: Synthetic Baseline

Before real opt-in data exists: seed community benchmarks with synthetic distributions based on published financial behavior research. Labeled clearly as "estimated baseline." Replaced as real data flows in.

### 6.8 Phase 2: Central Server

Dedicated light endpoint (`benchmarks.fin.app`) for aggregate collection. POST only — no user-identifying data. Minimal schema. Open-source server for transparency.

---

## 7. API ENDPOINTS

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|-----------|-------------|
| `POST` | `/api/votes` | Required | 30/min/user | Cast or change vote |
| `GET` | `/api/votes` | Required | 100/min/user | User's vote history |
| `GET` | `/api/votes/{rec_id}` | Required | 100/min/user | Check vote on specific recommendation |
| `GET` | `/api/votes/summary` | Required | 30/min/user | Vote stats (accept rate, trend, by-category) |
| `GET` | `/api/votes/calibration/{agent_type}` | Required | 30/min/user | Agent calibration data |
| `GET` | `/api/community/benchmarks` | Optional | 10/min | Community aggregate stats |
| `POST` | `/api/votes/reconsider/check` | Required | Auto (system) | Check for due reconsider prompts |

### 7.1 POST /api/votes Logic

```
1. Validate: recommendation_id exists, vote in (accept, reject, reconsider)
2. Rate limit check (Upstash)
3. Check for existing vote:
   - No existing → INSERT
   - Existing, <24h old → UPDATE (allow change)
   - Existing, >24h old → 409 Conflict (vote locked)
4. Fire-and-forget async tasks:
   - Recalculate behavioral patterns → update user context
   - Increment Upstash counters
   - Update calibration scores
5. Return 201 with vote_id
```

### 7.2 Reconsider Lifecycle

```
reconsider vote → reconsider_at = created_at + 7d
  ↓
GET /api/votes/reconsider/check runs daily per user:
  → Finds votes with reconsider_at < now() AND vote = 'reconsider'
  → Sends push notification: "Reconsider Investment Agent's rebalance suggestion?"
  → User can re-vote (accept/reject) or snooze (+7d)
  → After 30d of snoozing: auto-convert to reject
```

---

## 8. CONFIDENCE DELTA TRACKING

Each vote captures `confidence_delta` = agent's stated confidence − user's perceived correctness.

```
delta > 0  → agent was overconfident (said 85%, user disagreed)
delta < 0  → agent was underconfident (said 60%, user found it compelling)
delta ≈ 0  → agent well-calibrated
```

This feeds directly into Section 5.1 calibration adjustment. Stored per vote for trend analysis.

---

## 9. DATA RETENTION

- Votes retained indefinitely (needed for behavioral pattern trending)
- Community aggregates: rolling 12-month window (older data purged)
- Upstash counters: TTL 90 days (refreshed by periodic reconciliation from SQLite)
- User can export vote history via `/api/votes/export` → CSV

---

## 10. TESTING

- [ ] Vote CRUD with idempotency enforcement
- [ ] 24h change window respected
- [ ] Rate limiting blocks at 31 votes/min
- [ ] Behavioral pattern recalculation triggers on vote
- [ ] Agent preamble includes calibration data on next session
- [ ] Reconsider lifecycle: 7d re-prompt, 30d auto-reject
- [ ] Community aggregates respect k-anonymity (block if < 10)
- [ ] Opt-out: no community data sent when disabled
- [ ] Upstash failure: votes still recorded locally, counters lag but don't block
- [ ] Confidence delta trends over 30+ votes show calibration improvement

---

*File created: 2026-07-09. Covers voting flow, Upstash rate limiting, behavioral pattern recalculation, agent feedback loop, community benchmarks.*