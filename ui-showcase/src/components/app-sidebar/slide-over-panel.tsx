"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections, type NavItem, type NavSection } from "@/lib/nav"

/* ------------------------------------------------------------------ */
/*  NavRow — a single navigation item                                  */
/* ------------------------------------------------------------------ */

function NavRow({
  item,
  isActive,
  onNavigate,
  index,
}: {
  item: NavItem
  isActive: boolean
  onNavigate: () => void
  index: number
}) {
  const Icon = item.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1],
        delay: 0.08 + index * 0.04,
      }}
    >
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
          isActive
            ? "bg-white/[0.06] text-white"
            : "text-white/[0.55] hover:bg-white/[0.03] hover:text-white/[0.85]"
        )}
      >
        {/* Icon + accent dot */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
          <Icon className="h-4 w-4" />
          {item.accentColor && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[#08090C]"
              style={{ backgroundColor: item.accentColor }}
            />
          )}
        </div>

        {/* Label + description */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium">
              {item.label}
            </span>
            {item.badge && (
              <span className="rounded-full bg-[#818CF8]/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#818CF8]">
                {item.badge}
              </span>
            )}
          </div>
          {item.description && (
            <span className="truncate text-[10px] text-white/[0.30]">
              {item.description}
            </span>
          )}
        </div>

        {/* Active indicator / hover chevron */}
        {isActive ? (
          <motion.span
            layoutId="sidebar-active"
            className="h-1 w-1 rounded-full bg-[#818CF8]"
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-white/[0.20] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        )}
      </Link>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  NavSectionView — a labeled group of nav rows                       */
/* ------------------------------------------------------------------ */

function NavSectionView({
  section,
  pathname,
  onNavigate,
  startIndex,
}: {
  section: NavSection
  pathname: string
  onNavigate: () => void
  startIndex: number
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 pb-1.5 pt-4">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
          {section.label}
        </span>
      </div>
      {section.items.map((item, i) => (
        <NavRow
          key={item.id}
          item={item}
          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          onNavigate={onNavigate}
          index={startIndex + i}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SlideOverPanel                                                     */
/* ------------------------------------------------------------------ */

interface SlideOverPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SlideOverPanel({ isOpen, onClose }: SlideOverPanelProps) {
  const pathname = usePathname()

  // Compute a flat index across all sections for stagger delays
  const flatIndex = React.useMemo(() => {
    const map = new Map<string, number>()
    let i = 0
    for (const section of navSections) {
      for (const item of section.items) {
        map.set(item.id, i)
        i += 1
      }
    }
    return map
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#08090C]/60 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            id="app-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            className={cn(
              "fixed left-0 top-0 z-50 flex h-full w-[300px] flex-col",
              "border-r border-white/[0.08] bg-black/50 backdrop-blur-2xl"
            )}
          >
            {/* Ambient glow — bleeds through the glass from the top */}
            <div
              className="pointer-events-none absolute -top-[20%] left-0 h-[50%] w-full opacity-[0.10] blur-[80px]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, #818CF8 0%, transparent 70%)",
              }}
            />

            {/* Header — app identity + close */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: 0.04 }}
              className="relative flex items-center justify-between border-b border-white/[0.06] px-4 py-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#818CF8]/15 text-[#818CF8]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="1" y="9" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
                    <rect x="6.5" y="5" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.7" />
                    <rect x="12" y="2" width="3" height="13" rx="0.5" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold tracking-tight text-white">
                    Finance OS
                  </h2>
                  <p className="text-[10px] text-white/[0.35]">
                    Personal finance intelligence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  "text-white/[0.40] transition-colors duration-150",
                  "hover:bg-white/[0.06] hover:text-white active:scale-95"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Nav body — scrollable. Scrollbar styling lives in globals.css under #app-sidebar. */}
            <div className="relative flex-1 overflow-y-auto px-2 py-2">
              {navSections.map((section) => {
                const firstItemIndex = flatIndex.get(section.items[0]?.id ?? "") ?? 0
                return (
                  <NavSectionView
                    key={section.id}
                    section={section}
                    pathname={pathname}
                    onNavigate={onClose}
                    startIndex={firstItemIndex}
                  />
                )
              })}
            </div>

            {/* Footer — keyboard hint */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
              className="relative flex items-center justify-between border-t border-white/[0.06] px-4 py-3"
            >
              <span className="text-[10px] text-white/[0.25]">
                Press
              </span>
              <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-white/[0.50]">
                ⌘B
              </kbd>
              <span className="text-[10px] text-white/[0.25]">
                to toggle
              </span>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
