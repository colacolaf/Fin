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
  TrendingUp,
  Clock,
  Circle,
  Activity,
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
/*  DATA LAYER — same interfaces as dashboard; swap for real API       */
/* ================================================================== */

interface PortfolioAsset {
  ticker: string
  name: string
  shares: number
  price: number
  value: number
  allocation: number
  change: number
  sparkData: number[]
}

interface ChartPoint {
  date: string
  value: number
  daily: number
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
  value: number
  color: string
  dollarValue: number
}

/* ── Mock data ─────────────────────────────────────────────────────── */

const PORTFOLIO_VALUE = 124_580
const DAY_PNL = 1_247
const TOTAL_RETURN = 12.4
const ANNUALIZED = 18.2
const SHARPE = 1.42
const VOLATILITY = 14.8
const WIN_RATE = 72

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

const assets: PortfolioAsset[] = [
  {
    ticker: "VOO", name: "Vanguard S&P 500", shares: 170, price: 454.3,
    value: 77_231, allocation: 62, change: 3.2,
    sparkData: [42, 44, 41, 46, 48, 47, 50, 49, 52, 54, 53, 56],
  },
  {
    ticker: "AAPL", name: "Apple Inc.", shares: 120, price: 186.9,
    value: 22_428, allocation: 18, change: 1.8,
    sparkData: [18, 17, 19, 18, 20, 21, 19, 22, 21, 23, 22, 24],
  },
  {
    ticker: "MSFT", name: "Microsoft Corp.", shares: 36, price: 415.2,
    value: 14_947, allocation: 12, change: 2.1,
    sparkData: [38, 40, 39, 42, 41, 43, 45, 44, 46, 48, 47, 50],
  },
  {
    ticker: "BND", name: "Vanguard Total Bond", shares: 138, price: 72.2,
    value: 9_964, allocation: 8, change: 0.3,
    sparkData: [72, 72, 73, 72, 73, 73, 74, 73, 74, 74, 75, 75],
  },
]

