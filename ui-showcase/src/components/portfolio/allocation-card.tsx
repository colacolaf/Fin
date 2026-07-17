"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { SectorProps } from "recharts"

/* Recharts v3 removed activeIndex from Pie types but it still works at runtime */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InteractivePie = Pie as React.ComponentType<any>
import type { AllocationSlice } from "@/lib/portfolio/types"
import { GlassCard } from "./glass-card"

/* ================================================================== */
/*  Tooltip                                                           */
/* ================================================================== */

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationSlice }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-[11px] font-semibold text-white">{d.name}</span>
      </div>
      <p className="text-[13px] font-semibold text-white tabular-nums">
        ${d.dollarValue.toLocaleString()}
      </p>
      <p className="text-[11px] text-white/[0.4] tabular-nums">
        {d.value}% of portfolio
      </p>
    </div>
  )
}

/* ================================================================== */
/*  Active shape renderer — expands slice on hover                    */
/* ================================================================== */

function renderActiveShape(props: SectorProps & { isActive?: boolean }) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, isActive } = props
  const r = (outerRadius ?? 0) + (isActive ? 6 : 0)
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius} outerRadius={r}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} strokeWidth={0}
      />
      {isActive && (
        <Sector
          cx={cx} cy={cy}
          innerRadius={r + 2} outerRadius={r + 4}
          startAngle={startAngle} endAngle={endAngle}
          fill={fill} opacity={0.3} strokeWidth={0}
        />
      )}
    </g>
  )
}

/* ================================================================== */
/*  Allocation Card                                                   */
/*  ─ Interactive pie with hover expand                               */
/*  ─ Center label with total value                                   */
/*  ─ Legend grid synced to hover state                               */
/* ================================================================== */

export function AllocationCard({
  data,
  totalValue,
  size = "default",
}: {
  data: AllocationSlice[]
  totalValue: number
  size?: "default" | "large"
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)
  const innerRadius = size === "large" ? 70 : 60
  const outerRadius = size === "large" ? 100 : 85
  const chartHeight = size === "large" ? 260 : 220
  const centerFontSize = size === "large" ? 18 : 16

  return (
    <GlassCard className="p-5">
      <h3 className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/[0.38] mb-4">
        Allocation
      </h3>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">            <PieChart>
            <InteractivePie
              data={data}
              cx="50%" cy="50%"
              innerRadius={innerRadius} outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </InteractivePie>
            <Tooltip content={<AllocationTooltip />} />
            {/* Center label — renders after pie so it's on top */}
            <text
              x="50%" y="46%"
              textAnchor="middle" dominantBaseline="middle"
              fill="#F7F8FA" fontSize={centerFontSize} fontWeight="600"
            >
              ${totalValue.toLocaleString()}
            </text>
            <text
              x="50%" y="56%"
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.38)" fontSize="10"
            >
              Total
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend grid — synced to pie hover */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2 pt-4 border-t border-white/[0.06]">
        {data.map((asset) => (
          <div
            key={asset.name}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1 -mx-2 transition-colors duration-150 cursor-default",
              activeIndex !== undefined && data[activeIndex]?.name === asset.name
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.03]"
            )}
            onMouseEnter={() => setActiveIndex(data.indexOf(asset))}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: asset.color }}
              />
              <span className="text-[11px] font-medium text-white">
                {asset.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] tabular-nums text-white/[0.7]">
                ${asset.dollarValue.toLocaleString()}
              </span>
              <span className="text-[10px] tabular-nums text-white/[0.35] ml-1.5">
                {asset.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
