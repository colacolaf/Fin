"""Follow-through scoring — per-user execution discipline tracking.

Calculates a 0–100 score based on:
- execution_rate * 50  (did you actually do what you accepted?)
- decision_pace * 25   (are you making decisions at a healthy pace?)
- check_in_response * 15 (do you respond to nudges?)
- streak_bonus * 10     (consecutive executions rewarded)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from math import ceil

from sqlalchemy.orm import Session

from models.execution import ExecutionAction, FollowThrough


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_follow_through(db: Session, user_id: str) -> FollowThrough:
    """Return FollowThrough row for user, creating a default one if none exists."""
    ft = db.query(FollowThrough).filter(FollowThrough.user_id == user_id).first()
    if ft is None:
        ft = FollowThrough(
            id=str(uuid.uuid4()),
            user_id=user_id,
            score=50,
        )
        db.add(ft)
        db.commit()
        db.refresh(ft)
    return ft


def recalculate_follow_through(db: Session, user_id: str) -> FollowThrough:
    """Recompute all follow-through stats from ExecutionAction rows."""
    actions = (
        db.query(ExecutionAction)
        .filter(ExecutionAction.user_id == user_id)
        .order_by(ExecutionAction.created_at.desc())
        .all()
    )

    total = len(actions)
    accepted = sum(1 for a in actions if a.status in ("accepted", "executed"))
    executed = sum(1 for a in actions if a.status == "executed")
    rejected = sum(1 for a in actions if a.status == "rejected")

    # Rates
    acceptance_rate = accepted / total if total > 0 else 0.0
    execution_rate = executed / accepted if accepted > 0 else 0.0

    # Decision speed
    speeds = []
    for a in actions:
        if a.status == "executed" and a.accepted_at and a.executed_at:
            try:
                acc_dt = datetime.fromisoformat(a.accepted_at)
                exec_dt = datetime.fromisoformat(a.executed_at)
                hours = (exec_dt - acc_dt).total_seconds() / 3600
                if hours >= 0:
                    speeds.append(hours)
            except (ValueError, TypeError):
                pass
    decision_speed_avg_hours = sum(speeds) / len(speeds) if speeds else 0.0

    # Check-in response rate — placeholder until check-in tracking is wired
    check_in_response_rate = 0.0

    # Streak — consecutive executions going backward from most recent
    streak = 0
    for a in actions:
        if a.status == "executed":
            streak += 1
        else:
            break

    # Decisions per week
    decisions_per_week = 0.0
    if total > 0 and actions:
        # Use time between first and last action
        first_created = actions[-1].created_at
        last_created = actions[0].created_at
        try:
            first_dt = datetime.fromisoformat(first_created)
            last_dt = datetime.fromisoformat(last_created)
            span_hours = (last_dt - first_dt).total_seconds() / 3600
            if span_hours > 0:
                weeks = max(1.0, span_hours / (24 * 7))
                decisions_per_week = total / weeks
        except (ValueError, TypeError):
            pass

    # Clamp decisions_per_week to 0–1 range (ideal ~0.5/week)
    dpw_clamped = min(1.0, decisions_per_week)

    # Score components
    exec_score = execution_rate * 50
    pace_score = (1.0 - abs(0.5 - dpw_clamped)) * 25
    response_score = check_in_response_rate * 15
    streak_bonus = min(1.0, streak / 10.0) * 10

    score = int(exec_score + pace_score + response_score + streak_bonus)
    score = max(0, min(100, score))

    ft = get_follow_through(db, user_id)
    ft.score = score
    ft.streak = streak
    ft.acceptance_rate = acceptance_rate
    ft.execution_rate = execution_rate
    ft.total_accepted = accepted
    ft.total_executed = executed
    ft.total_rejected = rejected
    ft.decision_speed_avg_hours = decision_speed_avg_hours
    ft.check_in_response_rate = check_in_response_rate
    ft.updated_at = _now()

    db.commit()
    db.refresh(ft)
    return ft


def get_execution_rate(db: Session, user_id: str) -> float:
    """Lightweight: return just the execution rate float for confidence scoring."""
    ft = get_follow_through(db, user_id)
    return ft.execution_rate