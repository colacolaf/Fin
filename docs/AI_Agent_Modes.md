# AI Agent Modes

> How each agent thinking mode works, when to use it, and what happens under the hood.

**Version:** 1.0
**Status:** Specification
**Last Updated:** July 9, 2026
**Depends On:** `docs/Skills_Connectors_Models/LLM_Models_Provided`, `docs/SystemPrompts/06_System_architecture_agent_orchestration_flow.md`, `docs/Features/Backtesting/Training_mode_and_backtesting.md`

---

## 1. OVERVIEW

Fin supports four distinct agent modes that the user can toggle at any time — three thinking depth levels (Low, Medium, High) and a Training Mode for fine-tuning and backtesting. Each mode changes how the agent processes requests: which model is used, how much reasoning is allocated, token budget, response latency, and whether inference happens locally or in the cloud.

Modes apply per-agent (Investment, Debt, Retirement) and persist across sessions. A user can run the Investment Agent in High thinking while keeping the Questions Agent in Low thinking.

---

## 2. MODE ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│                     MODE SELECTOR (PER AGENT)                     │
│                                                                   │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│   │   LOW    │   │  MEDIUM  │   │   HIGH   │   │  TRAINING   │  │
│   │ Thinking │   │ Thinking │   │ Thinking │   │    MODE     │  │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘   └──────┬──────┘  │
│        │              │              │                 │          │
│        ▼              ▼              ▼                 ▼          │
│   ┌────────┐    ┌─────────┐   ┌──────────┐   ┌──────────────┐   │
│   │Fast LLM│    │Standard │   │Deep      │   │LoRA Fine-    │   │
│   │Minimal │    │LLM      │   │Reasoning │   │Tuning +      │   │
│   │Reason  │    │Normal   │   │LLM + CoT │   │Backtesting   │   │
│   └────────┘    │Reason   │   └──────────┘   └──────────────┘   │
│                 └─────────┘                                       │
└──────────────────────────────────────────────────────────────────┘
```

### Mode State Persistence

Each agent's mode is stored in the User Context File under `agent_preferences`:

```json
{
  "agent_preferences": {
    "investment_agent": {
      "mode": "high_thinking",
      "model_override": null,
      "last_toggled": "2026-07-08T14:22:00Z"
    },
    "debt_agent": {
      "mode": "medium_thinking",
      "model_override": "deepseek-v4-pro"
    },
    "retirement_agent": {
      "mode": "low_thinking"
    }
  }
}
```

---

## 3. LOW THINKING MODE

### 3.1 When to Use

- Quick factual questions ("What's the S&P 500 return YTD?")
- Simple calculations (expense categorization, basic debt payoff math)
- High-frequency lookups where speed matters more than depth
- Budget-conscious users minimizing API costs
- Mobile/offline scenarios where local inference is preferred

### 3.2 What Happens

| Parameter | Setting |
|-----------|---------|
| **Model (Cloud)** | Gemini 3.5 Flash, GPT-4o Mini, DeepSeek V4 Flash |
| **Model (Local)** | Mistral 7B, Phi-4 |
| **Temperature** | 0.1 (deterministic) |
| **Max Output Tokens** | 512 |
| **Chain-of-Thought** | Disabled |
| **Context Injected** | User profile + last 5 past decisions only |
| **Skill Tier** | Tier 1 only (always-on baseline skills) |
| **Expected Latency** | 1–3 seconds |
| **API Cost (Cloud)** | ~$0.0005–0.002 per request |

### 3.3 Agent Behavior

- No multi-step reasoning. Direct answer format.
- Skills executed: Tier 1 only (e.g., basic portfolio summary, simple debt amortization, retirement readiness score lookup).
- Response format: Short, direct. No confidence breakdown, no alternative scenarios.
- Falls back to local model if cloud is unavailable (offline resilience).

### 3.4 Example

> **User:** "What's my current portfolio value?"
>
> **Agent (Low):** "$487,230 as of July 9, 2026. Up 2.1% this week."

---

## 4. MEDIUM THINKING MODE

### 4.1 When to Use

- Standard recommendations (rebalancing, debt payoff strategy, retirement contribution advice)
- Multi-factor analysis where balance of speed and quality is needed
- Default mode for most users and most sessions
- Good value-to-cost ratio for daily use

### 4.2 What Happens

| Parameter | Setting |
|-----------|---------|
| **Model (Cloud)** | Claude Sonnet 5, GPT-5.5 (non-think mode), Gemini 3.1 Pro, DeepSeek V4 Pro |
| **Model (Local)** | Qwen 3.6 35B, Llama 4 Scout |
| **Temperature** | 0.3 |
| **Max Output Tokens** | 2048 |
| **Chain-of-Thought** | Internal only (not shown to user) |
| **Context Injected** | Full user profile + last 20 past decisions + behavioral patterns |
| **Skill Tier** | Tier 1 + Tier 2 (gated on connector data) |
| **Expected Latency** | 3–8 seconds |
| **API Cost (Cloud)** | ~$0.005–0.03 per request |

### 4.3 Agent Behavior

- Full C.O.R.E. framework applied (Context, Options, Recommendation, Explanation).
- Output includes confidence score with breakdown (reasoning_quality, data_freshness, behavioral_fit, market_alignment).
- One to two alternative scenarios presented alongside primary recommendation.
- Tier 2 skills executed if connector data is available (e.g., Monte Carlo simulation for investment, avalanche/snowball comparison for debt, Roth conversion analysis for retirement).

### 4.4 Example

> **User:** "Should I rebalance my portfolio?"
>
> **Agent (Medium):** "Your tech allocation is at 38% vs. your 30% target. I recommend selling 8% of your NVDA position over 4 weeks to reduce concentration risk. Confidence: 82%.
>
> **Alternative:** If you'd prefer to keep NVDA, we could fund rebalancing by trimming your underweight bond allocation instead. This is slower but avoids a taxable event on your biggest winner.
>
> | Confidence Breakdown | Score |
> |---------------------|-------|
> | Reasoning Quality | 90 |
> | Data Freshness | 85 |
> | Behavioral Fit | 78 |
> | Market Alignment | 75 |
> | **Overall** | **82** |"

---

## 5. HIGH THINKING MODE

### 5.1 When to Use

- Complex, high-stakes decisions (major rebalance, debt consolidation, retirement withdrawal strategy)
- Multi-agent coordination scenarios (investment + retirement + debt interplay)
- Tax optimization across account types
- When the user wants to see the agent's full reasoning chain
- Research-intensive questions requiring web search synthesis
- Compare-all-models scenarios

### 5.2 What Happens

| Parameter | Setting |
|-----------|---------|
| **Model (Cloud)** | Claude Opus 4.7, GPT-5.5 (Think Max mode), DeepSeek-R1 (cloud) |
| **Model (Local)** | DeepSeek-R1-Distill 8B (CoT enabled), Qwen 3.6 35B (CoT prompt) |
| **Temperature** | 0.5 (allows creative scenario exploration) |
| **Max Output Tokens** | 8192 |
| **Chain-of-Thought** | Enabled and visible to user |
| **Context Injected** | Full user profile + all past decisions + complete agent memory + cross-agent insights |
| **Skill Tier** | Tier 1 → Tier 2 → Tier 3 → Tier 4 (full pipeline) |
| **Expected Latency** | 10–30 seconds |
| **API Cost (Cloud)** | ~$0.05–0.50 per request |

### 5.3 Agent Behavior

- Full chain-of-thought reasoning displayed: the agent shows its step-by-step analysis before reaching a conclusion.
- All four skill tiers executed:
  - **Tier 1:** Baseline portfolio summary, debt overview, retirement readiness.
  - **Tier 2:** Monte Carlo simulation, avalanche/snowball comparison, Roth ladder projection (if connector data available).
  - **Tier 3:** Multi-factor optimization, tax-loss harvesting analysis, sequence-of-returns risk modeling.
  - **Tier 4:** Cross-domain synthesis (e.g., "Should you pay down debt or invest the bonus?" pulls from both Debt and Investment agents).
- Cross-agent memory consulted: the agent reviews what other agents have recommended to this user to avoid conflicts.
- Multiple scenario comparison with full metric breakdown (Sharpe, max drawdown, tax impact, success probability).
- Web search integrated for real-time market conditions, tax law changes, or product comparisons.
- Output includes confidence decomposition, sensitivity analysis, and explicit assumptions list.

### 5.4 Model Selection for High Thinking

The system selects the best available model based on hardware and API key availability:

| Priority | Model | Requires | Best For |
|----------|-------|----------|----------|
| 1 | GPT-5.5 (Think Max) | OpenAI API key | Adaptive reasoning, massive context |
| 2 | Claude Opus 4.7 | Anthropic API key | Strongest coding/math reasoning |
| 3 | DeepSeek-R1 (cloud) | DeepSeek API key | Best value deep reasoning |
| 4 | DeepSeek-R1-Distill 8B | 24–32 GB VRAM | Local privacy, CoT reasoning |
| 5 | Qwen 3.6 35B (CoT prompt) | 12–16 GB VRAM | Local privacy, best practical |

Fallback: If no high-thinking model is available (no API keys, insufficient VRAM), the system downgrades to Medium mode with a warning: "High thinking unavailable. Running in Medium mode. To enable High thinking, add an API key or upgrade GPU."

### 5.5 Example

> **User:** "I'm 42, have $500k in my 401(k), $50k in credit card debt at 22% APR, and just got a $40k bonus. Should I pay off debt or invest?"
>
> **Agent (High):**
>
> ```
> [Chain of Thought — visible to user]
>
> Step 1: Assess debt urgency.
>   - $50k at 22% APR = $11,000/year in interest. This is an emergency-level rate.
>   - Minimum payments on $50k at 22%: ~$1,300/month, consuming significant cash flow.
>
> Step 2: Compare investment returns.
>   - S&P 500 historical real return: ~7% annualized.
>   - Risk-free rate (10Y Treasury): 4.2%.
>   - Guaranteed 22% return (paying off debt) vs. expected 7% (investing).
>   - Debt payoff wins by 15 percentage points, risk-free.
>
> Step 3: Tax consideration.
>   - Bonus is taxable. Assume $40k pre-tax → ~$28k post-tax (30% marginal rate).
>   - Paying off $28k of $50k debt leaves $22k remaining at 22%.
>   - Remaining $22k can be cleared in ~14 months with freed-up cash flow.
>
> Step 4: Retirement impact.
>   - Missing one year of 401(k) contributions (~$23k) delays retirement by ~6 months.
>   - BUT carrying 22% debt for 14+ months costs $5,600+ in interest.
>   - Net: paying debt first is mathematically superior.
>
> Step 5: Behavioral fit check.
>   - Past decisions show you've executed 4/4 debt payoff recommendations.
>   - You rejected aggressive investment strategies twice in the past 6 months.
>   - Your behavioral profile strongly favors debt elimination.
>
> CONCLUSION:
> ```
>
> **Recommendation:** Allocate 100% of the after-tax bonus ($28k) to the 22% APR credit card. Continue minimum 401(k) contributions to capture employer match. Once debt is cleared (est. 8 months with accelerated payments), max out 401(k) and fund IRA.
>
> **Confidence: 94%**
>
> | Scenario | Debt-Free In | Interest Saved | Retirement Impact |
> |----------|-------------|----------------|-------------------|
> | All to debt (recommended) | 8 months | $8,200 | -6 months delay |
> | 50/50 split | 18 months | $3,900 | -2 months delay |
> | All to 401(k) | 36+ months | -$16,500 | +3 months early |
>
> **Sensitivity:** If the market returns >18% annually, the 50/50 split becomes competitive. Historical probability of this: <5%.
>
> **Assumptions:** 30% marginal tax rate, 7% equity returns, no change in spending, employer matches 50% up to 6%.

---

## 6. TRAINING MODE

### 6.1 When to Use

- After accumulating 50+ decision-labeled chat histories with a given agent
- When you want the agent's recommendations to better match your personal preferences and past decisions
- To validate whether fine-tuning actually improves recommendation quality (via backtesting)
- To compare agent performance across different base models

### 6.2 What Happens

Training Mode is a multi-phase pipeline, not a real-time mode. It runs as an offline process:

| Phase | Description | Duration |
|-------|-------------|----------|
| **1. Data Readiness** | Assesses if enough decision-labeled chats exist (≥50 minimum, 100+ recommended) | <10 seconds |
| **2. Dataset Construction** | Transforms chat histories into Alpaca-format JSONL prompt→completion pairs | ~5 seconds |
| **3. LoRA Fine-Tuning** | Trains a lightweight adapter on local GPU to match user preferences | 12–30 minutes |
| **4. Backtesting** | Simulates base vs fine-tuned model on historical market data | 2–5 minutes |
| **5. Cross-Model Comparison** | Compares all available models side-by-side | 2–5 minutes |
| **6. Memory Write-Back** | Persists adapter + results to Memory System for agent to use | <5 seconds |

### 6.3 Full Documentation

Training Mode is fully specified in:
`docs/Features/Backtesting/Training_mode_and_backtesting.md`

Key sections:
- **Phase 1:** Data readiness dashboard with category coverage, outcome balance, and training time estimates
- **Phase 2:** PII-stripped dataset construction with stratified train/val split
- **Phase 3:** LoRA fine-tuning with live loss curve, early stopping, and overfitting guardrails
- **Phase 4:** Backtesting with 7 benchmark metrics, look-ahead bias prevention, and statistical significance testing
- **Phase 5:** Cross-model comparison matrix (local + cloud baselines)
- **Phase 6:** Memory System write-back so the agent loads the fine-tuned adapter on next conversation

### 6.4 Post-Training Agent Behavior

After training completes and the adapter is set as active:

```
[SYSTEM] You are the Investment Agent. You are running on Llama 3.1 8B 
with a fine-tuned LoRA adapter (run #7, trained July 8, 2026 on 65 user 
decisions, val loss: 1.42). Your recommendations now incorporate patterns 
learned from this user's decision history. Backtesting shows +0.26 Sharpe 
improvement over base model on 6-month simulation.
```

The agent's User Context File is also updated:

```json
{
  "agent_insights": {
    "investment_agent_notes": "User values diversification, dislikes concentration risk. Fine-tuned adapter active (v3, trained on 87 decisions). Backtesting: +0.26 Sharpe, -2.5% max drawdown improvement."
  }
}
```

---

## 7. MODE COMPARISON MATRIX

| Dimension | Low Thinking | Medium Thinking | High Thinking | Training Mode |
|-----------|-------------|-----------------|---------------|---------------|
| **Purpose** | Fast answers | Standard recommendations | Deep analysis | Personalization |
| **Model Tier** | Budget / Small | Standard / Mid | Premium / Reasoning | Fine-tuned local |
| **CoT Reasoning** | ❌ | Internal only | ✅ Visible | N/A (offline) |
| **Skill Tiers** | Tier 1 only | Tier 1 + 2 | Tier 1–4 | N/A (offline) |
| **Context** | Minimal | Full profile | Full + cross-agent | N/A (offline) |
| **Latency** | 1–3s | 3–8s | 10–30s | 15–40 min |
| **Cloud API Cost** | ~$0.001 | ~$0.01 | ~$0.10–0.50 | $0 (local only) |
| **Token Budget** | 512 output | 2048 output | 8192 output | N/A |
| **Temperature** | 0.1 | 0.3 | 0.5 | N/A |
| **Alternatives** | ❌ | 1–2 | Multiple + sensitivity | A/B comparison |
| **Web Search** | ❌ | ❌ | ✅ | N/A |
| **Offline Capable** | ✅ (local model) | ✅ (Qwen 3.6) | ⚠️ (DeepSeek-R1 local) | ✅ (local GPU) |

---

## 8. TOGGLING MODES

### 8.1 UI Entry Points

Modes can be toggled from three places:
1. **Agent header bar** — dropdown next to agent name (persists per-agent)
2. **Settings → Agent Preferences** — global default mode + per-agent overrides
3. **During a conversation** — mode toggle mid-session; the next message uses the new mode

### 8.2 Mode Transition Behavior

When toggling modes mid-conversation:
- **Upgrading** (Low → Medium, Medium → High): The agent re-processes the current context with deeper reasoning. Previous messages in the conversation retain their original mode.
- **Downgrading** (High → Medium, Medium → Low): The agent continues with the new mode. No re-processing of history.
- **Training Mode**: Cannot be toggled mid-conversation. Training mode is an offline pipeline accessed via a dedicated tab ("Training" in the agent context view).

### 8.3 API Representation

```python
# POST /api/agent/{agent_type}/mode
{
  "mode": "high_thinking",       # "low_thinking" | "medium_thinking" | "high_thinking"
  "model_override": null,         # Optional: force a specific model ID
  "show_cot": true                # Only applies to high_thinking
}
```

---

## 9. REFERENCES

| Document | Relevance |
|----------|-----------|
| `docs/Skills_Connectors_Models/LLM_Models_Provided` | All available models with tier, speed, and reasoning quality |
| `docs/SystemPrompts/06_System_architecture_agent_orchestration_flow.md` | Full request/response orchestration |
| `docs/Features/Backtesting/Training_mode_and_backtesting.md` | Complete training mode specification (6 phases) |
| `docs/SystemPrompts/04_User_context_file_schema.md` | User context shape including `agent_preferences` |
| `docs/Skills_Connectors_Models/Skills/` | Skill catalogs per agent (Tiers 1–4) |

---

**Document Version:** 1.0
**Status:** Complete Specification