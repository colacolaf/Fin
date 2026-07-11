"""Plaid client wrapper — thin factory following the same pattern as alpaca.py.
Uses plaid-python to create link tokens, exchange public tokens,
and fetch liability data for debt tracking.
"""
import logging
from dataclasses import dataclass

import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.liabilities_get_request import LiabilitiesGetRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import (
    LinkTokenCreateRequestUser,
)
from plaid.model.products import Products

logger = logging.getLogger("fin.integrations.plaid")

PLAID_ENV_MAP = {
    "sandbox": plaid.Environment.Sandbox,
    "sandbox_custom": plaid.Environment.Sandbox,
    "development": plaid.Environment.Sandbox,  # Plaid has no Development env; use Sandbox
    "production": plaid.Environment.Production,
}


@dataclass
class PlaidCredentials:
    client_id: str
    secret: str
    env: str = "sandbox"


def _get_host(env: str) -> str:
    return PLAID_ENV_MAP.get(env, plaid.Environment.Sandbox)


def build_client(credentials: PlaidCredentials) -> plaid_api.PlaidApi | None:
    """Build PlaidApi client from credentials. Returns None if keys empty."""
    if not credentials.client_id or not credentials.secret:
        logger.warning("Plaid credentials not configured")
        return None

    configuration = plaid.Configuration(
        host=_get_host(credentials.env),
        api_key={
            "clientId": credentials.client_id,
            "secret": credentials.secret,
        },
    )
    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)


def create_link_token(
    client: plaid_api.PlaidApi, user_id: str
) -> dict:
    """Create a Plaid Link token for the given user ID.

    Returns dict with link_token and expiration.
    """
    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(client_user_id=user_id),
        client_name="Fin",
        products=[Products("liabilities")],
        country_codes=[CountryCode("US")],
        language="en",
    )

    response = client.link_token_create(request)
    return {
        "link_token": response.link_token,
        "expiration": response.expiration.isoformat() if response.expiration else None,
    }


def exchange_public_token(
    client: plaid_api.PlaidApi, public_token: str
) -> dict:
    """Exchange a public token for an access token and item ID.

    Returns dict with access_token and item_id.
    """
    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)
    return {
        "access_token": response.access_token,
        "item_id": response.item_id,
    }


def get_liabilities(
    client: plaid_api.PlaidApi, access_token: str
) -> dict:
    """Fetch liability data from Plaid.

    Returns the raw LiabilitiesGetResponse as a dict.
    """
    request = LiabilitiesGetRequest(access_token=access_token)
    response = client.liabilities_get(request)
    return response.to_dict()