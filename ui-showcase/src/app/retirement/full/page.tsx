"use client"

import * as React from "react"
import Link from "next/link"
import {
  Minimize2,
  Clock,
  Circle,
  AlertTriangle,
  Check,
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
import { LiquidGlassBg } from "@/components/debt/liquid-glass-bg"
import { PiggyBankIcon } from "@/components/retirement/piggy-bank-icon"
import {
  retirementAccounts,
  retirementSummary,
  chartData,
  useRetirementData,
} from "@/lib/retirement/data"
import { useRetirementConnection } from "@/lib/retirement/use-retirement-connection"
import { RetirementLocked } from "@/components/retirement/retirement-locked"

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
                    : p.dataKey === "optimistic"
                      ? "#34D399"
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
/*  Timeline milestones                                               */
/* ================================================================== */

const milestones = [
  { age: 45, label: "Match max captured", color: "#34D399" },
  { age: 50, label: "Catch-up eligible", color: "#FBBF24" },
  { age: 59, label: "Penalty-free IRA", color: "#818CF8" },
  { age: 62, label: "Early Social Sec.", color: "#FB7185" },
  { age: 65, label: "Target retirement", color: "#67E8F9" },
]

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function RetirementFullPage() {
  const { isConnected } = useRetirementConnection()
  const { accounts: hookAccounts, summary: hookSummary, chartData: hookChartData } = useRetirementData()
  const s = hookSummary
  const displayAccounts = hookAccounts
  const displayChartData = hookChartData

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <LiquidGlassBg primary="#67E8F9" secondary="#818CF8" />
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
                Retirement — Full View
              </h1>
              <p className="text-[11px] text-white/[0.38]">
                Timeline projection · accounts · strategy
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

            {!isConnected ? (
              <RetirementLocked variant="full" />
            ) : (
              <>

            {/* Hero stats */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
                  Readiness
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
                    {s.fundedPercentage}%
                  </span>
                  <span className="text-[13px] font-medium text-[#67E8F9]">
                    funded
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Projected Income</span>
                <span className="text-[15px] font-semibold text-white tabular-nums">${s.projectedAnnualIncome.toLocaleString()}/yr</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Monthly Gap</span>
                <span className="text-[15px] font-semibold text-[#FBBF24] tabular-nums">${s.monthlyGap}/mo</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Total Saved</span>
                <span className="text-[15px] font-semibold text-white tabular-nums">${s.totalSaved.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Target Age</span>
                <span className="text-[15px] font-semibold text-white tabular-nums">{s.targetRetirementAge}</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Social Security</span>
                <span className="text-[15px] font-semibold text-white tabular-nums">${s.socialSecurityEstimate.toLocaleString()}/yr</span>
              </div>
            </div>

            {/* Timeline hero */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Age Progression
                </h3>
                <span className="text-[10px] text-white/[0.25]">
                  {s.yearsToRetirement} years to goal
                </span>
              </div>

              {/* Timeline bar */}
              <div className="relative mb-6">
                <div className="h-3 w-full rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#67E8F9]/50 to-[#34D399]/40"
                    style={{
                      width: `${((s.currentAge - 25) / (s.targetRetirementAge - 25)) * 100}%`,
                    }}
                  />
                </div>
                {/* Current marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{
                    left: `${((s.currentAge - 25) / (s.targetRetirementAge - 25)) * 100}%`,
                  }}
                >
                  <div className="h-5 w-1 rounded-full bg-[#67E8F9] -mt-px" />
                  <span className="mt-1.5 text-[10px] font-medium text-[#67E8F9]">
                    You · {s.currentAge}
                  </span>
                </div>
                {/* Goal marker */}
                <div className="absolute top-1/2 -translate-y-1/2 right-0 flex flex-col items-center">
                  <div className="h-5 w-1 rounded-full bg-white/[0.3] -mt-px" />
                  <span className="mt-1.5 text-[10px] font-medium text-white/[0.40]">
                    Goal · {s.targetRetirementAge}
                  </span>
                </div>
              </div>

              {/* Milestones */}
              <div className="flex gap-3 flex-wrap">
                {milestones.map((m) => (
                  <div
                    key={m.age}
                    className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-[10px] text-white/[0.50]">
                      Age {m.age}
                    </span>
                    <span className="text-[10px] text-white/[0.30]">·</span>
                    <span className="text-[10px] font-medium text-white/[0.70]">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Accounts + Income Projection — 2 columns */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Accounts */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                    Retirement Accounts
                  </h3>
                  <span className="text-[10px] text-white/[0.25]">
                    {displayAccounts.length} accounts
                  </span>
                </div>
                <div className="space-y-1">
                  {displayAccounts.map((acct) => {
                    const matchPct = acct.employerMatchMax > 0
                      ? Math.round((acct.employerMatch / acct.employerMatchMax) * 100)
                      : 100
                    return (
                      <div
                        key={acct.id}
                        className="rounded-lg py-3 px-2 transition-colors duration-150 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: acct.color }}
                            />
                            <span className="text-[12px] font-medium text-white">
                              {acct.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-white/[0.25]">
                              {acct.provider}
                            </span>
                          </div>
                          <span className="text-[12px] font-medium tabular-nums text-white">
                            ${acct.balance.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-white/[0.35]">
                          <span>Contrib: {acct.contributionRate}%</span>
                          {acct.employerMatchMax > 0 && (
                            <span>
                              Match:{" "}
                              <span className={cn(
                                matchPct >= 100 ? "text-[#34D399]" : "text-[#FBBF24]"
                              )}>
                                ${acct.employerMatch.toLocaleString()}/${acct.employerMatchMax.toLocaleString()}
                              </span>
                            </span>
                          )}
                          {acct.vestedPercent < 100 && (
                            <span>Vested: {acct.vestedPercent}%</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Total */}
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white">Total</span>
                  <span className="text-[14px] font-semibold tabular-nums text-white">
                    ${s.totalSaved.toLocaleString()}
                  </span>
                </div>
              </GlassCard>

              {/* Income Projection */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                    Income Projection at {s.targetRetirementAge}
                  </h3>
                </div>

                {/* Stacked bar */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/[0.40]">Portfolio withdrawal (4%)</span>
                      <span className="text-[12px] font-medium tabular-nums text-[#67E8F9]">
                        ${s.projectedAnnualIncome.toLocaleString()}/yr
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-[#67E8F9]/50"
                        style={{ width: `${(s.projectedAnnualIncome / s.neededAtRetirement) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/[0.40]">Social Security estimate</span>
                      <span className="text-[12px] font-medium tabular-nums text-[#818CF8]">
                        ${s.socialSecurityEstimate.toLocaleString()}/yr
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full bg-[#818CF8]/40"
                        style={{ width: `${(s.socialSecurityEstimate / s.neededAtRetirement) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-white">Total projected</span>
                      <span className="text-[14px] font-semibold tabular-nums text-white">
                        ${(s.projectedAnnualIncome + s.socialSecurityEstimate).toLocaleString()}/yr
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/[0.04]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          (s.projectedAnnualIncome + s.socialSecurityEstimate) >= s.neededAtRetirement
                            ? "bg-[#34D399]/50"
                            : "bg-[#FBBF24]/50"
                        )}
                        style={{
                          width: `${Math.min(
                            ((s.projectedAnnualIncome + s.socialSecurityEstimate) / s.neededAtRetirement) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-white/[0.30]">Needed: ${s.neededAtRetirement.toLocaleString()}/yr</span>
                      {(s.projectedAnnualIncome + s.socialSecurityEstimate) >= s.neededAtRetirement ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[#34D399]">
                          <Check className="h-3 w-3" /> On track with SS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[#FBBF24]">
                          <AlertTriangle className="h-3 w-3" /> ${s.monthlyGap}/mo gap
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Growth chart */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Projected Portfolio Growth
                </h3>
                <div className="flex items-center gap-4">
                  {[{ color: "#67E8F9", label: "Projected" }, { color: "rgba(255,255,255,0.25)", label: "Target" }, { color: "#34D399", label: "Optimistic" }, { color: "#FBBF24", label: "Conservative" }].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-[9px] text-white/[0.35]">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[320px] w-full" style={{ minWidth: 250 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <AreaChart data={displayChartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="retProjectedGrad" x1="0" y1="0" x2="0" y2="1">
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
                      tickFormatter={(v) => `${v}`}
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
                      label={{ value: "Goal", fill: "rgba(255,255,255,0.3)", fontSize: 10, position: "top" }}
                    />
                    <Area type="monotone" dataKey="conservative" stroke="#FBBF24" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} />
                    <Area type="monotone" dataKey="target" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="6 4" fill="none" dot={false} />
                    <Area type="monotone" dataKey="optimistic" stroke="#34D399" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#67E8F9"
                      strokeWidth={2}
                      fill="url(#retProjectedGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#08090C", stroke: "#67E8F9", strokeWidth: 2 }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(103,232,249,0.3))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Strategy */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                  Recommended Actions
                </h3>
                <span className="text-[10px] text-white/[0.25]">AI-managed</span>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {[
                  {
                    title: "Increase 401(k) to 15%",
                    desc: "Capture full $4,200 employer match. You're leaving $600/yr on the table.",
                    impact: "+$237/mo cost, +$600/yr free money",
                    priority: "high",
                    color: "#34D399",
                  },
                  {
                    title: "Max Roth IRA",
                    desc: "Contribute $6,500/yr ($541/mo) for tax-free growth. You have 22 years of compounding.",
                    impact: "Tax-free withdrawals at 59½",
                    priority: "high",
                    color: "#67E8F9",
                  },
                  {
                    title: "Roth Conversion: $5K/yr",
                    desc: "Convert $5,000/yr from Traditional IRA to Roth. Spread tax liability over multiple years.",
                    impact: "Saves ~$8K in taxes over 10 years",
                    priority: "medium",
                    color: "#FBBF24",
                  },
                ].map((action) => (
                  <div
                    key={action.title}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: action.color }}
                      />
                      <span className="text-[11px] font-semibold text-white">
                        {action.title}
                      </span>
                      <span
                        className={cn(
                          "text-[8px] font-medium px-1.5 py-0.5 rounded-full",
                          action.priority === "high"
                            ? "bg-[#34D399]/15 text-[#34D399]"
                            : "bg-[#FBBF24]/15 text-[#FBBF24]"
                        )}
                      >
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/[0.40] mb-2">
                      {action.desc}
                    </p>
                    <p className="text-[10px] font-medium text-white/[0.60]">
                      {action.impact}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
            </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
