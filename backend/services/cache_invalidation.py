"""Cache invalidation — clears computed results when fresh data arrives.

ponytail: invalidate recommendation cache on portfolio refresh.
Hooks into Upstash for remote cache + local staleness tracking.
"""
import logging
from datetime import datetime, timezone

from database import SessionLocal
from integrations.upstash import get_client
from models.refresh import StalenessReport

logger = logging.getLogger("fin.services.cache_invalidation")

_STALENESS_THRESHOLDS: dict[str, int] = {
    "alpaca": 900,     # 15 min for portfolio data
    "finnhub": 300,    # 5 min for quotes
    "plaid": 3600,     # 1 hr for banking data
    "debt": 86400,     # 24 hr for debt snapshots
}


def invalidate_recommendation_cache(user_id: str) -> None:
    """Clear cached recommendations for a user after fresh data arrives."""
    try:
        client = get_client()
        if client:
            key = f"recs:{user_id}"
            client.delete(key)
            logger.debug("Invalidated recommendation cache for %s", user_id)
    except Exception as e:
        logger.warning("Cache invalidation skipped for %s: %s", user_id, e)


def update_staleness(source: str, staleness_seconds: int, quality_flag: str = "fresh") -> None:
    """Update the staleness report for a data source."""
    db = SessionLocal()
    try:
        threshold = _STALENESS_THRESHOLDS.get(source, 900)
        report = db.query(StalenessReport).filter(
            StalenessReport.source == source,
        ).order_by(StalenessReport.last_checked.desc()).first()

        if report:
            report.staleness_seconds = staleness_seconds
            report.quality_flag = quality_flag
            report.last_checked = datetime.now(timezone.utc).isoformat()
        else:
            report = StalenessReport(
                source=source,
                staleness_seconds=staleness_seconds,
                threshold_seconds=threshold,
                quality_flag=quality_flag,
            )
            db.add(report)
        db.commit()
    except Exception as e:
        logger.warning("Staleness update failed for %s: %s", source, e)
        db.rollback()
    finally:
        db.close()


def get_staleness_map() -> dict[str, dict]:
    """Return per-source staleness map for the dashboard."""
    db = SessionLocal()
    try:
        reports = db.query(StalenessReport).all()
        return {
            r.source: {
                "staleness_seconds": r.staleness_seconds,
                "threshold_seconds": r.threshold_seconds,
                "quality_flag": r.quality_flag,
                "agent_diagnosis": r.agent_diagnosis,
                "last_checked": r.last_checked,
            }
            for r in reports
        }
    finally:
        db.close()