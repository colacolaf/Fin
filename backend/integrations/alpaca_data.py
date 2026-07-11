"""Alpaca market data client — historical bars and news via alpaca-py data API v2.

ponytail: thin wrapper, returns raw data dicts. Callers handle shape.
Falls back gracefully on missing credentials.
"""
import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from integrations.alpaca import AlpacaCredentials, build_client

logger = logging.getLogger("fin.integrations.alpaca_data")


def _build_data_client(credentials: AlpacaCredentials):
    """Build alpaca-py StockHistoricalDataClient."""
    if not credentials.api_key or not credentials.api_secret:
        return None
    try:
        from alpaca.data.historical import StockHistoricalDataClient
        return StockHistoricalDataClient(
            api_key=credentials.api_key,
            secret_key=credentials.api_secret,
        )
    except ImportError as e:
        logger.warning("alpaca-py data client unavailable: %s", e)
        return None
    except Exception as e:
        logger.error("Alpaca data client init failed: %s", e)
        return None


def get_historical_bars(
    credentials: AlpacaCredentials,
    symbol: str,
    days_back: int = 30,
    timeframe: str = "1D",
) -> list[dict[str, Any]] | None:
    """Fetch historical bars for a symbol. Returns list of bar dicts or None."""
    client = _build_data_client(credentials)
    if not client:
        return None
    try:
        from alpaca.data.requests import StockBarsRequest
        from alpaca.data.timeframe import TimeFrame

        end = datetime.now()
        start = end - timedelta(days=days_back)

        request = StockBarsRequest(
            symbol_or_symbols=[symbol],
            timeframe=TimeFrame.Day if timeframe == "1D" else TimeFrame.Hour,
            start=start,
            end=end,
        )
        bars = client.get_stock_bars(request)
        result = []
        if bars and bars.data and symbol in bars.data:
            for bar in bars.data[symbol]:
                result.append({
                    "t": str(bar.timestamp),
                    "o": float(bar.open),
                    "h": float(bar.high),
                    "l": float(bar.low),
                    "c": float(bar.close),
                    "v": int(bar.volume),
                })
        return result
    except Exception as e:
        logger.warning("Alpaca historical bars failed for %s: %s", symbol, e)
        return None


def get_latest_news(
    credentials: AlpacaCredentials,
    symbols: list[str] | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Fetch recent news from Alpaca. Returns empty list on failure."""
    client = _build_data_client(credentials)
    if not client:
        return []
    try:
        from alpaca.data.requests import NewsRequest

        request = NewsRequest(symbols=symbols or [], limit=limit)
        news = client.get_news(request)
        result = []
        if news and news.news:
            for n in news.news[:limit]:
                result.append({
                    "id": n.id,
                    "headline": n.headline,
                    "summary": n.summary,
                    "url": n.url,
                    "source": n.source,
                    "created_at": str(n.created_at),
                    "symbols": list(n.symbols) if n.symbols else [],
                })
        return result
    except Exception as e:
        logger.warning("Alpaca news fetch failed: %s", e)
        return []