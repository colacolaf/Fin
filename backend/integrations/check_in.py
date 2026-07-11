"""Check-in scanner — finds stale accepted actions and sends nudges.

ponytail: scan DB for actions past their next_check_in, generate a check-in nudge,
log that a check-in was sent (bumps check_in_count, reschedules next_check_in).
Actual notification delivery is a stub (console log) until push/email is wired.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from database import SessionLocal
from models.execution import ExecutionAction

logger = logging.getLogger("fin.check_in")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _days_from_now(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def scan_and_send_check_ins():
    """Scan for overdue check-ins and send nudges. Called by scheduler every 6h."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        stale = (
            db.query(ExecutionAction)
            .filter(
                ExecutionAction.status == "accepted",
                ExecutionAction.next_check_in.isnot(None),
            )
            .all()
        )

        due = [a for a in stale if _parse_dt(a.next_check_in) is not None and _parse_dt(a.next_check_in) <= now]  # type: ignore[arg-type]

        for action in due:
            _send_nudge(action)

            # Bump check-in count and reschedule
            action.check_in_count += 1
            action.last_check_in = _now()
            action.next_check_in = _days_from_now(3 if action.check_in_count < 3 else 7)

        if due:
            db.commit()
            logger.info("Sent %d check-in nudges", len(due))
    except Exception:
        logger.exception("check_in scan failed")
    finally:
        db.close()


def _parse_dt(val: str | None) -> datetime | None:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val)
    except (ValueError, TypeError):
        return None


def _send_nudge(action: ExecutionAction):
    """Stub: log the nudge. Wire to push/email later."""
    logger.info(
        "CHECK_IN_NUDGE user=%s action=%s rec=%s check_in_count=%d",
        action.user_id,
        action.id,
        action.recommendation_id,
        action.check_in_count,
    )