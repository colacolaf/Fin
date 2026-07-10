# MEMORY SYSTEM — basic-memory MCP-NATIVE SPECIFICATION

**Version**: 2.0 | **Purpose**: Replace custom DB memory with basic-memory MCP | **Last Updated**: July 2026

---

## 1. OVERVIEW

The Memory System stores agent decisions, user preferences, and behavioral patterns as local, Obsidian-compatible markdown files via [basic-memory](https://github.com/basicmachines-co/basic-memory). No custom database. No SQL schema. Agents read/write memory through MCP tool calls. Users browse/edit memory in Obsidian.

### Key Principles

- **MCP-native**: All memory CRUD via `basic-memory` MCP tools. No custom API endpoints.
- **Obsidian-compatible**: Every memory node is a markdown file with YAML frontmatter. User opens folder in Obsidian = full memory browsing.
- **Local-first**: All `.md` files stored in `~/.fin/memory/`. No cloud sync. No server dependency.
- **Semantic retrieval**: Obsidian Smart Connections plugin handles embedding-based similarity search.
- **Edges via wikilinks**: `[[wikilinks]]` in note body connect related memories. No graph DB.

---

## 2. ARCHITECTURE

```
┌──────────────────────────────────────────────┐
│              FIN BACKEND (FastAPI)            │
│                                              │
│  Agent writes memory via MCP:                │
│  mcp__basic-memory__create_note(...)          │
│                                              │
│  Agent reads memory via MCP:                 │
│  mcp__basic-memory__search_notes("query")     │
│                                              │
│  Frontend reads via MCP (same tools):         │
│  mcp__basic-memory__list_notes(...)           │
│  mcp__basic-memory__read_note(...)            │
└──────────────┬───────────────────────────────┘
               │  MCP protocol
               ▼
┌──────────────────────────────────────────────┐
│           basic-memory MCP Server            │
│                                              │
│  Storage: ~/.fin/memory/                     │
│  ├── decisions/          (user votes)        │
│  ├── recommendations/    (agent outputs)     │
│  ├── preferences/        (explicit prefs)    │
│  ├── patterns/           (auto-detected)     │
│  └── user-context.md     (shared context)    │
│                                              │
│  Search: Full-text + semantic (embeddings)   │
│  Relations: [[wikilinks]] parsing            │
└──────────────┬───────────────────────────────┘
               │  File system
               ▼
┌──────────────────────────────────────────────┐
│         ~/.fin/memory/ (local disk)          │
│                                              │
│  Obsidian-compatible markdown vault          │
│  User opens this folder in Obsidian          │
│  Smart Connections plugin for embeddings     │
└──────────────────────────────────────────────┘
```

### No Custom DB

Delete Section 526–564 (Database Schema) from old spec. basic-memory handles persistence. Markdown files ARE the database. Git-trackable. User-editable.

---

## 3. MEMORY NODE TYPES

### 3.1 Directory Structure

```
~/.fin/memory/
├── .obsidian/                  # Obsidian config (auto-generated)
├── recommendations/            # Agent output
│   ├── 2026-07-09-trim-nvda.md
│   ├── 2026-07-08-tax-loss-harvest.md
│   └── ...
├── decisions/                  # User votes
│   ├── 2026-07-09-accepted-trim-nvda.md
│   └── ...
├── preferences/                # Explicit user preferences
│   ├── risk-tolerance.md
│   ├── investment-pace.md
│   └── ...
├── patterns/                   # Auto-detected behavioral patterns
│   ├── prefers-gradual-changes.md
│   ├── loss-aversion-detected.md
│   └── ...
└── user-context.md             # Shared user context file
```

### 3.2 Recommendation Note Template

```markdown
---
title: "Trim NVDA from 22% to 19%"
type: recommendation
agent: investment
confidence: 83
created: 2026-07-09
skill: ConcentratedPosition
tags:
  - concentration-risk
  - tech-sector
  - rebalancing
---

# Trim NVDA from 22% to 19%

**Agent:** Investment
**Confidence:** 83/100
**Skill:** [[../skills/ConcentratedPosition.md|ConcentratedPosition]]

## What Was Recommended
Reduce NVDA position from 22% to 19% of portfolio. Redeploy proceeds into VXUS (international diversification).

## Why
- NVDA concentration (22%) exceeds 15% single-holding threshold
- Tech sector at 38% vs S&P 500 tech weight of 28%
- VXUS adds international exposure lacking in current portfolio

## Impact
| Metric | Before | After |
|--------|--------|-------|
| Concentration | 22% | 19% |
| Diversification score | 62 | 74 |
| Est. tax | $0 | $1,200 (LTCG) |

## Risks
- NVDA could continue outperforming; trimming caps upside
- VXUS has underperformed US equities historically

## Follow-up
See decision: [[../decisions/2026-07-10-accepted-trim-nvda.md]]
```

### 3.3 Decision Note Template (User Vote)

```markdown
---
title: "Accepted: Trim NVDA"
type: decision
agent: investment
status: accepted
voted_at: 2026-07-10
decision_speed_days: 1
triggered_by: "[[../recommendations/2026-07-09-trim-nvda.md]]"
tags:
  - accepted
  - rebalancing
---

# Accepted: Trim NVDA from 22% to 19%

**Status:** Accepted
**Voted:** 2026-07-10 (1 day after recommendation)

## User Reasoning
"Makes sense, NVDA has run up a lot. I'll trim gradually over 3 months."

## Impact on Behavior
- Reinforces pattern: user accepts concentration-reduction recommendations
- Pace preference: 3% trim, not aggressive 10%+ shift
- Decision speed: fast (1 day) for math-clear recommendations

## Related
- Previous trim: [[2026-06-15-accepted-trim-aapl.md]]
- Pattern: [[../patterns/prefers-gradual-changes.md]]
```

### 3.4 Preference Note Template

```markdown
---
title: "Risk Tolerance: Balanced"
type: preference
domain: risk
source: setup_wizard
created: 2026-06-01
updated: 2026-07-05
confidence: 95
tags:
  - risk
  - conservative
---

# Risk Tolerance: Balanced

**Current:** Balanced (60% stocks / 40% bonds)
**Source:** Set during setup wizard, confirmed through 8 decisions

## Evidence
- Set "Balanced" in setup wizard (2026-06-01)
- Rejected aggressive 22%→12% trim (prefers gradual)
- Accepted 22%→19% trim (3% shift)
- 6 of 8 accepted recommendations were conservative-to-moderate

## Agent Implications
- Don't propose allocation shifts >5% at once
- Prefer VTI/VXUS over single-stock concentration plays
- User values stability over maximum growth
```

### 3.5 Behavioral Pattern Note Template

```markdown
---
title: "Prefers Gradual Changes"
type: pattern
detected: 2026-07-10
confidence: 85
evidence_count: 5
tags:
  - behavior
  - pace
  - risk-aversion
---

# Prefers Gradual Changes

**Detected:** After 5+ decisions showing consistent preference for small, incremental moves.

## Evidence
- [[../decisions/2026-07-10-accepted-trim-nvda.md]] — accepted 3% trim
- [[../decisions/2026-06-15-accepted-trim-aapl.md]] — accepted 2% trim
- [[../decisions/2026-06-01-rejected-aggressive-rebalance.md]] — rejected 10% shift
- [[../decisions/2026-05-20-accepted-bond-increase.md]] — accepted 5% bond shift (max observed)
- [[../decisions/2026-05-10-rejected-sector-rotation.md]] — rejected rapid sector rotation

## Agent Implication
When generating recommendations, cap proposed allocation changes at **5% absolute**. Prefer 2–3% trims with multi-step plans. Never propose single-step >5% shifts.
```

### 3.6 User Context File

```markdown
---
title: "User Context"
type: context
version: 12
updated: 2026-07-10
---

# User Context

## Profile
- Age: 42
- Income: $95,000 gross
- Employment: W-2
- Tax: 24% Federal / 9.3% State
- Risk: [[../preferences/risk-tolerance.md|Balanced]]

## Goals
- [[../preferences/goal-buy-house.md|Buy house: $50k by 2029 (High)]]
- [[../preferences/goal-retire.md|Retire: $1.5M by 2041 (Medium)]]

## Portfolio
- Total: $225,000
- Holdings: See Alpaca sync (refreshed 2026-07-10)
- Allocation: 62% stocks / 35% bonds / 3% cash

## Debts
- Car loan: $15,000 at 4.2% APR
- No credit card debt
- No student loans

## Behavioral Summary
- [[../patterns/prefers-gradual-changes.md|Prefers gradual changes]]
- Acceptance rate: 62% (8/13 decisions)
- Execution rate: 75% of accepted
- Decision speed: 3.2 days average

## Agent Notes
- Investment: [[../patterns/prefers-gradual-changes.md]]
- Debt: No patterns yet (3 decisions)
- Retirement: [[../patterns/concerned-about-timing.md|Concerned about timing]]
```

---

## 4. MCP TOOL MAPPING

### 4.1 Agent → Memory (Write)

| Action | MCP Tool | Payload |
|--------|----------|---------|
| Save recommendation | `create_note` | `{ path: "recommendations/", title, content, frontmatter }` |
| Save decision | `create_note` | `{ path: "decisions/", ... }` |
| Update preference | `update_note` | `{ id, content, frontmatter }` |
| Create pattern | `create_note` | `{ path: "patterns/", ... }` |
| Update user context | `update_note` | `{ id: "user-context", content }` |

### 4.2 Agent → Memory (Read)

| Action | MCP Tool | Payload |
|--------|----------|---------|
| Search past decisions | `search_notes` | `{ query: "concentration risk", limit: 5 }` |
| Read specific note | `read_note` | `{ id: "user-context" }` |
| List recent recommendations | `list_notes` | `{ path: "recommendations/", sort: "created", limit: 10 }` |
| Semantic search | `search_notes` | `{ query, semantic: true }` |

### 4.3 Frontend → Memory (Read-only for display)

| Action | MCP Tool | Payload |
|--------|----------|---------|
| Load graph data | `list_notes` | `{ path: "decisions/", include_frontmatter: true }` |
| Read chat history | `read_note` | `{ id }` |
| Filter by tag | `search_notes` | `{ query: "#tag", limit: 50 }` |
| Category breakdown | `list_notes` + client aggregate | Group by `tags` in frontmatter |

---

## 5. EDGES & RELATIONSHIPS

No graph database. Relations via `[[wikilinks]]` in note body.

### 5.1 Edge Types

| Edge | Syntax | Created When |
|------|--------|-------------|
| **Causal** | `Follows [[prior-decision.md]]` | Agent writes "caused by" reference |
| **Temporal** | `Previous: [[last-rec.md]]` | Auto-linked to most recent rec |
| **Similarity** | Smart Connections plugin | Embedding search finds semantic neighbors |
| **Pattern** | `Pattern: [[../patterns/xyz.md]]` | System writes pattern link in decision note |

### 5.2 Wikilink Resolution

basic-memory resolves `[[wikilinks]]` to note IDs. Frontend graph visualization:
1. `list_notes` to get all nodes
2. Parse each note body for `[[...]]` links
3. Build adjacency map client-side
4. Render D3 force-directed graph (same as old spec)

### 5.3 Smart Connections for Semantic Edges

Obsidian Smart Connections plugin indexes all `~/.fin/memory/` markdown files. Generates embeddings. basic-memory exposes semantic search via `search_notes(semantic=true)`.

When agent queries "user avoids selling winners" → Smart Connections returns decisions showing loss-aversion even if different tickers or domains.

---

## 6. AGENT MEMORY WORKFLOW

### 6.1 Before Each Conversation

```
1. Agent loads user-context.md via read_note("user-context")
2. Agent searches recent decisions: search_notes("investment", limit=10, sort="created")
3. Agent checks patterns: list_notes(path="patterns/")
4. Agent reads relevant preferences: search_notes("risk pace", tags=["preference"])
5. Agent constructs context window from results
```

### 6.2 After Each Recommendation

```
1. Agent writes recommendation to recommendations/{date}-{slug}.md
2. When user votes:
   a. Write decision to decisions/{date}-{status}-{slug}.md
   b. Update user-context.md (behavioral stats, acceptance rate)
   c. Check for new patterns (5+ similar decisions?) → create pattern note
```

### 6.3 Pattern Detection

System runs after every 5 decisions per domain:
```
1. Query last 5 decisions in domain
2. Check for consistent signals:
   - All rejected? → "domain-avoidance" pattern
   - All 2-3% changes accepted, 5%+ rejected? → "prefers-gradual" pattern
   - All tax-loss harvesting rejected? → "avoids-tax-complexity" pattern
3. If pattern confidence >70%: create patterns/{slug}.md
4. Link pattern from each evidence decision via [[wikilinks]]
```

---

## 7. FRONTEND INTEGRATION

### 7.1 Graph Data Fetch

Frontend calls MCP tools (through backend proxy) to get nodes:

```typescript
// Get all nodes for graph
const decisions = await mcp.list_notes({ path: "decisions/", include_frontmatter: true });
const recommendations = await mcp.list_notes({ path: "recommendations/", include_frontmatter: true });

// Parse wikilinks for edges
const edges = extractWikilinks([...decisions, ...recommendations]);

// Render D3 force-directed graph (preserve old spec's UI)
```

### 7.2 UI Preservation

All UI from old spec (Sections 2–7) preserved:
- Mini Memory Panel (collapsed sidebar graph)
- Fullscreen Memory View (D3 force-directed graph)
- Left panel: search, categories (now tags), filters
- Analytics popup (category breakdown, timeline, trust score)
- Chat detail drawer (click node → read note content)

Categories from old spec map to `tags` in frontmatter. Filtering by tag = `search_notes(query="#portfolio", ...)`.

### 7.3 No Custom API

Frontend queries basic-memory directly via MCP. Backend proxies MCP calls but adds no custom memory endpoints. The memory system IS the MCP server.

---

## 8. OBSIDIAN INTEGRATION

### 8.1 User Opens Memory in Obsidian

```
1. User installs Obsidian (https://obsidian.md)
2. Opens ~/.fin/memory/ as a vault
3. Sees all decisions, recommendations, patterns, preferences
4. Can edit/create/delete notes freely
5. Smart Connections plugin provides semantic search
6. Graph view shows [[wikilink]] relationships
```

### 8.2 Read-Only from Fin's Perspective

Fin treats memory as append-mostly. User edits in Obsidian are respected:
- If user deletes a pattern note → agent re-detects if evidence still strong
- If user edits a preference → agent reads updated content on next query
- If user adds a note → agent searches pick it up

---

## 9. SETUP & INSTALLATION

### 9.1 basic-memory MCP Server

Installed as part of Fin's MCP configuration:

```json
{
  "mcpServers": {
    "basic-memory": {
      "command": "npx",
      "args": ["-y", "@basicmachines/basic-memory", "--path", "~/.fin/memory"]
    }
  }
}
```

### 9.2 Obsidian Smart Connections

User installs manually (one-time):
1. Open Obsidian, open `~/.fin/memory/` as vault
2. Settings → Community Plugins → Install "Smart Connections"
3. Enable. Embeddings index builds automatically.

---

## 10. MIGRATION FROM OLD SPEC

| Old Concept | New Equivalent |
|-------------|---------------|
| SQL `agent_chats` table | `decisions/*.md` + `recommendations/*.md` |
| SQL `agent_categories` table | `tags` in frontmatter |
| SQL `user_context` table | `user-context.md` |
| Custom REST API endpoints | MCP tool calls |
| Custom DB backups | Git repo (markdown files are text) |
| "Categories" in UI | "Tags" in UI (same filtering behavior) |

### 10.1 What's Deleted

- All SQL schema (old Sections 526–564)
- Custom API endpoints for memory CRUD
- Custom search implementation (old Section 681–687)
- PDF export (use Obsidian plugins instead)

### 10.2 What's Preserved

- Graph visualization (force-directed, D3.js)
- Mini panel / fullscreen UI layout
- Category-based filtering (now tag-based)
- Analytics popup (category breakdown, timeline, trust score)
- Chat detail drawer
- Agent learning mechanism (Section 451–498 of old spec — now MCP queries)

---

## 11. ADVANCED: TencentDB Agent Memory Integration

### 11.1 Overview

[TencentDB Agent Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) provides a production-grade memory engine that complements basic-memory with:

- **Symbolic short-term memory**: Mermaid canvas offloading — verbose tool logs compressed to lightweight symbol graphs, cutting token usage up to 61.38%
- **Layered long-term memory**: L0 Conversation → L1 Atom → L2 Scenario → L3 Persona pipeline for progressive disclosure
- **`node_id` traceability**: Full drill-down from high-level symbols back to raw evidence
- **Local-first**: SQLite + sqlite-vec backend, zero external API dependencies

### 11.2 When to Add This Layer

| Stage | Memory Layer | Provider |
|-------|-------------|----------|
| **MVP** | Markdown memory store (notes, decisions, preferences) | basic-memory MCP |
| **Phase 2** | Context compression (token reduction for long agent sessions) | TencentDB Agent Memory (offload mode) |
| **Phase 3** | Full persona/scenario extraction (learns user patterns over time) | TencentDB Agent Memory (full pipeline) |

### 11.3 Architecture with Both Systems

```
┌──────────────────────────────────────────────────┐
│                  FIN AGENTS                       │
│                                                   │
│  Short-term (in-session):                         │
│    TencentDB Agent Memory                         │
│    → Mermaid canvas offloading                    │
│    → Compressed token context (~61% reduction)    │
│                                                   │
│  Long-term (cross-session):                       │
│    basic-memory MCP                               │
│    → Markdown notes in ~/.fin/memory/             │
│    → Obsidian-compatible, user-browsable          │
│                                                   │
│  Future: TencentDB L3 Persona → basic-memory      │
│    preferences/*.md auto-populated                │
└──────────────────────────────────────────────────┘
```

### 11.4 Setup

```bash
# Install TencentDB Agent Memory plugin
npm install @tencentdb-agent-memory/memory-tencentdb

# Enable context offloading (short-term compression)
# Config: enable "offload" mode in agent config
```

### 11.5 Key Benefits for Fin

| Problem | Without | With TencentDB Agent Memory |
|---------|---------|---------------------------|
| Long agent sessions (100+ tool calls) | Context window overflow, performance degradation | 61% token reduction via Mermaid offloading |
| User re-explains preferences | Agent forgets past sessions | L3 Persona captures stable preferences |
| Error tracing | Lost in verbose logs | node_id drill-down to raw evidence |
| Multi-agent coordination | Each agent starts cold | Shared L2 Scenario patterns across agents |

---

## 12. REFERENCES

- **basic-memory**: https://github.com/basicmachines-co/basic-memory
- **TencentDB Agent Memory**: https://github.com/TencentCloud/TencentDB-Agent-Memory
- **Obsidian**: https://obsidian.md
- **Smart Connections**: https://github.com/brianpetro/obsidian-smart-connections
- **User Context Schema**: `docs/SystemPrompts/User_context_file_shema`
- **Recommendation Engine**: `docs/Features/Recommendation_engine.md`
- **GitHub References**: `docs/GitHub_References.md`

---

*Document Version: 2.1 | Last Updated: July 2026 | Status: MCP-Native Rewrite Complete + TencentDB Agent Memory Added*
