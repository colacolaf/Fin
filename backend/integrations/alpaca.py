"""Alpaca client wrapper — thin factory around alpaca-py TradingClient.

ponytail: single function, no class wrapper needed. Config from settings, keys from ApiConnection.
Returns raw alpaca-py objects — callers handle type inspection.
"""
import logging
from dataclasses import dataclass
from typing import Optional

from alpaca.trading.client import TradingClient

logger = logging.getLogger("fin.integrations.alpaca")


@dataclass
class AlpacaCredentials:
    api_key: str
    api_secret: str
    paper: bool = True


def build_client(credentials: AlpacaCredentials, raw: bool = False) -> Optional[TradingClient]:
    """Build TradingClient from credentials. Returns None if keys empty."""
    if not credentials.api_key or not credentials.api_secret:
        if not raw:
            logger.warning("Alpaca credentials not configured")
        return None
    return TradingClient(
        api_key=credentials.api_key,
        secret_key=credentials.api_secret,
        paper=credentials.paper,
    )


def get_account_data(client: TradingClient):
    """Fetch account info. Returns raw alpaca Account object."""
    return client.get_account()


def get_all_positions(client: TradingClient) -> list:
    """Fetch all open positions."""
    return client.get_all_positions()


def get_all_orders(client: TradingClient, status_filter: str = "all") -> list:
    """Fetch orders. status_filter: 'open', 'closed', 'all'."""
    return client.get_orders(status=status_filter)