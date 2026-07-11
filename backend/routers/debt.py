"""Debt management router — Plaid integration, payoff planning, payments."""
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from agents.debt import DebtAgent
from auth.dependencies import get_current_user
from database import get_db
from models.debt import Debt, PaymentLog, PayoffStrategy
from models.user import User
from services.debt_calculator import (
    calculate_dti,
    calculate_payoff_schedule,
    compare_strategies,
)
from services.plaid_integration import (
    create_link_token,
    exchange_token,
    sync_liabilities,
)
from services.structured_output import GenerateRequest, GenerateResponse

logger = logging.getLogger("fin.routers.debt")
router = APIRouter(prefix="/api/debt", tags=["debt"])


# ── Pydantic models ──────────────────────────────────────

class DebtAccountCreate(BaseModel):
    name: str
    debt_type: str = "other"  # credit_card, student_loan, mortgage, other
    balance: float
    interest_rate: float
    minimum_payment: float = 0.0


class DebtAccountUpdate(BaseModel):
    name: Optional[str] = None
    debt_type: Optional[str] = None
    balance: Optional[float] = None
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None


class PaymentCreate(BaseModel):
    debt_id: str
    amount: float
    payment_date: Optional[str] = None
    method: str = "manual"


class ExchangeTokenRequest(BaseModel):
    public_token: str


# ── Helper ───────────────────────────────────────────────

def _debt_to_dict(d: Debt) -> dict:
    return {
        "id": d.id,
        "user_id": d.user_id,
        "name": d.name,
        "debt_type": d.debt_type,
        "balance": float(d.balance),
        "interest_rate": float(d.interest_rate),
        "minimum_payment": float(d.minimum_payment or 0),
        "extra_payment": float(d.extra_payment or 0),
        "due_date": d.due_date,
        "is_active": d.is_active,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
    }


# ── Debt accounts CRUD ───────────────────────────────────

@router.get("/accounts")
def list_accounts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == user.id, Debt.is_active == 1)
        .order_by(Debt.balance.desc())
        .all()
    )
    return {"accounts": [_debt_to_dict(d) for d in debts]}


