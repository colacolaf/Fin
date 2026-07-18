"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Newspaper, ExternalLink, ChevronDown } from "lucide-react"
import { sourceColors, categoryColors } from "@/lib/news/data"
import { useNewsPolling } from "@/lib/news/hooks"
import type { NewsArticle, NewsSource, NewsCategory } from "@/lib/news/types"

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SourceBadge({ source }: { source: NewsSource }) {
  const color = sourceColors[source]
  return (
    <div
      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[9px] font-bold uppercase tracking-tight"
      style={{ backgroundColor: `${color}35`, color }}
      title={source}
    >
      {source[0]}
    </div>
  )
}

function CategoryTag({ category }: { category: NewsCategory }) {
  const colors = categoryColors[category]
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-px text-[8px] font-semibold uppercase tracking-wider shrink-0"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="h-[4px] w-[4px] rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {category}
    </span>
  )
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-white/[0.55]">
      <span className="relative flex h-[6px] w-[6px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-60" />
        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#34D399]" />
      </span>
      LIVE
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Article row — click to expand full headline                        */
/* ------------------------------------------------------------------ */

function ArticleRow({
  article,
  isExpanded,
  onToggle,
}: {
  article: NewsArticle
  isExpanded: boolean
  onToggle: () => void
}) {
  const colors = categoryColors[article.category]

  return (
    <div
      className={cn(          "group rounded-md transition-all duration-150 ease-out",
        isExpanded
          ? "bg-white/[0.08] ring-1 ring-white/[0.12]"
          : "hover:bg-white/[0.06]"
      )}
    >
      {/* Clickable row */}
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-transform duration-100",
          "active:scale-[0.98]"
        )}
      >
        {/* Source badge */}
        <SourceBadge source={article.source} />

        {/* Headline */}
        <span
          className={cn(
            "flex-1 text-[11.5px] leading-snug transition-colors duration-100",
            isExpanded
              ? "text-white line-clamp-3"
              : "text-white/[0.72] truncate group-hover:text-white/95"
          )}
        >
          {article.headline}
        </span>

        {/* Time + category (hidden when expanded to save space) */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-mono text-white/[0.40] tabular-nums">
              {article.timeAgo}
            </span>
            <span
              className="h-[4px] w-[4px] rounded-full shrink-0"
              style={{ backgroundColor: colors.dot }}
            />
          </div>
        )}
      </button>

      {/* Expanded detail — full headline + source + read link */}
      {isExpanded && (
        <div className="flex items-center justify-between px-2.5 pb-2 pt-0">
          <div className="flex items-center gap-2">
            <CategoryTag category={article.category} />
            <span className="text-[10px] font-mono text-white/[0.40] tabular-nums">
              {article.timeAgo} ago · {article.source}
            </span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium text-[#818CF8] hover:text-[#A5B4FC] transition-colors duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            Read
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main NewsCard component                                            */
/* ------------------------------------------------------------------ */

export function NewsCard() {
  const { articles, hasNew } = useNewsPolling(30_000)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id))
    },
    []
  )

  return (
    <div className="flex flex-col">
      {/* Card header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-white/[0.50]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.50]">
            Market News
          </span>
          {hasNew && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#818CF8] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#818CF8]" />
            </span>
          )}
        </div>
        <LiveDot />
      </div>

      {/* Scrollable article list */}
      <div className="news-scroll flex flex-col gap-0.5 overflow-y-auto max-h-[260px] pr-1">
        {articles.slice(0, 10).map((article, i) => (
          <div key={article.id}>
            {/* Thin divider between rows */}
            {i > 0 && (
              <div className="mx-2.5 h-px bg-white/[0.08]" />
            )}
            <ArticleRow
              article={article}
              isExpanded={expandedId === article.id}
              onToggle={() => toggleExpand(article.id)}
            />
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-white/[0.08]">
        <ChevronDown className="h-3 w-3 text-white/[0.25]" />
        <span className="text-[8px] text-white/[0.25] uppercase tracking-wider">
          scroll
        </span>
      </div>
    </div>
  )
}
