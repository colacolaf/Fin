"""Phase 17 scheduler — APScheduler with SQLite job store, 4 refresh jobs.

ponytail: replaces old integrations/scheduler.py. Adds persistence, market-hours gate,
retry + recalc hooks per spec.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor

from database import engine
from services.retry_handler import with_retry

logger = logging.getLogger("fin.scheduler")

_scheduler: BackgroundScheduler | None = None


def _build_jobstores() -> dict:
    """SQLite-backed job store for crash-safe scheduling."""
    return {
        "default": SQLAlchemyJobStore(engine=engine),
    }


def _build_executors() -> dict:
    return {
        "default": ThreadPoolExecutor(max_workers=4),
    }


# ── Job 1: Portfolio Sync (every 15 min, market-hours only) ──────────
def _job_portfolio_sync():
    from services.portfolio_sync import sync_all_connected_users
    from services.refresh_gate import is_market_open, should_refresh, record_refresh_start, record_refresh_end
    from services.recalculation import recalc_all_after_batch_sync

    if not is_market_open():
        logger.debug("Portfolio sync skipped: market closed")
        return

    if not should_refresh("alpaca"):
        return

    run_id = record_refresh_start("alpaca")
    result, error = with_retry(lambda: sync_all_connected_users(), source="alpaca")
    record_refresh_end(run_id, "alpaca", error is None, error)

    if error:
        logger.error("Portfolio sync failed: %s", error)
    else:
        recalc_all_after_batch_sync()


# ── Job 2: Market Data Refresh (every 5 min, market-hours only) ──────
def _job_market_data():
    from services.refresh_gate import is_market_open, should_refresh, record_refresh_start, record_refresh_end

    if not is_market_open():
        return
    if not should_refresh("finnhub"):
        return

    run_id = record_refresh_start("finnhub")

    def _fetch():
        from integrations.finnhub import get_market_news
        from services.cache_invalidation import update_staleness
        news = get_market_news()
        update_staleness("finnhub", 0, "fresh")
        return len(news)

    count, error = with_retry(lambda: _fetch(), source="finnhub")
    record_refresh_end(run_id, "finnhub", error is None, error)
    if error:
        logger.error("Market data refresh failed: %s", error)
    else:
        logger.info("Market data refresh: %d news items", count)


# ── Job 3: Check-in Scanner (every 6 hours) ──────────────────────────
def _job_check_in_scanner():
    from integrations.check_in import scan_and_send_check_ins
    from services.refresh_gate import record_refresh_start, record_refresh_end

    run_id = record_refresh_start("check_in")
    _, error = with_retry(lambda: scan_and_send_check_ins(), source="check_in")
    record_refresh_end(run_id, "check_in", error is None, error)


# ── Job 4: Staleness Report (every 30 min) ───────────────────────────
def _job_staleness_report():
    from services.cache_invalidation import get_staleness_map
    from services.refresh_gate import record_refresh_start, record_refresh_end

    run_id = record_refresh_start("staleness")

    def _check():
        return get_staleness_map()

    staleness, error = with_retry(lambda: _check(), source="staleness")
    record_refresh_end(run_id, "staleness", error is None, error)
    if staleness:
        logger.debug("Staleness report: %d sources", len(staleness))


# ── Start / Stop ─────────────────────────────────────────────────────
def start_scheduler():
    """Start background scheduler with SQLite persistence, 4 jobs."""
    global _scheduler
    if _scheduler is not None:
        return

    jobstores = _build_jobstores()
    executors = _build_executors()

    _scheduler = BackgroundScheduler(
        jobstores=jobstores,
        executors=executors,
        daemon=True,
    )

    # Job 1: Portfolio sync every 15 min
    _scheduler.add_job(
        _job_portfolio_sync,
        trigger="interval",
        minutes=15,
        id="portfolio_sync_v2",
        replace_existing=True,
        max_instances=1,
    )

    # Job 2: Market data every 5 min
    _scheduler.add_job(
        _job_market_data,
        trigger="interval",
        minutes=5,
        id="market_data_refresh",
        replace_existing=True,
        max_instances=1,
    )

    # Job 3: Check-in scanner every 6 hours
    _scheduler.add_job(
        _job_check_in_scanner,
        trigger="interval",
        hours=6,
        id="check_in_scanner_v2",
        replace_existing=True,
        max_instances=1,
    )

    # Job 4: Staleness report every 30 min
    _scheduler.add_job(
        _job_staleness_report,
        trigger="interval",
        minutes=30,
        id="staleness_report",
        replace_existing=True,
        max_instances=1,
    )

    _scheduler.start()
    logger.info("Phase 17 scheduler started (4 jobs, SQLite job store)")


def stop_scheduler():
    """Shutdown scheduler gracefully."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Phase 17 scheduler stopped")