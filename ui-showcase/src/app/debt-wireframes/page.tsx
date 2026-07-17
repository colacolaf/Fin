"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Maximize2,
  TrendingDown,
  ArrowDownRight,
  DollarSign,
  Clock,
  Percent,
  List,
  Brain,
  Calendar,
  Target,
  AlertTriangle,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Shared sketch primitives                                           */
/* ------------------------------------------------------------------ */

function SketchBox({
  title,
  className,
  children,
}: {
  title?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </h3>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
        {children}
      </div>
    </div>
  )
}

/** Thin placeholder line — simulates text or a metric value */
function PlaceholderLine({ width = "w-24", className }: { width?: string; className?: string }) {
  return <div className={cn("h-2.5 rounded-full bg-slate-200", width, className)} />
}

/** Placeholder horizontal progress bar (for debt payoff) */
function PlaceholderProgress({
  width = "w-3/5",
  color = "bg-amber-300",
  className,
}: {
  width?: string
  color?: string
  className?: string
}) {
  return (
    <div className={cn("flex-1 h-2 rounded-full bg-slate-100 overflow-hidden", className)}>
      <div className={cn("h-full rounded-full", color, width)} />
    </div>
  )
}

/** Placeholder donut chart — concentric circles */
function PlaceholderDonut({ size = 140, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className={className}>
      {/* Background ring */}
      <circle cx="70" cy="70" r="55" fill="none" stroke="#e2e8f0" strokeWidth="20" />
      {/* Segment 1 — amber (39%) */}
      <circle
        cx="70" cy="70" r="55"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="20"
        strokeDasharray="135.1 210.9"
        strokeDashoffset="0"
        transform="rotate(-90 70 70)"
        opacity="0.8"
      />
      {/* Segment 2 — rose (17%) */}
      <circle
        cx="70" cy="70" r="55"
        fill="none"
        stroke="#fb7185"
        strokeWidth="20"
        strokeDasharray="58.7 287.3"
        strokeDashoffset="-135.1"
        transform="rotate(-90 70 70)"
        opacity="0.8"
      />
      {/* Segment 3 — indigo (26%) */}
      <circle
        cx="70" cy="70" r="55"
        fill="none"
        stroke="#818cf8"
        strokeWidth="20"
        strokeDasharray="90.0 256.0"
        strokeDashoffset="-193.8"
        transform="rotate(-90 70 70)"
        opacity="0.8"
      />
      {/* Segment 4 — green (18%) */}
      <circle
        cx="70" cy="70" r="55"
        fill="none"
        stroke="#34d399"
        strokeWidth="20"
        strokeDasharray="62.0 284.0"
        strokeDashoffset="-283.8"
        transform="rotate(-90 70 70)"
        opacity="0.8"
      />
      {/* Center label */}
      <text x="70" y="66" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">
        $47,230
      </text>
      <text x="70" y="82" textAnchor="middle" fill="#94a3b8" fontSize="9">
        total debt
      </text>
    </svg>
  )
}

/** Placeholder area chart (declining debt) */
function PlaceholderDebtChart({ className }: { className?: string }) {
  const points = [
    [0, 85], [8, 80], [16, 78], [24, 72], [32, 68], [40, 65],
    [48, 60], [56, 58], [64, 54], [72, 50], [80, 48], [88, 44],
    [96, 40], [100, 38],
  ]
  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ")
  const pathArea = `${pathLine} L 100 100 L 0 100 Z`

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="debtChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathArea} fill="url(#debtChartFill)" />
        <path d={pathLine} fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/** Placeholder horizontal bars (for debt list) */
function PlaceholderBars({ count = 4, className }: { count?: number; className?: string }) {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-2/5", "w-1/3", "w-1/2"]
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <PlaceholderLine width="w-12" />
          <PlaceholderProgress width={widths[i % widths.length]} />
          <PlaceholderLine width="w-8" />
        </div>
      ))}
    </div>
  )
}

