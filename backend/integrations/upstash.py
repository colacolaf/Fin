"""Upstash Redis client — rate limiting, benchmark caching, vote counters.

Patterns from @upstash/redis: sliding window via sorted sets, atomic INCR+EXPIRE.
Graceful degradation: all operations return safe defaults when Redis is unavailable.
"""

from __future__ import annotations

import hashlib
import logging
import time
from typing import Any

from config import settings

logger = logging.getLogger("fin.upstash")

# ── Redis client (lazy init) ──────────────────────────────

_redis: Any = None
_redis_available: bool | None = None


def get_client() -> Any | None:
    """Public alias for _get_redis — used by cache_invalidation."""
    return _get_redis()


def _get_redis() -> Any | None:
    """Lazy-init Upstash Redis REST client. Returns None if unavailable."""
    global _redis, _redis_available

    if _redis_available is False:
        return None

    if _redis is not None:
        return _redis

    url = settings.upstash_redis_url
    token = settings.upstash_redis_token

    if not url or not token:
        logger.info("Upstash Redis not configured — rate limiting will use in-memory fallback")
        _redis_available = False
        return None

    try:
        # Upstash Redis uses a REST API, not a persistent connection.
        # We use raw HTTP to avoid adding a dependency.
        _redis = _UpstashClient(url, token)
        _redis_available = True
        logger.info("Upstash Redis connected")
        return _redis
    except Exception as e:
        logger.warning(f"Upstash Redis unavailable: {e} — using fallback")
        _redis_available = False
        return None


class _UpstashClient:
    """Minimal Upstash Redis REST client. No external dependencies."""

    def __init__(self, url: str, token: str):
        import urllib.request

        self._url = url.rstrip("/")
        self._token = token
        self._req = urllib.request

    def _send(self, command: list[str | bytes]) -> Any:
        """Send a Redis command via Upstash REST API. Returns parsed JSON result."""
        import json

        body = json.dumps(command).encode()
        req = self._req.Request(
            f"{self._url}/pipeline",
            data=body,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with self._req.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read())
        except Exception as e:
            logger.warning(f"Redis command failed: {e}")
            raise

    def incr(self, key: str) -> int:
        """INCR key. Returns new value."""
        result = self._send(["INCR", key])
        return int(result[0]) if isinstance(result, list) else int(result)

    def expire(self, key: str, seconds: int) -> bool:
        """EXPIRE key seconds."""
        result = self._send(["EXPIRE", key, str(seconds)])
        val = result[0] if isinstance(result, list) else result
        return int(val) == 1

    def get(self, key: str) -> str | None:
        """GET key."""
        result = self._send(["GET", key])
        val = result[0] if isinstance(result, list) else result
        return val if val is not None else None

    def set(self, key: str, value: str, ex: int | None = None) -> bool:
        """SET key value [EX seconds]."""
        cmd: list[str | bytes] = ["SET", key, value]
        if ex:
            cmd.extend(["EX", str(ex)])
        result = self._send(cmd)
        val = result[0] if isinstance(result, list) else result
        return val == "OK"

    def zadd(self, key: str, score: float, member: str) -> int:
        """ZADD key score member."""
        result = self._send(["ZADD", key, str(score), member])
        return int(result[0]) if isinstance(result, list) else int(result)

    def zremrangebyscore(self, key: str, min_score: float, max_score: float) -> int:
        """ZREMRANGEBYSCORE key min max."""
        result = self._send(["ZREMRANGEBYSCORE", key, str(min_score), str(max_score)])
        return int(result[0]) if isinstance(result, list) else int(result)

    def zcard(self, key: str) -> int:
        """ZCARD key."""
        result = self._send(["ZCARD", key])
        return int(result[0]) if isinstance(result, list) else int(result)

    def del_key(self, key: str) -> int:
        """DEL key."""
        result = self._send(["DEL", key])
        return int(result[0]) if isinstance(result, list) else int(result)


# ── Rate Limiter (Sliding Window, Upstash pattern) ────────

# In-memory fallback for when Redis is unavailable
_fallback_counters: dict[str, list[float]] = {}


def _clean_fallback(key: str, window_secs: float) -> None:
    """Remove expired entries from in-memory fallback."""
    now = time.time()
    cutoff = now - window_secs
    if key in _fallback_counters:
        _fallback_counters[key] = [t for t in _fallback_counters[key] if t > cutoff]


