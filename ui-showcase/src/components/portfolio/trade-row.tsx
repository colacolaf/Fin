import { cn } from "@/lib/utils"
import type { Trade } from "@/lib/portfolio/types"

export function TradeRow({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0",
          trade.type === "BUY"
            ? "bg-[#34D399]/10 text-[#34D399]"
            : "bg-[#F87171]/10 text-[#F87171]"
        )}
      >
        {trade.type}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-white">
            {trade.ticker}
          </span>
          <span className="text-[13px] tabular-nums text-white">
            ${(trade.price * trade.shares).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-0.5">
          <span className="text-[10px] text-white/[0.38]">
            {trade.shares} shares @ ${trade.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-white/[0.25]">
            {trade.date}
          </span>
        </div>
      </div>
    </div>
  )
}
