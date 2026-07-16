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
  Maximize2,
} from "lucide-react"

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Portfolio", icon: PieChart },
  { label: "Debt", icon: TrendingDown },
  { label: "Analytics", icon: BarChart3 },
  { label: "Memory", icon: Brain },
  { label: "Settings", icon: Settings },
]

const agents = ["Portfolio Agent", "Debt Agent", "Retirement Agent"]

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

function AgentButtons() {
  return (
    <div className="flex flex-col gap-3">
      {agents.map((agent) => (
        <button
          key={agent}
          className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          {agent}
        </button>
      ))}
    </div>
  )
}

export default function PortfolioPage() {
  return (
    <div className="flex h-screen w-full bg-stone-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="text-xl font-semibold text-slate-800">Portfolio</h1>
          <p className="text-xs text-slate-400">
            Stats row + full-width chart — expand to see details
          </p>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {/* Paper sheet */}
            <div className="rounded-xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: chart area */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Top stats row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-8">
                      {[
                        "Portfolio Value",
                        "Day P&L",
                        "Total Return",
                        "Holdings",
                      ].map((label) => (
                        <div key={label} className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            {label}
                          </span>
                          <div className="h-2.5 w-20 rounded-full bg-slate-200" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full width chart */}
                  <SketchBox title="Portfolio Chart" className="min-h-[300px]">
                    <div className="flex w-full items-center justify-between mb-3">
                      <div className="flex flex-col gap-1">
                        <div className="h-3 w-32 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-16 rounded-full bg-slate-200" />
                          <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" /> +2.4%
                          </span>
                        </div>
                      </div>
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
                    </div>
                    <span className="text-2xl font-bold text-slate-300">
                      Chart
                    </span>
                    <span className="text-xs text-slate-300">
                      Recharts area chart goes here
                    </span>
                  </SketchBox>

                  {/* Expand button — bottom center */}
                  <div className="flex justify-center">
                    <Link
                      href="/portfolio/full"
                      className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-5 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      Expand Portfolio
                    </Link>
                  </div>
                </div>

                {/* Right column — recent news + agent chat */}
                <div className="flex flex-col gap-8 lg:col-span-1">
                  <SketchBox title="Recent News" className="min-h-[140px]">
                    <span className="text-lg font-bold text-slate-300">
                      News
                    </span>
                  </SketchBox>

                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Agent Chat
                    </h4>
                    <AgentButtons />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
