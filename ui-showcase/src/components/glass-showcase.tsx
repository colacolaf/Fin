"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PieChart,
  TrendingDown,
  Brain,
  BarChart3,
  Settings,
  Bell,
  Search,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

/* ------------------------------------------------------------------
 * Shared UI primitives
 * ------------------------------------------------------------------ */

function DemoHeader() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Finance OS</p>
          <p className="text-xs text-white/80">Locally Hosted</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Search"
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 sm:flex"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          aria-label="Notifications"
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 sm:flex"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-rose-300 to-indigo-400" />
      </div>
    </div>
  )
}

function DemoSidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: PieChart, label: "Portfolio" },
    { icon: TrendingDown, label: "Debt" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Brain, label: "Memory" },
    { icon: Settings, label: "Settings" },
  ]
  return (
    <div className="flex h-full w-16 flex-col items-center gap-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
        <BarChart3 className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="h-px w-8 bg-white/20" />
      {items.map((item) => (
        <button
          key={item.label}
          aria-label={item.label}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          title={item.label}
        >
          <item.icon className="h-5 w-5" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  positive,
  className,
}: {
  title: string
  value: string
  change: string
  positive: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md",
        className
      )}
    >
      <p className="text-xs font-medium text-white/80">{title}</p>
      <div className="mt-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-300" : "text-rose-300"
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
          )}
          {change}
        </div>
      </div>
    </div>
  )
}

function DemoContent({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-3", className)}>
      <div className="lg:col-span-2">
        <StatCard
          title="Total Balance"
          value="$124,592.00"
          change="+2.4% this month"
          positive
          className="h-full min-h-[160px]"
        />
      </div>
      <div className="space-y-4">
        <StatCard
          title="Investments"
          value="$89,120.00"
          change="+5.1% this month"
          positive
        />
        <StatCard
          title="Debt"
          value="$12,400.00"
          change="-1.2% this month"
          positive={false}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 1. Glassmorphism: Aurora Mesh
 * ------------------------------------------------------------------ */

function AuroraMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] motion-safe:animate-[spin_60s_linear_infinite] opacity-70">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-rose-500/40 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-violet-500/40 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 h-96 w-96 rounded-full bg-cyan-500/40 blur-[120px]" />
      </div>
    </div>
  )
}

function AuroraMeshGlassDemo() {
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <AuroraMeshBackground />
      <div className="relative z-10 flex h-full w-full p-4 sm:p-6">
        <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <DemoHeader />
          <div className="flex flex-1 gap-4 overflow-hidden">
            <DemoSidebar />
            <div className="flex-1 overflow-auto pr-2">
              <DemoContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 2. Glassmorphism: Frosted Sidebar
 * ------------------------------------------------------------------ */

function FrostedSidebarBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent" />
      <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-purple-500/10 to-transparent" />
    </div>
  )
}

function FrostedSidebarDemo() {
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <FrostedSidebarBackground />
      <div className="relative z-10 flex h-full w-full">
        <div className="flex h-full w-20 flex-col gap-4 border-r border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          {[LayoutDashboard, PieChart, TrendingDown, Brain, Settings].map(
            (Icon, i) => (
              <div
                key={i}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-5 w-5" />
              </div>
            )
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <DemoHeader />
          <div className="flex-1 overflow-auto pr-2">
            <DemoContent />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 3. Glassmorphism: Glass Card Grid
 * ------------------------------------------------------------------ */

function GlassCardGridBackground() {
  return (
    <div className="absolute inset-0 bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.15),transparent_50%)]" />
    </div>
  )
}

function GlassCardGridDemo() {
  const cards = [
    { title: "Portfolio", value: "$89,120", change: "+5.1%", color: "from-indigo-500/20" },
    { title: "Savings", value: "$34,200", change: "+1.2%", color: "from-emerald-500/20" },
    { title: "Debt", value: "$12,400", change: "-1.2%", color: "from-rose-500/20" },
    { title: "Crypto", value: "$8,900", change: "+12.4%", color: "from-amber-500/20" },
  ]
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <GlassCardGridBackground />
      <div className="relative z-10 flex h-full w-full flex-col gap-4 p-4 sm:p-6">
        <DemoHeader />
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-xl transition-transform hover:scale-[1.02]"
            >
              <div className={cn("h-2 w-12 rounded-full bg-gradient-to-r", card.color, "to-transparent")} />
              <div>
                <p className="text-sm text-white/70">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-emerald-300">{card.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * Liquid Glass helpers
 * ------------------------------------------------------------------ */

function LiquidFilter({ id }: { id: string }) {
  return (
    <svg className="absolute h-0 w-0">
      <defs>
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01"
            numOctaves="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
    </svg>
  )
}

/* ------------------------------------------------------------------
 * 4. Liquid Glass: Liquid Gradient
 * ------------------------------------------------------------------ */

function LiquidGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div
        className="absolute -inset-[20%] motion-safe:animate-[pulse_8s_ease-in-out_infinite] opacity-80 will-change-transform"
        style={{ filter: "url(#liquid-gradient-filter)" }}
      >
        <div className="absolute left-[10%] top-[20%] h-[60%] w-[60%] rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-600/40 blur-[80px]" />
        <div className="absolute right-[10%] top-[30%] h-[50%] w-[50%] rounded-full bg-gradient-to-bl from-violet-400/40 to-fuchsia-600/40 blur-[80px]" />
        <div className="absolute bottom-[10%] left-[30%] h-[50%] w-[50%] rounded-full bg-gradient-to-tr from-emerald-400/30 to-cyan-500/30 blur-[80px]" />
      </div>
      <LiquidFilter id="liquid-gradient-filter" />
    </div>
  )
}

