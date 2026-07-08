FIN SYSTEM ARCHITECTURE & FLOW REFERENCE
Visual Guide to Agent Orchestration & Context Flow

🏗️ OVERALL SYSTEM ARCHITECTURE
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                             │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Portfolio Dashboard | Debt Mgmt | Retirement | Settings     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                    (REST API calls)                                  │
│                              ↓                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Agent Orchestration Layer                       │    │
│  │                                                               │    │
│  │  Request Router                                              │    │
│  │  ├─ GET /recommendations/investment  → Invoke Investment    │    │
│  │  ├─ GET /recommendations/debt        → Invoke Debt         │    │
│  │  └─ GET /recommendations/retirement  → Invoke Retirement   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│           │                    │                        │            │
│           ↓                    ↓                        ↓            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Context Manager (Load User Context File)             │   │
│  │         (04_user_context_file_schema.md)                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           ├─ Load from database                                      │
│           ├─ Verify freshness (portfolio sync <24h?)                │
│           ├─ If stale, trigger refresh (Alpaca/Plaid)              │
│           └─ Inject into system message                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              System Prompt Manager                            │   │
│  │  (01_investment_agent_system_prompt.md)                       │   │
│  │  (02_debt_agent_system_prompt.md)                             │   │
│  │  (03_retirement_agent_system_prompt.md)                       │   │
│  │                                                                │   │
│  │  Load system prompt based on agent type                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              LLM Call Manager                                 │   │
│  │                                                                │   │
│  │  1. Combine: [System Prompt] + [Context File] + [User Msg]  │   │
│  │  2. Call Ollama (localhost:11434)                             │   │
│  │  3. Parse response (extract JSON confidence)                  │   │
│  │  4. Validate recommendation format                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           ↓                                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Database Layer (SQLAlchemy ORM)                       │   │
│  │                                                                │   │
│  │  ├─ Save recommendation (with confidence, reasoning)         │   │
│  │  ├─ Log recommendation in history                            │   │
│  │  └─ Store for user voting                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           ├─ API Credential Manager (Plaid, Alpaca, Finnhub)       │   │
│           ├─ Portfolio Data Cache (updated hourly)                 │   │
│           ├─ Debt Data Cache (updated daily)                       │   │
│           ├─ User Voting History                                   │   │
│           └─ User Context File (JSON blob)                         │   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         External API Clients                                  │   │
│  │                                                                │   │
│  │  ├─ Alpaca (stock holdings, quotes, positions)               │   │
│  │  ├─ Plaid (bank accounts, transactions, debts)               │   │
│  │  └─ Finnhub (market data, fundamentals, news)                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                       LLM LAYER (Ollama)                             │
│                                                                       │
│  Model: Mistral 7B or Llama 2 13B                                   │
│  Inference: CPU or GPU (docker run --gpus all)                      │
│  Context window: 32K tokens                                         │
│  Port: localhost:11434                                              │
│                                                                       │
│  Agents at inference time:                                          │
│  ├─ Investment Agent (specialized prompt)                           │
│  ├─ Debt Agent (specialized prompt)                                │
│  └─ Retirement Agent (specialized prompt)                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

