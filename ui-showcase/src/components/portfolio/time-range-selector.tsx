"use client"

import { cn } from "@/lib/utils"

const ranges = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"]

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
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
