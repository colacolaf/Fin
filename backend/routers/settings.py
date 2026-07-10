"""Settings router — user preferences, app configuration."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/")
def get_settings():
    return {"theme": "system", "currency": "USD", "notifications": True}


@router.put("/")
def update_settings():
    return {"detail": "not implemented"}