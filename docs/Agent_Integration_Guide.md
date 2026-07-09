# Fin Agent Integration Guide

> AI coding agent: read this first. Complete map of every doc, repo, prompt, skill, and flow.

---

## File Index — Every File in `docs/`

| File | Purpose | When to read |
|------|---------|--------------|
| `README.md` | Project overview, stack | Always first |
| `GitHub_References.md` | Repo-per-feature map | Need repo URL |
| `Features_reccomendations` | Feature priority & dependency order | Planning work |
| `Frontend_reccomendations` | UI component tree, animations, a11y | Frontend work |
| `Features/Recommendation_engine.md` | C.O.R.E. framework, confidence scoring, multi-agent | Recommendation logic |
| `Features/Voting_and_feedback_system.md` | Vote lifecycle, past_decisions, behavioral calc | Feedback, votes |
| `Features/Community_voting_and_benchmarks.md` | Anonymous aggregation, k-anonymity, cohorts | Community (Phase 2) |
| `Features/Data_refresh_pipeline.md` | Scheduling, AES-256-GCM, staleness, circuit breaker | Data connectors |
| `Features/Portfolio_visualization.md` | Three.js ocean, D3.js graph, agent cards | Visualization |
| `Features/Mobile_and_offline_support.md` | PWA, service worker, IndexedDB, offline queue | Mobile/offline |
| `Features/Backtesting/Training_mode_and_backtesting.md` | LoRA fine-tune, backtest engine, cross-model | Training/testing |
| `Features/Memory_system/Memory_system.md` | Per-agent memory, graph storage, categorization | Memory system |
| `Features/Setup_wizard/Setup_wizard_full_flow.md` | 6-step onboarding, profile schema | Onboarding |
| `Features/Setup_wizard/Setup_wizard_frontend_spec.md` | Step UI components, validation | Setup wizard UI |
| `SystemPrompts/Readme` | Package overview, file relationships | Prompt architecture |
| `SystemPrompts/System_architecture_(Agent_orchestration_flow)` | Full orchestration, request/response, confidence math | Architecture |
| `SystemPrompts/Fin_system_prompts_implemtation_guide` | Prompt injection, Ollama wiring | Prompt implementation |
| `SystemPrompts/Debt_agent_system_prompt` | Debt agent C.O.R.E. prompt | Debt agent |
| `SystemPrompts/Investment_agent_system_prompt` | Investment agent C.O.R.E. prompt | Investment agent |
| `SystemPrompts/Retirement_System_Prompt` | Retirement agent C.O.R.E. prompt | Retirement agent |
| `SystemPrompts/User_context_file_shema` | User context JSON schema | User data shape |
| `Skills_Connectors_Models/Skills/Debt_agent_skills` | 13 skills, 4 tiers, confidence formulas | Debt skills |
| `Skills_Connectors_Models/Skills/Investment_agent_skills` | 20 skills, 4 tiers, Monte Carlo pipeline | Investment skills |
| `Skills_Connectors_Models/Skills/Retirement_agent_skills` | 17 skills, 4 tiers, Roth ladder | Retirement skills |
| `Skills_Connectors_Models/LLM_Models_Provided` | Model tiers, hardware reqs | LLM selection |
| `Skills_Connectors_Models/Connectors_specification` | Alpaca/Plaid/Finnhub schemas, auth | Connectors |

---

## Task → Doc Router

```
IF task contains "recommendation" | "confidence" | "CORE" | "agent coordination"
  → Features/Recommendation_engine.md
  → SystemPrompts/System_architecture_(Agent_orchestration_flow)

IF task contains "debt" | "avalanche" | "snowball" | "payoff"
  → SystemPrompts/Debt_agent_system_prompt
  → Skills_Connectors_Models/Skills/Debt_agent_skills

IF task contains "investment" | "portfolio" | "rebalance" | "monte carlo"
  → SystemPrompts/Investment_agent_system_prompt
  → Skills_Connectors_Models/Skills/Investment_agent_skills

IF task contains "retirement" | "roth" | "401k" | "rmd" | "conversion"
  → SystemPrompts/Retirement_System_Prompt
  → Skills_Connectors_Models/Skills/Retirement_agent_skills

IF task contains "connector" | "alpaca" | "plaid" | "finnhub" | "data refresh"
  → Skills_Connectors_Models/Connectors_specification
  → Features/Data_refresh_pipeline.md

IF task contains "frontend" | "ui" | "visualization" | "3d" | "chart"
  → Frontend_reccomendations
  → Features/Portfolio_visualization.md

IF task contains "mobile" | "offline" | "pwa" | "service worker"
  → Features/Mobile_and_offline_support.md

IF task contains "setup" | "onboarding" | "wizard" | "user profile"
  → Features/Setup_wizard/Setup_wizard_full_flow.md
  → SystemPrompts/User_context_file_shema

IF task contains "vote" | "feedback" | "past decisions"
  → Features/Voting_and_feedback_system.md

IF task contains "community" | "benchmark" | "cohort" | "anonymize"
  → Features/Community_voting_and_benchmarks.md

IF task contains "backtest" | "lora" | "fine-tune" | "training"
  → Features/Backtesting/Training_mode_and_backtesting.md

IF task contains "memory" | "context" | "chat history"
  → Features/Memory_system/Memory_system.md

IF task contains "deploy" | "local" | "ollama" | "docker" | "setup script"
  → docs/Local_Deployment_Guide.md

IF task contains "test" | "scenario" | "synthetic portfolio"
  → docs/Agent_Testing_Plan.md

IF task needs repo URL for any feature
  → GitHub_References.md (quick-reference table at bottom)
```

