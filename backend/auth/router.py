"""Auth router: register, login, refresh, me."""
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from auth.jwt import create_access_token, create_refresh_token, decode_token
from auth.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserOut
from database import get_db
from middleware.rate_limiter import limiter
from models.portfolio import RefreshToken
from models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, name=user.name, is_active=bool(user.is_active), created_at=user.created_at)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        password_hash=_hash_password(body.password),
    )
    db.add(user)
    db.flush()

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(refresh), expires_at=_iso_from_now(days=7)))
    db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(refresh), expires_at=_iso_from_now(days=7)))
    db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh, user=_user_out(user))


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")

    user_id = payload.get("sub")
    token_hash = _hash_token(body.refresh_token)

    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == 0,
    ).first()

    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found or revoked")
    if datetime.now(timezone.utc) > datetime.fromisoformat(stored.expires_at):
        stored.revoked = 1
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = db.query(User).filter(User.id == user_id, User.is_active == 1).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotate: revoke old, issue new
    stored.revoked = 1
    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    db.add(RefreshToken(user_id=user.id, token_hash=_hash_token(new_refresh), expires_at=_iso_from_now(days=7)))
    db.commit()

    return TokenResponse(access_token=new_access, refresh_token=new_refresh, user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)


def _iso_from_now(*, days: int = 0, minutes: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days, minutes=minutes)).isoformat()
