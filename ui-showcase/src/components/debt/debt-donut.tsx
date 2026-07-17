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

import type { Debt, DebtTheme } from "@/lib/debt/types"

/* ================================================================== */
/*  Tooltip                                                           */
/* ================================================================== */

function DebtTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean
  payload?: Array<{ payload: Debt & { value: number } }>
  theme: DebtTheme
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-[11px] font-semibold text-white">{d.name}</span>
      </div>
      <p className="text-[13px] font-semibold text-white tabular-nums">
        ${d.balance.toLocaleString()}
      </p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-white/[0.4] tabular-nums">
          {d.apr > 0 ? `${d.apr}% APR` : "0% APR"}
        </span>
        <span className="text-[10px] text-white/[0.4] tabular-nums">
          ${d.minimumPayment}/mo
        </span>
      </div>
      <p className="text-[10px] text-white/[0.35] mt-0.5">
        Est. payoff: {d.estimatedPayoff}
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
/*  DebtDonut                                                         */
/*  — Interactive pie with hover expand                               */
/*  — Center label with total value                                   */
/*  — Legend grid synced to hover state                                */
/* ================================================================== */

export function DebtDonut({
  debts,
  totalDebt,
  theme,
  size = "default",
  showLegend = true,
}: {
  debts: Debt[]
  totalDebt: number
  theme: DebtTheme
  size?: "default" | "large"
  showLegend?: boolean
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)
  const innerRadius = size === "large" ? 70 : 60
  const outerRadius = size === "large" ? 100 : 85
  const chartHeight = size === "large" ? 260 : 220
  const centerFontSize = size === "large" ? 18 : 16

  const pieData = debts.map((d) => ({
    ...d,
    value: d.balance,
  }))

  return (
    <div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <InteractivePie
              data={pieData}
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
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </InteractivePie>
            <Tooltip content={<DebtTooltip theme={theme} />} />
            {/* Center label */}
            <text
              x="50%" y="46%"
              textAnchor="middle" dominantBaseline="middle"
              fill="#F7F8FA" fontSize={centerFontSize} fontWeight="600"
            >
              ${totalDebt.toLocaleString()}
            </text>
            <text
              x="50%" y="56%"
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.38)" fontSize="10"
            >
              total debt
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend grid — synced to pie hover */}
      {showLegend && (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2 pt-4 border-t border-white/[0.06]">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1 -mx-2 transition-colors duration-150 cursor-default",
              activeIndex !== undefined && pieData[activeIndex]?.id === debt.id
                ? "bg-white/[0.05]"
                : "hover:bg-white/[0.03]"
            )}
            onMouseEnter={() => setActiveIndex(pieData.findIndex((d) => d.id === debt.id))}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: debt.color }}
              />
              <span className="text-[11px] font-medium text-white">
                {debt.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] tabular-nums text-white/[0.7]">
                ${debt.balance.toLocaleString()}
              </span>
              <span className="text-[10px] tabular-nums text-white/[0.35] ml-1.5">
                {((debt.balance / totalDebt) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
