# Multi-Subagent Orchestration

**Version**: 1.0 | **Last Updated**: July 2026 | **Scope**: MVP — single Ollama instance, no distributed workers

---

## 1. Overview

Heavy computation skills (Monte Carlo simulation, tax-loss harvesting analysis, correlation matrix) spawn 4 subagents in parallel via `asyncio.gather`. The agent coordinator merges results, sanity-checks output, and surfaces a single coherent recommendation to the user.

Skills that use multi-subagent pipelines are defined in:
- `docs/Skills_Connectors_Models/Skills/Investment_agent_skills` — §20 (ProjectedPerformanceMonteCarloSimulation), §10 (AnalyzeCostBasisForTaxLoss), §14 (AnalyzeCorrelationMatrix)
- Each skill doc specifies subagent count, inputs, outputs, and confidence gates.

---

## 2. Subagent Lifecycle

```
┌──────────────┐
│  COORDINATOR │  "Run Monte Carlo projection for user portfolio"
└──────┬───────┘
       │ 1. Reads skill catalog → determines 4 subagents needed
       │ 2. Prepares context injection per subagent
       │ 3. Calls asyncio.gather(subagent_1, subagent_2, subagent_3, subagent_4)
       │
   ┌───┴────────────────────────────────────────────┐
   │           asyncio.gather (parallel)             │
   │                                                │
   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐
   │  │ Subagent │ │ Subagent │ │ Subagent │ │ Subagent  │
   │  │    1     │ │    2     │ │    3     │ │    4      │
   │  │ Data &   │ │ Path     │ │ Stats    │ │ Inter-    │
   │  │ Assump.  │ │ Sim      │ │ Summar.  │ │ preter    │
   │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘
   │       │            │            │             │
   │       ▼            ▼            ▼             ▼
   │   [result]    [result]    [result]       [result]
   └───────┴────────────┬──────────────────────────┘
                        │ 4. Coordinator receives all results
                        ▼
                 ┌──────────────┐
                 │  COORDINATOR │  Merges → validates → returns
                 └──────────────┘
```

### 2.1 Spawn

Coordinator determines subagent count from the skill catalog entry (hard-coded per skill, not dynamic). Each subagent gets:

- **System prompt**: The relevant agent system prompt (Investment/Debt/Retirement) plus the specific subagent instructions from the skill catalog.
- **Context**: A subset of user context relevant to that subagent's job (e.g., Subagent 1 gets holdings + risk tolerance; Subagent 2 gets Subagent 1's output after it completes).
- **Timeout**: 30s default per subagent (configurable per skill; Monte Carlo Subagent 2 gets 60s for 10,000 paths).

### 2.2 Execute

Each subagent runs as an independent `asyncio.Task` within the same Ollama instance. No inter-subagent communication — they share state only through the coordinator's pre-computed inputs and post-hoc merging.

### 2.3 Terminate

Subagent returns structured JSON or an error state. Coordinator validates shape against the skill catalog's output schema before proceeding to merge.

---

## 3. Parallelism Model

```
results = await asyncio.gather(
    subagent_1(ctx_1),
    subagent_2(ctx_2),  # ctx_2 built from subagent_1 output (sequential within gather for dependent stages)
    subagent_3(ctx_3, raw_paths=results[1]),
    subagent_4(ctx_4, stats=results[2]),
    return_exceptions=True  # never crash all on one failure
)
```

### Dependency handling

For Monte Carlo, subagents 1→2→3→4 are sequential in logic but run as a pipeline where:
- Subagent 1 runs first (no dependencies)
- Subagent 2 starts once Subagent 1's output is available
- Subagents 3 and 4 wait for Subagent 2

In practice: two `asyncio.gather` waves for Monte Carlo:
1. Wave 1: Subagent 1 solo → produces assumptions dict
2. Wave 2: Subagents 2, 3, 4 in parallel (3 and 4 can start once 2 produces raw paths)

For fully independent subagents (e.g., correlation matrix + fee analysis running concurrently for a rebalancing rec), all spawn in a single `asyncio.gather`.

