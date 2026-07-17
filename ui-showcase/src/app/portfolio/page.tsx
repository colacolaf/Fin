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
  Maximize2,
  TrendingUp,
  Clock,
  Circle,
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
  Sector,
} from "recharts"
import type { SectorProps } from "recharts"

/* Recharts v3 removed activeIndex from Pie types but it still works at runtime */
const InteractivePie = Pie as React.ComponentType<any>
import { MetalButton } from "@/components/ui/metal-button"

/* ================================================================== */
/*  DATA LAYER — swap these for real API calls                        */
/*  All mock data follows the same interfaces a real API would return  */
/* ================================================================== */

interface PortfolioAsset {
  ticker: string
  name: string
  weight: number        // 0–100
  today: number         // % change today
  totalGain: number     // % total return
  value: number         // current dollar value
  shares: number
  sparkData: number[]
}

interface ChartPoint {
  date: string
  value: number
  daily: number         // daily return %
}

interface Trade {
  type: "BUY" | "SELL"
  ticker: string
  shares: number
  price: number
  date: string
}

interface AllocationSlice {
  name: string
  value: number         // weight %
  color: string
  dollarValue: number
}

/* ── Mock data (replace with API fetch) ────────────────────────────── */

const PORTFOLIO_VALUE = 124_580
const DAY_PNL = 1_247.50
const TOTAL_RETURN = 12.4
const ANNUALIZED = 18.2
const SHARPE = 1.42
const VOLATILITY = 14.8
const WIN_RATE = 72
const DRAWDOWN = -15

const chartData: ChartPoint[] = [
  { date: "Jan", value: 98000, daily: -0.4 },
  { date: "Feb", value: 101200, daily: 3.3 },
  { date: "Mar", value: 97800, daily: -3.4 },
  { date: "Apr", value: 104500, daily: 6.9 },
  { date: "May", value: 108300, daily: 3.6 },
  { date: "Jun", value: 106100, daily: -2.0 },
  { date: "Jul", value: 112400, daily: 5.9 },
  { date: "Aug", value: 110800, daily: -1.4 },
  { date: "Sep", value: 115200, daily: 4.0 },
  { date: "Oct", value: 118600, daily: 3.0 },
  { date: "Nov", value: 121400, daily: 2.4 },
  { date: "Dec", value: 124580, daily: 2.6 },
]

const allocationData: AllocationSlice[] = [
  { name: "VOO",  value: 62, color: "#818CF8", dollarValue: 77_240 },
  { name: "AAPL", value: 18, color: "#67E8F9", dollarValue: 22_424 },
  { name: "MSFT", value: 12, color: "#34D399", dollarValue: 14_950 },
  { name: "BND",  value: 8,  color: "#FBBF24", dollarValue: 9_966  },
]

const holdings: PortfolioAsset[] = [
  {
    ticker: "VOO", name: "Vanguard S&P 500", weight: 62,
    today: 1.2, totalGain: 14.8, value: 77_231, shares: 170,
    sparkData: [42, 44, 41, 46, 48, 47, 50, 49, 52, 54, 53, 56],
  },
  {
    ticker: "AAPL", name: "Apple Inc.", weight: 18,
    today: 1.8, totalGain: 8.4, value: 22_428, shares: 120,
    sparkData: [18, 17, 19, 18, 20, 21, 19, 22, 21, 23, 22, 24],
  },
  {
    ticker: "MSFT", name: "Microsoft Corp.", weight: 12,
    today: 2.1, totalGain: 11.2, value: 14_947, shares: 36,
    sparkData: [38, 40, 39, 42, 41, 43, 45, 44, 46, 48, 47, 50],
  },
  {
    ticker: "BND", name: "Vanguard Total Bond", weight: 8,
    today: 0.1, totalGain: 1.2, value: 9_964, shares: 138,
    sparkData: [72, 72, 73, 72, 73, 73, 74, 73, 74, 74, 75, 75],
  },
]

const trades: Trade[] = [
  { type: "BUY",  ticker: "VOO",  shares: 5,  price: 452.3, date: "Dec 12, 2:30 PM" },
  { type: "SELL", ticker: "AAPL", shares: 10, price: 198.5, date: "Dec 10, 10:15 AM" },
  { type: "BUY",  ticker: "MSFT", shares: 3,  price: 415.0, date: "Dec 8, 3:45 PM" },
  { type: "BUY",  ticker: "BND",  shares: 20, price: 72.1,  date: "Dec 5, 11:00 AM" },
]

/* ================================================================== */
/*  Count-up animation                                                */
/* ================================================================== */

function useCountUp(end: number, durationMs = 1400) {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    let start: number
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / durationMs, 1)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setCount(end * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, durationMs])
  return count
}

