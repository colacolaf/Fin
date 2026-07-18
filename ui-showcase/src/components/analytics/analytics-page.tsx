"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Brain,
  History,
  type LucideIcon,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/page-shell/page-shell"
import { TimeRangeSelector } from "@/components/portfolio/time-range-selector"
import {
  netWorthTrajectory,
  netWorthCurrent,
  netWorthYtdPct,
  debtTrajectory,
  debtCurrent,
  debtYtdPct,
  debtFreeDate,
  retirementFundedPct,
  retirementYtdDelta,
  retirementTargetAge,
  retirementProjectedAnnual,
  behavioralPatterns,
  decisionHistory,
  agentActivity,
  type DecisionRecord,
} from "@/lib/analytics/data"

/* ================================================================== */
/*  FlowSection — eyebrow + big number + visual                        */
/* ================================================================== */

interface FlowSectionProps {
  eyebrow: string
  icon: LucideIcon
  value: string
  delta?: string
  deltaPositive?: boolean
  subtitle?: string
  children: React.ReactNode
}

function FlowSection({
  eyebrow,
  icon: Icon,
  value,
  delta,
  deltaPositive,
  subtitle,
  children,
}: FlowSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="border-t border-white/[0.04] pt-8 first:border-t-0 first:pt-0"
    >
      {/* Eyebrow */}
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#818CF8]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#818CF8]">
          {eyebrow}
        </span>
      </div>

      {/* Big number + delta */}
      <div className="mb-2 flex items-baseline gap-3">
        <span className="text-[32px] leading-none font-semibold tracking-tight text-white tabular-nums">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "flex items-center gap-1 text-[14px] font-medium",
              deltaPositive ? "text-[#34D399]" : "text-[#F87171]"
            )}
          >
            {deltaPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {delta}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mb-4 text-[12px] text-white/[0.38]">{subtitle}</p>
      )}

      {/* Visual */}
      <div className="mt-4">{children}</div>
    </motion.section>
  )
}

/* ================================================================== */
/*  Chart tooltip                                                      */
/* ================================================================== */

function FlowChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0F1117]/95 backdrop-blur-xl px-3 py-2 shadow-2xl">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/[0.38] mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-white tabular-nums">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

/* ================================================================== */
/*  Trajectory chart — reused for net worth + debt                      */
/* ================================================================== */

