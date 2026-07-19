# Implementation Plan: Provider-First Model Selector with Credential Management

## Overview

Redesign the model system into two layers:
- **Layer 1 — Settings > AI Models (provider connection):** Users paste API keys per provider, select which models from each provider to enable. This is where models are "connected" to the app.
- **Layer 2 — Agent settings & chat header (model selection):** Users pick from already-configured models. Simple dropdown with status indicators.

Currently only 3 hardcoded models exist (GPT-5, Claude 4, Llama 3 70B) with no credential management. We expand to 11 providers with 25+ models, full API key management, and a provider-first UI in Settings.

## Architecture Decisions

- **Provider-first in Settings.** Template A style — providers as tabs/collapsible sections, API key + models under each. This is where connection happens.
- **Derived model list for agents.** Agent settings and chat header read from the configured providers. Only show models the user has set up.
- **Single source of truth.** `fo-provider-keys` stores all API keys. `fo-provider-models` stores which models are enabled per provider. Everything else reads from these.
- **Expanded provider registry.** Move from 3 models to 11 providers. Full `ProviderOption` interface with API key env var, base URL, setup link, pricing.

---

## Task List

### Phase 1: Data Layer (Foundation)

#### Task 1: Expand Provider & Model Types
**Description:** Replace the current `ModelOption` interface (4 fields) with a full provider/model registry. Add `ProviderOption` with API metadata and `ModelOption` with provider reference, pricing, context window.

**Acceptance criteria:**
- [ ] `ProviderOption` type with: id, name, apiKeyEnv, baseUrl, setupUrl, models[]
- [ ] `ModelOption` type expanded with: providerId, pricing, contextWindow, strengths[]
- [ ] 11 providers + 25+ models registered in `availableProviders` and `availableModels`
- [ ] Old `availableModels` array removed, replaced with derived list

**Verification:**
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] All existing imports of `availableModels` and `ModelOption` updated

**Dependencies:** None
**Files likely touched:** `src/lib/agents/index.ts`
**Estimated scope:** Medium (3-5 files)

---

#### Task 2: Create Provider Credential Storage
**Description:** Add localStorage helpers for reading/writing API keys per provider. Add helper to check which providers have keys set.

**Acceptance criteria:**
- [ ] `getProviderKey(providerId): string | null` reads from `fo-provider-keys`
- [ ] `saveProviderKey(providerId, key): void` writes to `fo-provider-keys`
- [ ] `getConfiguredProviders(): ProviderOption[]` returns providers with keys set
- [ ] `getEnabledModels(): ModelOption[]` returns models from configured providers
- [ ] `isProviderConfigured(providerId): boolean` quick check

**Verification:**
- [ ] TypeScript compiles
- [ ] Functions work in browser console test

**Dependencies:** Task 1
**Files likely touched:** `src/lib/settings/data.ts` (new exports)
**Estimated scope:** Small (1-2 files)

---

### Checkpoint: Foundation
- [ ] All types defined, 11 providers registered
- [ ] Credential storage helpers working
- [ ] TypeScript compiles clean

---

### Phase 2: Settings UI — Provider Connection

#### Task 3: Build Provider Card Component
**Description:** Reusable card for each provider in Settings. Shows provider name, API key input (masked with reveal toggle), test connection button, last verified timestamp, "Get API key" link, and a collapsible list of available models for that provider.

**Acceptance criteria:**
- [ ] Provider name + icon at top
- [ ] API key input with show/hide toggle
- [ ] [Test Connection] button (mock visual feedback for now — green ✅ on click)
- [ ] Last verified timestamp display
- [ ] "Get API key →" external link to provider's setup page
- [ ] Collapsible model list below with enable/disable checkboxes
- [ ] Provider card shows status: 🔴 Needs key, 🟡 Key set (untested), 🟢 Connected (verified)

**Verification:**
- [ ] TypeScript compiles
- [ ] Visual: card renders all states correctly

**Dependencies:** Tasks 1, 2
**Files likely touched:** `src/components/settings/provider-card.tsx` (new), `src/components/settings/settings-page.tsx`
**Estimated scope:** Medium (3-5 files)

---

#### Task 4: Rebuild Settings AI Model Tab
**Description:** Replace the current `ModelTab` (simple 3-model list) with the provider-first layout. Each provider gets a `ProviderCard`. Sections for Local (Ollama) with connection status.

**Acceptance criteria:**
- [ ] All 11 providers listed in the AI Model tab
- [ ] Each provider shows its `ProviderCard` with API key input
- [ ] Local/Ollama section shows connection URL + detected models
- [ ] "Add custom provider" button at bottom for OpenRouter, custom endpoints
- [ ] Empty state when no providers configured
- [ ] "Save All" button persists all keys at once

**Verification:**
- [ ] TypeScript compiles
- [ ] Visual: tab renders all providers
- [ ] API keys persist to localStorage across page reload

