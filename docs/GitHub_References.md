# Fin — GitHub References & Integration Map

> AI coding agent: use this file to find the right GitHub repo, tool, or library for each feature. Grouped by the feature it helps build. Each entry has a URL, what it provides, and when to use it.

---

## Agent-Reach: Universal Web Capability Layer

**URL:** https://github.com/Panniantong/agent-reach  
**What:** Capability layer giving AI agents internet access. Handles selection, installation, health-checking, and routing of upstream tools. Not a scraper itself — it picks the most stable access method per platform.  
**Channels (all available):**

| Channel | Method | Use for |
|---------|--------|---------|
| Web pages | Jina Reader | Market news, articles, research |
| YouTube | yt-dlp | Financial education, earnings calls, tutorials |
| GitHub | gh CLI | Public repo research, private repo access |
| RSS | feedparser | Financial news feeds, blog monitoring |
| Search | Exa (MCP-based, free) | Semantic web search for market data |
| Reddit | rcmd + OpenCLI | Market sentiment, community discussion |
| Twitter/X | twitter-cli → bird | Real-time sentiment, breaking financial news |
| Instagram | instaloader | Brand sentiment, consumer trends |
| Google | googlesearch-python | Web search for financial research |
| Bilibili | bili-cli | Chinese market sentiment, video content |
| Wikipedia | wikipedia library | Company/economic concept lookup |
| Email | IMAP/SMTP | Alert delivery, report sending |
| Weather | openmeteo-python | Macro context (agriculture, energy markets) |

**When to use:** ANY time an agent needs external web data — news, sentiment, search, social media. Install via `pip install agent-reach`. Agents call channels directly; agent-reach routes and health-checks.

**Integration:** `pip install agent-reach`, then `agent-reach --help` for available channels. Each channel auto-installs its upstream tool on first use.

---

## Memory System

### basic-memory
**URL:** https://github.com/basicmachines-co/basic-memory  
**Stars:** ~3,400  
**What:** MCP-based persistent cross-session memory for AI agents. Markdown-based, Obsidian-compatible. Locally hosted — users interact with their memory in Obsidian directly.  
**When to use:** Building the per-agent memory store (Investment/Debt/Retirement agents). Stores context nodes (past decisions, user preferences) and edges (causal, temporal, similarity). Replaces custom SQLite memory tables.  
**Why this over others:** MCP-native (works with Claude Code, Cursor, etc.), local-first, users can read/edit memory in Obsidian. Lighter than obsidian-mind.

### obsidian-mind (alternative)
**URL:** https://github.com/breferrari/obsidian-mind  
**Stars:** ~3,290  
**What:** Obsidian vault purpose-built for AI coding agents (Claude Code, Codex CLI, Gemini CLI).  
**When to use:** If basic-memory MCP integration doesn't fit the stack. More opinionated about agent workflow.

### obsidian-smart-connections
**URL:** https://github.com/brianpetro/obsidian-smart-connections  
**Stars:** ~5,249  
**What:** Semantic search + knowledge graph visualization in Obsidian. Local embedding models, zero setup, no API key.  
**When to use:** Enhancing memory retrieval with semantic search over agent memory nodes. Complements basic-memory.

---

## Data Connectors & Financial APIs

### Alpaca (Brokerage — MVP)
**URL:** https://github.com/alpacahq/alpaca-py  
**What:** Official Python SDK for Alpaca trading API. Holdings, positions, orders, market data.  
**When to use:** Investment Agent portfolio data ingestion. Free, no API fees. 200 req/min.

### Plaid (Banking & Debt — MVP)
**URL:** https://github.com/plaid/plaid-python  
**What:** Official Python SDK for Plaid. Bank accounts, transactions, liabilities (credit cards, loans, mortgages).  
**When to use:** Debt Agent data ingestion. 12,000+ institutions. OAuth. ~$0.25-2/user/month.

### Finnhub (Market Data — MVP)
**URL:** https://github.com/Finnhub-Stock-API/finnhub-python  
**What:** Official Python SDK. Stock fundamentals, news, sentiment, ESG, insider trading.  
**When to use:** All agents needing market data. Free tier available, $49/mo for real-time.

### Polygon.io (Advanced Market Data)
**URL:** https://github.com/polygon-io/client-python  
**What:** Stocks, options, forex, crypto real-time + historical. WebSocket streaming.  
**When to use:** Phase 2 — when Finnhub free tier is insufficient. Institutional-grade.

### CCXT (Crypto — Unified Exchange API)
**URL:** https://github.com/ccxt/ccxt  
**What:** Unified API for 100+ crypto exchanges (Kraken, Coinbase, Binance, etc.).  
**When to use:** Phase 2 crypto portfolio tracking. One library, all exchanges.

---

## LLM & Inference

