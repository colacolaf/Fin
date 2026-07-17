"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import type { Debt, DebtTheme } from "@/lib/debt/types"

export function DebtRow({
  debt,
  totalDebt,
  theme,
}: {
  debt: Debt
  totalDebt: number
  theme: DebtTheme
}) {
  const pctPaid = ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100
  const weight = ((debt.balance / totalDebt) * 100).toFixed(0)
  const isUrgent = debt.apr >= 15

  return (
    <div className="group flex items-center gap-3 rounded-lg py-2.5 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
      {/* Color indicator + Name */}
      <div className="flex items-center gap-2.5 min-w-[130px]">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: debt.color }}
        />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-medium text-white">{debt.name}</p>
            {isUrgent && (
              <AlertTriangle className="h-3 w-3 text-[#FB7185]" />
            )}
          </div>
          <p className="text-[10px] text-white/[0.38]">{weight}% of total</p>
        </div>
      </div>

      {/* Balance */}
      <div className="text-right min-w-[72px]">
        <p className="text-[12px] font-medium tabular-nums text-white">
          ${debt.balance.toLocaleString()}
        </p>
      </div>

      {/* APR */}
      <div className="text-right min-w-[52px]">
        <p
          className={cn(
            "text-[12px] tabular-nums",
            isUrgent
              ? "text-[#FB7171] font-medium"
              : debt.apr === 0
                ? "text-[#34D399]"
                : "text-white/[0.5]"
          )}
        >
          {debt.apr}%
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pctPaid}%`,
              backgroundColor: debt.color,
              opacity: 0.8,
            }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-white/[0.35] w-8 text-right">
          {pctPaid.toFixed(0)}%
        </span>
      </div>

      {/* Minimum payment */}
      <div className="text-right min-w-[56px]">
        <p className="text-[12px] tabular-nums text-white/[0.5]">
          ${debt.minimumPayment}
        </p>
        <p className="text-[9px] text-white/[0.25]">/mo</p>
      </div>

      {/* Estimated payoff */}
      <div className="text-right min-w-[64px]">
        <p className="text-[11px] text-white/[0.5]">{debt.estimatedPayoff}</p>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Compact variant for dashboard cards                               */
/* ================================================================== */

export function DebtRowCompact({
  debt,
}: {
  debt: Debt
}) {
  const pctPaid = ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100
  const isUrgent = debt.apr >= 15

  return (
    <div className="group flex items-center gap-3 rounded-lg py-2 px-2 transition-colors duration-150 hover:bg-white/[0.02]">
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: debt.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-white">{debt.name}</span>
          <span className="text-[12px] tabular-nums text-white">${debt.balance.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full bg-white/[0.04]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pctPaid}%`,
                backgroundColor: debt.color,
                opacity: 0.7,
              }}
            />
          </div>
          <span
            className={cn(
              "text-[10px] tabular-nums",
              isUrgent ? "text-[#FB7171]" : "text-white/[0.38]"
            )}
          >
            {debt.apr}% APR
          </span>
        </div>
      </div>
    </div>
  )
}
