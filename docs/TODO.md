# Fin — Remaining Work

> Last updated: July 18, 2026

---

## 🔴 CRITICAL — Connectors Are NOT Real Integrations

> **The `Connect` button on the `/connectors` page does NOT actually
> integrate with any provider.** Clicking it only writes the provider ID
> to `localStorage` (`fo-connector-status`, `fo-connected-providers`) and
> marks the card as connected in the UI. **No data flows.** No OAuth.
> No API handshake. No real syncing. This is a UI affordance only and
> is intentionally misleading until each provider's official integration
> is built and wired.

### Real connection flow per provider category

Each connector must be connected through its own **official** authentication and data-delivery mechanism. A single `Connect` button click is **never** the right interaction.

| Category | Real method | What we must build |
|---|---|---|
| **Bank / Checking / Savings / Credit Card** | **Plaid Link** OAuth-style flow | Launch Plaid Link from a real `link_token` issued by our backend; user selects institution, logs in with Plaid credentials, returns `public_token`; backend exchanges for `access_token`; store encrypted in `fo-plaid-access-tokens`. |
| **Brokerage / Stocks / ETFs** | **Brokerage-specific OAuth** (Schwab, Fidelity, IBKR, Robinhood, Alpaca) | Each brokerage has its own OAuth 2.0 endpoint and approval flow. Schwab requires developer portal app + manual token-generation. Alpaca supports API key + secret (no OAuth). Never simulate. |
| **Retirement (401k / IRA / 403b)** | **Provider-specific** — Empower, Fidelity, Vanguard, TIAA. Usually requires an **employer plan ID** + **participant credentials** or **plan-sponsor API access**. | Build per-provider auth flow. Most retirement providers do NOT expose public OAuth. Some require the user to manually generate a read-only data export and upload. |
| **Crypto** | **Exchange API keys** (Coinbase, Kraken, Gemini) — user-pasted, never OAuth | User pastes API key + secret (with read-only scope). Backend encrypts and stores. Keys never leave the device except via the encrypted local export. |
| **Loans** | **Lender portals** (SoFi, Navient, Sallie Mae, Rocket Mortgage) — most do NOT offer third-party APIs | Build a manual statement-import flow: user downloads CSV/PDF from lender portal, drags into Finance OS, we parse and append. No "Connect" button should even exist for these. |

### What changes when we wire real integrations

1. **Remove the fake `connect()` mutation** from `lib/settings/use-connectors.ts` (currently flips `localStatus` and creates a fake link). Replace with a per-provider flow component.
2. **Build `PlaidLinkFlow`** in `components/connectors/flows/plaid/` — wraps `react-plaid-link`, handles the full handshake.
3. **Build `BrokerageOAuthFlow`** — opens a backend-issued auth URL in a hidden iframe or popup, polls for callback, stores encrypted token.
4. **Build `ApiKeyFlow`** — paste-key-with-validation modal for crypto + developer-style brokers (Alpaca). Stores encrypted in `fo-api-keys` only after a real `POST` to our backend to verify the key.
5. **Build `StatementImportFlow`** — drag-and-drop CSV/PDF for lenders without an API.
6. **Update the connector card UI** — replace the unconditional `onClick={connect}` with a router-push to `/connectors/{id}/flow` that shows the right flow per category. Disable the button + show "Coming soon" if no flow is built yet.
7. **Update `useConnectors()`** — read only from real localStorage state after a flow completes. No optimistic fake-connected state.

### Source-of-truth invariant

**The only way a connector should show as `connected` in the UI is if a backend verified integration has written its real `access_token` / `api_key` to the encrypted store AND our backend has been able to fetch at least one successful data response from that provider.** Until then, the card must show as `disconnected` regardless of any UI toggle the user clicks.

**Until each provider's real flow is built, the Connect button should be removed entirely — it should never appear clickable. Showing it without a real backend is worse than not showing it at all.**

---

## 🟡 Agent Chat

- [ ] **Wire web search toggle to thinking hook** — `fo-web-search` is stored but `useAgentThinking` never reads it. Toggle has zero effect on agent behavior.
- [ ] **Wire agent constraints to chat** — `fo-agent-constraints-{id}` stored in agent settings but not included in system prompt / thinking flow.
- [ ] **Wire agent learning to chat** — `fo-agent-learning-{id}` stored but not fed into agent context.
- [ ] **Voice input browser fallback** — Web Speech API only works in Chrome/Edge. Need a graceful degradation message or polyfill.
- [ ] **Ghost model in state** — `buildDefaultModelSettingsState` assigns `availableModels[0]` even when `modelId` is null. Not a runtime bug but inconsistent state.
- [ ] **Session timer stops on unmount only** — Timer runs forever until navigating away. Consider adding a stop/pause control.