### Ollama (Local Inference — MVP)
**URL:** https://github.com/ollama/ollama  
**What:** Run LLMs locally (Mistral, Llama, Qwen, DeepSeek, Phi). CPU or GPU.  
**When to use:** Running all Fin agents locally. Privacy-first. Models: Mistral 7B (MVP), Qwen 3.6 35B (best local), DeepSeek-R1 (reasoning).

### LiteLLM (Multi-Provider Router)
**URL:** https://github.com/BerriAI/litellm  
**What:** Unified API for 100+ LLM providers. Call OpenAI, Anthropic, DeepSeek, Gemini, Ollama with same format.  
**When to use:** If Fin needs to switch between local Ollama and cloud providers. Single interface.

---

## Portfolio Visualization

### Recharts (React Charts)
**URL:** https://github.com/recharts/recharts  
**What:** Composable charting library for React. Area charts, line charts, bar charts, pie charts.  
**When to use:** Portfolio dashboard charts (allocation pie, performance line, Monte Carlo fan chart). Already specified in frontend recommendations.

### D3.js (Custom Visualizations)
**URL:** https://github.com/d3/d3  
**What:** Low-level visualization library. Full control over SVG/Canvas.  
**When to use:** Complex visualizations Recharts can't handle (correlation matrices, custom sankey for cash flow).

---

## Mobile & Offline Support

### Capacitor (Cross-Platform Mobile)
**URL:** https://github.com/ionic-team/capacitor  
**What:** Wrap web app as iOS/Android native app. Access native APIs (storage, notifications, biometrics).  
**When to use:** Mobile deployment. Better than Cordova for modern React apps.

### IndexedDB Wrapper — idb
**URL:** https://github.com/jakearchibald/idb  
**What:** Clean promise-based IndexedDB API.  
**When to use:** Offline data storage in browser. Cache portfolio data, recommendations, context.

### Workbox (Service Workers)
**URL:** https://github.com/GoogleChrome/workbox  
**What:** Service worker library for offline caching, background sync.  
**When to use:** PWA offline support. Cache API responses, assets. Background sync when online.

---

## Backtesting & Training Mode

### Backtrader
**URL:** https://github.com/mementum/backtrader  
**What:** Event-driven backtesting framework. Strategy definition, data feeds, broker simulation, analyzers.  
**When to use:** Backtesting investment strategies. Simulate trades against historical data.

### VectorBT
**URL:** https://github.com/polakowo/vectorbt  
**What:** Vectorized backtesting. Much faster than event-driven for parameter sweeps.  
**When to use:** Hyperparameter optimization, strategy screening. Complements backtrader for speed.

### Zipline-Reloaded
**URL:** https://github.com/stefan-jansen/zipline-reloaded  
**What:** Maintained fork of Quantopian's Zipline. Pipeline API for cross-sectional analysis.  
**When to use:** If the backtesting feature needs a Quantopian-compatible API.

---

## Voting, Feedback & Community Benchmarks

### Upstash Redis (Serverless Rate Limiting + Real-Time)
**URL:** https://github.com/upstash/upstash-redis  
**What:** Serverless Redis with REST API. Rate limiting, real-time counters, leaderboards.  
**When to use:** Community voting rate limiting, real-time benchmark leaderboards, vote aggregation.

### Flask-Limiter (Rate Limiting)
**URL:** https://github.com/alisaifee/flask-limiter  
**What:** Rate limiting extension for Flask/FastAPI.  
**When to use:** API rate limiting for voting endpoints. ponytail: use FastAPI's built-in or this, not both.

---

## Data Refresh Pipeline

### Apache Airflow
**URL:** https://github.com/apache/airflow  
**What:** Workflow orchestration. DAGs, scheduling, retries, monitoring.  
**When to use:** Scheduled data refresh (daily portfolio sync, night memory consolidation). Overkill for MVP — use cron + FastAPI background tasks first.  
**ponytail:** start with APScheduler (below), add Airflow only when DAG complexity warrants it.

### APScheduler (Lightweight Scheduler)
**URL:** https://github.com/agronholm/apscheduler  
**What:** In-process task scheduling for Python. Cron-like, interval, date triggers.  
**When to use:** MVP data refresh scheduling. Much lighter than Airflow. `pip install apscheduler`, 3 lines to schedule.

### Celery (Task Queue)
**URL:** https://github.com/celery/celery  
**What:** Distributed task queue. Async tasks, retries, rate limiting.  
**When to use:** If data refresh needs background workers beyond simple scheduling. ponytail: APScheduler covers MVP, add Celery when you need retry logic or distributed workers.

---

## Setup Wizard

### react-joyride (Product Tours)
**URL:** https://github.com/gilbarbara/react-joyride  
**What:** Guided product tours in React. Step-by-step overlays.  
**When to use:** Setup wizard walkthrough — connect broker, configure risk tolerance, set goals.