🔄 REQUEST-RESPONSE FLOW: USER GETS RECOMMENDATION
User Action: "Get Investment Recommendations"
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│  User clicks: "Analyze My Portfolio"                                │
│                    │                                                 │
│                    ↓                                                 │
│  POST /api/recommendations/investment                               │
│  with user_id in session                                            │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND: Agent Orchestration                                        │
│                                                                       │
│  @app.post("/api/recommendations/investment")                        │
│  async def get_investment_recommendation(current_user: User):        │
│                                                                       │
│    # STEP 1: Load system prompt                                      │
│    system_prompt = SYSTEM_PROMPTS["investment"]  # From cache        │
│                                                                       │
│    # STEP 2: Load user context file                                  │
│    context = load_context_file(current_user.id)                      │
│                                                                       │
│    # STEP 3: Check if context is fresh                               │
│    if context["portfolio"]["last_sync"] > 24h:                       │
│        refresh_portfolio_data(current_user.id)  # Call Alpaca        │
│        context = load_context_file(current_user.id)  # Reload        │
│                                                                       │
│    # STEP 4: Inject context into system message                      │
│    full_system = f"{system_prompt}\n---\n## USER CONTEXT\n{json.dumps(context)}"  │
│                                                                       │
│    # STEP 5: Prepare user message                                    │
│    user_message = "Analyze my portfolio and recommend next steps"    │
│                                                                       │
│    # STEP 6: Call Ollama                                             │
│    response = call_ollama(                                           │
│        model="mistral:7b",                                           │
│        system=full_system,                                           │
│        prompt=user_message,                                          │
│        temperature=0.3  # Low temp for consistency                   │
│    )                                                                  │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  OLLAMA (LLM Inference)                                              │
│                                                                       │
│  Input: [system prompt (1.5KB) + context (1KB) + user msg (0.1KB)]  │
│  Model: Mistral 7B with 32K context window                          │
│  Temperature: 0.3 (deterministic, consistent outputs)               │
│                                                                       │
│  Agent reasoning (follows system prompt structure):                  │
│  1. CLARIFY: Read user's goals from context                          │
│  2. ORGANIZE: Map holdings to asset classes, sectors                │
│  3. REASON: Analyze concentration, diversification, fees            │
│  4. EXPLAIN: Build recommendation with trade-offs                   │
│                                                                       │
│  Output: Markdown response with embedded JSON                       │
│                                                                       │
│  ├─ ## Recommendation Title                                          │
│  ├─ **What to do**: Clear action                                     │
│  ├─ **Why**: Reasoning                                               │
│  ├─ **Confidence Score**: ```json {overall, reasoning, data, user}```│
│  ├─ **Impact**: Before/after metrics                                 │
│  ├─ **Risks**: What could go wrong                                   │
│  ├─ **Unknowns**: What's uncertain                                   │
│  └─ **Disclaimer**: Legal notice                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND: Response Handling                                          │
│                                                                       │
│    # STEP 7: Parse response                                          │
│    recommendation = parse_recommendation(response)                   │
│                                                                       │
│    # Extract JSON confidence block                                   │
│    confidence = extract_json(response)  # Regex: ```json ... ```    │
│                                                                       │
│    # STEP 8: Validate format                                         │
│    if not is_valid_recommendation(recommendation):                   │
│        return error_response()                                       │
│                                                                       │
│    # STEP 9: Save to database                                        │
│    rec = Recommendation(                                             │
│        user_id=current_user.id,                                      │
│        agent_type="investment",                                      │
│        title="Trim NVDA concentration",                              │
│        recommendation_text=recommendation["text"],                   │
│        confidence_overall=confidence["overall"],  # e.g., 82         │
│        confidence_reasoning=confidence["reasoning_quality"],         │
│        confidence_data=confidence["data_completeness"],              │
│        confidence_user_alignment=confidence["user_alignment"],       │
│        created_at=now(),                                             │
│        status="pending"  # Awaiting user vote                        │
│    )                                                                  │
│    db.save(rec)                                                       │
│                                                                       │
│    # STEP 10: Return to frontend                                     │
│    return {                                                          │
│        "recommendation_id": rec.id,                                  │
│        "text": rec.recommendation_text,                              │
│        "confidence": rec.confidence_overall,                         │
│        "created_at": rec.created_at                                  │
│    }                                                                  │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│                                                                       │
│  Display Recommendation Card:                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ 🎯 Trim NVDA Concentration                                  │    │
│  │                                                              │    │
│  │ What to do: Sell 3% of NVDA over 6 weeks                   │    │
│  │                                                              │    │
│  │ Why: NVDA is 22% of portfolio, reduces to 19%              │    │
│  │      Lowers concentration risk, improves diversification    │    │
│  │                                                              │    │
│  │ Confidence: 82%  [████████░░]                              │    │
│  │   - Reasoning: 90%  (math is solid)                         │    │
│  │   - Data: 85%  (portfolio synced 2 hours ago)               │    │
│  │   - Alignment: 75%  (you prefer gradual moves)              │    │
│  │                                                              │    │
│  │ Impact:                                                      │    │
│  │   - Concentration: 22% → 19%                                │    │
│  │   - Diversification score: 68 → 72                          │    │
│  │   - Estimated tax: $400 (long-term gains)                   │    │
│  │                                                              │    │
│  │ [Accept]  [Reject]  [Learn More]                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  User clicks: [Accept]                                              │
└──────────────────────────────────────────────────────────────────────┘