function LiquidGradientDemo() {
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <LiquidGradientBackground />
      <div className="relative z-10 flex h-full w-full p-4 sm:p-6">
        <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <DemoHeader />
          <div className="flex flex-1 gap-4 overflow-hidden">
            <DemoSidebar />
            <div className="flex-1 overflow-auto pr-2">
              <DemoContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 5. Liquid Glass: Chromatic Refraction
 * ------------------------------------------------------------------ */

function ChromaticBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#4f46e5_0deg,#ec4899_120deg,#06b6d4_240deg,#4f46e5_360deg)] opacity-40 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_40%)]" />
    </div>
  )
}

function ChromaticGlassDemo() {
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <ChromaticBackground />
      <div className="relative z-10 flex h-full w-full p-4 sm:p-6">
        <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <DemoHeader />
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative h-full min-h-[160px] overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
                <p className="text-xs text-white/70">Net Worth</p>
                <p className="mt-2 text-3xl font-bold text-white">$124,592.00</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-300">+2.4%</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">YTD</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-400/30 blur-2xl" />
                <p className="text-xs text-white/70">Credit Score</p>
                <p className="mt-1 text-2xl font-bold text-white">742</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-400/30 blur-2xl" />
                <p className="text-xs text-white/70">Monthly Spend</p>
                <p className="mt-1 text-2xl font-bold text-white">$3,240</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 6. Liquid Glass: Liquid Orb
 * ------------------------------------------------------------------ */

function LiquidOrbBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-[80px]"
      />
      <motion.div
        animate={{ x: [0, -40, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 blur-[80px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.8)_100%)]" />
    </div>
  )
}

function LiquidOrbDemo() {
  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-3xl">
      <LiquidOrbBackground />
      <div className="relative z-10 flex h-full w-full p-4 sm:p-6">
        <div className="flex h-full w-full flex-col gap-4 rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <DemoHeader />
          <div className="flex flex-1 gap-4 overflow-hidden">
            <DemoSidebar />
            <div className="flex flex-1 flex-col gap-4 overflow-auto pr-2">
              <DemoContent />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Cards</p>
                    <p className="font-semibold text-white">4 Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Assets</p>
                    <p className="font-semibold text-white">12 Classes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * Showcase
 * ------------------------------------------------------------------ */

const examples = [
  {
    id: "glass-aurora",
    label: "Glassmorphism — Aurora Mesh",
    description: "Static frosted glass panels over a soft, colorful gradient mesh.",
    component: AuroraMeshGlassDemo,
  },
  {
    id: "glass-sidebar",
    label: "Glassmorphism — Frosted Sidebar",
    description: "macOS-style translucent sidebar with backdrop blur and subtle borders.",
    component: FrostedSidebarDemo,
  },
  {
    id: "glass-cards",
    label: "Glassmorphism — Glass Card Grid",
    description: "A grid of glass cards with radial gradients highlights.",
    component: GlassCardGridDemo,
  },
  {
    id: "liquid-gradient",
    label: "Liquid Glass — Liquid Gradient",
    description: "SVG-filter displacement creates a flowing, liquid distortion effect.",
    component: LiquidGradientDemo,
  },
  {
    id: "liquid-chromatic",
    label: "Liquid Glass — Chromatic Refraction",
    description: "Conic gradients and specular highlights mimic optical glass refraction.",
    component: ChromaticGlassDemo,
  },
  {
    id: "liquid-orb",
    label: "Liquid Glass — Liquid Orb",
    description: "Animated glass orbs with motion-reactive blur and depth.",
    component: LiquidOrbDemo,
  },
]

export default function GlassShowcase() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Dashboard Backgrounds
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Three glassmorphism and three liquid-glass treatments for the Finance OS dashboard.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {examples.map((example) => (
            <section key={example.id} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{example.label}</h2>
                  <p className="text-sm text-slate-400">{example.description}</p>
                </div>
              </div>
              <div className="h-[500px] w-full overflow-hidden rounded-3xl ring-1 ring-white/10">
                <example.component />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