---

## 4. Result Merging

Coordinator merges results using the **priority-weighted confidence** formula from the skill catalog:

```
merged_confidence = Σ (subagent_confidence_i × weight_i) / Σ weight_i
```

Weights are skill-defined. For Monte Carlo (Investment_agent_skills §20):
| Subagent | Weight | Confidence Source |
|----------|--------|-------------------|
| 1 (Data) | 1.0 | Data staleness gate |
| 2 (Sim)   | 1.5 | Path count, bootstrap quality |
| 3 (Stats) | 1.0 | Percentile monotonicity check |
| 4 (Interp)| 1.0 | Disclaimer completeness |

### Merge validation

Before surfacing to user, coordinator runs:
1. **Shape check**: Each subagent output matches expected JSON schema
2. **Sanity check**: For Monte Carlo — percentile monotonicity (p5 < p10 < ... < p95). If violated, re-run Subagent 2.
3. **Confidence floor**: If merged confidence < 0.5, surface result with "low confidence" flag and do not auto-recommend action
4. **Provenance trace**: Every number in the final recommendation carries a `source: subagent_N` tag

---

## 5. Timeout & Error Handling

### 5.1 Timeouts

| Subagent type | Default timeout | Rationale |
|---------------|----------------|-----------|
| Data gatherer | 15s | API call only |
| Path simulation | 60s | 10,000 paths × bootstrap resampling |
| Stats summarizer | 15s | Pure computation on existing data |
| Interpreter | 20s | LLM text generation |

If a subagent times out:
- Mark that subagent's output as `null` with `error: "timeout"`
- Coordinator continues with partial results if sufficient (≥2 of 4 subagents succeeded for Monte Carlo)
- If <2 succeeded, return error to user: "Simulation could not complete — try again or reduce time horizon"

### 5.2 Errors

All subagents run with `return_exceptions=True`. Error types handled:

| Error | Response |
|-------|----------|
| `OllamaConnectionError` | Retry once after 2s backoff; if still fails, return "Model unavailable" to user |
| `SchemaValidationError` | Log mismatch, re-prompt subagent with corrected schema once; if still fails, skip that subagent's contribution |
| `DataStalenessError` (Subagent 1) | Continue with `stale_data_warning: true` flag in output — don't block pipeline |
| `AssertionError` (Subagent 3 sanity check) | Discard Subagent 2 output, re-run with different random seed |

### 5.3 Partial results

If any subagent fails but ≥2 succeeded, the coordinator:
1. Merges available results
2. Sets `partial_result: true` in output
3. Notes which subagent(s) failed and what was omitted
4. Reduces merged confidence by 0.1 per failed subagent

---

## 6. MVP Constraints

- **Single Ollama instance**: All subagents share one model process. No queue, no load balancing, no distributed workers.
- **Sequential model calls within gather**: Ollama processes one request at a time. `asyncio.gather` provides concurrency for I/O (API calls, data fetching) but model inference serializes. This is acceptable for MVP — optimize with model replicas post-MVP.
- **No persistent subagent state**: Each run is stateless. Coordinator holds intermediate results in memory only.
- **Max 4 subagents per skill**: Enforced by skill catalog schema, not dynamic spawning.
- **No subagent-to-subagent messaging**: All data flow through coordinator.

---

## 7. Skill Catalog Cross-References

| Skill | File | Subagents |
|-------|------|-----------|
| ProjectedPerformanceMonteCarloSimulation | Investment_agent_skills §20 | 4 (Data, Sim, Stats, Interp) |
| AnalyzeCostBasisForTaxLoss | Investment_agent_skills §10 | 2 (Cost basis gatherer, Wash-sale checker) |
| AnalyzeCorrelationMatrix | Investment_agent_skills §14 | 2 (Price fetcher, Matrix computer) |

Pipeline definitions (subagent count, I/O schemas, confidence gates) are defined in those skill catalog files. This doc covers the orchestration layer only.