# User Context Schema

The User Context File is read-only. It is loaded at the start of every agent conversation.

## Top-Level Structure

```json
{
  "security": {},
  "setup": {},
  "user_profile": {},
  "accounts": {},
  "portfolio": {},
  "debts": {},
  "retirement": {},
  "assets": {},
  "behavioral_patterns": {},
  "past_decisions": [],
  "agent_learning": {},
  "notifications": {}
}
```

## security

- `authorization_key_hash`: string — hash of the key required to open the app and execute trades
- `encryption_key`: string — key used to encrypt local data
- `key_storage_hint`: string — reminder of where the user stored the key

## setup

- `authorization_key_set`: boolean
- `encryption_key_set`: boolean
- `portfolio_connected`: boolean
- `bank_connected`: boolean
- `debt_connected`: boolean
- `llm_model_selected`: boolean
- `setup_complete`: boolean

## user_profile

- `risk_tolerance`: conservative | balanced | growth | aggressive
- `time_horizon_years`: number
- `annual_income`: number
- `monthly_cash_flow`: number
- `goals`: array of { type, target_amount, target_date }

## accounts

- `brokerages`: array of { name, connected, last_sync }
- `banks`: array of { name, connected, last_sync }
- `retirement_accounts`: array of { name, connected, last_sync }

## portfolio

- `holdings`: array of { ticker, shares, cost_basis, current_price, value }
- `total_value`: number
- `allocation`: object
- `concentration_risk`: low | medium | high
- `last_updated`: string
- `sync_frequency`: on_app_open
- `manual_assets`: array of { name, value, type }

## debts

- `debts`: array of { name, balance, interest_rate, minimum_payment, type }
- `total_balance`: number
- `weighted_apr`: number
- `monthly_minimum`: number

## retirement

- `accounts`: array of { type, balance, contribution_rate, employer_match }
- `funded_percentage`: number
- `projected_annual_income`: number
- `target_retirement_age`: number

## assets

- `properties`: array of { name, value, type, is_primary_residence }
- `other_assets`: array of { name, value, type }
- `startup_holdings`: array of { company, shares, proof_url, estimated_value, notes }
- `crypto`: array of { symbol, quantity, current_price }
- `vehicles`: array of { name, value }

## notifications

- `enabled`: boolean
- `events`: array of { event_type, enabled }
  - `agent_task_complete`
  - `debt_paid_off`
  - `debt_milestone`

## behavioral_patterns

- `prefers_gradual_changes`: boolean
- `asks_for_guarantees`: boolean
- `typical_response_time`: string
- `most_executed_agent`: string

## past_decisions

Array of:

```json
{
  "id": "string",
  "agent": "portfolio | debt | retirement",
  "recommendation_type": "string",
  "vote": "accepted | rejected | deferred",
  "executed": boolean,
  "date": "string",
  "notes": "string"
}
```

## agent_learning

Per-agent notes about what has worked for the user.
