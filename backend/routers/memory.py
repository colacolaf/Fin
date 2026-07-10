"""Memory router — agent memory, context, conversation history."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/")
def list_entries():
    return []


@router.get("/context")
def get_context():
    return {"agent_mode": "multi", "preferences": {}, "history": []}