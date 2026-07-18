"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Maximize2,
  Clock,
  Circle,
  Check,
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
  ReferenceLine,
} from "recharts"
import { cn } from "@/lib/utils"
import { MetalButton } from "@/components/ui/metal-button"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import { PiggyBankIcon } from "@/components/retirement/piggy-bank-icon"
import {
  retirementAccounts,
  retirementSummary,
  chartData,
} from "@/lib/retirement/data"

/* ================================================================== */
/*  Chart Tooltip                                                     */
/* ================================================================== */

function RetirementTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1.5">
        Age {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor:
                p.dataKey === "projected"
                  ? "#67E8F9"
                  : p.dataKey === "target"
                    ? "rgba(255,255,255,0.25)"
                    : "#FBBF24",
            }}
          />
          <span className="text-[11px] text-white/[0.5] capitalize">
            {p.dataKey}
          </span>
          <span className="text-[12px] font-semibold text-white tabular-nums">
            ${(p.value / 1000).toFixed(0)}k
          </span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function RetirementPage() {
  const [timeRange, setTimeRange] = useState("1Y")
  const s = retirementSummary
  const matchPercent = Math.round((s.employerMatchCaptured / s.employerMatchAvailable) * 100)

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <AppSidebar triggerPosition="top-left" />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#67E8F9]/10">
              <PiggyBankIcon className="h-4 w-4 text-[#67E8F9]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">
                Retirement
              </h1>
              <p className="text-[11px] text-white/[0.38]">
                Readiness overview · accounts · projections
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

            {/* Hero stats row */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
                  Readiness
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
                    {s.fundedPercentage}%
                  </span>
                  <span className="text-[13px] font-medium text-[#67E8F9]">funded</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Projected Income
                </span>
                <span className="text-[15px] font-semibold text-white tabular-nums">
                  ${s.projectedAnnualIncome.toLocaleString()}/yr
                </span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Monthly Gap
                </span>
                <span className="text-[15px] font-semibold text-[#FBBF24] tabular-nums">
                  ${s.monthlyGap}/mo
                </span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Total Saved
                </span>
                <span className="text-[15px] font-semibold text-white tabular-nums">
                  ${s.totalSaved.toLocaleString()}
                </span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Years Left
                </span>
                <span className="text-[15px] font-semibold text-white tabular-nums">
                  {s.yearsToRetirement}
                </span>
              </div>
            </div>

            {/* Time range */}
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38]">
                Projected Growth
              </h2>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* Chart (2/3) + Right column (1/3) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Growth chart */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="relative h-[380px] w-full" style={{ minWidth: 250 }}>
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="retGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#67E8F9" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#67E8F9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="age"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        dx={-8}
                      />
                      <Tooltip content={<RetirementTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                      <ReferenceLine
                        x={s.targetRetirementAge}
                        stroke="rgba(255,255,255,0.15)"
                        strokeDasharray="4 4"
                      />
                      <Area
                        type="monotone"
                        dataKey="projected"
                        stroke="#67E8F9"
                        strokeWidth={2}
                        fill="url(#retGrowthGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#08090C", stroke: "#67E8F9", strokeWidth: 2 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(103,232,249,0.3))" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Right column */}
              <div className="space-y-4">
                {/* Readiness ring */}
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-3">
                    Readiness Score
                  </p>
                  <div className="flex justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none" stroke="#67E8F9" strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 - (s.fundedPercentage / 100) * 2 * Math.PI * 52}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                      />
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#F7F8FA" fontSize="22" fontWeight="600">
                        {s.fundedPercentage}%
                      </text>
                      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="10">
                        funded
                      </text>
                    </svg>
                  </div>
                </GlassCard>

                {/* Employer match */}
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-2">
                    Employer Match
                  </p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-white tabular-nums">
                      ${s.employerMatchCaptured.toLocaleString()} / ${s.employerMatchAvailable.toLocaleString()}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      matchPercent >= 100 ? "text-[#34D399]" : "text-[#FBBF24]"
                    )}>
                      {matchPercent >= 100 ? "Full ✓" : `$${s.employerMatchAvailable - s.employerMatchCaptured} left`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#67E8F9]/60 transition-all duration-700"
                      style={{ width: `${matchPercent}%` }}
                    />
                  </div>
                </GlassCard>

                {/* Income breakdown */}
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-3">
                    Income at {s.targetRetirementAge}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/[0.50]">Portfolio (4%)</span>
                      <span className="text-[12px] font-medium tabular-nums text-[#67E8F9]">
                        ${s.projectedAnnualIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/[0.50]">Social Security</span>
                      <span className="text-[12px] font-medium tabular-nums text-[#818CF8]">
                        ${s.socialSecurityEstimate.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white">Total</span>
                      <span className="text-[13px] font-semibold tabular-nums text-white">
                        ${(s.projectedAnnualIncome + s.socialSecurityEstimate).toLocaleString()}/yr
                      </span>
                    </div>
                    {(s.projectedAnnualIncome + s.socialSecurityEstimate) >= s.neededAtRetirement ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#34D399]">
                        <Check className="h-3 w-3" /> On track with SS
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#FBBF24]">
                        <AlertTriangle className="h-3 w-3" /> ${s.monthlyGap}/mo gap without SS
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Accounts table */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Retirement Accounts
                </h3>
                <span className="text-[10px] text-white/[0.25]">
                  {retirementAccounts.length} accounts
                </span>
              </div>
              <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-3 pb-2.5 border-b border-white/[0.04]">
                {["Account", "Balance", "Contrib %", "Match", "Vested"].map((h) => (
                  <span
                    key={h}
                    className={`text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25] ${h !== "Account" ? "text-right" : ""}`}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="divide-y divide-white/[0.03]">
                {retirementAccounts.map((acct) => (
                  <div
                    key={acct.id}
                    className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-3 items-center py-2.5 -mx-2 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-white">{acct.name}</p>
                      <p className="text-[10px] text-white/[0.38]">{acct.provider} · {acct.type.toUpperCase()}</p>
                    </div>
                    <span className="text-right text-[12px] font-medium tabular-nums text-white">
                      ${acct.balance.toLocaleString()}
                    </span>
                    <span className="text-right text-[12px] tabular-nums text-white/[0.5]">
                      {acct.contributionRate}%
                    </span>
                    <span className="text-right text-[12px] tabular-nums text-white/[0.5]">
                      {acct.employerMatchMax > 0
                        ? `$${acct.employerMatch.toLocaleString()}`
                        : "—"}
                    </span>
                    <span className="text-right text-[12px] tabular-nums text-white/[0.5]">
                      {acct.vestedPercent}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] font-medium text-white">Total</span>
                <span className="text-[14px] font-semibold tabular-nums text-white">
                  ${s.totalSaved.toLocaleString()}
                </span>
              </div>
            </GlassCard>

            {/* Expand */}
            <div className="flex justify-center pt-1 pb-4">
              <Link href="/retirement/full">
                <MetalButton
                  preset="chromatic"
                  theme="dark"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  strength={0.7}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Expand Retirement
                </MetalButton>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
