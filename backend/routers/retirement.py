"""Retirement router — projections, scenarios, glidepath."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/retirement", tags=["retirement"])


@router.get("/projection")
def get_projection():
    return {"current_age": 0, "retirement_age": 65, "nest_egg": 0, "monthly_income": 0}


@router.get("/scenarios")
def list_scenarios():
    return []