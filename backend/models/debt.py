import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    debt_type: Mapped[str] = mapped_column(String(50), nullable=False)
    balance: Mapped[float] = mapped_column(nullable=False)
    interest_rate: Mapped[float] = mapped_column(nullable=False)
    minimum_payment: Mapped[float] = mapped_column(nullable=False)
    extra_payment: Mapped[float] = mapped_column(default=0)
    due_date: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[str] = mapped_column(Text, default=_now)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (Index("idx_debts_user", "user_id"),)


class PaymentLog(Base):
    __tablename__ = "payment_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    debt_id: Mapped[str] = mapped_column(String(36), ForeignKey("debts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[float] = mapped_column(nullable=False)
    payment_date: Mapped[str] = mapped_column(Text, nullable=False)
    balance_after: Mapped[float] = mapped_column(nullable=False)
    method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[str] = mapped_column(Text, default=_now)

    __table_args__ = (
        Index("idx_payment_log_debt", "debt_id"),
        Index("idx_payment_log_user", "user_id"),
    )


class PayoffStrategy(Base):
    __tablename__ = "payoff_strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    strategy_type: Mapped[str] = mapped_column(String(50), nullable=False)
    monthly_budget: Mapped[float] = mapped_column(nullable=False)
    projected_payoff_date: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_interest_saved: Mapped[float | None] = mapped_column(nullable=True)
    strategy_json: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[str] = mapped_column(Text, default=_now)

    __table_args__ = (Index("idx_payoff_user", "user_id"),)