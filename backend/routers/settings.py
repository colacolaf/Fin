"""Settings router — user preferences, app configuration."""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.settings import Setting
from models.user import User


class BrokerConnectionSchema(BaseModel):
    apiKey: Optional[str] = None
    apiSecret: Optional[str] = None
    paperTrading: bool = True


class RiskToleranceSchema(BaseModel):
    riskScore: int = Field(ge=1, le=10, default=5)
    timeHorizon: str = Field(default="medium")
    lossReaction: str = Field(default="hold")


class GoalItem(BaseModel):
    id: str
    selected: bool = False
    targetAmount: Optional[float] = None
    timeline: Optional[str] = None


class GoalsSchema(BaseModel):
    goals: list[GoalItem] = []


class BudgetSchema(BaseModel):
    monthlyIncome: float = 0
    monthlyExpenses: float = 0


class OnboardingDataSchema(BaseModel):
    broker: Optional[BrokerConnectionSchema] = None
    risk: Optional[RiskToleranceSchema] = None
    goals: Optional[GoalsSchema] = None
    budget: Optional[BudgetSchema] = None


class OnboardingPayload(BaseModel):
    data: Optional[OnboardingDataSchema] = None

router = APIRouter(prefix="/api/settings", tags=["settings"])


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
    body: OnboardingPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save wizard onboarding data and mark complete."""
    setting = db.query(Setting).filter(
        Setting.user_id == user.id, Setting.scope == "onboarding"
    ).first()

    # Serialize validated onboarding data
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
