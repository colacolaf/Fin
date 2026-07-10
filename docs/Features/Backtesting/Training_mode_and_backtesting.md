# Training Mode & Backtesting
## Fine-Tune Agent LLMs on Historical Decisions, Backtest Strategies, and Compare Agent Performance

**Version:** 1.0  
**Status:** Specification (Ready for Planning)  
**Last Updated:** July 8, 2026  
**Depends On:** `docs/Skills_Connectors_Models/LLM_Models_Provided`, `docs/SystemPrompts/06_System_architecture_agent_orchestration_flow.md`, `docs/SystemPrompts/04_User_context_file_schema.md`, `docs/Skills_Connectors_Models/Connectors_specification`, `docs/Memory_system/Memory_system`

---

## 1. OVERVIEW

Training Mode gives users the ability to fine-tune their agent LLMs (Investment, Debt, Retirement) on their own historical decisions stored in the Memory System, then run backtesting simulations against historical market data sourced via Finnhub to validate whether the fine-tuned model actually improves recommendation quality. The mode also supports A/B comparison of agent performance across different base models and thinking depths from the model lineup.

### 1.1 Core Philosophy

- **Data stays local.** Fine-tuning data (past decisions, user context, chat histories) never leaves the user's machine. The Memory System already stores this data locally; Training Mode extends that with a local fine-tuning pipeline.
- **Practical improvement, not academic perfection.** The user fine-tunes small models (LoRA adapters on 7B–13B parameter models from the local lineup) on a modest amount of their own decision data — just enough to measurably improve recommendation acceptance rates, not to build a perfect oracle.
- **Measurable results.** Every training run produces a before/after comparison graph showing whether the agent actually improved. Backtesting provides hard numbers, not vibes.
- **Agent memory integration (CRITICAL).** After fine-tuning completes, the resulting LoRA adapter weights and training metadata are persisted into the Memory System so the agent can actually load and use the fine-tuned adapter during subsequent conversations. Without this step, training is dead computation.

### 1.2 Who This Is For

Users who have accumulated enough chat history (≥50 categorized conversations per agent) that the Memory System's graph shows meaningful decision patterns. Training Mode is not for brand-new users — it requires training data to exist.

---

## 2. ARCHITECTURE

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRAINING MODE PIPELINE                        │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  Memory System    │───▶│  Dataset Builder  │───▶│ LoRA Trainer  │  │
│  │  (per-agent)      │    │  (prompt→completion│    │  (local GPU)  │  │
│  │                   │    │   pairs from chats)│    │               │  │
│  │  • Chat histories │    └──────────────────┘    └───────┬───────┘  │
│  │  • User decisions │                                    │          │
│  │  • Outcomes       │                             ┌──────▼───────┐  │
│  │  • Behavioral data│                             │ LoRA Adapter │  │
│  └──────────────────┘                             │  (.safetensors)│  │
│                                                    └──────┬───────┘  │
│                                                           │          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────▼───────┐  │
│  │ Finnhub           │───▶│ Backtesting       │◀───│ Fine-tuned   │  │
│  │ Historical Data   │    │ Engine            │    │ Model        │  │
│  │ (candles, OHLCV)  │    │                   │    │ + Base Model │  │
│  └──────────────────┘    │ • Strategy runner │    └──────────────┘  │
│                           │ • Metric computer │                     │
│  ┌──────────────────┐    │ • Comparison graph│                     │
│  │ Model Lineup      │───▶│                   │                     │
│  │ (cloud + local)   │    └────────┬──────────┘                     │
│  └──────────────────┘             │                                 │
│                                    ▼                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   MEMORY SYSTEM WRITE-BACK                    │  │
│  │                                                               │  │
│  │  agent_training_runs table:                                   │  │
│  │  • training_run_id, agent_type, base_model_id                 │  │
│  │  • lora_adapter_path (filesystem ref to .safetensors)         │  │
│  │  • training_date, num_epochs, dataset_size                    │  │
│  │  • metrics_json: {loss, perplexity, acceptance_rate_delta}    │  │
│  │  • backtesting_results_json: {sharpe, drawdown, cagr, ...}    │  │
│  │  • is_active: boolean (which adapter the agent loads)          │  │
│  │                                                               │  │
│  │  Agent loads active LoRA at conversation start:               │  │
│  │  Ollama model load → apply LoRA adapter → inject context      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Points

| Component | How Training Mode Connects |
|-----------|---------------------------|
| **Memory System** (`docs/Memory_system/Memory_system`) | Reads `agent_chats` table for training data. Writes `agent_training_runs` table for fine-tuned adapter metadata and backtesting results. |
| **User Context File** (`docs/SystemPrompts/04_User_context_file_schema.md`) | `past_decisions`, `behavioral_patterns`, and `agent_insights` fields become training labels. Each accepted/rejected recommendation is a supervised example. |
| **Agent Orchestration** (`docs/SystemPrompts/06_System_architecture_agent_orchestration_flow.md`) | After training, the agent orchestration layer loads the active LoRA adapter when initializing an agent session. The Ollama model loader applies the adapter before the system prompt is injected. |
| **Finnhub Connector** (`docs/Skills_Connectors_Models/Connectors_specification`) | Historical OHLCV data via Finnhub's `/stock/candle` endpoint with `resolution=D` and date range parameters. Free-tier limit: 1 year of daily candles per symbol. |
| **Model Lineup** (`docs/Skills_Connectors_Models/LLM_Models_Provided`) | Local models (Llama 3.1 8B, Mistral 7B, Qwen 2.5 7B, DeepSeek-R1-Distill 8B) support LoRA fine-tuning. Cloud models (Claude, GPT-4o) are comparison baselines only (not fine-tunable locally). |

### 2.3 Data Locality Guarantees (OWASP Security)

Per the OWASP security review:

