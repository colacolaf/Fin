# Model Selector Templates — 3 Approaches

> **Goal:** Let users pick from a wide range of LLM providers/models, enter API credentials per provider, and have the agent actually use the selected model.  
> **Context:** Finance OS runs locally. API keys are stored encrypted in localStorage. Multiple providers supported.  
> **Current state:** Only 3 models listed (GPT-5, Claude 4, Llama 3 70B) with vendor setup links but no credential management.

---

## Comprehensive Provider & Model Registry

Before the templates, here's the full provider list that all three templates would use:

| # | Provider | Models | API Key Env | Base URL | Setup Link | Pricing | Context |
|---|---|---|---|---|---|---|---|
| 1 | **OpenAI** | GPT-4o, GPT-4o-mini, o3, o4-mini, GPT-4.1 | `OPENAI_API_KEY` | `https://api.openai.com/v1` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $2.50–$15/M tokens | 8K–200K |
| 2 | **Anthropic** | Claude Opus 4, Sonnet 4, Haiku | `ANTHROPIC_API_KEY` | `https://api.anthropic.com/v1` | [console.anthropic.com](https://console.anthropic.com) | $0.80–$15/M tokens | 200K |
| 3 | **Google** | Gemini 2.5 Pro, 2.5 Flash, Flash-Lite | `GOOGLE_API_KEY` | `https://generativelanguage.googleapis.com` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | $0.15–$3.50/M tokens | 1M–2M |
| 4 | **Groq** (hosts Llama) | Llama 4 Scout (17B), Llama 4 Maverick (128B) | `GROQ_API_KEY` | `https://api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) | $0.09–$0.59/M tokens | 128K |
| 5 | **Together AI** | Llama 4, Mixtral, DeepSeek, Qwen | `TOGETHER_API_KEY` | `https://api.together.xyz/v1` | [api.together.ai](https://api.together.ai) | $0.10–$1.20/M tokens | 128K |
| 6 | **Mistral** | Mistral Large 2, Small, Codestral | `MISTRAL_API_KEY` | `https://api.mistral.ai/v1` | [console.mistral.ai](https://console.mistral.ai/api-keys) | $0.30–$6/M tokens | 128K |
| 7 | **DeepSeek** | DeepSeek V3, DeepSeek R1 | `DEEPSEEK_API_KEY` | `https://api.deepseek.com/v1` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | $0.14–$0.55/M tokens | 64K–128K |
| 8 | **xAI** | Grok 3, Grok 3 Mini | `XAI_API_KEY` | `https://api.x.ai/v1` | [x.ai/api](https://x.ai/api) | $2–$8/M tokens | 128K–1M |
| 9 | **Cohere** | Command R+, Command R | `COHERE_API_KEY` | `https://api.cohere.ai/v1` | [dashboard.cohere.com](https://dashboard.cohere.com/api-keys) | $0.50–$3/M tokens | 128K |
| 10 | **Local** (Ollama) | Llama 3.1, Mistral, Gemma, Qwen, Phi | None (local) | `http://localhost:11434` | [ollama.com](https://ollama.com) | Free | Varies |
| 11 | **OpenRouter** | Unified API for 200+ models | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) | Varies | Varies |

---

## Template A: Provider-First Selector

**Concept:** Models are grouped by provider. Each provider has a collapsible section with its own credential management. You pick a provider, enter credentials, then pick a model from that provider.

**Best for:** Users who know which provider they want and want to manage credentials per provider.

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Choose Model                                    [Close] │
│                                                         │
│  ┌─ Provider Tabs ──────────────────────────────────┐  │
│  │ OpenAI │ Anth. │ Google │ Groq │ Mistral │ More… │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ OpenAI ────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  🔑 API Key: [················]  [Test]  ✅      │   │
│  │     └─ sk-...a1b2  ·  Last verified: 2 min ago   │   │
│  │                                                  │   │
│  │  Models:                                         │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │ ● GPT-4o            $2.50/M  128K ctx    │   │   │
│  │  │   Our most capable model. Best for       │   │   │
│  │  │   complex financial analysis.             │   │   │
│  │  │                              [Selected ✓] │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │ ○ GPT-4o-mini       $0.15/M  128K ctx    │   │   │
│  │  │   Fast, affordable. Good for quick Q&A.   │   │   │
│  │  │                              [Select]     │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │ ○ o3                $10.00/M  200K ctx    │   │   │
│  │  │   Advanced reasoning. Best for complex    │   │   │
│  │  │   multi-step financial modeling.          │   │   │
│  │  │                              [Select]     │   │   │
│  │  ├──────────────────────────────────────────┤   │   │
│  │  │ ○ o4-mini           $1.10/M   200K ctx    │   │   │
│  │  │   Fast reasoning. Good balance of speed   │   │   │
│  │  │   and analytical depth.                   │   │   │
│  │  │                              [Select]     │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  │                                                  │   │
│  │  [Get API key →]  [Docs ↗]                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Status: ✅ Connected (OpenAI · GPT-4o)                  │
│  Token budget: ~2,500/skill · ~8,000 max/conv           │
└─────────────────────────────────────────────────────────┘
```

### Key behaviors
- **Provider tabs** at top switch between providers
- **API key input** per provider with test connection button + last verified timestamp
- **Model list** below shows all models for that provider with pricing, context window
- **Selected model** highlighted with checkmark
- **"Get API key"** link opens provider's setup page
- **Status bar** at bottom shows connection status

### Credential storage
```
localStorage:
  fo-provider-keys = { "openai": "sk-...", "anthropic": "sk-ant-...", ... }
  fo-provider-model-openai = "gpt-4o"
  fo-provider-verified-openai = 1720454400000  // timestamp
```

---

## Template B: Model Cards with Inline Credentials

**Concept:** Every model is a card. Cards with API requirements show an inline credential section when selected. More visual, model-centric browsing experience.

**Best for:** Users who want to browse and compare models before choosing.

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Choose Model                                         ✕ │
│                                                         │
│  ┌─ Filters ────────────────────────────────────────┐  │
│  │ [All] [Reasoning] [Fast] [Cheap] [Local]          │  │
│  │ 🔍 Search models…                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │  GPT-4o       │  │ Claude Sonnet │  │ Gemini 2.5 │  │
│  │  ───────────  │  │  4            │  │ Pro        │  │
│  │  OpenAI       │  │  ───────────  │  │ ────────── │  │
│  │               │  │  Anthropic    │  │ Google     │  │
│  │  🧠 Reasoning │  │               │  │            │  │
│  │  📊 128K ctx  │  │  ✍️ Careful   │  │  🎯 2M ctx │  │
│  │  💰 $2.50/M   │  │  📊 200K ctx  │  │  💰 $1.25  │  │
│  │               │  │  💰 $3.00/M   │  │            │  │
│  │  [Select →]   │  │               │  │  [Select→] │  │
│  │               │  │  [Select →]   │  │            │  │
│  └───────────────┘  └───────────────┘  └────────────┘  │
│                                                         │
│  ┌─ When GPT-4o selected ──────────────────────────┐   │
│  │  ┌──────────────────────────────────────────────┐│   │
│  │  │ 🔑 Enter OpenAI API key to use GPT-4o       ││   │
│  │  │                                              ││   │
│  │  │  sk-·······················  [Test & Save]  ││   │
│  │  │                                              ││   │
│  │  │  🔗 Get your API key →                       ││   │
│  │  │  📖 How to create an OpenAI API key          ││   │
│  │  │     1. Go to platform.openai.com/api-keys    ││   │
│  │  │     2. Click "Create new secret key"         ││   │
│  │  │     3. Copy the key (starts with sk-)        ││   │
│  │  │     4. Paste it above and click Test         ││   │
│  │  └──────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │  Llama 4      │  │  DeepSeek V3  │  │  Grok 3    │  │
│  │  Scout        │  │               │  │            │  │
│  │  ───────────  │  │  🧮 Math      │  │  🐦 X/Twtr │  │
│  │  Meta/Groq    │  │  📊 128K ctx  │  │  📊 128K   │  │
│  │               │  │  💰 $0.14/M   │  │  💰 $2.00  │  │
│  │  🏠 Local too │  │               │  │            │  │
│  │  📊 128K ctx  │  │  [Select →]   │  │  [Select→] │  │
│  │  💰 Free(oll) │  │               │  │            │  │
│  │               │  │               │  │            │  │
│  │  [Select →]   │  │               │  │            │  │
│  └───────────────┘  └───────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key behaviors
- **Filter tabs** for model categories (All, Reasoning, Fast, Cheap, Local)
- **Search** to find specific models
- **Model cards** in a grid — each card shows vendor, strengths, context, pricing
- **Inline credential setup** appears below the cards when a model requiring API key is selected
- **Step-by-step instructions** for getting the API key from each provider
- **Local models** show "Running on Ollama" or "Not detected — start Ollama"
- **Card badges** show model strengths (Reasoning, Careful, Math, Long Context, etc.)

### Credential storage (same as Template A)

---

## Template C: Compact Dropdown + Credential Panel

**Concept:** A minimal dropdown for quick model switching. Credentials managed in a separate settings panel. Designed for frequent model changes with minimal friction.

**Best for:** Power users who switch models often and want the fastest UI.

### Visual Layout

```
IN THE CHAT HEADER (compact):
┌─────────────────────────────────────────────────────────┐
│ ← Portfolio Agent   ⏱ 02:31    [⚡GPT-4o ▾]  🎤  ⚙️  │
└─────────────────────────────────────────────────────────┘
                                     │
                                     │  click
                                     ▼
┌──────────────────────────┐
│ Models                   │
│ ─────────────────────── │
│ ● GPT-4o      (OpenAI)  │ ← selected, has key ✓
│ ○ Claude S4   (Anthropic)│ ← has key ✓
│ ○ Gemini 2.5  (Google)  │ ← no key ⚠️
│ ○ o3          (OpenAI)  │
│ ○ DeepSeek V3 (DeepSeek)│ ← no key ⚠️
│ ○ Llama 4     (Groq)    │ ← has key ✓
│ ○ Llama 3.1   (Local)   │ ← running 🟢
│ ─────────────────────── │
│ 🔑 Manage API keys →    │ ← opens credential panel
└──────────────────────────┘


CREDENTIAL PANEL (opens from "Manage API keys" or from Settings):
┌─────────────────────────────────────────────────────────┐
│  API Credentials                            [Save All]  │
│                                                         │
│  ┌─ OpenAI ────────────────────────────────────────┐   │
│  │ 🔑 sk-····················  [Show] [Test]  ✅   │   │
│  │    Last verified: 2 min ago · GPT-4o active      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Anthropic ─────────────────────────────────────┐   │
│  │ 🔑 sk-ant-················  [Show] [Test]  ✅   │   │
│  │    Last verified: 1 hr ago · Sonnet 4 selected   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Google ────────────────────────────────────────┐   │
│  │ 🔑 [····················]  [Save] [Test]  ⚠️   │   │
│  │    No key set · Gemini 2.5 won't work            │   │
│  │    [Get API key →]                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Groq ──────────────────────────────────────────┐   │
│  │ 🔑 gsk-················  [Show] [Test]  ✅       │   │
│  │    Last verified: 3 days ago · Llama 4 active    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Local (Ollama) ────────────────────────────────┐   │
│  │ 🟢 Connected · http://localhost:11434            │   │
│  │    Models detected: llama3.1, mistral, gemma2    │   │
│  │    [Refresh]  [Change URL]                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ DeepSeek ──────────────────────────────────────┐   │
│  │ 🔑 [····················]  [Save] [Test]  ⚠️   │   │
│  │    No key set                                    │   │
│  │    [Get API key →]                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  + Add provider (OpenRouter, Together AI, Cohere…)      │
│                                                         │
│  ───────────────────────────────────────────────────    │
│  ℹ️ Keys are stored encrypted in localStorage.          │
│     They never leave your device except via the         │
│     API call to the provider.                           │
└─────────────────────────────────────────────────────────┘
```

### Key behaviors
- **Compact dropdown** in chat header shows only the active model — one click to switch
- **Status indicators** next to each model: ✓ (has key), ⚠️ (needs key), 🟢 (local/running)
- **Dedicated credential panel** accessible from dropdown footer or Settings page
- **One credential section per provider** — API key, test button, last verified timestamp
- **Local provider** shows connection status, detected models, refresh button
- **Collapsible sections** for each provider in the credential panel
- **"Add provider"** button for OpenRouter, Together AI, Cohere, etc.
- **Security notice** about local-only key storage

### Credential storage (same as Template A)

---

## Comparison Matrix

| Feature | Template A (Provider-First) | Template B (Model Cards) | Template C (Dropdown+Panel) |
|---|---|---|---|
| **Speed to switch models** | Medium (2 clicks) | Slow (browse, click, setup) | Fast (1 click dropdown) |
| **Credential visibility** | Per provider tab | Inline on selection | Centralized panel |
| **Model discovery** | Medium | Excellent (grid + filters) | Minimal (dropdown list) |
| **Best for** | Provider-loyal users | First-time setup, browsing | Power users, frequent switching |
| **Visual complexity** | Medium | High | Low (dropdown) / Medium (panel) |
| **Setup wizard integration** | Excellent (step-by-step per provider) | Good (inline in card) | Good (central panel) |
| **API key management** | Per-provider (decentralized) | Inline per model | Centralized panel |

---

## Recommendation

For Finance OS, I recommend **Template C (Compact Dropdown + Credential Panel)** as the primary UI, with **Template B's model cards** as the setup wizard / first-time experience:

- **In the chat header:** Template C's compact dropdown — fast switching between already-configured models
- **In Setup Wizard / First-time:** Template B's model cards — browse, compare, and set up credentials
- **In Settings → AI Models:** Template C's credential panel — manage all API keys in one place

This gives users the best of all three:
- Speed in daily use (Template C dropdown)
- Beautiful onboarding (Template B cards)
- Centralized credential management (Template C panel)
