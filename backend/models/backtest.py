"""Backtest models — strategy templates, backtest configurations, and run results."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class StrategyTemplate(Base):
    __tablename__ = "strategy_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "momentum", "mean_reversion", "custom"
    strategy_code: Mapped[str] = mapped_column(Text, nullable=False)  # python snippet for backtrader strategy
    params_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: {"sma_fast": 10, "sma_slow": 30}
    created_at: Mapped[str] = mapped_column(Text, default=_now)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_strategy_user", "user_id"),
        Index("idx_strategy_category", "category"),
    )


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    strategy_template_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending, running, completed, failed
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "AAPL", "SPY"
    timeframe: Mapped[str] = mapped_column(String(10), nullable=False, default="1d")  # 1d, 1h, 15m
    start_date: Mapped[str] = mapped_column(String(30), nullable=False)
    end_date: Mapped[str] = mapped_column(String(30), nullable=False)
    initial_cash: Mapped[float] = mapped_column(Float, nullable=False, default=10000.0)
    commission: Mapped[float] = mapped_column(Float, nullable=False, default=0.001)  # 0.1%

    # Results
    total_return_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    sharpe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    win_rate_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_trades: Mapped[int | None] = mapped_column(Integer, nullable=True)
    final_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Raw results (JSON snapshots for replay)
    equity_curve_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # [{date, value}, ...]
    trades_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # [{date, action, price, size}, ...]
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[str] = mapped_column(Text, default=_now)
    started_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("idx_backtest_user", "user_id"),
        Index("idx_backtest_status", "status"),
        Index("idx_backtest_user_status", "user_id", "status"),
    )


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    backtest_run_id: Mapped[str | None] = mapped_column(String(36), nullable=True)  # optional, if spawned from backtest
    strategy_template_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    action: Mapped[str] = mapped_column(String(10), nullable=False)  # buy, sell
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    order_type: Mapped[str] = mapped_column(String(20), nullable=False, default="market")  # market, limit
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="filled")  # pending, filled, cancelled
    pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(Text, default=_now)
    updated_at: Mapped[str] = mapped_column(Text, default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_paper_user", "user_id"),
        Index("idx_paper_user_symbol", "user_id", "symbol"),
    )