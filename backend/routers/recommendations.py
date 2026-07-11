"""Recommendations router — agent-generated financial recommendations.

Endpoints:
  POST   /api/recommendations/generate     — Generate a new recommendation
  GET    /api/recommendations/              — List user's recommendations
  GET    /api/recommendations/{id}          — Get single recommendation
  POST   /api/recommendations/{id}/vote     — Vote on a recommendation
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.dependencies import get_current_user
from agents import InvestmentAgent
from database import get_db
from models.user import User
from services.recommendation_engine import (
    generate_recommendation,
    list_recommendations,
    record_vote,
)
from services.structured_output import (
    GenerateRequest,
    GenerateResponse,
    VoteRequest,
    VoteResponse,
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/health")
def health() -> dict:
    """Health check for the Investment Agent and Ollama connectivity (no auth)."""
    try:
        agent = InvestmentAgent()
        result = agent.health_check()
        return {
            "ok": result.get("ok", False),
            "model": result.get("model", ""),
            "available_models": result.get("available_models", []),
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "model": "", "available_models": []}


@router.post("/generate", response_model=GenerateResponse, status_code=status.HTTP_201_CREATED)
def generate(
    request: GenerateRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> GenerateResponse:
    """Generate a recommendation using the specified agent type.

    Runs the full pipeline: validate → context → agent → confidence → persist.
    """
    try:
        return generate_recommendation(db, str(user.id), request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent generation failed: {e}",
        )


@router.get("/")
def list_all(
    agent_type: str | None = Query(None, description="Filter by agent type"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> list[dict]:
    """List all recommendations for the current user."""
    try:
        return list_recommendations(
            db, str(user.id), agent_type=agent_type, status=status_filter, limit=limit, offset=offset
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{recommendation_id}")
def get_one(
    recommendation_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    """Get a single recommendation by ID."""
    from models.recommendation import Recommendation

    rec = (
        db.query(Recommendation)
        .filter(Recommendation.id == recommendation_id, Recommendation.user_id == str(user.id))
        .first()
    )
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    return {
        "id": rec.id,
        "agent_type": rec.agent_type,
        "recommendation_type": rec.recommendation_type,
        "ticker": rec.ticker,
        "action": rec.action,
        "quantity": rec.quantity,
        "rationale": rec.rationale,
        "confidence_score": rec.confidence_score,
        "risks": rec.risks,
        "alternatives": rec.alternatives,
        "before_state": rec.before_state,
        "after_state": rec.after_state,
        "status": rec.status,
        "model_used": rec.model_used,
        "tokens_used": rec.tokens_used,
        "created_at": str(rec.created_at),
        "expires_at": str(rec.expires_at) if rec.expires_at else None,
    }


@router.post("/{recommendation_id}/vote", response_model=VoteResponse)
def vote(
    recommendation_id: str,
    vote_request: VoteRequest,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> VoteResponse:
    """Cast a vote (accepted/rejected/deferred) on a recommendation."""
    try:
        return record_vote(db, str(user.id), recommendation_id, vote_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))