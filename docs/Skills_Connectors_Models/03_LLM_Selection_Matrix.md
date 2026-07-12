# LLM Selection Matrix

Version: 3.0 | Updated: July 2026

This document routes skills to models. It is **hybrid**: it lists real, currently available models and also projected 2026 models. Projected models are clearly labeled with `(projected)` and should be treated as placeholders until they are released and benchmarked.

## Selection Logic

1. Determine the skill's requirements: privacy, latency, reasoning depth, tool use, context length.
2. Pick a **tier** first (see table below).
3. Within the tier, prefer a **real** model for production today; use a **projected** model only for forward-looking architecture decisions.

## Model Tiers

| Tier | Use When... | Example REAL Models (Current) | EXAMPLE Projected 2026 Models |
|------|-------------|-------------------------------|-------------------------------|
| **Local Base** | Privacy-first, offline, low cost | Mistral 7B, Llama 3 8B, Qwen 2.5 7B | Qwen 3.6 35B, Gemma 4 27B |
| **Local Reasoning** | Complex math, transparent reasoning | DeepSeek-Coder-V2, Qwen 2.5 32B | DeepSeek-R1, Llama 4 Scout |
| **Cloud Fast** | Low latency, high volume, cheap | GPT-4o-mini, Claude 3.5 Haiku | Gemini 3.5 Flash, DeepSeek V4 Pro |
| **Cloud Fiduciary** | Best reasoning, tool use, trust | GPT-4o, Claude 3.5 Sonnet | GPT-5.5, Claude Sonnet 5 |

## Skill-to-Model Routing

| Skill | Recommended Tier | Real Model (Today) | Projected Model (2026) |
|-------|------------------|--------------------|------------------------|
| `search_web` | Cloud Fast | GPT-4o-mini | Gemini 3.5 Flash |
| `fetch_user_context` | Local Base | Mistral 7B | Qwen 3.6 35B |
| `portfolio_analyze` | Cloud Fiduciary | Claude 3.5 Sonnet | Claude Sonnet 5 |
| `rebalance_recommend` | Cloud Fiduciary | GPT-4o | GPT-5.5 |
| `tax_loss_harvest` | Cloud Fiduciary | Claude 3.5 Sonnet | Claude Sonnet 5 |
| `fee_optimize` | Cloud Fast | GPT-4o-mini | Gemini 3.5 Flash |
| `execute_trade` | Local Base | Mistral 7B | Qwen 3.6 35B |
| `debt_payoff_simulate` | Local Reasoning | DeepSeek-Coder-V2 | DeepSeek-R1 |
| `debt_vs_invest_analyze` | Cloud Fiduciary | GPT-4o | GPT-5.5 |
| `consolidation_opportunity` | Cloud Fast | GPT-4o-mini | DeepSeek V4 Pro |
| `retirement_readiness_score` | Local Reasoning | DeepSeek-Coder-V2 | DeepSeek-R1 |
| `match_capture_recommend` | Local Base | Mistral 7B | Qwen 3.6 35B |
| `roth_conversion_analyze` | Cloud Fiduciary | Claude 3.5 Sonnet | Claude Sonnet 5 |
| `calculate_rmd` | Local Base | Mistral 7B | Qwen 3.6 35B |
| `company_fundamentals` | Cloud Fast | GPT-4o-mini | Gemini 3.5 Flash |
| `sector_performance` | Cloud Fast | GPT-4o-mini | Gemini 3.5 Flash |

## Model Comparison Tables

### Cloud Models

| Model | Provider | Input Cost | Output Cost | Context | Reasoning | Status |
|-------|----------|------------|-------------|---------|-----------|--------|
| GPT-4o | OpenAI | $2.50/M | $10.00/M | 128k | Excellent | ✅ Real |
| GPT-4o-mini | OpenAI | $0.15/M | $0.60/M | 128k | Good | ✅ Real |
| Claude 3.5 Sonnet | Anthropic | $3.00/M | $15.00/M | 200k | Excellent | ✅ Real |
| Claude 3.5 Haiku | Anthropic | $0.25/M | $1.25/M | 200k | Good | ✅ Real |
| Gemini 1.5 Pro | Google | $3.50/M | $10.50/M | 1M | Excellent | ✅ Real |
| Gemini 1.5 Flash | Google | $0.35/M | $1.05/M | 1M | Good | ✅ Real |
| DeepSeek-V3 | DeepSeek | $0.27/M | $1.10/M | 64k | Excellent | ✅ Real |
| DeepSeek V4 Pro | DeepSeek | $0.435/M | $0.87/M | 1M | Excellent | ✅ Real |
| **GPT-5.5** | OpenAI | *(projected)* | *(projected)* | 1M+ | Excellent | ⏳ 2026 |
| **Claude Sonnet 5** | Anthropic | *(projected)* | *(projected)* | 200k | Excellent | ⏳ 2026 |
| **Gemini 3.5 Flash** | Google | *(projected)* | *(projected)* | 1M | Good | ⏳ 2026 |
| **Qwen 3.7 Max** | Alibaba | *(projected)* | *(projected)* | 1M+ | Excellent | ⏳ 2026 |