---

## 🔴 Settings Page

- [ ] **Notifications don't fire** — Toggles in Settings → Notifications are stored to localStorage but never trigger actual desktop notifications.
- [ ] **AI Models reads from localStorage** — Model selector should show the model that's actually selected (`fo-primary-model`, `fo-agent-model-{id}`), not hardcoded defaults.
- [ ] **Voice output → Voice input** — Settings page still shows voice output toggle; should be voice input control.

---

## 🔴 Analytics Page

- [ ] **Agent strategies from user context** — Hardcoded strategy descriptions (DCA + rebalancing quarterly, etc.) should read from `buildUserContextFile()`.
- [ ] **Connector status from real providers** — Now wired via `useConnectors()`. Verify each card reflects the connector's *verified* integration, not a fake-connect toggle.

---

## 🟡 Memory Page

- [ ] **System prompt edits don't affect agent** — Edits to system prompts are saved to `fo-system-prompts` but `useAgentThinking` uses hardcoded mock responses. Needs wiring.
- [ ] **User context needs backend population** — Portfolio, debts, retirement sections are all `null`. These need real data from connected accounts.

---

## 🟡 Setup Wizard

- [ ] **API key input → actual storage** — Keys pasted in the wizard need to write to `fo-auth-key`, `fo-encryption-key`, and `fo-api-keys` correctly.
- [ ] **Connector setup flow** — "Connect accounts" step must build the per-provider official integrations listed at the top of this doc. No toggles.
- [ ] **Authorization key validation** — Require 1 capital, 2 special characters, minimum length for the auth key step.
- [ ] **Skip option for LLM selection** — "Select LLM" step needs a Skip option and more model choices.

---

## 🔴 Dashboard

- [ ] **Scroll / compact layout** — Dashboard is too tall; need to move debt + allocation side-by-side, reduce graph sizes, push news inline with portfolio.
- [ ] **Fullscreen collapse routing** — Pressing collapse on fullscreen portfolio/debt/retirement should return to the main dashboard, not a standalone page.
- [ ] **Loading screen fires on every dashboard load** — Should only show on first app open, not on every navigation back to dashboard.

---

## 🔴 Missing Pages / Sections

- [ ] **Retirement dashboard card** — Only the fullscreen retirement page exists. Need a compact card for the main dashboard.
- [ ] **Trade execution UI** — System prompt requires authorization key + confirmation before trades. No UI exists for this.
- [ ] **Debt vs Invest comparison** — No page/section for comparing payoff vs invest strategies.

---

## 🔴 Desktop Notifications

- [ ] **Notification framework** — No desktop notification system exists. Needs to fire on: agent task complete, debt payoff milestones, retirement contribution reminders.
- [ ] **Permission flow** — Browser notification permission request on first use.

---

## 🟡 Connectors Page

- [x] **Status reflects localStorage only** — Catalog no longer hardcodes "connected"; merged via `useConnectors()`. UI matches real state.
- [ ] **Connect button → real flow** — Replace the unconditional `onClick={connect}` with a per-provider flow component (Plaid / OAuth / API key / Statement import) — see top of this doc.
- [ ] **Connect / Disconnect real flow** — Buttons must never mutate `fo-connected-providers` optimistically. Only after a real backend-issued handshake completes.
- [ ] **Sync button real behavior** — Currently simulates 2-3s delay. Needs real API call when backend is ready.

---

## 🟢 General / Polish

- [ ] **Dead routes** — `/skills` link was removed from SettingsPopover (route doesn't exist). Audit all links for valid routes.
- [ ] **Allocation graph load time** — Graph stalls briefly before rendering. Check for unnecessary re-renders or blocking operations.
- [ ] **Sidebar consistency** — Fullscreen pages should all show the same AppSidebar instead of legacy sidebars.
- [ ] **Save buttons everywhere** — Verify all Settings → Save buttons persist to localStorage and survive page reloads.
- [ ] **"Save Changes" button feedback** — Settings page save confirmation should be consistent (green "Saved" badge for 2.5s).

---

## Legend

- 🔴 Not started / critical
- 🟡 In progress / partially done
- 🟢 Complete
