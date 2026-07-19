"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingDown,
  ArrowDownRight,
  Minimize2,
  Clock,
  Circle,
  Calendar,
  AlertTriangle,
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
import { DebtVsInvestModal } from "@/components/debt/debt-vs-invest-modal"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { StatPill } from "@/components/portfolio/stat-pill"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import { DebtDonut } from "@/components/debt/debt-donut"
import {
  debts,
  debtSummary,
  chartData,
  allThemes,
  getDebtsWithTheme,
  useDebtData,
} from "@/lib/debt/data"
import { useDebtConnection } from "@/lib/debt/use-debt-connection"
import { DebtLocked } from "@/components/debt/debt-locked"
import { useCountUp } from "@/lib/debt/hooks"
import { LiquidGlassBg } from "@/components/debt/liquid-glass-bg"

/* ================================================================== */
/*  Chart tooltip                                                     */
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
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1.5">{label}</p>
      <div className="flex items-baseline gap-4">
        <div>
          <p className="text-[10px] text-white/[0.38]">Balance</p>
          <p className="text-sm font-semibold text-white tabular-nums">${val.toLocaleString()}</p>
        </div>
        {paid != null && (
          <div>
            <p className="text-[10px] text-white/[0.38]">Paid</p>
            <p className="text-sm font-semibold text-[#34D399] tabular-nums">-${paid.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Theme switcher                                                    */
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
            className={cn("h-3 w-3 rounded-full transition-transform duration-200", activeKey === t.key ? "scale-125" : "scale-100")}
            style={{ backgroundColor: t.accent }}
          />
          <span className={cn("text-[10px] font-medium transition-colors duration-150", activeKey === t.key ? "text-white" : "text-white/[0.38] group-hover:text-white/[0.6]")}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Progress ring SVG                                                 */
/* ================================================================== */

function ProgressRing({ percent, color, size = 120 }: { percent: number; color: string; size?: number }) {
  const r = (size - 16) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#F7F8FA" fontSize="22" fontWeight="600">
        {percent}%
      </text>
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="10">
        paid off
      </text>
    </svg>
  )
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function DebtFullPage() {
  const [themeKey, setThemeKey] = useState("amber")
  const [timeRange, setTimeRange] = useState("1Y")
  const [showCompare, setShowCompare] = useState(false)
  const themeData = allThemes.find((t) => t.key === themeKey) ?? allThemes[0]
  const theme = themeData.theme
  const { isConnected } = useDebtConnection()
  const { debts: hookDebts, summary: hookSummary, chartData: hookChartData } = useDebtData()
  const displayDebts = hookDebts.map((d, i) => ({ ...d, color: theme.chartColors[i % theme.chartColors.length] }))
  const displaySummary = hookSummary
  const displayChartData = hookChartData
  const animatedValue = useCountUp(displaySummary.totalDebt)

  return (
    <div className="dark flex h-screen w-full">
      <LiquidGlassBg primary={theme.primary} secondary={theme.chartColors[1]} />
      <AppSidebar triggerPosition="top-left" />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primaryDim }}>
              <TrendingDown className="h-4 w-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">Debt — Full View</h1>
              <p className="text-[11px] text-white/[0.38]">{themeData.label} theme · Terminal grid — breakdown, timeline, strategy</p>
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
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              className="flex h-8 items-center gap-1.5 rounded-md border px-3 text-[11px] font-medium transition-all duration-150 active:scale-95 border-[#67E8F9]/30 bg-[#67E8F9]/10 text-[#67E8F9] hover:bg-[#67E8F9]/15"
            >
              <TrendingDown className="h-3 w-3" />
              Compare
            </button>
            <Link href="/">
              <MetalButton preset="chromatic" theme="dark" variant="outline" size="sm" className="gap-2 text-xs" strength={0.7}>
                <Minimize2 className="h-3.5 w-3.5" />
                Collapse
              </MetalButton>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {!isConnected ? (
              <DebtLocked variant="full" />
            ) : (
              <>
            {/* Hero stats row */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">Total Debt</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
                    ${Math.round(animatedValue).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#34D399]">
                    <ArrowDownRight className="h-3.5 w-3.5" />-${Math.abs(displaySummary.monthOverMonthChange).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Monthly" value={`$${displaySummary.monthlyPayment.toLocaleString()}`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Avg APR" value={`${displaySummary.weightedApr}%`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Debts" value={displaySummary.debtCount.toString()} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Paid" value={`${displaySummary.percentPaid}%`} color="green" />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Interest Left" value={`$${displaySummary.totalInterestRemaining.toLocaleString()}`} color="red" />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Debt-Free" value={displaySummary.estimatedDebtFree} />
            </div>

            {/* Large chart */}
            <GlassCard className="p-5">
              <div className="relative h-[380px] w-full">
                <div className="absolute top-3 left-5 z-10 flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <ArrowDownRight className="h-3 w-3 text-[#34D399]" />
                    <span className="text-[10px] text-white/[0.5]">Best</span>
                    <span className="text-[10px] font-semibold text-[#34D399]">--</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <TrendingDown className="h-3 w-3" style={{ color: theme.primary }} />
                    <span className="text-[10px] text-white/[0.5]">Worst</span>
                    <span className="text-[10px] font-semibold" style={{ color: theme.primary }}>--</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayChartData} margin={{ top: 36, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="debtFullChartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.primary} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} dx={-8} domain={["dataMin - 5000", "dataMax + 5000"]} />
                    <Tooltip content={<DebtChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                    <Area
                      type="monotone" dataKey="totalBalance" stroke={theme.primary} strokeWidth={2}
                      fill="url(#debtFullChartGlow)" dot={false}
                      activeDot={{ r: 4, fill: "#08090C", stroke: theme.primary, strokeWidth: 2 }}
                      style={{ filter: `drop-shadow(0 0 6px ${theme.primaryGlow})` }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Donut + Breakdown + Progress — 3 columns */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Donut */}
              <GlassCard className="p-5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38] mb-2">
                  Debt Composition
                </h3>
                <DebtDonut debts={displayDebts} totalDebt={displaySummary.totalDebt} theme={theme} size="large" />
              </GlassCard>

              {/* Breakdown table */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Breakdown</h3>
                  <span className="text-[10px] text-white/[0.25]">Sorted by balance</span>
                </div>
                <div className="space-y-1">
                  {displayDebts.map((d) => {
                    const pctPaid = ((d.originalBalance - d.balance) / d.originalBalance) * 100
                    const isUrgent = d.apr >= 15
                    return (
                      <div key={d.id} className="rounded-lg py-3 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[12px] font-medium text-white">{d.name}</span>
                            {isUrgent && <AlertTriangle className="h-3 w-3 text-[#FB7171]" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] tabular-nums text-white">${d.balance.toLocaleString()}</span>
                            <span className={cn("text-[10px] tabular-nums", isUrgent ? "text-[#FB7171] font-medium" : d.apr === 0 ? "text-[#34D399]" : "text-white/[0.4]")}>{d.apr}% APR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.04]">
                            <div className="h-full rounded-full" style={{ width: `${pctPaid}%`, backgroundColor: d.color, opacity: 0.7 }} />
                          </div>
                          <span className="text-[9px] tabular-nums text-white/[0.35]">{pctPaid.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] text-white/[0.25]">
                          <span>${d.minimumPayment}/mo · due {d.paymentDay}{d.paymentDay === 1 ? "st" : d.paymentDay === 2 ? "nd" : d.paymentDay === 3 ? "rd" : "th"}</span>
                          <span>Est: {d.estimatedPayoff}</span>
                          {d.interestPaid > 0 && <span>Interest paid: ${d.interestPaid.toLocaleString()}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>

              {/* Progress + Next payment */}
              <GlassCard className="p-5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-4">
                  Progress
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <ProgressRing percent={displaySummary.percentPaid} color={theme.primary} size={140} />
                  <div className="w-full space-y-2.5 pt-2 border-t border-white/[0.06]">
                    {[
                      { label: "Paid", value: `$${(displaySummary.totalOriginalDebt - displaySummary.totalDebt).toLocaleString()}` },
                      { label: "Remaining", value: `$${displaySummary.totalDebt.toLocaleString()}` },
                      { label: "Debt-free", value: displaySummary.estimatedDebtFree },
                      { label: "Months left", value: displaySummary.debtCount > 0 ? "--" : "--" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-white/[0.38]">{item.label}</span>
                        <span className="text-[11px] font-medium text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Payoff Timeline */}
            <GlassCard className="p-5">
              <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-4">
                Payoff Timeline
              </h3>
              <div className="space-y-3">
                {displayDebts.map((d) => {
                  const pctPaid = ((d.originalBalance - d.balance) / d.originalBalance) * 100
                  // Estimate months remaining from sparkdata trend
                  const pctRemaining = 100 - pctPaid
                  return (
                    <div key={d.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] text-white">{d.name}</span>
                      </div>
                      <div className="flex-1 relative h-5 rounded-full bg-white/[0.03]">
                        {/* Paid portion */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${pctPaid}%`,
                            backgroundColor: d.color,
                            opacity: 0.35,
                          }}
                        />
                        {/* Current marker */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full"
                          style={{
                            left: `${pctPaid}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/[0.38] min-w-[60px] text-right">{d.estimatedPayoff}</span>
                    </div>
                  )
                })}
                {/* Today marker line */}
                <div className="flex items-center gap-4">
                  <div className="min-w-[120px]" />
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="w-px h-6 bg-white/[0.15]" />
                    <span className="text-[9px] text-white/[0.25]">Today</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Strategy + Weekly progress — 2 columns */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Strategy */}
              <GlassCard className="p-5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-4">
                  Debt Strategy
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Avalanche */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-white">Avalanche</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primaryDim, color: theme.primary }}>Recommended</span>
                    </div>
                    <p className="text-[10px] text-white/[0.38] mb-3">Pay highest APR first</p>
                    <div className="space-y-1.5">
                      {[...displayDebts].sort((a, b) => b.apr - a.apr).map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-white/[0.25] w-3">{i + 1}.</span>
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[11px] text-white flex-1">{d.name}</span>
                          <span className={cn("text-[10px] tabular-nums", d.apr >= 15 ? "text-[#FB7171]" : "text-white/[0.4]")}>{d.apr}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-between text-[10px]">
                      <span className="text-white/[0.38]">Interest saved</span>
                      <span className="text-[#34D399] font-medium">--</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/[0.38]">Debt-free</span>
                      <span className="text-white font-medium">--</span>
                    </div>
                  </div>

                  {/* Snowball */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-white">Snowball</span>
                    </div>
                    <p className="text-[10px] text-white/[0.38] mb-3">Pay smallest balance first</p>
                    <div className="space-y-1.5">
                      {[...displayDebts].sort((a, b) => a.balance - b.balance).map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-white/[0.25] w-3">{i + 1}.</span>
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[11px] text-white flex-1">{d.name}</span>
                          <span className="text-[10px] tabular-nums text-white/[0.4]">${d.balance.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-between text-[10px]">
                      <span className="text-white/[0.38]">Interest saved</span>
                      <span className="text-[#34D399] font-medium">--</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/[0.38]">Debt-free</span>
                      <span className="text-white font-medium">--</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Weekly progress */}
              <GlassCard className="p-5">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-4">
                  Weekly Progress
                </h3>
                <div className="space-y-4">
                  {/* Cumulative stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "This week", value: displaySummary.totalPaidThisWeek > 0 ? `-$${displaySummary.totalPaidThisWeek.toLocaleString()}` : "--", pct: "--" },
                      { label: "This month", value: displaySummary.totalPaidThisMonth > 0 ? `-$${displaySummary.totalPaidThisMonth.toLocaleString()}` : "--", pct: "--" },
                      { label: "This year", value: displaySummary.totalPaidThisYear > 0 ? `-$${displaySummary.totalPaidThisYear.toLocaleString()}` : "--", pct: "--" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                        <span className="text-[9px] text-white/[0.38] block">{s.label}</span>
                        <span className="text-[15px] font-semibold text-[#34D399] block mt-0.5">{s.value}</span>
                        <span className="text-[10px] text-white/[0.35]">{s.pct}</span>
                      </div>
                    ))}
                  </div>

                  {/* Week bars */}
                  <div className="space-y-2.5">
                    {(displaySummary.totalPaidThisMonth > 0 ? [
                      { label: "W1", value: displaySummary.totalPaidThisMonth * 0.22, max: displaySummary.totalPaidThisMonth },
                      { label: "W2", value: displaySummary.totalPaidThisMonth * 0.27, max: displaySummary.totalPaidThisMonth },
                      { label: "W3", value: displaySummary.totalPaidThisMonth * 0.18, max: displaySummary.totalPaidThisMonth },
                      { label: "W4", value: displaySummary.totalPaidThisMonth * 0.33, max: displaySummary.totalPaidThisMonth },
                    ] : [
                      { label: "W1", value: 0, max: 1 },
                      { label: "W2", value: 0, max: 1 },
                      { label: "W3", value: 0, max: 1 },
                      { label: "W4", value: 0, max: 1 },
                    ]).map((w) => (
                      <div key={w.label} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/[0.25] w-5">{w.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(w.value / w.max) * 100}%`, backgroundColor: theme.primary, opacity: 0.7 }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-white/[0.4] w-10 text-right">${w.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Average */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-white/[0.38]">Avg/week this month</span>
                    <span className="text-[11px] font-medium text-white">--</span>
                  </div>

                  {/* Next payment */}
                  {displayDebts.length > 0 ? (
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-white/[0.25]" />
                    <div>
                      <span className="text-[11px] font-medium text-white block">Next payment data pending</span>
                      <span className="text-[10px] text-white/[0.38]">Sync your accounts to see upcoming payments</span>
                    </div>
                  </div>
                  ) : null}
                </div>
              </GlassCard>
            </div>
            </>
            )}
          </div>
        </div>
      </main>

      {/* Theme switcher */}
      <ThemeSwitcher activeKey={themeKey} onSelect={setThemeKey} />

      {/* Debt vs Invest modal */}
      <DebtVsInvestModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        debts={displayDebts}
        extraCash={500}
        expectedReturn={0.07}
        employerMatch={4200}
        employerMatchCaptured={3600}
      />
    </div>
  )
}
