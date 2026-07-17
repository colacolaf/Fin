"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingDown,
  ArrowDownRight,
  Maximize2,
  Clock,
  Circle,
  Calendar,
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
import { cn } from "@/lib/utils"
import { MetalButton } from "@/components/ui/metal-button"
import { Sidebar } from "@/components/portfolio/sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { StatPill } from "@/components/portfolio/stat-pill"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import { ChartTooltip } from "@/components/portfolio/chart-tooltip"
import { DebtDonut } from "@/components/debt/debt-donut"
import {
  debts,
  debtSummary,
  chartData,
  allThemes,
  getDebtsWithTheme,
} from "@/lib/debt/data"
import { useCountUp } from "@/lib/debt/hooks"
import type { DebtTheme } from "@/lib/debt/types"

/* ================================================================== */
/*  Debt chart tooltip                                                */
/* ================================================================== */

function DebtChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload?: { paidThisMonth?: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const paid = payload[0].payload?.paidThisMonth
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-4">
        <div>
          <p className="text-[10px] text-white/[0.38]">Balance</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            ${val.toLocaleString()}
          </p>
        </div>
        {paid != null && (
          <div>
            <p className="text-[10px] text-white/[0.38]">Paid</p>
            <p className="text-sm font-semibold text-[#34D399] tabular-nums">
              -${paid.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Theme switcher sidebar                                            */
/* ================================================================== */

function ThemeSwitcher({
  activeKey,
  onSelect,
}: {
  activeKey: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {allThemes.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn(
            "group flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-200",
            "border backdrop-blur-xl",
            activeKey === t.key
              ? "bg-white/[0.08] border-white/[0.15] shadow-lg"
              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]"
          )}
          title={t.label}
        >
          <div
            className={cn(
              "h-3 w-3 rounded-full transition-transform duration-200",
              activeKey === t.key ? "scale-125" : "scale-100"
            )}
            style={{ backgroundColor: t.accent }}
          />
          <span
            className={cn(
              "text-[10px] font-medium transition-colors duration-150",
              activeKey === t.key ? "text-white" : "text-white/[0.38] group-hover:text-white/[0.6]"
            )}
          >
            {t.label}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Dashboard metrics row for debt                                    */
/* ================================================================== */

function DebtMetricsRow({
  summary,
  animatedValue,
  theme,
}: {
  summary: typeof debtSummary
  animatedValue: number
  theme: DebtTheme
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
      <div className="flex flex-col">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
          Total Debt
        </span>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
            ${Math.round(animatedValue).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-[13px] font-medium text-[#34D399]">
            <ArrowDownRight className="h-3.5 w-3.5" />
            -${Math.abs(summary.monthOverMonthChange).toLocaleString()}
          </span>
        </div>
      </div>
      <Divider />
      <StatPill label="Monthly" value={`$${summary.monthlyPayment.toLocaleString()}`} />
      <Divider />
      <StatPill label="Avg APR" value={`${summary.weightedApr}%`} />
      <Divider />
      <StatPill label="Debts" value={summary.debtCount.toString()} />
      <Divider />
      <StatPill label="Paid" value={`${summary.percentPaid}%`} color="green" />
      <Divider />
      <StatPill label="Interest" value={`$${summary.totalInterestRemaining.toLocaleString()}`} color="red" />
    </div>
  )
}

function Divider() {
  return <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function DebtPage() {
  const [themeKey, setThemeKey] = useState("amber")
  const [timeRange, setTimeRange] = useState("1Y")
  const themeData = allThemes.find((t) => t.key === themeKey) ?? allThemes[0]
  const theme = themeData.theme
  const themedDebts = getDebtsWithTheme(theme)
  const animatedValue = useCountUp(debtSummary.totalDebt)

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: theme.primaryDim }}
            >
              <TrendingDown className="h-4 w-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">Debt</h1>
              <p className="text-[11px] text-white/[0.38]">
                {themeData.label} theme · Dashboard view
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-[#34D399] text-[#34D399]" />
              <span className="text-[11px] text-white/[0.38]">On Track</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/[0.25]">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">Updated 5m ago</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {/* Metrics */}
            <DebtMetricsRow summary={debtSummary} animatedValue={animatedValue} theme={theme} />

            {/* Chart + Donut split */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Debt paydown chart — 2/3 */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38]">
                    Debt Paydown
                  </h2>
                  <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                </div>
                <div className="relative h-[320px] w-full">
                  <div className="absolute top-3 left-5 z-10 flex gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                      <ArrowDownRight className="h-3 w-3 text-[#34D399]" />
                      <span className="text-[10px] text-white/[0.5]">Best</span>
                      <span className="text-[10px] font-semibold text-[#34D399]">-$2,100</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                      <TrendingDown className="h-3 w-3" style={{ color: theme.primary }} />
                      <span className="text-[10px] text-white/[0.5]">Worst</span>
                      <span className="text-[10px] font-semibold" style={{ color: theme.primary }}>-$420</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 36, right: 12, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="debtChartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={theme.primary} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} dy={8} />
                      <YAxis
                        axisLine={false} tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        dx={-8}
                        domain={["dataMin - 5000", "dataMax + 5000"]}
                      />
                      <Tooltip
                        content={<DebtChartTooltip />}
                        cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <Area
                        type="monotone" dataKey="totalBalance"
                        stroke={theme.primary} strokeWidth={2}
                        fill="url(#debtChartGlow)" dot={false}
                        activeDot={{ r: 4, fill: "#08090C", stroke: theme.primary, strokeWidth: 2 }}
                        style={{ filter: `drop-shadow(0 0 6px ${theme.primaryGlow})` }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Right column */}
              <div className="space-y-4">
                {/* Interactive Donut */}
                <GlassCard className="p-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-2">
                    Composition
                  </h3>
                  <DebtDonut
                    debts={themedDebts}
                    totalDebt={debtSummary.totalDebt}
                    theme={theme}
                  />
                </GlassCard>
              </div>
            </div>

            {/* Debt Stack + Stats */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Debt Stack */}
              <GlassCard className="lg:col-span-3 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                    Debt Stack
                  </h3>
                  <span className="text-[10px] text-white/[0.25]">{debts.length} debts · sorted by balance</span>
                </div>
                {/* Header row */}
                <div className="grid grid-cols-[130px_72px_52px_1fr_56px_64px] gap-3 pb-2.5 border-b border-white/[0.04]">
                  {["Debt", "Balance", "APR", "Progress", "Min/mo", "Payoff"].map((h) => (
                    <span
                      key={h}
                      className={cn(
                        "text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25]",
                        h !== "Debt" && "text-right"
                      )}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {themedDebts.map((d) => (
                    <div
                      key={d.id}
                      className="grid grid-cols-[130px_72px_52px_1fr_56px_64px] gap-3 items-center py-2.5 -mx-2 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <div>
                          <p className="text-[13px] font-medium text-white">{d.name}</p>
                          <p className="text-[10px] text-white/[0.38]">
                            {((d.balance / debtSummary.totalDebt) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <span className="text-right text-[12px] font-medium tabular-nums text-white">
                        ${d.balance.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          "text-right text-[12px] tabular-nums",
                          d.apr >= 15
                            ? "text-[#FB7171] font-medium"
                            : d.apr === 0
                              ? "text-[#34D399]"
                              : "text-white/[0.5]"
                        )}
                      >
                        {d.apr}%
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${((d.originalBalance - d.balance) / d.originalBalance) * 100}%`,
                              backgroundColor: d.color,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-white/[0.35] w-8 text-right">
                          {((d.originalBalance - d.balance) / d.originalBalance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-right text-[12px] tabular-nums text-white/[0.5]">
                        ${d.minimumPayment}
                      </span>
                      <span className="text-right text-[11px] text-white/[0.5]">
                        {d.estimatedPayoff}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Right: Quick stats + mini chart */}
              <GlassCard className="lg:col-span-2 p-5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-4">
                  Monthly Progress
                </h3>
                <div className="space-y-4">
                  {/* Week bars */}
                  {[
                    { label: "Week 1", value: 280, max: 500 },
                    { label: "Week 2", value: 340, max: 500 },
                    { label: "Week 3", value: 220, max: 500 },
                    { label: "Week 4", value: 420, max: 500 },
                  ].map((w) => (
                    <div key={w.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/[0.38]">{w.label}</span>
                        <span className="text-[10px] tabular-nums text-white/[0.5]">${w.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(w.value / w.max) * 100}%`,
                            backgroundColor: theme.primary,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/[0.38]">Next payment</span>
                      <span className="text-[11px] font-medium text-white">Dec 15</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-white/[0.25]" />
                      <span className="text-[11px] text-white/[0.5]">Credit Card — $250</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Expand button */}
            <div className="flex justify-center pt-1 pb-4">
              <Link href="/debt/full">
                <MetalButton preset="chromatic" theme="dark" variant="outline" size="sm" className="gap-2 text-xs" strength={0.7}>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Expand Debt View
                </MetalButton>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Theme switcher */}
      <ThemeSwitcher activeKey={themeKey} onSelect={setThemeKey} />
    </div>
  )
}
