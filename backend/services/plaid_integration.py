"""Plaid integration service — wraps Plaid client + DB operations.

Handles link token creation, public token exchange, access token
storage (encrypted), and liability sync to Debt table.
"""
import logging
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from config import settings
from integrations.plaid import (
    PlaidCredentials,
    build_client,
    create_link_token as _create_link_token,
    exchange_public_token as _exchange_public_token,
    get_liabilities as _get_liabilities,
)
from models.debt import Debt
from models.portfolio import ApiConnection
from utils.encryption import decrypt, encrypt

logger = logging.getLogger("fin.services.plaid_integration")


def _get_client():
    creds = PlaidCredentials(
        client_id=settings.plaid_client_id,
        secret=settings.plaid_secret,
        env=settings.plaid_env,
    )
    return build_client(creds)


def create_link_token(user_id: str, db: Session) -> dict:
    """Create a Plaid Link token for the frontend."""
    client = _get_client()
    if client is None:
        raise ValueError("Plaid credentials not configured")

    result = _create_link_token(client, user_id)
    logger.info("Created Plaid link token for user %s", user_id)
    return result


def exchange_token(
    user_id: str, public_token: str, db: Session
) -> dict:
    """Exchange a public token for an access token. Stores encrypted."""
    client = _get_client()
    if client is None:
        raise ValueError("Plaid credentials not configured")

    result = _exchange_public_token(client, public_token)
    access_token = result["access_token"]
    item_id = result["item_id"]

    encrypted_blob = encrypt(access_token, settings.encryption_key)

    conn = (
        db.query(ApiConnection)
        .filter(
            ApiConnection.user_id == user_id,
            ApiConnection.service == "plaid",
        )
        .first()
    )

    if conn:
        conn.encrypted_key = encrypted_blob
        conn.is_active = 1
    else:
        conn = ApiConnection(
            user_id=user_id,
            service="plaid",
            encrypted_key=encrypted_blob,
            is_active=1,
        )
        db.add(conn)

    db.commit()
    logger.info("Stored Plaid access token for user %s, item %s", user_id, item_id)

    return {"access_token": "[redacted]", "item_id": item_id}


def get_stored_access_token(user_id: str, db: Session) -> str | None:
    """Decrypt and return stored Plaid access token for user."""
    conn = (
        db.query(ApiConnection)
        .filter(
            ApiConnection.user_id == user_id,
            ApiConnection.service == "plaid",
            ApiConnection.is_active == 1,
        )
        .order_by(ApiConnection.created_at.desc())
        .first()
    )

    if not conn or not conn.encrypted_key:
        return None

    try:
        return decrypt(conn.encrypted_key, settings.encryption_key)
    except Exception:
        logger.error("Failed to decrypt Plaid access token for user %s", user_id)
        return None


def sync_liabilities(user_id: str, db: Session) -> dict:
    """Fetch liabilities from Plaid and upsert Debt rows."""
    access_token = get_stored_access_token(user_id, db)
    if not access_token:
        raise ValueError("No Plaid access token found for user")

    client = _get_client()
    if client is None:
        raise ValueError("Plaid credentials not configured")

    data = _get_liabilities(client, access_token)
    liabilities = data.get("liabilities", {})

    added = 0
    updated = 0
    total_debt = 0.0

    # Credit cards
    for cc in liabilities.get("credit", []):
        is_new = _upsert_debt(
            db, user_id,
            name=cc.get("account_name") or f"Credit Card ({cc.get('account_id', '')[:8]})",
            debt_type="credit_card",
            balance=float(cc.get("current_balance", 0) or 0),
            interest_rate=float(cc.get("apr", 0) or 0),
            minimum_payment=float(cc.get("minimum_payment_amount", 0) or 0),
        )
        if is_new:
            added += 1
        else:
            updated += 1
        total_debt += float(cc.get("current_balance", 0) or 0)

    # Student loans
    for sl in liabilities.get("student", []):
        is_new = _upsert_debt(
            db, user_id,
            name=sl.get("account_name") or f"Student Loan ({sl.get('account_id', '')[:8]})",
            debt_type="student_loan",
            balance=float(sl.get("current_balance", 0) or 0),
            interest_rate=float(sl.get("interest_rate_percentage", 0) or 0),
            minimum_payment=float(sl.get("minimum_payment_amount", 0) or 0),
        )
        if is_new:
            added += 1
        else:
            updated += 1
        total_debt += float(sl.get("current_balance", 0) or 0)

    # Mortgages
    for mtg in liabilities.get("mortgage", []):
        is_new = _upsert_debt(
            db, user_id,
            name=mtg.get("account_name") or f"Mortgage ({mtg.get('account_id', '')[:8]})",
            debt_type="mortgage",
            balance=float(mtg.get("current_balance", 0) or 0),
            interest_rate=float(mtg.get("interest_rate_percentage", 0) or 0),
            minimum_payment=float(mtg.get("minimum_payment_amount", 0) or 0),
        )
        if is_new:
            added += 1
        else:
            updated += 1
        total_debt += float(mtg.get("current_balance", 0) or 0)

    # Other liabilities
    for other in liabilities.get("other", []):
        is_new = _upsert_debt(
            db, user_id,
            name=other.get("account_name") or f"Liability ({other.get('account_id', '')[:8]})",
            debt_type="other",
            balance=float(other.get("current_balance", 0) or 0),
            interest_rate=float(other.get("interest_rate_percentage", 0) or 0),
            minimum_payment=float(other.get("minimum_payment_amount", 0) or 0),
        )
        if is_new:
            added += 1
        else:
            updated += 1
        total_debt += float(other.get("current_balance", 0) or 0)

    db.commit()
    logger.info(
        "Synced liabilities for user %s: added=%d updated=%d total=%.2f",
        user_id, added, updated, total_debt,
    )

    return {
        "accounts_added": added,
        "accounts_updated": updated,
        "total_debt": round(total_debt, 2),
    }


def _upsert_debt(
    db: Session,
    user_id: str,
    name: str,
    debt_type: str,
    balance: float,
    interest_rate: float,
    minimum_payment: float,
) -> bool:
    """Upsert a single debt record. Returns True if created, False if updated."""
    existing = (
        db.query(Debt)
        .filter(
            Debt.user_id == user_id,
            Debt.name == name,
            Debt.is_active == 1,
        )
        .first()
    )

    if existing:
        existing.balance = balance
        existing.interest_rate = interest_rate
        existing.minimum_payment = minimum_payment
        existing.updated_at = datetime.now(timezone.utc)
        return False

    debt = Debt(
        id=str(uuid4()),
        user_id=user_id,
        name=name,
        debt_type=debt_type,
        balance=balance,
        interest_rate=interest_rate,
        minimum_payment=minimum_payment,
        is_active=1,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(debt)
    return True