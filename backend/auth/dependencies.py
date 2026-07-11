"""Auth dependencies — local single-user stub (no JWT, no login)."""

from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001"
LOCAL_EMAIL = "local@fin.app"


class UserOut(BaseModel):
    """User output schema (kept minimal since no auth)."""
    id: str
    email: str
    name: str | None = None
    role: str = "user"
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Return the single local user. Creates it if it doesn't exist."""
    user = db.query(User).filter(User.id == LOCAL_USER_ID).first()
    if not user:
        from datetime import datetime, timezone
        user = User(
            id=LOCAL_USER_ID,
            email=LOCAL_EMAIL,
            name="Local User",
            password_hash="no-auth",
            role="user",
            is_active=1,
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user_id(user: User = Depends(get_current_user)) -> str:
    """Get just the current user's ID."""
    return user.id
