"""Integrations router — external service connections (Alpaca, Plaid, etc.)."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/")
def list_integrations():
    return []


@router.get("/status")
def get_status():
    return {"alpaca": "not_configured", "plaid": "not_configured"}