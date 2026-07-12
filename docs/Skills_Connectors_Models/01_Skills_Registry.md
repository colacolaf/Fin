# Skills Registry

Version: 3.0 | Updated: July 2026

Every skill in Fin is a discrete capability. Each skill has a single owner agent, a clear trigger, typed inputs/outputs, required connectors, a privacy level, and a phase.

> **For deep methodology**, see the per-agent skill catalogs in `Skills/`:
> - `Skills/Investment_agent_skills`
> - `Skills/Debt_agent_skills`
> - `Skills/Retirement_agent_skills`
>
> This registry is the concise, implementation-oriented summary. The skill-catalog files contain the research basis, step-by-step instructions, confidence formulas, and multi-subagent pipelines.

---

## Skill Template

Use this template when adding a new skill.

```markdown
### Skill: `skill_id`
- **Description**: One-sentence capability.
- **Agent Owner**: Universal | Investment | Debt | Retirement | Research
- **Trigger**: Natural-language condition, `recommendation_type`, or scheduled job.
- **Inputs**:
  - `field_name` (`type`) — description.
- **Outputs**:
  - `field_name` (`type`) — description.
- **Dependencies**: List of connectors or local modules required.
- **Privacy Level**: Local Only | External Read | External Write
- **Status**: MVP | Phase 2 | Phase 3
- **Backend Action JSON** (if any): `{ "action": "...", "target": "...", "value": ... }`
```

---

## Universal Skills

These skills are available to every agent and the orchestrator.

### Skill: `search_web`
- **Description**: Retrieve recent market, macro, or product data from the web when confidence is low or data is stale.
- **Agent Owner**: Universal
- **Trigger**: Agent confidence < 80%; user names a ticker/fund/lender; context file flags stale data; recommendation depends on data older than 24 hours.
- **Inputs**:
  - `query` (`string`) — search query.
  - `required_confidence` (`number`, optional) — threshold that triggered search.
- **Outputs**:
  - `sources` (`list[{title, url, date}]`) — cited sources.
  - `summary` (`string`) — concise answer.
- **Dependencies**: Web search connector (Tavily, DuckDuckGo, or Serper).
- **Privacy Level**: External Read
- **Status**: MVP
- **Backend Action JSON**: none

### Skill: `find_skills`
- **Description**: Evaluates the user's query against the downloaded or attached skill catalog and selects the precise skill(s) to invoke.
- **Agent Owner**: Universal
- **Trigger**: User asks a question that requires specialized analysis; the agent needs to route the request to the correct capability.
- **Inputs**:
  - `user_query` (`string`) — The user's goal or question.
  - `available_skills` (`list[string]`) — The attached skill catalog list (skill IDs + descriptions).
- **Outputs**:
  - `selected_skills` (`list[string]`) — Ordered list of the best matching skill IDs.
  - `routing_confidence` (`number`) — 0-1 confidence score based on keyword/intent overlap.
  - `reasoning` (`string`) — One-line explanation of why these skills were chosen.
- **Dependencies**: None (local LLM inference over the attached catalog).
- **Privacy Level**: Local Only
- **Status**: MVP

### Skill: `fetch_user_context`
- **Description**: Load the read-only User Context File for the current user.
- **Agent Owner**: Universal
- **Trigger**: Start of every agent conversation.
- **Inputs**:
  - `user_id` (`string`)
- **Outputs**:
  - `context` (`UserContextFile`) — see `docs/SystemPrompts/04_User_context_file_schema.md`.
- **Dependencies**: Database (SQLite).
- **Privacy Level**: Local Only
- **Status**: MVP

### Skill: `log_recommendation_vote`
- **Description**: Persist a user's vote on a recommendation and update behavioral patterns.
- **Agent Owner**: Universal
- **Trigger**: User votes accept/reject/defer on a recommendation card.
- **Inputs**:
  - `recommendation_id` (`string`)
  - `vote` (`enum: accepted | rejected | deferred`)
  - `reasoning` (`string`, optional)
- **Outputs**:
  - `updated_behavioral_patterns` (`object`)
- **Dependencies**: Database.
- **Privacy Level**: Local Only
- **Status**: MVP

---

## Investment Agent Skills

### Skill: `portfolio_analyze`
- **Description**: Compute allocation, sector concentration, and diversification metrics from holdings.
- **Agent Owner**: Investment
- **Trigger**: User opens portfolio view; agent needs a snapshot before recommending.
- **Inputs**:
  - `user_id` (`string`)
- **Outputs**:
  - `total_value` (`number`)
  - `asset_allocation` (`object`)
  - `sector_allocation` (`object`)
  - `diversification_metrics` (`object`)
  - `concentration_risk` (`enum: low | medium | high`)
- **Dependencies**: Alpaca connector (MVP); brokerage connector registry.
- **Privacy Level**: External Read
- **Status**: MVP

