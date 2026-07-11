"""Refresh pipeline models — job tracking, staleness, data quality flags.

ponytail: two tables, match existing pattern (database.Base, Mapped, mapped_column).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class RefreshJob(Base):
    """Tracks each scheduled/manual refresh run per source."""

    __tablename__ = "refresh_jobs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    last_refresh: Mapped[str | None] = mapped_column(String, nullable=True)
    next_scheduled: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
    quality_flag: Mapped[str | None] = mapped_column(String(16), nullable=True)
    agent_diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    run_id: Mapped[str | None] = mapped_column(String(24), nullable=True, index=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_utcnow)


class StalenessReport(Base):
    """Per-source staleness snapshot for GET /data/staleness."""

    __tablename__ = "staleness_reports"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    staleness_seconds: Mapped[int] = mapped_column(nullable=False, default=0)
    threshold_seconds: Mapped[int] = mapped_column(nullable=False)
    quality_flag: Mapped[str] = mapped_column(String(16), nullable=False, default="fresh")
    agent_diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_checked: Mapped[str] = mapped_column(String, nullable=False, default=_utcnow)


Index("ix_refresh_jobs_source_status", RefreshJob.source, RefreshJob.status)