function TrajectoryChart({
  data,
  color,
  gradientId,
}: {
  data: { date: string; value: number }[]
  color: string
  gradientId: string
}) {
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            dx={-8}
            domain={["dataMin - 5000", "dataMax + 5000"]}
          />
          <Tooltip
            content={<FlowChartTooltip />}
            cursor={{
              stroke: "rgba(255,255,255,0.08)",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#08090C",
              stroke: color,
              strokeWidth: 2,
            }}
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ================================================================== */
/*  Retirement progress bar                                            */
/* ================================================================== */

function RetirementProgress() {
  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${retirementFundedPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#67E8F9]/70 to-[#818CF8]/50"
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/[0.35]">Funded</span>
        <span className="font-mono tabular-nums text-[#67E8F9]">
          {retirementFundedPct}%
        </span>
      </div>
      <div className="flex gap-6 pt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">
            Target age
          </span>
          <p className="text-[14px] font-medium text-white">
            {retirementTargetAge}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">
            Projected annual
          </span>
          <p className="text-[14px] font-medium text-white tabular-nums">
            ${retirementProjectedAnnual.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Behavior section                                                   */
/* ================================================================== */

function BehaviorSection() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {behavioralPatterns.map((p) => (
        <div
          key={p.label}
          className="flex items-center justify-between border-b border-white/[0.04] pb-2"
        >
          <span className="text-[11px] text-white/[0.35]">{p.label}</span>
          <span className="text-[12px] font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Agent activity bars                                                */
/* ================================================================== */

function AgentActivityBars() {
  const maxChats = Math.max(...agentActivity.map((a) => a.chats))
  return (
    <div className="space-y-2.5">
      {agentActivity.map((a) => (
        <div key={a.agent} className="flex items-center gap-3">
          <span className="w-20 text-[11px] capitalize text-white/[0.45]">
            {a.agent}
          </span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(a.chats / maxChats) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: a.color, opacity: 0.7 }}
            />
          </div>
          <span className="w-10 text-right text-[11px] tabular-nums text-white/[0.40]">
            {a.chats}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Decisions section                                                  */
/* ================================================================== */

const voteStyles: Record<
  DecisionRecord["vote"],
  { icon: LucideIcon; color: string; bg: string }
> = {
  accepted: { icon: Check, color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  rejected: { icon: X, color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  deferred: { icon: Clock, color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
}

const agentColors: Record<DecisionRecord["agent"], string> = {
  portfolio: "#818CF8",
  debt: "#FBBF24",
  retirement: "#67E8F9",
}

function DecisionsSection() {
  return (
    <div className="space-y-1">
      {decisionHistory.map((d) => {
        const vote = voteStyles[d.vote]
        const VoteIcon = vote.icon
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.02]"
          >
            {/* Vote badge */}
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: vote.bg, color: vote.color }}
            >
              <VoteIcon className="h-3.5 w-3.5" />
            </span>

            {/* Agent dot */}
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: agentColors[d.agent] }}
            />

            {/* Title + agent */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[12px] font-medium text-white">
                {d.title}
              </span>
              <span className="text-[10px] capitalize text-white/[0.30]">
                {d.agent} agent
              </span>
            </div>

            {/* Date */}
            <span className="shrink-0 text-[10px] tabular-nums text-white/[0.30]">
              {d.date}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  AnalyticsPage — Single Flow Story                                  */
/* ================================================================== */

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState("1Y")

  return (
    <PageShell
      title="Analytics"
      subtitle="Cross-account trends · Last 12 months"
      actions={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
      maxWidth="wide"
    >
      <div className="space-y-10">
        {/* Net Worth */}
        <FlowSection
          eyebrow="Net Worth"
          icon={TrendingUp}
          value={`$${netWorthCurrent.toLocaleString()}`}
          delta={`+${netWorthYtdPct}% YTD`}
          deltaPositive
          subtitle="Total assets minus total debt across all accounts."
        >
          <TrajectoryChart
            data={netWorthTrajectory}
            color="#818CF8"
            gradientId="analytics-networth"
          />
        </FlowSection>

        {/* Debt Trajectory */}
        <FlowSection
          eyebrow="Debt Trajectory"
          icon={TrendingDown}
          value={`$${debtCurrent.toLocaleString()}`}
          delta={`${debtYtdPct}% YTD`}
          deltaPositive
          subtitle={`On track for debt-free by ${debtFreeDate}.`}
        >
          <TrajectoryChart
            data={debtTrajectory}
            color="#FBBF24"
            gradientId="analytics-debt"
          />
        </FlowSection>

        {/* Retirement Readiness */}
        <FlowSection
          eyebrow="Retirement Readiness"
          icon={PiggyBank}
          value={`${retirementFundedPct}%`}
          delta={`+${retirementYtdDelta} pts YTD`}
          deltaPositive
          subtitle={`Target retirement age: ${retirementTargetAge}.`}
        >
          <RetirementProgress />
        </FlowSection>

        {/* Your Behavior */}
        <FlowSection
          eyebrow="Your Behavior"
          icon={Brain}
          value="74%"
          subtitle="Acceptance rate across all agent recommendations."
        >
          <BehaviorSection />
          <div className="mt-5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
              Agent Activity
            </div>
            <AgentActivityBars />
          </div>
        </FlowSection>

        {/* Recent Decisions */}
        <FlowSection
          eyebrow="Recent Decisions"
          icon={History}
          value={`${decisionHistory.length}`}
          subtitle="Accepted, rejected, and deferred recommendations."
        >
          <DecisionsSection />
        </FlowSection>
      </div>
    </PageShell>
  )
}