### Skill: `rebalance_recommend`
- **Description**: Generate a single rebalancing recommendation when concentration or sector drift exceeds thresholds.
- **Agent Owner**: Investment
- **Trigger**: `recommendation_type: REBALANCE`; single holding > 20% or sector > 35% or asset-class drift > 10%.
- **Inputs**:
  - `portfolio` (`Portfolio`)
  - `risk_tolerance` (`string`)
  - `past_decisions` (`list`)
- **Outputs**:
  - `recommendation_type` (`"REBALANCE"`)
  - `source_ticker` (`string`)
  - `target_ticker` (`string`)
  - `value` (`number`)
  - `before` / `after` snapshots
- **Dependencies**: Alpaca; market data connector (Finnhub).
- **Privacy Level**: External Read (recommendation only)
- **Status**: MVP
- **Backend Action JSON**:
  ```json
  { "action": "SELL", "target": "NVDA", "value": 5000 }
  { "action": "BUY", "target": "VTI", "value": 5000 }
  ```

### Skill: `tax_loss_harvest`
- **Description**: Identify and recommend harvesting an unrealized loss while avoiding wash-sale violations.
- **Agent Owner**: Investment
- **Trigger**: `recommendation_type: TAX_LOSS_HARVEST`; unrealized loss > $500.
- **Inputs**:
  - `holdings` (`list[Holding]`)
  - `tax_bracket` (`number`)
- **Outputs**:
  - `harvest_candidate` (`string`)
  - `loss_amount` (`number`)
  - `proxy_ticker` (`string`)
  - `wash_sale_warning` (`boolean`)
- **Dependencies**: Alpaca; market data connector.
- **Privacy Level**: External Read (recommendation only)
- **Status**: MVP
- **Backend Action JSON**:
  ```json
  { "action": "SELL", "target": "COIN", "value": 2400 }
  { "action": "BUY", "target": "GBTC", "value": 2400 }
  ```

### Skill: `fee_optimize`
- **Description**: Recommend a lower-cost equivalent fund when expense ratio is above threshold.
- **Agent Owner**: Investment
- **Trigger**: `recommendation_type: FEE_OPTIMIZE`; expense ratio > 0.40%.
- **Inputs**:
  - `holdings` (`list[Holding]`)
- **Outputs**:
  - `current_fund` (`string`)
  - `alternative_fund` (`string`)
  - `annual_savings_usd` (`number`)
- **Dependencies**: Market data connector.
- **Privacy Level**: External Read
- **Status**: Phase 2

### Skill: `execute_trade`
- **Description**: Place a market order through the user's connected brokerage.
- **Agent Owner**: Investment
- **Trigger**: User confirms a recommendation that includes a backend trade action.
- **Inputs**:
  - `ticker` (`string`)
  - `side` (`enum: BUY | SELL`)
  - `value` (`number`) or `shares` (`number`)
- **Outputs**:
  - `order_id` (`string`)
  - `filled_price` (`number`)
  - `status` (`string`)
- **Dependencies**: Alpaca connector (MVP); brokerage connector registry.
- **Privacy Level**: External Write
- **Status**: MVP

---

## Debt Agent Skills

### Skill: `debt_payoff_simulate`
- **Description**: Calculate payoff timelines, total interest, and cash-flow impact for avalanche, snowball, or hybrid strategies.
- **Agent Owner**: Debt
- **Trigger**: User asks about payoff strategy; `recommendation_type: PAYOFF`.
- **Inputs**:
  - `debts` (`list[Debt]`)
  - `extra_payment` (`number`, default 0)
  - `strategy` (`enum: avalanche | snowball | hybrid`)