def rate_limit(key: str, max_requests: int, window_secs: int) -> tuple[bool, int]:
    """Sliding-window rate limiter. Returns (allowed, remaining).

    Uses Redis sorted set for time-bucketed counting (Upstash pattern).
    Falls back to in-memory list if Redis unavailable.

    Example:
        allowed, remaining = rate_limit(f"vote:{user_id}", 20, 3600)
    """
    redis = _get_redis()

    if redis is None:
        # In-memory fallback
        _clean_fallback(key, window_secs)
        now = time.time()
        entries = _fallback_counters.get(key, [])
        if len(entries) >= max_requests:
            return False, 0
        _fallback_counters.setdefault(key, []).append(now)
        return True, max_requests - len(entries) - 1

    # Redis sliding window via sorted set
    now_ms = time.time() * 1000
    window_start = now_ms - (window_secs * 1000)

    try:
        # Remove expired entries
        redis.zremrangebyscore(key, 0, window_start)

        # Count current window
        count = redis.zcard(key)

        if count >= max_requests:
            return False, 0

        # Add current request
        redis.zadd(key, now_ms, f"{now_ms}-{count}")
        redis.expire(key, window_secs + 10)  # slight buffer

        return True, max_requests - count - 1
    except Exception as e:
        logger.warning(f"Redis rate limit error, allowing: {e}")
        return True, max_requests  # Graceful: allow on error


def check_rate_limit(key: str, max_requests: int, window_secs: int) -> bool:
    """Check if action is allowed under rate limit. Raises no exceptions."""
    allowed, _ = rate_limit(key, max_requests, window_secs)
    return allowed


# ── Vote counter caching ──────────────────────────────────

def cache_vote_counts(recommendation_id: str, accepted: int, rejected: int, deferred: int, ttl: int = 300) -> None:
    """Cache aggregate vote counts for a recommendation."""
    redis = _get_redis()
    if redis is None:
        return
    try:
        key = f"votes:{recommendation_id}"
        redis.set(f"{key}:accepted", str(accepted), ex=ttl)
        redis.set(f"{key}:rejected", str(rejected), ex=ttl)
        redis.set(f"{key}:deferred", str(deferred), ex=ttl)
    except Exception:
        pass


def get_cached_vote_counts(recommendation_id: str) -> dict[str, int] | None:
    """Get cached vote counts. Returns None on miss."""
    redis = _get_redis()
    if redis is None:
        return None
    try:
        key = f"votes:{recommendation_id}"
        accepted = redis.get(f"{key}:accepted")
        rejected = redis.get(f"{key}:rejected")
        deferred = redis.get(f"{key}:deferred")
        if accepted is None:
            return None
        return {
            "accepted": int(accepted),
            "rejected": int(rejected or 0),
            "deferred": int(deferred or 0),
        }
    except Exception:
        return None


def invalidate_vote_cache(recommendation_id: str) -> None:
    """Invalidate cached vote counts for a recommendation."""
    redis = _get_redis()
    if redis is None:
        return
    try:
        key = f"votes:{recommendation_id}"
        redis.del_key(f"{key}:accepted")
        redis.del_key(f"{key}:rejected")
        redis.del_key(f"{key}:deferred")
    except Exception:
        pass


# ── Benchmark caching ─────────────────────────────────────

def cache_benchmarks(profile_bucket: str, data: str, ttl: int = 3600) -> None:
    """Cache benchmark data for a profile bucket (1 hour TTL)."""
    redis = _get_redis()
    if redis is None:
        return
    try:
        redis.set(f"benchmark:{profile_bucket}", data, ex=ttl)
    except Exception:
        pass


def get_cached_benchmarks(profile_bucket: str) -> str | None:
    """Get cached benchmark data."""
    redis = _get_redis()
    if redis is None:
        return None
    try:
        return redis.get(f"benchmark:{profile_bucket}")
    except Exception:
        return None


# ── Anonymization helpers ─────────────────────────────────

def generate_pseudonym(user_id: str, salt: str = "fin-community") -> str:
    """Generate a consistent anonymized pseudonym from a user ID.

    Uses SHA-256 hash, truncated to 8 hex chars. Same user_id always maps to
    the same pseudonym within a salt. This enables anonymous leaderboards
    without storing mappings.
    """
    h = hashlib.sha256(f"{salt}:{user_id}".encode()).hexdigest()
    return f"anon_{h[:8]}"