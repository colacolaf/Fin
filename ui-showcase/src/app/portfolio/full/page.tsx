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
  ArrowDownRight,
  Minimize2,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const assets = [
  { ticker: "VOO", name: "Vanguard S&P 500", shares: 170, price: 454.3, value: 77231, allocation: 62, change: 3.2 },
  { ticker: "AAPL", name: "Apple Inc.", shares: 120, price: 186.9, value: 22428, allocation: 18, change: 1.8 },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 36, price: 415.2, value: 14947, allocation: 12, change: 2.1 },
  { ticker: "BND", name: "Vanguard Total Bond", shares: 138, price: 72.2, value: 9964, allocation: 8, change: 0.3 },
]

const trades = [
  { type: "BUY", ticker: "VOO", shares: 5, price: 452.3, date: "Dec 12", total: 2261.5 },
  { type: "SELL", ticker: "AAPL", shares: 10, price: 198.5, date: "Dec 10", total: 1985.0 },
  { type: "BUY", ticker: "MSFT", shares: 3, price: 415.0, date: "Dec 8", total: 1245.0 },
  { type: "BUY", ticker: "BND", shares: 20, price: 72.1, date: "Dec 5", total: 1442.0 },
  { type: "SELL", ticker: "TSLA", shares: 2, price: 245.0, date: "Dec 3", total: 490.0 },
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

export default function PortfolioFullPage() {
  const [timeRange, setTimeRange] = React.useState("1Y")

  return (
    <div className="dark flex h-screen w-full bg-[#0F1117]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[#2A2D38] bg-[#141720] px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#E8E9ED] tracking-tight">
                Portfolio — Full View
              </h1>
              <p className="text-xs text-[#6B7085]">
                Terminal grid — assets, trades, and strategy
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
              <Link href="/portfolio">
                <MetalButton
                  preset="chromatic"
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
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {/* Paper sheet */}
            <div className="rounded-xl bg-[#1A1D26] p-6 ring-1 ring-[#2A2D38]">
              {/* Hero stats bar */}
              <div className="mb-6 flex items-center gap-8 rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#6B7085]">
                    Portfolio Value
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#E8E9ED]">
                    $124,580
                  </p>
                </div>
                <div className="h-10 w-px bg-[#2A2D38]" />
                {[
                  { label: "Day P&L", value: "+$1,247", color: "#34D399" },
                  { label: "Total Return", value: "+12.4%", color: "#34D399" },
                  { label: "Annualized", value: "+18.2%", color: "#34D399" },
                  { label: "Sharpe Ratio", value: "1.42", color: "#E8E9ED" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[#6B7085]">
                      {stat.label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Large chart */}
              <div className="mb-6 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradientFull" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#chartGradientFull)"
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

              {/* 2-column: Assets + Trades */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                {/* Assets table */}
                <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                  <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                    Assets Held
                  </h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A2D38] text-[10px] font-medium uppercase tracking-widest text-[#6B7085]">
                        <th className="pb-2 text-left">Asset</th>
                        <th className="pb-2 text-right">Shares</th>
                        <th className="pb-2 text-right">Value</th>
                        <th className="pb-2 text-right">%</th>
                        <th className="pb-2 text-right">Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.ticker} className="border-b border-[#2A2D38]/50">
                          <td className="py-2.5">
                            <div>
                              <p className="text-sm font-medium text-[#E8E9ED]">{asset.ticker}</p>
                              <p className="text-[10px] text-[#6B7085]">{asset.name}</p>
                            </div>
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#E8E9ED]">
                            {asset.shares}
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#E8E9ED]">
                            ${asset.value.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#E8E9ED]">
                            {asset.allocation}%
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="flex items-center justify-end gap-1 text-sm text-[#34D399]">
                              <ArrowUpRight className="h-3 w-3" />
                              +{asset.change}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Trades table */}
                <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                  <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                    Recent Trades
                  </h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A2D38] text-[10px] font-medium uppercase tracking-widest text-[#6B7085]">
                        <th className="pb-2 text-left">Type</th>
                        <th className="pb-2 text-left">Asset</th>
                        <th className="pb-2 text-right">Shares</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, i) => (
                        <tr key={i} className="border-b border-[#2A2D38]/50">
                          <td className="py-2.5">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                trade.type === "BUY"
                                  ? "bg-[#34D399]/10 text-[#34D399]"
                                  : "bg-[#F87171]/10 text-[#F87171]"
                              )}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2.5 text-sm font-medium text-[#E8E9ED]">
                            {trade.ticker}
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#E8E9ED]">
                            {trade.shares}
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#6B7085]">
                            ${trade.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right text-sm text-[#E8E9ED]">
                            ${trade.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategy section */}
              <div className="rounded-lg border border-[#2A2D38] bg-[#1A1D26] p-5">
                <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[#6B7085]">
                  Investment Strategy
                </h3>
                <div className="flex gap-8">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#E8E9ED]">Growth-focused</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B7085]">
                      80% equities tilted toward US large-cap via VOO. Individual stock
                      positions in AAPL and MSFT for sector concentration. 8% bond
                      allocation for stability. Rebalance quarterly or when drift exceeds 5%.
                    </p>
                  </div>
                  <div className="w-48 space-y-3">
                    {[
                      { label: "Risk Level", value: "Moderate", width: "w-3/4" },
                      { label: "Rebalance", value: "Quarterly", width: "w-1/2" },
                      { label: "Dividend", value: "Reinvest", width: "w-2/3" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[#6B7085]">{item.label}</span>
                          <span className="text-xs font-medium text-[#E8E9ED]">{item.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#232630]">
                          <div className={cn("h-full rounded-full bg-[#818CF8]/50", item.width)} />
                        </div>
                      </div>
                    ))}
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