const trades: Trade[] = [
  { type: "BUY",  ticker: "VOO",  shares: 5,  price: 452.3, date: "Dec 12, 2:30 PM" },
  { type: "SELL", ticker: "AAPL", shares: 10, price: 198.5, date: "Dec 10, 10:15 AM" },
  { type: "BUY",  ticker: "MSFT", shares: 3,  price: 415.0, date: "Dec 8, 3:45 PM" },
  { type: "BUY",  ticker: "BND",  shares: 20, price: 72.1,  date: "Dec 5, 11:00 AM" },
  { type: "SELL", ticker: "TSLA", shares: 2,  price: 245.0, date: "Dec 3, 9:30 AM" },
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
/*  Glass Card                                                        */
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
/*  Tiny sparkline                                                    */
/* ================================================================== */

function TinySparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const sparkData = data.map((v, i) => ({ x: i, y: v }))
  const color = positive ? "#34D399" : "#F87171"
  return (
    <div className="h-6 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area type="monotone" dataKey="y" stroke={color} strokeWidth={1.5} fill="none" isAnimationActive={false} />
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
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1.5">{label}</p>
      <div className="flex items-baseline gap-4">
        <div>
          <p className="text-[10px] text-white/[0.38]">Portfolio</p>
          <p className="text-sm font-semibold text-white tabular-nums">${val.toLocaleString()}</p>
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

function TimeRangeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
  const r = (outerRadius ?? 0) + (isActive ? 8 : 0)
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={r}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} strokeWidth={0}
      />
      {isActive && (
        <Sector
          cx={cx} cy={cy}
          innerRadius={r + 2} outerRadius={r + 5}
          startAngle={startAngle} endAngle={endAngle}
          fill={fill} opacity={0.25} strokeWidth={0}
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

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            {/* Center label */}
            <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" fill="#F7F8FA" fontSize="18" fontWeight="600">
              ${PORTFOLIO_VALUE.toLocaleString()}
            </text>
            <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.38)" fontSize="10">
              Total
            </text>
            <InteractivePie
              data={allocationData}
              cx="50%" cy="50%"
              innerRadius={70} outerRadius={100}
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
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
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
            <div className="text-right">
              <span className="text-[11px] tabular-nums text-white/[0.7]">${asset.dollarValue.toLocaleString()}</span>
              <span className="text-[10px] tabular-nums text-white/[0.35] ml-1.5">{asset.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ================================================================== */
/*  Stat pill                                                         */
/* ================================================================== */

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">{label}</span>
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

export default function PortfolioFullPage() {
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
              <h1 className="text-[14px] font-semibold text-white tracking-tight">Portfolio — Full View</h1>
              <p className="text-[11px] text-white/[0.38]">Terminal grid — assets, trades, and strategy</p>
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
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <Link href="/portfolio">
              <MetalButton preset="chromatic" theme="dark" variant="outline" size="sm" className="gap-2 text-xs" strength={0.7}>
                <Minimize2 className="h-3.5 w-3.5" />
                Collapse
              </MetalButton>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-8 py-5 space-y-4">

            {/* ── Hero Stats ── */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38] mb-1">Portfolio Value</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[36px] leading-none font-semibold tracking-tight text-white tabular-nums">
                    ${Math.round(animatedValue).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#34D399]">
                    <ArrowUpRight className="h-3.5 w-3.5" />+2.4%
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
            </div>

            {/* ── Large Performance Chart ── */}
            <GlassCard className="p-5">
              <div className="relative h-[420px] w-full">
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
                  <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1">
                    <Activity className="h-3 w-3 text-[#67E8F9]" />
                    <span className="text-[10px] text-white/[0.5]">Beta</span>
                    <span className="text-[10px] font-semibold text-[#67E8F9]">0.87</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 36, right: 12, left: 4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="chartGlowFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818CF8" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} dx={-8} domain={["dataMin - 5000", "dataMax + 5000"]} />
                    <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                    <Area
                      type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={2}
                      fill="url(#chartGlowFull)" dot={false}
                      activeDot={{ r: 4, fill: "#08090C", stroke: "#818CF8", strokeWidth: 2 }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(129,140,248,0.3))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* ── 3-column grid: Assets | Allocation | Trades ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

              {/* Assets table */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Assets Held</h3>
                  <span className="text-[10px] text-white/[0.25]">{assets.length} positions</span>
                </div>
                <div className="space-y-0.5">
                  {assets.map((a) => (
                    <div key={a.ticker} className="flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium text-white">{a.ticker}</span>
                          <span className="text-[10px] text-white/[0.38] truncate">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-white/[0.25]">{a.shares} shares</span>
                          <span className="text-[10px] text-white/[0.25]">{a.allocation}%</span>
                        </div>
                      </div>
                      <TinySparkline data={a.sparkData} positive={a.change >= 0} />
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-medium tabular-nums text-white">${a.value.toLocaleString()}</p>
                        <p className={cn("text-[10px] tabular-nums", a.change >= 0 ? "text-[#34D399]" : "text-[#F87171]")}>
                          {a.change >= 0 ? "+" : ""}{a.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Allocation pie — dedicated card */}
              <AllocationCard />

              {/* Recent Trades */}
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Recent Trades</h3>
                  <span className="text-[10px] text-white/[0.25]">Last 30 days</span>
                </div>
                <div className="space-y-0.5">
                  {trades.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0", t.type === "BUY" ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[#F87171]/10 text-[#F87171]")}>
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
                          <span className="text-[10px] text-white/[0.38]">{t.shares} shares @ ${t.price.toFixed(2)}</span>
                          <span className="text-[10px] text-white/[0.25]">{t.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* ── Strategy Section ── */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">Investment Strategy</h3>
                <span className="text-[10px] text-white/[0.25]">AI-managed</span>
              </div>
              <div className="flex gap-10">
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-white mb-2">Growth-focused</p>
                  <p className="text-[12px] leading-relaxed text-white/[0.38] max-w-lg">
                    80% equities tilted toward US large-cap via VOO. Individual stock positions in AAPL and MSFT for
                    sector concentration. 8% bond allocation for stability. Rebalance quarterly or when drift exceeds 5%.
                  </p>
                </div>
                <div className="w-56 space-y-3.5 shrink-0">
                  {[
                    { label: "Risk Level", value: "Moderate", pct: 55 },
                    { label: "Rebalance", value: "Quarterly", pct: 25 },
                    { label: "Dividend", value: "Reinvest", pct: 100 },
                    { label: "Drawdown Limit", value: "-15%", pct: 75 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-white/[0.25]">{item.label}</span>
                        <span className="text-[11px] font-medium text-white/[0.7]">{item.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#818CF8]/60 to-[#67E8F9]/40"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
