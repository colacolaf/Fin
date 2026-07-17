"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  Maximize2,
  TrendingUp,
  Clock,
  Circle,
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

import { Sidebar } from "@/components/portfolio/sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { StatPill } from "@/components/portfolio/stat-pill"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import { TinySparkline } from "@/components/portfolio/tiny-sparkline"
import { ChartTooltip } from "@/components/portfolio/chart-tooltip"
import { AllocationCard } from "@/components/portfolio/allocation-card"
import { TradeRow } from "@/components/portfolio/trade-row"
import { MetricsRow } from "@/components/portfolio/metrics-row"

import { portfolioSummary, chartData, allocationData, holdings, trades } from "@/lib/portfolio/data"
import { useCountUp } from "@/lib/portfolio/hooks"

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = useState("1Y")
  const animatedValue = useCountUp(portfolioSummary.totalValue)

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#818CF8]/10">
              <TrendingUp className="h-4 w-4 text-[#818CF8]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">Portfolio</h1>
              <p className="text-[11px] text-white/[0.38]">Analyst split view</p>
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
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {/* Metrics */}
            <MetricsRow summary={portfolioSummary} animatedValue={animatedValue} />

            {/* Time range */}
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38]">Performance</h2>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* Chart (2/3) + Right column (1/3) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Performance chart */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="relative h-[380px] w-full">
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
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 36, right: 12, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#chartGlow)" dot={false}
                        activeDot={{ r: 4, fill: "#08090C", stroke: "#818CF8", strokeWidth: 2 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(129,140,248,0.3))" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Right column */}
              <div className="space-y-4">
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">Day P&amp;L</p>
                  <p className="text-[22px] font-semibold text-[#34D399] tabular-nums">
                    +${portfolioSummary.dayPnl.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-white/[0.38]">+1.01% today</p>
                </GlassCard>

                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">Total Return</p>
                  <p className="text-[22px] font-semibold text-white tabular-nums">
                    +{portfolioSummary.totalReturn}%
                  </p>
                  <p className="text-[11px] text-white/[0.38]">Since Jan 2025</p>
                </GlassCard>

                <AllocationCard data={allocationData} totalValue={portfolioSummary.totalValue} />
              </div>
            </div>

            {/* Holdings + Trades */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Holdings */}
              <GlassCard className="lg:col-span-3 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Holdings</h3>
                  <span className="text-[10px] text-white/[0.25]">{holdings.length} assets</span>
                </div>
                <div className="grid grid-cols-[1fr_56px_72px_56px_72px_72px] gap-3 pb-2.5 border-b border-white/[0.04]">
                  {["Asset", "Weight", "Today", "Gain", "Trend", "Value"].map((h) => (
                    <span key={h} className={`text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25] ${h !== "Asset" && h !== "Trend" ? "text-right" : ""}`}>
                      {h}
                    </span>
                  ))}
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {holdings.map((h) => (
                    <div key={h.ticker} className="grid grid-cols-[1fr_56px_72px_56px_72px_72px] gap-3 items-center py-2.5 -mx-2 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]">
                      <div>
                        <p className="text-[13px] font-medium text-white">{h.ticker}</p>
                        <p className="text-[10px] text-white/[0.38]">{h.name}</p>
                      </div>
                      <span className="text-right text-[12px] tabular-nums text-white/[0.5]">{h.weight}%</span>
                      <span className={`text-right text-[12px] font-medium tabular-nums ${h.today >= 0 ? "text-[#34D399]" : "text-[#F87171]"}`}>
                        {h.today >= 0 ? "+" : ""}{h.today}%
                      </span>
                      <span className={`text-right text-[12px] tabular-nums ${h.totalGain >= 0 ? "text-[#34D399]" : "text-[#F87171]"}`}>
                        {h.totalGain >= 0 ? "+" : ""}{h.totalGain}%
                      </span>
                      <div className="flex justify-end">
                        <TinySparkline data={h.sparkData} positive={h.totalGain >= 0} />
                      </div>
                      <span className="text-right text-[12px] font-medium tabular-nums text-white">
                        ${h.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Trades */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Recent Trades</h3>
                  <span className="text-[10px] text-white/[0.25]">Last 30 days</span>
                </div>
                <div className="space-y-0.5">
                  {trades.map((t, i) => <TradeRow key={i} trade={t} />)}
                </div>
              </GlassCard>
            </div>

            {/* Expand */}
            <div className="flex justify-center pt-1 pb-4">
              <Link href="/portfolio/full">
                <MetalButton preset="chromatic" theme="dark" variant="outline" size="sm" className="gap-2 text-xs" strength={0.7}>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Expand Portfolio
                </MetalButton>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
