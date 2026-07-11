"""Retirement readiness score: composite 0-100 score synthesizing
projection, savings rate, and age-based benchmarks.

ponytail: simple weighted formula, no ML.
"""

from __future__ import annotations

from dataclasses import dataclass

from services.retirement_projection import ProjectionInputs, ProjectionResult, run_projection

# Weights for composite score (must sum to 1.0)
W_PROJECTION = 0.45   # Monte Carlo success rate
W_SAVINGS_RATE = 0.25  # % of income saved
W_FUNDED_RATIO = 0.20   # current savings vs needed
W_AGE_BENCHMARK = 0.10  # how you compare to age-based savings benchmarks


@dataclass
class ReadinessScore:
    score: float  # 0-100
    label: str    # Critical, Needs Attention, On Track, Excellent
    breakdown: dict[str, float]
    details: dict[str, float | str]


def compute_score(inputs: ProjectionInputs) -> ReadinessScore:
    """Compute retirement readiness score from projection inputs."""
    result = run_projection(inputs)

    # 1. Projection success rate → 0..100
    projection_score = result.success_rate * 100

    # 2. Savings rate score: 15%+ = 100, 0% = 0
    savings_rate = inputs.annual_contribution / inputs.income if inputs.income > 0 else 0
    savings_score = min(100, (savings_rate / 0.15) * 100)

    # 3. Funded ratio score
    funded_score = min(100, result.funded_percentage * 100)

    # 4. Age benchmark: savings should be 1× income by 30, 3× by 40, 6× by 50, 8× by 60
    age_benchmarks = {30: 1.0, 40: 3.0, 50: 6.0, 60: 8.0, 65: 10.0}
    target_multiple = 1.0
    for age, mult in sorted(age_benchmarks.items()):
        if inputs.current_age >= age:
            target_multiple = mult
        else:
            break
    age_ratio = inputs.current_savings / (inputs.income * target_multiple) if inputs.income > 0 else 0
    age_score = min(100, age_ratio * 100)

    # Composite
    raw = (
        W_PROJECTION * projection_score
        + W_SAVINGS_RATE * savings_score
        + W_FUNDED_RATIO * funded_score
        + W_AGE_BENCHMARK * age_score
    )
    score = round(min(100, max(0, raw)))

    label = _score_label(score)

    return ReadinessScore(
        score=score,
        label=label,
        breakdown={
            "projection": round(projection_score, 1),
            "savings_rate": round(savings_score, 1),
            "funded_ratio": round(funded_score, 1),
            "age_benchmark": round(age_score, 1),
        },
        details={
            "success_rate": result.success_rate,
            "savings_rate_pct": round(savings_rate * 100, 1),
            "funded_percentage": round(result.funded_percentage * 100, 1),
            "age_target_multiple": target_multiple,
            "age_actual_multiple": round(age_ratio, 2),
            "median_nest_egg": result.median_nest_egg,
            "median_monthly_income": result.median_monthly_income,
        },
    )


def _score_label(score: float) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "On Track"
    elif score >= 40:
        return "Needs Attention"
    else:
        return "Critical"


def _demo():
    """Verify scorer with known inputs."""
    inputs = ProjectionInputs(
        current_age=30,
        retirement_age=65,
        current_savings=50000,
        annual_contribution=10000,
        income=80000,
        expected_return=0.07,
        inflation=0.03,
        withdrawal_rate=0.04,
        desired_income=60000,
    )
    result = compute_score(inputs)
    assert 0 <= result.score <= 100, f"Score out of range: {result.score}"
    assert result.label in ("Critical", "Needs Attention", "On Track", "Excellent")
    assert len(result.breakdown) == 4
    print(f"OK: score={result.score}, label={result.label}, breakdown={result.breakdown}")


if __name__ == "__main__":
    _demo()