"""Background scheduler — periodic portfolio sync and check-in scanner via APScheduler.

ponytail: start/stop functions. No class wrapper needed.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from integrations.check_in import scan_and_send_check_ins
from services.portfolio_sync import sync_all_connected_users

logger = logging.getLogger("fin.scheduler")

_scheduler: BackgroundScheduler | None = None


def start_scheduler():
    """Start background scheduler. Sync every 15 min, check-ins every 6 hours."""
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
    _scheduler.add_job(
        scan_and_send_check_ins,
        trigger="interval",
        hours=6,
        id="check_in_scanner",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Background scheduler started (sync: 15min, check-ins: 6h)")


def stop_scheduler():
    """Shutdown scheduler gracefully."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Background scheduler stopped")