- **Fine-tuning data never leaves the device.** The Dataset Builder extracts prompt→completion pairs from the local SQLite/PostgreSQL Memory System database. No data is uploaded to any cloud service.
- **LoRA training runs on local GPU only.** The training pipeline uses `unsloth` or `llama.cpp` with local CUDA/Metal acceleration. No cloud GPU API calls.
- **Backtesting uses Finnhub API but with anonymized requests.** Only ticker symbols and date ranges are sent — no user financial data, no portfolio values, no personal identifiers. Finnhub sees "give me AAPL daily candles from 2023-01 to 2024-01" not "this user has $50k in AAPL."
- **LoRA adapter files (.safetensors) are stored encrypted at rest** (AES-256-GCM) alongside the Memory System database. The encryption key is derived from the user's local machine credentials (macOS Keychain).
- **Training results stored in Memory System** under the same isolation guarantees as other agent data (per-user row-level access, multi-tenant safe).

---

## 3. PHASES OF TRAINING MODE

### Phase 1: Data Readiness Assessment

**Goal:** Determine if the user has enough training data to produce meaningful improvement.

**Inputs:**
- `agent_chats` table rows for the selected agent, filtered by `execution_outcome IN ('executed', 'rejected')`
- Minimum threshold: 50 categorized chats with known outcomes
- Recommended threshold: 100+ chats with outcomes spanning ≥3 months

**What the system checks:**
1. Total count of decision-labeled chats (accepted + rejected + executed).
2. Category coverage — does the user have decisions across multiple categories (Portfolio, Risk, Taxes, etc.) or only one narrow topic?
3. Temporal spread — are decisions spread over time (avoiding overfitting to a single market regime)?
4. Outcome balance — ideally ≥30% rejected decisions (so the model learns what NOT to recommend).

**Output:** A readiness dashboard:

```
┌─────────────────────────────────────────────────────────┐
│  TRAINING READINESS: Investment Agent                    │
│                                                          │
│  Total decision-labeled chats:  87 ✅                   │
│  Categories covered:             5/7  ⚠️ (missing: Fees, │
│                                          Market Research) │
│  Date range:                     Mar 28 – Jul 7, 2026 ✅ │
│  Accepted:                       62 (71%)                │
│  Rejected:                       18 (21%)                │
│  Executed:                       43 (49% of accepted)    │
│                                                          │
│  Verdict: READY TO TRAIN ✅                              │
│  Estimated dataset size: ~65 prompt→completion pairs     │
│  Recommended epochs: 3                                   │
│  Estimated training time (M2 Max): ~12 minutes            │
│                                                          │
│  [Start Training]  [Cancel]                              │
└─────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Dashboard shows all readiness metrics
- [ ] System blocks training if <50 decision-labeled chats
- [ ] Warning shown if category coverage <60% or rejection rate <15%
- [ ] Estimated training time displayed based on detected GPU

---

### Phase 2: Dataset Construction

**Goal:** Transform raw Memory System chat histories into a supervised fine-tuning dataset of prompt→completion pairs.

**Dataset Format (Alpaca-style JSONL):**

```jsonl
{"instruction": "Given the user's context and past behavior, recommend an investment action.", "input": "User Context: age=42, risk_tolerance=balanced, portfolio=$500k...\nRecent decisions: rejected aggressive rebalancing, accepted tax-loss harvesting.\nCurrent query: User is asking about tech sector concentration.", "output": "Based on your preference for measured moves (you rejected aggressive rebalancing on June 3 and accepted tax-loss harvesting on June 20), I recommend reducing tech from 35% to 28% — a 7% shift executed over 4 weeks. This is more conservative than my typical 10% recommendation because you've signaled a preference for smaller adjustments. Confidence: 78%."}
{"instruction": "Given the user's context and past behavior, recommend a debt payoff strategy.", "input": "User Context: age=42, debt=$50k across 2 credit cards and 1 student loan...\nRecent decisions: executed accelerated CC payments, rejected consolidation offer.\nCurrent query: User asks whether to use bonus for debt or investment.", "output": "Given you've been aggressively paying down your 22% APR card (executed plan on May 12) and rejected the consolidation loan (Apr 8 — you cited preference for flexibility), I recommend allocating 70% of your $8k bonus to the high-interest card and 30% to your IRA to capture the employer match. Confidence: 85%."}
```

**Construction Rules:**
1. **Only use chats with known outcomes** (`executed`, `rejected`). Pending chats provide no label signal.
2. **System prompt + user context → input.** The agent's system prompt (from `docs/SystemPrompts/`) and the user context file at the time of the chat become the `input` field.
3. **Agent response → output.** The agent's recommendation becomes the `output` field. For rejected recommendations, the output is still included (the model learns "this is what the agent said; the user rejected it" through a separate rejection label in metadata).
4. **Augment with outcome metadata.** Each example carries a `label: "accepted"` or `label: "rejected"` and `executed: true/false` in its metadata. During training, accepted examples get full weight; rejected examples get 0.5× weight (the model should still see them but prioritize accepted patterns).
5. **Strip sensitive PII.** Account numbers, full names, and exact dollar amounts are tokenized as `<ACCT>`, `<NAME>`, `<AMOUNT>` placeholders before training.

**Train/Validation Split:** 80% train, 20% validation. Split is stratified by outcome (preserves accept/reject ratio in both sets).

**Acceptance Criteria:**
- [ ] Dataset output is valid JSONL parseable by standard training frameworks
- [ ] Each example has `instruction`, `input`, `output`, and metadata `label` fields
- [ ] Dataset size correctly reported to user
- [ ] PII stripping verified (no raw account numbers in output)
- [ ] Train/val split respects temporal ordering (no future data leaking into training)

---

### Phase 3: LoRA Fine-Tuning (Local)

**Goal:** Train a lightweight LoRA adapter on the user's decision dataset, producing a `.safetensors` file that modifies the base model's behavior to better match the user's preferences.

**Infrastructure Decision:**
- **Method:** LoRA (Low-Rank Adaptation) — produces small adapter files (~15–80MB) that can be loaded/unloaded without modifying the base model.
- **Hardware:** Local GPU only (Apple Silicon M2/M3/M4 via MLX, or NVIDIA via CUDA). No cloud GPU.
- **Base Models:** Any local model from the lineup that supports LoRA fine-tuning via `unsloth` or `mlx-lm`:
  - Llama 3.1 8B (recommended default)
  - Mistral 7B
  - Qwen 2.5 7B
  - DeepSeek-R1-Distill-Llama 8B

**Training Parameters (Defaults, User-Adjustable):**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| LoRA Rank (r) | 16 | 8–64 | Higher = more capacity but larger file |
| LoRA Alpha | 32 | 16–64 | Scaling factor |
| Learning Rate | 2e-4 | 1e-5–5e-4 | Step size |
| Epochs | 3 | 1–10 | Passes over dataset |
| Batch Size | 4 | 1–8 | GPU-memory dependent |
| Max Sequence Length | 2048 | 512–4096 | Truncation point |
| Target Modules | q_proj, v_proj | — | Which attention layers to adapt |

**Training Pipeline (using mlx-lm on Apple Silicon):**

```bash
# Step 1: Convert dataset to MLX format
mlx_lm.convert --dataset training_data.jsonl --format chat

