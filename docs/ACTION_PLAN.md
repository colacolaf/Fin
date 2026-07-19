# Fin — Action Plan

> Last updated: July 19, 2026
>
> Prioritized, actionable roadmap. Each phase is ordered by impact × effort.

---

## Phase 1 — Wire Settings to Chat 🔴 HIGH PRIORITY

> **Problem:** Agent settings are stored but never reach the chat. Toggles have zero effect on behavior.

### 1.1 Web Search Toggle → Thinking Hook

- **File:** `lib/agents/use-agent-thinking.ts`
- **What:** Read `fo-web-search` from localStorage. When enabled, inject `"You have web search access. Use it to verify current market data, news, and prices."` into the system prompt. When disabled, inject `"You do NOT have web search access. Only use your training knowledge."`
- **Settings storage:** `fo-web-search` (string: `"on"` | `"off"`)
- **Effort:** Small (~20 lines)

### 1.2 Agent Constraints → System Prompt

- **Files:** `lib/agents/use-agent-thinking.ts`, `lib/agent-settings/data.ts`
- **What:** Read `fo-agent-constraints-{id}` per agent. Inject enabled constraints into the system prompt as `## Constraints` section. Each constraint as a bullet point preceded by `- [Constraint]`.
- **Already built:** `getAgentConstraints()` returns `AgentConstraint[]` with `enabled` flag. `RECOMMENDED_CONSTRAINTS` has 6 per agent as defaults. System prompt builder `buildSystemPrompt()` exists and accepts multiple sections.
- **Effort:** Small (~30 lines — read constraints, filter enabled, inject into prompt)

### 1.3 Agent Learning → System Prompt

- **Files:** `lib/agents/use-agent-thinking.ts`, `lib/agent-settings/data.ts`
- **What:** Read `fo-agent-learning-{id}` per agent. Inject notes into system prompt as `## What I've Learned About You` section.
- **Already built:** `getAgentLearning()` returns `string[]`. `RECOMMENDED_LEARNING` has 3 defaults per agent.
- **Effort:** Small (~15 lines)

### 1.4 Memory Page System Prompt Edits → Agent

- **Files:** `lib/memory/data.ts`, `lib/agents/use-agent-thinking.ts`
- **What:** Memory page has a system prompt editor that saves to `fo-system-prompts` in localStorage. `useAgentThinking` currently uses hardcoded mock responses. Wire it so edited prompts override the default base prompt. The `buildSystemPrompt()` function should check for a stored prompt first.
- **Already built:** Memory page UI, `saveSystemPrompt()` / `getSystemPrompt()` in `lib/memory/data.ts`.
- **Effort:** Small (~15 lines)

### 1.5 Memory User Context → System Prompt

- **Files:** `lib/memory/data.ts`, `lib/agents/use-agent-thinking.ts`
- **What:** `buildUserContextFile()` generates a user context object (portfolio, debts, retirement all currently `null`). Pass this context into the system prompt so the agent knows the user's current financial state. Populate it from synced connector data.
- **Already built:** `buildUserContextFile()` exists, connector sync data flows to hooks.
- **Effort:** Medium (~40 lines — read synced data, populate context, inject into prompt)

---

## Phase 2 — Desktop Notifications 🔴 HIGH PRIORITY

> **Problem:** Notification framework exists but nothing fires them. No real triggers.

### 2.1 Notification Triggers — Debt Payoff Milestones

- **Files:** `lib/debt/data.ts`, `components/dashboard/dashboard-page.tsx`
- **What:** When debt data is synced, check if any debt item is paid off or a milestone is reached (25%, 50%, 75%, 100%). Fire `notify("Debt Milestone", "Credit Card is 50% paid off!", "debt_milestone")`.
- **Effort:** Medium (~30 lines — milestone detection + trigger)

### 2.2 Notification Triggers — Agent Task Complete

- **Files:** `lib/agents/use-agent-thinking.ts`
- **What:** After `finishCall()` completes, fire `notify("Agent Task Complete", "Portfolio Agent finished analyzing your holdings.", "agent_task_complete")`. Only if the user has navigated away from the chat tab.
- **Effort:** Small (~15 lines — check document visibility, fire notify)

