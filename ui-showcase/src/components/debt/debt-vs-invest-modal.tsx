"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, TrendingDown, TrendingUp, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Debt } from "@/lib/debt/types"

/* ================================================================== */
/*  DebtVsInvestModal                                                  */
/*  Compares paying off debt vs investing extra cash                   */
/*  Side-by-side cards with projected savings/returns                  */
/* ================================================================== */

interface DebtVsInvestModalProps {
  open: boolean
  onClose: () => void
  debts: Debt[]
  extraCash: number // monthly extra cash available
  expectedReturn: number // annual expected return (e.g. 0.07 for 7%)
  employerMatch: number // annual employer match available
  employerMatchCaptured: number // annual employer match captured
}

export function DebtVsInvestModal({
  open,
  onClose,
  debts,
  extraCash,
  expectedReturn = 0.07,
  employerMatch,
  employerMatchCaptured,
}: DebtVsInvestModalProps) {
  if (!open) return null

  // Find highest APR debt
  const sortedDebts = [...debts].sort((a, b) => b.apr - a.apr)
  const highestDebt = sortedDebts[0]
  const highestApr = highestDebt?.apr ?? 0

  // Calculate projections for paying off debt
  const debtProjections = calculateDebtProjections(debts, extraCash)

  // Calculate projections for investing
  const investProjections = calculateInvestProjections(extraCash, expectedReturn)

  // Winner determination
  const debtWins = highestApr > expectedReturn * 100
  const matchLeft = employerMatch - employerMatchCaptured

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#08090C]/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-4 z-[101] m-auto flex max-h-[620px] max-w-[680px] flex-col rounded-2xl border border-white/[0.08] bg-[#0C0D12]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-white">
                  Debt vs Invest Analysis
                </h2>
                <p className="text-[11px] text-white/[0.38] mt-0.5">
                  Extra cash: ${extraCash.toLocaleString()}/mo · Expected return: {(expectedReturn * 100).toFixed(0)}%/yr
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/[0.40] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Employer match alert */}
              {matchLeft > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-[#34D399]/20 bg-[#34D399]/5 px-4 py-3">
                  <Check className="h-4 w-4 text-[#34D399] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-[#34D399]">
                      Capture employer match first
                    </p>
                    <p className="text-[11px] text-white/[0.40] mt-0.5">
                      You're leaving ${matchLeft.toLocaleString()}/yr on the table. Employer match is a guaranteed 100% return — always prioritize this before extra debt payments or investing.
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-side cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pay Off Debt */}
                <div className={cn(
                  "rounded-xl border p-5 transition-all",
                  debtWins
                    ? "border-[#FB7185]/25 bg-[#FB7185]/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FB7185]/15">
                      <TrendingDown className="h-3.5 w-3.5 text-[#FB7185]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white">Pay Off Debt</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/[0.30]">
                        Avalanche strategy
                      </p>
                    </div>
                    {debtWins && (
                      <span className="ml-auto rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[9px] font-semibold text-[#34D399]">
                        WINNER
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Target</span>
                      <span className="text-[11px] font-medium text-white">{highestDebt?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">APR</span>
                      <span className="text-[11px] font-medium text-[#FB7185]">{highestApr}%</span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3 space-y-2">
                    {[
                      { label: "1 year", value: debtProjections.year1 },
                      { label: "5 years", value: debtProjections.year5 },
                      { label: "10 years", value: debtProjections.year10 },
                    ].map((p) => (
                      <div key={p.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-white/[0.35]">{p.label}</span>
                        <span className="text-[12px] font-medium tabular-nums text-[#34D399]">
                          save ${p.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Debt-free</span>
                      <span className="text-[11px] font-medium text-white">
                        {debtProjections.debtFreeDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Interest saved</span>
                      <span className="text-[11px] font-medium text-[#34D399]">
                        ${debtProjections.totalInterestSaved.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invest */}
                <div className={cn(
                  "rounded-xl border p-5 transition-all",
                  !debtWins
                    ? "border-[#67E8F9]/25 bg-[#67E8F9]/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#67E8F9]/15">
                      <TrendingUp className="h-3.5 w-3.5 text-[#67E8F9]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white">Invest</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/[0.30]">
                        S&P 500 index
                      </p>
                    </div>
                    {!debtWins && (
                      <span className="ml-auto rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[9px] font-semibold text-[#34D399]">
                        WINNER
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Expected return</span>
                      <span className="text-[11px] font-medium text-[#67E8F9]">
                        {(expectedReturn * 100).toFixed(0)}% annual
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Monthly</span>
                      <span className="text-[11px] font-medium text-white">
                        ${extraCash.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3 space-y-2">
                    {[
                      { label: "1 year", value: investProjections.year1 },
                      { label: "5 years", value: investProjections.year5 },
                      { label: "10 years", value: investProjections.year10 },
                    ].map((p) => (
                      <div key={p.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-white/[0.35]">{p.label}</span>
                        <span className="text-[12px] font-medium tabular-nums text-[#34D399]">
                          earn ${p.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Portfolio growth</span>
                      <span className="text-[11px] font-medium text-[#67E8F9]">
                        +${investProjections.year10.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/[0.40]">Total invested</span>
                      <span className="text-[11px] font-medium text-white">
                        ${(extraCash * 12 * 10).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className={cn(
                "rounded-xl border p-5",
                debtWins ? "border-[#FB7185]/20 bg-[#FB7185]/5" : "border-[#67E8F9]/20 bg-[#67E8F9]/5"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    debtWins ? "bg-[#FB7185]/15" : "bg-[#67E8F9]/15"
                  )}>
                    {debtWins ? (
                      <TrendingDown className="h-4 w-4 text-[#FB7185]" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-[#67E8F9]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-1">
                      {debtWins
                        ? `Pay off ${highestDebt?.name} first`
                        : "Invest the extra cash"}
                    </p>
                    <p className="text-[11px] leading-relaxed text-white/[0.50]">
                      {debtWins
                        ? `${highestApr}% APR is higher than the ${(expectedReturn * 100).toFixed(0)}% expected investment return. Kill the ${highestDebt?.name} first, then redirect $${extraCash.toLocaleString()}/mo to investments.`
                        : `Your highest debt APR (${highestApr}%) is lower than the ${(expectedReturn * 100).toFixed(0)}% expected return. Invest the extra cash for better long-term growth while keeping debt payments at minimums.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optimal order */}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/[0.30] mb-2">
                  Optimal Order
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { step: "1", label: "Employer match", color: "#34D399" },
                    { step: "2", label: debtWins ? `Pay ${highestDebt?.name}` : "Min debt payments", color: debtWins ? "#FB7185" : "#67E8F9" },
                    { step: "3", label: debtWins ? "Invest remainder" : "Invest extra", color: "#67E8F9" },
                  ].map((s, i) => (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                          style={{ backgroundColor: `${s.color}20`, color: s.color }}
                        >
                          {s.step}
                        </span>
                        <span className="text-[10px] font-medium text-white/[0.70]">{s.label}</span>
                      </div>
                      {i < 2 && <ArrowRight className="h-3 w-3 text-white/[0.20]" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[9px] text-white/[0.20]">
                This analysis is not financial, tax, or legal advice. Consult a qualified professional before making any financial decisions.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ================================================================== */
/*  Projection helpers                                                 */
/* ================================================================== */

function calculateDebtProjections(debts: Debt[], extraCash: number) {
  const highestDebt = [...debts].sort((a, b) => b.apr - a.apr)[0]
  if (!highestDebt) return { year1: 0, year5: 0, year10: 0, debtFreeDate: "N/A", totalInterestSaved: 0 }

  const monthlyApr = highestDebt.apr / 100 / 12
  const balance = highestDebt.balance
  const minPayment = highestDebt.minimumPayment
  const totalPayment = minPayment + extraCash

  // Time to payoff with extra payments
  const monthsToPayoff = calculatePayoffMonths(balance, monthlyApr, totalPayment)
  const debtFreeDate = formatDebtFreeDate(monthsToPayoff)

  // Calculate actual interest over each horizon with and without extra payments
  const horizons = [12, 60, 120] // months
  const [year1, year5, year10] = horizons.map((months) => {
    const interestWithout = calculateInterestOverMonths(balance, monthlyApr, minPayment, months)
    const interestWithExtra = calculateInterestOverMonths(balance, monthlyApr, totalPayment, months)
    return Math.round(interestWithout - interestWithExtra)
  })

  const interestWithout = calculateInterest(balance, monthlyApr, minPayment)
  const interestWith = calculateInterest(balance, monthlyApr, totalPayment)
  const totalInterestSaved = Math.round(interestWithout - interestWith)

  return {
    year1,
    year5,
    year10,
    debtFreeDate,
    totalInterestSaved,
  }
}

function calculateInvestProjections(extraCash: number, annualReturn: number) {
  const monthlyReturn = annualReturn / 12

  const year1 = futureValue(extraCash, monthlyReturn, 12)
  const year5 = futureValue(extraCash, monthlyReturn, 60)
  const year10 = futureValue(extraCash, monthlyReturn, 120)

  return {
    year1: Math.round(year1 - extraCash * 12),
    year5: Math.round(year5 - extraCash * 60),
    year10: Math.round(year10 - extraCash * 120),
  }
}

function futureValue(monthly: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return monthly * months
  return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
}

/** Calculate total interest paid over a specific number of months */
function calculateInterestOverMonths(balance: number, monthlyApr: number, payment: number, maxMonths: number): number {
  let totalInterest = 0
  let remaining = balance

  for (let i = 0; i < maxMonths && remaining > 0; i++) {
    const interest = remaining * monthlyApr
    totalInterest += interest
    remaining = Math.max(0, remaining + interest - payment)
  }

  return totalInterest
}

function calculateInterest(balance: number, monthlyApr: number, payment: number): number {
  let totalInterest = 0
  let remaining = balance
  let months = 0

  while (remaining > 0 && months < 360) {
    const interest = remaining * monthlyApr
    totalInterest += interest
    remaining = remaining + interest - payment
    months++
  }

  return totalInterest
}

function calculatePayoffMonths(balance: number, monthlyApr: number, payment: number): number {
  let remaining = balance
  let months = 0

  while (remaining > 0 && months < 360) {
    remaining = remaining + remaining * monthlyApr - payment
    months++
  }

  return months
}

function formatDebtFreeDate(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}
