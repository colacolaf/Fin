"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ================================================================== */
/*  SkeletonPulse — base animated pulse bar                            */
/*  Uses CSS animation (off main thread per Emil).                     */
/*  Respects prefers-reduced-motion by disabling animation.            */
/* ================================================================== */

function SkeletonPulse({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-white/[0.06]",
        "motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:opacity-40",
        className
      )}
      style={style}
    />
  )
}

/* ================================================================== */
/*  ConnectorCardSkeleton — mirrors a single ConnectorCard             */
/* ================================================================== */

function ConnectorCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4"
      aria-hidden="true"
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0,
        animation: `skeleton-fade-in 400ms ease-out ${delay}ms forwards`,
      }}
    >
      {/* Top row: icon square + category tag */}
      <div className="mb-3 flex items-start justify-between">
        <SkeletonPulse className="h-12 w-12 rounded-xl" />
        <SkeletonPulse className="h-5 w-16 rounded-full" />
      </div>

      {/* Name */}
      <SkeletonPulse className="mb-1.5 h-4 w-24 rounded" />

      {/* Description — two lines */}
      <div className="mb-4 flex-1 space-y-1.5">
        <SkeletonPulse className="h-3 w-full rounded" />
        <SkeletonPulse className="h-3 w-3/5 rounded" />
      </div>

      {/* Action button */}
      <SkeletonPulse className="h-9 w-full rounded-lg" />
    </div>
  )
}

/* ================================================================== */
/*  ConnectorsSkeleton — full page skeleton matching Card Grid layout   */
/* ================================================================== */

export function ConnectorsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading connectors" role="status">
      {/* Keyframes live in globals.css to avoid duplicate <style> tags on re-render */}

      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded bg-white/[0.06] motion-safe:animate-pulse" />
        <SkeletonPulse className="h-[42px] w-full rounded-xl" />
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
            aria-hidden="true"
          >
            <SkeletonPulse
              className="h-3 rounded"
              style={{ width: i === 0 ? 24 : [40, 52, 48, 36, 36, 40][i - 1] }}
            />
            <SkeletonPulse className="h-3.5 w-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Connected section header */}
      <div className="mb-3 flex items-center gap-2">
        <SkeletonPulse className="h-1.5 w-1.5 rounded-full" />
        <SkeletonPulse className="h-3 w-20 rounded" />
      </div>

      {/* Connected cards — 3 columns */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ConnectorCardSkeleton key={`connected-${i}`} delay={i * 60} />
        ))}
      </div>

      {/* Available section header */}
      <div className="mb-3 flex items-center gap-2">
        <SkeletonPulse className="h-1.5 w-1.5 rounded-full" />
        <SkeletonPulse className="h-3 w-16 rounded" />
      </div>

      {/* Available cards — 3 columns, 2 rows = 6 cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ConnectorCardSkeleton key={`available-${i}`} delay={180 + i * 60} />
        ))}
      </div>

      {/* Screen-reader-only loading text */}
      <span className="sr-only">Loading connectors…</span>
    </div>
  )
}