### 2.3 Notification Triggers — Retirement Contribution Reminders

- **Files:** `lib/retirement/data.ts`, `lib/notifications/types.ts`
- **What:** Add `retirement_reminder` event type. When retirement data shows employer match not fully captured, fire a reminder.
- **Already built:** `NotificationProvider` wraps the app, `notify()` function exists.
- **Effort:** Small (~20 lines + new event type)

### 2.4 Permission Flow Polish

- **Files:** `components/notifications/notification-center.tsx`
- **What:** Show a one-time onboarding prompt: "Finance OS can send desktop notifications for agent updates and milestones. Allow?" on first dashboard load if permission is `"default"`.
- **Effort:** Small (~20 lines)

---

## Phase 3 — Dashboard Polish 🟡 MEDIUM PRIORITY

> **Problem:** Dashboard is too tall, loading screen fires on every nav, fullscreen pages don't route back.

### 3.1 Compact Dashboard Layout

- **Files:** `components/dashboard/dashboard-page.tsx`
- **What:** Move Debt + Allocation side-by-side in a 2-col row. Reduce MiniChart height. Push news inline with portfolio. Shrink the retirement widget height. Target: fit on one screen at 1440px.
- **Effort:** Medium (~50 lines — grid restructure)

### 3.2 Loading Screen — First Open Only

- **Files:** `components/loading-screen.tsx`, `app/page.tsx`
- **What:** Store `fo-app-opened` flag in localStorage. Only show loading screen if flag is falsy. Set it after first load completes. On subsequent opens, go straight to dashboard.
- **Effort:** Small (~15 lines)

### 3.3 Fullscreen Collapse → Dashboard

- **Files:** `app/portfolio/full/page.tsx`, `app/debt/full/page.tsx`, `app/retirement/full/page.tsx`
- **What:** The collapse/minimize button on fullscreen pages currently doesn't navigate anywhere useful. It should `router.push("/")` back to the dashboard.
- **Effort:** Small (~10 lines per file)

### 3.4 Retirement Dashboard Card

- **Files:** `components/retirement/retirement-widget.tsx`
- **What:** The retirement widget already exists but could be more compact + use real synced data better. Ensure it displays: readiness %, projected monthly income, employer match status.
- **Partially done:** Widget reads from `useRetirementConnection` but data flow could be tightened.
- **Effort:** Small (~20 lines — data wiring verification)

---

## Phase 4 — Missing Features 🔴 HIGH PRIORITY

### 4.1 Trade Execution UI

- **Files:** Create `components/portfolio/trade-execution-modal.tsx`
- **What:** When user says "execute trade" in chat, show a modal requiring: authorization key re-entry, trade details (symbol, shares, price), confirmation checkbox ("I understand this is a real trade"), and Execute / Cancel buttons.
- **Requirements from system prompt:** "Before any trade executes, the user must enter the authorization key and confirm."
- **Paper trading toggle:** If `fo-paper-trading` is enabled, show "PAPER TRADE" banner instead of real execution.
- **Effort:** Large (~150 lines — modal, auth validation, paper/real mode)

### 4.2 Debt vs Invest Page

- **Files:** Existing `components/debt/debt-vs-invest-modal.tsx` exists, needs a standalone page
- **What:** Create `app/debt-vs-invest/page.tsx` with full comparison: side-by-side projections (pay debt vs invest), interest saved vs gains, break-even analysis, recommendation.
- **Already built:** Modal component exists with basic analysis logic.
- **Effort:** Medium (~80 lines — extract modal logic into shared hook, build page)

### 4.3 Setup Wizard — Auth Key Validation

- **Files:** `components/setup/setup-wizard.tsx`, `lib/setup/validation.ts`
- **What:** Enforce: minimum 12 chars, 1 uppercase, 2 special characters. Show strength meter. Don't allow "Next" until valid.
- **Already built:** `lib/setup/validation.ts` has password rules and strength calculation.
- **Effort:** Small (~30 lines — wire validation to wizard step)