@router.post("/accounts", status_code=201)
def create_account(
    body: DebtAccountCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debt = Debt(
        id=str(uuid4()),
        user_id=user.id,
        name=body.name,
        debt_type=body.debt_type,
        balance=body.balance,
        interest_rate=body.interest_rate,
        minimum_payment=body.minimum_payment,
        is_active=1,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(debt)
    db.commit()
    db.refresh(debt)
    logger.info("Created debt account %s for user %s", debt.id, user.id)
    return _debt_to_dict(debt)


@router.put("/accounts/{debt_id}")
def update_account(
    debt_id: str,
    body: DebtAccountUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debt = (
        db.query(Debt)
        .filter(Debt.id == debt_id, Debt.user_id == user.id, Debt.is_active == 1)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt account not found")

    if body.name is not None:
        debt.name = body.name
    if body.debt_type is not None:
        debt.debt_type = body.debt_type
    if body.balance is not None:
        debt.balance = body.balance
    if body.interest_rate is not None:
        debt.interest_rate = body.interest_rate
    if body.minimum_payment is not None:
        debt.minimum_payment = body.minimum_payment
    debt.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(debt)
    return _debt_to_dict(debt)


@router.delete("/accounts/{debt_id}")
def delete_account(
    debt_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debt = (
        db.query(Debt)
        .filter(Debt.id == debt_id, Debt.user_id == user.id, Debt.is_active == 1)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt account not found")

    debt.is_active = 0
    debt.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Debt account deactivated"}


# ── Summary ──────────────────────────────────────────────

@router.get("/summary")
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == user.id, Debt.is_active == 1)
        .all()
    )

    if not debts:
        return {
            "total_debt": 0.0,
            "monthly_payments": 0.0,
            "avg_interest_rate": 0.0,
            "debt_count": 0,
            "dti_ratio": None,
            "accounts": [],
        }

    total = sum(float(d.balance) for d in debts)
    payments = sum(float(d.minimum_payment or 0) for d in debts)
    avg_rate = (
        sum(float(d.interest_rate) * float(d.balance) for d in debts) / total
        if total > 0
        else 0.0
    )

    # DTI requires income from user profile — use a default if not available
    user_settings = getattr(user, "settings", None)
    monthly_income = getattr(user_settings, "monthly_income", None) if user_settings else None
    dti = None
    if monthly_income and monthly_income > 0:
        dti_data = calculate_dti(
            [_debt_to_dict(d) for d in debts], float(monthly_income)
        )
        dti = dti_data

    return {
        "total_debt": round(total, 2),
        "monthly_payments": round(payments, 2),
        "avg_interest_rate": round(avg_rate, 2),
        "debt_count": len(debts),
        "dti_ratio": dti,
        "accounts": [_debt_to_dict(d) for d in debts],
    }


# ── Plaid integration ────────────────────────────────────

@router.post("/link-token")
def get_link_token(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = create_link_token(user.id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to create link token for user %s", user.id)
        raise HTTPException(status_code=500, detail="Failed to create link token")


@router.post("/exchange-token")
def exchange_public_token(
    body: ExchangeTokenRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        exchange_token(user.id, body.public_token, db)
        result = sync_liabilities(user.id, db)
        return {
            "detail": "Plaid connected and liabilities synced",
            "sync": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to exchange token for user %s", user.id)
        raise HTTPException(status_code=500, detail="Failed to connect Plaid")


# ── Payoff planning ──────────────────────────────────────

@router.get("/payoff-plan")
def get_payoff_plan(
    strategy: str = Query("avalanche", pattern="^(avalanche|snowball)$"),
    extra_payment: float = Query(0.0, ge=0.0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == user.id, Debt.is_active == 1)
        .all()
    )

    if not debts:
        return {
            "schedule": [],
            "total_months": 0,
            "total_interest": 0.0,
            "total_paid": 0.0,
            "payoff_date": None,
        }

    debt_dicts = [_debt_to_dict(d) for d in debts]
    plan = calculate_payoff_schedule(debt_dicts, strategy, extra_payment)

    # Save strategy to DB
    active = (
        db.query(PayoffStrategy)
        .filter(PayoffStrategy.user_id == user.id, PayoffStrategy.is_active == 1)
        .first()
    )
    if active:
        active.is_active = 0
        db.flush()

    strat = PayoffStrategy(
        id=str(uuid4()),
        user_id=user.id,
        strategy_type=strategy,
        monthly_budget=(
            sum(float(d.minimum_payment or 0) for d in debts) + extra_payment
        ),
        projected_payoff_date=plan.get("payoff_date"),
        total_interest_saved=0.0,  # computed in compare
        strategy_json=plan,
        is_active=1,
        created_at=datetime.now(timezone.utc),
    )
    db.add(strat)
    db.commit()

    return plan


@router.get("/strategy-comparison")
def get_strategy_comparison(
    extra_payment: float = Query(0.0, ge=0.0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == user.id, Debt.is_active == 1)
        .all()
    )

    if not debts:
        return {"avalanche": {}, "snowball": {}, "comparison": {}}

    debt_dicts = [_debt_to_dict(d) for d in debts]
    return compare_strategies(debt_dicts, extra_payment)


@router.get("/dti")
def get_dti(
    monthly_income: float = Query(5000.0, gt=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debts = (
        db.query(Debt)
        .filter(Debt.user_id == user.id, Debt.is_active == 1)
        .all()
    )
    debt_dicts = [_debt_to_dict(d) for d in debts]
    return calculate_dti(debt_dicts, monthly_income)


# ── Payments ─────────────────────────────────────────────

@router.post("/payments", status_code=201)
def log_payment(
    body: PaymentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    debt = (
        db.query(Debt)
        .filter(Debt.id == body.debt_id, Debt.user_id == user.id, Debt.is_active == 1)
        .first()
    )
    if not debt:
        raise HTTPException(status_code=404, detail="Debt account not found")

    balance_before = float(debt.balance)
    new_balance = max(0.0, balance_before - body.amount)

    payment_date = (
        body.payment_date
        if body.payment_date
        else datetime.now(timezone.utc).isoformat()
    )

    log = PaymentLog(
        id=str(uuid4()),
        debt_id=debt.id,
        user_id=user.id,
        amount=body.amount,
        payment_date=payment_date,
        balance_after=new_balance,
        method=body.method,
        created_at=datetime.now(timezone.utc),
    )
    debt.balance = new_balance
    debt.updated_at = datetime.now(timezone.utc)

    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": log.id,
        "debt_id": log.debt_id,
        "amount": log.amount,
        "payment_date": log.payment_date,
        "balance_after": log.balance_after,
        "method": log.method,
    }


@router.get("/payments")
def list_payments(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(PaymentLog)
        .filter(PaymentLog.user_id == user.id)
        .order_by(PaymentLog.payment_date.desc())
        .limit(100)
        .all()
    )
    return {
        "payments": [
            {
                "id": p.id,
                "debt_id": p.debt_id,
                "amount": p.amount,
                "payment_date": p.payment_date,
                "balance_after": p.balance_after,
                "method": p.method,
            }
            for p in payments
        ]
    }


# ── Debt agent recommendations ───────────────────────────

@router.post("/recommendations")
def generate_recommendations(
    request: GenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger debt agent analysis and return recommendations."""
    try:
        agent = DebtAgent()
        result = agent.generate(
            user_id=user.id,
            mode=request.mode,
            db=db,
        )
        return result
    except Exception:
        logger.exception("Debt agent failed for user %s", user.id)
        raise HTTPException(status_code=500, detail="Debt analysis failed")