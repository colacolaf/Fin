# Locally Hosted Finance OS System

> A locally hosted operating system for your finances. Portfolio, debt, retirement, and assets — monitored by specialized AI agents, running entirely on your machine.

## Vision

A locally hosted desktop operating system for your money. A calm, Apple-like dashboard shows your full financial picture, plus specialized agents you can chat with to make better decisions.

No cloud. No tracking. No subscriptions required. Your data stays on your machine in an encrypted local store.

## Core Principles

- **Local-first**: All data lives on your machine. No cloud hosting, no accounts, no telemetry.
- **Privacy by default**: Financial data is encrypted at rest. API keys are stored securely.
- **Agent-driven**: Three specialized agents handle portfolio, debt, and retirement.
- **Unified memory**: One file-based chat archive, organized by agent, so every recommendation learns from the last.
- **Apple-like minimalism**: Clean, professional, desktop-only UI. No dark mode. No gimmicks.
- **Offline capable**: View your dashboard and chat with local models without internet.
- **Optional paid APIs**: Local Ollama is the default, but you can plug in OpenAI/Anthropic/etc. for stronger reasoning.
- **Interactive loading screen**: On app open, data syncs with an interactive loading screen before the dashboard appears. Not skippable — data must load first. (Custom loading screen code will be provided by the user.)

## The Three Agents

| Agent | Responsibility |
|---|---|
| **Portfolio Agent** | Manages investments, assets, and properties across all accounts. Suggests rebalancing, long-term trades, and tracks allocation. |
| **Debt Agent** | Looks at all debts — credit cards, student loans, car payments, mortgages — and creates payoff plans. |
| **Retirement Agent** | Monitors retirement accounts, projects readiness, and recommends contribution strategies. |

All agents share a single memory system but keep their own organized context.

## Main Dashboard

The dashboard is the home screen. It shows:

- **Portfolio graph** — total value, allocation, and performance over time
- **Debt graph** — total debt, payoff trajectory, and breakdown by category
- **Retirement readiness** — projected timeline and funding status
- **Asset overview** — properties, accounts, and holdings
- **Agent corner** — quick-access buttons to chat with each agent

From the dashboard you can:
- Set up connected accounts (brokerage, bank, retirement)
- Open an agent chat
- Review suggested trades or payoff plans
- View property and asset values

## Chat Modes

Each agent has its own chat interface. You can ask natural-language questions, request analysis, or let the agent proactively surface recommendations based on your data.

## Memory

The system keeps a lightweight, file-based archive of every conversation between the user and the agents. This archive is primarily a backend resource: agents can search past chats to build context, and users can search it through a panel in Settings.

- Memory is stored locally as plain JSON chat files.
- Agents can read relevant past conversations at the start of a new chat.
- The dashboard shows a **Recent News** widget instead of a memory graph.
- See `docs/Design/memory-system.md` for the full design.

## Security

- **Authorization key**: Required to open the app and to execute any trade. The user is prompted to store it somewhere safe.
- **Encryption key**: Separate from the authorization key, generated at setup, used to encrypt all local data.
- **Key recovery**: If the authorization key is lost, the user can recover with the encryption key. If both are lost, another recovery method is required.
- **Trade execution**: Opt-in. Before any trade executes, the user must enter the authorization key and confirm. A paper trading mode is available for testing.

## Data Sources

- **Brokerage data**: All major providers average Americans use (Alpaca, Schwab, Fidelity, Robinhood, Interactive Brokers, E*Trade, Webull, etc.)
- **Bank/debt data**: Plaid
- **Market data**: Any available provider (Finnhub, Polygon, Yahoo Finance, IEX Cloud, Alpaca, etc.)
- **Local LLM**: Ollama (user downloads the model)
- **Optional cloud LLM**: OpenAI, Anthropic, Google, Groq, etc.

## Notifications

Desktop native notifications for:
- Agent finishes a task
- Debt paid off
- Debt milestone hit

## Onboarding

A simple setup wizard requires the user to complete necessary tasks before accessing the dashboard:

1. Paste or generate the **authorization key**
2. Generate or paste the **encryption key**
3. Connect a **portfolio** account
4. Connect a **bank** account
5. Connect any **debt** accounts
6. Select a local LLM model (default: Llama 3.1 8B)

After setup, agents ask follow-up questions during chat to refine goals and preferences.

## Current Features (UI Showcase)

A working Next.js UI showcase lives in `ui-showcase/` with:

### Agent Chat
- Three specialized agents: Portfolio, Debt, Retirement
- Real-time chat with thinking indicators (reasoning steps shown inline)
- **Thinking modes**: Low / Medium / High / Ultra — controls reasoning depth
- **Token compression modes**: Normal / Compressed / Ultra-compressed / Caveman — reduces token usage using caveman-style compression
- Per-agent model selection + configurable settings

### AI Model Management
- **11 providers** registered: OpenAI, Anthropic, Google, Groq, Together, Mistral, DeepSeek, xAI, Cohere, Ollama, OpenRouter
- **API key storage** per provider in Settings → AI Model tab
- **Test Connection** button — real API key verification against each provider's endpoint
- Provider cards with expand/collapse, show/hide key, Stored/Verified status badges
- Models from configured providers automatically appear in agent model pickers

### Connectors & Sync
- **30+ financial connectors** cataloged (banks, brokerages, credit cards, loans, retirement, crypto)
- **Sync buttons** generate realistic mock financial data that flows into dashboards
- Portfolio → holdings, chart, allocation | Debt → donut, payoff plan | Retirement → readiness %, projections
- Locked states when disconnected (no mock fallback)

### Dashboard
- Glassmorphic design language throughout
- Portfolio metrics, sparklines, allocation cards
- Debt donut with legend, debt-vs-invest modal
- Retirement widget with piggy bank icon + readiness meter
- News cards, analytics, skills registry

### E2E Test Suite
- **16 Playwright tests** covering settings, API keys, model selection, verification, and navigation
- Real API key verification test (skips gracefully when no key is set)

## Status

UI showcase is functional at `http://localhost:3000`. Backend integrations (real Plaid/OAuth flows, trade execution, desktop notifications) are documented in [`docs/TODO.md`](docs/TODO.md).

## License

[To be determined]
