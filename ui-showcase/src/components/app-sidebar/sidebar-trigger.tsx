"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Menu, X, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  SidebarTrigger — the top-left pill that opens the slide-over        */
/* ------------------------------------------------------------------ */

interface SidebarTriggerProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function SidebarTrigger({
  isOpen,
  onToggle,
  className,
}: SidebarTriggerProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
      aria-controls="app-sidebar"
      whileTap={{ scale: 0.96 }}
      className={cn(
        "group relative flex h-10 items-center gap-2 rounded-xl border px-2.5",
        "transition-colors duration-200",
        isOpen
          ? "border-white/[0.12] bg-white/[0.06] text-white"
          : "border-white/[0.08] bg-white/[0.03] text-white/[0.65] hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white",
        className
      )}
      style={{
        // Subtle ambient glow when closed — a hint to interact
        boxShadow: isOpen
          ? "0 0 24px rgba(129,140,248,0.15)"
          : undefined,
      }}
    >
      {/* App mark */}
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-200",
          isOpen
            ? "bg-[#818CF8]/20 text-[#818CF8]"
            : "bg-[#818CF8]/10 text-[#818CF8]"
        )}
      >
        <BarChart3 className="h-3.5 w-3.5" />
      </div>

      {/* Menu / close icon */}
      <motion.div
        key={isOpen ? "close" : "menu"}
        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </motion.div>

      {/* Idle pulse hint — only when closed */}
      {!isOpen && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-xl border border-[#818CF8]/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      )}
    </motion.button>
  )
}
