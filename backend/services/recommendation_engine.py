"""Recommendation Engine — orchestrates agent generation and persistence.

Pipeline: Validate → Context Build → Agent Run → Confidence Score → Persist → Return.

Maps structured agent output to existing Recommendation model columns.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from sqlalchemy.orm import Session

from agents import DebtAgent, InvestmentAgent, RetirementAgent
from models.recommendation import Recommendation, Vote
from services.confidence import score_confidence
from services.context_builder import build_user_context
from services.input_sanitizer import (
    sanitize_agent_output,
    sanitize_user_input,
    validate_agent_type,
    validate_user_id,
)
from services.structured_output import (
    GenerateRequest,
    GenerateResponse,
    VoteRequest,
    VoteResponse,
)

# ── Agent registry ────────────────────────────────────────

AGENT_REGISTRY: dict[str, type] = {
    "investment": InvestmentAgent,
    "debt": DebtAgent,
    "retirement": RetirementAgent,
}

SKILL_ROUTER: dict[str, dict[str, str]] = {
    "investment": {
        "portfolio_review": "portfolio_review",
        "rebalance_plan": "rebalance_plan",
        "tax_loss_harvest": "tax_loss_harvest",
        "diversification_audit": "diversification_audit",
        "new_investment_plan": "new_investment_plan",
    },
    "debt": {
        "avalanche_analysis": "avalanche_analysis",
        "snowball_analysis": "snowball_analysis",
        "refinance_check": "refinance_check",
        "dti_analysis": "dti_analysis",
    },
    "retirement": {
        "projection": "projection",
        "catch_up_plan": "catch_up_plan",
        "withdrawal_strategy": "withdrawal_strategy",
        "social_security": "social_security",
        "account_optimization": "account_optimization",
    },
}


def _truncate(value: str, max_len: int = 10_000) -> str:
    """Truncate long text to fit DB Text column."""
    return value[:max_len] if value else ""


def _extract_structured(result: dict[str, Any]) -> dict[str, Any]:
    """Extract structured data from agent result, with fallback."""
    structured = result.get("structured") or {}
    if not isinstance(structured, dict):
        structured = {}
    return structured


def _map_to_model(
    agent_type: str,
    skill: str,
    structured: dict[str, Any],
    raw_text: str,
    model_used: str,
    tokens_used: int,
) -> dict[str, Any]:
    """Map structured output to existing Recommendation model columns."""
    confidence = structured.get("confidence", {})
    overall_conf = confidence.get("overall", 70) if isinstance(confidence, dict) else 70
    if isinstance(overall_conf, (int, float)):
        overall_conf = float(overall_conf)
    else:
        overall_conf = 70.0

    return {
        "recommendation_type": skill or "generate",
        "ticker": structured.get("ticker", ""),
        "action": structured.get("action", structured.get("title", "")),
        "quantity": structured.get("quantity"),
        "rationale": _truncate(structured.get("rationale", raw_text), 5000),
        "confidence_score": overall_conf,
        "risks": _truncate(json.dumps(structured.get("risks", [])), 4000),
        "alternatives": _truncate(json.dumps(structured.get("alternatives", [])), 4000),
        "before_state": _truncate(json.dumps(structured.get("before_state", {})), 4000),
        "after_state": _truncate(json.dumps(structured.get("after_state", {})), 4000),
        "model_used": model_used,
        "tokens_used": tokens_used,
    }


def generate_recommendation(
    db: Session,
    user_id: str,
    request: GenerateRequest,
) -> GenerateResponse:
    """Full pipeline: validate → context → agent → confidence → persist → return.

    Synchronous — runs agent via asyncio.run() internally.
    """
    import asyncio

    # ── Validate ──────────────────────────────────────────
    validate_user_id(user_id)
    agent_type = validate_agent_type(request.agent_type)
    safe_message = sanitize_user_input(request.user_message, max_length=2000)
    skill = request.skill or "generate"

    # ── Context ───────────────────────────────────────────
    context = build_user_context(db, user_id, agent_type=agent_type)

    # ── Agent ─────────────────────────────────────────────
    agent_cls = AGENT_REGISTRY[agent_type]
    agent = agent_cls()

    if skill in SKILL_ROUTER.get(agent_type, {}):
        method_name = SKILL_ROUTER[agent_type][skill]
        method = getattr(agent, method_name, None)
        if method:
            result = asyncio.run(method(context))
        else:
            result = asyncio.run(agent.generate(user_input=safe_message, context=context))
    else:
        result = asyncio.run(agent.generate(user_input=safe_message, context=context))

    structured = _extract_structured(result)
    raw_text = result.get("raw_text", "")
    tokens_used = result.get("tokens_used", 0)
    model_used = result.get("model_used", "")

    # ── Confidence ────────────────────────────────────────
    data_recency = context.get("portfolio", {}).get("data_recency_days", 0)
    has_goals = bool(
        context.get("retirement")
        or context.get("profile", {}).get("has_completed_wizard")
    )
    exec_rate = context.get("execution_rate", 0.5)

    system_scores = score_confidence(
        data_recency_days=data_recency,
        model_name=model_used,
        has_user_goals=has_goals,
        math_is_deterministic=(agent_type == "debt"),
        execution_rate=exec_rate,
    )

    # Blend LLM and system confidence
    llm_confidence = structured.get("confidence", {})
    if isinstance(llm_confidence, dict) and llm_confidence:
        blended = int((llm_confidence.get("overall", 70) + system_scores["overall"]) / 2)
        llm_confidence["overall"] = blended
        llm_confidence.update(
            {
                "math_certainty": system_scores["math_certainty"],
                "market_assumptions": system_scores["market_assumptions"],
                "user_goal_alignment": system_scores["user_goal_alignment"],
                "execution_likelihood": system_scores["execution_likelihood"],
                "explanation": system_scores["explanation"],
            }
        )
    else:
        structured["confidence"] = system_scores

    structured["agent_type"] = agent_type
    structured["model_used"] = model_used
    structured["tokens_used"] = tokens_used

    # ── Persist ───────────────────────────────────────────
    rec_id = str(uuid.uuid4())
    model_fields = _map_to_model(
        agent_type, skill, structured, raw_text, model_used, tokens_used
    )
    rec = Recommendation(
        id=rec_id,
        user_id=user_id,
        agent_type=agent_type,
        recommendation_type=model_fields["recommendation_type"],
        ticker=model_fields["ticker"] or None,
        action=sanitize_agent_output(model_fields["action"])[:2000],
        quantity=model_fields["quantity"],
        rationale=sanitize_agent_output(model_fields["rationale"]),
        confidence_score=model_fields["confidence_score"],
        risks=sanitize_agent_output(model_fields["risks"]),
        alternatives=sanitize_agent_output(model_fields["alternatives"]),
        before_state=model_fields["before_state"],
        after_state=model_fields["after_state"],
        status="pending",
        model_used=model_fields["model_used"],
        tokens_used=model_fields["tokens_used"],
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return GenerateResponse(
        recommendation_id=rec_id,
        agent_type=agent_type,
        structured=structured,
        raw_text=raw_text,
        tokens_used=tokens_used,
    )


def record_vote(
    db: Session,
    user_id: str,
    recommendation_id: str,
    vote: VoteRequest,
) -> VoteResponse:
    """Record a user vote + optional comment on a recommendation."""
    validate_user_id(user_id)

    rec = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.user_id == user_id,
    ).first()
    if not rec:
        raise ValueError(f"Recommendation {recommendation_id} not found")

    vote_map = {
        "accepted": "accepted",
        "rejected": "rejected",
        "deferred": "deferred",
    }
    rec.status = vote_map.get(vote.vote, "pending")

    vote_id = str(uuid.uuid4())
    vote_row = Vote(
        id=vote_id,
        user_id=user_id,
        recommendation_id=recommendation_id,
        vote=vote.vote,
        comment=sanitize_user_input(vote.comment, max_length=1000),
    )
    db.add(vote_row)
    db.commit()

    return VoteResponse(
        vote_id=vote_id,
        recommendation_id=rec.id,
        vote=vote.vote,
    )


def list_recommendations(
    db: Session,
    user_id: str,
    *,
    agent_type: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """List user's recommendations with optional filters."""
    validate_user_id(user_id)

    query = db.query(Recommendation).filter(Recommendation.user_id == user_id)
    if agent_type:
        query = query.filter(Recommendation.agent_type == agent_type)
    if status:
        query = query.filter(Recommendation.status == status)

    query = query.order_by(Recommendation.created_at.desc()).offset(offset).limit(limit)
    recs = query.all()

    return [
        {
            "id": r.id,
            "agent_type": r.agent_type,
            "recommendation_type": r.recommendation_type,
            "ticker": r.ticker,
            "action": r.action,
            "quantity": r.quantity,
            "rationale": r.rationale,
            "confidence_score": r.confidence_score,
            "risks": r.risks,
            "alternatives": r.alternatives,
            "before_state": r.before_state,
            "after_state": r.after_state,
            "status": r.status,
            "model_used": r.model_used,
            "tokens_used": r.tokens_used,
            "created_at": str(r.created_at),
        }
        for r in recs
    ]