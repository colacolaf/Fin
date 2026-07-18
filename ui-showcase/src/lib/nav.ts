import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  Settings,
} from "lucide-react"
import { agents, type AgentDef } from "./agents"

/* ================================================================== */
/*  Navigation data — sections shown in the slide-over sidebar          */
/* ================================================================== */

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  /** Route to navigate to */
  href: string
  /** Optional badge text (e.g. "new") */
  badge?: string
  /** Optional accent color for the icon dot */
  accentColor?: string
  /** Optional secondary description */
  description?: string
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

/* ------------------------------------------------------------------ */
/*  Main navigation                                                    */
/* ------------------------------------------------------------------ */

export const mainNav: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    description: "Overview of all agents",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    badge: "new",
    description: "Cross-account trends",
  },
  {
    id: "memory",
    label: "Memory",
    icon: Brain,
    href: "/memory",
    description: "Agent memory graph",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
    description: "App preferences",
  },
]

/* ------------------------------------------------------------------ */
/*  Agent navigation — one entry per agent's settings page             */
/* ------------------------------------------------------------------ */

export const agentNav: NavItem[] = agents.map((agent: AgentDef) => ({
  id: agent.id,
  label: agent.label,
  icon: agent.icon,
  href: `/agent/${agent.id}/settings`,
  accentColor: agent.color,
  description: agent.description,
}))

/* ------------------------------------------------------------------ */
/*  All sections, in display order                                     */
/* ------------------------------------------------------------------ */

export const navSections: NavSection[] = [
  { id: "main", label: "Main", items: mainNav },
  { id: "agents", label: "Agents", items: agentNav },
]