### 4.4 Setup Wizard — LLM Selection Skip

- **Files:** `components/setup/setup-wizard.tsx`
- **What:** "Select LLM" step needs a "Skip for now" button and more model choices beyond just Llama 3.1.
- **Already built:** Provider registry has 11 providers with models.
- **Effort:** Small (~20 lines)

---

## Phase 5 — Polish & Consistency 🟢 LOW PRIORITY

### 5.1 Sidebar Consistency

- **Files:** `components/app-sidebar/`, all fullscreen pages
- **What:** Fullscreen portfolio/debt/retirement pages use legacy sidebars instead of `AppSidebar`. Replace all with `AppSidebar`.
- **Effort:** Small (~5 lines per page, 3 pages)

### 5.2 Dead Routes Audit

- **Files:** All link components, `lib/nav.ts`
- **What:** Audit every `<Link>` and `router.push` for routes that don't exist. Remove dead links, add missing routes.
- **Known dead:** `/skills` link removed from popover but may exist elsewhere.
- **Effort:** Small (grep + manual check)

### 5.3 Save Button Feedback Consistency

- **Files:** All settings pages
- **What:** Every "Save" button should show a green "Saved ✓" badge for 2.5s on success. Standardize across Settings, Agent Settings, Memory page.
- **Effort:** Small (~10 lines per page)

### 5.4 Allocation Graph Load Performance

- **Files:** `components/portfolio/allocation-card.tsx`
- **What:** Graph stalls briefly before rendering. Check for blocking operations, add `React.memo`, verify no synchronous heavy computation.
- **Effort:** Small (investigation + minor fixes)

### 5.5 Session Timer Stop Control

- **Files:** `components/agent-chat/agent-chat-full.tsx`
- **What:** Timer runs forever until navigating away. Add a stop/pause button next to the timer.
- **Effort:** Small (~15 lines)

### 5.6 Voice Input Browser Fallback

- **Files:** `components/agent-chat/chat-composer.tsx`
- **What:** Web Speech API only works in Chrome/Edge. Show a message for Firefox/Safari: "Voice input requires Chrome or Edge."
- **Effort:** Small (~10 lines)

### 5.7 Voice Output → Voice Input

- **Files:** `components/settings/settings-page.tsx`
- **What:** Settings page has "Voice output" toggle. Should be "Voice input" since we use speech-to-text, not text-to-speech.
- **Effort:** Tiny (label change)

---

## Phase 6 — Real Connector Integrations 🔴 FUTURE (Blocked on Backend)

> **These items are documented in detail at the top of `docs/TODO.md`. They require a backend server and are NOT actionable in the current frontend-only architecture.**

### 6.1 Plaid Link Flow
### 6.2 Brokerage OAuth Flows
### 6.3 Retirement Provider Auth
### 6.4 Crypto API Key Flow
### 6.5 Statement Import Flow
### 6.6 Remove Fake Connect Button

---

## Quick Wins (do anytime, < 10 lines each)

- [ ] **"Last synced" time on dashboard** — Replace hardcoded `"5m ago"` with actual timestamp from most recent `fo-connector-sync-times`
- [ ] **Analytics — strategies from user context** — Read actual strategies instead of hardcoded descriptions
- [ ] **Analytics — connector status from real providers** — Verify each card uses `useConnectors()` not hardcoded state
- [ ] **Retirement chart data** — Wire synced retirement data into the chart component
- [ ] **Loading screen carousel** — Add dismiss button for repeat visitors

---

## Legend

| Phase | Priority | Status |
|---|---|---|
| Phase 1 | 🔴 High | Not started — wire settings to chat |
| Phase 2 | 🔴 High | Partially built — framework exists, needs triggers |
| Phase 3 | 🟡 Medium | Partially built — dashboard exists, needs polish |
| Phase 4 | 🔴 High | Not started — missing features |
| Phase 5 | 🟢 Low | Not started — polish |
| Phase 6 | 🔴 Future | Blocked on backend |
| Quick Wins | 🟢 Low | Not started |
