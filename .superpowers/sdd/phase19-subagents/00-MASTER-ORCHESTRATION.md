# Phase 19 — Master Orchestration: 6 Subagents

## Overview
Phase 19 (E2E Testing, Polish & Security) decomposed into 6 independently runnable subagents. Each is self-contained with its own skills, MCPs, and GitHub references. Subagents 1-4 and 5 can run in parallel (they touch different files). Subagent 6 MUST run last and depends on all others.

```
                   ┌─────────────────┐
                   │  01: E2E Core   │  Auth, Portfolio, Wizard,
                   │  Flows (specs   │  Recommendations, Debt
                   │  01-05)         │  + auth.setup.ts
                   └────────┬────────┘
                            │
                   ┌────────┴────────┐
                   │  02: E2E Adv.   │  Retirement, Execution,
                   │  Flows (specs   │  Community, Backtest,
                   │  06-11, 14)     │  Data Refresh, Settings,
                   │                 │  Cross-Agent
                   └────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────┴─────┐      ┌──────┴──────┐     ┌──────┴──────┐
  │ 03: Mobile│      │ 04: UI      │     │ 05: Security│
  │ + A11y +  │      │ Polish &    │     │ Audit &     │
  │ Lighthouse│      │ Animation   │     │ Hardening   │
  └─────┬─────┘      └──────┬──────┘     └──────┬──────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────┴────────┐
                   │  06: Integration│  Full suite run,
                   │  & Final Run    │  regressions, launch
                   │                 │  readiness report
                   └─────────────────┘
```

## Execution Order

| Order | Subagent | Can Parallel? | Depends On |
|-------|----------|---------------|------------|
| 1 | 01-e2e-core-flows | Yes (with 02) | Nothing |
| 2 | 02-e2e-advanced-flows | Yes (with 01) | Nothing |
| 3 | 03-e2e-mobile-a11y-lighthouse | Yes (with 04, 05) | 01, 02 (spec patterns) |
| 4 | 04-ui-polish-animation | Yes (with 03, 05) | Nothing (touches components, not specs) |
| 5 | 05-security-audit | Yes (with 03, 04) | Nothing (touches backend, not specs) |
| 6 | 06-integration-final-run | NO — LAST | 01, 02, 03, 04, 05 |

## Parallel Execution Strategy
**Wave 1**: Subagents 01 + 02 in parallel (both create/complete E2E specs)
**Wave 2**: Subagents 03 + 04 + 05 in parallel (mobile/a11y, UI polish, security — different file sets)
**Wave 3**: Subagent 06 alone (integration — depends on all others)

## File Ownership Matrix
| Files | Subagent |
|-------|----------|
| `frontend/e2e/specs/01-auth.spec.ts` | 01 |
| `frontend/e2e/specs/02-portfolio.spec.ts` | 01 |
| `frontend/e2e/specs/03-wizard.spec.ts` | 01 |
| `frontend/e2e/specs/04-recommendations.spec.ts` | 01 |
| `frontend/e2e/specs/05-debt.spec.ts` | 01 |
| `frontend/e2e/specs/auth.setup.ts` | 01 |
| `frontend/e2e/specs/06-retirement.spec.ts` | 02 |
| `frontend/e2e/specs/07-execution.spec.ts` (NEW) | 02 |
| `frontend/e2e/specs/08-community.spec.ts` (NEW) | 02 |
| `frontend/e2e/specs/09-backtest.spec.ts` (NEW) | 02 |
| `frontend/e2e/specs/10-data-refresh.spec.ts` (NEW) | 02 |
| `frontend/e2e/specs/11-settings.spec.ts` (NEW) | 02 |
| `frontend/e2e/specs/14-cross-agent.spec.ts` | 02 |
| `frontend/e2e/specs/12-mobile.spec.ts` | 03 |
| `frontend/e2e/specs/13-a11y.spec.ts` | 03 |
| `frontend/lighthouserc.js` | 03 |
| `frontend/playwright.config.ts` | 03, 06 |
| `frontend/e2e/fixtures/mock-data.ts` | 01, 02, 03 |
| `frontend/e2e/fixtures/api-mocks.ts` | 01, 02, 03 |
| `frontend/src/components/*.tsx` | 04 (polish) |
| `frontend/src/pages/*.tsx` | 04 (polish) |
| `frontend/src/index.css` | 04 (design tokens) |
| `backend/**/*.py` (all) | 05 (security audit) |
| `frontend/src/context/AuthContext.tsx` | 05 (auth storage audit) |
| `frontend/src/api/*.ts` | 05 (API client audit) |
| `docs/implementation/19_Launch_Readiness_Report.md` (NEW) | 06 |

