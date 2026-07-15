"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type BrowserVariant = "chrome" | "safari" | "generic"
type HeaderStyle = "minimal" | "full"
type WindowSize = "sm" | "md" | "lg" | "xl"
type SidebarPosition = "left" | "right" | "top" | "bottom"
type Theme = "light" | "dark" | "auto"

interface SidebarItem {
  icon?: React.ReactNode
  label: string
  active?: boolean
  badge?: string | number
}

interface BrowserWindowProps {
  children?: React.ReactNode
  className?: string
  size?: WindowSize
  showSidebar?: boolean
  sidebarPosition?: SidebarPosition
  headerStyle?: HeaderStyle
  variant?: BrowserVariant
  theme?: Theme
  url?: string
  sidebarItems?: SidebarItem[]
}

// ------------------------------------------------------------------
// Size maps
// ------------------------------------------------------------------
const sizeClasses: Record<WindowSize, string> = {
  sm: "w-full max-w-md h-64",
  md: "w-full max-w-2xl h-80",
  lg: "w-full max-w-4xl h-96",
  xl: "w-full max-w-6xl h-[28rem]",
}

const headerHeight = "h-10"

// ------------------------------------------------------------------
// BrowserWindow
// ------------------------------------------------------------------
function BrowserWindow({
  children,
  className,
  size = "md",
  showSidebar = false,
  sidebarPosition = "left",
  headerStyle = "minimal",
  variant = "generic",
  theme = "auto",
  url,
  sidebarItems = [],
}: BrowserWindowProps) {
  const isDark =
    theme === "dark" || (theme === "auto" && typeof window !== "undefined")
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false

  const isVertical = sidebarPosition === "left" || sidebarPosition === "right"

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-background shadow-xl",
        isDark ? "dark" : "",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b bg-muted/50 px-3",
          headerHeight,
          variant === "safari" && "justify-between",
          variant === "chrome" && "gap-3",
          variant === "generic" && "gap-2"
        )}
      >
        {/* Window controls */}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>

        {/* Address bar */}
        {headerStyle === "full" && (
          <div className="flex flex-1 justify-center">
            <div className="flex h-7 w-full max-w-md items-center rounded-md bg-background px-3 text-xs text-muted-foreground ring-1 ring-border">
              {url || "https://app.example.com"}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={cn(
          "flex bg-background",
          sizeClasses[size],
          !isVertical && "flex-col"
        )}
      >
        {/* Sidebar */}
        {showSidebar && (
          <aside
            className={cn(
              "flex shrink-0 flex-col gap-1 border-border bg-muted/30 p-3",
              isVertical
                ? "h-full w-48 border-r"
                : "w-full flex-row border-b"
            )}
          >
            {sidebarItems.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-border">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </aside>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export { BrowserWindow }
export type { SidebarItem }
