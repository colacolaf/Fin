"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingDown,
  ArrowDownRight,
  Maximize2,
  Clock,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MetalButton } from "@/components/ui/metal-button"
import { Sidebar } from "@/components/portfolio/sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { DebtDonut } from "@/components/debt/debt-donut"
import {
  debts,
  debtSummary,
  allThemes,
  getDebtsWithTheme,
} from "@/lib/debt/data"
import { useCountUp } from "@/lib/debt/hooks"
import { LiquidGlassBg } from "@/components/debt/liquid-glass-bg"

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
            className={cn(
              "h-3 w-3 rounded-full transition-transform duration-200",
              activeKey === t.key ? "scale-125" : "scale-100"
            )}
            style={{ backgroundColor: t.accent }}
          />
          <span
            className={cn(
              "text-[10px] font-medium transition-colors duration-150",
              activeKey === t.key
                ? "text-white"
                : "text-white/[0.38] group-hover:text-white/[0.6]"
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
/*  Compact debt card — hero number + donut + expand                  */
/* ================================================================== */

function CompactDebtCard({
  themedDebts,
  animatedValue,
  theme,
}: {
  themedDebts: ReturnType<typeof getDebtsWithTheme>
  animatedValue: number
  theme: (typeof allThemes)[number]["theme"]
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: theme.primaryDim }}
          >
            <TrendingDown className="h-3 w-3" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
            Debt Overview
          </h3>
        </div>
        <Link href="/debt/full">
          <MetalButton
            preset="chromatic"
            theme="dark"
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px]"
            strength={0.7}
          >
            <Maximize2 className="h-3 w-3" />
            Expand
          </MetalButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] items-center">
        {/* Left: Hero number + stats */}
        <div className="space-y-4">
          {/* Total debt */}
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1 block">
              Total Debt
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[32px] leading-none font-semibold tracking-tight text-white tabular-nums">
                ${Math.round(animatedValue).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[12px] font-medium text-[#34D399]">
                <ArrowDownRight className="h-3 w-3" />
                -${Math.abs(debtSummary.monthOverMonthChange).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stat pills row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { label: "Monthly", value: `$${debtSummary.monthlyPayment.toLocaleString()}` },
              { label: "APR", value: `${debtSummary.weightedApr}%` },
              { label: "Paid", value: `${debtSummary.percentPaid}%` },
              { label: "Debts", value: debtSummary.debtCount.toString() },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25]">
                  {s.label}
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-white">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-white/[0.25]">Payoff progress</span>
              <span className="text-[10px] tabular-nums text-white/[0.38]">
                Est. {debtSummary.estimatedDebtFree}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${debtSummary.percentPaid}%`,
                  backgroundColor: theme.primary,
                  opacity: 0.6,
                }}
              />
            </div>
          </div>

          {/* Debt list — compact */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
            {themedDebts.map((d) => {
              return (
                <div key={d.id} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-[11px] text-white flex-1 min-w-0 truncate">
                    {d.name}
                  </span>
                  <span className="text-[11px] tabular-nums text-white/[0.5]">
                    ${d.balance.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums min-w-[36px] text-right",
                      d.apr >= 15 ? "text-[#FB7171]" : "text-white/[0.25]"
                    )}
                  >
                    {d.apr}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Donut */}
        <div className="w-[260px] shrink-0">
          <DebtDonut
            debts={themedDebts}
            totalDebt={debtSummary.totalDebt}
            theme={theme}
          />
        </div>
      </div>
    </GlassCard>
  )
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function DebtPage() {
  const [themeKey, setThemeKey] = useState("amber")
  const themeData = allThemes.find((t) => t.key === themeKey) ?? allThemes[0]
  const theme = themeData.theme
  const themedDebts = getDebtsWithTheme(theme)
  const animatedValue = useCountUp(debtSummary.totalDebt)

  return (
    <div className="dark flex h-screen w-full">
      <LiquidGlassBg primary={theme.primary} secondary={theme.chartColors[1]} />
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
          <div className="mx-auto max-w-[1400px] px-8 py-5">
            {/* Compact debt card */}
            <CompactDebtCard
              themedDebts={themedDebts}
              animatedValue={animatedValue}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Theme switcher */}
      <ThemeSwitcher activeKey={themeKey} onSelect={setThemeKey} />
    </div>
  )
}
