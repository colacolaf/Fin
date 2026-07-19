# Fin — Remaining Work

> Last updated: July 18, 2026

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
- [ ] **Connector status from real providers** — Already partially wired via `useConnectors()`; verify all statuses reflect `fo-connected-providers`.

---

## 🟡 Memory Page

- [ ] **System prompt edits don't affect agent** — Edits to system prompts are saved to `fo-system-prompts` but `useAgentThinking` uses hardcoded mock responses. Needs wiring.
- [ ] **User context needs backend population** — Portfolio, debts, retirement sections are all `null`. These need real data from connected accounts.

---

## 🟡 Setup Wizard

- [ ] **API key input → actual storage** — Keys pasted in the wizard need to write to `fo-auth-key`, `fo-encryption-key`, and `fo-api-keys` correctly.
- [ ] **Connector setup flow** — "Connect accounts" step needs actual OAuth or key-based connection (Plaid, etc.), not just toggles.
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

- [ ] **Connect / Disconnect real flow** — Buttons toggle `fo-connected-providers` but don't trigger actual OAuth or API connection to Plaid/Yodlee/etc.
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