- **Outputs**:
  - `payoff_months` (`number`)
  - `total_interest` (`number`)
  - `total_paid` (`number`)
  - `payoff_date` (`string`)
  - `schedule` (`list[monthly_snapshot]`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: MVP

### Skill: `debt_vs_invest_analyze`
- **Description**: Compare guaranteed debt payoff return against expected investment return and employer match.
- **Agent Owner**: Debt / Retirement (cross-agent)
- **Trigger**: User asks "should I pay debt or invest?"; high-interest debt exists alongside uncaptured 401(k) match.
- **Inputs**:
  - `debts` (`list[Debt]`)
  - `investment_context` (`object`)
  - `employer_match` (`object`)
- **Outputs**:
  - `priority` (`enum: debt_first | match_first | hybrid`)
  - `rationale` (`string`)
  - `annual_value_impact_usd` (`number`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: MVP

### Skill: `consolidation_opportunity`
- **Description**: Flag when consolidating multiple high-APR debts could save interest.
- **Agent Owner**: Debt
- **Trigger**: User has 2+ credit cards with APR > 15%.
- **Inputs**:
  - `debts` (`list[Debt]`)
- **Outputs**:
  - `recommended_rate` (`number`)
  - `annual_savings_usd` (`number`)
  - `breakeven_months` (`number`)
- **Dependencies**: Plaid (read); optional loan-rate API.
- **Privacy Level**: External Read
- **Status**: Phase 2

### Skill: `log_payment`
- **Description**: Record a manual debt payment and update payoff progress.
- **Agent Owner**: Debt
- **Trigger**: User marks a payment as made.
- **Inputs**:
  - `debt_id` (`string`)
  - `amount` (`number`)
  - `date` (`string`)
- **Outputs**:
  - `updated_balance` (`number`)
  - `months_remaining` (`number`)
- **Dependencies**: Database.
- **Privacy Level**: Local Only
- **Status**: MVP

---

## Retirement Agent Skills

### Skill: `retirement_readiness_score`
- **Description**: Calculate funded percentage and projected retirement income.
- **Agent Owner**: Retirement
- **Trigger**: User opens retirement view; agent needs baseline before recommending.
- **Inputs**:
  - `retirement_accounts` (`object`)
  - `user_profile` (`object`)
  - `goals` (`list[Goal]`)
- **Outputs**:
  - `funded_percentage` (`number`)
  - `projected_annual_income` (`number`)
  - `gap_per_month` (`number`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: MVP

### Skill: `match_capture_recommend`
- **Description**: Recommend the exact contribution rate needed to capture the full employer 401(k) match.
- **Agent Owner**: Retirement
- **Trigger**: `recommendation_type: CAPTURE_MATCH`; `employer_match.is_match_captured == false`.
- **Inputs**:
  - `employer_match` (`object`)
  - `current_contribution_rate` (`number`)
  - `income` (`number`)
- **Outputs**:
  - `target_contribution_rate` (`number`)
  - `annual_free_money` (`number`)
  - `monthly_take_home_impact` (`number`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: MVP
- **Backend Action JSON**:
  ```json
  { "action": "INCREASE_CONTRIBUTION", "target": "401k", "value": 0.06 }
  ```

### Skill: `roth_conversion_analyze`
- **Description**: Model the tax impact of a Roth conversion in the current year.
- **Agent Owner**: Retirement
- **Trigger**: `recommendation_type: ROTH_CONVERSION`; user asks about conversions.
- **Inputs**:
  - `traditional_balance` (`number`)
  - `current_tax_bracket` (`number`)
  - `expected_future_tax_bracket` (`number`)
- **Outputs**:
  - `conversion_amount` (`number`)
  - `tax_due_now` (`number`)
  - `estimated_future_tax_savings` (`number`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: Phase 2

### Skill: `calculate_rmd`
- **Description**: Compute required minimum distribution for a given age and account balance.
- **Agent Owner**: Retirement
- **Trigger**: User is age 73+ with a Traditional IRA/401(k).
- **Inputs**:
  - `account_balance` (`number`)
  - `age` (`number`)
- **Outputs**:
  - `rmd_amount` (`number`)
- **Dependencies**: None (local math).
- **Privacy Level**: Local Only
- **Status**: Phase 3

---

## Research Agent Skills

### Skill: `company_fundamentals`
- **Description**: Fetch P/E, dividend yield, market cap, and recent news for a ticker.
- **Agent Owner**: Research
- **Trigger**: User asks about a specific ticker or fund.
- **Inputs**:
  - `ticker` (`string`)
- **Outputs**:
  - `pe_ratio` (`number`)
  - `dividend_yield` (`number`)
  - `market_cap` (`number`)
  - `recent_news` (`list`)
- **Dependencies**: Finnhub (MVP); Polygon.io (Phase 2).
- **Privacy Level**: External Read
- **Status**: MVP

### Skill: `sector_performance`
- **Description**: Return YTD performance and weight for a sector or index.
- **Agent Owner**: Research
- **Trigger**: User asks about sector/index performance.
- **Inputs**:
  - `sector` (`string`) or `index` (`string`)
- **Outputs**:
  - `ytd_return` (`number`)
  - `current_weight_in_sp500` (`number`, optional)
- **Dependencies**: Finnhub / Polygon.io.
- **Privacy Level**: External Read
- **Status**: Phase 2

---

## Skill-to-Agent Mapping

| Skill | Investment | Debt | Retirement | Research | Universal |
|-------|:----------:|:----:|:----------:|:--------:|:---------:|
| `search_web` | | | | | ✅ |
| `find_skills` | | | | | ✅ |
| `fetch_user_context` | | | | | ✅ |
| `log_recommendation_vote` | | | | | ✅ |
| `portfolio_analyze` | ✅ | | | | |
| `rebalance_recommend` | ✅ | | | | |
| `tax_loss_harvest` | ✅ | | | | |
| `fee_optimize` | ✅ | | | | |
| `execute_trade` | ✅ | | | | |
| `debt_payoff_simulate` | | ✅ | | | |
| `debt_vs_invest_analyze` | | ✅ | ✅ | | |
| `consolidation_opportunity` | | ✅ | | | |
| `log_payment` | | ✅ | | | |
| `retirement_readiness_score` | | | ✅ | | |
| `match_capture_recommend` | | | ✅ | | |
| `roth_conversion_analyze` | | | ✅ | | |
| `calculate_rmd` | | | ✅ | | |
| `company_fundamentals` | | | | ✅ | |
| `sector_performance` | | | | ✅ | |
