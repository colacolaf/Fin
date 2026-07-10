"""Rate limiter via slowapi — in-memory, 60/min default, 5/min on auth endpoints."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])