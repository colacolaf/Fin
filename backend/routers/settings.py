"""Settings router — user preferences, app configuration."""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from config import settings as app_settings
from database import get_db
from models.portfolio import ApiConnection
from models.settings import Setting
from models.user import User
from utils.encryption import encrypt

router = APIRouter(prefix="/api/settings", tags=["settings"])


# ── Pydantic schemas matching frontend SetupWizardData ──
class BrokerConnectionSchema(BaseModel):
    apiKey: Optional[str] = None
    apiSecret: Optional[str] = None
    paperTrading: bool = True


class RiskToleranceSchema(BaseModel):
    riskScore: int = Field(ge=1, le=10, default=5)
    investmentHorizon: str = Field(default="medium")
    lossReaction: str = Field(default="hold_and_wait")


class GoalItem(BaseModel):
    id: str
    label: str = ""
    selected: bool = False
    targetAmount: Optional[float] = None
    timelineYears: Optional[int] = None


class GoalsSchema(BaseModel):
    goals: list[GoalItem] = []


class BudgetSchema(BaseModel):
    monthlyIncome: float = 0
    monthlyExpenses: float = 0
    monthlyInvestable: float = 0


# Flat structure — frontend sends this directly, no {data: {...}} wrapper
class OnboardingDataSchema(BaseModel):
    broker: Optional[BrokerConnectionSchema] = None
    risk: Optional[RiskToleranceSchema] = None
    goals: Optional[GoalsSchema] = None
    budget: Optional[BudgetSchema] = None


@router.get("/")
def get_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = db.query(Setting).filter(
        Setting.user_id == user.id, Setting.scope == "onboarding"
    ).first()
    if not setting:
        return {"onboardingComplete": False, "data": None}
    return {"onboardingComplete": True, "data": json.loads(setting.config_json)}


@router.put("/onboarding")
def save_onboarding(
    body: OnboardingDataSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save wizard onboarding data, store encrypted broker creds, mark complete."""
    setting = db.query(Setting).filter(
        Setting.user_id == user.id, Setting.scope == "onboarding"
    ).first()

    config_json = body.model_dump_json(exclude_none=True)

    if setting:
        setting.config_json = config_json
    else:
        setting = Setting(
            user_id=user.id,
            scope="onboarding",
            config_json=config_json,
        )
        db.add(setting)

    # Store encrypted broker credentials in api_connections
    if body.broker and body.broker.apiKey and body.broker.apiSecret:
        encrypted_blob = encrypt(
            f"{body.broker.apiKey}:{body.broker.apiSecret}:{body.broker.paperTrading}",
            app_settings.encryption_key,
        )
        conn = db.query(ApiConnection).filter(
            ApiConnection.user_id == user.id,
            ApiConnection.service == "alpaca",
        ).first()
        if conn:
            conn.encrypted_key = encrypted_blob
            conn.is_active = 1
        else:
            conn = ApiConnection(
                user_id=user.id,
                    service="alpaca",
                    encrypted_key=encrypted_blob,
                    is_active=1,
            )
            db.add(conn)

    # Mark user onboarding complete
    user.onboarding_complete = True
    db.commit()
    return {"onboardingComplete": True}


@router.put("/")
def update_settings(
    body: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = db.query(Setting).filter(
        Setting.user_id == user.id, Setting.scope == "preferences"
    ).first()
    config_json = json.dumps(body)
    if setting:
        setting.config_json = config_json
    else:
        setting = Setting(
            user_id=user.id,
            scope="preferences",
            config_json=config_json,
        )
        db.add(setting)
    db.commit()
    return {"detail": "updated"}