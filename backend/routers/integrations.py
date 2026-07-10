"""Integrations router — external service connections (Alpaca, Plaid, etc.)."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from config import settings
from database import get_db
from models.portfolio import ApiConnection
from models.user import User
from utils.encryption import encrypt
from services.portfolio_sync import sync_user_portfolio

logger = logging.getLogger("fin.integrations")
router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class AlpacaTestPayload(BaseModel):
    apiKey: str = Field(min_length=1)
    apiSecret: str = Field(min_length=1)
    paperTrading: bool = True


@router.get("/")
def list_integrations():
    return []


@router.get("/status")
def get_status():
    return {"alpaca": "not_configured", "plaid": "not_configured"}


@router.post("/alpaca/test")
def test_alpaca_connection(
    body: AlpacaTestPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Test Alpaca API credentials by calling GET /v2/account.

    On success, stores encrypted credentials in api_connections.
    """
    from alpaca.trading.client import TradingClient

    base_url = "https://paper-api.alpaca.markets" if body.paperTrading else "https://api.alpaca.markets"

    try:
        client = TradingClient(api_key=body.apiKey, secret_key=body.apiSecret, paper=body.paperTrading)
        # Verify credentials can access the account endpoint
        acct = client.get_account()
    except Exception as e:
        logger.warning("Alpaca connection test failed for user %s: %s", user.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {str(e)}",
        )

    # Store encrypted credentials
    encrypted_blob = encrypt(
        f"{body.apiKey}:{body.apiSecret}:{body.paperTrading}",
        settings.encryption_key,
    )

    conn = db.query(ApiConnection).filter(
        ApiConnection.user_id == user.id,
        ApiConnection.service == "alpaca",
    ).first()

    if conn:
        conn.encrypted_key = encrypted_blob
        conn.is_active = 1
    else:
        conn = ApiConnection(
            user_id=user.id,
            service="alpaca",
            encrypted_key=encrypted_blob,
            is_active=1,
        )
        db.add(conn)

    db.commit()

    return {
        "connected": True,
        "account_id": acct.account_id,
        "status": acct.status,
        "currency": acct.currency,
        "buying_power": str(acct.buying_power),
        "portfolio_value": str(acct.portfolio_value),
    }


@router.post("/sync")
def trigger_sync(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Force a portfolio sync from connected broker."""
    result = sync_user_portfolio(user.id, db=db)
    if result.get("status") == "error":
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result.get("reason", "Sync failed"))
    return result
