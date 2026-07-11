"""Monte Carlo retirement projection engine.

Uses numpy for vectorized simulations. Inputs: current age, retirement age,
savings, contributions, expected return, inflation, withdrawal rate.
Runs 1000 simulations, returns median/p10/p90 + success rate.
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any

import numpy as np

# ── Caps ────────────────────────────────────────────
SIMULATION_COUNT = 1000
YEAR_STEPS = 252  # trading days per year for daily compounding


@dataclass
class ProjectionInputs:
    current_age: int
    retirement_age: int
    current_savings: float
    annual_contribution: float
    expected_return: float = 0.07   # nominal annual
    inflation: float = 0.03          # annual
    withdrawal_rate: float = 0.04    # safe withdrawal rate
    desired_income: float | None = None  # annual retirement spending target
    social_security: float = 0.0     # estimated monthly SS at claiming age
    employer_match_pct: float = 0.0  # e.g., 0.50 = 50% match up to limit
    employer_match_limit: float = 0.0  # e.g., 0.06 = match up to 6% of salary
    income: float = 0.0              # current annual income
    # ponytail: employer match tiers handled as single weighted average


@dataclass
class ProjectionResult:
    """Result of Monte Carlo simulation."""
    median_nest_egg: float
    p10_nest_egg: float
    p90_nest_egg: float
    success_rate: float  # 0.0 - 1.0, probability of not running out
    median_monthly_income: float
    p10_monthly_income: float
    p90_monthly_income: float
    years: list[int] = field(default_factory=list)
    median_path: list[float] = field(default_factory=list)
    p10_path: list[float] = field(default_factory=list)
    p90_path: list[float] = field(default_factory=list)
    funded_percentage: float = 0.0  # current savings / needed savings


def _build_input_hash(inputs: ProjectionInputs) -> str:
    """Cache key: hash of inputs so recalc only on change."""
    raw = json.dumps({
        k: v for k, v in inputs.__dict__.items()
        if not k.startswith("_")
    }, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# Simple in-process cache. ponytail: dict, no external cache dep.
_cache: dict[str, ProjectionResult] = {}


def run_projection(inputs: ProjectionInputs, *, use_cache: bool = True) -> ProjectionResult:
    """Run Monte Carlo retirement projection.

    Returns ProjectionResult with median, percentile bands, success rate,
    and year-by-year paths for charting.
    """
    cache_key = _build_input_hash(inputs)
    if use_cache and cache_key in _cache:
        return _cache[cache_key]

    years = inputs.retirement_age - inputs.current_age
    if years <= 0:
        # Already at or past retirement age
        monthly = (inputs.current_savings * inputs.withdrawal_rate / 12) + inputs.social_security
        result = ProjectionResult(
            median_nest_egg=inputs.current_savings,
            p10_nest_egg=inputs.current_savings,
            p90_nest_egg=inputs.current_savings,
            success_rate=1.0 if inputs.current_savings > 0 else 0.0,
            median_monthly_income=monthly,
            p10_monthly_income=monthly,
            p90_monthly_income=monthly,
            years=[0],
            median_path=[inputs.current_savings],
            p10_path=[inputs.current_savings],
            p90_path=[inputs.current_savings],
            funded_percentage=_compute_funded_pct(inputs),
        )
        return result

    # ── Vectorized annual simulation ────────────────────
    rng = np.random.default_rng(42)  # fixed seed for reproducibility
    real_return = (1 + inputs.expected_return) / (1 + inputs.inflation) - 1
    annual_std = 0.12  # standard deviation of annual returns

    # Generate 1000 paths × N years of returns
    returns = rng.normal(loc=real_return, scale=annual_std, size=(SIMULATION_COUNT, years))

    # Total annual contribution (employee + employer match)
    total_contribution = inputs.annual_contribution
    if inputs.employer_match_pct > 0 and inputs.income > 0:
        contribution_rate = inputs.annual_contribution / inputs.income if inputs.income > 0 else 0
        matched_rate = min(contribution_rate, inputs.employer_match_limit)
        match_amount = inputs.income * matched_rate * inputs.employer_match_pct
        total_contribution += match_amount

    # Initialize portfolio paths
    portfolios = np.full((SIMULATION_COUNT, years + 1), inputs.current_savings, dtype=np.float64)

    for yr in range(years):
        portfolios[:, yr + 1] = (
            portfolios[:, yr] * (1 + returns[:, yr]) + total_contribution
        )
        # Floor at 0
        portfolios[:, yr + 1] = np.maximum(portfolios[:, yr + 1], 0.0)

    # ── Withdrawal phase: 30 years ─────────────────────
    retirement_years = 30
    final_nest_eggs = portfolios[:, -1].copy()

    # Success = portfolio survives 30 years of withdrawals at withdrawal_rate
    withdrawal_amounts = final_nest_eggs * inputs.withdrawal_rate
    # Simple success check: does portfolio survive 30 years at 4%?
    # More precise: simulate withdrawal phase with annual returns
    success_returns = rng.normal(loc=real_return, scale=annual_std, size=(SIMULATION_COUNT, retirement_years))
    remaining = final_nest_eggs.copy()
    survived = np.ones(SIMULATION_COUNT, dtype=bool)

    for yr in range(retirement_years):
        withdrawal = inputs.desired_income or (remaining * inputs.withdrawal_rate)
        # SS income reduces withdrawal need
        net_withdrawal = max(0.0, withdrawal - inputs.social_security * 12)
        remaining = remaining * (1 + success_returns[:, yr]) - net_withdrawal
        survived = survived & (remaining > 0)
        remaining = np.maximum(remaining, 0.0)

    success_rate = float(np.mean(survived))

    # Monthly income in retirement
    monthly_incomes = (final_nest_eggs * inputs.withdrawal_rate / 12) + inputs.social_security

    # Build year labels and paths for charting
    year_labels = list(range(years + 1))

    result = ProjectionResult(
        median_nest_egg=float(np.median(final_nest_eggs)),
        p10_nest_egg=float(np.percentile(final_nest_eggs, 10)),
        p90_nest_egg=float(np.percentile(final_nest_eggs, 90)),
        success_rate=round(success_rate, 4),
        median_monthly_income=float(np.median(monthly_incomes)),
        p10_monthly_income=float(np.percentile(monthly_incomes, 10)),
        p90_monthly_income=float(np.percentile(monthly_incomes, 90)),
        years=year_labels,
        median_path=[float(np.median(portfolios[:, i])) for i in range(years + 1)],
        p10_path=[float(np.percentile(portfolios[:, i], 10)) for i in range(years + 1)],
        p90_path=[float(np.percentile(portfolios[:, i], 90)) for i in range(years + 1)],
        funded_percentage=_compute_funded_pct(inputs),
    )

    if use_cache:
        _cache[cache_key] = result

    return result


def _compute_funded_pct(inputs: ProjectionInputs) -> float:
    """Estimate how much of needed retirement savings is currently funded.

    Uses a simplified annuity calculation:
    needed = (desired_income - SS) * 25 (4% rule inverse)
    funded = current_savings / needed
    """
    if not inputs.desired_income or inputs.desired_income <= 0:
        return 0.0
    annual_need = max(0.0, inputs.desired_income - inputs.social_security * 12)
    if annual_need <= 0:
        return 1.0
    needed_savings = annual_need * 25  # 4% rule
    if needed_savings <= 0:
        return 0.0
    return min(2.0, inputs.current_savings / needed_savings)


def _to_dict(result: ProjectionResult) -> dict[str, Any]:
    """Serialize result for API response."""
    return {
        "median_nest_egg": round(result.median_nest_egg, 0),
        "p10_nest_egg": round(result.p10_nest_egg, 0),
        "p90_nest_egg": round(result.p90_nest_egg, 0),
        "success_rate": result.success_rate,
        "median_monthly_income": round(result.median_monthly_income, 0),
        "p10_monthly_income": round(result.p10_monthly_income, 0),
        "p90_monthly_income": round(result.p90_monthly_income, 0),
        "funded_percentage": round(result.funded_percentage, 4),
        "years": result.years,
        "median_path": [round(v, 0) for v in result.median_path],
        "p10_path": [round(v, 0) for v in result.p10_path],
        "p90_path": [round(v, 0) for v in result.p90_path],
    }


# ── Self-check ──────────────────────────────────────
def _demo():
    """Verify projection math with known inputs."""
    inputs = ProjectionInputs(
        current_age=30,
        retirement_age=65,
        current_savings=50000,
        annual_contribution=10000,
        expected_return=0.07,
        inflation=0.03,
        withdrawal_rate=0.04,
        desired_income=60000,
    )
    result = run_projection(inputs, use_cache=False)
    assert result.median_nest_egg > 0, "Nest egg should be positive"
    assert 0 <= result.success_rate <= 1, "Success rate in [0,1]"
    assert len(result.years) == 36, f"Expected 36 years, got {len(result.years)}"
    assert len(result.median_path) == 36, "Path length matches years"
    print(f"OK: median={result.median_nest_egg:,.0f}, success={result.success_rate:.1%}")


if __name__ == "__main__":
    _demo()