---

## Agent → Prompt + Skill Map

| Agent | System Prompt | Skill Catalog | Skill Count |
|-------|--------------|---------------|-------------|
| **Debt** | `SystemPrompts/Debt_agent_system_prompt` | `Skills_Connectors_Models/Skills/Debt_agent_skills` | 13 (Tiers 1–4) |
| **Investment** | `SystemPrompts/Investment_agent_system_prompt` | `Skills_Connectors_Models/Skills/Investment_agent_skills` | 20 (Tiers 1–4) |
| **Retirement** | `SystemPrompts/Retirement_System_Prompt` | `Skills_Connectors_Models/Skills/Retirement_agent_skills` | 17 (Tiers 1–4) |

Tier structure per agent:
- **Tier 1**: Always-on baseline skills (no data gate). Run every request.
- **Tier 2**: Gated on connector data availability.
- **Tier 3**: Advanced analysis, multi-step. Gated on Tier 2 output.
- **Tier 4**: Synthesis / cross-domain. Gated on multiple Tier 3 results.

Prompt injection pattern in `SystemPrompts/Fin_system_prompts_implemtation_guide`.

---

## Orchestration Flow

```
User Query (React → FastAPI POST /api/chat)
  │
  ▼
Router: classifies "debt" | "investment" | "retirement" | "general"
  │
  ▼
Context Assembly: user_profile + past_decisions + agent_memory → user context JSON
  │
  ▼
Agent Selection → inject system prompt + skill catalog
  │
  ▼
Skill Execution: Tier 1 → Tier 2 (if data) → Tier 3 (if Tier 2) → Tier 4 (if Tier 3)
  │
  ▼
LLM Inference (Ollama): system prompt + skills + user context + chat history
  │
  ▼
Structured Output: JSON { recommendations[], agent, skills_used[], warnings[] }
  │
  ▼
Memory Write: chat turn → agent_memory/{agent}/, graph node updated
  │
  ▼
Recommendation Card: action + confidence bar + rationale + vote buttons
  │
  ▼
Vote Loop (async): user votes → past_decisions updated → behavioral recalculation
  → next recommendation reflects adjusted confidence
```

---

## 3-Agent Coordination via Shared Memory

Agents never call each other. All coordination through `basic-memory`:

```
basic-memory/
├── user_profile.json          ← Read by all agents
├── past_decisions.json        ← Read by all agents, written by voting system
├── agent_memory/debt/         ← Debt agent chat history
├── agent_memory/investment/   ← Investment agent chat history
└── agent_memory/retirement/   ← Retirement agent chat history
```

Cross-agent awareness:
1. Agent A makes recommendation → writes to its memory
2. User votes on recommendation → `past_decisions.json` updated
3. Agent B loads user context (includes past_decisions) → sees prior recommendations from Agent A
4. Agent B adjusts confidence/advice based on what Agent A already covered

No direct agent-to-agent API. Shared memory is the coordination bus.

---

## GitHub Repo Quick Reference

| Feature | Primary Repo |
|---------|-------------|
| Backend framework | `tiangolo/fastapi` |
| LLM inference | `ollama/ollama` |
| LLM proxy/fallback | `BerriAI/litellm` |
| Memory storage | `basic-memory` (local) |
| Portfolio data | `alpacahq/alpaca-py` |
| Banking data | `plaid/plaid-python` |
| Market data | `FinnhubStockAPI/finnhub-python` |
| Task scheduling | `agronholm/apscheduler` |
| Auth/identity | `ory/kratos` |
| Encryption | `pyca/cryptography` |
| Frontend | React 18 + Vite |
| 3D viz | Three.js (React Three Fiber) |
| Charts/graphs | D3.js, Recharts |
| PWA/offline | Workbox |

Full details: `docs/GitHub_References.md`

---

## No Orphaned Files

Every file in `docs/` referenced above. Nothing left unmapped. If new doc added, append to File Index table and Task → Doc Router section.