# Connectors Abstraction

Version: 3.0 | Updated: July 2026

A **Connector** is a typed adapter to an external financial API or data source. All connectors implement `BaseConnector`. The `ConnectorRegistry` selects the right provider at runtime based on user preference and availability.

---

## Base Interface

```python
from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    """Abstract base class for all Fin data connectors."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""
        ...

    @abstractmethod
    async def verify_auth(self) -> bool:
        """Return True if stored credentials are valid."""
        ...

    @abstractmethod
    async def sync_state(self, user_id: str) -> dict[str, Any]:
        """Pull read-only state and return a dict matching the User Context Schema.

        Raises:
            ConnectorAuthError: credentials invalid or expired.
            ConnectorRateLimitError: provider rate limit hit.
            ConnectorDataError: provider returned malformed data.
        """
        ...
```

## Specialized Interfaces

```python
class BrokerageConnector(BaseConnector):
    """Connector to a brokerage / investment account."""

    @abstractmethod
    async def get_holdings(self, user_id: str) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def get_orders(self, user_id: str) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def execute_trade(
        self,
        user_id: str,
        *,
        ticker: str,
        side: str,
        value: float | None = None,
        shares: float | None = None,
        order_type: str = "market",
    ) -> dict[str, Any]:
        """Place an order. Returns the provider's order object."""
        ...


class BankingConnector(BaseConnector):
    """Connector to bank accounts and liabilities."""

    @abstractmethod
    async def get_accounts(self, user_id: str) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def get_liabilities(self, user_id: str) -> list[dict[str, Any]]:
        """Credit cards, loans, mortgages."""
        ...

    @abstractmethod
    async def get_transactions(
        self, user_id: str, account_id: str, limit: int = 100
    ) -> list[dict[str, Any]]:
        ...


class MarketDataConnector(BaseConnector):
    """Connector to real-time or historical market data."""

    @abstractmethod
    async def get_quote(self, ticker: str) -> dict[str, Any]:
        ...

    @abstractmethod
    async def get_fundamentals(self, ticker: str) -> dict[str, Any]:
        ...

    @abstractmethod
    async def get_news(self, ticker: str, limit: int = 5) -> list[dict[str, Any]]:
        ...
```

## Connector Registry

```python
class ConnectorRegistry:
    """Runtime registry for connector instances."""

    def __init__(self):
        self._brokerage: dict[str, BrokerageConnector] = {}
        self._banking: dict[str, BankingConnector] = {}
        self._market_data: dict[str, MarketDataConnector] = {}

    def register_brokerage(self, name: str, connector: BrokerageConnector) -> None:
        self._brokerage[name] = connector

    def get_brokerage(self, name: str) -> BrokerageConnector:
        return self._brokerage[name]
```

## Error Types

```python
class ConnectorError(Exception):
    """Base connector exception."""

class ConnectorAuthError(ConnectorError):
    """Credentials invalid or expired."""

class ConnectorRateLimitError(ConnectorError):
    """Provider rate limit hit."""

class ConnectorDataError(ConnectorError):
    """Malformed or unexpected provider response."""
```

## Provider Coverage Matrix

| Provider | Type | Auth | Cost | Data Quality | Status | Phase |
|----------|------|------|------|--------------|--------|-------|
| **Alpaca** | Brokerage | API Key | Free | Excellent | ✅ MVP | MVP |
| **Plaid** | Banking | OAuth 2.0 | $0.25–2/user/mo | Excellent | ✅ MVP | MVP |
| **Finnhub** | Market Data | API Key | Free tier / $49/mo | Excellent | ✅ MVP | MVP |
| **Polygon.io** | Market Data | API Key | Free–$1,999/mo | Excellent | ✅ Phase 2 | Phase 2 |
| **Kraken** | Crypto | API Key + Secret | Free | Good | ⏳ Phase 2 | Phase 2 |
| **Coinbase** | Crypto | OAuth 2.0 | Free | Good | ⏳ Phase 2 | Phase 2 |
| **Truv** | Income / Employment | OAuth 2.0 | $2–5/verification | Excellent | ⏳ Phase 2 | Phase 2 |
| **Zillow** | Real Estate | API Key | ~$0.10/call | Good | ⏳ Phase 2 | Phase 2 |
| **Fidelity** | Retirement / Brokerage | OAuth 2.0 | TBD | TBD | ⏳ Phase 2 | Phase 2 |
| **Social Security (SSA)** | Government | OAuth | Free | Official | ⏳ Phase 3 | Phase 3 |

## Account Type Coverage

| Account Type | Typical Coverage | Primary Connector | Notes |
|--------------|------------------|-------------------|-------|
| Checking / Savings | ✅ High | Plaid | ~94% of adults; most major banks covered. |
| Credit Cards | ✅ High | Plaid | Balance, limit, APR, transactions. |
| Brokerage (taxable) | ✅ High | Alpaca | Holdings, orders, cash. |
| 401(k) / Employer Plan | ⚠️ Medium-Low | Plaid / Fidelity (Phase 2) | Fragmented recordkeepers; many lack public APIs. |
| IRA / Roth IRA | ✅ Medium | Plaid / Alpaca | Depends on custodian. |
| Student Loans | ✅ Medium-High | Plaid | Federal + many private servicers. |
| Mortgage / HELOC | ✅ Medium | Plaid | Balance and rate; payoff details may be limited. |
| Auto Loan | ✅ Medium | Plaid | Balance, rate, term. |
| Crypto (exchange) | ⚠️ Medium | Kraken / Coinbase | Exchange-held only. |
| Crypto (self-custody) | ❌ Low | Blockchain explorers | Manual / CSV fallback. |
| Real Estate (primary home) | ❌ Low | Zillow (Phase 2) | Manual entry fallback. |
| Private assets / BNPL | ❌ Low | None | Manual entry only. |

## Common Connection Failures

| Failure | Cause | Fallback |
|---------|-------|----------|
| **No API** | Institution has no developer portal. | Manual entry or CSV import. |
| **MFA / OAuth break** | Provider requires re-auth or unsupported MFA. | Prompt user to reconnect. |
| **Rate limit** | Too many requests. | Exponential backoff; cache stale data. |
| **Data mismatch** | Provider schema changed. | Map to canonical schema; log warning. |
| **Institutional block** | 401(k) custodian blocks aggregator. | Manual entry; Truv/employer API in Phase 2. |

## Implementation Notes for Coding Agents

1. Store encrypted credentials per user (Fernet/AES-256).
2. Never log raw API keys or OAuth tokens.
3. Map every provider response to the canonical User Context Schema in `docs/SystemPrompts/04_User_context_file_schema.md`.
4. Use `async` methods and `httpx` for all external calls.
5. Return structured errors so agents can adjust confidence scores.
