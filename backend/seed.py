"""Seed Fin database with demo user, portfolio, debts, retirement profile."""
import json
import uuid
import bcrypt
from datetime import datetime, timezone

from database import SessionLocal, engine, Base
import models  # noqa: F401 ensure all models registered

_now = lambda: datetime.now(timezone.utc).isoformat()

USER_ID = "00000000-0000-0000-0000-000000000001"
DEMO_EMAIL = "demo@fin.app"
DEMO_PASSWORD = "demo123"

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user exists
        existing = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
        if existing:
            print(f"Demo user already exists: {existing.id}")
            return

        # --- User ---
        pwd = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt()).decode()
        user = models.User(id=USER_ID, email=DEMO_EMAIL, password_hash=pwd)
        db.add(user)
        db.flush()  # ensure user row exists before FK inserts

        # --- Holdings ---
        holdings_data = [
            {"ticker": "VTI",  "shares": 100.0, "cost_basis": 240.50, "last_price": 265.30, "asset_class": "etf",   "sector": "Total Market"},
            {"ticker": "BND",  "shares": 200.0, "cost_basis": 72.10,  "last_price": 71.80,  "asset_class": "etf",   "sector": "Bond"},
            {"ticker": "AAPL", "shares": 50.0,  "cost_basis": 175.00, "last_price": 220.90, "asset_class": "stock",  "sector": "Technology"},
            {"ticker": "VXUS", "shares": 80.0,  "cost_basis": 55.40,  "last_price": 59.20,  "asset_class": "etf",   "sector": "International"},
            {"ticker": "SGOV", "shares": 500.0, "cost_basis": 100.00, "last_price": 100.35, "asset_class": "etf",   "sector": "Cash Equiv."},
        ]
        for h in holdings_data:
            db.add(models.Holding(user_id=USER_ID, **h))

        # --- Allocation Targets ---
        allocs = [
            {"asset_class": "stocks",        "target_pct": 0.60},
            {"asset_class": "bonds",         "target_pct": 0.20},
            {"asset_class": "international", "target_pct": 0.10},
            {"asset_class": "cash",          "target_pct": 0.10},
        ]
        for a in allocs:
            db.add(models.AllocationTarget(user_id=USER_ID, **a))

        # --- Debts ---
        debts_data = [
            {"name": "Chase Sapphire", "debt_type": "credit_card", "balance": 4500.0, "interest_rate": 0.2499, "minimum_payment": 150.0},
            {"name": "Student Loan",   "debt_type": "student_loan", "balance": 22000.0, "interest_rate": 0.065, "minimum_payment": 280.0},
            {"name": "Auto Loan",      "debt_type": "auto", "balance": 12500.0, "interest_rate": 0.044, "minimum_payment": 340.0},
        ]
        for d in debts_data:
            db.add(models.Debt(user_id=USER_ID, **d))

        # --- Retirement Profile ---
        rp = models.RetirementProfile(
            user_id=USER_ID,
            current_age=32,
            retirement_age=65,
            current_savings=85000.0,
            annual_income=120000.0,
            contribution_rate=0.12,
            employer_match=0.04,
            desired_income=90000.0,
            social_security=2200.0,
            readiness_score=0.62,
        )
        db.add(rp)

        # --- Settings (per scope) ---
        settings_data = [
            {"scope": "global",      "config_json": json.dumps({"theme": "dark", "currency": "USD", "notifications": True})},
            {"scope": "investment",  "config_json": json.dumps({"risk_tolerance": "moderate", "rebalance_threshold": 0.05, "auto_execute": False})},
            {"scope": "debt",        "config_json": json.dumps({"strategy_preference": "avalanche", "monthly_budget": 800})},
            {"scope": "retirement",  "config_json": json.dumps({"ss_claiming_age": 67, "roth_first": True})},
        ]
        for s in settings_data:
            db.add(models.Setting(user_id=USER_ID, **s))

        db.commit()
        print(f"Seed complete. Demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()