"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PieChart,
  TrendingDown,
  Brain,
  BarChart3,
  Settings,
  ArrowUpRight,
  Minimize2,
} from "lucide-react"

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Portfolio", icon: PieChart },
  { label: "Debt", icon: TrendingDown },
  { label: "Analytics", icon: BarChart3 },
  { label: "Memory", icon: Brain },
  { label: "Settings", icon: Settings },
]

function SketchBox({
  title,
  className,
  children,
}: {
  title: string
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
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </h3>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
        {children}
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="flex h-full w-14 flex-col items-center gap-4 border-r border-slate-200 bg-white py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500">
        <BarChart3 className="h-4 w-4" />
      </div>
      <div className="h-px w-8 bg-slate-100" />
      {sidebarItems.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors",
            item.label === "Portfolio"
              ? "bg-slate-100 text-slate-700"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          )}
          title={item.label}
        >
          <item.icon className="h-4 w-4" />
        </div>
      ))}
    </aside>
  )
}

export default function PortfolioFullPage() {
  return (
    <div className="flex h-screen w-full bg-stone-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="text-xl font-semibold text-slate-800">
            Portfolio — Full View
          </h1>
          <p className="text-xs text-slate-400">
            Expanded chart with holdings, strategy & trades
          </p>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {/* Paper sheet */}
            <div className="rounded-xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
              {/* Controls bar */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="h-3 w-28 rounded-full bg-slate-200" />
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-16 rounded-full bg-slate-200" />
                      <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" /> +2.4%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex gap-6">
                    {["Day P&L", "Total Return", "Annualized", "Sharpe Ratio"].map(
                      (label) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                            {label}
                          </span>
                          <div className="h-2.5 w-14 rounded-full bg-slate-200" />
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((r) => (
                      <span
                        key={r}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-400"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/portfolio"
                    className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                    Collapse
                  </Link>
                </div>
              </div>

              {/* Large chart */}
              <SketchBox title="Portfolio Performance" className="min-h-[300px] mb-6">
                <span className="text-2xl font-bold text-slate-300">
                  Chart
                </span>
                <span className="text-xs text-slate-300">
                  Recharts area chart goes here — bigger than dashboard
                </span>
              </SketchBox>

              {/* 3-column detail grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Holdings */}
                <SketchBox title="Holdings" className="min-h-[220px]">
                  <span className="text-lg font-bold text-slate-300">
                    Holdings
                  </span>
                  <span className="text-xs text-slate-300">
                    Allocation bars per asset
                  </span>
                </SketchBox>

                {/* Strategy & Allocation */}
                <SketchBox title="Strategy & Allocation" className="min-h-[220px]">
                  <span className="text-lg font-bold text-slate-300">
                    Strategy
                  </span>
                  <span className="text-xs text-slate-300">
                    Risk profile + allocation chart
                  </span>
                </SketchBox>

                {/* Recent Trades */}
                <SketchBox title="Recent Trades" className="min-h-[220px]">
                  <span className="text-lg font-bold text-slate-300">
                    Trades
                  </span>
                  <span className="text-xs text-slate-300">
                    Table of recent buy/sell activity
                  </span>
                </SketchBox>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
