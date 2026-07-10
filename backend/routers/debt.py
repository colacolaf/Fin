"""Debt router — debt accounts, strategies, payoff projections."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/debt", tags=["debt"])


@router.get("/accounts")
def list_accounts():
    return []


@router.get("/summary")
def get_summary():
    return {"total_debt": 0, "monthly_payments": 0, "avg_interest_rate": 0}


@router.get("/strategies")
def list_strategies():
    return []