# Task 1: Backend Models + Services for Execution Tracking

## Spec
From Phase 14 plan steps 1-3:

### 1. `backend/models/execution.py` — Rewrite the file
Keep existing ExecutionLog (trade execution tracking) but ADD these models:

```python
# ExecutionAction — tracks user decision on a recommendation
class ExecutionAction(Base):
    __tablename__ = "execution_actions"
    id: str (uuid PK)
    user_id: str (FK users.id, CASCADE delete)
    recommendation_id: str (FK recommendations.id, SET NULL on delete)
    status: str  # "accepted" | "rejected" | "pending" | "executed" | "abandoned"
    accepted_at: str | None  # ISO timestamp
    executed_at: str | None  # ISO timestamp
    rejected_at: str | None  # ISO timestamp
    check_in_count: int = 0  # how many check-ins have been sent
    last_check_in: str | None  # last check-in sent timestamp
    next_check_in: str | None  # next scheduled check-in timestamp
    created_at: str

    Indexes: user_id, recommendation_id, status, user_id+status

# FollowThrough — per-user scoring
class FollowThrough(Base):
    __tablename__ = "follow_through"
    id: str (uuid PK)
    user_id: str (FK users.id, CASCADE delete, UNIQUE)
    score: int = 50  # 0-100
    streak: int = 0  # consecutive executions
    acceptance_rate: float = 0.0  # 0.0-1.0
    execution_rate: float = 0.0  # 0.0-1.0
    total_accepted: int = 0
    total_executed: int = 0
    total_rejected: int = 0
    decision_speed_avg_hours: float = 0.0
    check_in_response_rate: float = 0.0
    updated_at: str
```

Use same pattern as existing: `_now()` helper, `mapped_column`, `String(36)` for UUIDs. The `Base` import is from `database`. Import Index from sqlalchemy.

### 2. `backend/services/execution_tracker.py` — New file
Functions:
- `log_accept(db, user_id, recommendation_id)` → create ExecutionAction with status="accepted", accepted_at=now, schedule first check-in at +3 days
- `log_execute(db, user_id, action_id)` → update action status="executed", executed_at=now, recalculate follow-through
- `log_reject(db, user_id, recommendation_id)` → create ExecutionAction with status="rejected", rejected_at=now, recalculate follow-through
- `log_abandon(db, user_id, action_id)` → mark stale actions as abandoned (called by scheduler or manual)
- `get_pending_actions(db, user_id)` → list actions where status in ("accepted", "pending") ordered by created_at desc
- `get_action(db, action_id)` → single action lookup

Also: when accepting, update the Recommendation.status to "accepted". When executing, update to "executed".

After each accept/execute/reject, call `recalculate_follow_through(db, user_id)` from follow_through.py.

### 3. `backend/services/follow_through.py` — New file
Functions:
- `get_follow_through(db, user_id)` → return FollowThrough row for user or create default
- `recalculate_follow_through(db, user_id)` → query all ExecutionAction rows for user, compute:
  - acceptance_rate = accepted_or_executed / total_decisions
  - execution_rate = executed / accepted
  - decision_speed_avg_hours = avg time between accepted_at and executed_at for executed actions
  - check_in_response_rate = responses_given / check_ins_sent (placeholder for now, use 0.0)
  - streak = count consecutive most recent "executed" actions going backwards
  - score = weighted: execution_rate*50 + (1 - abs(0.5-decisions_per_week_clamped))*25 + check_in_response_rate*15 + streak_bonus*10
    where decisions_per_week = total_decisions / max(1, weeks_since_first_action)
    and streak_bonus = min(1.0, streak/10.0)
  - clamp score to 0-100
- `get_execution_rate(db, user_id)` → lightweight: just return execution_rate float for use by confidence.py

## Context
- Project: FastAPI + SQLAlchemy 2.0 + SQLite
- Patterns: Use `mapped_column`, `String(36)` for UUIDs, `Text` for timestamps/long strings
- DB session: `from database import get_db` — functions receive `db: Session` parameter from sqlalchemy.orm
- Existing model `backend/models/execution.py` has ExecutionLog (trade execution). Keep it, add new models below.
- Recommendation model has status field we'll update via recommendation_engine.py

## Constraints
- No class wrappers. Plain functions.
- Error if recommendation/user not found → raise ValueError
- Use `from models.execution import ExecutionAction, FollowThrough` in services
- Match existing project style: __init__.py exports in models/__init__.py

## Files to modify/create
- `backend/models/execution.py` — ADD ExecutionAction and FollowThrough classes (keep existing ExecutionLog)
- `backend/models/__init__.py` — ADD imports for ExecutionAction, FollowThrough (check existing imports first)
- `backend/services/execution_tracker.py` — NEW file
- `backend/services/follow_through.py` — NEW file