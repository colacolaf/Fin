"""JWT encode / decode. HS256. Access=15min, Refresh=7d."""
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from config import settings

ALGORITHM = "HS256"
ACCESS_EXPIRE_MINUTES = 15
REFRESH_EXPIRE_DAYS = 7


def _jti() -> str:
    return os.urandom(16).hex()


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "access", "jti": _jti()}, settings.jwt_secret, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh", "jti": _jti()}, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Return payload or raise JWTError."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])