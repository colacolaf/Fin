"""Confidence scoring engine for agent recommendations.

Calculates multi-axis confidence (0-100) based on:
- Data recency (how stale is the source data?)
- Model/provider reliability (which LLM? fallback = lower confidence)
- User goal alignment (did user provide clear goals?)
- Math certainty (deterministic calculation vs probabilistic guess)
- Historical execution rate (does this user actually follow through?)

Formula: weighted harmonic mean across axes, capped at 100.
"""

from __future__ import annotations


def score_confidence(
    *,
    data_recency_days: int = 0,
    model_name: str = "",
    has_user_goals: bool = False,
    math_is_deterministic: bool = False,
    execution_rate: float = 0.5,
) -> dict[str, int]:
    """Score all confidence axes. Returns dict suitable for ConfidenceBreakdown.

    Args:
        data_recency_days: Days since source data was refreshed. 0 = live, 30+ = stale.
        model_name: Ollama model used. Empty = unknown/fallback.
        has_user_goals: Whether user has explicitly set goals.
        math_is_deterministic: True if calculation is deterministic (e.g., debt payoff).
        execution_rate: 0-1 historical execution rate. 0.5 = unknown/new user.
    """
    # ── Math certainty ────────────────────────────────────
    math_certainty = 90 if math_is_deterministic else 55

    # ── Data recency ──────────────────────────────────────
    if data_recency_days <= 1:
        market_assumptions = 85
    elif data_recency_days <= 7:
        market_assumptions = 70
    elif data_recency_days <= 30:
        market_assumptions = 50
    else:
        market_assumptions = 25

    # ── Model reliability ─────────────────────────────────
    # Higher for known good models, lower for fallbacks
    model_lower = model_name.lower()
    if "llama3.3" in model_lower or "llama-3.3" in model_lower:
        model_bonus = 10
    elif "llama3" in model_lower or "mistral" in model_lower:
        model_bonus = 5
    elif "qwen" in model_lower:
        model_bonus = 2
    else:
        model_bonus = 0
    market_assumptions = min(100, market_assumptions + model_bonus)

    # ── User goal alignment ───────────────────────────────
    user_goal_alignment = 85 if has_user_goals else 40

    # ── Execution likelihood ──────────────────────────────
    execution_likelihood = int(execution_rate * 100)

    # ── Overall: weighted harmonic-ish mean ────────────────
    weights = {
        "math_certainty": 0.25,
        "market_assumptions": 0.20,
        "user_goal_alignment": 0.35,
        "execution_likelihood": 0.20,
    }
    components = {
        "math_certainty": math_certainty,
        "market_assumptions": market_assumptions,
        "user_goal_alignment": user_goal_alignment,
        "execution_likelihood": execution_likelihood,
    }
    weighted_sum = sum(weights[k] * components[k] for k in weights)
    overall = int(weighted_sum)
    overall = max(0, min(100, overall))

    return {
        "overall": overall,
        "math_certainty": math_certainty,
        "market_assumptions": market_assumptions,
        "user_goal_alignment": user_goal_alignment,
        "execution_likelihood": execution_likelihood,
        "explanation": _explain(overall, data_recency_days, has_user_goals),
    }


def _explain(overall: int, data_recency_days: int, has_user_goals: bool) -> str:
    """Generate human-readable confidence explanation."""
    parts = []
    if overall >= 80:
        parts.append("High confidence")
    elif overall >= 60:
        parts.append("Moderate confidence")
    else:
        parts.append("Low confidence")

    if data_recency_days > 7:
        parts.append(f"—data is {data_recency_days}d old")
    if not has_user_goals:
        parts.append("—set explicit goals for better alignment")
    return " ".join(parts)