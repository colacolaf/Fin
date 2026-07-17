import { cn } from "@/lib/utils"

interface TooltipPayloadItem {
  value: number
  payload?: { daily?: number }
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
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
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                isPositive ? "text-[#34D399]" : "text-[#F87171]"
              )}
            >
              {isPositive ? "+" : ""}
              {dailyReturn}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
