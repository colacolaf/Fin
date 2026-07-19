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
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { GlassCard } from "@/components/portfolio/glass-card"
import { DebtDonut } from "@/components/debt/debt-donut"
import {
  debtSummary,
  allThemes,
  getDebtsWithTheme,
  useDebtData,
} from "@/lib/debt/data"
import { useDebtConnection } from "@/lib/debt/use-debt-connection"
import { DebtLocked } from "@/components/debt/debt-locked"
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
  summary,
}: {
  themedDebts: ReturnType<typeof getDebtsWithTheme>
  animatedValue: number
  theme: (typeof allThemes)[number]["theme"]
  summary: typeof debtSummary
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-5 w-5 items-center justify-center rounded"
            style={{ backgroundColor: theme.primaryDim }}
          >
            <TrendingDown className="h-3 w-3" style={{ color: theme.primary }} />
          </div>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
            Debt
          </h3>
          <span className="text-[13px] font-semibold text-white tabular-nums ml-1">
            ${Math.round(animatedValue).toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#34D399]">
            <ArrowDownRight className="h-2.5 w-2.5" />
            ${Math.abs(summary.monthOverMonthChange).toLocaleString()}
          </span>
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

      {/* Just the interactive donut — hover each slice for details */}
      <DebtDonut
        debts={themedDebts}
        totalDebt={debtSummary.totalDebt}
        theme={theme}
        showLegend={false}
      />
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
  const { isConnected } = useDebtConnection()
  const { debts, summary } = useDebtData()
  const themedDebts = debts.map((d, i) => ({ ...d, color: theme.chartColors[i % theme.chartColors.length] }))
  const animatedValue = useCountUp(summary.totalDebt)

  return (
    <div className="dark flex h-screen w-full">
      <LiquidGlassBg primary={theme.primary} secondary={theme.chartColors[1]} />
      <AppSidebar triggerPosition="top-left" />
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

        <div className="flex-1 overflow-auto">            <div className="mx-auto max-w-[1400px] px-8 py-5">
              {!isConnected ? (
                <DebtLocked variant="full" />
              ) : (
                <CompactDebtCard
                  themedDebts={themedDebts}
                  animatedValue={animatedValue}
                  theme={theme}
                  summary={summary}
                />
              )}
            </div>
        </div>
      </main>

      {/* Theme switcher */}
      <ThemeSwitcher activeKey={themeKey} onSelect={setThemeKey} />
    </div>
  )
}
