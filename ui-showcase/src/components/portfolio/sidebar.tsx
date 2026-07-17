"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PieChart,
  TrendingDown,
  Brain,
  BarChart3,
  Settings,
} from "lucide-react"

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Portfolio", icon: PieChart },
  { label: "Debt", icon: TrendingDown },
  { label: "Analytics", icon: BarChart3 },
  { label: "Memory", icon: Brain },
  { label: "Settings", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-14 flex-col items-center gap-4 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#818CF8]/10 text-[#818CF8]">
        <BarChart3 className="h-4 w-4" />
      </div>
      <div className="h-px w-6 bg-white/[0.06]" />
      {sidebarItems.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150",
            item.label === "Portfolio"
              ? "bg-white/[0.08] text-white"
              : "text-white/[0.38] hover:bg-white/[0.05] hover:text-white/[0.7]"
          )}
          title={item.label}
        >
          <item.icon className="h-4 w-4" />
        </div>
      ))}
    </aside>
  )
}
