# Skills Registry

> **Version:** 2.0 — Institutional Knowledge System
> **Architecture:** Skills are rich documents the AI reads at invocation time. Each skill contains identity, mental models, workflows, math, validation rules, heuristics, and teaching layers.
> **Research:** See `docs/Skills/Research_Report.md` for the full analysis and rationale.

---

## How Skills Work

When a user invokes a skill (e.g., `/portfolio_analyze`), the AI:
1. Reads the skill document to absorb its institutional knowledge
2. Follows the embedded professional workflow
3. Applies the mental models and decision frameworks
4. Self-validates using the validation checklist
5. Delivers output following communication standards

---

## Foundation Documents (All Agents)

| Document | Purpose | Path |
|---|---|---|
| **Financial Math** | Shared formulas, assumptions, edge cases, common mistakes | `docs/Skills/shared/financial_math.md` |
| **Validation Framework** | Cross-cutting self-validation pipeline (7 layers) | `docs/Skills/shared/validation_framework.md` |
| **Communication Standards** | Output structure, tone rules, uncertainty handling | `docs/Skills/shared/communication_standards.md` |
| **F.I.R.M. Framework v2** | Expanded reasoning framework with 10 mental models | `docs/SystemPrompts/00_universal_system_prompt.md` |

---

## Universal Skills

Skills available to all agents. Triggered automatically or on demand.

| Skill ID | Label | Rich Doc | Tokens | Trigger |
|---|---|---|---|---|
| `fetch_user_context` | Fetch User Context | [`universal/fetch_user_context.md`](universal/fetch_user_context.md) | ~1,200 | Start of every conversation |
| `search_web` | Search Web | [`universal/search_web.md`](universal/search_web.md) | ~1,800 | Confidence < 80% on material facts |
| `log_decision` | Log Decision | [`universal/log_decision.md`](universal/log_decision.md) | ~1,500 | User accepts/rejects/defers recommendation |
| `send_desktop_notification` | Desktop Notifications | [`universal/send_desktop_notification.md`](universal/send_desktop_notification.md) | ~1,200 | Agent task complete, milestones, reminders |

---

## Portfolio Agent Skills

> **Agent Doc:** `docs/Skills/portfolio/Portfolio_Agent.md` (loaded at agent session start)
> **System Prompt:** `docs/SystemPrompts/01_portfolio_agent.md`

| Skill ID | Label | Rich Doc | Tokens | Status |
|---|---|---|---|---|
| `portfolio_analyze` | Portfolio Analyzer | `portfolio/portfolio_analyze.md` | ~2,400 | ✅ Complete |
| `rebalance_recommend` | Rebalance Recommender | `portfolio/rebalance_recommend.md` | ~2,400 | ✅ Complete |
| `value_private_asset` | Value Private Asset | `portfolio/value_private_asset.md` | ~2,200 | ✅ Complete |
| `execute_trade` | Execute Trade | `portfolio/execute_trade.md` | ~2,000 | ✅ Complete |
| `enable_paper_trading` | Paper Trading | `portfolio/enable_paper_trading.md` | ~1,500 | ✅ Complete |

---

## Debt Agent Skills

> **Agent Doc:** `docs/Skills/debt/Debt_Agent.md` (loaded at agent session start)
> **System Prompt:** `docs/SystemPrompts/02_debt_agent.md`

| Skill ID | Label | Rich Doc | Tokens | Status |
|---|---|---|---|---|
| `debt_payoff_simulate` | Payoff Simulator | `debt/debt_payoff_simulate.md` | ~2,200 | ✅ Complete |
| `debt_vs_invest_analyze` | Debt vs Invest | `debt/debt_vs_invest_analyze.md` | ~2,200 | ✅ Complete |

---

## Retirement Agent Skills

> **Agent Doc:** `docs/Skills/retirement/Retirement_Agent.md` (loaded at agent session start)
> **System Prompt:** `docs/SystemPrompts/03_retirement_agent.md`

| Skill ID | Label | Rich Doc | Tokens | Status |
|---|---|---|---|---|
| `retirement_readiness_score` | Readiness Score | `retirement/retirement_readiness_score.md` | ~2,300 | ✅ Complete |
| `match_capture_recommend` | Match Capture | `retirement/match_capture_recommend.md` | ~1,800 | ✅ Complete |

---

## Skill Document Template

Every skill document follows this structure (see any `universal/` doc for the completed pattern):

1. **Identity** — Professional role, perspective, specialization
2. **Core Knowledge** — Foundational concepts, terminology, relationships
3. **Mental Models** — Which reasoning frameworks apply and how
4. **Professional Workflow** — Step-by-step from input to output
5. **Decision Framework** — Domain-specific trees, criteria, scoring
6. **Mathematical Foundation** — Formulas, assumptions, edge cases
7. **Validation Layer** — Self-checking checklist before delivery
8. **Professional Heuristics** — Shortcuts, rules of thumb, diagnostic questions
9. **Edge Cases** — When standard approaches fail
10. **Communication Standards** — How to present the output
11. **Teaching Layer** — Explanations at multiple expertise levels
12. **Cross-Skill Integration** — When to consult other skills

---

## Token Budget

| Category | Count | Avg Tokens | Total |
|---|---|---|---|
| Universal skills | 4 | ~1,400 | ~5,700 |
| Portfolio skills | 5 | ~2,500 | ~12,500 |
| Debt skills | 2 | ~2,500 | ~5,000 |
| Retirement skills | 2 | ~2,500 | ~5,000 |
| Shared foundation docs | 3 | ~2,000 | ~6,000 |
| **Total** | **13 skills + 3 shared** | | **~34,200** |

*Skills are loaded on-demand, not all at once. A typical conversation loads 1–3 skills plus foundation docs (~5,000–10,000 tokens).*

---

## Status Legend

| Status | Meaning |
|---|---|
| ✅ Complete | Rich skill doc written and ready |
| Pending | Placeholder exists; rich doc not yet written |
| Locked | Community marketplace — not yet available |
