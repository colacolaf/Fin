import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ExecutionLog(Base):
    __tablename__ = "execution_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recommendations.id", ondelete="SET NULL"), nullable=True
    )
    ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    action: Mapped[str] = mapped_column(String(10), nullable=False)
    shares: Mapped[float] = mapped_column(nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)
    total_value: Mapped[float] = mapped_column(nullable=False)
    executed_at: Mapped[str] = mapped_column(Text, nullable=False)
    broker: Mapped[str] = mapped_column(String(50), default="alpaca")
    order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    impact_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(Text, default=_now)

    __table_args__ = (
        Index("idx_exec_log_user", "user_id"),
        Index("idx_exec_log_rec", "recommendation_id"),
    )


# ── Phase 14: Execution Tracking ────────────────────────────


class ExecutionAction(Base):
    """Tracks user decision on a recommendation — accept, reject, execute, abandon."""

    __tablename__ = "execution_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recommendations.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # accepted | rejected | pending | executed | abandoned
    accepted_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejected_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    check_in_count: Mapped[int] = mapped_column(default=0)
    last_check_in: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_check_in: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(Text, default=_now)

    __table_args__ = (
        Index("idx_execaction_user", "user_id"),
        Index("idx_execaction_rec", "recommendation_id"),
        Index("idx_execaction_status", "status"),
        Index("idx_execaction_user_status", "user_id", "status"),
    )


class FollowThrough(Base):
    """Per-user follow-through scoring and stats."""

    __tablename__ = "follow_through"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    score: Mapped[int] = mapped_column(default=50)  # 0–100
    streak: Mapped[int] = mapped_column(default=0)  # consecutive executions
    acceptance_rate: Mapped[float] = mapped_column(default=0.0)  # 0.0–1.0
    execution_rate: Mapped[float] = mapped_column(default=0.0)  # 0.0–1.0
    total_accepted: Mapped[int] = mapped_column(default=0)
    total_executed: Mapped[int] = mapped_column(default=0)
    total_rejected: Mapped[int] = mapped_column(default=0)
    decision_speed_avg_hours: Mapped[float] = mapped_column(default=0.0)
    check_in_response_rate: Mapped[float] = mapped_column(default=0.0)
    updated_at: Mapped[str] = mapped_column(Text, default=_now)