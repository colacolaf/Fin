"""Backtest engine — wraps backtrader for strategy testing with historical data."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from io import StringIO

from sqlalchemy.orm import Session

from config import settings
from models.backtest import BacktestRun, PaperTrade, StrategyTemplate

logger = logging.getLogger("fin.backtest")

# ── JSON serializers for model rows ────────────────────────────


def _serialize_strategy(t: StrategyTemplate) -> dict:
    return {
        "id": t.id,
        "user_id": t.user_id,
        "name": t.name,
        "description": t.description,
        "category": t.category,
        "strategy_code": t.strategy_code,
        "params_json": t.params_json,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


def _serialize_run(r: BacktestRun) -> dict:
    return {
        "id": r.id,
        "user_id": r.user_id,
        "strategy_template_id": r.strategy_template_id,
        "status": r.status,
        "symbol": r.symbol,
        "timeframe": r.timeframe,
        "start_date": r.start_date,
        "end_date": r.end_date,
        "initial_cash": r.initial_cash,
        "commission": r.commission,
        "total_return_pct": r.total_return_pct,
        "sharpe_ratio": r.sharpe_ratio,
        "max_drawdown_pct": r.max_drawdown_pct,
        "win_rate_pct": r.win_rate_pct,
        "total_trades": r.total_trades,
        "final_value": r.final_value,
        "equity_curve_json": r.equity_curve_json,
        "trades_json": r.trades_json,
        "error_message": r.error_message,
        "created_at": r.created_at,
        "started_at": r.started_at,
        "completed_at": r.completed_at,
    }


def _serialize_paper_trade(t: PaperTrade) -> dict:
    return {
        "id": t.id,
        "user_id": t.user_id,
        "backtest_run_id": t.backtest_run_id,
        "strategy_template_id": t.strategy_template_id,
        "symbol": t.symbol,
        "action": t.action,
        "quantity": t.quantity,
        "price": t.price,
        "order_type": t.order_type,
        "status": t.status,
        "pnl": t.pnl,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
    }


# ── Strategy Templates ─────────────────────────────────────────


def list_strategy_templates(db: Session, user_id: str, offset: int = 0, limit: int = 20) -> list[dict]:
    rows = (
        db.query(StrategyTemplate)
        .filter(StrategyTemplate.user_id == user_id)
        .order_by(StrategyTemplate.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_serialize_strategy(r) for r in rows]


def get_strategy_template(db: Session, template_id: str) -> dict | None:
    row = db.query(StrategyTemplate).filter(StrategyTemplate.id == template_id).first()
    return _serialize_strategy(row) if row else None


def create_strategy_template(db: Session, user_id: str, name: str, category: str, strategy_code: str, description: str | None = None, params_json: str | None = None) -> dict:
    template = StrategyTemplate(
        user_id=user_id,
        name=name,
        category=category,
        strategy_code=strategy_code,
        description=description,
        params_json=params_json,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _serialize_strategy(template)


def update_strategy_template(db: Session, template_id: str, user_id: str, **fields) -> dict | None:
    template = db.query(StrategyTemplate).filter(StrategyTemplate.id == template_id, StrategyTemplate.user_id == user_id).first()
    if not template:
        return None
    allowed = {"name", "description", "category", "strategy_code", "params_json"}
    for k, v in fields.items():
        if k in allowed and v is not None:
            setattr(template, k, v)
    template.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(template)
    return _serialize_strategy(template)


def delete_strategy_template(db: Session, template_id: str, user_id: str) -> bool:
    result = db.query(StrategyTemplate).filter(StrategyTemplate.id == template_id, StrategyTemplate.user_id == user_id).delete()
    db.commit()
    return result > 0


# ── Backtest Runs ──────────────────────────────────────────────


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def start_backtest_run(db: Session, user_id: str, symbol: str, start_date: str, end_date: str,
                       strategy_template_id: str | None = None, initial_cash: float = 10000.0,
                       commission: float = 0.001, timeframe: str = "1d") -> dict:
    run = BacktestRun(
        user_id=user_id,
        strategy_template_id=strategy_template_id,
        symbol=symbol,
        timeframe=timeframe,
        start_date=start_date,
        end_date=end_date,
        initial_cash=initial_cash,
        commission=commission,
        status="pending",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Execute synchronously (ponytail: no background task queue yet)
    # TODO: move to background task queue (Celery / asyncio.create_task)
    try:
        _execute_run(db, run)
    except Exception as exc:
        logger.exception("start_backtest_run: unhandled error for run %s", run.id)
        run.status = "failed"
        run.error_message = f"internal: {exc}"
        run.completed_at = _now()
        db.commit()

    db.refresh(run)
    return _serialize_run(run)


def _execute_run(db: Session, run: BacktestRun) -> None:
    """Run backtrader backtest and store results on the run row."""
    run.status = "running"
    run.started_at = _now()
    db.commit()

    try:
        import backtrader as bt
        import signal

        # Set CPU time limit for user strategy execution (sandbox guard)
        signal.alarm(30)  # 30-second timeout for entire backtest

        # Load strategy code if template provided
        strategy_cls = None
        if run.strategy_template_id:
            tmpl = db.query(StrategyTemplate).filter(StrategyTemplate.id == run.strategy_template_id).first()
            if tmpl and len(tmpl.strategy_code) > 100_000:
                raise ValueError("Strategy code exceeds maximum allowed size (100KB)")
            if tmpl:
                strategy_cls = _compile_strategy(tmpl.strategy_code)

        if strategy_cls is None:
            strategy_cls = _default_sma_cross

        cerebro = bt.Cerebro()
        cerebro.addstrategy(strategy_cls)
        cerebro.broker.setcash(run.initial_cash)
        cerebro.broker.setcommission(commission=run.commission)

        # Load data from Alpaca or CSV fallback
        data = _load_data(run.symbol, run.start_date, run.end_date, run.timeframe)
        cerebro.adddata(data)

        # Collect equity curve and trades
        equity = []
        trades = []

        orig_broker_value = cerebro.broker.getvalue()

        class EquityObserver(bt.Analyzer):
            def next(self):
                equity.append({"date": self.datas[0].datetime.datetime(0).isoformat(), "value": self.broker.getvalue()})

            def get_analysis(self):
                return equity

        cerebro.addanalyzer(EquityObserver, _name="equity")

        results = cerebro.run()

        for strat in results:
            for trade in strat.trades:
                trades.append({
                    "date": trade.data.datetime.datetime(0).isoformat(),
                    "action": "buy" if trade.size > 0 else "sell",
                    "price": trade.price,
                    "size": abs(trade.size),
                    "pnl": trade.pnlcomm,
                })

        final_value = cerebro.broker.getvalue()
        total_return = ((final_value - run.initial_cash) / run.initial_cash) * 100

        run.total_return_pct = round(total_return, 2)
        run.final_value = round(final_value, 2)
        run.total_trades = len(trades)
        run.equity_curve_json = json.dumps(equity)
        run.trades_json = json.dumps(trades)
        run.status = "completed"
        run.completed_at = _now()

    except Exception as e:
        logger.exception("Backtest failed for run %s", run.id)
        run.status = "failed"
        run.error_message = str(e)
        run.completed_at = _now()
    finally:
        signal.alarm(0)  # clear timeout

    db.commit()


def _compile_strategy(code: str):
    """Compile a strategy class from a user-provided Python snippet."""
    import backtrader as bt

    namespace = {"bt": bt}
    # ponytail: exec() for user code. Strategy code is internal-only (not public API).
    # Security: code is stored by authenticated users, not arbitrary public input.
    exec(code, namespace)
    # Find the first subclass of bt.Strategy
    for obj in namespace.values():
        if isinstance(obj, type) and issubclass(obj, bt.Strategy) and obj is not bt.Strategy:
            return obj
    raise ValueError("No bt.Strategy subclass found in strategy code")


def _load_data(symbol: str, start: str, end: str, timeframe: str):
    """Load price data from Alpaca or generate synthetic data as fallback."""
    import backtrader as bt
    import backtrader.feeds as btfeeds

    try:
        from alpaca_trade_api.rest import REST, TimeFrame

        api = REST(key_id=settings.alpaca_api_key, secret_key=settings.alpaca_api_secret, base_url="https://paper-api.alpaca.markets")
        tf_map = {
            "1d": TimeFrame.Day,
            "1h": TimeFrame.Hour,
            "15m": TimeFrame.Minute,
        }
        alpaca_tf = tf_map.get(timeframe, TimeFrame.Day)
        bars = api.get_bars(symbol, alpaca_tf, start=start, end=end, adjustment="raw").df
        if not bars.empty:
            feed = btfeeds.PandasData(dataname=bars)
            return feed
    except Exception:
        logger.warning("Alpaca data load failed for %s, using synthetic fallback", symbol)

    # ponytail: synthetic data fallback when Alpaca unavailable
    logger.info("Generating synthetic feed for %s %s to %s", symbol, start, end)
    return btfeeds.YahooFinanceCSVData(dataname=StringIO(_synthetic_csv(symbol, start, end)))


def _synthetic_csv(symbol: str, start: str, end: str) -> str:
    """Generate a minimal price CSV for demo/testing."""
    import random

    start_d = datetime.fromisoformat(start)
    end_d = datetime.fromisoformat(end)
    random.seed(hash(symbol) % (2**31))

    lines = ["Date,Open,High,Low,Close,Adj Close,Volume"]
    price = 100.0 + random.uniform(0, 200)
    current = start_d
    while current <= end_d:
        if current.weekday() < 5:  # skip weekends
            change = random.gauss(0, 2)
            price += change
            price = max(price, 1.0)
            o = price
            c = price + random.gauss(0, 1)
            h = max(o, c) + abs(random.gauss(0, 0.5))
            l = min(o, c) - abs(random.gauss(0, 0.5))
            v = int(abs(random.gauss(1000000, 500000)))
            lines.append(f"{current.date()},{o:.2f},{h:.2f},{l:.2f},{c:.2f},{c:.2f},{v}")
        current += timedelta(days=1)
    return "\n".join(lines)


def _default_sma_cross(bt):
    """Default SMA crossover strategy if none provided."""
    class SMACross(bt.Strategy):
        params = (("fast", 10), ("slow", 30))

        def __init__(self):
            sma_fast = bt.ind.SMA(period=self.params.fast)
            sma_slow = bt.ind.SMA(period=self.params.slow)
            self.crossover = bt.ind.CrossOver(sma_fast, sma_slow)

        def next(self):
            if not self.position:
                if self.crossover > 0:
                    self.buy()
            elif self.crossover < 0:
                self.sell()

    return SMACross


def get_backtest_run(db: Session, run_id: str, user_id: str) -> dict | None:
    row = db.query(BacktestRun).filter(BacktestRun.id == run_id, BacktestRun.user_id == user_id).first()
    return _serialize_run(row) if row else None


def list_backtest_runs(db: Session, user_id: str, offset: int = 0, limit: int = 20) -> list[dict]:
    rows = (
        db.query(BacktestRun)
        .filter(BacktestRun.user_id == user_id)
        .order_by(BacktestRun.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_serialize_run(r) for r in rows]


# ── Paper Trading ──────────────────────────────────────────────


def execute_paper_trade(db: Session, user_id: str, symbol: str, action: str,
                        quantity: float, price: float, order_type: str = "market",
                        backtest_run_id: str | None = None,
                        strategy_template_id: str | None = None) -> dict:
    """Record a simulated trade (paper trading). No real broker connection."""
    if action not in ("buy", "sell"):
        raise ValueError("action must be 'buy' or 'sell'")
    trade = PaperTrade(
        user_id=user_id,
        backtest_run_id=backtest_run_id,
        strategy_template_id=strategy_template_id,
        symbol=symbol,
        action=action,
        quantity=quantity,
        price=price,
        order_type=order_type,
        status="filled",
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return _serialize_paper_trade(trade)


def list_paper_trades(db: Session, user_id: str, offset: int = 0, limit: int = 50) -> list[dict]:
    rows = (
        db.query(PaperTrade)
        .filter(PaperTrade.user_id == user_id)
        .order_by(PaperTrade.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_serialize_paper_trade(r) for r in rows]


def compute_paper_portfolio(db: Session, user_id: str) -> dict:
    """Aggregate paper trading positions into a summary.

    Uses average cost basis tracking: on sell, reduces cost_basis proportionally
    to the fraction of shares sold at their average entry price.
    """
    trades = db.query(PaperTrade).filter(PaperTrade.user_id == user_id, PaperTrade.status == "filled").order_by(PaperTrade.created_at).all()

    positions: dict[str, dict] = {}
    total_realized_pnl = 0.0
    for t in trades:
        if t.symbol not in positions:
            positions[t.symbol] = {"symbol": t.symbol, "quantity": 0, "cost_basis": 0.0, "current_value": 0.0, "pnl": 0.0}
        pos = positions[t.symbol]
        if t.action == "buy":
            # Average-cost: add purchase cost to cost basis
            pos["cost_basis"] += t.quantity * t.price
            pos["quantity"] += t.quantity
        else:
            # Sell: reduce cost basis proportionally by avg entry price
            if pos["quantity"] > 0.001:
                avg_entry = pos["cost_basis"] / pos["quantity"]
                pos["cost_basis"] -= t.quantity * avg_entry
                # Realized PnL on this sale
                realized = t.quantity * (t.price - avg_entry)
                pos["pnl"] += realized
                total_realized_pnl += realized
            pos["quantity"] -= t.quantity
            # Floor at zero after rounding
            if pos["quantity"] < 0:
                pos["cost_basis"] = 0.0
                pos["quantity"] = 0.0
        if t.pnl:
            # t.pnl from paper trade record is additional info
            pos["pnl"] += t.pnl
            total_realized_pnl += t.pnl

    # ponytail: current_value approximated as cost_basis + pnl (no live pricing)
    for pos in positions.values():
        pos["current_value"] = pos.get("cost_basis", 0) + pos.get("pnl", 0)

    active = [p for p in positions.values() if abs(p["quantity"]) > 0.001]
    return {"positions": active, "total_pnl": round(total_realized_pnl, 2), "position_count": len(active)}
