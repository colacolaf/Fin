"use client"

import Link from "next/link"
import { Lock, Plug } from "lucide-react"
import { cn } from "@/lib/utils"

interface DebtLockedProps {
  variant?: "card" | "full"
  className?: string
}

export function DebtLocked({ variant = "card", className }: DebtLockedProps) {
  const isFull = variant === "full"

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-center backdrop-blur-xl",
        isFull ? "p-12 min-h-[400px]" : "p-6",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-white/[0.10] bg-white/[0.03]">
        <Lock className={cn("text-white/[0.20]", isFull ? "h-7 w-7" : "h-6 w-6")} />
      </div>
      <div className="space-y-1.5">
        <p className={cn("font-medium text-white/[0.40]", isFull ? "text-[15px]" : "text-[13px]")}>
          No bank accounts connected
        </p>
        <p className={cn("text-white/[0.25] max-w-xs mx-auto", isFull ? "text-[12px]" : "text-[11px]")}>
          Link a bank or credit card account to see your debt breakdown, payoff timeline, and strategy.
        </p>
      </div>
      <Link
        href="/connectors"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-4 py-2 text-[#FBBF24] transition-all duration-150 hover:bg-[#FBBF24]/15 active:scale-[0.97]",
          isFull ? "text-[13px] font-medium" : "text-[11px] font-medium"
        )}
      >
        <Plug className="h-4 w-4" />
        Connect accounts
      </Link>
    </div>
  )
}
