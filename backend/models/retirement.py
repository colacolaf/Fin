import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RetirementProfile(Base):
    __tablename__ = "retirement_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    current_age: Mapped[int] = mapped_column(nullable=False)
    retirement_age: Mapped[int] = mapped_column(nullable=False)
    current_savings: Mapped[float] = mapped_column(nullable=False)
    annual_income: Mapped[float] = mapped_column(nullable=False)
    contribution_rate: Mapped[float] = mapped_column(nullable=False)
    employer_match: Mapped[float | None] = mapped_column(nullable=True)
    desired_income: Mapped[float] = mapped_column(nullable=False)
    assumed_return: Mapped[float] = mapped_column(default=0.07)
    inflation_rate: Mapped[float] = mapped_column(default=0.03)
    social_security: Mapped[float | None] = mapped_column(nullable=True)
    readiness_score: Mapped[float | None] = mapped_column(nullable=True)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (Index("idx_retirement_user", "user_id"),)