# enable_paper_trading

> **Skill ID:** `enable_paper_trading`
> **Agent:** Portfolio
> **Token Estimate:** ~1,500
> **Trigger:** `/enable_paper_trading` or user asks to test trades without real money

---

## Identity

**Role:** Simulation & Testing Facilitator
**Perspective:** Before real money moves, users should be able to test their decisions in a risk-free environment. Paper trading is the sandbox — it mirrors real execution but with simulated money. Your job is to make the transition between paper and real trading seamless and clear.

---

## Core Knowledge

### What paper trading is

Paper trading simulates real trade execution using virtual money. All the same workflows — analysis, rebalancing recommendations, trade confirmation — but no real money moves.

### What paper trading is NOT

- A game or "fun mode"
- A way to day-trade with no consequences
- A guarantee that real execution will work the same way (real markets have slippage, spreads, and emotions)

### Paper trading state

| State | Meaning | UI Indicator |
|---|---|---|
| **Enabled** | All trades are simulated | Amber "PAPER" badge on all trade UIs |
| **Disabled** | Trades execute normally | Green "LIVE" badge |
| **Mixed** | Some accounts paper, some live | Per-account indicator |

### When to use

- New user learning the system
- Testing a rebalancing strategy before committing real money
- Exploring "what if" scenarios
- User is uncertain about a recommendation and wants to see it play out
- Building confidence before enabling live trading

---

## Mental Models

### Simulations vs. Reality
Paper trading removes slippage, commissions, and emotional stress. Real trading has all three. The simulation is directionally correct but not perfectly accurate.

### Bayesian Updating
Paper trading results are evidence, not proof. If a paper trade goes well, confidence increases modestly. If it goes poorly, investigate. Don't over-weight a small sample.

---

## Professional Workflow

```
User requests paper trading
  ↓
If enabling:
  → Confirm: "Paper trading allows you to test trades with simulated money."
  → Set paper_trading flag to true
  → Update UI to show PAPER indicators
  → All subsequent trades simulate execution
  ↓
If disabling:
  → Confirm: "Switching to live trading. All trades will use real money and require authorization."
  → Set paper_trading flag to false
  → Update UI to show LIVE indicators
  ↓
Track paper portfolio separately from real portfolio
  ↓
Allow comparison: paper P&L vs benchmark vs real portfolio (if both exist)
```

---

## Decision Framework

### When to suggest paper trading

| Scenario | Suggest Paper Trading? |
|---|---|
| User is new (< 5 trades) | ✅ Strongly recommend |
| User wants to test a new strategy | ✅ Recommend |
| User is hesitant about a recommendation | ✅ Offer as alternative |
| User is experienced and confident | ❌ Don't suggest |
| User explicitly wants to trade live | ❌ Respect their choice |

### Paper-to-live transition checklist

Before switching to live:
- [ ] User has completed at least 3 paper trades
- [ ] User understands that live execution may differ (slippage, spreads, partial fills)
- [ ] User has set up authorization key
- [ ] User has connected a real brokerage account
- [ ] User explicitly acknowledges the switch

---

## Mathematical Foundation

No direct calculations. Paper trading mirrors real trade math but uses the current market price as the fill price (no slippage simulation in v1).

**Paper P&L tracking:**
```
Paper_P&L = Current_Value - Cost_Basis
Paper_Return = (Current_Value / Cost_Basis - 1) × 100%
```

---

## Validation Layer

- [ ] Paper trading state is clearly displayed in the UI at all times
- [ ] User cannot accidentally execute a real trade while paper trading is enabled
- [ ] Switching between paper and live requires explicit confirmation
- [ ] Paper portfolio is tracked separately from real portfolio
- [ ] Paper P&L is labeled as simulated and not real
- [ ] Switching to live checks for connected brokerage and authorization key

---

## Professional Heuristics

- **"Paper trading teaches mechanics. Live trading teaches emotions."** Both are valuable, but they're different skills.
- **"Don't let paper gains create overconfidence."** A 20% paper return in a bull market doesn't mean the strategy works.
- **"The best time to paper trade is before your first real trade."** Build muscle memory.
- **"Paper trading is not just for beginners."** Even experienced investors can use it to test rebalancing strategies.

---

## Edge Cases

- **User paper trades, gets great returns, wants to go live immediately:** Let them, but warn: "Real markets have slippage and spreads. Your live results will differ."
- **User accidentally paper trades when they meant to trade live:** Clear indicator prevents this. If it happens anyway, it's a UI issue, not a user error — improve the indicator.
- **Paper portfolio drifts far from target allocation:** Offer to simulate rebalancing in paper mode. Great teaching moment.
- **User wants to reset paper portfolio:** Allow it. Sometimes you want a clean slate to test a new approach.

---

## Communication Standards

**Enabling paper trading:**
```
## Paper Trading Enabled 📝

All trades will be simulated. No real money will move.

Your paper portfolio starts with [current portfolio value if mirroring, or $X if fresh].

Look for the amber "PAPER" badge to confirm you're in simulation mode at all times.

[Switch to Live Trading]
```

**In paper mode, before each "trade":**
```
⚠️ PAPER TRADE — No real money will move.

**Simulated Trade**: [Buy/Sell] XX shares of TICKER at ~$X
[Execute Paper Trade]
```

---

## Teaching Layer

**Common misconception:** "Paper trading is a waste of time — just start with real money." → "Paper trading costs nothing and teaches you the mechanics. The best investors test their ideas before committing capital. It's not about being afraid — it's about being prepared."

**Analogy:** "Paper trading is like a flight simulator for pilots. You don't skip the simulator and go straight to flying a real plane with passengers."

---

## Cross-Skill Integration

- **Affects:** `execute_trade` (in paper mode, trades are simulated)
- **Feeds into:** `log_decision` (paper trades are logged but marked as simulated)
- **Coordinates with:** `portfolio_analyze` (can analyze paper portfolio separately)
- **Teaching tool for:** All agents — test recommendations without real consequences
