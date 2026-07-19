"use client"

import * as React from "react"
import {
  Search,
  Sparkles,
  Star,
  Download,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Layers,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import { availableSkills, type AgentSkill } from "@/lib/agents"

/* ================================================================== */
/*  Skill categories — mirrors Skills_Registry.md                      */
/* ================================================================== */

type SkillCategory = "universal" | "portfolio" | "debt" | "retirement"

interface CategoryDef {
  id: SkillCategory
  label: string
  icon: LucideIcon
  color: string
  colorRgb: string
}

const categories: CategoryDef[] = [
  { id: "universal", label: "Universal", icon: Layers, color: "#818CF8", colorRgb: "129,140,248" },
  { id: "portfolio", label: "Portfolio", icon: TrendingUp, color: "#67E8F9", colorRgb: "103,232,249" },
  { id: "debt", label: "Debt", icon: TrendingDown, color: "#FBBF24", colorRgb: "251,191,36" },
  { id: "retirement", label: "Retirement", icon: PiggyBank, color: "#34D399", colorRgb: "52,211,153" },
]

/* ------------------------------------------------------------------ */
/*  Skill-to-category mapping                                          */
/* ------------------------------------------------------------------ */

const skillCategoryMap: Record<string, SkillCategory> = {
  fetch_user_context: "universal",
  search_web: "universal",
  log_decision: "universal",
  send_desktop_notification: "universal",
  portfolio_analyze: "portfolio",
  rebalance_recommend: "portfolio",
  value_private_asset: "portfolio",
  execute_trade: "portfolio",
  enable_paper_trading: "portfolio",
  debt_payoff_simulate: "debt",
  debt_vs_invest_analyze: "debt",
  retirement_readiness_score: "retirement",
  match_capture_recommend: "retirement",
}

/* ================================================================== */
/*  GitHub Marketplace — community skills from external repos          */
/* ================================================================== */

interface MarketplaceSkill {
  id: string
  label: string
  description: string
  category: string
  /** GitHub-style repo path: "owner/repo" */
  repo: string
  author: string
  stars: number
}

const marketplaceSkills: MarketplaceSkill[] = [
  {
    id: "tax_loss_harvest",
    label: "Tax Loss Harvester",
    description: "Automatically identify tax-loss harvesting opportunities across all taxable accounts.",
    category: "Portfolio",
    repo: "finos/tax-loss-harvester",
    author: "finos",
    stars: 342,
  },
  {
    id: "esg_screener",
    label: "ESG Screener",
    description: "Filter holdings by environmental, social, and governance scores with Morningstar data.",
    category: "Portfolio",
    repo: "sustainable-finance/esg-screener",
    author: "sustainable-finance",
    stars: 187,
  },
  {
    id: "crypto_tracker",
    label: "Crypto Tracker",
    description: "Real-time P&L across wallets and exchanges with tax-lot tracking.",
    category: "Portfolio",
    repo: "defi-tools/crypto-tracker",
    author: "defi-tools",
    stars: 256,
  },
  {
    id: "bill_negotiator",
    label: "Bill Negotiator",
    description: "Scan recurring bills and generate AI-powered renegotiation scripts.",
    category: "Debt",
    repo: "frugal-ai/bill-negotiator",
    author: "frugal-ai",
    stars: 128,
  },
  {
    id: "credit_score_monitor",
    label: "Credit Score Monitor",
    description: "Track your score and simulate the impact of financial moves before you make them.",
    category: "Debt",
    repo: "credit-tools/score-monitor",
    author: "credit-tools",
    stars: 203,
  },
  {
    id: "roth_ladder_planner",
    label: "Roth Ladder Planner",
    description: "Model Roth conversion ladders for early retirement with tax-bracket optimization.",
    category: "Retirement",
    repo: "fire-community/roth-ladder",
    author: "fire-community",
    stars: 415,
  },
  {
    id: "ss_optimizer",
    label: "Social Security Optimizer",
    description: "Find the optimal claiming age for maximum lifetime benefits.",
    category: "Retirement",
    repo: "retirekit/ss-optimizer",
    author: "retirekit",
    stars: 178,
  },
  {
    id: "estate_planner",
    label: "Estate Planner",
    description: "Basic estate planning checklist, document reminders, and beneficiary audits.",
    category: "Universal",
    repo: "legacy-tools/estate-planner",
    author: "legacy-tools",
    stars: 94,
  },
]

/* ================================================================== */
/*  SkillCard — glass card for a loaded skill                          */
/* ================================================================== */

function SkillCard({ skill, category }: { skill: AgentSkill; category: CategoryDef }) {
  return (
    <div className="group relative rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.05]">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `rgba(${category.colorRgb}, 0.12)`,
            border: `1px solid rgba(${category.colorRgb}, 0.20)`,
          }}
        >
          <category.icon className="h-4 w-4" style={{ color: category.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-white">{skill.label}</h4>
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `rgba(${category.colorRgb}, 0.10)`,
                color: category.color,
              }}
            >
              {category.label}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/[0.42]">{skill.description}</p>
        </div>
        <div className="shrink-0 self-center rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <code className="text-[10px] text-white/[0.35]">/{skill.id}</code>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  MarketplaceSkillCard — GitHub-style community skill card           */
/* ================================================================== */

function MarketplaceSkillCard({ skill }: { skill: MarketplaceSkill }) {
  const kFormatter = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.04]">
      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FBBF24]/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Repo header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white/[0.50]">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-white/[0.35]">{skill.author}/</span>
            <span className="text-[13px] font-semibold text-white truncate">{skill.label.toLowerCase().replace(/\s+/g, "-")}</span>
          </div>
          <p className="text-[10px] text-white/[0.28] mt-0.5">{skill.repo}</p>
        </div>
        {/* Stars */}
        <div className="flex shrink-0 items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1">
          <Star className="h-3 w-3 text-[#FBBF24]/70" />
          <span className="text-[10px] font-medium tabular-nums text-white/[0.50]">{kFormatter(skill.stars)}</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-[11px] leading-relaxed text-white/[0.40]">{skill.description}</p>

      {/* Bottom row: category + install */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium text-white/[0.35]">
          {skill.category}
        </span>
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 rounded-md border border-[#FBBF24]/15 bg-[#FBBF24]/[0.05] px-2.5 py-1 text-[10px] font-medium text-[#FBBF24]/60 opacity-60 cursor-not-allowed transition-colors"
        >
          <Download className="h-3 w-3" />
          Coming soon
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SkillsPage — Two-Panel Split                                       */
/*  Left: sticky filter sidebar. Right: skills + GitHub marketplace.   */
/* ================================================================== */

export function SkillsPage() {
  const [activeCat, setActiveCat] = React.useState<SkillCategory | "all">("all")
  const [search, setSearch] = React.useState("")

  const filteredSkills = React.useMemo(() => {
    let skills = availableSkills
    if (activeCat !== "all") {
      skills = skills.filter((s) => (skillCategoryMap[s.id] ?? "universal") === activeCat)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      skills = skills.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      )
    }
    return skills
  }, [activeCat, search])

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: availableSkills.length }
    categories.forEach((cat) => {
      c[cat.id] = availableSkills.filter(
        (s) => (skillCategoryMap[s.id] ?? "universal") === cat.id
      ).length
    })
    return c
  }, [])

  return (
    <PageShell
      title="Skills"
      subtitle="Manage loaded skills and browse the GitHub marketplace"
      accentColor="#818CF8"
      accentRgb="129,140,248"
      maxWidth="wide"
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ================================================================ */}
        {/*  Left sidebar                                                      */}
        {/* ================================================================ */}
        <div className="w-full shrink-0 lg:w-[240px]">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/[0.30]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills…"
                aria-label="Search skills"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-[12px] text-white outline-none backdrop-blur-xl transition-colors placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
              />
            </div>

            {/* Filter pills */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveCat("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-150",
                  activeCat === "all"
                    ? "bg-white/[0.06] text-white"
                    : "text-white/[0.45] hover:bg-white/[0.03] hover:text-white/[0.70]"
                )}
              >
                <span>All Skills</span>
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/[0.40]">
                  {counts.all}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCat(cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-150",
                    activeCat === cat.id
                      ? "bg-white/[0.06] text-white"
                      : "text-white/[0.45] hover:bg-white/[0.03] hover:text-white/[0.70]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    {cat.label}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/[0.40]">
                    {counts[cat.id]}
                  </span>
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.35]">
                Stats
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/[0.45]">Loaded</span>
                  <span className="text-[11px] font-mono font-medium text-[#34D399] tabular-nums">
                    {counts.all}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/[0.45]">Active</span>
                  <span className="text-[11px] font-mono font-medium text-[#818CF8] tabular-nums">
                    {counts.all}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/[0.45]">Available</span>
                  <span className="text-[11px] font-mono font-medium text-[#FBBF24] tabular-nums">
                    {marketplaceSkills.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  Right content                                                    */}
        {/* ================================================================ */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Your Skills */}
          <div className="space-y-2">
            {filteredSkills.map((skill) => {
              const catId = skillCategoryMap[skill.id] ?? "universal"
              const cat = categories.find((c) => c.id === catId)!
              return <SkillCard key={skill.id} skill={skill} category={cat} />
            })}
            {filteredSkills.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-white/[0.15]" />
                <p className="mt-3 text-[13px] text-white/[0.35]">
                  No skills match &quot;{search}&quot;
                </p>
              </div>
            )}
          </div>

          {/* ── Skills Marketplace ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FBBF24]/20 bg-[#FBBF24]/10">
                  <Sparkles className="h-3.5 w-3.5 text-[#FBBF24]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-white">Skills Marketplace</h3>
                  <p className="text-[10px] text-white/[0.35]">
                    Community skills from GitHub — install with one click
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {marketplaceSkills.map((skill) => (
                <MarketplaceSkillCard key={skill.id} skill={skill} />
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] py-3">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white/[0.25]">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <p className="text-[11px] text-white/[0.28]">
                Skills are sourced from open-source GitHub repositories. More coming soon.
              </p>
              <ExternalLink className="h-3 w-3 text-white/[0.20]" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
