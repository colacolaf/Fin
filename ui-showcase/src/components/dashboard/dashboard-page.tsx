"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Maximize2, TrendingDown, PieChart, Newspaper, Bot, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { LiquidGlassBg } from "@/components/debt/liquid-glass-bg"
import { GlassCard } from "@/components/portfolio/glass-card"
import { MetricsRow } from "@/components/portfolio/metrics-row"
import { RetirementWidget } from "@/components/retirement/retirement-widget"
import { DebtDonut } from "@/components/debt/debt-donut"
import { NewsCard } from "@/components/news/news-card"
import { AgentOrbs } from "@/components/agent-orbs"
import { portfolioSummary, chartData } from "@/lib/portfolio/data"
import { debtSummary, amberTheme, getDebtsWithTheme } from "@/lib/debt/data"
import { useDesktopNotifications } from "@/lib/notifications/use-desktop-notifications"

/* ================================================================== */
/*  FullscreenButton — chromatic expand button for each section         */
/* ================================================================== */

function FullscreenButton({
  href,
  label,
  color,
}: {
  href: string
  label: string
  color: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium",
        "transition-all duration-150 active:scale-[0.97]"
      )}
      style={{
        borderColor: `${color}30`,
        backgroundColor: `${color}10`,
        color,
      }}
    >
      <Maximize2 className="h-3 w-3" />
      {label}
    </Link>
  )
}

/* ================================================================== */
/*  SectionHeader — label + fullscreen button                           */
/* ================================================================== */

function SectionHeader({
  icon,
  label,
  fullscreenHref,
  fullscreenLabel,
  accentColor,
}: {
  icon: React.ReactNode
  label: string
  fullscreenHref?: string
  fullscreenLabel?: string
  accentColor: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.45]">
          {label}
        </span>
      </div>
      {fullscreenHref && fullscreenLabel && (
        <FullscreenButton
          href={fullscreenHref}
          label={fullscreenLabel}
          color={accentColor}
        />
      )}
    </div>
  )
}

/* ================================================================== */
/*  AnimatedValue — counter that animates from 0 to target on mount     */
/* ================================================================== */

function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    const start = performance.now()
    let rafId: number

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(target * eased))
      if (progress < 1) rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return value
}

/* ================================================================== */
/*  MiniChart — compact SVG area chart for the dashboard overview       */
/* ================================================================== */

