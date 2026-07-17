import { ArrowUpRight } from "lucide-react"
import { StatPill } from "./stat-pill"
import type { PortfolioSummary } from "@/lib/portfolio/types"

export function MetricsRow({
  summary,
  animatedValue,
}: {
  summary: PortfolioSummary
  animatedValue: number
}) {
  return (
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
            +{summary.totalReturn}%
          </span>
        </div>
      </div>

      <Divider />
      <StatPill label="Today" value={`+$${summary.dayPnl.toLocaleString()}`} color="green" />
      <Divider />
      <StatPill label="Return" value={`+${summary.totalReturn}%`} />
      <Divider />
      <StatPill label="Annualized" value={`${summary.annualized}%`} />
      <Divider />
      <StatPill label="Sharpe" value={summary.sharpe.toString()} />
      <Divider />
      <StatPill label="Volatility" value={`${summary.volatility}%`} />
      <Divider />
      <StatPill label="Win Rate" value={`${summary.winRate}%`} />
      <Divider />
      <StatPill label="Drawdown" value={`${summary.drawdown}%`} color="red" />
    </div>
  )
}

function Divider() {
  return <div className="h-8 w-px bg-white/[0.06] shrink-0 self-center" />
}
