"""Execution router — track follow-through on recommendations.

Endpoints:
  POST /api/execution/accept  — accept a recommendation (creates action + schedules check-in)
  POST /api/execution/execute — mark action as executed
  POST /api/execution/reject  — reject a recommendation
  POST /api/execution/abandon — mark stale action as abandoned
  GET  /api/execution/pending — list pending actions for current user
  GET  /api/execution/stats   — follow-through stats + score
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.user import User
from services.execution_tracker import (
    get_action,
    get_pending_actions,
    log_abandon,
    log_accept,
    log_execute,
    log_reject,
)
from services.follow_through import get_follow_through
from services.input_sanitizer import validate_user_id

router = APIRouter(prefix="/api/execution", tags=["execution"])


# ── Request models ────────────────────────────────────────

class _RecId(BaseModel):
    recommendation_id: str


class _ActionId(BaseModel):
    action_id: str


def _user_id(user: User = Depends(get_current_user)) -> str:
    validate_user_id(user.id)
    return user.id


# ── Endpoints ─────────────────────────────────────────────


@router.post("/accept")
def accept_recommendation(
    body: _RecId,
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """Accept a recommendation, create execution action, schedule check-in."""
    try:
        action = log_accept(db, user_id, body.recommendation_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "action_id": action.id,
        "status": action.status,
        "next_check_in": action.next_check_in,
    }


@router.post("/execute")
def execute_action(
    body: _ActionId,
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """Mark an accepted action as executed."""
    try:
        action = log_execute(db, user_id, body.action_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "action_id": action.id,
        "status": action.status,
    }


@router.post("/reject")
def reject_recommendation(
    body: _RecId,
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """Reject a recommendation."""
    try:
        action = log_reject(db, user_id, body.recommendation_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "action_id": action.id,
        "status": action.status,
    }


@router.post("/abandon")
def abandon_action(
    body: _ActionId,
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """Mark a stale action as abandoned."""
    try:
        action = log_abandon(db, user_id, body.action_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {
        "action_id": action.id,
        "status": action.status,
    }


@router.get("/pending")
def list_pending(
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """List accepted/pending execution actions for the current user."""
    actions = get_pending_actions(db, user_id)
    return [
        {
            "action_id": a.id,
            "recommendation_id": a.recommendation_id,
            "status": a.status,
            "accepted_at": a.accepted_at,
            "next_check_in": a.next_check_in,
            "check_in_count": a.check_in_count,
        }
        for a in actions
    ]


@router.get("/stats")
def get_stats(
    user_id: str = Depends(_user_id),
    db: Session = Depends(get_db),
):
    """Get follow-through stats and score for current user."""
    ft = get_follow_through(db, user_id)
    return {
        "score": ft.score,
        "streak": ft.streak,
        "acceptance_rate": ft.acceptance_rate,
        "execution_rate": ft.execution_rate,
        "total_accepted": ft.total_accepted,
        "total_executed": ft.total_executed,
        "total_rejected": ft.total_rejected,
        "decision_speed_avg_hours": ft.decision_speed_avg_hours,
        "check_in_response_rate": ft.check_in_response_rate,
    }