# Step 2: LoRA fine-tune
mlx_lm.lora \
  --model mlx-community/Llama-3.1-8B-Instruct-4bit \
  --data ./training_data \
  --train \
  --iters 200 \
  --lora-layers 16 \
  --adapter-path ./adapters/investment_agent_v1

# Step 3: Fuse adapter (optional, for inference speed)
mlx_lm.fuse \
  --model mlx-community/Llama-3.1-8B-Instruct-4bit \
  --adapter-path ./adapters/investment_agent_v1 \
  --save-path ./models/investment_agent_finetuned
```

**Training Dashboard (during run):**

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ TRAINING IN PROGRESS: Investment Agent                    │
│                                                               │
│  Base Model: Llama 3.1 8B (4-bit quantized)                  │
│  LoRA Rank: 16 | Alpha: 32 | LR: 2e-4                        │
│  Dataset: 65 examples (52 train / 13 val)                    │
│                                                               │
│  Epoch 2/3 — Step 87/130                                     │
│  ████████████████░░░░░░░░░░░░  67%                           │
│                                                               │
│  Train Loss:     1.42 ↘ (from 1.89)                          │
│  Val Loss:       1.61 ↘ (from 1.95)                          │
│  Perplexity:     5.01 ↘                                       │
│  GPU Memory:     14.2 GB / 24 GB                             │
│  Est. Remaining: 4 min 12 sec                                 │
│                                                               │
│  [Pause]  [Stop]  [View Loss Curve]                           │
└──────────────────────────────────────────────────────────────┘
```

**Overfitting Guardrails:**
- Training auto-stops if validation loss increases for 3 consecutive evaluations (early stopping, patience=3).
- Minimum delta: val loss must improve by ≥0.01 to count as improvement.
- If train/val loss diverges (overfitting detected), system warns user and suggests reducing epochs.

**Acceptance Criteria:**
- [ ] LoRA adapter file (.safetensors) produced and validated (loadable by Ollama)
- [ ] Training metrics logged: final train loss, val loss, perplexity
- [ ] Early stopping triggered correctly when val loss plateaus
- [ ] Adapter file size within expected range (15–80 MB for rank 16)
- [ ] Training runs entirely on local GPU (no network calls except initial model download)

---

### Phase 4: Backtesting Simulation

**Goal:** Run the fine-tuned agent against historical market data to quantify whether its recommendations would have produced better outcomes than the base (untrained) model.

