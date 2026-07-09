# Voting & Feedback System

**Version:** 1.1 | **Status:** Draft | **Dependencies:** User Context File Schema, System Architecture Flow

## Overview

The voting system is the feedback loop that makes Fin get smarter. Every recommendation gets voted on (Accept/Reject/Defer). Each vote recalibrates the user's behavioral patterns, updates the context file, and feeds agent learning insights back into future recommendations. Agents coordinate through shared context — no direct inter-agent communication.

Reference docs:
- `docs/SystemPrompts/User_context_file_shema` — `past_decisions`, `behavioral_patterns`, `agent_learning` schemas
- `docs/SystemPrompts/System_architecture_(Agent_orchestration_flow)` — lines 238–333 (voting flow), lines 506–546 (multi-agent coordination)

## Flow

```
Recommendation generated → User votes (Accept/Reject/Defer)
    │
    ├─ Vote saved to DB
    ├─ past_decisions[] appended
    ├─ behavioral_patterns recalculated
    ├─ agent_learning updated (rules-based)
    ├─ Context file saved
    └─ Next recommendation sees updated context
```

## Data Flow Per Vote

### 1. Vote Submission
```
POST /api/recommendations/{rec_id}/vote
Body: { "vote": "accepted|rejected|deferred", "feedback": "string (optional)" }
```

### 2. Backend Processing
```
1. Save vote to Recommendation table (status, voted_at, user_feedback)
2. Load User Context File
3. Append to past_decisions[]
4. Recalculate behavioral_patterns:
   - recommendation_acceptance_rate (total accepted / total)
   - recommendation_execution_rate (total executed / total accepted)
   - breakdown_by_agent.{agent}.acceptance_rate
   - decision_speed.average_days_to_execute
5. Run rules engine → generate agent_notes + update agent_learning
6. Save context file
```

### 3. Multi-Agent Coordination
Agents don't talk. They read shared context:
- Investment agent sees Debt's patterns, Retirement's patterns
- Debt agent sees Investment's patterns, Retirement's patterns
- Each agent adapts: "User accepted bond increase (Investment), rejected aggressive CC payoff (Debt), moderate risk profile"

## Schema: past_decisions Entry

```json
{
  "date": "ISO 8601",
  "agent": "investment|debt|retirement",
  "recommendation_title": "string",
  "recommendation_summary": "string (one sentence)",
  "user_vote": "accepted|rejected|deferred",
  "user_reasoning": "string (optional, user-provided)",
  "execution_status": "pending|executed|abandoned",
  "execution_date": "ISO 8601 or null",
  "agent_notes": "string (rules-generated insight about this decision)"
}
```

## Execution Tracking

