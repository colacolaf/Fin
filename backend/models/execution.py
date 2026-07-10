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