**Backtesting Engine Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                    BACKTESTING ENGINE                          │
│                                                               │
│  Step 1: Date Range Selection                                 │
│  User picks: [Start Date] → [End Date]                        │
│  Presets: 6mo | 1yr | 3yr | Custom                            │
│  Regime presets: 2022 Bear | 2020 COVID | 2008 GFC            │
│                                                               │
│  Step 2: Agent Simulation                                     │
│  For each month in range:                                     │
│    ├── Load user context AS OF that date (historical snapshot)│
│    ├── Run BASE model → get recommendation                    │
│    ├── Run FINE-TUNED model → get recommendation              │
│    ├── Simulate following each recommendation forward 1 month │
│    ├── Record outcome (portfolio delta, fees, taxes, etc.)    │
│    └── Advance to next month                                  │
│                                                               │
│  Step 3: Metric Computation                                   │
│  Compare BASE vs FINE-TUNED across all months                 │
│                                                               │
│  Step 4: Results Visualization                                │
│  Before/After comparison charts + statistical significance    │
└──────────────────────────────────────────────────────────────┘
```

**Backtesting Timeframes (Per User Preference — Practical, Not Exhaustive):**

| Preset | Duration | Finnhub Cost | Use Case |
|--------|----------|-------------|----------|
| 6 months | Recent only | 6 × ~21 trading days × N symbols | Quick check, minimal API usage |
| 1 year | Standard | 1 year of daily candles | Default — enough history to see seasonal patterns |
| 3 years | Extended | Higher API cost | Captures different market regimes |
| Custom | User-defined | Variable | Specific date ranges |

Market regime presets available for each timeframe:
- **2022 Bear Market** (Jan–Dec 2022) — tests defensive positioning
- **2020 COVID Crash** (Feb–Apr 2020) — tests crisis response
- **2008 Financial Crisis** (Sep 2008–Mar 2009) — tests systemic risk handling
- **2023–2024 Bull Run** — tests growth-capture ability

**Historical Context Injection:**
When running backtesting, the agent receives a historically-accurate user context file for each timestep. The system reconstructs what the user's financial picture looked like at that date from:
- `user_context` table change history (if versioned)
- `agent_chats` timestamps to infer portfolio/debt state at each point
- Finnhub historical prices to mark portfolio holdings to market

**Simulation Guardrails (Per Best Practice Research):**

| Guardrail | Implementation |
|-----------|---------------|
| **Look-ahead bias prevention** | Agent only sees data available on or before the simulation date. No future prices, no future news, no future decisions. Finnhub queries use `to={simulation_date}` strictly. |
| **Transaction cost modeling** | Every simulated trade incurs: $0 commission (modern broker standard) + 0.01% SEC fee + estimated slippage of 0.05% (equities) or 0.02% (ETFs). Configurable. |
| **Liquidity constraints** | No single trade exceeds 10% of the symbol's 20-day average daily volume. If a recommendation would violate this, it's sized down to the constraint with a warning in results. |
| **Survivorship bias correction** | Backtesting engine maintains a symbol universe as of each simulation date (not today's survivors). Delisted symbols that existed during the backtest period are included. Finnhub provides delisted security data via `status=delisted` query parameter. |
| **Dividend reinvestment** | Toggle ON by default. Dividends are reinvested at the ex-dividend date closing price, with no additional transaction cost. |
| **Inflation adjustment** | All dollar values in results are shown in both nominal and real (CPI-adjusted) terms. Toggle ON by default. |
| **Maximum position size** | No single position exceeds 30% of simulated portfolio. Agent recommendations exceeding this are capped. |
| **Minimum cash buffer** | Portfolio always maintains ≥2% cash for fees/expenses. |

**Benchmark Metrics (Per Best-Practice Recommendation for Multi-Asset Agent Evaluation):**

| Metric | Category | Description |
|--------|----------|-------------|
| **Sharpe Ratio** | Risk-adjusted return | (Portfolio return − risk-free rate) / portfolio volatility. Primary headline metric. Annualized. |
| **Maximum Drawdown** | Downside risk | Largest peak-to-trough decline during the period, as a percentage. Critical for the conservative user's preference. |
| **CAGR** | Absolute return | Compound Annual Growth Rate. Simple, intuitive. |
| **Sortino Ratio** | Downside-adjusted return | Like Sharpe but only penalizes downside volatility. Better for asymmetric return profiles. |
| **Win/Loss Ratio** | Decision quality | Number of profitable monthly recommendations / unprofitable ones. Measures consistency of agent decisions. |
| **Avg Recommendation Acceptance Rate** | Behavioral fit | % of agent recommendations that the simulated user (based on past behavior) would accept. Measures how well the fine-tuned model's tone matches user preferences. |
| **Tax Efficiency** | After-tax return | CAGR after accounting for short-term vs long-term capital gains tax rates. Important for taxable accounts. |
| **Debt Reduction Efficiency** (Debt Agent only) | Payoff speed | Weighted average interest rate reduction per month of simulated paydown. |
| **Retirement Readiness Delta** (Retirement Agent only) | Goal tracking | Change in projected retirement readiness score over backtest period. |

**Comparison Output (Before/After Graph):**

```
┌──────────────────────────────────────────────────────────────┐
│  BACKTEST RESULTS: Llama 3.1 8B Base vs Fine-Tuned            │
│  Period: Jan 1 – Jun 30, 2026 (6 months)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Portfolio Value Over Time (Starting $100,000)        │    │
│  │                                                       │    │
│  │  $108k ┤                    ╭─ Fine-Tuned             │    │
│  │  $106k ┤              ╭────╯                          │    │
│  │  $104k ┤        ╭────╯                                │    │
│  │  $102k ┤   ╭───╯   ╭── Base Model                    │    │
│  │  $100k ┤──╯    ╭──╯                                   │    │
│  │         Jan   Feb   Mar   Apr   May   Jun              │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────┬────────────┬────────────┬───────────┐  │
│  │ Metric           │ Base Model │ Fine-Tuned │ Delta     │  │
│  ├──────────────────┼────────────┼────────────┼───────────┤  │
│  │ Sharpe Ratio     │ 1.12       │ 1.38       │ +0.26 ▲  │  │
│  │ Max Drawdown     │ -8.2%      │ -5.7%      │ +2.5% ▲ │  │
│  │ CAGR             │ 10.4%      │ 12.9%      │ +2.5% ▲  │  │
│  │ Sortino Ratio    │ 1.45       │ 1.82       │ +0.37 ▲  │  │
│  │ Win/Loss Ratio   │ 1.8        │ 2.3        │ +0.5 ▲  │  │
│  │ Acceptance Rate  │ 58%        │ 71%        │ +13% ▲  │  │
│  │ Tax Efficiency   │ 8.2%       │ 10.1%      │ +1.9% ▲  │  │
│  └──────────────────┴────────────┴────────────┴───────────┘  │
│                                                               │
│  Verdict: FINE-TUNED MODEL OUTPERFORMS ✅                     │
│  Statistical significance: p < 0.05 (bootstrap test)          │
│                                                               │
│  [Save Adapter as Active]  [Discard]  [Export Report PDF]     │
└──────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Backtesting runs both base and fine-tuned models on identical historical data
- [ ] No look-ahead bias (verified by comparing agent-visible data to historical dates)
- [ ] All 7 core metrics computed and displayed
- [ ] Before/after comparison graph renders correctly
- [ ] Transaction costs properly deducted from simulated returns
- [ ] Dividend reinvestment and inflation adjustment toggles functional
- [ ] Statistical significance test included (bootstrap with n=1000, p<0.05 threshold)

---

### Phase 5: Cross-Model & Thinking Depth Comparison

**Goal:** Compare agent performance not just before/after fine-tuning, but also across different base models and thinking depth settings from the model lineup.

**Model Lineup for Comparison (from `docs/Skills_Connectors_Models/LLM_Models_Provided`):**

| Model ID | Type | Thinking Depth | Fine-Tunable |
|----------|------|---------------|--------------|
| Llama 3.1 8B | Local | Standard | ✅ Yes (MLX/unsloth) |
| Mistral 7B | Local | Standard | ✅ Yes |
| Qwen 2.5 7B | Local | Standard | ✅ Yes |
| DeepSeek-R1-Distill 8B | Local | Deep (CoT) | ✅ Yes |
| Phi-4 14B | Local | Standard | ✅ Yes |
| Claude 3.5 Sonnet | Cloud | Standard | ❌ Baseline only |
| GPT-4o | Cloud | Standard | ❌ Baseline only |
| DeepSeek-R1 (cloud) | Cloud | Deep (CoT) | ❌ Baseline only |

**Comparison Matrix UI:**

