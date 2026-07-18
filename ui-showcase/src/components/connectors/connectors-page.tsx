"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Plus, Check, RefreshCw, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import { ConnectorsSkeleton } from "@/components/connectors/connectors-skeleton"
import {
  connectorCategories,
  connectorItems,
  type ConnectorItem,
  type ConnectorCategory,
} from "@/lib/connectors/data"

/* ================================================================== */
/*  ConnectorCard — single provider card                               */
/* ================================================================== */

function ConnectorCard({ item }: { item: ConnectorItem }) {
  const isConnected = item.status === "connected"
  const isSyncing = item.status === "syncing"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "group relative flex flex-col rounded-xl border p-4 transition-all duration-200",
        "border-white/[0.06] bg-white/[0.03] backdrop-blur-xl",
        "hover:border-white/[0.12] hover:bg-white/[0.05]",
        isConnected && "border-white/[0.08]"
      )}
      style={
        isConnected
          ? { boxShadow: `0 0 24px ${item.accentColor}15, 0 0 48px ${item.accentColor}08` }
          : undefined
      }
    >
      {/* Popular badge */}
      {item.popular && !isConnected && (
        <div className="absolute -right-1.5 -top-1.5 flex items-center gap-1 rounded-full border border-[#818CF8]/20 bg-[#818CF8]/10 px-2 py-0.5">
          <Sparkles className="h-2.5 w-2.5 text-[#818CF8]" />
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[#818CF8]">
            Popular
          </span>
        </div>
      )}

      {/* Top row: icon + category */}
      <div className="mb-3 flex items-start justify-between">
        {/* Icon square */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-[16px] font-bold text-white"
          style={{
            backgroundColor: `${item.accentColor}20`,
            border: `1px solid ${item.accentColor}30`,
          }}
        >
          {item.abbreviation}
        </div>

        {/* Category tag */}
        <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/[0.40]">
          {item.category}
        </span>
      </div>

      {/* Name + description */}
      <div className="mb-4 flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-white mb-1">{item.name}</h3>
        <p className="text-[11px] leading-relaxed text-white/[0.40] line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Connected info / sync status */}
      {(isConnected || isSyncing) && (
        <div className="mb-3 flex items-center gap-2 text-[10px] text-white/[0.35]">
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin text-[#FBBF24]" />
              <span className="text-[#FBBF24]">Syncing…</span>
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-[#34D399]" />
              <span>
                {item.accountCount} account{item.accountCount !== 1 ? "s" : ""} · {item.lastSync}
              </span>
            </>
          )}
        </div>
      )}

      {/* Action button */}
      {isConnected || isSyncing ? (
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all duration-150",
            "border-white/[0.08] bg-white/[0.03] text-white/[0.70]",
            "hover:bg-white/[0.06] hover:text-white hover:border-white/[0.12]",
            "active:scale-[0.98]"
          )}
        >
          Manage
          <ArrowRight className="h-3 w-3" />
        </button>
      ) : (
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all duration-150",
            "border-[#818CF8]/20 bg-[#818CF8]/10 text-[#818CF8]",
            "hover:bg-[#818CF8]/20 hover:border-[#818CF8]/40 hover:shadow-[0_0_16px_rgba(129,140,248,0.25)]",
            "active:scale-[0.98]"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Connect
        </button>
      )}
    </motion.div>
  )
}

/* ================================================================== */
/*  CategoryPill                                                        */
/* ================================================================== */

function CategoryPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-150",
        active
          ? "bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/25"
          : "bg-white/[0.02] text-white/[0.45] border border-white/[0.06] hover:bg-white/[0.04] hover:text-white/[0.65] hover:border-white/[0.10]"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0 text-[9px] tabular-nums",
          active ? "bg-[#818CF8]/20 text-[#818CF8]" : "bg-white/[0.04] text-white/[0.30]"
        )}
      >
        {count}
      </span>
    </button>
  )
}

/* ================================================================== */
/*  ConnectorsPage — Card Grid                                         */
/* ================================================================== */

export function ConnectorsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<ConnectorCategory | "all">("all")

  // Simulate data loading — in production, replace with real fetch + Suspense
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Filter connectors by search + category
  const filtered = React.useMemo(() => {
    let items = connectorItems
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
    }
    return items
  }, [search, activeCategory])

  // Count per category
  const categoryCounts = React.useMemo(() => {
    const counts = { all: connectorItems.length } as Record<ConnectorCategory | "all", number>
    for (const cat of connectorCategories) {
      counts[cat.id] = connectorItems.filter((item) => item.category === cat.id).length
    }
    return counts
  }, [])

  // Split into connected + available
  const connected = filtered.filter((item) => item.status === "connected" || item.status === "syncing")
  const available = filtered.filter((item) => item.status === "disconnected")

  return (
    <PageShell
      title="Connectors"
      subtitle="Link your financial accounts to unlock agent insights"
    >
      {isLoading ? (
        <ConnectorsSkeleton />
      ) : (
        <>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.30]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connectors…"
              aria-label="Search connectors"
              className={cn(
                "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
                "pl-10 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors",
                "placeholder:text-white/[0.25] focus:border-[#818CF8]/30"
              )}
            />
          </div>

          {/* Category pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            <CategoryPill
              label="All"
              active={activeCategory === "all"}
              count={categoryCounts["all"] ?? 0}
              onClick={() => setActiveCategory("all")}
            />
            {connectorCategories.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.label}
                active={activeCategory === cat.id}
                count={categoryCounts[cat.id] ?? 0}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>

          {/* Connected section */}
          {connected.length > 0 && (
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.45]">
                  Connected
                </span>
                <span className="text-[10px] text-white/[0.25]">
                  {connected.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {connected.map((item) => (
                    <ConnectorCard key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Available section */}
          {available.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/[0.25]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.45]">
                  Available
                </span>
                <span className="text-[10px] text-white/[0.25]">
                  {available.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {available.map((item) => (
                    <ConnectorCard key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Search className="h-5 w-5 text-white/[0.30]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/[0.60]">
                  No connectors found
                </p>
                <p className="text-[11px] text-white/[0.35]">
                  Try a different search term or category.
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </PageShell>
  )
}