**Dependencies:** Task 3
**Files likely touched:** `src/components/settings/settings-page.tsx` (ModelTab replacement)
**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Provider Connection
- [ ] All 11 providers visible with API key inputs
- [ ] Keys persist to localStorage
- [ ] Test connection visual feedback works
- [ ] Models can be enabled/disabled per provider

---

### Phase 3: Agent Model Selection (Derived)

#### Task 5: Update ModelPicker in Chat Header
**Description:** Replace the current `ModelPicker` (hardcoded 3 models) with a dynamic picker that reads from configured providers. Show only models the user has enabled. Show status indicators: 🟢 (connected), ⚠️ (needs key for provider). 

**Acceptance criteria:**
- [ ] Dropdown shows only enabled models from configured providers
- [ ] Each model shows provider name, pricing, context window
- [ ] Status indicator per model
- [ ] "Configure providers →" link at bottom opens Settings AI Model tab
- [ ] Empty state: "No models configured. Set up in Settings → AI Models"

**Verification:**
- [ ] TypeScript compiles
- [ ] Dropdown reflects models configured in Settings

**Dependencies:** Tasks 1, 2, 4
**Files likely touched:** `src/components/agent-chat/model-settings.tsx`
**Estimated scope:** Small (1-2 files)

---

#### Task 6: Update Agent Settings Model Section
**Description:** Same as Task 5 but for the dedicated agent settings page. Replace hardcoded 3-model list with dynamic picker from configured providers.

**Acceptance criteria:**
- [ ] Model section shows only enabled models
- [ ] Consistent with chat header picker
- [ ] "Manage models" link opens Settings AI Model tab

**Verification:**
- [ ] TypeScript compiles

**Dependencies:** Tasks 1, 2, 4
**Files likely touched:** `src/components/agent-settings/agent-settings-page.tsx`
**Estimated scope:** Small (1-2 files)

---

### Phase 4: API Integration (Callable Models)

#### Task 7: Create Model API Client
**Description:** Build the actual API call layer. When the agent needs to use a model, this client resolves the provider's API key, base URL, and model ID and makes the API call via the OpenAI-compatible chat completions endpoint (most providers support this format).

**Acceptance criteria:**
- [ ] `callModel(modelId, messages, options): Promise<string>` function
- [ ] Resolves provider credentials from localStorage
- [ ] Constructs correct API request (OpenAI-compatible format for broad compatibility)
- [ ] Handles Anthropic's different API format
- [ ] Handles Google's different API format
- [ ] Error handling: network errors, 401 (bad key), 429 (rate limit), 500 (server error)
- [ ] Timeout handling (30s default)
- [ ] Streaming support (SSE parsing for token-by-token output)

**Verification:**
- [ ] TypeScript compiles
- [ ] Manual test: call with real API key, verify response

**Dependencies:** Tasks 1, 2
**Files likely touched:** `src/lib/models/client.ts` (new), `src/lib/models/types.ts` (new)
**Estimated scope:** Large (5-8 files)

---

#### Task 8: Wire API Client into useAgentThinking
**Description:** Replace the mock `use-agent-thinking.ts` responses with real API calls. When the user sends a message, the hook calls the selected model via the API client. The thinking trace shows real F.I.R.M. steps as they stream.

**Acceptance criteria:**
- [ ] Hook calls `callModel()` instead of returning mock responses
- [ ] Streaming output populates the thinking trace in real-time
- [ ] Falls back to mock if no model is configured
- [ ] Shows model name in the thinking trace ("Using GPT-4o via OpenAI")
- [ ] Error states handled gracefully (retry button, error message)

**Verification:**
- [ ] TypeScript compiles
- [ ] Real model responds in chat

**Dependencies:** Task 7
**Files likely touched:** `src/lib/agents/use-agent-thinking.ts`
**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Complete
- [ ] Models fully callable by the agent
- [ ] Streaming responses work
- [ ] All acceptance criteria met
- [ ] Ready for review

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API key exposure in localStorage | High | Keys stored in `fo-provider-keys`, masked in UI. Add encryption layer in Phase 5. Clear security notice in Settings. |
| Different provider API formats | Medium | Start with OpenAI-compatible format (covers 8/11 providers). Add Anthropic and Google adapters. Document which providers need custom formats. |
| Token cost explosion | Medium | Show pricing per model in the selector. Add token mode settings already built. Add usage tracking later. |
| Breaking existing model selection | Low | Keep backward compatibility with existing `fo-agent-model-{id}` keys. Migrate seamlessly. |
| Setup wizard needs model step | Medium | Wire the provider connection into the setup wizard's model selection step. Out of scope for this phase but noted. |

## Open Questions

- Should we add a token usage tracker visible in the UI (cost per conversation)?
- Should the "Test Connection" button actually make a real API call (costs tokens)?
- For Local/Ollama, should we auto-detect running models via the Ollama API?

## Implementation Order

```
Phase 1 (Foundation): Tasks 1, 2 → parallel
                    ↓
Phase 2 (Settings UI): Task 3 → Task 4
                    ↓
Phase 3 (Agent Selection): Tasks 5, 6 → parallel
                    ↓
Phase 4 (API Integration): Task 7 → Task 8
```