```
┌──────────────────────────────────────────────────────────────────┐
│  MODEL COMPARISON: Investment Agent                              │
│  Period: Jan 1 – Jun 30, 2026 | Starting Value: $100,000         │
│                                                                   │
│  ┌────────────────────────────┬─────────┬──────────┬───────────┐ │
│  │ Model (Variant)            │ Sharpe  │ Max DD   │ CAGR      │ │
│  ├────────────────────────────┼─────────┼──────────┼───────────┤ │
│  │ Llama 3.1 8B (Base)       │ 1.12    │ -8.2%    │ 10.4%     │ │
│  │ Llama 3.1 8B (Fine-Tuned) │ 1.38    │ -5.7%    │ 12.9%  🏆 │ │
│  │ Mistral 7B (Base)          │ 0.98    │ -9.1%    │ 8.7%      │ │
│  │ Mistral 7B (Fine-Tuned)    │ 1.21    │ -6.8%    │ 11.2%     │ │
│  │ DeepSeek-R1 8B (Deep CoT)  │ 1.45    │ -5.2%    │ 13.5%  🏆 │ │
│  │ GPT-4o (Cloud Baseline)    │ 1.31    │ -6.1%    │ 11.8%     │ │
│  │ Claude 3.5 Sonnet (Cloud)  │ 1.28    │ -6.5%    │ 11.5%     │ │
│  └────────────────────────────┴─────────┴──────────┴───────────┘ │
│                                                                   │
│  Thinking Depth Comparison:                                       │
│  ┌──────────────────────┬─────────┬──────────┬──────────┐        │
│  │ DeepSeek-R1 (CoT)    │ 1.45    │ -5.2%    │ 13.5%    │        │
│  │ DeepSeek-R1 (No CoT) │ 1.02    │ -8.9%    │ 9.1%     │        │
│  │ → CoT adds +0.43 Sharpe in this scenario              │        │
│  └──────────────────────┴─────────┴──────────┴──────────┘        │
│                                                                   │
│  [Set Llama 3.1 8B Fine-Tuned as Active]  [Export Full Report]    │
└──────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] At least 3 local models + 2 cloud baselines compared side-by-side
- [ ] Thinking depth toggle comparison shown for DeepSeek-R1 (CoT vs no CoT)
- [ ] Best-performing model clearly highlighted
- [ ] User can set any fine-tuned model variant as the active agent

---

### Phase 6: Memory System Write-Back (CRITICAL)

**Goal:** Persist the training run results and LoRA adapter into the Memory System so the agent actually uses it.

If this phase is skipped, training is dead computation — the agent has no way to load the fine-tuned weights.

**New Database Tables (extends `docs/Memory_system/Memory_system` schema):**

```sql
-- Training runs: one row per training session
CREATE TABLE agent_training_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type ENUM('investment', 'debt', 'retirement') NOT NULL,
  base_model_id TEXT NOT NULL,              -- e.g., 'llama-3.1-8b'
  lora_adapter_path TEXT NOT NULL,           -- filesystem path to .safetensors
  lora_adapter_hash TEXT NOT NULL,           -- SHA-256 of adapter file (integrity)
  dataset_size INTEGER NOT NULL,             -- number of training examples
  num_epochs INTEGER NOT NULL,
  lora_rank INTEGER NOT NULL,
  training_params_json JSONB NOT NULL,       -- full hyperparameter snapshot
  training_metrics_json JSONB NOT NULL,       -- {train_loss, val_loss, perplexity}
  backtesting_results_json JSONB,            -- {sharpe, max_dd, cagr, ...} per model
  comparison_matrix_json JSONB,             -- all-model comparison data
  is_active BOOLEAN DEFAULT FALSE,          -- TRUE = agent loads this adapter
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for quick lookup of active adapter
CREATE INDEX idx_active_adapter 
  ON agent_training_runs(user_id, agent_type, is_active) 
  WHERE is_active = TRUE;
```

**Write-Back Flow:**

```
Training Completes
    │
    ├── 1. Save LoRA adapter to disk
    │      Path: ~/.fin/adapters/{user_id}/{agent_type}/{run_id}/adapter.safetensors
    │
    ├── 2. Compute SHA-256 hash of adapter file
    │
    ├── 3. INSERT into agent_training_runs
    │      (all training metrics + backtesting results)
    │
    ├── 4. If user clicks [Save Adapter as Active]:
    │      BEGIN TRANSACTION
    │        UPDATE agent_training_runs SET is_active = FALSE
    │          WHERE user_id = X AND agent_type = Y;
    │        UPDATE agent_training_runs SET is_active = TRUE
    │          WHERE id = Z;
    │      COMMIT
    │
    └── 5. Agent orchestration layer reads is_active adapter on next conversation:
           SELECT lora_adapter_path, base_model_id
           FROM agent_training_runs
           WHERE user_id = X AND agent_type = Y AND is_active = TRUE;
           
           → Loads base model in Ollama
           → Applies LoRA adapter
           → Injects system prompt + user context
           → Conversation begins with fine-tuned behavior
```

**What the Agent Sees (Memory System Integration):**

When the fine-tuned agent starts a conversation, its memory preamble includes:

```
[SYSTEM] You are the Investment Agent. You are running on Llama 3.1 8B 
with a fine-tuned LoRA adapter (run #7, trained July 8, 2026 on 65 user 
decisions, val loss: 1.42). Your recommendations now incorporate patterns 
learned from this user's decision history. Backtesting shows +0.26 Sharpe 
improvement over base model on 6-month simulation.
```

**User Context File Update (Agent Insights):**

After training, the `agent_insights` field in the User Context File is updated:

```json
{
  "agent_insights": {
    "investment_agent_notes": "User values diversification, dislikes concentration risk. Fine-tuned adapter active (v3, trained on 87 decisions). Backtesting: +0.26 Sharpe, -2.5% max drawdown improvement.",
    "debt_agent_notes": "...",
    "retirement_agent_notes": "..."
  }
}
```

**Multiple Adapter Management:**

Users can accumulate multiple training runs over time. The Memory System supports:
- **Version history:** All past training runs are preserved (not overwritten).
- **A/B comparison:** User can compare Run #3 vs Run #7 backtesting results side-by-side.
- **Rollback:** User can set any historical adapter as active.
- **Delete:** User can delete old adapters to free disk space.
- **Adapter stacking (future):** Potential to merge multiple LoRA adapters (e.g., Investment + general finance knowledge) — Phase 2.

**Acceptance Criteria:**
- [ ] `agent_training_runs` table created with all columns
- [ ] LoRA adapter file persisted to disk with correct path convention
- [ ] SHA-256 integrity hash stored and verifiable on load
- [ ] `is_active` flag correctly toggles (only one active per user/agent pair)
- [ ] Agent orchestration layer loads active adapter at conversation start
- [ ] Agent preamble includes training metadata
- [ ] User Context File updated with training insights
- [ ] Adapter rollback and version history functional
- [ ] Adapter deletion cleans up both DB row and disk file

---

## 4. COMPLETE USER FLOW

```
USER JOURNEY: Training Mode End-to-End

