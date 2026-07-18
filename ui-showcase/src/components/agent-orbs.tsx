"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Dock,
  DockCard,
  DockCardInner,
} from "@/components/ui/dock"
import { agents, type AgentDef } from "@/lib/agents"

/* ================================================================== */
/*  AgentOrbs — dock with magnification + bounce; click opens full chat */
/* ================================================================== */

export function AgentOrbs() {
  const router = useRouter()

  const handleOrbClick = useCallback(
    (agent: AgentDef) => {
      router.push(`/agent/${agent.id}`)
    },
    [router]
  )

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.65] text-center">
        Agent Chat
      </h4>

      {/* Horizontal dock with magnification effect */}
      <div className="flex justify-center">
        <Dock>
          {agents.map((agent, index) => {
            const Icon = agent.icon
            return (
              <DockCard
                key={agent.id}
                id={agent.id}
                index={index}
                onClick={() => handleOrbClick(agent)}
              >
                <DockCardInner
                  id={agent.id}
                  style={{
                    background: agent.gradient,
                    boxShadow: agent.glow,
                  }}
                >
                  <Icon className="h-6 w-6 text-white/90 drop-shadow-md" />
                </DockCardInner>
              </DockCard>
            )
          })}
        </Dock>
      </div>

      {/* Agent labels — match dock's gap-3 spacing */}
      <div className="flex justify-center gap-3 mt-2 px-2">
        {agents.map((agent) => (
          <span
            key={agent.id}
            className={cn(
              "text-[9px] font-medium text-center transition-colors duration-150 hover:text-white/[0.80]",
              "text-white/[0.55]"
            )}
            style={{ width: 40 }}
          >
            {agent.shortLabel}
          </span>
        ))}
      </div>

      {/* Hint that clicking opens the full chat */}
      <p className="mt-3 text-center text-[9px] text-white/[0.30]">
        Click an orb to open the full chat
      </p>
    </div>
  )
}
