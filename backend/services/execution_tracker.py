"""Execution tracker — logs user decisions (accept/execute/reject/abandon) and recalculates follow-through."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from models.execution import ExecutionAction
from models.recommendation import Recommendation
from services.follow_through import recalculate_follow_through


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _days_from_now(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def log_accept(db: Session, user_id: str, recommendation_id: str) -> ExecutionAction:
    """Create accepted ExecutionAction, update recommendation status, schedule first check-in."""
    # Update recommendation status
    rec = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == user_id,
    ).first()
    if rec:
        rec.status = "accepted"

    action = ExecutionAction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        recommendation_id=recommendation_id,
        status="accepted",
        accepted_at=_now(),
        next_check_in=_days_from_now(3),
    )
    db.add(action)
    db.commit()
    recalculate_follow_through(db, user_id)
    return action


def log_execute(db: Session, user_id: str, action_id: str) -> ExecutionAction:
    """Mark action as executed, update recommendation status."""
    action = db.query(ExecutionAction).filter(
        ExecutionAction.id == action_id,
        ExecutionAction.user_id == user_id,
    ).first()
    if not action:
        raise ValueError(f"ExecutionAction {action_id} not found")

    action.status = "executed"
    action.executed_at = _now()

    # Update recommendation too
    if action.recommendation_id:
        rec = db.query(Recommendation).filter(
            Recommendation.id == action.recommendation_id,
        ).first()
        if rec:
            rec.status = "executed"

    db.commit()
    recalculate_follow_through(db, user_id)
    return action


def log_reject(db: Session, user_id: str, recommendation_id: str) -> ExecutionAction:
    """Create rejected ExecutionAction, update recommendation status."""
    rec = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == user_id,
    ).first()
    if rec:
        rec.status = "rejected"

    action = ExecutionAction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        recommendation_id=recommendation_id,
        status="rejected",
        rejected_at=_now(),
    )
    db.add(action)
    db.commit()
    recalculate_follow_through(db, user_id)
    return action


def log_abandon(db: Session, user_id: str, action_id: str) -> ExecutionAction:
    """Mark stale action as abandoned."""
    action = db.query(ExecutionAction).filter(
        ExecutionAction.id == action_id,
        ExecutionAction.user_id == user_id,
    ).first()
    if not action:
        raise ValueError(f"ExecutionAction {action_id} not found")

    action.status = "abandoned"
    db.commit()
    recalculate_follow_through(db, user_id)
    return action


def get_pending_actions(db: Session, user_id: str) -> list[ExecutionAction]:
    """List accepted/pending actions ordered by created_at desc."""
    return (
        db.query(ExecutionAction)
        .filter(
            ExecutionAction.user_id == user_id,
            ExecutionAction.status.in_(["accepted", "pending"]),
        )
        .order_by(ExecutionAction.created_at.desc())
        .all()
    )


def get_action(db: Session, action_id: str) -> ExecutionAction | None:
    """Single action lookup."""
    return db.query(ExecutionAction).filter(ExecutionAction.id == action_id).first()