# 08 — Investment Agent: Dashboard & Visualization

## What & Why
Portfolio holdings table, allocation pie (Recharts), performance line chart, concentration alerts. Asset class breakdown. Top 10 holdings. Per Portfolio_visualization.md. Playwright verify charts render with real data.

## Files to Create / Modify
```
frontend/
├── src/
│   ├── pages/
│   │   └── Portfolio.tsx
│   ├── components/
│   │   ├── charts/
│   │   │   ├── AllocationPie.tsx
│   │   │   ├── PerformanceLine.tsx
│   │   │   ├── HoldingsTable.tsx
│   │   │   └── ConcentrationMeter.tsx
│   │   └── portfolio/
│   │       ├── AssetClassBreakdown.tsx
│   │       ├── TopHoldings.tsx
│   │       └── PortfolioSummary.tsx
│   ├── hooks/
│   │   └── usePortfolio.ts
│   └── api/
│       └── portfolio.ts
shared/
├── src/
│   └── types.ts           # add Portfolio, Holding, ChartData types
```

## Steps
1. `shared/src/types.ts` — add Holding (symbol, name, shares, price, value, allocation_pct, asset_class), Portfolio (total_value, holdings[], performance_1d/1w/1m/1y/ytd, asset_classes[])
2. `frontend/src/api/portfolio.ts` — getPortfolio(), getHoldings(), getPerformance(period). Use client.ts wrapper from plan 04.
3. `usePortfolio.ts` — hook: fetch portfolio data, loading/error states, auto-refresh on sync event. Returns portfolio, holdings, performance, refresh().
4. `PortfolioSummary.tsx` — total value (large number), day change (green/red), total return % (1Y). 3 stat cards.
5. `HoldingsTable.tsx` — sortable table: Symbol, Name, Shares, Price, Value, Allocation%, Day Change. Paginate 10 per page. Click row → expand details.
6. `AllocationPie.tsx` — Recharts PieChart. Asset class slices (stocks, bonds, crypto, cash). Custom labels: class name + %. Hover → tooltip with dollar value.
7. `PerformanceLine.tsx` — Recharts LineChart. Period toggle (1W, 1M, 3M, 1Y, YTD). Portfolio value over time. Optional S&P 500 benchmark line.
8. `AssetClassBreakdown.tsx` — horizontal bar chart per asset class. Color-coded. Show % and $ value.
9. `TopHoldings.tsx` — top 10 by value. Horizontal bar with symbol + value.
10. `ConcentrationMeter.tsx` — if any single holding >20% or sector >50%, show orange/red alert. Explain risk concisely.
11. `Portfolio.tsx` — compose: summary row → [allocation pie | holdings table] → performance line → breakdowns + top 10.
12. Playwright: verify portfolio page renders all charts with seed data. Test period toggle. Test table sort. No blank charts.

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (dashboard layout, chart colors, data viz)
- `ui-animation` (chart transitions, number counting animation)

## GitHub Repos Needed
- `recharts/recharts` (React charting library)

## Edge Cases & Risks
- Empty portfolio → show "Connect broker" CTA, not empty charts
- Single holding → pie shows 100% slice, concentration alert triggers
- Many holdings (>50) → table pagination, chart label limit to top 8
- Zero/negative values → show $0.00 or ($X.XX), not errors
- Chart responsiveness → Recharts ResponsiveContainer handles window resize
- Color accessibility → asset class colors distinguishable, add pattern/texture option

## Done When
- [ ] Portfolio page renders with seed data (holdings, allocation, performance)
- [ ] Allocation pie shows asset class breakdown, correct percentages
- [ ] Performance line chart renders, period toggle switches data
- [ ] Holdings table sortable, paginated, rows expandable
- [ ] Concentration alert triggers at 20% threshold
- [ ] All values formatted as USD currency
- [ ] Empty portfolio shows friendly CTA
- [ ] Playwright: all charts render, interactive elements work, no console errors
- [ ] Git: review diff, squash merge to main with `[08] Portfolio dashboard & visualization`