function MiniChart({ data }: { data: { date: string; value: number }[] }) {
  const w = 400
  const h = 80
  const padding = 4

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (w - padding * 2)
      const y = h - padding - ((v - min) / range) * (h - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="dash-chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${h} ${points} ${w - padding},${h}`}
        fill="url(#dash-chart-grad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#818CF8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ================================================================== */
/*  DashboardPage                                                       */
/* ================================================================== */

export function DashboardPage() {
  const animatedValue = useAnimatedValue(portfolioSummary.totalValue)
  const debtsWithColor = getDebtsWithTheme(amberTheme)
  const { notify, permissionGranted, requestPermission } = useDesktopNotifications()
  const [testMenuOpen, setTestMenuOpen] = React.useState(false)

  return (
    <div className="dark relative flex min-h-screen w-full flex-col bg-[#08090C]">
      <LiquidGlassBg primary="#818CF8" secondary="#FBBF24" />
      <AppSidebar triggerPosition="top-left" />

      {/* Header */}
      <header
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-between gap-4",
          "border-b border-white/[0.06] bg-black/20 py-3 pl-20 pr-6 backdrop-blur-xl"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#818CF8]/10 border border-[#818CF8]/20">
            <Bot className="h-5 w-5 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold tracking-tight text-white">
              Finance OS
            </h1>
            <p className="text-[11px] text-white/[0.38]">
              Your financial command center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-white/[0.35]">
          {/* Notification test triggers */}
          {!permissionGranted && (
            <button
              type="button"
              onClick={requestPermission}
              className="flex items-center gap-1 rounded-md border border-[#818CF8]/25 bg-[#818CF8]/10 px-2 py-1 text-[10px] font-medium text-[#818CF8] hover:bg-[#818CF8]/15 transition-colors"
            >
              <BellRing className="h-3 w-3" />
              Enable notifications
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTestMenuOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-white/[0.50] hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <BellRing className="h-3 w-3" />
              Test
            </button>
            {testMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTestMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-white/[0.08] bg-[#141418] p-1 shadow-xl backdrop-blur-xl">
                  {[
                    { label: "Agent task complete", event: "agent_task_complete" as const, body: "Portfolio Agent finished analyzing your holdings." },
                    { label: "Debt paid off", event: "debt_paid_off" as const, body: "Credit Card balance fully paid! Redirect freed cash flow to investments." },
                    { label: "Debt milestone", event: "debt_milestone" as const, body: "You've paid off 50% of your Student Loan. Keep going!" },
                  ].map((opt) => (
                    <button
                      key={opt.event}
                      type="button"
                      onClick={() => {
                        notify(opt.label, opt.body, opt.event)
                        setTestMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] text-white/[0.60] hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <BellRing className="h-3 w-3 shrink-0" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="h-4 w-px bg-white/[0.08]" />
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34D399]" />
            </span>
            All systems operational
          </span>
          <div className="h-4 w-px bg-white/[0.08]" />
          <span>Last synced: 5m ago</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto max-w-[1200px] px-6 py-6"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-[1fr_auto]">
            {/* ═══════════════════════════════════════════ */}
            {/*  Portfolio — top left, spans 4 cols          */}
            {/* ═══════════════════════════════════════════ */}
            <GlassCard className="p-5 lg:col-span-4">
              <SectionHeader
                icon={<PieChart className="h-3.5 w-3.5 text-[#818CF8]" />}
                label="Portfolio"
                fullscreenHref="/portfolio/full"
                fullscreenLabel="Full View"
                accentColor="#818CF8"
              />
              <MetricsRow
                summary={portfolioSummary}
                animatedValue={animatedValue}
              />
              <div className="mt-3 h-14 w-full">
                <MiniChart data={chartData} />
              </div>
            </GlassCard>

            {/* ═══════════════════════════════════════════ */}
            {/*  News — top right, spans 2 cols              */}
            {/* ═══════════════════════════════════════════ */}
            <GlassCard className="p-4 lg:col-span-2">
              <SectionHeader
                icon={<Newspaper className="h-3.5 w-3.5 text-white/[0.40]" />}
                label="Market News"
                accentColor="#818CF8"
              />
              <NewsCard />
            </GlassCard>

            {/* ═══════════════════════════════════════════ */}
            {/*  Debt — bottom left, 2 cols, compact        */}
            {/* ═══════════════════════════════════════════ */}
            <GlassCard className="p-4 lg:col-span-2">
              <SectionHeader
                icon={<TrendingDown className="h-3.5 w-3.5 text-[#FBBF24]" />}
                label="Debt"
                fullscreenHref="/debt/full"
                fullscreenLabel="Full View"
                accentColor="#FBBF24"
              />
              <div className="mb-2 flex flex-wrap gap-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">Total</span>
                  <span className="text-[13px] font-semibold tabular-nums text-[#FBBF24]">
                    ${debtSummary.totalDebt.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">Monthly</span>
                  <span className="text-[13px] font-semibold tabular-nums text-white">
                    ${debtSummary.monthlyPayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">APR</span>
                  <span className="text-[13px] font-semibold tabular-nums text-[#FB7185]">
                    {debtSummary.weightedApr}%
                  </span>
                </div>
              </div>
              <DebtDonut
                debts={debtsWithColor}
                totalDebt={debtSummary.totalDebt}
                theme={amberTheme}
                showLegend={false}
              />
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[#FBBF24]/15 bg-[#FBBF24]/5 px-3 py-1.5">
                <span className="text-[10px] text-white/[0.50]">Estimated debt-free</span>
                <span className="text-[11px] font-semibold text-[#FBBF24]">{debtSummary.estimatedDebtFree}</span>
              </div>
            </GlassCard>

            {/* ═══════════════════════════════════════════ */}
            {/*  Retirement — bottom center, 2 cols           */}
            {/* ═══════════════════════════════════════════ */}
            <div className="lg:col-span-2">
              <RetirementWidget />
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/*  Agent Orbs — bottom right, 2 cols           */}
            {/* ═══════════════════════════════════════════ */}
            <GlassCard className="p-4 lg:col-span-2">
              <AgentOrbs />
            </GlassCard>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
