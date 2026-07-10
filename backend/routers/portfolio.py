"""Portfolio router — holdings, summary, performance."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/summary")
def get_summary():
    return {"total_value": 0, "daily_change_pct": 0, "total_gain_loss": 0, "cash": 0}


@router.get("/holdings")
def get_holdings():
    return []


@router.get("/performance")
def get_performance():
    return {"labels": [], "values": []}