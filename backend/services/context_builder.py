"""Build structured user-context dictionaries for agent prompt injection.

Reads from the DB: user settings, portfolio state, debt accounts,
retirement goals, and recent agent memory. Returns a sanitized
dict that agents use to personalize recommendations.

Uses sync SQLAlchemy Session to match the existing FastAPI pattern.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from database import get_db
from models.debt import Debt
from models.memory import MemoryNode
from models.portfolio import Holding
from models.recommendation import Recommendation
from models.retirement import RetirementProfile
from models.settings import Setting
from services.input_sanitizer import sanitize_context_dict, sanitize_context_value


def build_user_context(
    db: Session,
    user_id: str,
    *,
    agent_type: str = "investment",
) -> dict[str, Any]:
    """Build a complete user context dict for the given agent type.

    Returns sanitized dict ready for prompt injection.
    Synchronous — matches the existing FastAPI + SQLite Session pattern.
    """
    context: dict[str, Any] = {
        "user_id": sanitize_context_value(user_id, "user_id"),
        "agent_type": agent_type,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # ── User settings / profile ───────────────────────────
    settings = db.query(Setting).filter(Setting.user_id == user_id).first()
    if settings:
        context["profile"] = {
            "annual_income_gross": sanitize_context_value(settings.annual_income_gross, "annual_income_gross"),
            "tax_bracket_federal": sanitize_context_value(settings.tax_bracket_federal, "tax_bracket_federal"),
            "tax_bracket_state": sanitize_context_value(settings.tax_bracket_state, "tax_bracket_state"),
            "age": sanitize_context_value(settings.age, "age"),
            "risk_tolerance": settings.risk_tolerance if settings.risk_tolerance else "",
            "investment_horizon_years": sanitize_context_value(settings.investment_horizon_years, "years_to_retirement"),
            "has_completed_wizard": bool(settings.has_completed_wizard),
        }
    else:
        context["profile"] = {}

    # ── Portfolio holdings ────────────────────────────────
    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.is_active == True)
        .all()
    )
    portfolio = {
        "total_value": 0.0,
        "holdings": [],
        "data_recency_days": 0,
    }
    for h in holdings:
        value = float(h.shares or 0) * float(h.current_price or 0)
        portfolio["total_value"] += value
        portfolio["holdings"].append({
            "ticker": sanitize_context_value(h.ticker, "ticker"),
            "name": sanitize_context_value(getattr(h, "name", h.ticker), "name"),
            "shares": sanitize_context_value(h.shares, "shares"),
            "current_price": sanitize_context_value(h.current_price, "current_value"),
            "cost_basis": sanitize_context_value(h.cost_basis, "current_value"),
            "current_value": value,
            "asset_class": sanitize_context_value(getattr(h, "asset_class", ""), "ticker"),
            "unrealized_gain_loss_percent": sanitize_context_value(
                getattr(h, "unrealized_gain_loss_percent", 0.0), "unrealized_gain_loss_percent"
            ),
        })
    # Data recency from last updated holding
    if holdings:
        try:
            last_updated = max(
                (getattr(h, "last_updated", None) for h in holdings),
                key=lambda d: d if d else datetime.min.replace(tzinfo=timezone.utc),
                default=None,
            )
            if last_updated:
                portfolio["data_recency_days"] = (datetime.now(timezone.utc) - last_updated).days
        except (ValueError, TypeError):
            portfolio["data_recency_days"] = 0
    context["portfolio"] = portfolio

    # ── Debt accounts (for debt + retirement agents) ──────
    if agent_type in ("debt", "retirement"):
        debts = db.query(Debt).filter(Debt.user_id == user_id).all()
        debt_list = []
        for d in debts:
            debt_list.append({
                "id": sanitize_context_value(str(d.id), "id"),
                "creditor": sanitize_context_value(d.creditor, "creditor"),
                "balance": sanitize_context_value(d.balance, "balance"),
                "interest_rate": sanitize_context_value(d.interest_rate, "interest_rate"),
                "min_payment": sanitize_context_value(d.min_payment, "balance"),
            })
        context["debts"] = debt_list
        context["total_debt"] = sum(float(d.get("balance", 0) or 0) for d in debt_list)

    # ── Retirement goals ──────────────────────────────────
    if agent_type in ("retirement", "investment"):
        goals = db.query(RetirementProfile).filter(RetirementProfile.user_id == user_id).all()
        retire = {}
        for g in goals:
            retire["target_retirement_age"] = sanitize_context_value(g.target_retirement_age, "target_retirement_age")
            retire["annual_retirement_spend"] = sanitize_context_value(g.annual_retirement_spend, "balance")
            retire["current_retirement_savings"] = sanitize_context_value(g.current_retirement_savings, "balance")
            retire["years_to_retirement"] = sanitize_context_value(g.years_to_retirement, "years_to_retirement")
        context["retirement"] = retire

    # ── Recent agent memory (last 5) ──────────────────────
    memories = (
        db.query(MemoryNode)
        .filter(MemoryNode.user_id == user_id, MemoryNode.agent_type == agent_type)
        .order_by(MemoryNode.created_at.desc())
        .limit(5)
        .all()
    )
    context["recent_memories"] = [
        {
            "summary": sanitize_context_value(m.summary, "agent_notes"),
            "agent_learning": sanitize_context_value(m.agent_learning, "agent_learning"),
            "created_at": str(m.created_at),
        }
        for m in memories
    ]

    # ── Historical execution rate ─────────────────────────
    recs = db.query(Recommendation).filter(Recommendation.user_id == user_id).all()
    total = len(recs)
    executed = sum(1 for r in recs if r.status == "executed")
    context["execution_rate"] = executed / total if total > 0 else 0.5

    # ── OWASP sanitize everything ─────────────────────────
    context = sanitize_context_dict(context)
    return context


async def build_context(user_id: str, agent_type: str = "orchestration") -> dict[str, Any]:
    """Async wrapper for backward compatibility — creates its own DB session."""
    db = next(get_db())
    try:
        return build_user_context(db, user_id, agent_type=agent_type)
    finally:
        db.close()
