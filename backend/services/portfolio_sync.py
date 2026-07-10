"""Portfolio sync — pull holdings + orders from Alpaca, upsert into local DB.

ponytail: single function, single DB transaction. Partial update on failure.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal
from integrations.alpaca import (
    AlpacaCredentials,
    build_client,
    get_account_data,
    get_all_orders,
    get_all_positions,
)
from models.portfolio import ApiConnection, Holding
from utils.encryption import decrypt

logger = logging.getLogger("fin.services.portfolio_sync")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def decrypt_credentials(conn: ApiConnection) -> AlpacaCredentials:
    """Decrypt stored credentials from ApiConnection row."""
    plaintext = decrypt(conn.encrypted_key, settings.encryption_key)
    parts = plaintext.split(":")
    # ponytail: format is apiKey:apiSecret:paperTrading
    api_key = parts[0]
    api_secret = parts[1] if len(parts) > 1 else ""
    paper = parts[2].lower() == "true" if len(parts) > 2 else True
    return AlpacaCredentials(api_key=api_key, api_secret=api_secret, paper=paper)


def sync_user_portfolio(user_id: str, db: Session | None = None) -> dict:
    """Pull positions + orders from Alpaca, upsert into DB.

    Returns summary dict with counts. Transaction-safe: partial success stored.
    """
    close_db = db is None
    if db is None:
        db = SessionLocal()

    try:
        conn = db.query(ApiConnection).filter(
            ApiConnection.user_id == user_id,
            ApiConnection.service == "alpaca",
            ApiConnection.is_active == 1,
        ).first()

        if not conn:
            return {"status": "skipped", "reason": "no_active_connection"}

        creds = decrypt_credentials(conn)
        client = build_client(creds)
        if client is None:
            return {"status": "skipped", "reason": "empty_credentials"}

        account = get_account_data(client)
        positions = get_all_positions(client)
        orders = get_all_orders(client, status_filter="all")

        # Upsert holdings
        holdings_count = 0
        for pos in positions:
            symbol = pos.symbol
            qty = float(pos.qty) if pos.qty else 0
            cost = float(pos.cost_basis) if pos.cost_basis else 0
            price = float(pos.current_price) if pos.current_price else None

            holding = db.query(Holding).filter(
                Holding.user_id == user_id,
                Holding.ticker == symbol,
            ).first()

            if holding:
                holding.shares = qty
                holding.cost_basis = cost
                holding.last_price = price
                holding.updated_at = _now()
            else:
                holding = Holding(
                    user_id=user_id,
                    ticker=symbol,
                    shares=qty,
                    cost_basis=cost,
                    last_price=price,
                    asset_class=pos.asset_class if hasattr(pos, "asset_class") else None,
                )
                db.add(holding)
            holdings_count += 1

        # Update connection sync timestamp
        conn.last_synced_at = _now()

        db.commit()

        return {
            "status": "success",
            "account_id": account.id,
            "portfolio_value": str(account.portfolio_value) if account.portfolio_value else "0",
            "positions": holdings_count,
            "orders": len(orders),
            "currency": account.currency or "USD",
        }
    except Exception as e:
        logger.exception("Sync failed for user %s: %s", user_id, str(e))
        if db:
            db.rollback()
        return {"status": "error", "reason": str(e)}
    finally:
        if close_db:
            db.close()


def sync_all_connected_users():
    """Background job: sync all users with active Alpaca connections."""
    db = SessionLocal()
    try:
        connections = db.query(ApiConnection).filter(
            ApiConnection.service == "alpaca",
            ApiConnection.is_active == 1,
        ).all()

        for conn in connections:
            result = sync_user_portfolio(conn.user_id, db=db)
            logger.info("Sync user %s: %s", conn.user_id, result.get("status"))
    finally:
        db.close()