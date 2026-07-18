"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"

/* ================================================================== */
/*  PageShell — shared layout for Settings / Analytics / Agent Settings */
/* ================================================================== */

interface PageShellProps {
  title: string
  subtitle?: string
  /** Optional back link href + label */
  backHref?: string
  backLabel?: string
  /** Accent color for the background glow + header icon (default: indigo) */
  accentColor?: string
  accentRgb?: string
  /** Optional header icon (e.g. agent icon for agent settings) */
  headerIcon?: React.ReactNode
  /** Optional right-side actions in the header */
  actions?: React.ReactNode
  /** Page content */
  children: React.ReactNode
  /** Max width of the content area */
  maxWidth?: "default" | "wide" | "narrow"
}

export function PageShell({
  title,
  subtitle,
  backHref,
  backLabel,
  accentColor = "#818CF8",
  accentRgb = "129,140,248",
  headerIcon,
  actions,
  children,
  maxWidth = "default",
}: PageShellProps) {
  const maxW =
    maxWidth === "wide"
      ? "max-w-[1200px]"
      : maxWidth === "narrow"
        ? "max-w-[640px]"
        : "max-w-[900px]"

  return (
    <div className="dark relative flex min-h-screen w-full flex-col bg-[#08090C]">
      {/* Liquid glass background tinted to the accent */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#08090C]" />
        <div
          className="absolute -top-[15%] -left-[10%] h-[55%] w-[45%] rounded-full opacity-[0.08] blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[40%] rounded-full opacity-[0.05] blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        {/* Subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,9,12,0.5)_100%)]" />
      </div>

      <AppSidebar triggerPosition="top-left" />

      {/* Header */}
      <header
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-between gap-4",
          "border-b border-white/[0.06] bg-black/20 py-3 pl-20 pr-6 backdrop-blur-xl"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]",
                "text-white/[0.45] transition-all duration-150",
                "hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"
              )}
              aria-label={backLabel ?? "Back"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}

          {headerIcon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: `rgba(${accentRgb}, 0.10)`,
                borderColor: `rgba(${accentRgb}, 0.20)`,
              }}
            >
              {headerIcon}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-[14px] font-semibold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[11px] text-white/[0.38]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className={cn("mx-auto px-6 py-6", maxW)}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SectionCard — a labeled glass card for grouped content              */
/* ------------------------------------------------------------------ */

interface SectionCardProps {
  label?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SectionCard({
  label,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl",
        className
      )}
    >
      {label && (
        <div className="border-b border-white/[0.04] px-5 py-3.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/[0.45]">
            {label}
          </h3>
          {description && (
            <p className="mt-1 text-[11px] text-white/[0.30]">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SettingRow — a labeled control row (label + description + control)  */
/* ------------------------------------------------------------------ */

interface SettingRowProps {
  label: string
  description?: string
  /** The control (switch, slider, input, button) on the right */
  children: React.ReactNode
  /** Accent color for the row's left dot (optional) */
  accentColor?: string
}

export function SettingRow({
  label,
  description,
  children,
  accentColor,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        {accentColor && (
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-white">{label}</div>
          {description && (
            <div className="mt-0.5 text-[11px] leading-relaxed text-white/[0.35]">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}
