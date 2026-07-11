"""Pure-function debt payoff calculator. No DB, no HTTP.

Computes payoff schedules, compares strategies, and calculates
debt-to-income ratios. All functions are deterministic given inputs.
"""
from __future__ import annotations

import copy
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


def calculate_payoff_schedule(
    debts: list[dict],
    strategy: str = "avalanche",
    extra_payment: float = 0.0,
    monthly_budget: float | None = None,
) -> dict:
    """Compute month-by-month payoff schedule.

    Args:
        debts: List of {name, balance, interest_rate, minimum_payment}
        strategy: "avalanche" (highest rate first) or "snowball" (lowest balance first)
        extra_payment: Additional monthly payment beyond minimums
        monthly_budget: Total monthly budget; if None, sum of mins + extra

    Returns:
        {schedule, total_months, total_interest, total_paid, payoff_date}
    """
    if not debts:
        return {
            "schedule": [],
            "total_months": 0,
            "total_interest": 0.0,
            "total_paid": 0.0,
            "payoff_date": None,
        }

    # Deep-copy so we don't mutate caller data
    remaining = [
        {
            "name": d["name"],
            "balance": float(d["balance"]),
            "interest_rate": float(d["interest_rate"]),
            "minimum_payment": float(d.get("minimum_payment", 0)),
        }
        for d in debts
    ]

    # Sort by strategy
    if strategy == "avalanche":
        remaining.sort(key=lambda d: d["interest_rate"], reverse=True)
    else:  # snowball
        remaining.sort(key=lambda d: d["balance"])

    total_minimums = sum(d["minimum_payment"] for d in remaining)
    budget = monthly_budget if monthly_budget is not None else total_minimums + extra_payment

    schedule: list[dict] = []
    total_interest = 0.0
    total_paid = 0.0
    month = 0
    start_date = datetime.now()

    while any(d["balance"] > 0.01 for d in remaining) and month < 360:
        month += 1
        available = budget

        for d in remaining:
            if d["balance"] <= 0.01:
                continue
            monthly_rate = d["interest_rate"] / 100.0 / 12.0
            interest = d["balance"] * monthly_rate
            total_interest += interest
            d["balance"] += interest

        # Pay minimums first
        for d in remaining:
            if d["balance"] <= 0.01 or available <= 0:
                continue
            min_pay = min(d["minimum_payment"], d["balance"])
            payment = min(min_pay, available)
            d["balance"] -= payment
            available -= payment
            total_paid += payment

            schedule.append({
                "month": month,
                "debt_name": d["name"],
                "payment": round(payment, 2),
                "principal": round(payment - 0, 2),
                "interest": round(
                    d["balance"] * (d["interest_rate"] / 100.0 / 12.0)
                    if d["balance"] > 0 else 0, 2,
                ),
                "remaining_balance": round(d["balance"], 2),
            })

        # Extra goes to target debt (first active one in sorted order)
        if available > 0.01:
            for d in remaining:
                if d["balance"] > 0.01:
                    extra = min(available, d["balance"])
                    d["balance"] -= extra
                    available -= extra
                    total_paid += extra

                    schedule.append({
                        "month": month,
                        "debt_name": d["name"],
                        "payment": round(extra, 2),
                        "principal": round(extra, 2),
                        "interest": 0.0,
                        "remaining_balance": round(d["balance"], 2),
                    })

        # When target paid off, it'll naturally drop to 0 and next becomes target

    payoff_date = (start_date + relativedelta(months=month)).isoformat() if month > 0 else None

    return {
        "schedule": schedule,
        "total_months": month,
        "total_interest": round(total_interest, 2),
        "total_paid": round(total_paid, 2),
        "payoff_date": payoff_date,
    }


def compare_strategies(
    debts: list[dict], extra_payment: float = 0.0
) -> dict:
    """Compare avalanche vs snowball payoff strategies.

    Returns both schedules and a comparison summary.
    """
    avalanche = calculate_payoff_schedule(debts, "avalanche", extra_payment)
    snowball = calculate_payoff_schedule(debts, "snowball", extra_payment)

    months_diff = snowball["total_months"] - avalanche["total_months"]
    interest_saved = round(snowball["total_interest"] - avalanche["total_interest"], 2)
    total_saved = round(snowball["total_paid"] - avalanche["total_paid"], 2)

    return {
        "avalanche": avalanche,
        "snowball": snowball,
        "comparison": {
            "strategy": "avalanche" if interest_saved > 0 else "snowball",
            "recommended": "avalanche" if interest_saved >= 0 else "snowball",
            "months_diff": months_diff,
            "interest_saved": interest_saved,
            "total_saved": total_saved,
            "explanation": (
                f"Avalanche saves ${interest_saved:,.2f} in interest "
                f"and pays off {abs(months_diff)} months {'faster' if months_diff > 0 else 'slower'}."
                if months_diff != 0
                else "Both strategies finish at the same time."
            ),
        },
    }


def calculate_dti(debts: list[dict], monthly_income: float) -> dict:
    """Calculate debt-to-income ratio.

    Returns:
        {monthly_debt_payments, dti_ratio, dti_percent, assessment}
    """
    if monthly_income <= 0:
        return {
            "monthly_debt_payments": 0.0,
            "dti_ratio": 0.0,
            "dti_percent": 0.0,
            "assessment": "critical",
        }

    monthly_payments = sum(
        float(d.get("minimum_payment", 0)) for d in debts
    )
    ratio = monthly_payments / monthly_income
    percent = ratio * 100

    if percent < 20:
        assessment = "low"
    elif percent < 36:
        assessment = "moderate"
    elif percent < 50:
        assessment = "high"
    else:
        assessment = "critical"

    return {
        "monthly_debt_payments": round(monthly_payments, 2),
        "dti_ratio": round(ratio, 4),
        "dti_percent": round(percent, 1),
        "assessment": assessment,
    }