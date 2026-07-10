# 16 — Backtesting & Training Mode

## What & Why
Backtrader integration for strategy backtesting. Strategy sandbox. Historical data replay. Parameter sweeps. Training mode: paper trades, risk-free experimentation. Per Training_mode_and_backtesting.md.

## Files to Create / Modify
```
backend/
├── services/
│   ├── backtester.py         # Backtrader engine wrapper
│   ├── strategy_runner.py    # Run user-defined strategies
│   └── parameter_sweep.py    # Grid search over strategy params
├── models/
│   └── backtest.py           # BacktestRun, Strategy model
├── routers/
│   └── backtest.py           # endpoints
frontend/
├── src/
│   ├── pages/
│   │   └── Backtest.tsx
│   ├── components/
│   │   └── backtest/
│   │       ├── StrategyBuilder.tsx
│   │       ├── BacktestResults.tsx
│   │       ├── ParameterSweep.tsx
│   │       ├── HistoricalReplay.tsx
│   │       └── PaperTradePanel.tsx
│   └── api/
│       └── backtest.ts
```

## Steps
1. `backend/services/backtester.py` — Backtrader Cerebro wrapper. run_backtest(strategy_class, data_df, initial_cash=100000, commission=0.001). Return: total_return, sharpe_ratio, max_drawdown, win_rate, trades[].
2. `backend/services/strategy_runner.py` — Pre-built strategies: moving_average_crossover, rsi_mean_reversion, buy_and_hold, dollar_cost_average. User configures params. Validate strategy before running.
3. `backend/services/parameter_sweep.py` — grid search: iterate param combinations (e.g., short_window=[10,20,50], long_window=[50,100,200]). Run backtest per combo. Return ranked results by Sharpe ratio. Return top 5.
4. `backend/models/backtest.py` — BacktestRun: strategy_name, params (JSON), start_date, end_date, results (JSON), created_at. Strategy: user_id, name, type, config (JSON), is_paper_trading.
5. `backend/routers/backtest.py` — POST /backtest/run (single backtest), POST /backtest/sweep (parameter sweep), GET /backtest/history (past runs), POST /backtest/paper-trade (start paper trading a strategy).
6. `StrategyBuilder.tsx` — select strategy type (MA crossover, RSI, etc.). Configure parameters (sliders + number inputs). "Run Backtest" button. Show running status.
7. `BacktestResults.tsx` — result cards: total return (%), Sharpe ratio, max drawdown, win rate. Equity curve line chart (Recharts). Trade log table.
8. `ParameterSweep.tsx` — heatmap of parameter combinations colored by Sharpe ratio. Select best params → load into StrategyBuilder.
9. `HistoricalReplay.tsx` — animated playback of trades on price chart. Play/Pause/FF. See when strategy would buy/sell. "What if" toggle for parameter changes.
10. `PaperTradePanel.tsx` — start paper trading a strategy with Alpaca paper account. Track paper P&L vs benchmark. Risk-free toggle ON by default.
11. `Backtest.tsx` — page layout: StrategyBuilder left panel, Results right panel (or below on mobile). Tab: "Single Run" / "Parameter Sweep" / "Paper Trade".
12. Playwright: select strategy, configure params, run backtest, see results chart + metrics. Run parameter sweep, see heatmap. Start paper trade.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (backtest dashboard, strategy builder UX)
- `ui-animation` (historical replay animation, result transitions)

## GitHub Repos Needed
- `mementum/backtrader` (Python backtesting framework)

## Edge Cases & Risks
- Backtest overfitting → warn when param sweep returns suspiciously high Sharpe (>3). Suggest walk-forward validation.
- Insufficient historical data → require min 252 trading days (1 year). Error message if less.
- Long-running sweeps → async execution, show progress bar, notify when done
- Paper trading sync → separate from live trading. Clear "PAPER" badge everywhere.
- Strategy complexity → limit to 5 concurrent backtests. Queue excess.
- Survivorship bias → use current index constituents, flag for user

## Done When
- [ ] Backtrader engine runs backtest, returns metrics
- [ ] MA crossover and RSI strategies available
- [ ] Parameter sweep returns top 5 ranked by Sharpe
- [ ] Backtest results page shows equity curve + metrics
- [ ] Historical replay animates trades on chart
- [ ] Paper trading starts with Alpaca paper account
- [ ] Strategy builder: select type, configure params, run
- [ ] Parameter sweep heatmap renders
- [ ] Playwright: full backtest flow (build → run → results → sweep → paper trade)
- [ ] Git: review diff, squash merge to main with `[16] Backtesting & training mode`