"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  Minimize2,
  TrendingUp,
  Clock,
  Circle,
  Activity,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { MetalButton } from "@/components/ui/metal-button"

import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import { TinySparkline } from "@/components/portfolio/tiny-sparkline"
import { ChartTooltip } from "@/components/portfolio/chart-tooltip"
import { AllocationCard } from "@/components/portfolio/allocation-card"
import { TradeRow } from "@/components/portfolio/trade-row"
import { MetricsRow } from "@/components/portfolio/metrics-row"
import { TradeQueue } from "@/components/portfolio/trade-queue"

import {
  portfolioSummary,
  chartData,
  allocationData,
  holdings,
  trades,
} from "@/lib/portfolio/data"
import { pendingTrades } from "@/lib/portfolio/trade-queue-data"
import { useCountUp } from "@/lib/portfolio/hooks"

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function PortfolioFullPage() {
  const [timeRange, setTimeRange] = useState("1Y")
  const animatedValue = useCountUp(portfolioSummary.totalValue)

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <AppSidebar triggerPosition="top-left" />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#818CF8]/10">
              <TrendingUp className="h-4 w-4 text-[#818CF8]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">
                Portfolio — Full View
              </h1>
              <p className="text-[11px] text-white/[0.38]">
                Terminal grid — assets, trades, and strategy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-[#34D399] text-[#34D399]" />
              <span className="text-[11px] text-white/[0.38]">Markets Open</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/[0.25]">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">Updated 2m ago</span>
            </div>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <Link href="/">
              <MetalButton
                preset="chromatic"
                theme="dark"
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                strength={0.7}
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Collapse
              </MetalButton>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {/* Hero Stats */}
            <MetricsRow summary={portfolioSummary} animatedValue={animatedValue} />

            {/* Large Chart */}
            <GlassCard className="p-5">
              <div className="relative h-[420px] w-full">
                <div className="absolute top-3 left-5 z-10 flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <ArrowUpRight className="h-3 w-3 text-[#34D399]" />
                    <span className="text-[10px] text-white/[0.5]">Best</span>
                    <span className="text-[10px] font-semibold text-[#34D399]">+6.2%</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <ArrowDownRight className="h-3 w-3 text-[#F87171]" />
                    <span className="text-[10px] text-white/[0.5]">Worst</span>
                    <span className="text-[10px] font-semibold text-[#F87171]">-4.3%</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <Activity className="h-3 w-3 text-[#67E8F9]" />
                    <span className="text-[10px] text-white/[0.5]">Beta</span>
                    <span className="text-[10px] font-semibold text-[#67E8F9]">0.87</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 36, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="chartGlowFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818CF8" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} dx={-8} domain={["dataMin - 5000", "dataMax + 5000"]} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                    <Area
                      type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={2}
                      fill="url(#chartGlowFull)" dot={false}
                      activeDot={{ r: 4, fill: "#08090C", stroke: "#818CF8", strokeWidth: 2 }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(129,140,248,0.3))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* 3-column grid: Assets | Allocation | Trades */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Assets */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Assets Held</h3>
                  <span className="text-[10px] text-white/[0.25]">{holdings.length} positions</span>
                </div>
                <div className="space-y-0.5">
                  {holdings.map((a) => (
                    <div key={a.ticker} className="flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium text-white">{a.ticker}</span>
                          <span className="text-[10px] text-white/[0.38] truncate">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-white/[0.25]">{a.shares} shares</span>
                          <span className="text-[10px] text-white/[0.25]">{a.weight}%</span>
                        </div>
                      </div>
                      <TinySparkline data={a.sparkData} positive={a.totalGain >= 0} />
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-medium tabular-nums text-white">${a.value.toLocaleString()}</p>
                        <p className={`text-[10px] tabular-nums ${a.today >= 0 ? "text-[#34D399]" : "text-[#F87171]"}`}>
                          {a.today >= 0 ? "+" : ""}{a.today}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Allocation */}
              <AllocationCard data={allocationData} totalValue={portfolioSummary.totalValue} size="large" />

              {/* Trades */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Recent Trades</h3>
                  <span className="text-[10px] text-white/[0.25]">Last 30 days</span>
                </div>
                <div className="space-y-0.5">
                  {trades.map((t, i) => <TradeRow key={i} trade={t} />)}
                </div>
              </GlassCard>
            </div>

            {/* Trade Queue — pending recommendations */}
            <GlassCard className="p-5">
              <TradeQueue trades={pendingTrades} />
            </GlassCard>

            {/* Strategy */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Investment Strategy</h3>
                <span className="text-[10px] text-white/[0.25]">AI-managed</span>
              </div>
              <div className="flex gap-10">
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-white mb-2">Growth-focused</p>
                  <p className="text-[12px] leading-relaxed text-white/[0.38] max-w-lg">
                    80% equities tilted toward US large-cap via VOO. Individual stock positions in AAPL and MSFT for
                    sector concentration. 8% bond allocation for stability. Rebalance quarterly or when drift exceeds 5%.
                  </p>
                </div>
                <div className="w-56 space-y-3.5 shrink-0">
                  {[
                    { label: "Risk Level", value: "Moderate", pct: 55 },
                    { label: "Rebalance", value: "Quarterly", pct: 25 },
                    { label: "Dividend", value: "Reinvest", pct: 100 },
                    { label: "Drawdown Limit", value: "-15%", pct: 75 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25]">{item.label}</span>
                        <span className="text-[11px] font-medium text-white/[0.7]">{item.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#818CF8]/60 to-[#67E8F9]/40"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
