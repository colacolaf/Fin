# Skills, Connectors & Models

**Purpose:** This directory defines the executable capabilities of Fin, the external APIs that feed them, and the LLMs that power them. It is written so a future coding agent can read it and implement the backend/frontend directly.

**Design principles:**
- A **Skill** is a discrete, testable capability that can be triggered by an agent, a user action, or a scheduled job.
- A **Connector** is a typed adapter to an external financial API or data source.
- A **Model** entry is a routing decision: which LLM should run which skill under which constraints.
- Everything is versioned, privacy-tagged, and phased (MVP → Phase 2 → Phase 3).

## File Map

| File / Directory | What it covers |
|------------------|----------------|
| `README.md` | This file. Directory overview and conventions. |
| `01_Skills_Registry.md` | Concise registry of all skills: triggers, inputs/outputs, dependencies, privacy level, phase. |
| `Skills/Investment_agent_skills` | Deep-dive methodology for every Investment Agent skill (research basis, confidence formulas, subagent pipelines). |
| `Skills/Debt_agent_skills` | Deep-dive methodology for every Debt Agent skill. |
| `Skills/Retirement_agent_skills` | Deep-dive methodology for every Retirement Agent skill. |
| `02_Connectors_Abstraction.md` | Connector interface, registry pattern, and coverage matrix. |
| `03_LLM_Selection_Matrix.md` | Model routing matrix: real current models + projected 2026 models. |
| `deprecated/` | Old monolithic spec files kept for reference. |

## How to use these docs

1. **Implementing a new skill:** Open `01_Skills_Registry.md`, copy the skill template, fill it in, then add the matching connector entry in `02_Connectors_Abstraction.md` if it touches an external API.
2. **Adding a connector:** Define the `BaseConnector` subclass in `02_Connectors_Abstraction.md`, register it in the `ConnectorRegistry`, and update the coverage matrix.
3. **Changing the default model:** Update `03_LLM_Selection_Matrix.md` and the matching environment/config defaults in the backend.

## Key conventions

- **Skill ID format:** `snake_case`, prefixed by domain when ambiguous (`investment_rebalance`, `debt_payoff_simulate`).
- **Privacy levels:**
  - `Local Only` — no external network call; runs on the user's machine.
  - `External Read` — reads data from an external API; no writes.
  - `External Write` — can mutate state at an external provider (trade, payment, contribution).
- **Phase tags:**
  - `MVP` — required for the first working version.
  - `Phase 2` — next quarter; common user needs but not launch-blocking.
  - `Phase 3` — advanced/niche; build after core loops are proven.

## Relationship to other docs

- `docs/SystemPrompts/00_universal_system_prompt.md` — tells agents how to reason.
- `docs/SystemPrompts/01-03_*_agent_system_prompt.md` — tell agents which skills to invoke and how to format outputs.
- `docs/SystemPrompts/04_User_context_file_schema.md` — the data shape connectors must produce and skills must consume.
- `docs/Backend_Architecture.md` — where connectors and skills are wired into FastAPI services.

## Status

Version: 3.0
Last updated: July 2026
