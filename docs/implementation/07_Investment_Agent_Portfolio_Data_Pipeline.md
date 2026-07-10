# 07 — Investment Agent: Portfolio Data Pipeline

## What & Why
Alpaca API integration (alpaca-py). Pull holdings, positions, orders. Store in DB. AES-256 encrypt API keys (cryptography.fernet). Background sync (APScheduler). owasp-security-check for key storage.

## Files to Create / Modify
```
backend/
├── integrations/
│   ├── __init__.py
│   ├── alpaca.py        # Alpaca client wrapper
│   ├── encryption.py    # Fernet encrypt/decrypt
│   └── scheduler.py     # APScheduler job
├── routers/
│   └── integrations.py  # POST /integrations/alpaca/test, POST /integrations/alpaca/sync
├── services/
│   └── portfolio_sync.py # Pull + upsert holdings/orders
├── models/
│   └── settings.py      # add BrokerConnection methods
```

## Steps
1. `backend/integrations/encryption.py` — Fernet key from config.ENCRYPTION_KEY. encrypt(plaintext) → ciphertext, decrypt(ciphertext) → plaintext. Key stored in .env, not DB.
2. `backend/models/settings.py` — BrokerConnection model: broker (alpaca/plaid), encrypted_api_key, encrypted_secret, is_paper, created_at. Add set_keys(raw) and get_keys() methods using encryption.
3. `backend/integrations/alpaca.py` — AlpacaClient wrapper: init with TradingClient(paper=is_paper). get_account(), get_positions(), get_orders(status='all'), get_portfolio_history(period='1Y').
4. `backend/services/portfolio_sync.py` — sync_portfolio(user_id): decrypt keys from BrokerConnection, init AlpacaClient, pull account + positions + orders. Upsert into Portfolio, Holding, Transaction, Account tables. Return sync summary.
5. `backend/routers/integrations.py` — POST /integrations/alpaca/test: validate Alpaca keys by calling get_account(), return success/error. POST /integrations/alpaca/sync: trigger manual sync, return summary.
6. `backend/integrations/scheduler.py` — APScheduler BackgroundScheduler. Job: sync_portfolio for all users with Alpaca connected every 15 minutes. Add to FastAPI startup event.
7. Add ENCRYPTION_KEY to `backend/config.py` and `.env.example`. Generate via `cryptography.fernet.Fernet.generate_key()`.
8. Add `alpaca-py`, `cryptography`, `apscheduler` to `backend/pyproject.toml`.
9. Playwright: setup wizard broker connect step → test with paper keys → verify "connected" state.
10. owasp-security-check review: encryption at rest, keys never logged, audit Fernet key rotation plan.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `owasp-security-check` (API key storage, encryption, secret management)

## GitHub Repos Needed
- `alpacahq/alpaca-py` (Alpaca Python SDK)

## Edge Cases & Risks
- Fernet key loss → all stored API keys unrecoverable. Document recovery: user re-enters keys.
- Alpaca rate limits (200/min free tier) → batch requests, respect Retry-After header.
- Paper vs Live account separation → separate BrokerConnection row per mode.
- Sync failure mid-way → transactional upserts, partial data better than stale.
- Empty portfolio → handle gracefully (no errors, show "no holdings").
- Clock skew → Alpaca uses UTC. Store all timestamps in UTC.

## Done When
- [ ] Fernet encrypt/decrypt round-trip works
- [ ] BrokerConnection stores keys encrypted, decryptable only with ENCRYPTION_KEY
- [ ] POST /integrations/alpaca/test returns {valid: true/false, message}
- [ ] POST /integrations/alpaca/sync pulls holdings + orders, populates DB
- [ ] APScheduler syncs every 15 min for connected users
- [ ] SyncIndicator shows green after successful sync, red after failure
- [ ] No API keys in logs or error messages
- [ ] owasp-security-check: encryption approved, secrets never in plaintext logs
- [ ] Playwright: broker connect + test + sync flow verified
- [ ] Git: review diff, squash merge to main with `[07] Portfolio data pipeline`