/** Placeholder table rows */
function PlaceholderTable({ rows = 4, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {/* Header */}
      <div className="flex gap-3 pb-2 border-b border-slate-200">
        {Array.from({ length: cols }).map((_, i) => (
          <PlaceholderLine key={i} width="w-14" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 py-1.5 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <PlaceholderLine key={c} width={c === 0 ? "w-20" : "w-12"} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Time range pills */
function TimeRangeSelector({ className }: { className?: string }) {
  const ranges = ["6M", "1Y", "ALL"]
  return (
    <div className={cn("flex gap-1.5", className)}>
      {ranges.map((r) => (
        <span
          key={r}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-400"
        >
          {r}
        </span>
      ))}
    </div>
  )
}

/** Fullscreen toggle button sketch */
function FullscreenButton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-400",
        className
      )}
    >
      <Maximize2 className="h-3 w-3" />
      Expand
    </div>
  )
}

/** Collapse button sketch */
function CollapseButton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-400",
        className
      )}
    >
      Collapse
    </div>
  )
}

/** Debt row sketch with progress bar */
function DebtRowSketch({
  name,
  balance,
  apr,
  color,
  progressWidth,
}: {
  name: string
  balance: string
  apr: string
  color: string
  progressWidth: string
}) {
  return (
    <div className="flex items-center gap-3 w-full py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <span className="text-[11px] font-medium text-slate-600">{name}</span>
      </div>
      <span className="text-[11px] tabular-nums text-slate-500 min-w-[60px]">{balance}</span>
      <span className="text-[10px] text-slate-400 min-w-[50px]">{apr} APR</span>
      <PlaceholderProgress width={progressWidth} color={color} className="flex-1" />
      <span className="text-[10px] text-slate-400 min-w-[30px] text-right">
        {progressWidth === "w-full" ? "100%" : progressWidth === "w-4/5" ? "80%" : progressWidth === "w-3/5" ? "60%" : progressWidth === "w-2/5" ? "40%" : "50%"}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Layout header                                                      */
/* ------------------------------------------------------------------ */

function LayoutLabel({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-300">
          {number}:
        </span>
        <span className="text-sm font-semibold text-slate-600">{title}</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </div>
  )
}

/* ================================================================== */
/* DASHBOARD LAYOUTS                                                  */
/* ================================================================== */

function DashboardOption1() {
  return (
    <div>
      <LayoutLabel
        number={1}
        title="Hero Donut"
        description="Big total debt left, interactive donut right. Minimal, fast scan. Progress bar below total."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: Hero stats */}
          <SketchBox title="Debt Overview" className="lg:col-span-1">
            <div className="w-full space-y-4">
              {/* Total debt */}
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Total Debt
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <PlaceholderLine width="w-28" className="h-5" />
                  <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                    <ArrowDownRight className="h-3 w-3" /> -$1,240
                  </span>
                </div>
              </div>

              {/* Stat pills */}
              <div className="flex gap-4">
                <div>
                  <span className="text-[9px] text-slate-400">APR</span>
                  <PlaceholderLine width="w-10" className="mt-1" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400">Monthly</span>
                  <PlaceholderLine width="w-14" className="mt-1" />
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-slate-400">Progress</span>
                  <span className="text-[9px] text-slate-400">62%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[62%] rounded-full bg-amber-300" />
                </div>
                <span className="text-[9px] text-slate-400 mt-1">$29,280 paid</span>
              </div>

              <FullscreenButton className="self-start" />
            </div>
          </SketchBox>

          {/* Right: Interactive donut */}
          <SketchBox title="Debt Composition" className="lg:col-span-2 min-h-[280px]">
            <div className="flex items-center gap-8 w-full">
              <PlaceholderDonut size={160} />
              <div className="flex-1 space-y-2.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-2 block">
                  Hover to explore
                </span>
                {[
                  { name: "Student Loan", balance: "$18,400", color: "bg-amber-400", pct: "39%" },
                  { name: "Credit Card", balance: "$8,230", color: "bg-rose-400", pct: "17%" },
                  { name: "Auto Loan", balance: "$12,100", color: "bg-indigo-400", pct: "26%" },
                  { name: "Medical", balance: "$8,500", color: "bg-emerald-400", pct: "18%" },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", d.color)} />
                      <span className="text-[11px] text-slate-500">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] tabular-nums text-slate-600">{d.balance}</span>
                      <span className="text-[10px] tabular-nums text-slate-400">{d.pct}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <AlertTriangle className="h-3 w-3" />
                    Hover slice for APR, minimum, payoff date
                  </div>
                </div>
              </div>
            </div>
          </SketchBox>
        </div>
      </div>
    </div>
  )
}

function DashboardOption2() {
  return (
    <div>
      <LayoutLabel
        number={2}
        title="Debt Stack"
        description="Horizontal progress bars per debt. Color-coded by APR urgency. Most motivational — watching bars shrink."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                Total Debt
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <PlaceholderLine width="w-28" className="h-5" />
                <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                  <ArrowDownRight className="h-3 w-3" /> -$1,240
                </span>
              </div>
            </div>
          </div>
          <FullscreenButton />
        </div>

        {/* Debt stack rows */}
        <SketchBox title="Debt Stack" className="min-h-[200px]">
          <div className="w-full space-y-1">
            <DebtRowSketch
              name="Student Loan"
              balance="$18,400"
              apr="6.8%"
              color="bg-amber-400"
              progressWidth="w-3/5"
            />
            <DebtRowSketch
              name="Credit Card"
              balance="$8,230"
              apr="22.9%"
              color="bg-rose-400"
              progressWidth="w-2/5"
            />
            <DebtRowSketch
              name="Auto Loan"
              balance="$12,100"
              apr="4.5%"
              color="bg-indigo-400"
              progressWidth="w-full"
            />
            <DebtRowSketch
              name="Medical"
              balance="$8,500"
              apr="0%"
              color="bg-emerald-400"
              progressWidth="w-2/5"
            />
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between w-full mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-[9px] text-slate-400">= high APR (attack first)</span>
            </div>
            <div className="flex gap-4 text-[10px] text-slate-400">
              <span>Weighted APR: 8.5%</span>
              <span>Monthly: $1,100</span>
              <span>4 debts</span>
            </div>
          </div>
        </SketchBox>

        {/* Mini donut peek */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <PlaceholderDonut size={48} />
            <div>
              <span className="text-[10px] text-slate-500 block">62% paid</span>
              <span className="text-[9px] text-slate-400">Est. debt-free Aug 2028</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            Hover rows for detail · Color = APR urgency
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardOption3() {
  return (
    <div>
      <LayoutLabel
        number={3}
        title="Split Hero"
        description="Declining area chart left 2/3, stats + mini donut right 1/3. Mirrors portfolio's classic split layout."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: Declining area chart */}
          <SketchBox title="Debt Paydown" className="lg:col-span-2 min-h-[300px]">
            <div className="flex w-full items-center justify-between mb-3">
              <div>
                <PlaceholderLine width="w-32" className="h-4 mb-1.5" />
                <div className="flex items-center gap-2">
                  <PlaceholderLine width="w-20" />
                  <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                    <ArrowDownRight className="h-3 w-3" /> -$1,240
                  </span>
                </div>
              </div>
              <FullscreenButton />
            </div>
            <TimeRangeSelector className="mb-4 self-start" />
            <div className="flex items-center gap-2 mb-2 self-start">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1">
                <ArrowDownRight className="h-3 w-3 text-green-500" />
                <span className="text-[10px] text-slate-400">Best</span>
                <span className="text-[10px] font-semibold text-green-500">-$2,100</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1">
                <TrendingDown className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-slate-400">Worst</span>
                <span className="text-[10px] font-semibold text-amber-500">-$420</span>
              </div>
            </div>
            <PlaceholderDebtChart className="flex-1 min-h-[120px]" />
          </SketchBox>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <SketchBox title="Total Debt" className="min-h-[90px]">
              <PlaceholderLine width="w-28" className="h-5" />
              <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3" /> -$1,240 this month
              </span>
            </SketchBox>

            <SketchBox title="Monthly Payment" className="min-h-[70px]">
              <PlaceholderLine width="w-16" className="h-4" />
              <PlaceholderLine width="w-12" />
            </SketchBox>

            <SketchBox title="Weighted APR" className="min-h-[70px]">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-400" />
                <PlaceholderLine width="w-12" className="h-4" />
              </div>
              <PlaceholderLine width="w-16" />
            </SketchBox>

            <SketchBox title="Composition" className="min-h-[130px]">
              <PlaceholderDonut size={100} />
              <div className="flex gap-3 mt-2">
                {[
                  { color: "bg-amber-400", label: "SL" },
                  { color: "bg-rose-400", label: "CC" },
                  { color: "bg-indigo-400", label: "AL" },
                  { color: "bg-emerald-400", label: "M" },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-1">
                    <div className={cn("h-2 w-2 rounded-full", d.color)} />
                    <span className="text-[9px] text-slate-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </SketchBox>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* FULLSCREEN LAYOUTS                                                 */
/* ================================================================== */

function FullscreenOption1() {
  return (
    <div>
      <LayoutLabel
        number={1}
        title="Terminal Grid"
        description="Hero stats → donut + breakdown table → payoff timeline Gantt → strategy comparison. Most comprehensive, mirrors portfolio full view."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
              <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700">Debt — Full View</span>
              <span className="text-[10px] text-slate-400 ml-2">Breakdown, timeline, and strategy</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TimeRangeSelector />
            <CollapseButton />
          </div>
        </div>

        {/* Hero stats row */}
        <div className="mb-5 flex items-center justify-between rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                Total Debt
              </span>
              <PlaceholderLine width="w-28" className="h-5 mt-1" />
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex gap-6">
              {[
                { label: "Monthly", icon: DollarSign },
                { label: "Weighted APR", icon: Percent },
                { label: "Debts", icon: List },
                { label: "Debt-Free", icon: Calendar },
                { label: "Interest Left", icon: AlertTriangle },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </span>
                  <PlaceholderLine width="w-14" />
                </div>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
            <ArrowDownRight className="h-3 w-3" /> -$1,240
          </span>
        </div>

        {/* Donut + Breakdown table — 2 columns */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
          <SketchBox title="Debt Composition" className="min-h-[240px]">
            <div className="flex items-center gap-6 w-full">
              <PlaceholderDonut size={160} />
              <div className="flex-1 space-y-2">
                {[
                  { name: "Student Loan", balance: "$18,400", color: "bg-amber-400", pct: "39%" },
                  { name: "Credit Card", balance: "$8,230", color: "bg-rose-400", pct: "17%" },
                  { name: "Auto Loan", balance: "$12,100", color: "bg-indigo-400", pct: "26%" },
                  { name: "Medical", balance: "$8,500", color: "bg-emerald-400", pct: "18%" },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", d.color)} />
                      <span className="text-[11px] text-slate-500">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] tabular-nums text-slate-600">{d.balance}</span>
                      <span className="text-[10px] tabular-nums text-slate-400">{d.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SketchBox>

          <SketchBox title="Debt Breakdown" className="min-h-[240px]">
            <div className="w-full space-y-1">
              <div className="flex gap-3 pb-2 border-b border-slate-200">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 flex-1">Name</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 w-16 text-right">Balance</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 w-12 text-right">APR</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 w-14 text-right">Min</span>
              </div>
              {[
                { name: "Student Loan", bal: "$18,400", apr: "6.8%", min: "$320" },
                { name: "Credit Card", bal: "$8,230", apr: "22.9%", min: "$250" },
                { name: "Auto Loan", bal: "$12,100", apr: "4.5%", min: "$380" },
                { name: "Medical", bal: "$8,500", apr: "0%", min: "$150" },
              ].map((d) => (
                <div key={d.name} className="flex gap-3 py-1.5 border-b border-slate-100">
                  <span className="text-[11px] text-slate-600 flex-1">{d.name}</span>
                  <span className="text-[11px] tabular-nums text-slate-500 w-16 text-right">{d.bal}</span>
                  <span className={cn("text-[11px] tabular-nums w-12 text-right", d.apr === "22.9%" ? "text-rose-500 font-medium" : "text-slate-500")}>{d.apr}</span>
                  <span className="text-[11px] tabular-nums text-slate-400 w-14 text-right">{d.min}</span>
                </div>
              ))}
              <div className="flex gap-3 py-2 mt-1">
                <span className="text-[11px] font-semibold text-slate-600 flex-1">TOTAL</span>
                <span className="text-[11px] font-semibold tabular-nums text-slate-600 w-16 text-right">$47,230</span>
                <span className="text-[11px] font-medium tabular-nums text-slate-500 w-12 text-right">8.5%</span>
                <span className="text-[11px] font-medium tabular-nums text-slate-500 w-14 text-right">$1,100</span>
              </div>
            </div>
          </SketchBox>
        </div>

        {/* Progress bar */}
        <div className="mb-5 rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Overall Progress</span>
            <span className="text-[10px] text-slate-400">$29,280 of $47,230 paid (62%)</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-amber-300 to-amber-400" />
          </div>
        </div>

        {/* Payoff timeline — Gantt style */}
        <SketchBox title="Payoff Timeline" className="min-h-[180px] mb-5">
          <div className="w-full">
            {/* Year markers */}
            <div className="flex items-center mb-3">
              <div className="w-[120px] shrink-0" />
              <div className="flex-1 flex justify-between text-[9px] text-slate-400">
                <span>2025</span>
                <span>2026</span>
                <span>2027</span>
                <span>2028</span>
                <span>2029</span>
              </div>
            </div>
            {/* Debt bars */}
            {[
              { name: "Student Loan", color: "bg-amber-300", width: "w-3/4", payoff: "Aug '27" },
              { name: "Credit Card", color: "bg-rose-300", width: "w-4/5", payoff: "Mar '28" },
              { name: "Auto Loan", color: "bg-indigo-300", width: "w-3/4", payoff: "Nov '27" },
              { name: "Medical", color: "bg-emerald-300", width: "w-5/6", payoff: "Jun '28" },
            ].map((d) => (
              <div key={d.name} className="flex items-center mb-2">
                <span className="text-[10px] text-slate-500 w-[120px] shrink-0">{d.name}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className={cn("h-4 rounded-full", d.color, d.width)} />
                  <span className="text-[9px] text-slate-400">{d.payoff}</span>
                </div>
              </div>
            ))}
            {/* Today marker */}
            <div className="flex items-center mt-2">
              <div className="w-[120px] shrink-0" />
              <div className="flex-1 flex items-center gap-1">
                <div className="w-px h-6 bg-slate-400" />
                <span className="text-[9px] text-slate-500">Today</span>
              </div>
            </div>
          </div>
        </SketchBox>

        {/* Strategy comparison */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
          <SketchBox title="Avalanche (Recommended)" className="min-h-[160px]">
            <div className="w-full space-y-2">
              <p className="text-[10px] text-slate-500">Pay highest APR first</p>
              <div className="space-y-1.5">
                {[
                  { name: "Credit Card", apr: "22.9%", color: "bg-rose-400" },
                  { name: "Student Loan", apr: "6.8%", color: "bg-amber-400" },
                  { name: "Auto Loan", apr: "4.5%", color: "bg-indigo-400" },
                  { name: "Medical", apr: "0%", color: "bg-emerald-400" },
                ].map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-4">{i + 1}.</span>
                    <div className={cn("h-2 w-2 rounded-full", d.color)} />
                    <span className="text-[11px] text-slate-600 flex-1">{d.name}</span>
                    <span className="text-[10px] tabular-nums text-slate-500">{d.apr}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[10px]">
                <span className="text-slate-400">Interest saved</span>
                <span className="text-green-500 font-medium">$2,340</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Debt-free</span>
                <span className="text-slate-600 font-medium">Jul 2028</span>
              </div>
            </div>
          </SketchBox>

          <SketchBox title="Snowball" className="min-h-[160px]">
            <div className="w-full space-y-2">
              <p className="text-[10px] text-slate-500">Pay smallest balance first</p>
              <div className="space-y-1.5">
                {[
                  { name: "Medical", balance: "$8,500", color: "bg-emerald-400" },
                  { name: "Credit Card", balance: "$8,230", color: "bg-rose-400" },
                  { name: "Auto Loan", balance: "$12,100", color: "bg-indigo-400" },
                  { name: "Student Loan", balance: "$18,400", color: "bg-amber-400" },
                ].map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-4">{i + 1}.</span>
                    <div className={cn("h-2 w-2 rounded-full", d.color)} />
                    <span className="text-[11px] text-slate-600 flex-1">{d.name}</span>
                    <span className="text-[10px] tabular-nums text-slate-500">{d.balance}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[10px]">
                <span className="text-slate-400">Interest saved</span>
                <span className="text-green-500 font-medium">$1,820</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Debt-free</span>
                <span className="text-slate-600 font-medium">Sep 2028</span>
              </div>
            </div>
          </SketchBox>
        </div>

        {/* Weekly progress tracker */}
        <SketchBox title="Weekly Progress" className="min-h-[100px]">
          <div className="w-full">
            <div className="flex gap-3 mb-3">
              {[
                { label: "This week", value: "-$420", pct: "-0.9%" },
                { label: "This month", value: "-$1,240", pct: "-2.6%" },
                { label: "This year", value: "-$8,400", pct: "-15.1%" },
              ].map((d) => (
                <div key={d.label} className="flex-1 rounded-md border border-slate-200 p-2.5">
                  <span className="text-[9px] text-slate-400 block">{d.label}</span>
                  <span className="text-[13px] font-semibold text-green-500 block mt-0.5">{d.value}</span>
                  <span className="text-[10px] text-slate-400">{d.pct}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-slate-400">W1</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[35%] rounded-full bg-amber-300" />
              </div>
              <span className="text-[9px] text-slate-400">$280</span>
              <span className="text-[9px] text-slate-400">W2</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[45%] rounded-full bg-amber-300" />
              </div>
              <span className="text-[9px] text-slate-400">$340</span>
              <span className="text-[9px] text-slate-400">W3</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[28%] rounded-full bg-amber-300" />
              </div>
              <span className="text-[9px] text-slate-400">$220</span>
              <span className="text-[9px] text-slate-400">W4</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[55%] rounded-full bg-amber-400" />
              </div>
              <span className="text-[9px] text-slate-400">$420</span>
            </div>
          </div>
        </SketchBox>
      </div>
    </div>
  )
}

function FullscreenOption2() {
  return (
    <div>
      <LayoutLabel
        number={2}
        title="Dashboard Expanded + Grid"
        description="Same donut as dashboard but bigger. 3-column detail grid below. Progress tracker as a prominent section."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <PlaceholderLine width="w-32" className="h-5" />
            <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
              <ArrowDownRight className="h-3 w-3" /> -$1,240
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TimeRangeSelector />
            <CollapseButton />
          </div>
        </div>

        {/* Large donut */}
        <SketchBox title="Debt Composition" className="min-h-[280px] mb-5">
          <div className="flex items-center justify-center gap-10 w-full">
            <PlaceholderDonut size={200} />
            <div className="space-y-3">
              {[
                { name: "Student Loan", balance: "$18,400", color: "bg-amber-400", pct: "39%", apr: "6.8%" },
                { name: "Credit Card", balance: "$8,230", color: "bg-rose-400", pct: "17%", apr: "22.9%" },
                { name: "Auto Loan", balance: "$12,100", color: "bg-indigo-400", pct: "26%", apr: "4.5%" },
                { name: "Medical", balance: "$8,500", color: "bg-emerald-400", pct: "18%", apr: "0%" },
              ].map((d) => (
                <div key={d.name} className="flex items-center gap-4">
                  <div className={cn("h-3 w-3 rounded-full", d.color)} />
                  <span className="text-[12px] text-slate-600 w-24">{d.name}</span>
                  <span className="text-[12px] tabular-nums text-slate-500 w-16">{d.balance}</span>
                  <span className="text-[10px] tabular-nums text-slate-400 w-10">{d.pct}</span>
                  <span className={cn("text-[10px] tabular-nums w-12", d.apr === "22.9%" ? "text-rose-500 font-medium" : "text-slate-400")}>{d.apr} APR</span>
                </div>
              ))}
            </div>
          </div>
        </SketchBox>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: Debt details */}
          <SketchBox title="Debt Details" className="min-h-[260px]">
            <div className="w-full space-y-3">
              {[
                { name: "Student Loan", bal: "$18,400", apr: "6.8%", min: "$320", est: "Aug '27", paid: "62%", color: "bg-amber-300", pw: "w-3/5" },
                { name: "Credit Card", bal: "$8,230", apr: "22.9%", min: "$250", est: "Mar '28", paid: "38%", color: "bg-rose-300", pw: "w-2/5" },
                { name: "Auto Loan", bal: "$12,100", apr: "4.5%", min: "$380", est: "Nov '27", paid: "54%", color: "bg-indigo-300", pw: "w-full" },
                { name: "Medical", bal: "$8,500", apr: "0%", min: "$150", est: "Jun '28", paid: "28%", color: "bg-emerald-300", pw: "w-2/5" },
              ].map((d) => (
                <div key={d.name} className="pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-600">{d.name}</span>
                    <span className="text-[10px] text-slate-400">{d.apr} APR</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] tabular-nums text-slate-500">{d.bal}</span>
                    <span className="text-[10px] text-slate-400">{d.min}/mo</span>
                    <span className="text-[10px] text-slate-400">Est: {d.est}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlaceholderProgress width={d.pw} color={d.color} />
                    <span className="text-[9px] text-slate-400">{d.paid}</span>
                  </div>
                </div>
              ))}
            </div>
          </SketchBox>

          {/* Center: Progress */}
          <SketchBox title="Progress" className="min-h-[260px]">
            <div className="w-full flex flex-col items-center gap-4">
              {/* Large progress ring placeholder */}
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="10"
                  strokeDasharray="195 119"
                  strokeDashoffset="0"
                  transform="rotate(-90 60 60)"
                  strokeLinecap="round"
                />
                <text x="60" y="56" textAnchor="middle" fill="#475569" fontSize="18" fontWeight="600">62%</text>
                <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9">paid off</text>
              </svg>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Paid</span>
                  <span className="text-slate-600 font-medium">$29,280</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Remaining</span>
                  <span className="text-slate-600 font-medium">$47,230</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Debt-free</span>
                  <span className="text-slate-600 font-medium">Aug 2028</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Months left</span>
                  <span className="text-slate-600 font-medium">24</span>
                </div>
              </div>
            </div>
          </SketchBox>

          {/* Right: Strategy + tracker */}
          <SketchBox title="Strategy" className="min-h-[260px]">
            <div className="w-full space-y-3">
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Recommended: Avalanche
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Pay highest APR first. Saves $2,340 in interest.</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 block mb-2">
                  Weekly Tracker
                </span>
                {["W1", "W2", "W3", "W4"].map((w, i) => {
                  const widths = ["w-[35%]", "w-[45%]", "w-[28%]", "w-[55%]"]
                  const vals = ["$280", "$340", "$220", "$420"]
                  return (
                    <div key={w} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] text-slate-400 w-5">{w}</span>
                      <PlaceholderProgress width={widths[i]} color="bg-amber-300" />
                      <span className="text-[9px] text-slate-400 w-8 text-right">{vals[i]}</span>
                    </div>
                  )
                })}
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 block mb-1">
                  Next Payment
                </span>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <span className="text-[11px] text-slate-600 block">Credit Card — $250</span>
                    <span className="text-[9px] text-slate-400">Due Dec 15</span>
                  </div>
                </div>
              </div>
            </div>
          </SketchBox>
        </div>
      </div>
    </div>
  )
}

function FullscreenOption3() {
  return (
    <div>
      <LayoutLabel
        number={3}
        title="Chart + Tabbed Sections"
        description="Declining area chart always visible at top. Tab bar switches between Breakdown, Progress, Strategy, Payments below."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <PlaceholderLine width="w-32" className="h-5 mb-1" />
            <div className="flex items-center gap-2">
              <PlaceholderLine width="w-20" />
              <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                <ArrowDownRight className="h-3 w-3" /> -$1,240
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeSelector />
            <CollapseButton />
          </div>
        </div>

        {/* Chart always visible */}
        <SketchBox className="min-h-[240px] mb-5">
          <div className="flex w-full items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1">
                <ArrowDownRight className="h-3 w-3 text-green-500" />
                <span className="text-[10px] text-slate-400">Best</span>
                <span className="text-[10px] font-semibold text-green-500">-$2,100</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1">
                <TrendingDown className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-slate-400">Worst</span>
                <span className="text-[10px] font-semibold text-amber-500">-$420</span>
              </div>
            </div>
          </div>
          <PlaceholderDebtChart className="flex-1 min-h-[140px]" />
        </SketchBox>

        {/* Tab bar */}
        <div className="flex gap-1 border-b-2 border-dashed border-slate-200 mb-5">
          {[
            { label: "Breakdown", icon: List },
            { label: "Progress", icon: Target },
            { label: "Strategy", icon: Brain },
            { label: "Payments", icon: Calendar },
          ].map((tab, i) => (
            <div
              key={tab.label}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-[2px] transition-colors",
                i === 0
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-slate-400"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab content — Breakdown (active) */}
        <SketchBox title="All Debts" className="min-h-[200px]">
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                Sort by: APR ▼
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Credit Card", bal: "$8,230", apr: "22.9%", min: "$250", est: "Mar '28", interestPaid: "$1,840", interestTotal: "$3,200", color: "bg-rose-300", pw: "w-2/5", paid: "38%" },
                { name: "Student Loan", bal: "$18,400", apr: "6.8%", min: "$320", est: "Aug '27", interestPaid: "$2,100", interestTotal: "$4,800", color: "bg-amber-300", pw: "w-3/5", paid: "62%" },
                { name: "Auto Loan", bal: "$12,100", apr: "4.5%", min: "$380", est: "Nov '27", interestPaid: "$1,200", interestTotal: "$2,400", color: "bg-indigo-300", pw: "w-full", paid: "54%" },
                { name: "Medical", bal: "$8,500", apr: "0%", min: "$150", est: "Jun '28", interestPaid: "$0", interestTotal: "$0", color: "bg-emerald-300", pw: "w-2/5", paid: "28%" },
              ].map((d) => (
                <div key={d.name} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", d.color)} />
                      <span className="text-[12px] font-medium text-slate-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] tabular-nums text-slate-500">{d.bal}</span>
                      <span className={cn("text-[10px] tabular-nums", d.apr === "22.9%" ? "text-rose-500 font-medium" : "text-slate-400")}>{d.apr} APR</span>
                      <span className="text-[10px] text-slate-400">{d.min}/mo</span>
                      <span className="text-[10px] text-slate-400">Est: {d.est}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <PlaceholderProgress width={d.pw} color={d.color} />
                    <span className="text-[9px] text-slate-400">{d.paid} paid</span>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] text-slate-400">
                    <span>Interest paid: {d.interestPaid}</span>
                    <span>Total interest: {d.interestTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SketchBox>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */

export default function DebtWireframesPage() {
  return (
    <div className="min-h-screen w-full bg-stone-50">
      {/* Page header */}
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <TrendingDown className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Debt Card — Layout Wireframes
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              3 dashboard layouts + 3 fullscreen layouts · sketch templates for review
            </p>
          </div>
        </div>
      </header>

      {/* Color legend */}
      <div className="mx-auto max-w-6xl px-8 pt-8">
        <div className="rounded-lg border border-slate-200 bg-white p-4 mb-8">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Color System
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Student Loan", color: "bg-amber-400", note: "Primary accent" },
              { label: "Credit Card (high APR)", color: "bg-rose-400", note: "Urgent — attack first" },
              { label: "Auto Loan", color: "bg-indigo-400", note: "Ties to portfolio theme" },
              { label: "Medical (0% APR)", color: "bg-emerald-400", note: "Low priority" },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", d.color)} />
                <span className="text-[11px] text-slate-600">{d.label}</span>
                <span className="text-[10px] text-slate-400">— {d.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-6 space-y-16">
        {/* ---- Dashboard section ---- */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Dashboard (Compact)
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-14">
            <DashboardOption1 />
            <DashboardOption2 />
            <DashboardOption3 />
          </div>
        </section>

        {/* ---- Fullscreen section ---- */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Fullscreen (Expanded Card)
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-14">
            <FullscreenOption1 />
            <FullscreenOption2 />
            <FullscreenOption3 />
          </div>
        </section>
      </div>
    </div>
  )
}
