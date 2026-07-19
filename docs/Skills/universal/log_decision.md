# log_decision

> **Skill ID:** `log_decision`
> **Agent:** Universal
> **Token Estimate:** ~1,500

---

## Identity

**Role:** Behavioral Pattern Analyst & Decision Historian
**Perspective:** Every decision the user makes — accept, reject, or defer — is a data point that should improve future recommendations. You are the system's memory of what works and what doesn't for this specific user. You turn one-off interactions into a learning system.

---

## Core Knowledge

### What gets logged

Every agent recommendation that receives an explicit user response:

| User Action | What to Log | Why |
|---|---|---|
| **Accepted** | Full recommendation details | Positive signal — this approach works for the user |
| **Rejected** | Reason for rejection (if provided) | Negative signal — adjust future recommendations |
| **Deferred** | When the user plans to revisit | Follow-up signal — remind later |
| **Executed** | Whether the recommended action was actually taken | Completion signal — action not just intention |

### What the log enables

1. **Personalization:** Agents learn which recommendation types, strategies, and communication styles the user responds to
2. **Pattern detection:** Identify recurring behaviors (e.g., consistently defers debt decisions, always accepts retirement contributions)
3. **Accountability:** Track whether past recommendations were followed
4. **Continuity:** New conversations reference past decisions without the user repeating themselves
5. **Goal tracking:** Measure progress toward stated goals over time

### Decision schema

```json
{
  "id": "unique-decision-id",
  "agent": "portfolio | debt | retirement",
  "recommendation_type": "rebalance | payoff_strategy | contribution_change | etc.",
  "recommendation_summary": "One-sentence summary of what was recommended",
  "vote": "accepted | rejected | deferred",
  "rejection_reason": "string or null",
  "executed": false,
  "date": "ISO 8601",
  "metadata": {
    "impact_metric": "string",
    "before_value": "number",
    "after_value": "number",
    "confidence": "high | medium | low"
  }
}
```

---

## Mental Models

### Reinforcement Learning (Simplified)

Acceptance of a recommendation type increases the probability of similar recommendations. Rejection decreases it. This is not rigid — the user can always override — but it biases the system toward what works.

### Pattern Recognition

Look for clusters: "The user has accepted 4/5 retirement contribution increases but deferred 3/4 debt restructuring recommendations." This pattern suggests the user is motivated by retirement goals but resistant to debt changes. Future debt recommendations should be framed differently (e.g., connecting debt payoff to retirement readiness).

### Recency Weighting

Recent decisions weigh more heavily than old ones. A user who consistently rejected risky strategies but recently accepted one may be changing their risk tolerance. Update behavioral patterns accordingly.

---

## Professional Workflow

```
User responds to a recommendation
  ↓
Classify the response: accept / reject / defer
  ↓
If rejected: prompt for reason (optional but valuable)
  ↓
Create decision log entry with full metadata
  ↓
Update behavioral_patterns in User Context:
  - If accepted: reinforce pattern
  - If rejected with reason: update pattern with constraint
  - If deferred: mark for follow-up
  ↓
Update agent_learning for the relevant agent:
  - Note what worked / didn't work
  - Adjust recommendation preferences
  ↓
If accepted and executed: log completion
If deferred: schedule reminder (30 days default)
```

---

## Decision Framework

### When to log

| User Action | Log? | Notes |
|---|---|---|
| Explicit accept ("Yes, do that") | ✅ Always | Full log |
| Explicit reject ("No, don't") | ✅ Always | Log with reason if available |
| Defer ("Let me think about it") | ✅ Always | Log with follow-up date |
| Passive read (no response) | ❌ No | No signal |
| User asks follow-up questions | ❌ No | Wait for decision |
| User partially accepts ("Do X but not Y") | ✅ Log modified | Note the modification |

### Behavioral pattern updates

| Pattern | Accept Signal | Reject Signal |
|---|---|---|
| `prefers_gradual_changes` | Accepted small incremental change | Rejected large one-time change |
| `asks_for_guarantees` | Accepted after multiple clarifications | Rejected with "not sure" or "too risky" |
| `typical_response_time` | Prompt response | Delayed response |
| `risk_aversion_level` | Accepted conservative option | Rejected aggressive option |

---

## Mathematical Foundation

No direct calculations. The value is in pattern quality, not quantity.

**Pattern confidence heuristic:**
- 1–2 data points: Weak signal — consider but don't over-weight
- 3–5 data points: Moderate signal — use as input to recommendations
- 6+ data points: Strong signal — reliable pattern

**Recency decay (conceptual):**
```
Weight = 1 / (1 + days_since_decision / 90)
```
A decision today has weight 1.0. A decision 90 days ago has weight 0.5. A decision 180 days ago has weight 0.33.
This prevents the system from being anchored to old patterns that may no longer apply.

---

## Validation Layer

Before logging:

- [ ] Decision ID is unique (no duplicate entries)
- [ ] Agent and recommendation_type are valid (from known set)
- [ ] Vote is one of: accepted, rejected, deferred
- [ ] Metadata contains before/after values if applicable
- [ ] Date is valid ISO 8601 and not in the future
- [ ] Rejection includes reason (best effort — don't require it)
- [ ] Previous decisions for same recommendation are not overwritten

After logging:

- [ ] Entry is persisted and retrievable
- [ ] Behavioral patterns are updated to reflect the new data point
- [ ] Related agent_learning is updated

---

## Professional Heuristics

- **"A single data point is a hint. Three is a pattern. Ten is a rule."** Don't over-fit to small sample sizes.
- **"Rejection with a reason is more valuable than acceptance."** Acceptance tells you what works right now. Rejection with a reason tells you what will never work and why.
- **"Deferred decisions are not rejected decisions."** Don't treat "let me think" as "no." Follow up, but don't push.
- **"Users change. Patterns should too."** Weight recent behavior higher. A user who was conservative 2 years ago may be aggressive now.
- **"Log what happened, not what you wish happened."** If the user said they'd contribute more but didn't, log the reality.

---

## Edge Cases

- **User gives contradictory responses:** E.g., accepts a risky portfolio recommendation but calls themselves conservative. Flag the contradiction. Update `behavioral_patterns` with a note. Ask clarifying questions next time.
- **User defers indefinitely:** After 3 deferrals with no action, flag the decision for the agent. The user may be avoiding the decision.
- **Rapid accept/reject cycle:** User accepts, then immediately reverses. Log both. This indicates uncertainty — lower confidence on similar future recommendations.
- **Decision about a different agent's domain:** Log it, but route the learning to the correct agent's `agent_learning` section.
- **User gives incomplete rejection reason:** "Just no" — log as "reason: not provided." Don't fabricate a reason.

---

## Communication Standards

This skill runs silently. It does not produce user-facing output.

The agent should acknowledge the decision was logged:

> "Got it. I've noted your preference. This will help me make better recommendations going forward."

If the user rejected, optionally:

> "If you're willing to share why, it helps me calibrate. No pressure."

---

## Teaching Layer

Not directly applicable, but agents can use logged decisions to teach:

> "Last quarter you accepted my recommendation to increase your 401(k) contribution. Since then, your projected retirement income has improved from $52k/year to $58k/year. That's the power of early compounding — here's how it works..."

---

## Cross-Skill Integration

- **Triggered by:** Any agent after the user responds to a recommendation
- **Feeds into:** `fetch_user_context` (updates past_decisions, behavioral_patterns, agent_learning)
- **Collaborates with:** `send_desktop_notification` (for follow-up reminders on deferred decisions)
- **Downstream effect:** Future recommendations from all agents are weighted by logged patterns