1. User navigates to Agent Context View → clicks [Training Mode] tab
       │
2. System runs Phase 1: Data Readiness Assessment
       │
       ├── Insufficient data (<50 chats) → "Come back after 50+ decisions"
       │
       └── Sufficient data → Show readiness dashboard
              │
3. User clicks [Start Training]
       │
4. Phase 2: Dataset Builder runs (automated, ~5 seconds)
       │   Shows: "65 prompt→completion pairs constructed"
       │
5. Phase 3: LoRA Fine-Tuning runs (12-30 min on local GPU)
       │   Shows: live training dashboard with loss curve
       │
6. Training completes → Adapter saved to disk + DB
       │   Shows: "Training complete! Val loss: 1.42, Perplexity: 5.01"
       │
7. User prompted: "Run backtesting to validate improvement?"
       │
       ├── [Skip] → Save adapter, return to Phase 6 write-back
       │
       └── [Run Backtesting] → Phase 4
              │
8. User selects timeframe (6mo / 1yr / 3yr / custom)
       │
9. Backtesting Engine runs (~2-5 min, depends on timeframe)
       │   Simulates base model + fine-tuned model month-by-month
       │
10. Results displayed: Before/After comparison graph + metric table
       │
11. User clicks [Compare All Models] → Phase 5
       │   Side-by-side matrix: all local + cloud models
       │
12. User chooses best model → [Set as Active]
       │
13. Phase 6: Memory System Write-Back
       │   - is_active flag updated in agent_training_runs
       │   - Agent preamble updated
       │   - User Context File insight appended
       │
14. Next conversation: Agent loads fine-tuned adapter automatically
       │   "Investment Agent (Fine-Tuned v3 on Llama 3.1 8B)"
       │
15. User can revisit Training Mode anytime to:
       ├── View training history (all past runs)
       ├── Compare runs side-by-side
       ├── Rollback to earlier adapter
       ├── Train new adapter (on updated decision data)
       └── Delete old adapters
```

---

## 5. PHASE-BASED TASK BREAKDOWN (Planning & Task Breakdown Skill)

### Phase 1: Data Readiness
- [ ] Task 1.1: Implement `agent_chats` query filtered by `execution_outcome IN ('executed', 'rejected')` per agent type
- [ ] Task 1.2: Build readiness dashboard UI with count, category coverage, date range, outcome balance
- [ ] Task 1.3: Implement minimum threshold gate (block training if <50 chats)
- [ ] Task 1.4: GPU detection and training time estimator

### Phase 2: Dataset Construction
- [ ] Task 2.1: Implement prompt→completion pair extractor from `agent_chats` + historical context snapshots
- [ ] Task 2.2: PII stripping pipeline (regex + tokenizer-based)
- [ ] Task 2.3: Train/validation split with temporal ordering guarantee
- [ ] Task 2.4: Output JSONL conforming to Alpaca chat format with outcome labels

### Phase 3: LoRA Fine-Tuning
- [ ] Task 3.1: Integrate `mlx-lm` (Apple Silicon) or `unsloth` (NVIDIA) for LoRA training
- [ ] Task 3.2: Build training dashboard UI with live loss curve
- [ ] Task 3.3: Implement early stopping (patience=3) and overfitting detection
- [ ] Task 3.4: Save adapter to disk + compute SHA-256 hash for integrity

### Phase 4: Backtesting Simulation
- [ ] Task 4.1: Build historical context reconstructor (snapshot user state at past dates)
- [ ] Task 4.2: Implement monthly agent simulation loop (base + fine-tuned models)
- [ ] Task 4.3: Implement all 7 benchmark metrics (Sharpe, Max DD, CAGR, Sortino, Win/Loss, Acceptance Rate, Tax Efficiency)
- [ ] Task 4.4: Implement simulation guardrails (look-ahead prevention, transaction costs, liquidity, survivorship, dividends, inflation, position size, cash buffer)
- [ ] Task 4.5: Build before/after comparison graph + metric table UI
- [ ] Task 4.6: Add bootstrap statistical significance test (n=1000, p<0.05)
- [ ] Task 4.7: Market regime preset selector (2022 Bear, 2020 COVID, 2008 GFC, 2023–24 Bull)

### Phase 5: Cross-Model Comparison
- [ ] Task 5.1: Implement multi-model backtesting runner (local + cloud baselines)
- [ ] Task 5.2: Build comparison matrix UI with sortable columns
- [ ] Task 5.3: Implement thinking depth toggle comparison (CoT vs no CoT for DeepSeek-R1)

### Phase 6: Memory System Write-Back
- [ ] Task 6.1: Create `agent_training_runs` database table with migration
- [ ] Task 6.2: Implement write-back flow (save adapter, insert row, toggle is_active)
- [ ] Task 6.3: Update agent orchestration layer to load active LoRA adapter at session start
- [ ] Task 6.4: Update agent preamble with training metadata
- [ ] Task 6.5: Update User Context File `agent_insights` after training
- [ ] Task 6.6: Implement adapter management (version history, rollback, delete, A/B compare)

### Checkpoint: After Phase 3
- [ ] LoRA adapter loads successfully in Ollama
- [ ] Training metrics stored in DB

### Checkpoint: After Phase 6
- [ ] Agent uses fine-tuned adapter in live conversation
- [ ] User Context File reflects training
- [ ] Adapter rollback works

---

## 6. SECURITY REVIEW (OWASP Security Check)

### CRITICAL: Data Locality

| Rule | Finding | Mitigation |
|------|---------|------------|
| **Sensitive Data Exposure** | Training dataset contains user financial decisions, portfolio values, and personal context. Must never leave the device. | Dataset builder runs entirely locally. No cloud API calls during any training phase. PII stripping before any serialization to disk. |
| **Data Integrity Failures** | LoRA adapter file could be corrupted or tampered with, leading to degraded agent behavior. | SHA-256 hash computed at save time, verified at load time. Adapter path stored with hash in DB; mismatch aborts load. |
| **Secrets Management** | Finnhub API key used for historical data fetching during backtesting. | API key stored in macOS Keychain (per `docs/SystemPrompts/System_architecture`). Never written to disk in plaintext. Never included in training data or adapter files. |
| **Insecure Design** | Training mode could be a vector for exfiltrating user data if a malicious model is substituted. | Base model hashes verified against known-good manifests before training. Only models from the official lineup are selectable. Custom model import requires explicit user approval with hash verification. |
| **Logging & Monitoring** | Training loss/metrics logs could inadvertently contain PII if not careful. | Dataset builder strips PII before training. Logging only captures numeric metrics (loss, perplexity), model IDs, and timestamps. No chat content in logs. |

### HIGH: Access Control

| Rule | Finding | Mitigation |
|------|---------|------------|
| **Broken Access Control** | `agent_training_runs` table must be scoped per-user. No user should see another user's training data. | All queries include `WHERE user_id = authenticated_user_id`. Row-level security enforced at API layer. |
| **Session Security** | Training mode session could be hijacked to inject malicious training data. | Training mode requires re-authentication (password or biometric) before starting any training run. Session timeout: 30 min inactivity. |

### MEDIUM: Deployment

| Rule | Finding | Mitigation |
|------|---------|------------|
| **Security Misconfiguration** | Debug mode during training could expose dataset contents in console. | Training runs in production mode by default. Verbose logging requires explicit `--debug` flag with warning: "This will print your training data to console." |
| **Rate Limiting** | Backtesting could hammer Finnhub API, hitting rate limits or incurring costs. | Backtesting engine batches Finnhub requests: max 60 requests/minute (Finnhub free tier limit), with exponential backoff on 429 responses. Symbol data cached locally for 24 hours. |

---

## 7. METRICS & SUCCESS CRITERIA

### Training Quality
- Validation perplexity decreases by ≥10% from epoch 1 to final epoch
- No overfitting: val loss never exceeds train loss by >20%
- Adapter file size proportional to dataset (not bloated)

### Backtesting Validity
- Statistical significance: fine-tuned vs base model comparison has p < 0.05
- No look-ahead bias: all agent decisions use only data available at simulation date
- Transaction cost modeling within 0.1% of real-world costs for comparable trades

### User Experience
- Training completes in ≤30 minutes on Apple Silicon M2 or better
- Backtesting a 6-month period completes in ≤5 minutes
- User understands results: before/after graph clearly shows improvement or lack thereof
- Agent visibly uses fine-tuned behavior in next conversation (user can tell the difference)

---

## 8. OPEN QUESTIONS & FUTURE WORK

### Answered in This Spec
- ✅ LoRA vs full fine-tuning: LoRA only (small, local, per-user)
- ✅ Local vs cloud GPU: Local only
- ✅ Backtesting timeframes: 6mo, 1yr, 3yr presets + custom + market regimes
- ✅ Benchmark metrics: Sharpe, Max Drawdown, CAGR, Sortino, Win/Loss, Acceptance Rate, Tax Efficiency
- ✅ Guardrails: All 8 recommended guardrails implemented
- ✅ Memory System integration: Full write-back with `agent_training_runs` table

## 8a. Strategy Backtesting with backtrader

### 8a.1 Why backtrader (Ponytail)

`backtrader` is the ponytail pick for strategy backtesting. Pure Python, event-driven, built-in broker simulation, analyzers for Sharpe/drawdown/win-rate. `vectorbt` for parameter sweeps (vectorized, faster for grid search). Skip `zipline-reloaded` unless we need a specific feature neither covers.

```bash
pip install backtrader vectorbt
```

### 8a.2 Strategy Definition from Skill Catalog

Investment agent skills catalog (`docs/Skills_Connectors_Models/Skills/Investment_agent_skills`) defines the strategy shape. Each "Buy" recommendation maps to a strategy signal:

```python
# backtesting/strategy.py
import backtrader as bt

