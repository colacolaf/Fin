"""Exponential backoff retry for refresh jobs.

ponytail: single function with configurable retries. Logs each attempt.
"""
import logging
import time
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("fin.services.retry_handler")

_MAX_RETRIES = 3
_BASE_DELAY = 2.0  # seconds


def with_retry(
    fn: Callable[..., Any],
    source: str = "unknown",
    max_retries: int = _MAX_RETRIES,
    base_delay: float = _BASE_DELAY,
) -> tuple[Any, str | None]:
    """Call fn with exponential backoff. Returns (result, error_string_or_None)."""
    last_error: str | None = None
    for attempt in range(1, max_retries + 1):
        try:
            result = fn()
            return result, None
        except Exception as e:
            last_error = str(e)
            delay = base_delay * (2 ** (attempt - 1))
            logger.warning(
                "Retry %d/%d for %s after %.1fs: %s",
                attempt, max_retries, source, delay, last_error,
            )
            if attempt < max_retries:
                time.sleep(delay)
    logger.error("All %d retries exhausted for %s: %s", max_retries, source, last_error)
    return None, last_error