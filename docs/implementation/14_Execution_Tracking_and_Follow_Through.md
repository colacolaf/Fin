# 14 — Execution Tracking & Follow-Through

## What & Why
User accepts/rejects recommendations. Execution log tracks whether user acted. Before/after impact visualization. Follow-through scoring (did user do what they said they would?). "Did you do it?" check-ins.

## Files to Create / Modify
```
backend/
├── routers/
│   └── execution.py          # execution tracking endpoints
├── services/
│   ├── execution_tracker.py  # log accepted → executed
│   └── follow_through.py     # scoring algorithm
├── models/
│   └── execution.py          # ExecutionLog model
frontend/
├── src/
│   ├── components/
│   │   └── execution/
│   │       ├── ExecutionDashboard.tsx
│   │       ├── ExecutionLogList.tsx
│   │       ├── CheckInBanner.tsx
│   │       ├── BeforeAfter.tsx
│   │       └── FollowThroughScore.tsx
│   └── api/
│       └── execution.ts
```

## Steps
1. `backend/models/execution.py` — ExecutionLog: recommendation_id, user_id, status (accepted/rejected/pending/executed/abandoned), accepted_at, executed_at, check_in_count, last_check_in. FollowThrough: user_id, score (0-100), streak, acceptance_rate, execution_rate.
2. `backend/services/execution_tracker.py` — log_accept(recommendation_id), log_execute(recommendation_id), log_reject(recommendation_id). Update recommendation status. Trigger follow_through recalculation.
3. `backend/services/follow_through.py` — calculate_score(user_id): execution_rate (did they do it?), decision_speed (how fast?), check_in_response_rate (do they respond?). Weighted sum → 0-100. Track streak (consecutive executions).
4. `backend/routers/execution.py` — GET /execution/log?status=accepted (list pending actions), POST /execution/:log_id/execute (mark done), POST /execution/:log_id/check-in (respond to check-in), GET /execution/score.
5. `ExecutionDashboard.tsx` — summary cards: follow-through score, current streak, acceptance rate, pending count. Visual progress ring for score.
6. `ExecutionLogList.tsx` — list of accepted recommendations not yet executed. Checkbox to mark done. "I did this!" button. Sorted by urgency.
7. `CheckInBanner.tsx` — periodic banner at top of dashboard: "Did you trim NVDA? (3 days ago)". Yes/No/Remind Later buttons.
8. `BeforeAfter.tsx` — for executed recommendations: show before vs after impact. Portfolio value change, allocation shift, tax impact. Side-by-side comparison.
9. `FollowThroughScore.tsx` — detailed score breakdown. Components: execution rate, decision speed, check-in response. Tips to improve.
10. Wire check-in scheduling: after acceptance, schedule check-in at +3 days, +7 days, +14 days. APScheduler job.
11. Playwright: accept recommendation, see it in execution log, mark as executed, verify score updates, check-in banner appears.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (execution dashboard, score visualization)
- `ui-animation` (score ring animation, check-in transitions)

## GitHub Repos Needed
- (none — all custom logic)

## Edge Cases & Risks
- User accepts but never executes → decline score, show streak break warning
- User rejects → still counts for acceptance_rate, not execution_rate
- Check-in fatigue → max 3 check-ins per recommendation, user-configurable frequency
- Score gaming → scores based on actual portfolio sync data (verifiable execution), not self-reported
- Multiple pending actions → prioritize by urgency + age
- Abandoned stale recommendations → auto-archive after 30 days, mark as "abandoned"

## Done When
- [ ] ExecutionLog created when user accepts/rejects recommendation
- [ ] Execution log list shows pending accepted actions
- [ ] "I did this!" button marks as executed
- [ ] Follow-through score 0-100 with breakdown
- [ ] Check-in banner appears at scheduled intervals
- [ ] Before/after impact shown for executed recommendations
- [ ] Score updated after each accept/execute/check-in
- [ ] Playwright: full accept → execute → check-in → score update flow
- [ ] Git: review diff, squash merge to main with `[14] Execution tracking & follow-through`