class AgentRecommendationStrategy(bt.Strategy):
    """Replays agent recommendations as trading signals against historical data."""
    
    params = (
        ('recommendations', []),  # List of { date, ticker, action, weight, confidence }
        ('initial_cash', 100000.0),
        ('commission', 0.001),    # 0.1%
    )

    def __init__(self):
        self.orders = {}       # ticker → order
        self.position_size = {} # ticker → size
        self.recommendation_map = self._build_rec_map()

    def _build_rec_map(self):
        """Index recommendations by (date, ticker) for O(1) lookup per bar."""
        rec_map = {}
        for rec in self.p.recommendations:
            key = (rec['date'].date(), rec['ticker'])
            rec_map[key] = rec
        return rec_map

    def next(self):
        current_date = self.datas[0].datetime.date(0)
        
        for data in self.datas:
            ticker = data._name
            key = (current_date, ticker)
            
            if key in self.recommendation_map:
                rec = self.recommendation_map[key]
                if rec['action'] == 'buy':
                    self._execute_buy(data, rec)
                elif rec['action'] == 'sell':
                    self._execute_sell(data, rec)

    def _execute_buy(self, data, rec):
        size = (self.broker.getvalue() * rec['weight']) / data.close[0]
        self.buy(data=data, size=size)

    def _execute_sell(self, data, rec):
        pos = self.getposition(data)
        if pos.size > 0:
            self.sell(data=data, size=pos.size * rec['weight'])

    def notify_order(self, order):
        if order.status in [order.Completed, order.Canceled, order.Margin]:
            self.orders[order.data._name] = None
```

### 8a.3 Data Feed: Polygon.io Historical

```python
# backtesting/data_feeds.py
import backtrader as bt
from datetime import datetime
import requests

def fetch_polygon_historical(
    ticker: str,
    from_date: str,  # YYYY-MM-DD
    to_date: str,
    api_key: str
) -> list[dict]:
    """Fetch daily OHLCV from Polygon.io."""
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{from_date}/{to_date}"
    resp = requests.get(url, params={'apiKey': api_key, 'adjusted': 'true'})
    return resp.json()['results']

def polygon_to_bt_feed(results: list[dict], ticker: str) -> bt.feeds.PandasData:
    """Convert Polygon.io response to backtrader data feed."""
    import pandas as pd
    
    df = pd.DataFrame(results)
    df['timestamp'] = pd.to_datetime(df['t'], unit='ms')
    df = df.rename(columns={
        'o': 'open', 'h': 'high', 'l': 'low', 
        'c': 'close', 'v': 'volume'
    })
    df = df.set_index('timestamp')
    
    return bt.feeds.PandasData(dataname=df, name=ticker)
