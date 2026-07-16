"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Maximize2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  List,
  Brain,
  Clock,
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

/** Placeholder chart — a simple zigzag line */
function PlaceholderChart({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-end gap-1 px-2", className)}>
      {[35, 45, 30, 55, 50, 65, 40, 70, 60, 75, 55, 80, 65, 72, 58].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-slate-200"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

/** Placeholder horizontal bars (for allocation / holdings) */
function PlaceholderBars({ count = 4, className }: { count?: number; className?: string }) {
  const widths = ["w-full", "w-4/5", "w-3/5", "w-2/5", "w-1/3", "w-1/2"]
  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <PlaceholderLine width="w-12" />
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={cn("h-full rounded-full bg-slate-200", widths[i % widths.length])} />
          </div>
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
  const ranges = ["1D", "1W", "1M", "3M", "1Y", "ALL"]
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

/* ------------------------------------------------------------------ */
/* Layout header                                                      */
/* ------------------------------------------------------------------ */

function LayoutLabel({
  number,
  title,
  description,
  variant,
}: {
  number: number
  title: string
  description: string
  variant?: string
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
        title="Classic Split"
        description="Chart dominates the left 2/3. Stats & allocation stack on the right."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: Chart */}
          <SketchBox title="Portfolio Chart" className="min-h-[280px] lg:col-span-2">
            <div className="flex w-full items-center justify-between mb-3">
              <div>
                <PlaceholderLine width="w-32" className="h-4 mb-1.5" />
                <div className="flex items-center gap-2">
                  <PlaceholderLine width="w-20" />
                  <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> +2.4%
                  </span>
                </div>
              </div>
              <FullscreenButton />
            </div>
            <TimeRangeSelector className="mb-4 self-start" />
            <PlaceholderChart className="flex-1 min-h-[120px]" />
          </SketchBox>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <SketchBox title="Portfolio Value" className="min-h-[90px]">
              <PlaceholderLine width="w-28" className="h-5" />
              <PlaceholderLine width="w-16" />
            </SketchBox>
            <SketchBox title="Day P&L" className="min-h-[90px]">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <PlaceholderLine width="w-24" className="h-5" />
              </div>
              <PlaceholderLine width="w-12" />
            </SketchBox>
            <SketchBox title="Allocation" className="min-h-[130px]">
              <PlaceholderBars count={4} />
            </SketchBox>
          </div>
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
        title="Stats Row + Full Width"
        description="Key metrics across the top in a clean row. Full-width chart below."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Top stats row */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-6">
            {[
              { label: "Portfolio Value", icon: TrendingUp },
              { label: "Day P&L", icon: ArrowUpRight },
              { label: "Total Return", icon: TrendingUp },
              { label: "Holdings", icon: List },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {item.label}
                </span>
                <PlaceholderLine width="w-20" className="h-4" />
              </div>
            ))}
          </div>
          <FullscreenButton />
        </div>

        {/* Full width chart */}
        <SketchBox title="Portfolio Chart" className="min-h-[300px]">
          <TimeRangeSelector className="mb-4 self-start" />
          <PlaceholderChart className="flex-1 min-h-[160px]" />
        </SketchBox>
      </div>
    </div>
  )
}

function DashboardOption3() {
  return (
    <div>
      <LayoutLabel
        number={3}
        title="Hero Chart + Floating Stats"
        description="Chart fills the entire card. Stats & controls float as overlays."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Hero chart area */}
        <div className="relative min-h-[340px] rounded-lg border-2 border-dashed border-slate-300 bg-white p-5">
          {/* Top-left: value overlay */}
          <div className="absolute top-4 left-4 z-10">
            <PlaceholderLine width="w-32" className="h-5 mb-1.5" />
            <div className="flex items-center gap-2">
              <PlaceholderLine width="w-20" className="h-3" />
              <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                <ArrowUpRight className="h-3 w-3" /> +$1,247.50
              </span>
            </div>
          </div>

          {/* Top-right: expand button */}
          <div className="absolute top-4 right-4 z-10">
            <FullscreenButton />
          </div>

          {/* Bottom-left: time range */}
          <div className="absolute bottom-4 left-4 z-10">
            <TimeRangeSelector />
          </div>

          {/* Bottom-right: mini stats */}
          <div className="absolute bottom-4 right-4 z-10 flex gap-4">
            {["Day", "Week", "Month"].map((period) => (
              <div key={period} className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  {period}
                </span>
                <PlaceholderLine width="w-12" />
              </div>
            ))}
          </div>

          {/* Chart fills the area */}
          <div className="flex h-full items-end pt-16">
            <PlaceholderChart className="flex-1" />
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
        title="Multi-Section Scroll"
        description="Hero stats bar → large chart → 2-col assets & trades → strategy at bottom."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Hero stats bar */}
        <div className="mb-5 flex items-center justify-between rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
          <div className="flex items-center gap-6">
            <div>
              <PlaceholderLine width="w-28" className="h-5 mb-1" />
              <PlaceholderLine width="w-16" />
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex gap-6">
              {["Day P&L", "Total Return", "Annualized", "Sharpe Ratio"].map((label) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                    {label}
                  </span>
                  <PlaceholderLine width="w-14" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlaceholderLine width="w-8" />
            <span className="text-[10px] text-slate-400">✕</span>
          </div>
        </div>

        {/* Large chart */}
        <SketchBox title="Performance" className="min-h-[280px] mb-5">
          <TimeRangeSelector className="mb-4 self-start" />
          <PlaceholderChart className="flex-1 min-h-[150px]" />
        </SketchBox>

        {/* Two columns: assets + trades */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
          <SketchBox title="Assets Held" className="min-h-[200px]">
            <PlaceholderTable rows={5} cols={5} />
          </SketchBox>
          <SketchBox title="Recent Trades" className="min-h-[200px]">
            <PlaceholderTable rows={5} cols={4} />
          </SketchBox>
        </div>

        {/* Strategy section */}
        <SketchBox title="Investment Strategy" className="min-h-[120px]">
          <div className="flex gap-8 w-full">
            <div className="flex-1">
              <PlaceholderLine width="w-16" className="mb-2" />
              <PlaceholderLine width="w-full" />
              <PlaceholderLine width="w-4/5" className="mt-1" />
              <PlaceholderLine width="w-3/5" className="mt-1" />
            </div>
            <div className="w-48">
              <PlaceholderBars count={3} />
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
        description="Same chart as dashboard but bigger. 3-column detail grid below."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Header with collapse */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <PlaceholderLine width="w-32" className="h-5" />
            <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
              <ArrowUpRight className="h-3 w-3" /> +2.4%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TimeRangeSelector />
            <div className="ml-2 flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-400">
              Collapse
            </div>
          </div>
        </div>

        {/* Bigger chart */}
        <SketchBox title="Portfolio Performance" className="min-h-[300px] mb-5">
          <PlaceholderChart className="flex-1 min-h-[180px]" />
        </SketchBox>

        {/* 3-column detail grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Assets */}
          <SketchBox title="Holdings" className="min-h-[220px]">
            <PlaceholderBars count={6} />
          </SketchBox>

          {/* Allocation + Strategy */}
          <SketchBox title="Strategy & Allocation" className="min-h-[220px]">
            <div className="w-full flex flex-col gap-4">
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Risk Profile
                </span>
                <PlaceholderLine width="w-20" className="mt-1" />
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <PlaceholderBars count={4} />
            </div>
          </SketchBox>

          {/* Recent Trades */}
          <SketchBox title="Recent Trades" className="min-h-[220px]">
            <PlaceholderTable rows={5} cols={3} />
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
        title="Tabbed Sections"
        description="Large chart always visible. Tab bar switches between Assets, Strategy, Trades, Allocation."
      />
      <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Chart section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <PlaceholderLine width="w-32" className="h-5 mb-1" />
            <div className="flex items-center gap-2">
              <PlaceholderLine width="w-20" />
              <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-medium">
                <ArrowUpRight className="h-3 w-3" /> +$1,247.50
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TimeRangeSelector />
            <div className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-400">
              Collapse
            </div>
          </div>
        </div>

        <SketchBox className="min-h-[240px] mb-5">
          <PlaceholderChart className="flex-1 min-h-[140px]" />
        </SketchBox>

        {/* Tab bar */}
        <div className="flex gap-1 border-b-2 border-dashed border-slate-200 mb-5">
          {[
            { label: "Assets", icon: List },
            { label: "Strategy", icon: Brain },
            { label: "Trades", icon: Clock },
            { label: "Allocation", icon: PieChart },
          ].map((tab, i) => (
            <div
              key={tab.label}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-[2px] transition-colors",
                i === 0
                  ? "border-slate-500 text-slate-600"
                  : "border-transparent text-slate-400"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab content area */}
        <div className="min-h-[180px]">
          <SketchBox title="Assets Held" className="min-h-[180px]">
            <PlaceholderTable rows={5} cols={5} />
          </SketchBox>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */

export default function PortfolioWireframesPage() {
  return (
    <div className="min-h-screen w-full bg-stone-50">
      {/* Page header */}
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Portfolio Page — Layout Wireframes
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          3 dashboard layouts + 3 fullscreen layouts · sketch templates for review
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-10 space-y-16">
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
