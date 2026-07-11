"""Post-refresh recalculation — triggers derived data updates after fresh data.

ponytail: after portfolio sync, recalc recommendations + agent scores.
Avoids blocking the refresh — fire-and-forget or queued.
"""
import logging
from datetime import datetime, timezone

from database import SessionLocal
from models.portfolio import ApiConnection, Holding
from services.cache_invalidation import invalidate_recommendation_cache, update_staleness

logger = logging.getLogger("fin.services.recalculation")


def recalc_after_sync(user_id: str) -> int:
    """After a successful portfolio sync for user_id:
    1. Invalidate recommendation cache
    2. Update staleness to 0 (just refreshed)
    Returns count of holdings refreshed.
    """
    db = SessionLocal()
    try:
        holdings_count = db.query(Holding).filter(Holding.user_id == user_id).count()
        invalidate_recommendation_cache(user_id)
        update_staleness("alpaca", 0, "fresh")
        logger.info("Post-sync recalc for %s: %d holdings, cache invalidated", user_id, holdings_count)
        return holdings_count
    except Exception as e:
        logger.warning("Recalc failed for %s: %s", user_id, e)
        return 0
    finally:
        db.close()


def recalc_debt(user_id: str) -> int:
    """After debt refresh, mark staleness fresh."""
    update_staleness("debt", 0, "fresh")
    logger.info("Post-debt-recalc for %s", user_id)
    return 1


def recalc_all_after_batch_sync() -> dict:
    """After batch portfolio sync, recalc for all active users.

    Returns summary: {user_id: holdings_count}.
    """
    db = SessionLocal()
    results = {}
    try:
        connections = db.query(ApiConnection).filter(
            ApiConnection.service == "alpaca",
            ApiConnection.is_active == 1,
        ).all()
        for conn in connections:
            count = recalc_after_sync(conn.user_id)
            results[conn.user_id] = count
        update_staleness("finnhub", 0, "fresh")
        update_staleness("plaid", 0, "fresh")
        return results
    finally:
        db.close()