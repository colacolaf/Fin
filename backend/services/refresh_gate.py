"""Market-hours gate and rate-limit guard for the refresh pipeline.

ponytail: detect market open/closed, prevent redundant refreshes.
Stores state in refresh_jobs table (source=gate, run_id-based dedup).
"""
import logging
from datetime import datetime, time, timezone
from uuid import uuid4

from database import SessionLocal
from models.refresh import RefreshJob

logger = logging.getLogger("fin.services.refresh_gate")

_MARKET_OPEN = time(9, 30)   # ET
_MARKET_CLOSE = time(16, 0)  # ET
_MIN_INTERVAL_SECONDS: dict[str, int] = {
    "alpaca": 60,     # 1 min between portfolio syncs
    "finnhub": 30,    # 30 sec between quote refreshes
    "plaid": 300,     # 5 min
    "debt": 3600,     # 1 hr
}


def is_market_open() -> bool:
    """Check if US market is open (weekday, 9:30–16:00 ET)."""
    now_utc = datetime.now(timezone.utc)
    # ET = UTC-5 standard, UTC-4 daylight — approximate with UTC-4 always
    et_now = now_utc.replace(tzinfo=None)  # naive, but close enough
    # Better: use weekday check
    weekday = now_utc.weekday()  # 0=Mon, 6=Sun
    if weekday >= 5:
        return False
    # Approximate: market open 13:30–20:00 UTC
    now_t = now_utc.time()
    return time(13, 30) <= now_t <= time(20, 0)


def should_refresh(source: str) -> bool:
    """Check if enough time elapsed since last refresh for source.

    Returns True if refresh should proceed, False if skipped.
    """
    db = SessionLocal()
    try:
        last = db.query(RefreshJob).filter(
            RefreshJob.source == source,
            RefreshJob.status.in_(["success", "skipped"]),
        ).order_by(RefreshJob.created_at.desc()).first()

        min_interval = _MIN_INTERVAL_SECONDS.get(source, 60)

        if last and last.last_refresh:
            try:
                last_dt = datetime.fromisoformat(last.last_refresh)
                elapsed = (datetime.now(timezone.utc) - last_dt).total_seconds()
                if elapsed < min_interval:
                    logger.debug("Skipping %s refresh: %ds since last (min %ds)", source, elapsed, min_interval)
                    return False
            except (ValueError, TypeError):
                pass  # Malformed timestamp - proceed
        return True
    finally:
        db.close()


def record_refresh_start(source: str) -> str:
    """Record refresh job start, return run_id."""
    run_id = uuid4().hex[:24]
    db = SessionLocal()
    try:
        job = RefreshJob(
            source=source,
            status="running",
            run_id=run_id,
        )
        db.add(job)
        db.commit()
        return run_id
    except Exception as e:
        logger.warning("Failed to record refresh start for %s: %s", source, e)
        db.rollback()
        return run_id  # return ID even if DB write fails
    finally:
        db.close()


def record_refresh_end(run_id: str, source: str, success: bool, error: str | None = None) -> None:
    """Mark refresh job complete."""
    db = SessionLocal()
    try:
        job = db.query(RefreshJob).filter(RefreshJob.run_id == run_id).first()
        if job:
            job.status = "success" if success else "error"
            job.error_message = error
            job.last_refresh = datetime.now(timezone.utc).isoformat()
            job.quality_flag = "fresh" if success else "error"
            db.commit()
    except Exception as e:
        logger.warning("Failed to record refresh end for %s: %s", source, e)
        db.rollback()
    finally:
        db.close()