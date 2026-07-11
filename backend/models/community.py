"""Community models — benchmarks, leaderboard entries for anonymized peer comparisons."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CommunityBenchmark(Base):
    __tablename__ = "community_benchmarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    p25: Mapped[float] = mapped_column(Float, nullable=False)
    p50: Mapped[float] = mapped_column(Float, nullable=False)
    p75: Mapped[float] = mapped_column(Float, nullable=False)
    p90: Mapped[float] = mapped_column(Float, nullable=False)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_benchmark_bucket", "profile_bucket"),
        Index("idx_benchmark_metric", "metric_name"),
        Index("idx_benchmark_bucket_metric", "profile_bucket", "metric_name", unique=True),
    )


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    pseudonym: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "anon_a3f92b"
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    metric_display: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "Top 1%"
    badge: Mapped[str | None] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_leaderboard_category", "category"),
        Index("idx_leaderboard_rank", "category", "rank"),
    )