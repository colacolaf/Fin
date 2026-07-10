"""Execution router — track follow-through on recommendations."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/execution", tags=["execution"])


@router.get("/")
def list_executions():
    return []


@router.get("/stats")
def get_stats():
    return {"total": 0, "completed": 0, "pending": 0}