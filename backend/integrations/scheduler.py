"""Background scheduler — periodic portfolio sync via APScheduler.

ponytail: start/stop functions, one job. No class wrapper needed.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from services.portfolio_sync import sync_all_connected_users

logger = logging.getLogger("fin.scheduler")

_scheduler: BackgroundScheduler | None = None


def start_scheduler():
    """Start background scheduler. Sync every 15 minutes."""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        sync_all_connected_users,
        trigger="interval",
        minutes=15,
        id="portfolio_sync",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Portfolio sync scheduler started (interval: 15 min)")


def stop_scheduler():
    """Shutdown scheduler gracefully."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Portfolio sync scheduler stopped")