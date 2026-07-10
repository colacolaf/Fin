"""Recommendations router — agent-generated recommendations."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/")
def list_recommendations():
    return []


@router.get("/{recommendation_id}")
def get_recommendation(recommendation_id: str):
    return {"id": recommendation_id, "detail": "not implemented"}