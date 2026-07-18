"use client"

import { cn } from "@/lib/utils"
import { Newspaper, ExternalLink, ChevronDown } from "lucide-react"
import { newsArticles, sourceColors } from "@/lib/news/data"
import type { NewsArticle, NewsSource, NewsCategory } from "@/lib/news/types"
import { LiquidGlassBg } from "@/components/debt/liquid-glass-bg"

/* ------------------------------------------------------------------ */
/* Shared primitives                                                  */
/* ------------------------------------------------------------------ */

function SourceBadge({ source, size = "sm" }: { source: NewsSource; size?: "sm" | "xs" }) {
  const color = sourceColors[source]
  const letter = source[0]
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded font-bold uppercase tracking-tight",
        size === "sm" ? "h-[18px] w-[18px] text-[9px]" : "h-[14px] w-[14px] text-[7px]"
      )}
      style={{ backgroundColor: `${color}22`, color }}
      title={source}
    >
      {letter}
    </div>
  )
}

function CategoryTag({ category }: { category: NewsCategory }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider text-white/[0.30] bg-white/[0.04] border border-white/[0.06]">
      {category}
    </span>
  )
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-white/[0.30]">
      <span className="relative flex h-[6px] w-[6px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-60" />
        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#34D399]" />
      </span>
      LIVE
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Layout header                                                      */
/* ------------------------------------------------------------------ */

function LayoutLabel({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white/[0.15]">
          {number}:
        </span>
        <span className="text-sm font-semibold text-white/[0.70]">{title}</span>
      </div>
      <p className="mt-0.5 text-xs text-white/[0.30]">{description}</p>
    </div>
  )
}

/* ================================================================== */
/* VARIANT A — Timestamp Left Column                                  */
/* Time on the far left, headline fills center, source+category right */
/* ================================================================== */

