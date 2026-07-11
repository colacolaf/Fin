"""Finnhub market data client — quotes, news, company profiles.

ponytail: single factory function, thin wrapper around finnhub.Client.
Falls back to empty data on API error — never crashes the refresh pipeline.
"""
import logging
import os
from typing import Any

logger = logging.getLogger("fin.integrations.finnhub")


def _get_api_key() -> str | None:
    return os.environ.get("FINNHUB_API_KEY") or None


def _build_client():
    """Build finnhub.Client or None if no API key."""
    key = _get_api_key()
    if not key:
        return None
    try:
        import finnhub
        return finnhub.Client(api_key=key)
    except ImportError:
        logger.warning("finnhub-python not installed; pip install finnhub-python")
        return None
    except Exception as e:
        logger.error("Finnhub client init failed: %s", e)
        return None


def get_quote(symbol: str) -> dict[str, Any] | None:
    """Get real-time quote for a symbol. Returns None on failure."""
    client = _build_client()
    if not client:
        return None
    try:
        return client.quote(symbol)
    except Exception as e:
        logger.warning("Finnhub quote failed for %s: %s", symbol, e)
        return None


def get_company_profile(symbol: str) -> dict[str, Any] | None:
    """Get company profile (market cap, sector, name)."""
    client = _build_client()
    if not client:
        return None
    try:
        return client.company_profile2(symbol=symbol)
    except Exception as e:
        logger.warning("Finnhub profile failed for %s: %s", symbol, e)
        return None


def get_market_news(category: str = "general", min_id: int = 0) -> list[dict[str, Any]]:
    """Get latest market news. Returns empty list on failure."""
    client = _build_client()
    if not client:
        return []
    try:
        return client.general_news(category, min_id=min_id) or []
    except Exception as e:
        logger.warning("Finnhub news failed: %s", e)
        return []