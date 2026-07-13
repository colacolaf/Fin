# Skills Registry

Each skill is a discrete capability with a clear trigger, typed inputs/outputs, and a privacy level.

## Universal Skills

### `fetch_user_context`
- Load the read-only User Context File.
- Trigger: start of every agent conversation.
- Inputs: `user_id`
- Outputs: `UserContextFile`
- Privacy: Local Only

### `search_web`
- Retrieve recent market, macro, or product data.
- Trigger: confidence < 80%; user names ticker/fund/lender.
- Inputs: `query`
- Outputs: `sources`, `summary`
- Privacy: External Read

### `log_decision`
- Persist a user's decision and update behavioral patterns.
- Trigger: user accepts/rejects/defers a recommendation.
- Inputs: `decision_id`, `vote`, `notes`
- Outputs: `updated_behavioral_patterns`
- Privacy: Local Only

### `send_desktop_notification`
- Send a desktop native notification.
- Trigger: agent task complete, debt paid off, debt milestone hit.
- Inputs: `title`, `body`, `event_type`
- Outputs: `delivered`
- Privacy: Local Only

### `run_setup_wizard`
- Guide the user through first-run setup.
- Trigger: app first launch.
- Required steps:
  1. Set authorization key
  2. Set encryption key
  3. Connect portfolio account
  4. Connect bank account
  5. Connect debt account
  6. Select local LLM model (default: Llama 3.1 8B)
- Inputs: `step`
- Outputs: `completed`
- Privacy: Local Only

## Portfolio Agent Skills

### `portfolio_analyze`
- Compute allocation, concentration, and diversification metrics.
- Inputs: `holdings`
- Outputs: `total_value`, `allocation`, `concentration_risk`
- Dependencies: Brokerage connector
- Privacy: External Read

### `rebalance_recommend`
- Generate a rebalancing recommendation.
- Inputs: `portfolio`, `risk_tolerance`, `past_decisions`
- Outputs: `source_ticker`, `target_ticker`, `value`, `before`, `after`
- Dependencies: Brokerage connector, market data
- Privacy: External Read

### `value_private_asset`
- Research and estimate the value of a private asset (startup, private equity, etc.).
- Inputs: `asset_name`, `proof_url`, `shares`, `last_known_valuation`
- Outputs: `estimated_value`, `valuation_method`, `confidence_notes`
- Dependencies: Web search
- Privacy: External Read

### `execute_trade`
- Place a long-term trade through a connected brokerage.
- Inputs: `ticker`, `side`, `value`, `authorization_key`
- Outputs: `order_id`, `filled_price`, `status`
- Dependencies: Brokerage connector
- Privacy: External Write

### `enable_paper_trading`
- Toggle paper trading mode for testing trades without real execution.
- Inputs: `enabled`
- Outputs: `mode`
- Privacy: Local Only

## Debt Agent Skills

### `debt_payoff_simulate`
- Calculate payoff timelines and total interest.
- Inputs: `debts`, `extra_payment`, `strategy`
- Outputs: `payoff_months`, `total_interest`, `payoff_date`
- Privacy: Local Only

### `debt_vs_invest_analyze`
- Compare debt payoff vs. investment return.
- Inputs: `debts`, `investment_context`, `employer_match`
- Outputs: `priority`, `rationale`
- Privacy: Local Only

## Retirement Agent Skills

### `retirement_readiness_score`
- Calculate funded percentage and projected income.
- Inputs: `retirement_accounts`, `user_profile`
- Outputs: `funded_percentage`, `projected_annual_income`, `gap_per_month`
- Privacy: Local Only

### `match_capture_recommend`
- Recommend contribution rate to capture full employer match.
- Inputs: `employer_match`, `current_contribution_rate`, `income`
- Outputs: `target_contribution_rate`, `annual_free_money`
- Privacy: Local Only
