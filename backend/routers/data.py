"""Phase 17 data refresh router — manual triggers, status, staleness, market hours.

Endpoints:
  POST /api/data/refresh — trigger full refresh for a source
  GET  /api/data/status — recent refresh jobs by source
  GET  /api/data/staleness — per-source staleness map
  GET  /api/data/market-hours — US market open/closed
  POST /api/data/prefetch — prefetch market data for list of symbols
"""
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from auth.dependencies import get_current_user, UserOut
from database import SessionLocal
from models.refresh import RefreshJob, StalenessReport
from services.refresh_gate import is_market_open as _is_market_open
from services.refresh_gate import record_refresh_start, record_refresh_end, should_refresh
from services.retry_handler import with_retry
from services.cache_invalidation import get_staleness_map, update_staleness

logger = logging.getLogger("fin.routers.data")

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/refresh")
def trigger_refresh(
    source: str = Query(..., description="alpaca | finnhub | plaid | debt | all"),
    current_user: UserOut = Depends(get_current_user),
):
    """Manually trigger a data refresh for the given source."""
    valid = {"alpaca", "finnhub", "plaid", "debt", "all"}
    if source not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid source. Must be one of: {', '.join(sorted(valid))}")

    results: dict[str, Any] = {}

    if source in ("alpaca", "all"):
        if should_refresh("alpaca"):
            run_id = record_refresh_start("alpaca")
            try:
                from services.portfolio_sync import sync_all_connected_users
                _, error = with_retry(lambda: sync_all_connected_users(), source="alpaca")
                record_refresh_end(run_id, "alpaca", error is None, error)
                if not error:
                    from services.recalculation import recalc_all_after_batch_sync
                    recalc_all_after_batch_sync()
                results["alpaca"] = "success" if not error else f"error: {error}"
            except Exception as e:
                results["alpaca"] = f"error: {e}"

    if source in ("finnhub", "all"):
        if should_refresh("finnhub"):
            run_id = record_refresh_start("finnhub")
            try:
                from integrations.finnhub import get_market_news
                news, error = with_retry(lambda: len(get_market_news()), source="finnhub")
                record_refresh_end(run_id, "finnhub", error is None, error)
                if not error:
                    update_staleness("finnhub", 0, "fresh")
                results["finnhub"] = f"refreshed: {news} news items" if not error else f"error: {error}"
            except Exception as e:
                results["finnhub"] = f"error: {e}"

    if source in ("plaid", "all"):
        results["plaid"] = "skipped: Plaid refresh not implemented yet"

    if source in ("debt", "all"):
        if should_refresh("debt"):
            run_id = record_refresh_start("debt")
            record_refresh_end(run_id, "debt", True)
            update_staleness("debt", 0, "fresh")
            results["debt"] = "refreshed"

    results["triggered_at"] = datetime.now(timezone.utc).isoformat()
    return results


@router.get("/status")
def refresh_status(
    source: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserOut = Depends(get_current_user),
):
    """Get recent refresh job status, optionally filtered by source."""
    db = SessionLocal()
    try:
        q = db.query(RefreshJob)
        if source:
            q = q.filter(RefreshJob.source == source)
        jobs = q.order_by(RefreshJob.created_at.desc()).limit(limit).all()
        return {
            "jobs": [
                {
                    "id": j.id,
                    "source": j.source,
                    "status": j.status,
                    "last_refresh": j.last_refresh,
                    "quality_flag": j.quality_flag,
                    "error_message": j.error_message,
                    "run_id": j.run_id,
                    "created_at": j.created_at,
                }
                for j in jobs
            ]
        }
    finally:
        db.close()


@router.get("/staleness")
def staleness(current_user: UserOut = Depends(get_current_user)):
    """Per-source data staleness report."""
    return {"sources": get_staleness_map()}


@router.get("/market-hours")
def market_hours(current_user: UserOut = Depends(get_current_user)):
    """Check if US market is currently open."""
    return {"market_open": _is_market_open(), "checked_at": datetime.now(timezone.utc).isoformat()}


@router.post("/prefetch")
def prefetch(
    symbols: list[str] = Query(...),
    current_user: UserOut = Depends(get_current_user),
):
    """Prefetch market data (quotes + profiles) for a list of symbols."""
    from integrations.finnhub import get_quote, get_company_profile

    results = {}
    for symbol in symbols[:20]:  # cap at 20 to avoid rate limits
        quote, _ = with_retry(lambda: get_quote(symbol), source=f"finnhub:quote:{symbol}")
        profile, _ = with_retry(lambda: get_company_profile(symbol), source=f"finnhub:profile:{symbol}")
        results[symbol] = {
            "quote": quote,
            "profile": {"name": profile.get("name", "")} if profile else None,
        }

    update_staleness("finnhub", 0, "fresh")
    return {"prefetched": len(results), "results": results}