/* ================================================================== */
/*  Sidebar                                                           */
/* ================================================================== */

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
    <aside className="flex h-full w-14 flex-col items-center gap-4 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#818CF8]/10 text-[#818CF8]">
        <BarChart3 className="h-4 w-4" />
      </div>
      <div className="h-px w-6 bg-white/[0.06]" />
      {sidebarItems.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150",
            item.label === "Portfolio"
              ? "bg-white/[0.08] text-white"
              : "text-white/[0.38] hover:bg-white/[0.05] hover:text-white/[0.7]"
          )}
          title={item.label}
        >
          <item.icon className="h-4 w-4" />
        </div>
      ))}
    </aside>
  )
}

/* ================================================================== */
/*  Glass Card — no floaty hover, just sharp                          */
/* ================================================================== */

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.06]",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ================================================================== */
/*  Tiny sparkline for holdings table                                 */
/* ================================================================== */

function TinySparkline({
  data,
  positive,
}: {
  data: number[]
  positive: boolean
}) {
  const sparkData = data.map((v, i) => ({ x: i, y: v }))
  const color = positive ? "#34D399" : "#F87171"
  return (
    <div className="h-6 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.5}
            fill="none"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ================================================================== */
/*  Performance chart tooltip                                         */
/* ================================================================== */

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  const dailyReturn = payload[0].payload?.daily
  const isPositive = (dailyReturn ?? 0) >= 0

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-4">
        <div>
          <p className="text-[10px] text-white/[0.38]">Portfolio</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            ${val.toLocaleString()}
          </p>
        </div>
        {dailyReturn != null && (
          <div>
            <p className="text-[10px] text-white/[0.38]">Daily</p>
            <p className={cn("text-sm font-semibold tabular-nums", isPositive ? "text-[#34D399]" : "text-[#F87171]")}>
              {isPositive ? "+" : ""}{dailyReturn}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Time Range Selector                                               */
/* ================================================================== */

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const ranges = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"]
  return (
    <div className="flex gap-0.5 p-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
            value === r
              ? "bg-[#818CF8]/20 text-[#818CF8]"
              : "text-white/[0.38] hover:text-white/[0.7]"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Interactive Allocation Pie                                        */
/*  ─ activeShape expands slice on hover                              */
/*  ─ custom tooltip shows asset name, %, $value                      */
/*  ─ legend grid below with hover highlight                          */
/* ================================================================== */

function AllocationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as AllocationSlice
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-[11px] font-semibold text-white">{d.name}</span>
      </div>
      <p className="text-[13px] font-semibold text-white tabular-nums">
        ${d.dollarValue.toLocaleString()}
      </p>
      <p className="text-[11px] text-white/[0.4] tabular-nums">{d.value}% of portfolio</p>
    </div>
  )
}

function renderActiveShape(props: SectorProps & { isActive?: boolean }) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, isActive } = props
  const r = (outerRadius ?? 0) + (isActive ? 6 : 0)
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={r}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        strokeWidth={0}
      />
      {isActive && (
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={r + 2}
          outerRadius={r + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
          strokeWidth={0}
        />
      )}
    </g>
  )
}

function AllocationCard() {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

  return (
    <GlassCard className="p-5">
      <h3 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38] mb-4">
        Allocation
      </h3>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <InteractivePie
              data={allocationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {allocationData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </InteractivePie>
            <Tooltip content={<AllocationTooltip />} />
            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#F7F8FA" fontSize="16" fontWeight="600">
              ${PORTFOLIO_VALUE.toLocaleString()}
            </text>
            <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="10">
              Total
            </text>
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Legend grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2 pt-4 border-t border-white/[0.06]">
        {allocationData.map((asset) => (
          <div
            key={asset.name}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1 -mx-2 transition-colors duration-150 cursor-default",
              activeIndex !== undefined && allocationData[activeIndex]?.name === asset.name
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.03]"
            )}
            onMouseEnter={() => setActiveIndex(allocationData.indexOf(asset))}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
              <span className="text-[11px] font-medium text-white">{asset.name}</span>
            </div>
            <span className="text-[11px] tabular-nums text-white/[0.4]">{asset.value}%</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ================================================================== */
/*  Stat pill (used in metrics header)                                */
/* ================================================================== */

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
        {label}
      </span>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: color === "green" ? "#34D399" : color === "red" ? "#F87171" : "#F7F8FA" }}
      >
        {value}
      </span>
    </div>
  )
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = React.useState("1Y")
  const animatedValue = useCountUp(PORTFOLIO_VALUE)

  return (
    <div className="dark flex h-screen w-full bg-[#08090C]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#818CF8]/10">
              <TrendingUp className="h-4 w-4 text-[#818CF8]" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white tracking-tight">Portfolio</h1>
              <p className="text-[11px] text-white/[0.38]">Analyst split view</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Circle className="h-2 w-2 fill-[#34D399] text-[#34D399]" />
              <span className="text-[11px] text-white/[0.38]">Markets Open</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/[0.25]">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">Updated 2m ago</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {/* ── Metrics row ── */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
                  Portfolio Value
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
                    ${Math.round(animatedValue).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#34D399]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +2.4%
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Today" value={`+$${DAY_PNL.toLocaleString()}`} color="green" />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Return" value={`+${TOTAL_RETURN}%`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Annualized" value={`${ANNUALIZED}%`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Sharpe" value={SHARPE.toString()} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Volatility" value={`${VOLATILITY}%`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Win Rate" value={`${WIN_RATE}%`} />
              <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
              <StatPill label="Drawdown" value={`${DRAWDOWN}%`} color="red" />
            </div>

            {/* ── Time range ── */}
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38]">
                Performance
              </h2>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* ── Chart (2/3) + Right column (1/3) ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Performance chart */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="relative h-[380px] w-full">
                  {/* Overlay pills */}
                  <div className="absolute top-3 left-5 z-10 flex gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                      <ArrowUpRight className="h-3 w-3 text-[#34D399]" />
                      <span className="text-[10px] text-white/[0.5]">Best</span>
                      <span className="text-[10px] font-semibold text-[#34D399]">+6.2%</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                      <ArrowDownRight className="h-3 w-3 text-[#F87171]" />
                      <span className="text-[10px] text-white/[0.5]">Worst</span>
                      <span className="text-[10px] font-semibold text-[#F87171]">-4.3%</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 36, right: 12, left: 4, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818CF8" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        dx={-8}
                        domain={["dataMin - 5000", "dataMax + 5000"]}
                      />
                      <Tooltip
                        content={<GlassTooltip />}
                        cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#818CF8"
                        strokeWidth={2}
                        fill="url(#chartGlow)"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#08090C",
                          stroke: "#818CF8",
                          strokeWidth: 2,
                        }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(129,140,248,0.3))" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Right column stack */}
              <div className="space-y-4">

                {/* Day P&L */}
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
                    Day P&amp;L
                  </p>
                  <p className="text-[22px] font-semibold text-[#34D399] tabular-nums">
                    +${DAY_PNL.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-white/[0.38]">+1.01% today</p>
                </GlassCard>

                {/* Total Return */}
                <GlassCard className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">
                    Total Return
                  </p>
                  <p className="text-[22px] font-semibold text-white tabular-nums">
                    +{TOTAL_RETURN}%
                  </p>
                  <p className="text-[11px] text-white/[0.38]">Since Jan 2025</p>
                </GlassCard>

                {/* Interactive Allocation Pie */}
                <AllocationCard />
              </div>
            </div>

            {/* ── Holdings + Recent Trades ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Holdings (3/5) */}
              <GlassCard className="lg:col-span-3 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                    Holdings
                  </h3>
                  <span className="text-[10px] text-white/[0.25]">{holdings.length} assets</span>
                </div>

                <div className="grid grid-cols-[1fr_56px_72px_56px_72px_72px] gap-3 pb-2.5 border-b border-white/[0.04]">
                  {["Asset", "Weight", "Today", "Gain", "Trend", "Value"].map((h) => (
                    <span
                      key={h}
                      className={cn(
                        "text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25]",
                        h !== "Asset" && h !== "Trend" && "text-right"
                      )}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-white/[0.03]">
                  {holdings.map((h) => (
                    <div
                      key={h.ticker}
                      className="grid grid-cols-[1fr_56px_72px_56px_72px_72px] gap-3 items-center py-2.5 -mx-2 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-white">{h.ticker}</p>
                        <p className="text-[10px] text-white/[0.38]">{h.name}</p>
                      </div>
                      <span className="text-right text-[12px] tabular-nums text-white/[0.5]">
                        {h.weight}%
                      </span>
                      <span className={cn("text-right text-[12px] font-medium tabular-nums", h.today >= 0 ? "text-[#34D399]" : "text-[#F87171]")}>
                        {h.today >= 0 ? "+" : ""}{h.today}%
                      </span>
                      <span className={cn("text-right text-[12px] tabular-nums", h.totalGain >= 0 ? "text-[#34D399]" : "text-[#F87171]")}>
                        {h.totalGain >= 0 ? "+" : ""}{h.totalGain}%
                      </span>
                      <div className="flex justify-end">
                        <TinySparkline data={h.sparkData} positive={h.totalGain >= 0} />
                      </div>
                      <span className="text-right text-[12px] font-medium tabular-nums text-white">
                        ${h.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Recent Trades (2/5) */}
              <GlassCard className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
                    Recent Trades
                  </h3>
                  <span className="text-[10px] text-white/[0.25]">Last 30 days</span>
                </div>

                <div className="space-y-0.5">
                  {trades.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0",
                          t.type === "BUY"
                            ? "bg-[#34D399]/10 text-[#34D399]"
                            : "bg-[#F87171]/10 text-[#F87171]"
                        )}
                      >
                        {t.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[13px] font-medium text-white">{t.ticker}</span>
                          <span className="text-[13px] tabular-nums text-white">
                            ${(t.price * t.shares).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-[10px] text-white/[0.38]">
                            {t.shares} shares @ ${t.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-white/[0.25]">{t.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* ── Expand Button ── */}
            <div className="flex justify-center pt-1 pb-4">
              <Link href="/portfolio/full">
                <MetalButton
                  preset="chromatic"
                  theme="dark"
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
      </main>
    </div>
  )
}