## Shared Resources
These files may be touched by multiple subagents — merge carefully:

| File | Touched By | Conflict Risk |
|------|-----------|---------------|
| `frontend/playwright.config.ts` | 01, 03, 06 | Medium — coordinate project config |
| `frontend/e2e/fixtures/mock-data.ts` | 01, 02, 03 | Medium — extend without breaking existing |
| `frontend/e2e/fixtures/api-mocks.ts` | 01, 02, 03 | Low — mostly additive |
| `frontend/src/index.css` | 04 | Low — only subagent 4 |

## Per-Subagent Quick Reference

### 01 — E2E Core Flows
- **Skills**: `planning-and-task-breakdown`, `rtk-tdd`
- **MCPs**: `playwright`
- **Outputs**: 5 specs + auth.setup.ts, all passing
- **File**: `.superpowers/sdd/phase19-subagents/01-e2e-core-flows.md`

### 02 — E2E Advanced Flows
- **Skills**: `planning-and-task-breakdown`, `rtk-tdd`
- **MCPs**: `playwright`
- **Outputs**: 7 specs (4 existing + 3 new), all passing
- **File**: `.superpowers/sdd/phase19-subagents/02-e2e-advanced-flows.md`

### 03 — Mobile, A11y & Lighthouse
- **Skills**: `planning-and-task-breakdown`, `impeccable`, `ponytail`
- **MCPs**: `playwright`, `exa`
- **Outputs**: 2 specs passing + Lighthouse scores ≥ targets
- **File**: `.superpowers/sdd/phase19-subagents/03-e2e-mobile-a11y-lighthouse.md`

### 04 — UI Polish & Animation
- **Skills**: `impeccable`, `ui-animation`, `emil-design-eng`
- **MCPs**: `playwright`, `exa`
- **Outputs**: Polished components across all pages, animation system
- **File**: `.superpowers/sdd/phase19-subagents/04-ui-polish-animation.md`

### 05 — Security Audit
- **Skills**: `owasp-security-check`, `security-review`, `code-review-and-quality`, `ponytail-review`
- **MCPs**: `exa`, `playwright`
- **Outputs**: Security audit report, all Critical/High fixed
- **File**: `.superpowers/sdd/phase19-subagents/05-security-audit.md`

### 06 — Integration & Final Run
- **Skills**: `planning-and-task-breakdown`, `code-review-and-quality`, `ponytail`
- **MCPs**: `playwright`, `basic-memory`
- **Outputs**: Full suite passing, launch readiness report, git tag
- **File**: `.superpowers/sdd/phase19-subagents/06-integration-final-run.md`

## How to Run a Subagent
Each subagent brief is a self-contained prompt. To execute one:

```
Use the subagent-driven-development skill.
Read .superpowers/sdd/phase19-subagents/0X-name.md for the full brief.
Execute all tasks in order. Use the specified skills, MCPs, and GitHub references.
```

## Done Criteria (Phase 19 Complete)
- [ ] 14 E2E spec files, all passing in 3 browser projects (42 green runs)
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 85, SEO ≥ 80
- [ ] UI Polish: all pages responsive, all states covered, animations at 60fps
- [ ] Security: 0 Critical, 0 High vulnerabilities
- [ ] Launch Readiness Report complete with GO recommendation