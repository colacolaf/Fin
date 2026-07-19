"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  Sparkles,
  Lock,
  Zap,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Layers,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell, SectionCard } from "@/components/page-shell/page-shell"
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

/* ------------------------------------------------------------------ */
/*  Marketplace teaser skills                                          */
/* ------------------------------------------------------------------ */

const marketplaceSkills = [
  { id: "tax_loss_harvest", label: "Tax Loss Harvester", description: "Automatically identify tax-loss harvesting opportunities.", category: "Portfolio" },
  { id: "esg_screener", label: "ESG Screener", description: "Filter holdings by environmental, social, and governance scores.", category: "Portfolio" },
  { id: "crypto_tracker", label: "Crypto Tracker", description: "Real-time P&L across wallets and exchanges.", category: "Portfolio" },
  { id: "bill_negotiator", label: "Bill Negotiator", description: "Scan recurring bills and suggest renegotiation scripts.", category: "Debt" },
  { id: "credit_score_monitor", label: "Credit Score Monitor", description: "Track your score and simulate the impact of financial moves.", category: "Debt" },
  { id: "roth_ladder_planner", label: "Roth Ladder Planner", description: "Model Roth conversion ladders for early retirement.", category: "Retirement" },
  { id: "ss_optimizer", label: "Social Security Optimizer", description: "Find the optimal claiming age for maximum lifetime benefits.", category: "Retirement" },
  { id: "estate_planner", label: "Estate Planner", description: "Basic estate planning checklist and document reminders.", category: "Universal" },
]

/* ================================================================== */
/*  SkillCard — compact glass card for a single skill                  */
/* ================================================================== */

function SkillCard({ skill, category, size }: { skill: AgentSkill; category: CategoryDef; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.05]",
        size === "sm" ? "p-3.5" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Category icon pill */}
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
          <p className={cn("text-white/[0.42] leading-relaxed", size === "sm" ? "mt-1 text-[11px]" : "mt-1.5 text-[12px]")}>
            {skill.description}
          </p>
        </div>
        {/* Trigger hint */}
        <div className="shrink-0 self-center rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <code className="text-[10px] text-white/[0.35]">/{skill.id}</code>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Marketplace teaser card                                            */
/* ------------------------------------------------------------------ */

function MarketplaceCard({ skill }: { skill: (typeof marketplaceSkills)[number] }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02]">
            <Lock className="h-3.5 w-3.5 text-white/[0.25]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-medium text-white/[0.60]">{skill.label}</h4>
              <span className="shrink-0 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                Soon
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/[0.30] leading-relaxed">{skill.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Template A — Marketplace Grid                                      */
/*  Your Skills (compact grid by category) + Coming Soon marketplace   */
/* ================================================================== */

