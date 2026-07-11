"""Backtest router — strategy templates, backtest runs, paper trading."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.dependencies import get_current_user
from database import get_db
from models.user import User
from services import backtest_engine as be
from services.input_sanitizer import validate_user_id

router = APIRouter(prefix="/api/backtest", tags=["backtest"])
logger = logging.getLogger("fin.backtest")


# ── Strategy Templates ────────────────────────────────────────


@router.get("/strategies")
def list_strategies(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    strategies = be.list_strategy_templates(db, str(user.id), offset, limit)
    return {"strategies": strategies, "count": len(strategies), "offset": offset, "limit": limit}


@router.get("/strategies/{template_id}")
def get_strategy(
    template_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    result = be.get_strategy_template(db, template_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy template not found")
    return result


@router.post("/strategies", status_code=status.HTTP_201_CREATED)
def create_strategy(
    name: str,
    category: str,
    strategy_code: str,
    description: str | None = None,
    params_json: str | None = None,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    if not name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")
    if not category.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="category is required")
    if not strategy_code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="strategy_code is required")
    validate_user_id(str(user.id))
    return be.create_strategy_template(db, str(user.id), name, category, strategy_code, description, params_json)


@router.put("/strategies/{template_id}")
def update_strategy(
    template_id: str,
    name: str | None = None,
    description: str | None = None,
    category: str | None = None,
    strategy_code: str | None = None,
    params_json: str | None = None,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    result = be.update_strategy_template(db, template_id, str(user.id),
                                         name=name, description=description,
                                         category=category, strategy_code=strategy_code,
                                         params_json=params_json)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy template not found")
    return result


@router.delete("/strategies/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_strategy(
    template_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> None:
    validate_user_id(str(user.id))
    if not be.delete_strategy_template(db, template_id, str(user.id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy template not found")
    return None


# ── Backtest Runs ──────────────────────────────────────────────


@router.post("/runs", status_code=status.HTTP_201_CREATED)
def start_backtest(
    symbol: str,
    start_date: str,
    end_date: str,
    strategy_template_id: str | None = None,
    initial_cash: float = 10000.0,
    commission: float = 0.001,
    timeframe: str = "1d",
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    if not symbol.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="symbol is required")
    if not start_date.strip() or not end_date.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date and end_date are required")
    if initial_cash <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="initial_cash must be > 0")
    validate_user_id(str(user.id))
    result = be.start_backtest_run(db, str(user.id), symbol, start_date, end_date,
                                   strategy_template_id, initial_cash, commission, timeframe)
    return result


@router.get("/runs")
def list_runs(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    runs = be.list_backtest_runs(db, str(user.id), offset, limit)
    return {"runs": runs, "count": len(runs), "offset": offset, "limit": limit}


@router.get("/runs/{run_id}")
def get_run(
    run_id: str,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    result = be.get_backtest_run(db, run_id, str(user.id))
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backtest run not found")
    return result


# ── Paper Trading ──────────────────────────────────────────────


@router.post("/paper-trades", status_code=status.HTTP_201_CREATED)
def create_paper_trade(
    symbol: str,
    action: str,
    quantity: float,
    price: float,
    order_type: str = "market",
    backtest_run_id: str | None = None,
    strategy_template_id: str | None = None,
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    if action not in ("buy", "sell"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="action must be 'buy' or 'sell'")
    if quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity must be > 0")
    if price <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="price must be > 0")
    validate_user_id(str(user.id))
    return be.execute_paper_trade(db, str(user.id), symbol, action, quantity, price,
                                  order_type, backtest_run_id, strategy_template_id)


@router.get("/paper-trades")
def list_paper_trades(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    trades = be.list_paper_trades(db, str(user.id), offset, limit)
    return {"trades": trades, "count": len(trades), "offset": offset, "limit": limit}


@router.get("/paper-portfolio")
def paper_portfolio(
    user: User = Depends(get_current_user),
    db=Depends(get_db),
) -> dict:
    validate_user_id(str(user.id))
    return be.compute_paper_portfolio(db, str(user.id))