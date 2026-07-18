"use client"

import * as React from "react"
import Link from "next/link"
import { Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/portfolio/glass-card"
import { retirementSummary } from "@/lib/retirement/data"

/* ================================================================== */
/*  RetirementWidget — Status Bar style                                */
/*  Horizontal layout: big readiness %, progress bar, inline stats     */
/* ================================================================== */

export function RetirementWidget() {
  const s = retirementSummary
  const matchPercent = Math.round((s.employerMatchCaptured / s.employerMatchAvailable) * 100)
  const matchLeaving = s.employerMatchAvailable - s.employerMatchCaptured

  return (
    <GlassCard className="p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#67E8F9]/15">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-[#67E8F9]"
            >
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z" />
              <path d="M2 9v1c0 1.1.9 2 2 2h1" />
              <path d="M16.5 13.5c.8-.8 2.5-1 3-1" />
            </svg>
          </div>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
            Retirement
          </h3>
        </div>
        <Link href="/retirement/full">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium",
              "border-[#67E8F9]/20 bg-[#67E8F9]/10 text-[#67E8F9]",
              "transition-all duration-150 active:scale-[0.97] hover:bg-[#67E8F9]/15"
            )}
          >
            <Maximize2 className="h-3 w-3" />
            Full View
          </button>
        </Link>
      </div>

      {/* Big readiness number + bar */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[28px] font-semibold tracking-tight text-white tabular-nums">
          {s.fundedPercentage}%
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#67E8F9]">
          Ready
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-white/[0.04] mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#67E8F9]/70 to-[#34D399]/50 transition-all duration-700"
          style={{ width: `${s.fundedPercentage}%` }}
        />
      </div>

      {/* Inline stats */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3">
        <div className="flex flex-col">
          <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">
            Projected
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            ${s.projectedAnnualIncome.toLocaleString()}/yr
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">
            Years Left
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            {s.yearsToRetirement}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">
            Gap
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-[#FBBF24]">
            ${s.monthlyGap}/mo
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/[0.30]">
            Saved
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            ${s.totalSaved.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Employer match bar */}
      <div className="flex items-center justify-between rounded-lg border border-[#67E8F9]/10 bg-[#67E8F9]/5 px-3 py-1.5">
        <div className="flex-1 mr-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-white/[0.40]">Employer Match</span>
            <span className="text-[9px] tabular-nums text-white/[0.50]">
              ${s.employerMatchCaptured.toLocaleString()} / ${s.employerMatchAvailable.toLocaleString()}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#67E8F9]/60"
              style={{ width: `${matchPercent}%` }}
            />
          </div>
        </div>
        {matchLeaving > 0 && (
          <span className="text-[9px] font-medium text-[#FBBF24] shrink-0">
            ${matchLeaving} left
          </span>
        )}
        {matchLeaving === 0 && (
          <span className="text-[9px] font-medium text-[#34D399] shrink-0">
            Full ✓
          </span>
        )}
      </div>
    </GlassCard>
  )
}