function TemplateA() {
  const skillsByCategory = React.useMemo(() => {
    const map: Record<SkillCategory, AgentSkill[]> = { universal: [], portfolio: [], debt: [], retirement: [] }
    availableSkills.forEach((s) => {
      const cat = skillCategoryMap[s.id] ?? "universal"
      map[cat].push(s)
    })
    return map
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-[0.06] blur-[60px] bg-[#818CF8]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/10">
              <Zap className="h-5 w-5 text-[#818CF8]" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-white">Your Skills</h2>
              <p className="mt-0.5 text-[12px] text-white/[0.38]">
                {availableSkills.length} skills loaded across {categories.length} categories
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills by category */}
      {categories.map((cat) => {
        const catSkills = skillsByCategory[cat.id]
        if (catSkills.length === 0) return null
        return (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.10em] text-white/[0.55]">
                {cat.label}
              </h3>
              <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/[0.35] tabular-nums">
                {catSkills.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {catSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} category={cat} size="sm" />
              ))}
            </div>
          </div>
        )
      })}

      {/* Marketplace — Coming Soon */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-[#FBBF24]" />
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.10em] text-white/[0.55]">
            Marketplace
          </h3>
          <span className="rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#FBBF24]">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {marketplaceSkills.map((skill) => (
            <MarketplaceCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Template B — Two-Panel Split                                       */
/*  Left: sticky filter pills + stats. Right: skills + Coming Soon     */
/* ================================================================== */

function TemplateB() {
  const [activeCat, setActiveCat] = React.useState<SkillCategory | "all">("all")
  const [search, setSearch] = React.useState("")

  const filteredSkills = React.useMemo(() => {
    let skills = availableSkills
    if (activeCat !== "all") {
      skills = skills.filter((s) => (skillCategoryMap[s.id] ?? "universal") === activeCat)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      skills = skills.filter((s) => s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    }
    return skills
  }, [activeCat, search])

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: availableSkills.length }
    categories.forEach((cat) => {
      c[cat.id] = availableSkills.filter((s) => (skillCategoryMap[s.id] ?? "universal") === cat.id).length
    })
    return c
  }, [])

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left sidebar */}
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
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/[0.40]">{counts.all}</span>
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
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/[0.40]">{counts[cat.id]}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.35]">Stats</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[11px] text-white/[0.45]">Loaded</span>
                <span className="text-[11px] font-mono font-medium text-[#34D399] tabular-nums">{counts.all}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-white/[0.45]">Active</span>
                <span className="text-[11px] font-mono font-medium text-[#818CF8] tabular-nums">{counts.all}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-white/[0.45]">Marketplace</span>
                <span className="text-[11px] font-mono font-medium text-[#FBBF24] tabular-nums">{marketplaceSkills.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Skills list */}
        <div className="space-y-2">
          {filteredSkills.map((skill) => {
            const catId = skillCategoryMap[skill.id] ?? "universal"
            const cat = categories.find((c) => c.id === catId)!
            return <SkillCard key={skill.id} skill={skill} category={cat} size="md" />
          })}
          {filteredSkills.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-white/[0.15]" />
              <p className="mt-3 text-[13px] text-white/[0.35]">No skills match &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Marketplace banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#FBBF24]/10 bg-gradient-to-br from-[#FBBF24]/[0.04] to-transparent p-5 backdrop-blur-xl">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[#FBBF24] opacity-[0.05] blur-[40px]" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/10">
                <Sparkles className="h-4.5 w-4.5 text-[#FBBF24]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Skill Marketplace</h3>
                <p className="mt-0.5 text-[11px] text-white/[0.35]">
                  {marketplaceSkills.length} additional skills coming soon. Tax-loss harvesting, estate planning, and more.
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
              <Clock className="h-3 w-3" />
              Coming Soon
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {marketplaceSkills.slice(0, 4).map((s) => (
              <div key={s.id} className="rounded-lg border border-white/[0.03] bg-white/[0.01] px-3 py-2">
                <div className="text-[11px] font-medium text-white/[0.50]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Template C — Editorial / Catalog                                   */
/*  Hero band + two columns: skills (60%) + Coming Soon teaser (40%)   */
/* ================================================================== */

function TemplateC() {
  const skillsByCategory = React.useMemo(() => {
    const map: Record<SkillCategory, AgentSkill[]> = { universal: [], portfolio: [], debt: [], retirement: [] }
    availableSkills.forEach((s) => {
      const cat = skillCategoryMap[s.id] ?? "universal"
      map[cat].push(s)
    })
    return map
  }, [])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(129,140,248,0.06)_0%,transparent_60%)]" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-[#818CF8]" />
              <h2 className="text-[18px] font-bold tracking-tight text-white">Skills Catalog</h2>
            </div>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/[0.42]">
              {availableSkills.length} skills loaded. Marketplace launching soon with {marketplaceSkills.length} additional capabilities.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-center">
              <div className="text-[24px] font-bold tabular-nums text-[#34D399]">{availableSkills.length}</div>
              <div className="text-[10px] uppercase tracking-[0.10em] text-white/[0.35]">Loaded</div>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="text-center">
              <div className="text-[24px] font-bold tabular-nums text-[#FBBF24]">{marketplaceSkills.length}</div>
              <div className="text-[10px] uppercase tracking-[0.10em] text-white/[0.35]">Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main: Skills catalog (60%) */}
        <div className="min-w-0 flex-[3] space-y-6">
          {categories.map((cat) => {
            const catSkills = skillsByCategory[cat.id]
            if (catSkills.length === 0) return null
            return (
              <SectionCard
                key={cat.id}
                label={cat.label}
                description={`${catSkills.length} skills`}
              >
                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {catSkills.map((skill) => (
                    <div key={skill.id} className="pt-3 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-white">{skill.label}</h4>
                          <p className="mt-1 text-[12px] leading-relaxed text-white/[0.42]">{skill.description}</p>
                        </div>
                        <code className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] text-white/[0.35]">
                          /{skill.id}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )
          })}
        </div>

        {/* Side: Coming Soon teaser (40%) */}
        <div className="flex-1 lg:max-w-[340px]">
          <div className="lg:sticky lg:top-6 space-y-4">
            <SectionCard
              label="Marketplace"
              description="Additional skills launching soon."
            >
              <div className="space-y-3">
                {marketplaceSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-start gap-3 rounded-lg border border-white/[0.03] bg-white/[0.01] p-3 transition-colors hover:border-white/[0.06]"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.02]">
                      <Lock className="h-3 w-3 text-white/[0.20]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-white/[0.55]">{skill.label}</span>
                        <span className="shrink-0 rounded-full bg-[#FBBF24]/10 px-1 py-0.5 text-[8px] font-semibold text-[#FBBF24]">
                          Soon
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-white/[0.30]">{skill.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-[#FBBF24]/10 bg-[#FBBF24]/[0.02] p-4 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-[#FBBF24]/50" />
                <p className="mt-2 text-[12px] font-medium text-[#FBBF24]/80">
                  More skills on the way
                </p>
                <p className="mt-1 text-[11px] text-white/[0.30]">
                  Community and premium skills launching in a future release.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Template picker — A / B / C segmented control                       */
/* ================================================================== */

type TemplateId = "a" | "b" | "c"

const templateLabels: Record<TemplateId, { label: string; description: string }> = {
  a: { label: "Marketplace Grid", description: "Your Skills grid + Coming Soon marketplace below" },
  b: { label: "Two-Panel Split", description: "Filter sidebar + skills panel with banner" },
  c: { label: "Editorial / Catalog", description: "Hero band + two-column with teaser sidebar" },
}

/* ================================================================== */
/*  SkillsPage — exported component                                    */
/* ================================================================== */

export function SkillsPage() {
  const [template, setTemplate] = React.useState<TemplateId>("a")

  return (
    <PageShell
      title="Skills"
      subtitle="Manage loaded skills and browse the marketplace"
      accentColor="#818CF8"
      accentRgb="129,140,248"
      maxWidth="wide"
    >
      {/* Template picker */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.30]">Template</span>
          <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 backdrop-blur-xl">
            {(Object.entries(templateLabels) as [TemplateId, (typeof templateLabels)[TemplateId]][]).map(([id, info]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplate(id)}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors duration-150",
                  template === id
                    ? "text-white"
                    : "text-white/[0.40] hover:text-white/[0.65]"
                )}
              >
                {template === id && (
                  <motion.span
                    layoutId="skills-template-pill"
                    className="absolute inset-0 rounded-md bg-white/[0.06] border border-white/[0.08]"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                  />
                )}
                <span className="relative">{info.label}</span>
              </button>
            ))}
          </div>
          <span className="hidden text-[11px] text-white/[0.25] sm:inline">
            — {templateLabels[template].description}
          </span>
        </div>
      </div>

      {/* Active template */}
      <AnimatePresence mode="wait">
        <motion.div
          key={template}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {template === "a" && <TemplateA />}
          {template === "b" && <TemplateB />}
          {template === "c" && <TemplateC />}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  )
}
