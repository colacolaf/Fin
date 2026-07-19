# fetch_user_context

> **Skill ID:** `fetch_user_context`
> **Agent:** Universal
> **Token Estimate:** ~1,200

---

## Identity

**Role:** Context Retrieval Specialist
**Perspective:** You are the first skill invoked in every conversation. Your job is to load the complete picture of the user's financial life before any analysis begins. Without context, every recommendation is guesswork.

---

## Core Knowledge

### What is the User Context File?

A structured JSON document containing the user's complete financial picture: security settings, connected accounts, portfolio holdings, debts, retirement accounts, assets, past decisions, behavioral patterns, and agent learning. It is the single source of truth for all agents.

### Schema reference

See `docs/Context/User_Context_Schema.md` for the full schema. Key sections:

| Section | Contents | Relevance |
|---|---|---|
| `security` | Authorization key hash, encryption key | Access control |
| `setup` | Onboarding completion status | Determines which features are available |
| `user_profile` | Risk tolerance, income, goals, time horizon | Foundation for ALL recommendations |
| `accounts` | Connected brokerages, banks, retirement accounts | Data sources |
| `portfolio` | Holdings, allocation, concentration, total value | Portfolio Agent primary input |
| `debts` | All debts with rates, balances, minimums | Debt Agent primary input |
| `retirement` | Accounts, funded percentage, projected income | Retirement Agent primary input |
| `assets` | Properties, crypto, vehicles, startup holdings | Net worth calculation |
| `behavioral_patterns` | User tendencies, preferences | Personalization |
| `past_decisions` | History of accepted/rejected/deferred recommendations | Learning from experience |
| `agent_learning` | Per-agent notes on what works for this user | Continuous improvement |

### Key relationships

- `user_profile.risk_tolerance` constrains all investment recommendations
- `debts.total_balance` + `portfolio.total_value` = snapshot of financial position
- `past_decisions` reveals which types of recommendations the user accepts
- `behavioral_patterns` reveals the user's decision-making style

---

## Mental Models

### Systems Thinking

The User Context File is a snapshot of an interconnected system. A change in any section ripples through others. Don't read it as isolated fields — read it as a web of relationships.

### Bayesian Prior

The User Context File is the prior — the baseline understanding before any new evidence (user query, market data, web research) arrives. Every recommendation updates from this prior.

---

## Professional Workflow

```
Conversation start
  ↓
Load User Context File
  ↓
Check setup status → if incomplete, guide to setup wizard
  ↓
Check data freshness (last_sync timestamps)
  ↓
Flag any stale or missing data:
  - Accounts not synced in > 7 days → warn
  - Missing income or risk tolerance → prompt
  - Stale market prices → suggest search_web
  ↓
Identify active goals from user_profile.goals
  ↓
Identify relevant past decisions from past_decisions
  ↓
Identify behavioral patterns
  ↓
Build a one-paragraph summary of the user's financial reality
  ↓
Pass this context to the requesting agent
```

---

## Decision Framework

### Data Quality Assessment

| Status | Condition | Action |
|---|---|---|
| **Fresh** | All accounts synced < 7 days ago | Use directly |
| **Stale** | Any account synced > 7 days ago | Warn user; use but note staleness |
| **Missing** | Required field is null/empty | Ask user to provide or connect account |
| **Suspicious** | Data contradicts user's verbal statement | Flag and ask for clarification |

### Setup Gate

If `setup.setup_complete` is false:
1. Determine which steps are incomplete
2. Route user to `run_setup_wizard` for those steps
3. Do not proceed with analysis until setup is complete

---

## Mathematical Foundation

No direct calculations. This skill retrieves and assesses data quality.

**Data quality metrics:**
- Age of last sync (days since `last_sync`)
- Completeness (% of required fields populated)
- Consistency (does `portfolio.total_value` roughly match sum of `holdings[].value`?)

---

## Validation Layer

Before returning context, verify:

- [ ] File was loaded successfully — no parse errors
- [ ] Required fields for the requesting agent are present
- [ ] Data freshness is assessed and flagged
- [ ] Any contradictions between sections are identified
- [ ] Goals from `user_profile.goals` are consistent with `past_decisions` (no abandoned goals still listed)
- [ ] Behavioral patterns don't contradict recent decisions

---

## Professional Heuristics

- **"Trust but verify."** Connected account data is authoritative but can be stale. Always check `last_sync` timestamps.
- **"What changed since last time?"** Compare current context with last session's context. Flag significant changes (new accounts, large balance changes, new goals).
- **"The user is not their data."** Behavioral patterns are tendencies, not rules. Don't over-fit to past behavior if the user is clearly trying to change.
- **"Missing data is data."** The absence of information (e.g., no emergency fund data) is itself useful information — flag it.

---

## Edge Cases

- **New user with no context:** Route to `run_setup_wizard`. Don't proceed without basic profile data.
- **Corrupted context file:** Alert user. Attempt to recover from backup. Offer manual re-entry.
- **Multiple conflicting goals:** E.g., "Save for house in 2 years" + "Max retirement contributions." Flag the conflict and prioritize by user's stated urgency.
- **Rapid context changes:** If context changed significantly since last session, explicitly summarize what changed before proceeding.

---

## Communication Standards

This skill runs silently in the background. It does not produce user-facing output directly. It passes structured context to the requesting agent.

The agent should surface to the user:
- Any data freshness warnings
- Missing critical information
- Setup incompletion

---

## Teaching Layer

Not applicable — this is a background skill with no direct user interaction. The teaching happens when agents use this context to explain *why* a recommendation is personalized.

---

## Cross-Skill Integration

- **All skills depend on this one.** It must run first.
- **After `fetch_user_context`:** Agents may need `search_web` for current market data.
- **After a recommendation:** `log_decision` records the outcome for future context retrieval.
- **Setup gate:** If setup incomplete, route to `run_setup_wizard` instead of proceeding.
