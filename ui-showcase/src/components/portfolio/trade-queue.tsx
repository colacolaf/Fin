"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
  EyeOff,
  Shield,
  FileText,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PendingTrade } from "@/lib/portfolio/trade-queue-types"
import { useLocalStorage } from "@/lib/use-local-storage"

/* ================================================================== */
/*  TradeQueue                                                         */
/*  List of pending agent recommendations with per-trade confirm/reject */
/* ================================================================== */

export function TradeQueue({
  trades,
  accentColor = "#818CF8",
}: {
  trades: PendingTrade[]
  accentColor?: string
}) {
  const [paperMode, setPaperMode] = useLocalStorage("fo-paper-mode", false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [authKey, setAuthKey] = React.useState("")
  const [showKey, setShowKey] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState<string[]>([])
  const [rejected, setRejected] = React.useState<string[]>([])

  const pending = trades.filter(
    (t) => !confirmed.includes(t.id) && !rejected.includes(t.id)
  )
  const totalTax = pending.reduce((sum, t) => sum + t.estimatedTax, 0)

  const handleConfirm = (id: string) => {
    if (!authKey && !paperMode) return
    setConfirmed((prev) => [...prev, id])
    setExpandedId(null)
  }

  const handleReject = (id: string) => {
    setRejected((prev) => [...prev, id])
    setExpandedId(null)
  }

  const handleConfirmAll = () => {
    if (!authKey && !paperMode) return
    setConfirmed((prev) => [...prev, ...pending.map((t) => t.id)])
    setExpandedId(null)
  }

  const handleRejectAll = () => {
    setRejected((prev) => [...prev, ...pending.map((t) => t.id)])
    setExpandedId(null)
  }

  if (trades.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/[0.38]">
            Pending Recommendations
          </h3>
          <span className="text-[10px] text-white/[0.25]">
            {pending.length} pending
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Paper mode toggle */}
          <button
            type="button"
            onClick={() => setPaperMode((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-all duration-150",
              paperMode
                ? "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]"
                : "border-white/[0.08] bg-white/[0.03] text-white/[0.45] hover:bg-white/[0.06]"
            )}
          >
            <FileText className="h-3 w-3" />
            {paperMode ? "Paper Mode ON" : "Paper Mode"}
          </button>
        </div>
      </div>

      {paperMode && (
        <div className="rounded-lg border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-2">
          <p className="text-[10px] text-[#FBBF24]">
            Paper mode is ON. Trades will be simulated — no real orders will be placed.
          </p>
        </div>
      )}

      {/* Trade list */}
      <div className="space-y-2">
        <AnimatePresence>
          {trades.map((trade, index) => {
            const isConfirmed = confirmed.includes(trade.id)
            const isRejected = rejected.includes(trade.id)
            const isExpanded = expandedId === trade.id

            if (isConfirmed || isRejected) {
              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 1, height: "auto" }}
                  animate={{ opacity: 0, height: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3",
                      isConfirmed
                        ? "border-[#34D399]/20 bg-[#34D399]/5"
                        : "border-white/[0.06] bg-white/[0.02] opacity-50"
                    )}
                  >
                    <Check className={cn("h-4 w-4", isConfirmed ? "text-[#34D399]" : "text-white/[0.20]")} />
                    <span className="text-[12px] text-white/[0.50]">
                      {trade.side === "sell" ? "Sell" : "Buy"} {trade.ticker} — {isConfirmed ? "Confirmed" : "Rejected"}
                    </span>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={trade.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "rounded-lg border transition-all duration-150",
                  isExpanded
                    ? "border-white/[0.12] bg-white/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
                )}
              >
                {/* Collapsed row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Number */}
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] text-white/[0.40]">
                    {index + 1}
                  </span>

                  {/* Side badge */}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                      trade.side === "sell"
                        ? "bg-[#FB7185]/15 text-[#FB7185]"
                        : "bg-[#34D399]/15 text-[#34D399]"
                    )}
                  >
                    {trade.side}
                  </span>

                  {/* Ticker + name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-white">{trade.ticker}</span>
                    <span className="text-[10px] text-white/[0.35] ml-2">{trade.name}</span>
                  </div>

                  {/* Amount */}
                  <span className="text-[12px] font-medium tabular-nums text-white">
                    ${trade.amount.toLocaleString()}
                  </span>

                  {/* Tax pill */}
                  {trade.estimatedTax > 0 ? (
                    <span className="text-[10px] tabular-nums text-[#FB7185]">
                      Tax: ~${trade.estimatedTax}
                    </span>
                  ) : (
                    <span className="text-[10px] tabular-nums text-[#34D399]">
                      Tax: $0
                    </span>
                  )}

                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/[0.30]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/[0.30]" />
                  )}
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.04] px-4 py-4 space-y-4">
                        {/* Reasoning */}
                        <div>
                          <p className="text-[9px] font-medium uppercase tracking-wider text-white/[0.30] mb-1.5">
                            Why
                          </p>
                          <p className="text-[12px] leading-relaxed text-white/[0.55]">
                            {trade.reasoning}
                          </p>
                        </div>

                        {/* Impact grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                            <p className="text-[9px] font-medium uppercase tracking-wider text-white/[0.30] mb-1.5">
                              Impact
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/[0.40]">Risk level</span>
                                <span className="text-[11px] tabular-nums text-white">
                                  {trade.riskBefore}x → {trade.riskAfter}x
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/[0.40]">Fees</span>
                                <span className="text-[11px] tabular-nums text-white">
                                  {trade.fees === 0 ? "$0" : `$${trade.fees}`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/[0.40]">Broker</span>
                                <span className="text-[11px] text-white/[0.60]">{trade.broker}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                            <p className="text-[9px] font-medium uppercase tracking-wider text-white/[0.30] mb-1.5">
                              Tax
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/[0.40]">Type</span>
                                <span className={cn(
                                  "text-[11px]",
                                  trade.taxType === "long_term"
                                    ? "text-[#34D399]"
                                    : trade.taxType === "short_term"
                                      ? "text-[#FB7185]"
                                      : "text-white/[0.50]"
                                )}>
                                  {trade.taxType === "long_term"
                                    ? "Long-term"
                                    : trade.taxType === "short_term"
                                      ? "Short-term"
                                      : "None (purchase)"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/[0.40]">Est. tax</span>
                                <span className={cn(
                                  "text-[11px] font-medium tabular-nums",
                                  trade.estimatedTax > 0 ? "text-[#FB7185]" : "text-[#34D399]"
                                )}>
                                  {trade.estimatedTax > 0 ? `~$${trade.estimatedTax}` : "$0"}
                                </span>
                              </div>
                              {trade.estimatedTax > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/[0.40]">Rate</span>
                                  <span className="text-[11px] text-white/[0.50]">15% LTCG</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Auth key + actions */}
                        {!paperMode && (
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-wider text-white/[0.30] mb-1.5">
                              Authorization Key
                            </p>
                            <div className="relative">
                              <input
                                type={showKey ? "text" : "password"}
                                value={authKey}
                                onChange={(e) => setAuthKey(e.target.value)}
                                placeholder="Enter your authorization key…"
                                className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 pr-10 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKey((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/[0.35] hover:text-white/[0.65]"
                              >
                                {showKey ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleReject(trade.id)}
                            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium text-white/[0.55] transition-all duration-150 hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirm(trade.id)}
                            disabled={!paperMode && !authKey}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md border px-4 py-2 text-[11px] font-medium transition-all duration-150 active:scale-[0.97]",
                              !paperMode && !authKey
                                ? "border-white/[0.06] bg-white/[0.02] text-white/[0.20] cursor-not-allowed"
                                : "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/15"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {paperMode ? "Confirm (Paper)" : "Confirm Trade"}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Batch actions + disclaimer */}
      {pending.length > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleRejectAll}
            className="text-[10px] text-white/[0.35] hover:text-white/[0.55] transition-colors"
          >
            Reject All
          </button>
          <div className="flex items-center gap-3">
            {totalTax > 0 && (
              <span className="text-[10px] text-white/[0.30]">
                Total tax: ~${totalTax}
              </span>
            )}
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={!paperMode && !authKey}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[10px] font-medium transition-all duration-150 active:scale-[0.97]",
                !paperMode && !authKey
                  ? "border-white/[0.06] bg-white/[0.02] text-white/[0.20] cursor-not-allowed"
                  : "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/15"
              )}
            >
              <Shield className="h-3 w-3" />
              Confirm All
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] text-white/[0.20] pt-1">
        This analysis is not financial, tax, or legal advice. Consult a qualified professional before executing any trade.
      </p>
    </div>
  )
}