### React Hook Form
**URL:** https://github.com/react-hook-form/react-hook-form  
**What:** Performant form library for React. Minimal re-renders.  
**When to use:** Multi-step setup wizard forms. Lighter than Formik.

### Zod (Schema Validation)
**URL:** https://github.com/colinhacks/zod  
**What:** TypeScript-first schema validation.  
**When to use:** Validate setup wizard inputs, API connector configs, user preferences.

---

## Recommendation Engine

### Instructor (Structured LLM Outputs)
**URL:** https://github.com/jxnl/instructor  
**What:** Patch OpenAI/FastAPI clients to return Pydantic models. Structured output from LLMs.  
**When to use:** Parsing agent recommendations into typed JSON. Confidence scores, actions, reasoning. Works with Ollama via LiteLLM.

### Outlines (Structured Generation)
**URL:** https://github.com/dottxt-ai/outlines  
**What:** Guaranteed structured output from LLMs. JSON schema, regex, grammars.  
**When to use:** Alternative to Instructor. Tighter guarantees on output format. Works with local models.

---

## Backend & API

### FastAPI
**URL:** https://github.com/fastapi/fastapi  
**What:** Modern Python web framework. Auto OpenAPI docs, async, Pydantic validation.  
**When to use:** Fin backend API layer. Already specified in system architecture.

### SQLAlchemy
**URL:** https://github.com/sqlalchemy/sqlalchemy  
**What:** Python SQL ORM.  
**When to use:** Database layer. Already specified in architecture.

### Alembic
**URL:** https://github.com/sqlalchemy/alembic  
**What:** Database migration tool for SQLAlchemy.  
**When to use:** Schema migrations as Fin evolves.

---

## Authentication & Security

### Auth0 (or open-source Ory)
**URL:** https://github.com/auth0/auth0-python  
**What:** Auth0 Python SDK. OAuth 2.0, social login, MFA.  
**When to use:** User authentication. ponytail: if self-hosting preferred, use Ory below.

### Ory (Self-Hosted Auth)
**URL:** https://github.com/ory/kratos  
**What:** Open-source identity and user management. OAuth 2.0, MFA, passwordless.  
**When to use:** Self-hosted auth alternative to Auth0.

---

## Local-First & Privacy

### basic-memory (covered above in Memory System)
Also serves as the local-first data layer. All user financial data stays local.

### Ollama (covered above in LLM & Inference)
All LLM inference runs locally. No data leaves the machine.

### Cryptography (Fernet)
**URL:** https://github.com/pyca/cryptography  
**What:** Python cryptography library. Symmetric encryption (Fernet).  
**When to use:** AES-256 encrypt API credentials at rest (Alpaca, Plaid keys). Already in architecture spec. `cryptography.fernet`.

---

## Quick Reference: Feature → Primary GitHub

| Feature | Primary Repo | Fallback |
|---------|-------------|----------|
| Memory System | basic-memory | obsidian-mind |
| Web Capabilities (ALL) | agent-reach | — |
| Local LLM Inference | ollama | — |
| LLM Provider Router | litellm | — |
| Structured LLM Output | instructor | outlines |
| Investment Data | alpaca-py | — |
| Banking/Debt Data | plaid-python | — |
| Market Data | finnhub-python | polygon.io client |
| Crypto Data | ccxt | — |
| Portfolio Charts | recharts | d3 |
| Mobile App | capacitor | — |
| Offline Storage | idb + workbox | — |
| Backtesting | backtrader | vectorbt, zipline-reloaded |
| Voting/Leaderboards | upstash-redis | — |
| Scheduled Tasks | apscheduler | celery, airflow |
| Setup Wizard Forms | react-hook-form + zod | — |
| Product Tour | react-joyride | — |
| Backend API | fastapi | — |
| Database ORM | sqlalchemy + alembic | — |
| Auth | ory kratos | auth0 |
| Encryption | cryptography (fernet) | — |
| Memory Semantic Search | obsidian-smart-connections | — |

---

## Agent-Reach Channel Quick Reference

When an agent needs to:

| Task | Use agent-reach channel |
|------|------------------------|
| Search web for financial news | Google or Exa |
| Get market sentiment from Reddit | Reddit |
| Monitor breaking financial news | Twitter/X |
| Research a company/person | Wikipedia |
| Watch earnings call summary | YouTube |
| Monitor RSS feeds for market news | RSS |
| Read a financial article | Web (Jina Reader) |
| Check weather (commodity context) | Weather |
| Send alert email to user | Email |
| Look up open-source financial tools | GitHub |
| Gauge consumer brand sentiment | Instagram |

---

*File created: 2026-07-08. AI coding agents: each section maps to a feature doc in `docs/Features/`. Use the primary repo listed. ponytail: one repo per need unless genuinely insufficient.*