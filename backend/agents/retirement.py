"""Retirement Agent — full agent with projection, scoring, and recommendations.

Ponytail: inherits BaseAgent, delegates to projection/scorer services.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from agents.base import BaseAgent
from agents.prompts.retirement import RETIREMENT_SYSTEM_PROMPT
from services.retirement_projection import ProjectionInputs, ProjectionResult, _to_dict, run_projection
from services.readiness_scorer import ReadinessScore, compute_score
from services.structured_output import RetirementRecommendation


class RetirementAgent(BaseAgent):
    """Generates structured retirement recommendations."""

    agent_type: str = "retirement"

    @property
    def output_schema(self) -> type[BaseModel]:
        return RetirementRecommendation

    def build_system_prompt(self) -> str:
        return RETIREMENT_SYSTEM_PROMPT

    # ── Sync convenience wrappers for API calls ────────────

    def calculate_projection(self, profile: dict[str, Any]) -> dict[str, Any]:
        """Run Monte Carlo projection from a retirement profile dict."""
        inputs = ProjectionInputs(
            current_age=int(profile.get("current_age", 30)),
            retirement_age=int(profile.get("retirement_age", 65)),
            current_savings=float(profile.get("current_savings", 0)),
            annual_contribution=float(profile.get("annual_contribution", 0)),
            expected_return=float(profile.get("assumed_return", 0.07)),
            inflation=float(profile.get("inflation_rate", 0.03)),
            desired_income=float(profile.get("desired_income", 0)),
            social_security=float(profile.get("social_security", 0)),
            employer_match_pct=float(profile.get("employer_match_pct", 0)),
            employer_match_limit=float(profile.get("employer_match_limit", 0)),
            income=float(profile.get("annual_income", 0)),
        )
        result = run_projection(inputs)
        return _to_dict(result)

    def calculate_readiness(self, profile: dict[str, Any]) -> dict[str, Any]:
        """Compute readiness score from retirement profile dict."""
        inputs = ProjectionInputs(
            current_age=int(profile.get("current_age", 30)),
            retirement_age=int(profile.get("retirement_age", 65)),
            current_savings=float(profile.get("current_savings", 0)),
            annual_contribution=float(profile.get("annual_contribution", 0)),
            expected_return=float(profile.get("assumed_return", 0.07)),
            inflation=float(profile.get("inflation_rate", 0.03)),
            desired_income=float(profile.get("desired_income", 0)),
            social_security=float(profile.get("social_security", 0)),
            income=float(profile.get("annual_income", 0)),
        )
        score_data = compute_score(inputs)
        return {
            "score": score_data.score,
            "label": score_data.label,
            "breakdown": score_data.breakdown,
            "details": score_data.details,
        }

    def generate_scenario(self, profile: dict[str, Any], scenario_type: str) -> dict[str, Any]:
        """Run what-if scenarios: contribution_change, age_change, return_change."""
        base = {
            "current_age": int(profile.get("current_age", 30)),
            "retirement_age": int(profile.get("retirement_age", 65)),
            "current_savings": float(profile.get("current_savings", 0)),
            "annual_contribution": float(profile.get("annual_contribution", 0)),
            "expected_return": float(profile.get("assumed_return", 0.07)),
            "inflation": float(profile.get("inflation_rate", 0.03)),
            "desired_income": float(profile.get("desired_income", 0)),
            "social_security": float(profile.get("social_security", 0)),
            "income": float(profile.get("annual_income", 0)),
        }

        scenarios: list[dict[str, Any]] = []

        if scenario_type == "contribution":
            # Show impact of +5%, +10%, +15% contribution rate
            for pct in [0.05, 0.10, 0.15]:
                extra = base["income"] * pct
                inputs = ProjectionInputs(
                    **{**base, "annual_contribution": base["annual_contribution"] + extra}
                )
                result = run_projection(inputs, use_cache=False)
                readiness = compute_score(inputs)
                scenarios.append({
                    "label": f"+{int(pct * 100)}% contribution (${extra:,.0f}/yr)",
                    "nest_egg": round(result.median_nest_egg, 0),
                    "success_rate": result.success_rate,
                    "score": readiness.score,
                })

        elif scenario_type == "age":
            for age in [62, 67, 70]:
                if age <= base["current_age"]:
                    continue
                inputs = ProjectionInputs(**{**base, "retirement_age": age})
                result = run_projection(inputs, use_cache=False)
                readiness = compute_score(inputs)
                scenarios.append({
                    "label": f"Retire at {age}",
                    "nest_egg": round(result.median_nest_egg, 0),
                    "success_rate": result.success_rate,
                    "score": readiness.score,
                })

        elif scenario_type == "return":
            for r in [0.05, 0.07, 0.09]:
                inputs = ProjectionInputs(**{**base, "expected_return": r})
                result = run_projection(inputs, use_cache=False)
                readiness = compute_score(inputs)
                scenarios.append({
                    "label": f"{int(r * 100)}% return assumption",
                    "nest_egg": round(result.median_nest_egg, 0),
                    "success_rate": result.success_rate,
                    "score": readiness.score,
                })

        # Baseline for comparison
        base_inputs = ProjectionInputs(**base)
        base_result = run_projection(base_inputs, use_cache=False)
        base_readiness = compute_score(base_inputs)

        return {
            "baseline": {
                "nest_egg": round(base_result.median_nest_egg, 0),
                "success_rate": base_result.success_rate,
                "score": base_readiness.score,
                "label": base_readiness.label,
            },
            "scenarios": scenarios,
        }


# ── Self-check ──────────────────────────────────────
def _demo():
    agent = RetirementAgent()
    profile = {
        "current_age": 30,
        "retirement_age": 65,
        "current_savings": 50000,
        "annual_contribution": 10000,
        "annual_income": 80000,
        "assumed_return": 0.07,
        "inflation_rate": 0.03,
        "desired_income": 60000,
    }
    proj = agent.calculate_projection(profile)
    assert proj["median_nest_egg"] > 0
    readiness = agent.calculate_readiness(profile)
    assert 0 <= readiness["score"] <= 100
    scenarios = agent.generate_scenario(profile, "contribution")
    assert len(scenarios["scenarios"]) == 3
    print(f"OK: projection={proj['median_nest_egg']:,.0f}, score={readiness['score']}, scenarios={len(scenarios['scenarios'])}")


if __name__ == "__main__":
    _demo()