function VariantA({ articles }: { articles: NewsArticle[] }) {
  return (
    <div>
      <LayoutLabel
        number={1}
        title="Timestamp Left"
        description="Time column anchored left. Headline fills the center. Source badge + category tag anchored right. Cleanest hierarchy."
      />
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 max-w-[480px]">
        {/* Card header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-white/[0.30]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.30]">
              Market News
            </span>
          </div>
          <LiveDot />
        </div>

        {/* Article list */}
        <div className="flex flex-col">
          {articles.slice(0, 8).map((article, i) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors duration-100 active:scale-[0.98]",
                "hover:bg-white/[0.04]",
                i > 0 && "border-t border-white/[0.04]"
              )}
            >
              {/* Time */}
              <span className="shrink-0 w-8 text-right text-[10px] font-mono text-white/[0.22] tabular-nums">
                {article.timeAgo}
              </span>

              {/* Source badge */}
              <SourceBadge source={article.source} />

              {/* Headline */}
              <span className="flex-1 text-[12px] text-white/[0.65] leading-snug truncate group-hover:text-white/[0.90] transition-colors duration-150">
                {article.headline}
              </span>

              {/* Category + external link */}
              <div className="flex items-center gap-2 shrink-0">
                <CategoryTag category={article.category} />
                <ExternalLink className="h-3 w-3 text-white/[0.12] group-hover:text-white/[0.30] transition-colors duration-150" />
              </div>
            </a>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
          <ChevronDown className="h-3 w-3 text-white/[0.15]" />
          <span className="text-[9px] text-white/[0.15]">scroll for more</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* VARIANT B — Ultra-Dense Stacked                                    */
/* No time column — time inline after headline. Maximum density.      */
/* ================================================================== */

function VariantB({ articles }: { articles: NewsArticle[] }) {
  return (
    <div>
      <LayoutLabel
        number={2}
        title="Ultra-Dense Stacked"
        description="No dedicated time column. Time inlined after headline. Tighter vertical rhythm. Maximum articles visible."
      />
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 max-w-[480px]">
        {/* Card header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-white/[0.30]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.30]">
              News
            </span>
          </div>
          <LiveDot />
        </div>

        {/* Article list — tighter */}
        <div className="flex flex-col">
          {articles.slice(0, 10).map((article, i) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors duration-100 active:scale-[0.98]",
                "hover:bg-white/[0.04]",
                i > 0 && "border-t border-white/[0.03]"
              )}
            >
              {/* Source badge */}
              <SourceBadge source={article.source} size="xs" />

              {/* Headline + time inline */}
              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <span className="text-[11.5px] text-white/[0.60] leading-snug truncate group-hover:text-white/[0.90] transition-colors duration-150">
                  {article.headline}
                </span>
                <span className="shrink-0 text-[9px] font-mono text-white/[0.18] tabular-nums">
                  {article.timeAgo}
                </span>
              </div>

              {/* Category tag */}
              <CategoryTag category={article.category} />
            </a>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
          <ChevronDown className="h-3 w-3 text-white/[0.15]" />
          <span className="text-[9px] text-white/[0.15]">scroll for more</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* VARIANT C — Source Column + Divider Rows                           */
/* Source initial in a narrow column, thin rule between each row.     */
/* Closest to a real Bloomberg terminal.                              */
/* ================================================================== */

function VariantC({ articles }: { articles: NewsArticle[] }) {
  return (
    <div>
      <LayoutLabel
        number={3}
        title="Source Column + Rules"
        description="Source initial in a narrow column. Thin horizontal rules between every row. Closest to a Bloomberg terminal aesthetic."
      />
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 max-w-[480px]">
        {/* Card header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-white/[0.30]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.30]">
              Market News
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LiveDot />
            <span className="text-[9px] font-mono text-white/[0.15]">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Column header */}
        <div className="flex items-center gap-2.5 px-2 pb-1.5 mb-0.5 border-b border-white/[0.06]">
          <span className="w-[18px]" />
          <span className="flex-1 text-[8px] font-semibold uppercase tracking-widest text-white/[0.18]">
            Headline
          </span>
          <span className="w-10 text-right text-[8px] font-semibold uppercase tracking-widest text-white/[0.18]">
            Time
          </span>
          <span className="w-16 text-right text-[8px] font-semibold uppercase tracking-widest text-white/[0.18]">
            Category
          </span>
        </div>

        {/* Article list — strict rows */}
        <div className="flex flex-col">
          {articles.slice(0, 10).map((article, i) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-2.5 px-2 py-2 transition-colors duration-100 active:scale-[0.98]",
                "hover:bg-white/[0.04]",
                // Thin rule between every row
                i > 0 && "border-t border-white/[0.04]"
              )}
            >
              {/* Source badge */}
              <SourceBadge source={article.source} size="sm" />

              {/* Headline */}
              <span className="flex-1 text-[12px] text-white/[0.60] leading-snug truncate group-hover:text-white/[0.90] transition-colors duration-150">
                {article.headline}
              </span>

              {/* Time */}
              <span className="w-10 text-right text-[10px] font-mono text-white/[0.22] tabular-nums shrink-0">
                {article.timeAgo}
              </span>

              {/* Category */}
              <span className="w-16 text-right shrink-0">
                <CategoryTag category={article.category} />
              </span>
            </a>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
          <ChevronDown className="h-3 w-3 text-white/[0.15]" />
          <span className="text-[9px] text-white/[0.15]">scroll for more</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */

export default function NewsWireframesPage() {
  return (
    <div className="dark min-h-screen w-full">
      <LiquidGlassBg primary="#818CF8" secondary="#67E8F9" />

      {/* Page header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#818CF8]/10">
            <Newspaper className="h-4 w-4 text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-white tracking-tight">
              News Card — Layout Wireframes
            </h1>
            <p className="text-[11px] text-white/[0.38]">
              3 ultra-minimal Bloomberg-style variants · dashboard card only (no fullscreen)
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1100px] px-8 py-10 space-y-16">
        {/* Intro note */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-5 py-4">
          <p className="text-[12px] text-white/[0.45] leading-relaxed">
            All three variants use the same dark liquid glass theme as the portfolio and debt cards.
            Each article is a clickable link that opens the source in a new tab.
            The card is scrollable for the full feed. Choose the one that feels right.
          </p>
        </div>

        {/* Three variants side by side */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <VariantA articles={newsArticles} />
          <VariantB articles={newsArticles} />
          <VariantC articles={newsArticles} />
        </div>
      </div>
    </div>
  )
}