After accepting, user must execute (Fin doesn't auto-trade). Execution tracking is **manual mark only** for MVP.

### Manual Mark Flow
1. User accepts recommendation → status = "pending"
2. User executes trade in their brokerage (outside Fin)
3. User returns to Fin, opens recommendation, clicks "Mark Executed"
4. Execution date recorded → `decision_speed` recalculated

### Why not auto-detect?
- Alpaca reconciliation requires diffing portfolio snapshots, handling partial fills, distinguishing user-initiated trades from recommendation executions
- False positives on coincidental trades erode trust
- ponytail: auto-detect is phase 3+ polish, not MVP

### Reminders
- Accepted but unexecuted > 7 days → subtle nudge: "Still planning to execute this?"
- Accepted but unexecuted > 30 days → prompt: "Still relevant? Mark executed or abandon."
- User can mark "abandoned" anytime → `execution_status = abandoned`, factored into `execution_rate` (abandoned accepted = not executed)

## Behavioral Pattern Recalculation

On every vote, recalculate:

| Pattern | Formula | Source |
|---------|---------|--------|
| `recommendation_acceptance_rate` | accepted / total decisions | all `past_decisions` |
| `recommendation_execution_rate` | executed / total accepted | accepted decisions only |
| `breakdown_by_agent.{agent}.acceptance_rate` | accepted / total for that agent | filtered `past_decisions` |
| `decision_speed.average_days_to_execute` | avg(execution_date - vote_date) for recent 30d | executed decisions |
| `recommendation_preferences.*` | trend analysis over last 20 decisions | pattern detection |

## Agent Learning Pipeline

**Rules-based extraction** for MVP. No second LLM call. The vote handler applies pattern-matching rules when user provides feedback text, and statistical thresholds when they don't.

### Rules Engine

| Trigger | Extraction Rule | Example Output |
|---------|----------------|----------------|
| Feedback contains "too aggressive", "too fast", "slower" | Tag: `prefers_gradual` strength += 1 | `"User rejected aggressive 10% move (3rd rejection of large moves). Stick to ≤5% adjustments."` |
| Feedback contains "not now", "later", "wait" | Tag: `defers_under_uncertainty` | `"User defers when market is volatile. Avoid recommendations during high-VIX periods."` |
| Accepted + executed within 3 days, 3+ times | Tag: `fast_executor` for that agent | `"User executes debt payoff recs quickly (avg 2.1 days). High confidence in payoff recommendations."` |
| Rejected same category 3+ times | Tag: `avoid_category:{category}` | `"User has rejected rebalancing 3 times. Deprioritize rebalancing recs."` |
| Acceptance rate for agent >70% over last 10 recs | Tag: `high_trust:{agent}` | `"User has high trust in investment recommendations (75% accept). Can be slightly more assertive."` |
| Acceptance rate for agent <30% over last 10 recs | Tag: `low_trust:{agent}` | `"User rarely accepts debt recommendations (25%). Increase explanation detail, lower assertiveness."` |
| No feedback provided | Use vote-only stats: acceptance rate shift, execution speed delta | `"User accepted without comment. Typical pattern: accepts investment recs at 65% rate."` |

### agent_notes vs agent_learning

- `agent_notes` (per-decision): Single sentence from rules engine about this specific decision. Written immediately on vote.
- `agent_learning.{agent}_insights` (cumulative): Aggregate pattern over last 20 decisions for that agent. Rewritten when a pattern crosses a threshold (e.g., 3rd rejection of same category). Concatenates active tags into prose.

### Why not LLM reflection?
- Doubles inference cost per recommendation (1 rec + 1 reflection = 2 calls)
- Adds 2-5s latency to vote response
- Rules cover 80%+ of patterns; LLM nuance is diminishing returns for MVP
- ponytail: add LLM reflection in phase 3 if rules prove insufficient

## Deferred Votes

### Lifecycle
```
User defers
    │
    ├─ 7 days: Re-prompt. "You deferred this recommendation. Still thinking about it?"
    │   └─ User can: Accept / Reject / Defer again
    │
    ├─ 30 days: Auto-abandon. Status → "abandoned", note: "Auto-abandoned after 30 days"
    │   └─ Counts as non-accepted in acceptance_rate (not executed in execution_rate)
    │
    └─ Anytime: User can manually Accept/Reject/Abandon from history
```

### Rationale
- 7-day nudge respects user's thinking time without nagging
- 30-day auto-abandon keeps `past_decisions` from accumulating indefinite "pending" entries
- ponytail: auto-abandon is a single cron query, not a state machine

### Stale Recommendations
If market data shifts significantly while deferred (e.g., NVDA drops 15%), agent flags: "Market conditions have changed since this recommendation. Would you like an updated analysis?" On next data refresh, compare current price vs. price at recommendation time. If delta >10%, mark recommendation with `stale_data: true`.

## Vote Change Window

User can change vote **once within 24 hours** of original vote. After 24h, vote is locked.

Rationale:
- Prevents immediate buyer's remorse from skewing patterns
- 24h window allows reconsideration without indefinite flip-flopping
- One change only — prevents gaming the acceptance rate

Implementation: `vote_changed_at` timestamp + `original_vote` preserved in DB for audit.

## Vote History & UI

Frontend displays:
- Recommendation card with Accept/Reject/Defer buttons
- Optional feedback text field
- Past decisions timeline with vote outcomes
- Pattern summary: "You accept 65% of investment recs, execute 80% of accepted"

ponytail: Reuse existing recommendation card component from `Setup_wizard_frontend_spec.md`, add vote buttons + feedback field. No new component needed.

## Edge Cases

| Case | Behavior |
|------|----------|
| User votes on stale recommendation (>7 days old) | Accept vote, note staleness in agent_notes |
| User changes vote | Allow one change within 24h, after that locked; original vote preserved |
| Context file corrupt on vote | Rebuild from DB, log error, retry |
| Rapid voting (5+ votes in session) | Throttle recalculation to batch update after session |
| Empty feedback on reject | Agent learns from vote only (no reasoning to parse) |
| Deferred recommendation with stale market data (>10% price move) | Flag `stale_data: true`, prompt for re-analysis |

## Verification

- [ ] Vote endpoint saves to DB correctly
- [ ] past_decisions appends without data loss
- [ ] behavioral_patterns recalculate correctly (spot-check math)
- [ ] Rules engine generates agent_notes for each vote trigger
- [ ] agent_learning cumulatively updates on threshold crosses
- [ ] Next recommendation uses updated context (acceptance rate changed)
- [ ] Multi-agent coordination: Debt agent sees Investment's updated patterns
- [ ] Deferred: 7-day re-prompt fires, 30-day auto-abandon fires
- [ ] Vote change: allowed within 24h, rejected after, original preserved

## Resolved Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution detection | Manual mark only | Auto-detect is reconciliation complexity not needed for MVP |
| Agent learning | Rules-based extraction | 80%+ coverage without doubling LLM calls; add LLM reflection in phase 3 if needed |
| Deferred vote lifecycle | 7-day re-prompt, 30-day auto-abandon | Respects thinking time, prevents indefinite pendings |
| Vote change window | One change within 24 hours | Prevents buyer's remorse, limits gaming |