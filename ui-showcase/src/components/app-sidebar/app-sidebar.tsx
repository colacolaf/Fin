"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/use-sidebar"
import { SidebarTrigger } from "./sidebar-trigger"
import { SlideOverPanel } from "./slide-over-panel"

/* ================================================================== */
/*  AppSidebar — composed slide-over navigation                         */
/*  Hidden by default. Trigger pill is fixed top-left.                 */
/*  Panel slides in from the left with a dimmed scrim.                 */
/* ================================================================== */

interface AppSidebarProps {
  /** Override the default open state (uncontrolled by default) */
  defaultOpen?: boolean
  /** Position the trigger. Default: top-left fixed. */
  triggerPosition?: "top-left" | "top-right"
  /** Extra className for the trigger wrapper */
  className?: string
}

export function AppSidebar({
  defaultOpen = false,
  triggerPosition = "top-left",
  className,
}: AppSidebarProps = {}) {
  const { isOpen, toggle, close } = useSidebar({ defaultOpen })

  return (
    <>
      {/* Trigger — fixed position so it's always accessible. Hidden when open to avoid overlapping the panel. */}
      <div
        className={cn(
          "transition-opacity duration-200",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
          triggerPosition === "top-left"
            ? "fixed left-4 top-4 z-[60]"
            : "fixed right-4 top-4 z-[60]"
        )}
      >
        <SidebarTrigger isOpen={isOpen} onToggle={toggle} className={className} />
      </div>

      {/* Slide-over panel + scrim */}
      <SlideOverPanel isOpen={isOpen} onClose={close} />
    </>
  )
}
