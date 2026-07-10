USER CONTEXT FILE SCHEMA
Version: 1.0 | Purpose: Injected at start of every agent conversation | Updated: June 2026

OVERVIEW
The User Context File is a structured JSON document that gets injected into the beginning of every agent conversation. It contains all relevant financial data, user preferences, and behavioral patterns needed for the agent to make personalized, informed recommendations.
Key Design:

Agents don't store state between conversations; context is passed each time
File is read-only (agents can't modify it directly—only via voting/feedback)
Backend auto-updates the file after each agent interaction
Agents use web search to fill gaps not in the context file
Total size: ~1-2KB (efficient, <100 tokens at inference time)


FULL SCHEMA
json{
  "user_id": "string (unique identifier, not exposed to UI)",
  "context_version": "integer (increment when structure changes)",
  "last_updated": "ISO 8601 timestamp (when this file was last updated)",
  "generated_for_agent": "string (investment|debt|retirement - optional, for multi-agent dispatch)",

  "user_profile": {
    "age": "integer (required)",
    "location": "string (optional, e.g., 'California, USA')",
    "employment_status": "enum (W-2|1099|self-employed|retired|student|other)",
    "annual_income_gross": "number (required, in USD)",
    "annual_income_after_tax": "number (estimated, for discretionary calculations)",
    "tax_bracket_federal": "number (0.0-0.37, e.g., 0.24 for 24%)",
    "tax_bracket_state": "number (0.0-0.15, optional)",
    "risk_tolerance": "enum (Conservative|Balanced|Growth|Aggressive, required)",
    "time_horizon_primary": "string (e.g., '15 years to retirement', '3 years for house fund')"
  },

  "financial_goals": [
    {
      "goal_id": "string (unique, e.g., 'goal_retirement_2038')",
      "name": "string (e.g., 'Retire by 65')",
      "target_amount": "number or null (if N/A)",
      "target_date": "ISO 8601 date (e.g., '2038-12-31')",
      "priority": "enum (high|medium|low)",
      "status": "string (e.g., 'on_track_82%', 'at_risk_60%', 'achieved')"
    }
  ],

  "portfolio": {
    "total_value": "number (all holdings combined)",
    "last_sync": "ISO 8601 timestamp (when data was last fetched from Alpaca)",
    "sync_freshness_minutes": "integer (how old is this data? <60 = fresh)",
    "holdings_count": "integer (number of distinct positions)",
    
    "holdings": [
      {
        "ticker": "string (required, e.g., 'NVDA')",
        "shares": "number (required)",
        "entry_price": "number (cost basis per share)",
        "current_price": "number (last known price)",
        "current_value": "number (shares × current_price)",
        "unrealized_gain_loss_dollars": "number (current_value - entry_price × shares)",
        "unrealized_gain_loss_percent": "number (e.g., 0.40 for 40% gain)",
        "holding_period_days": "integer (days held; >365 = long-term capital gains)",
        "asset_class": "enum (stocks|etf|bonds|crypto|cash|other)",
        "sector": "string (e.g., 'Technology', 'Healthcare', 'Finance')",
        "notes": "string (e.g., 'In 401k, not taxable')"
      }
    ],
    
    "asset_allocation": {
      "stocks_percent": "number (0-100)",
      "bonds_percent": "number (0-100)",
      "cash_percent": "number (0-100)",
      "crypto_percent": "number (0-100, optional)",
      "other_percent": "number (0-100, optional)"
    },
    
    "sector_allocation": {
      "Technology": "number (percent)",
      "Healthcare": "number (percent)",
      "Financials": "number (percent)",
      "Energy": "number (percent)",
      "Real_Estate": "number (percent)",
      "Utilities": "number (percent)",
      "Consumer_Discretionary": "number (percent)",
      "Consumer_Staples": "number (percent)",
      "Materials": "number (percent)",
      "Industrials": "number (percent)",
      "Communication": "number (percent)"
    },
    
    "diversification_metrics": {
      "herfindahl_index": "number (0-1, 0=perfect diversity, 1=concentrated)",
      "concentration_risk": "enum (low|medium|high)",
      "concentration_risk_ticker": "object or null (e.g., {ticker: 'NVDA', percent: 0.22})"
    }
  },

  "debts": {
    "total_balance": "number (sum of all debt)",
    "monthly_payment_obligation": "number (sum of all minimums)",
    "weighted_average_interest_rate": "number (e.g., 0.082 for 8.2%)",
    "debt_to_income_ratio": "number (total_debt / annual_income, target <0.36)",
    
    "debts": [
      {
        "id": "string (unique identifier)",
        "type": "enum (credit_card|personal_loan|student_loan|mortgage|auto_loan|other)",
        "creditor": "string (name of lender)",
        "balance": "number (current balance)",
        "interest_rate": "number (e.g., 0.20 for 20% APR)",
        "minimum_payment": "number (required monthly minimum)",
        "monthly_payment_current": "number (what user actually pays, may be >minimum)",
        "original_term_months": "integer (e.g., 60 for 5-year loan)",
        "months_remaining": "integer (until payoff at current pace)",
        "status": "enum (active|deferred|in_forbearance|paid_off)",
        "is_variable_rate": "boolean (APR could change)",
        "notes": "string (e.g., 'Zero interest until Dec 2026')"
      }
    ]
  },

  "retirement_accounts": {
    "total_retirement_savings": "number (sum of all retirement accounts)",
    
    "accounts": [
      {
        "type": "enum (401k|Traditional_IRA|Roth_IRA|SEP_IRA|Solo_401k|brokerage|HSA)",
        "provider": "string (e.g., 'Fidelity', 'Vanguard')",
        "balance": "number (current value)",
        "current_contribution_rate": "number (0-1, e.g., 0.06 for 6%)",
        "annual_contribution_limit": "number (2026 limit for account type)",
        "is_employer_plan": "boolean (true for 401k, false for IRA)"
      }
    ],
    
    "employer_match": {
      "formula": "string (e.g., '50% up to 6%', '100% up to 3%')",
      "is_match_captured": "boolean (are you getting the full match?)",
      "annual_free_money": "number (employer match value if formula met)"
    },
    
    "estimated_social_security": "number (monthly amount at full retirement age, optional)",
    "estimated_social_security_claim_age": "integer (age user plans to claim, default 67)",
    
    "retirement_readiness": {
      "target_retirement_age": "integer (e.g., 65)",
      "years_to_retirement": "integer",
      "current_age": "integer",
      "estimated_retirement_spending_annual": "number (user's estimate or default)",
      "projected_portfolio_value_at_retirement": "number (calculated)",
      "projected_annual_income_at_retirement": "number (4% rule + Social Security)",
      "funded_percentage": "number (0-200%, e.g., 0.82 = 82% funded)"
    }
  },

  "behavioral_patterns": {
    "recommendation_acceptance_rate": "number (0-1, e.g., 0.58 = 58%)",
    "recommendation_execution_rate": "number (0-1, of accepted recommendations)",
    
    "breakdown_by_agent": {
      "investment": {
        "acceptance_rate": "number",
        "execution_rate": "number"
      },
      "debt": {
        "acceptance_rate": "number",
        "execution_rate": "number"
      },
      "retirement": {
        "acceptance_rate": "number",
        "execution_rate": "number"
      }
    },
    
    "decision_speed": {
      "average_days_to_execute": "number (e.g., 4.2)",
      "recent_pattern": "string (e.g., '3-5 days, very consistent')"
    },
    
    "recommendation_preferences": {
      "prefers_gradual_changes": "boolean (dislikes big swings)",
      "prefers_simple_recommendations": "boolean (avoid complex strategies)",
      "asks_for_guarantees": "boolean (wants certainty)",
      "emotional_vs_mathematical": "enum (emotional|balanced|mathematical)"
    },
    
    "communication_style": "string (e.g., 'Direct and data-driven', 'Wants lots of explanation')"
  },

  "past_decisions": [
    {
      "date": "ISO 8601 timestamp",
      "agent": "enum (investment|debt|retirement)",
      "recommendation_title": "string",
      "recommendation_summary": "string (one sentence)",
      "user_vote": "enum (accepted|rejected|deferred)",
      "user_reasoning": "string (user's explanation, if provided)",
      "execution_status": "enum (pending|executed|abandoned)",
      "execution_date": "ISO 8601 timestamp or null",
      "agent_notes": "string (what agent learned from this interaction)"
    }
  ],

  "agent_learning": {
    "investment_agent_insights": "string (e.g., 'User strongly values diversification. Rejects concentrated positions. Prefers 3-5% moves, not 10%.')",
    "debt_agent_insights": "string (e.g., 'User is aggressive about CC payoff. Less interested in student loans. Sensitive to monthly budget impact.')",
    "retirement_agent_insights": "string (e.g., 'User concerned about retirement readiness. Willing to increase contributions if clear benefit shown.')"
  },

  "data_quality_flags": {
    "portfolio_data_stale": "boolean (>24 hours since last sync)",
    "missing_cost_basis": "boolean (can't calculate taxes accurately)",
    "incomplete_debt_data": "boolean (some debts might not be in system)",
    "estimated_income": "boolean (income is user-provided estimate, not verified)",
    "low_confidence_data": ["string (list of fields with low confidence)"]
  }
}

FIELD DESCRIPTIONS & REQUIRED VS OPTIONAL
User Profile (REQUIRED)
FieldTypeRequiredNotesageinteger✅Critical for retirement calculationsannual_income_grossnumber✅Needed for all financial ratiosrisk_toleranceenum✅Determines asset allocation targetlocationstring❌May affect tax rules (nice to have)employment_statusenum✅Affects retirement account options (W-2, self-employed, etc.)tax_bracket_federalnumber✅For tax optimization recommendations
Portfolio (CONDITIONAL)

Required if user connected Alpaca account
Populated hourly from Alpaca API
If stale (>24h), agents should note freshness in confidence score
holdings array should include cost basis for tax calculations

Debts (CONDITIONAL)

Required if user connected Plaid account
Populated daily from Plaid
Optional if user manually enters debts
If incomplete, agents should note in confidence score

Retirement Accounts (CONDITIONAL)

Required if user has retirement savings
Can be auto-imported from connected accounts (Fidelity, Vanguard) or user-entered
employer_match is critical—if missing, agent should ask

Behavioral Patterns (AUTO-GENERATED)

Calculated after every agent interaction
Updated by voting system (accept/reject/execute)
Helps agents personalize future recommendations
Example: If user accepts 60% of recommendations but only executes 50%, agents know user is thoughtful but slow


HOW BACKEND UPDATES THE CONTEXT FILE
After User Votes on Recommendation
User votes: [Accept | Reject | Defer] on recommendation

Backend:
1. Log vote to database
2. Recalculate behavioral_patterns:
   - acceptance_rate = (total accepted / total recommendations)
   - execution_rate = (total executed / total accepted)
   - Update agent-specific breakdown
3. Update past_decisions array (add new entry)
4. Update agent_learning field:
   - Agent reads the vote + user reasoning
   - Logs insight: "User rejected aggressive rebalancing (3rd time); suggests prefers stability"
5. Save updated context file
After Data Refresh (Daily)
Backend scheduled task (e.g., 6 AM daily):
1. Call Alpaca API → get latest holdings
2. Call Finnhub API → get latest prices
3. Recalculate portfolio metrics:
   - total_value, asset_allocation, sector_allocation
   - unrealized gains/losses
   - diversification_score
4. Update last_sync timestamp
5. If data stale, set data_quality_flags.portfolio_data_stale = true
6. Save updated context file
After Major Life Change (Manual or Auto-Detected)
User indicates: Job change, new savings goal, income increase, etc.

Backend:
1. User updates profile (age, income, goals)
2. Trigger recalculation of retirement readiness
3. Update financial_goals array
4. Update behavioral patterns
5. Notify all agents next conversation will have new context

EXAMPLE CONTEXT FILE (REAL USER)
json{
  "user_id": "user_42_oakl",
  "context_version": 3,
  "last_updated": "2026-06-09T14:32:00Z",
  "generated_for_agent": null,

  "user_profile": {
    "age": 42,
    "location": "California, USA",
    "employment_status": "W-2",
    "annual_income_gross": 95000,
    "annual_income_after_tax": 65000,
    "tax_bracket_federal": 0.24,
    "tax_bracket_state": 0.093,
    "risk_tolerance": "Balanced",
    "time_horizon_primary": "15 years (retirement at 65)"
  },

  "financial_goals": [
    {
      "goal_id": "goal_ret_65",
      "name": "Retire by 65 with $1.5M",
      "target_amount": 1500000,
      "target_date": "2041-12-31",
      "priority": "high",
      "status": "on_track_82%"
    },
    {
      "goal_id": "goal_house",
      "name": "House down payment $50k",
      "target_amount": 50000,
      "target_date": "2027-12-31",
      "priority": "medium",
      "status": "in_progress_60%"
    }
  ],

  "portfolio": {
    "total_value": 225000,
    "last_sync": "2026-06-09T10:15:00Z",
    "sync_freshness_minutes": 259,
    "holdings_count": 6,
    "holdings": [
      {
        "ticker": "NVDA",
        "shares": 50,
        "entry_price": 60,
        "current_price": 120,
        "current_value": 6000,
        "unrealized_gain_loss_dollars": 3000,
        "unrealized_gain_loss_percent": 1.0,
        "holding_period_days": 450,
        "asset_class": "stocks",
        "sector": "Technology",
        "notes": null
      },
      {
        "ticker": "VTI",
        "shares": 300,
        "entry_price": 150,
        "current_price": 160,
        "current_value": 48000,
        "unrealized_gain_loss_dollars": 3000,
        "unrealized_gain_loss_percent": 0.067,
        "holding_period_days": 800,
        "asset_class": "etf",
        "sector": null,
        "notes": null
      }
    ],
    "asset_allocation": {
      "stocks_percent": 65,
      "bonds_percent": 25,
      "cash_percent": 10
    },
    "sector_allocation": {
      "Technology": 0.35,
      "Healthcare": 0.12,
      "Financials": 0.10
    },
    "diversification_metrics": {
      "herfindahl_index": 0.18,
      "concentration_risk": "medium",
      "concentration_risk_ticker": {
        "ticker": "NVDA",
        "percent": 0.22
      }
    }
  },

  "debts": {
    "total_balance": 50000,
    "monthly_payment_obligation": 1200,
    "weighted_average_interest_rate": 0.082,
    "debt_to_income_ratio": 0.632,
    "debts": [
      {
        "id": "debt_cc_chase",
        "type": "credit_card",
        "creditor": "Chase Sapphire",
        "balance": 2400,
        "interest_rate": 0.20,
        "minimum_payment": 100,
        "monthly_payment_current": 100,
        "original_term_months": null,
        "months_remaining": 30,
        "status": "active",
        "is_variable_rate": true,
        "notes": null
      }
    ]
  },

  "retirement_accounts": {
    "total_retirement_savings": 280000,
    "accounts": [
      {
        "type": "401k",
        "provider": "Fidelity (employer plan)",
        "balance": 200000,
        "current_contribution_rate": 0.03,
        "annual_contribution_limit": 23500,
        "is_employer_plan": true
      },
      {
        "type": "Traditional_IRA",
        "provider": "Vanguard",
        "balance": 50000,
        "current_contribution_rate": 0,
        "annual_contribution_limit": 7000,
        "is_employer_plan": false
      }
    ],
    "employer_match": {
      "formula": "50% up to 6%",
      "is_match_captured": false,
      "annual_free_money": 1425
    },
    "estimated_social_security": 2300,
    "estimated_social_security_claim_age": 67,
    "retirement_readiness": {
      "target_retirement_age": 65,
      "years_to_retirement": 23,
      "current_age": 42,
      "estimated_retirement_spending_annual": 60000,
      "projected_portfolio_value_at_retirement": 1060000,
      "projected_annual_income_at_retirement": 67400,
      "funded_percentage": 0.82
    }
  },

  "behavioral_patterns": {
    "recommendation_acceptance_rate": 0.58,
    "recommendation_execution_rate": 0.73,
    "breakdown_by_agent": {
      "investment": {
        "acceptance_rate": 0.65,
        "execution_rate": 0.80
      },
      "debt": {
        "acceptance_rate": 0.50,
        "execution_rate": 0.60
      },
      "retirement": {
        "acceptance_rate": 0.55,
        "execution_rate": 0.75
      }
    },
    "decision_speed": {
      "average_days_to_execute": 4.2,
      "recent_pattern": "3-5 days, consistent"
    },
    "recommendation_preferences": {
      "prefers_gradual_changes": true,
      "prefers_simple_recommendations": false,
      "asks_for_guarantees": false,
      "emotional_vs_mathematical": "balanced"
    },
    "communication_style": "Direct with clear reasoning; appreciates math but wants context"
  },

  "past_decisions": [
    {
      "date": "2026-06-15T14:30:00Z",
      "agent": "investment",
      "recommendation_title": "Rebalance: Reduce NVDA 22% → 12%",
      "recommendation_summary": "Trim concentrated NVDA position over 3 months to reduce concentration risk",
      "user_vote": "rejected",
      "user_reasoning": "Too aggressive; prefer slower moves",
      "execution_status": "abandoned",
      "execution_date": null,
      "agent_notes": "User rejected aggressive 10% shift. Try smaller moves (3-5%) in future."
    },
    {
      "date": "2026-06-10T10:15:00Z",
      "agent": "debt",
      "recommendation_title": "Attack high-interest CC first",
      "recommendation_summary": "Pay $200 extra toward Chase CC ($2.4k @ 20%), accelerates payoff by 6 months",
      "user_vote": "accepted",
      "user_reasoning": null,
      "execution_status": "executed",
      "execution_date": "2026-06-12T11:00:00Z",
      "agent_notes": "User executed quickly (2 days). High confidence in debt payoff recommendations."
    }
  ],

  "agent_learning": {
    "investment_agent_insights": "User values diversification but dislikes aggressive moves. Rejected 10% trim, likely to accept 3-5% moves. Executes consistently (80% rate). Interested in understanding *why* behind recommendations.",
    "debt_agent_insights": "User is aggressive about high-interest CC payoff. Less motivated by student loan optimization. Quick executor (2 days). Respects math-based payoff strategies.",
    "retirement_agent_insights": "User aware of retirement gap (82% funded). Not yet convinced to increase 401k contributions (hasn't voted on match capture). May respond better to 'free money' framing than 'retirement readiness'."
  },

  "data_quality_flags": {
    "portfolio_data_stale": false,
    "missing_cost_basis": false,
    "incomplete_debt_data": false,
    "estimated_income": false,
    "low_confidence_data": []
  }
}

BACKEND IMPLEMENTATION NOTES
Storage

Location: Database BLOB field or file-based JSON
Encryption: None (stored locally on user's machine, not in cloud)
Backup: Included in database backups
Versioning: Increment context_version on schema changes; allows agents to detect incompatibilities

Update Frequency
Data SourceUpdate FrequencyMethodPortfolio (Alpaca)Hourly or on-demandAPI fetchDebts (Plaid)DailyAPI fetchBehavioral patternsAfter every voteCalculationRetirement readinessAfter income/goal changesCalculationAgent learningAfter every conversationAgent-provided feedback
API Integration Points
python# Pseudocode for backend update flow

def update_context_file_after_vote(user_id, recommendation_id, vote):
    context = load_context_file(user_id)
    
    # 1. Log the vote
    context.past_decisions.append({
        date: now(),
        agent: recommendation.agent_type,
        recommendation_title: recommendation.title,
        user_vote: vote,
        execution_status: 'pending'
    })
    
    # 2. Recalculate behavioral patterns
    context.behavioral_patterns.recommendation_acceptance_rate = (
        sum(d for d in past_decisions if d.vote == 'accepted') / len(past_decisions)
    )
    
    # 3. Let agent record insights
    agent_feedback = agent.extract_learning(context, recommendation, vote)
    context.agent_learning[f"{agent}_insights"] = agent_feedback
    
    # 4. Save
    save_context_file(user_id, context)
    
    # 5. Notify frontend (optional)
    publish_event("context_updated", user_id)

AGENTS' USAGE PATTERN
At the start of every conversation:

Backend loads context file for user
Backend injects context as initial system message to agent
Agent reads context, uses it for all recommendations
Agent identifies gaps (missing data, stale data)
Agent uses web search to fill gaps (not present in context)
Agent generates recommendations personalized to context
After vote, backend updates context file for next conversation

Example agent behavior:
Agent receives context file showing:
- Portfolio: NVDA 22%, tech 35%
- Behavioral: User rejected aggressive moves before
- Past decision: "Too aggressive" feedback 3 days ago

Agent reasons:
"User has concentration risk but dislikes aggressive rebalancing.
Last recommendation (10% move) was rejected. 
I should suggest smaller move (3-5%) this time.
I'll search for current tech valuation to make case stronger."

Agent searches: "tech sector valuation 2026"
Agent recommends: "Trim NVDA by 3% over 6 weeks (gentle approach)"
User votes: Likely to accept (respects preference pattern)

END OF SCHEMA
This document is the contract between backend and agents. Use it as:

For backend devs: Schema to populate in database
For agents: Specification of what data they'll receive
For frontend devs: Shows what data is available for dashboards