### Local / Self-Hosted Models

| Model | Size | VRAM | License | Reasoning | Status |
|-------|------|------|---------|-----------|--------|
| Mistral 7B | 7B | 8 GB | Apache 2.0 | Good | ✅ Real |
| Llama 3 8B | 8B | 8 GB | Meta | Good | ✅ Real |
| Qwen 2.5 7B | 7B | 8 GB | Apache 2.0 | Good | ✅ Real |
| DeepSeek-Coder-V2 | 16B | 16 GB | MIT | Excellent | ✅ Real |
| **Qwen 3.6 35B** | 35B | 24 GB | Apache 2.0 | Excellent | ⏳ 2026 |
| **Gemma 4 27B** | 27B | 24 GB | Apache 2.0 | Good | ⏳ 2026 |
| **DeepSeek-R1** | 32B+ | 24 GB+ | MIT | Excellent | ⏳ 2026 |
| **Llama 4 Scout** | 109B | 64 GB | Meta | Good | ⏳ 2026 |

## Cost vs. Quality Paths

| Path | Models | Monthly Cost | Best For |
|------|--------|--------------|----------|
| **Cloud Excellence** | GPT-4o / Claude 3.5 Sonnet | $100–300 | Best reasoning, no hardware |
| **Cloud Frugality** | GPT-4o-mini / Gemini 1.5 Flash | $10–30 | High volume, fast responses |
| **Local Privacy** | Mistral 7B / Qwen 2.5 | $0 + GPU | Complete privacy, one-time cost |
| **Hybrid (Recommended)** | Local for simple skills, Cloud for fiduciary skills | $20–80 | Balance privacy, cost, quality |

## Free Tier / Open Source Providers

These options are viable for Fin users who want low or zero cost. **Privacy varies dramatically** — see the training/privacy column.

| Provider / Tool | Model | Context | Limits / Notes | Privacy / Training Status |
| :--- | :--- | :--- | :--- | :--- |
| **Google AI Studio** | Gemini 1.5 Pro / Flash | 1M | ~1,500 req/day | ⚠️ Trains on data unless in EU/Enterprise |
| **Groq** | Llama 3.3 70B, Mixtral | 128k+ | 1,000 req/day (very fast) | 🔒 Opt-in only / clear policies |
| **Mistral API** | Codestral / Large | 32k+ | ~1B tokens/mo free | 🔒 Opt-in to training |
| **Cerebras** | Llama 3.3 70B | 128k | ~1M tokens/day | 🔒 Non-training usage |
| **GitHub Models** | GPT-4o, Sonnet 3.5 | varied | 150–1,000 req/day | 🔒 No training on API data |
| **Zhipu (Open Source)** | GLM-5.2 | 1M | MIT License, benchmark leader | 🔒 Self-hosted |
| **Moonshot (API)** | Kimi K2.7 Code | - | Multi-step agentic | Check provider terms |
| **Microsoft (Open)** | Phi-4 | - | On-device, fast | 🔒 Local |

> **Note on Freebuff:** Freebuff is a CLI coding agent tool, not a model hub or LLM provider. It can interface with models like DeepSeek or Kimi, but it does not itself provide model inference.

## Important Notes

- **Projected models are speculative.** Do not hard-code them as defaults. Use them only in architecture discussions and swap them in once released.
- **Default MVP model:** `Mistral 7B` via Ollama for local-first, privacy-preserving operation.
- **Fallback cloud model:** `GPT-4o-mini` for skills that need fast, cheap reasoning when local hardware is insufficient.
- **Free tier data privacy check:** Free consumer tiers (e.g., Google AI Studio) often default to using query data for model training. Traffic carrying PII or financial data must route through enterprise endpoints, self-hosted open-source models (e.g., GLM-5.2, Phi-4), or free APIs that guarantee opt-in-only training policies (GitHub Models, Groq).
- **Update this matrix quarterly** as new models are released and benchmarked.
