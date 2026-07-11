"""Retirement router — projection, readiness, scenarios, recommendations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from agents.retirement import RetirementAgent
from auth.dependencies import get_current_user
from models.user import User
from services.input_sanitizer import sanitize_context_dict

router = APIRouter(prefix="/api/retirement", tags=["retirement"])

# Single agent instance (stateless, cached projections)
_agent = RetirementAgent()


# ── Profile helpers ────────────────────────────────────

def _build_profile(data: dict[str, Any]) -> dict[str, Any]:
    """Normalize incoming profile data with defaults."""
    return {
        "current_age": int(data.get("current_age", 30)),
        "retirement_age": int(data.get("retirement_age", 65)),
        "current_savings": float(data.get("current_savings", 0)),
        "annual_contribution": float(data.get("annual_contribution", 0)),
        "annual_income": float(data.get("annual_income", 0)),
        "assumed_return": float(data.get("assumed_return", 0.07)),
        "inflation_rate": float(data.get("inflation_rate", 0.03)),
        "desired_income": float(data.get("desired_income", 0)),
        "social_security": float(data.get("social_security", 0)),
        "employer_match_pct": float(data.get("employer_match_pct", 0)),
        "employer_match_limit": float(data.get("employer_match_limit", 0)),
    }


# ── Projection ─────────────────────────────────────────

@router.post("/projection")
async def run_projection(
    profile: dict[str, Any],
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Run Monte Carlo retirement projection."""
    normalized = _build_profile(sanitize_context_dict(profile))
    return _agent.calculate_projection(normalized)


# ── Readiness Score ────────────────────────────────────

@router.post("/readiness")
async def get_readiness(
    profile: dict[str, Any],
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Compute retirement readiness score (0-100)."""
    normalized = _build_profile(sanitize_context_dict(profile))
    return _agent.calculate_readiness(normalized)


# ── Scenarios ──────────────────────────────────────────

@router.get("/scenarios")
async def run_scenarios(
    user: User = Depends(get_current_user),
    scenario_type: str = Query(
        default="contribution",
        pattern=r"^(contribution|age|return)$",
        description="Scenario type: contribution, age, or return",
    ),
    current_age: int = Query(default=30, ge=18, le=100),
    retirement_age: int = Query(default=65, ge=50, le=80),
    current_savings: float = Query(default=0, ge=0),
    annual_contribution: float = Query(default=0, ge=0),
    annual_income: float = Query(default=0, ge=0),
    assumed_return: float = Query(default=0.07, ge=0.01, le=0.20),
    inflation_rate: float = Query(default=0.03, ge=0.0, le=0.10),
    desired_income: float = Query(default=0, ge=0),
    social_security: float = Query(default=0, ge=0),
) -> dict[str, Any]:
    """Run what-if scenarios."""
    profile = _build_profile({
        "current_age": current_age,
        "retirement_age": retirement_age,
        "current_savings": current_savings,
        "annual_contribution": annual_contribution,
        "annual_income": annual_income,
        "assumed_return": assumed_return,
        "inflation_rate": inflation_rate,
        "desired_income": desired_income,
        "social_security": social_security,
    })
    return _agent.generate_scenario(profile, scenario_type)


# ── Quick score (GET, no auth for public health) ───────

@router.get("/quick-score")
async def quick_score(
    current_age: int = Query(default=30, ge=18, le=100),
    retirement_age: int = Query(default=65, ge=50, le=80),
    current_savings: float = Query(default=0, ge=0),
    annual_contribution: float = Query(default=0, ge=0),
    annual_income: float = Query(default=0, ge=0),
) -> dict[str, Any]:
    """Quick readiness score from minimal inputs. No auth required (public calculator)."""
    profile = _build_profile({
        "current_age": current_age,
        "retirement_age": retirement_age,
        "current_savings": current_savings,
        "annual_contribution": annual_contribution,
        "annual_income": annual_income,
    })
    return _agent.calculate_readiness(profile)