🗳️ VOTING FLOW: USER VOTES, CONTEXT UPDATES
User Action: Accepts Recommendation
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│  User clicks: [Accept]                                              │
│                    │                                                 │
│                    ↓                                                 │
│  POST /api/recommendations/{rec_id}/vote                            │
│  {                                                                   │
│    "vote": "accepted",                                              │
│    "feedback": ""  # optional                                       │
│  }                                                                   │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND: Vote Handler                                              │
│                                                                       │
│  @app.post("/api/recommendations/{rec_id}/vote")                     │
│  async def vote_on_recommendation(rec_id: str, vote_data):           │
│                                                                       │
│    # STEP 1: Save vote to database                                   │
│    rec = db.get(Recommendation, rec_id)                              │
│    rec.user_vote = vote_data["vote"]  # "accepted"                   │
│    rec.user_feedback = vote_data["feedback"]  # if any               │
│    rec.voted_at = now()                                              │
│    rec.status = "accepted"                                           │
│    db.commit()                                                        │
│                                                                       │
│    # STEP 2: Load user context                                       │
│    context = load_context_file(rec.user_id)                          │
│                                                                       │
│    # STEP 3: Update past_decisions                                   │
│    context["past_decisions"].append({                                │
│        "date": now().isoformat(),                                    │
│        "agent": rec.agent_type,  # "investment"                      │
│        "recommendation_title": rec.title,                            │
│        "recommendation_summary": rec.summary,                        │
│        "user_vote": "accepted",                                      │
│        "user_reasoning": rec.user_feedback,                          │
│        "execution_status": "pending",                                │
│        "execution_date": None,                                       │
│        "agent_notes": ""                                             │
│    })                                                                 │
│                                                                       │
│    # STEP 4: Recalculate behavioral patterns                         │
│    all_decisions = context["past_decisions"]                         │
│    accepted = sum(1 for d in all_decisions if d["user_vote"] == "accepted")  │
│    context["behavioral_patterns"]["recommendation_acceptance_rate"] = (      │
│        accepted / len(all_decisions)  # e.g., 60%                    │
│    )                                                                  │
│                                                                       │
│    # STEP 5: Update agent-specific patterns                          │
│    inv_decisions = [d for d in all_decisions if d["agent"] == "investment"]  │
│    inv_accepted = sum(1 for d in inv_decisions if d["user_vote"] == "accepted")  │
│    context["behavioral_patterns"]["breakdown_by_agent"]["investment"]["acceptance_rate"] = (  │
│        inv_accepted / len(inv_decisions) if inv_decisions else 0     │
│    )                                                                  │
│                                                                       │
│    # Similar for debt and retirement agents                          │
│                                                                       │
│    # STEP 6: Update decision_speed pattern                           │
│    recent_decisions = [d for d in all_decisions if (now - parse_date(d["date"])) < 30 days]  │
│    avg_speed = sum(...) / len(recent_decisions)                      │
│    context["behavioral_patterns"]["decision_speed"]["average_days_to_execute"] = avg_speed  │
│                                                                       │
│    # STEP 7: Save updated context                                    │
│    save_context_file(rec.user_id, context)                           │
│                                                                       │
│    # STEP 8: Return response                                         │
│    return {                                                          │
│        "status": "success",                                          │
│        "message": "Vote recorded",                                   │
│        "updated_patterns": context["behavioral_patterns"]             │
│    }                                                                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  DATABASE (Updated)                                                  │
│                                                                       │
│  ├─ Recommendation table: rec.user_vote = "accepted"                │
│  ├─ Recommendation table: rec.voted_at = 2026-06-15 10:30:00        │
│  ├─ User Context File: past_decisions += new entry                  │
│  ├─ User Context File: acceptance_rate = 0.60 (was 0.58)            │
│  ├─ User Context File: investment_acceptance_rate = 0.65 (was 0.62) │
│  └─ User Context File: last_updated = 2026-06-15 10:30:00           │
│                                                                       │
│  Next recommendation for this user will use UPDATED CONTEXT!         │
│  Agent will see:                                                     │
│    - "User accepted 60% of recommendations" (was 58%)                │
│    - "User strongly accepts investment recommendations (65%)"        │
│    - Recommendation shows higher confidence in investment topics     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                             │
│  Show confirmation:                                                  │
│                                                                       │
│  ✅ Recommendation accepted!                                         │
│                                                                       │
│  Next step: Execute in your broker                                   │
│  (Fin does NOT auto-execute trades—you're in control)               │
│                                                                       │
│  Or ask: "What other recommendations do you have?"                  │
│         → Backend calls agent again with UPDATED context             │
│         → Agent sees you like investment moves                        │
│         → Agent may have higher confidence in next rec               │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

🔄 DAILY SCHEDULED TASK: REFRESH PORTFOLIO & DEBTS
SCHEDULED TASK: Every 6 AM (or configurable)

┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND: Data Refresh Job                                           │
│                                                                       │
│  for each user in active_users:                                      │
│                                                                       │
│    # STEP 1: Refresh Alpaca data                                     │
│    if user.alpaca_credential:                                        │
│        holdings = alpaca_client.get_account_positions(user)          │
│        # Update portfolio in database                                 │
│        # Recalculate total_value, asset_allocation, sector_allocation │
│                                                                       │
│    # STEP 2: Refresh Plaid data                                      │
│    if user.plaid_credential:                                         │
│        accounts = plaid_client.get_accounts(user)                    │
│        liabilities = plaid_client.get_liabilities(user)              │
│        # Update debts in database                                     │
│        # Recalculate total_balance, weighted_avg_rate, DTI           │
│                                                                       │
│    # STEP 3: Recalculate retirement readiness                        │
│    retirement_funded = calculate_retirement_funded_percent(user)     │
│                                                                       │
│    # STEP 4: Update user context file                                │
│    context = load_context_file(user.id)                              │
│    context["portfolio"]["total_value"] = new_value                   │
│    context["portfolio"]["last_sync"] = now()                         │
│    context["portfolio"]["sync_freshness_minutes"] = 0                │
│    context["debts"]["total_balance"] = new_debt_balance              │
│    context["retirement_accounts"]["total_retirement_savings"] = new  │
│    context["data_quality_flags"]["portfolio_data_stale"] = False     │
│    save_context_file(user.id, context)                               │
│                                                                       │
│    log: f"Refreshed data for {user.username}"                        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

Result:
├─ All user context files are fresh
├─ Next recommendations will use current market data
├─ Portfolio data < 24 hours old
└─ Agents will have high confidence in data completeness

📊 SYSTEM PROMPT INJECTION EXAMPLE
When user requests investment recommendation:
=== OLLAMA REQUEST ===

model: "mistral:7b"
temperature: 0.3

SYSTEM MESSAGE:
───────────────────────────────────────────────────────────────
# INVESTMENT AGENT SYSTEM PROMPT
**Version**: 1.0 | **Role**: Portfolio Optimization Specialist

[Full system prompt text from 01_investment_agent_system_prompt.md]
  ├─ Role definition
  ├─ Context you'll receive
  ├─ C.O.R.E. framework
  ├─ Recommendation output format
  ├─ Priority order for recommendations
  ├─ Web search strategy
  ├─ Behavioral personalization
  └─ Tone & communication rules

---
## USER CONTEXT (Auto-Injected)

{
  "user_id": "user_42_oakl",
  "user_profile": {
    "age": 42,
    "risk_tolerance": "Balanced",
    "annual_income_gross": 95000,
    ...
  },
  "portfolio": {
    "total_value": 225000,
    "holdings": [
      {
        "ticker": "NVDA",
        "shares": 50,
        "current_price": 120,
        "unrealized_gain_loss_percent": 1.0,
        ...
      },
      ...
    ],
    "sector_allocation": {
      "Technology": 0.35,  # 35% in tech
      ...
    }
  },
  "behavioral_patterns": {
    "recommendation_acceptance_rate": 0.58,
    "prefers_gradual_changes": true,
    ...
  },
  "past_decisions": [
    {
      "date": "2026-06-15T14:30:00Z",
      "recommendation_title": "Rebalance: Reduce NVDA 22% → 12%",
      "user_vote": "rejected",
      "user_reasoning": "Too aggressive; prefer slower moves",
      ...
    },
    ...
  ]
}
───────────────────────────────────────────────────────────────

USER MESSAGE:
───────────────────────────────────────────────────────────────
Analyze my portfolio and recommend next steps.
───────────────────────────────────────────────────────────────

AGENT (Ollama + Mistral 7B) PROCESSES:
  1. Read system prompt (understands its role, framework, output format)
  2. Read user context (understands user's situation, goals, preferences)
  3. Apply C.O.R.E. framework:
     - CLARIFY: User's risk tolerance is "Balanced", time horizon 15y to retirement
     - ORGANIZE: Portfolio is 65% stocks, 25% bonds, 10% cash. Tech is 35% (overweight)
     - REASON: NVDA concentration (22%) is high for Balanced profile
     - EXPLAIN: User rejected aggressive 10% trim before; recommend 3% trim instead
  4. Research: Search for current tech valuations to support recommendation
  5. Generate response with confidence scores

AGENT OUTPUT (Markdown + JSON):
───────────────────────────────────────────────────────────────
## Trim NVDA Concentration Gradually

**What to do**: Sell 3% of NVDA position over 6 weeks, reduce from 22% to 19%

**Why**: 
- NVDA is overweight (22% of portfolio, above target 15-18%)
- Improves diversification without major disruption
- Locks in gains ($3,000 unrealized) while position is strong
- You preferred "slower moves" based on past feedback

**Confidence Score**:
```json
{
  "overall": 82,
  "reasoning_quality": 90,
  "data_completeness": 85,
  "user_alignment": 75,
  "explanation": "High confidence in concentration risk (data is solid). Medium confidence in user alignment (you previously rejected aggressive rebalancing; this recommendation respects that preference)."
}
```

... [rest of recommendation] ...
───────────────────────────────────────────────────────────────

🎯 MULTI-AGENT COORDINATION: How Agents Learn From Each Other
Timeline: User interactions over 1 week

DAY 1: Investment Agent makes recommendation
├─ Recommends: Increase bond allocation from 25% to 35%
└─ User votes: Accept

    → Context updated:
      ├─ past_decisions += new entry
      ├─ behavioral_patterns.acceptance_rate = 0.60
      ├─ breakdown_by_agent.investment.acceptance_rate = 0.70
      └─ agent_learning.investment_agent_insights += "User willing to increase bonds"

DAY 3: Debt Agent sees updated context
├─ Loads context (sees updated behavioral patterns)
├─ Notes: "User recently increased bond allocation—might have extra cash"
├─ Recommends: Redirect freed-up cash from rebalancing to pay off high-interest CC
└─ User votes: Reject

    → Context updated:
      ├─ past_decisions += new entry
      ├─ behavioral_patterns.acceptance_rate = 0.55 (both votes factored in)
      ├─ breakdown_by_agent.debt.acceptance_rate = 0.40
      └─ agent_learning.debt_agent_insights += "User not interested in aggressive CC payoff. Keep debt recommendations conservative."

DAY 5: Retirement Agent sees fully updated context
├─ Loads context (sees both Investment and Debt decisions)
├─ Notes: "User accepted bond increase, rejected aggressive debt payoff. Profile: moderate risk, prefers stability."
├─ Recommends: Increase 401(k) contribution to capture employer match
└─ User votes: Accept

    → Context updated (ready for next week)
      ├─ acceptance_rate = 0.67 (2 accepts, 1 reject)
      ├─ breakdown_by_agent.retirement.acceptance_rate = 0.75
      └─ all agents will use this updated context next time

Result: Agents never talk directly, but they coordinate through context.
Investment sees Debt and Retirement patterns.
Debt sees Investment and Retirement patterns.
Retirement sees both others' patterns.

Each agent makes *more informed* recommendations over time.

🔐 DATA FLOW: SECURITY & PRIVACY
┌─ User provides API credentials (Alpaca, Plaid, Finnhub)
│
├─ Backend: AES-256 encrypt credentials at rest
│   │
│   ├─ Stored: encrypted_credential = AES_256_ENCRYPT(api_key, master_key)
│   └─ Master key: stored in environment variable (not in code)
│
├─ When needed: Decrypt credential
│   │
│   ├─ decrypted_key = AES_256_DECRYPT(encrypted_credential, master_key)
│   └─ Use decrypted_key to call Alpaca/Plaid/Finnhub
│
├─ User Context File: Stored in database, NOT encrypted
│   │
│   ├─ (Context is not sensitive: just aggregated financial metrics)
│   ├─ No personal credentials in context file
│   └─ Contains only summarized data (portfolio allocation %, debt amounts, etc.)
│
├─ API calls: HTTPS (encrypted in transit)
│   │
│   ├─ Alpaca: credentials sent over HTTPS
│   ├─ Plaid: OAuth token refreshed securely
│   └─ Finnhub: API key in request header (HTTPS only)
│
├─ LLM inference: ALL LOCAL (no data leaves machine)
│   │
│   ├─ System prompt: stored locally
│   ├─ User context: processed locally
│   ├─ User message: processed locally
│   └─ LLM response: processed locally (never sent anywhere)
│
└─ Database: Stored locally on user's machine
    │
    ├─ Credentials: encrypted
    ├─ Portfolio data: unencrypted (low sensitivity)
    ├─ Recommendations: unencrypted
    └─ User votes: unencrypted

📈 CONFIDENCE SCORE CALCULATION
When agent generates recommendation:
Three components measured:

1. REASONING QUALITY (0-100)
   ├─ Is logic clear? (90-100 if yes)
   ├─ Are trade-offs explicit? (90-100 if yes)
   ├─ Is recommendation defensible? (90-100 if yes)
   ├─ Multiple equally valid approaches? (60-70)
   └─ Heuristic: 90-100 (clear math), 70-80 (good logic), 50-70 (uncertain)

2. DATA COMPLETENESS (0-100)
   ├─ Portfolio data fresh? (<24h = +10)
   ├─ Missing cost basis? (-15)
   ├─ Don't have tax bracket? (-10)
   ├─ Income is estimated? (-5)
   └─ Heuristic: 95-100 (complete), 80-90 (small gaps), 60-75 (major gaps)

3. USER ALIGNMENT (0-100)
   ├─ Does recommendation match user's goals? (+20)
   ├─ Did user reject similar moves before? (-20)
   ├─ Did user consistently execute this type? (+10)
   ├─ User's risk tolerance match? (+15)
   └─ Heuristic: 90-100 (perfect fit), 70-80 (good), 50-60 (misaligned)

OVERALL = Average of three + adjustments
   ├─ (Reasoning_Quality + Data_Completeness + User_Alignment) / 3
   ├─ Bonus: +5 if recommendation is supported by web search
   └─ Cap: 100 maximum, 50 minimum for publishable recommendations

Example:
   Reasoning: 90 (math is solid)
   Data: 85 (portfolio fresh, missing tax bracket)
   User: 75 (user accepted similar moves 60% of time)
   
   Overall = (90 + 85 + 75) / 3 = 83
   
   Agent would report: {overall: 83, reasoning: 90, data: 85, user: 75}

✅ CHECKLIST: ONE REQUEST CYCLE
User clicks "Get Recommendations" → System completes:

 Frontend sends request to /api/recommendations/investment
 Backend loads Investment Agent system prompt from cache
 Backend loads User Context File from database
 Backend verifies context is fresh (portfolio <24h old)
 If stale, backend calls Alpaca API to refresh
 Backend injects context into system message
 Backend combines: [system prompt] + [context] + [user message]
 Backend calls Ollama API at localhost:11434
 Ollama processes with Mistral 7B
 Agent applies C.O.R.E. framework
 Agent decides if web search needed
 Agent generates recommendation in markdown + JSON
 Backend parses JSON confidence block
 Backend validates recommendation format
 Backend saves recommendation to database
 Backend returns recommendation to frontend
 Frontend displays recommendation card
 User votes: Accept / Reject / Defer
 Backend receives vote
 Backend updates recommendation status in database
 Backend loads User Context File
 Backend appends vote to past_decisions
 Backend recalculates behavioral_patterns
 Backend updates agent_learning insights
 Backend saves updated context file
 Next recommendation uses updated context


🎓 NEXT STEPS FOR DEVELOPERS

Understanding the flow? Review this document
Building backend? Start with 05_implementation_guide.md
Integrating agents? Read 04_user_context_file_schema.md
Understanding prompts? Read 01, 02, 03 agent prompts
Questions? Check 00_README.md FAQ


END OF ARCHITECTURE REFERENCE