```

### 8a.4 Broker Simulation

backtrader's built-in broker handles:
- Cash management (initial capital, commission deductions)
- Position tracking (long/short, margin if enabled)
- Order execution (market orders at next bar open)
- Commission model: 0.1% per trade (configurable)

```python
# backtesting/runner.py
import backtrader as bt
from backtrader.analyzers import SharpeRatio, DrawDown, TradeAnalyzer

def run_backtest(
    strategy: type,
    data_feeds: list[bt.feeds.PandasData],
    recommendations: list[dict],
    initial_cash: float = 100000.0,
    commission: float = 0.001,
) -> dict:
    cerebro = bt.Cerebro()
    cerebro.addstrategy(
        strategy,
        recommendations=recommendations,
        initial_cash=initial_cash,
        commission=commission,
    )
    
    for feed in data_feeds:
        cerebro.adddata(feed)
    
    cerebro.broker.setcash(initial_cash)
    cerebro.broker.setcommission(commission=commission)
    
    # Analyzers
    cerebro.addanalyzer(SharpeRatio, _name='sharpe', riskfreerate=0.02)
    cerebro.addanalyzer(DrawDown, _name='drawdown')
    cerebro.addanalyzer(TradeAnalyzer, _name='trades')
    
    start_value = cerebro.broker.getvalue()
    results = cerebro.run()
    end_value = cerebro.broker.getvalue()
    
    strat = results[0]
    return {
        'start_value': start_value,
        'end_value': end_value,
        'total_return': (end_value - start_value) / start_value,
        'sharpe_ratio': strat.analyzers.sharpe.get_analysis().get('sharperatio'),
        'max_drawdown': strat.analyzers.drawdown.get_analysis().max.drawdown,
        'trade_analysis': strat.analyzers.trades.get_analysis(),
    }
```

---

## 8b. Parameter Sweeps with vectorbt

### 8b.1 Why vectorbt

`vectorbt` runs backtests vectorized (NumPy) — 1000x faster than event-driven for grid search. Use it for parameter sweeps (position sizing, rebalance frequency, stop-loss thresholds). backtrader for final strategy validation with agent recommendations.

### 8b.2 Grid Search Example

```python
# backtesting/param_sweep.py
import vectorbt as vbt
import pandas as pd
import numpy as np

def sweep_position_sizing(
    prices: pd.DataFrame,  # columns = tickers, rows = dates, values = adjusted close
    weight_range: np.ndarray = np.linspace(0.05, 0.40, 8),  # 5% to 40% per position
    rebalance_freq: list[str] = ['M', 'Q', '6M', 'Y'],
) -> pd.DataFrame:
    """Grid search: position size weight × rebalance frequency."""
    
    results = []
    for freq in rebalance_freq:
        for weight in weight_range:
            # Build equal-weight portfolio rebalanced at frequency
            returns = prices.pct_change().dropna()
            
            # Rebalance dates
            rebalance_dates = returns.resample(freq).first().index
            
            pf_value = (1 + returns).cumprod()
            
            # Metrics
            daily_returns = pf_value.pct_change().mean(axis=1)
            sharpe = daily_returns.mean() / daily_returns.std() * np.sqrt(252)
            max_dd = (pf_value / pf_value.cummax() - 1).min().min()
            
            results.append({
                'weight': weight,
                'rebalance_freq': freq,
                'sharpe': sharpe,
                'max_drawdown': max_dd,
            })
    
    return pd.DataFrame(results).sort_values('sharpe', ascending=False)
```

### 8b.3 Integration: vectorbt sweep → backtrader validation

```
1. vectorbt: Sweep 500 param combos in 2 seconds
   └→ Find top-3 (weight, rebalance freq) by Sharpe
2. backtrader: Run top-3 combos with agent recommendation signals
   └→ Validate against real agent behavior
3. Report: Best combo + confidence interval
```

---

### Future Phases (Not in MVP)
- **Adapter merging**: Combine Investment + general financial knowledge LoRA weights
- **Cross-agent training**: Debt agent learns from Investment agent's user preference patterns
- **Federated insights**: Anonymous aggregate patterns across users (opt-in, privacy-preserving)
- **Continuous online learning**: Agent updates adapter after each conversation (RLHF-style)
- **Custom model import**: User brings their own fine-tuned model

---

## 9. REFERENCE: FILE & TABLE MAP

| File / Path | Purpose |
|-------------|---------|
| `docs/Memory_system/Memory_system` → `agent_chats` table | Source of training data (decision-labeled chats) |
| `docs/Memory_system/Memory_system` → `user_context` table | Historical context snapshots for backtesting |
| `docs/Memory_system/Memory_system` → NEW: `agent_training_runs` table | Stores training run metadata, adapter paths, backtesting results |
| `docs/SystemPrompts/04_User_context_file_schema.md` → `past_decisions`, `behavioral_patterns`, `agent_insights` | Training labels and post-training insight updates |
| `docs/SystemPrompts/06_System_architecture_agent_orchestration_flow.md` → Agent orchestration layer | Loads active LoRA adapter at session start |
| `docs/Skills_Connectors_Models/LLM_Models_Provided` → Local models (Llama, Mistral, Qwen, DeepSeek, Phi) | Fine-tunable base models |
| `docs/Skills_Connectors_Models/Connectors_specification` → Finnhub `/stock/candle` | Historical OHLCV data for backtesting |
| `~/.fin/adapters/{user_id}/{agent_type}/{run_id}/adapter.safetensors` | LoRA adapter file storage |
| `~/.fin/training/{run_id}/dataset.jsonl` | Temporary training dataset (deleted after training unless user opts to keep) |

---

**Document Version:** 1.0  
**Status:** Complete Specification — Ready for Task Breakdown & Implementation  
**Owning Skills Used:** planning-and-task-breakdown, owasp-security-check  
**References:** LLM_Models_Provided, 06_System_architecture_agent_orchestration_flow.md, 04_User_context_file_schema.md, Connectors_specification, Memory_system