"""Pydantic schemas for Instructor-structured LLM output.

Each agent's recommendation MUST conform to these schemas.
Instructor + Ollama enforces this at generation time via constrained decoding.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, field_validator


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Shared confidence breakdown ──────────────────────────

class ConfidenceBreakdown(BaseModel):
    """Multi-axis confidence scores (0-100)."""
    overall: int = Field(..., ge=0, le=100, description="Overall confidence in recommendation")
    math_certainty: int = Field(..., ge=0, le=100, description="Mathematical certainty")
    market_assumptions: int = Field(default=50, ge=0, le=100, description="Confidence in market/data assumptions")
    user_goal_alignment: int = Field(default=70, ge=0, le=100, description="How well this fits user's stated goals")
    execution_likelihood: int = Field(default=50, ge=0, le=100, description="How likely user is to execute this")
    explanation: str = Field(default="", max_length=500)


# ── Timeline / impact ────────────────────────────────────

class TimelineEntry(BaseModel):
    milestone: str = Field(..., max_length=200)
    date: str = Field(default="", max_length=50)
    value: float | None = None


class ImpactSummary(BaseModel):
    financial_impact: str = Field(default="", max_length=500)
    retirement_impact: str = Field(default="", max_length=500)
    monthly_cash_flow_change: float = 0.0
    total_interest_saved: float | None = None
    projected_portfolio_change: float | None = None
    timeline: list[TimelineEntry] = Field(default_factory=list)


# ── Risks and alternatives ───────────────────────────────

class RiskItem(BaseModel):
    risk: str = Field(..., max_length=200)
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")
    mitigation: str = Field(default="", max_length=300)


class Alternative(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=500)
    tradeoff: str = Field(default="", max_length=300)


# ── Agent-specific structured outputs ────────────────────

class InvestmentRecommendation(BaseModel):
    """Structured output from Investment Agent."""
    agent_type: str = Field(default="investment", pattern=r"^investment$")
    recommendation_type: str = Field(default="portfolio_action", max_length=50)
    title: str = Field(..., max_length=200, description="Clear action title")
    ticker: str | None = Field(default=None, max_length=10)
    action: str = Field(..., max_length=2000, description="What to do, detailed")
    quantity: float | None = Field(default=None, description="Shares or percentage")
    rationale: str = Field(..., max_length=3000, description="Why this recommendation")
    confidence: ConfidenceBreakdown
    impact: ImpactSummary
    risks: list[RiskItem] = Field(default_factory=list, max_length=10)
    alternatives: list[Alternative] = Field(default_factory=list, max_length=5)
    before_state: str = Field(default="", max_length=2000)
    after_state: str = Field(default="", max_length=2000)
    model_used: str = Field(default="", max_length=100)
    tokens_used: int = 0

    @field_validator("rationale")
    @classmethod
    def no_empty_rationale(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Rationale is required")
        return v


class DebtRecommendation(BaseModel):
    """Structured output from Debt Agent."""
    agent_type: str = Field(default="debt", pattern=r"^debt$")
    recommendation_type: str = Field(default="debt_strategy", max_length=50)
    title: str = Field(..., max_length=200)
    action: str = Field(..., max_length=2000)
    rationale: str = Field(..., max_length=3000)
    confidence: ConfidenceBreakdown
    impact: ImpactSummary
    risks: list[RiskItem] = Field(default_factory=list, max_length=10)
    alternatives: list[Alternative] = Field(default_factory=list, max_length=5)
    payoff_strategy: str = Field(
        default="avalanche_modified",
        pattern=r"^(avalanche|snowball|avalanche_modified|custom)$"
    )
    model_used: str = Field(default="", max_length=100)
    tokens_used: int = 0

    @field_validator("rationale")
    @classmethod
    def no_empty_rationale(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Rationale is required")
        return v


class RetirementRecommendation(BaseModel):
    """Structured output from Retirement Agent."""
    agent_type: str = Field(default="retirement", pattern=r"^retirement$")
    recommendation_type: str = Field(default="retirement_strategy", max_length=50)
    title: str = Field(..., max_length=200)
    action: str = Field(..., max_length=2000)
    rationale: str = Field(..., max_length=3000)
    confidence: ConfidenceBreakdown
    impact: ImpactSummary
    risks: list[RiskItem] = Field(default_factory=list, max_length=10)
    alternatives: list[Alternative] = Field(default_factory=list, max_length=5)
    funded_percentage: float = Field(default=0.0, ge=0, le=2.0, description="Current funded % (1.0 = 100%)")
    projected_funded_percentage: float = Field(default=0.0, ge=0, le=2.0, description="After action funded %")
    model_used: str = Field(default="", max_length=100)
    tokens_used: int = 0

    @field_validator("rationale")
    @classmethod
    def no_empty_rationale(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Rationale is required")
        return v


# ── Union type for router dispatch ───────────────────────

AgentRecommendation = InvestmentRecommendation | DebtRecommendation | RetirementRecommendation


# ── API request schemas ──────────────────────────────────

class GenerateRequest(BaseModel):
    """Request to generate a recommendation."""
    agent_type: str = Field(..., pattern=r"^(investment|debt|retirement)$")
    user_message: str = Field(default="", max_length=2000)
    skill: str | None = Field(default=None, max_length=100, description="Specific skill to invoke")


class GenerateResponse(BaseModel):
    """Response from recommendation generation."""
    recommendation_id: str
    agent_type: str
    structured: dict[str, Any]
    raw_text: str = Field(default="", max_length=10000)
    tokens_used: int = 0
    created_at: str = Field(default_factory=_now)


class VoteRequest(BaseModel):
    """User vote on a recommendation."""
    vote: str = Field(..., pattern=r"^(accepted|rejected|deferred)$")
    comment: str = Field(default="", max_length=1000)
    user_reasoning: str = Field(default="", max_length=500)


class VoteResponse(BaseModel):
    """Response after recording a vote."""
    vote_id: str
    recommendation_id: str
    vote: str
    created_at: str = Field(default_factory=_now)