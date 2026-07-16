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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts"
import { MetalButton } from "@/components/ui/metal-button"

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const chartData = [
  { date: "Jan", value: 98000 },
  { date: "Feb", value: 101200 },
  { date: "Mar", value: 97800 },
  { date: "Apr", value: 104500 },
  { date: "May", value: 108300 },
  { date: "Jun", value: 106100 },
  { date: "Jul", value: 112400 },
  { date: "Aug", value: 110800 },
  { date: "Sep", value: 115200 },
  { date: "Oct", value: 118600 },
  { date: "Nov", value: 121400 },
  { date: "Dec", value: 124580 },
]

const allocationData = [
  { name: "VOO", value: 62, color: "#818CF8" },
  { name: "AAPL", value: 18, color: "#34D399" },
  { name: "MSFT", value: 12, color: "#FBBF24" },
  { name: "BND", value: 8, color: "#6B7085" },
]

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Portfolio", icon: PieChart },
  { label: "Debt", icon: TrendingDown },
  { label: "Analytics", icon: BarChart3 },
  { label: "Memory", icon: Brain },
  { label: "Settings", icon: Settings },
]

function Sidebar() {
  return (
    <aside className="flex h-full w-14 flex-col items-center gap-4 border-r border-[#2A2D38] bg-[#141720] py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#818CF8]/10 text-[#818CF8]">
        <BarChart3 className="h-4 w-4" />
      </div>
      <div className="h-px w-8 bg-[#2A2D38]" />
      {sidebarItems.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors",
            item.label === "Portfolio"
              ? "bg-[#818CF8]/15 text-[#818CF8]"
              : "text-[#6B7085] hover:bg-[#232630] hover:text-[#E8E9ED]"
          )}
          title={item.label}
        >
          <item.icon className="h-4 w-4" />
        </div>
      ))}
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Custom Tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] px-3 py-2 shadow-xl">
      <p className="text-[10px] font-medium text-[#6B7085]">{label}</p>
      <p className="text-sm font-semibold text-[#E8E9ED]">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Time Range Pills                                                    */
/* ------------------------------------------------------------------ */

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const ranges = ["1D", "1W", "1M", "3M", "1Y", "ALL"]
  return (
    <div className="flex gap-1 rounded-lg bg-[#232630] p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === r
              ? "bg-[#818CF8] text-white shadow-sm"
              : "text-[#6B7085] hover:text-[#E8E9ED]"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = React.useState("1Y")
  return (
    <div className="dark flex h-screen w-full bg-[#0F1117]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[#2A2D38] bg-[#141720] px-8 py-5">
          <h1 className="text-lg font-semibold text-[#E8E9ED] tracking-tight">
            Portfolio
          </h1>
          <p className="text-xs text-[#6B7085]">
            Analyst split view — chart + allocation side by side
          </p>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {/* Paper sheet */}
            <div className="rounded-xl bg-[#1A1D26] p-6 ring-1 ring-[#2A2D38]">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Chart (2/3) */}
                <div className="flex flex-col gap-5 lg:col-span-2">
                  {/* Value header */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                        Portfolio Value
                      </p>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-3xl font-bold tracking-tight text-[#E8E9ED]">
                          $124,580
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-[#34D399]">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          +2.4%
                        </span>
                      </div>
                    </div>
                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                  </div>

                  {/* Chart */}
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818CF8" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#2A2D38"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7085", fontSize: 11 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7085", fontSize: 11 }}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          dx={-8}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#818CF8"
                          strokeWidth={2}
                          fill="url(#chartGradient)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: "#818CF8",
                            stroke: "#1A1D26",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right column: Allocation + Stats */}
                <div className="flex flex-col gap-5 lg:col-span-1">
                  {/* Allocation Pie */}
                  <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                    <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                      Allocation
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-[160px] w-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {allocationData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2">
                        {allocationData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-[#6B7085]">{item.name}</span>
                            <span className="ml-auto text-xs font-medium text-[#E8E9ED]">
                              {item.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Day P&L */}
                  <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                      Day P&L
                    </h3>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[#34D399]" />
                      <span className="text-xl font-bold text-[#34D399]">+$1,247.50</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B7085]">+1.01% today</p>
                  </div>

                  {/* Total Return */}
                  <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                      Total Return
                    </h3>
                    <span className="text-xl font-bold text-[#E8E9ED]">+12.4%</span>
                    <p className="mt-1 text-xs text-[#6B7085]">Since Jan 2025</p>
                  </div>
                </div>
              </div>

              {/* Expand button — bottom center with metal effect */}
              <div className="mt-6 flex justify-center">
                <Link href="/portfolio/full">
                  <MetalButton
                    preset="chromatic"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    strength={0.7}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Expand Portfolio
                  </MetalButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
