"use client"

import * as React from "react"
import {
  fetchSkillContents,
  type SkillContent,
} from "@/lib/skills/resolver"
import { firmSteps, type FirmStepKey } from "./index"

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type StepState = "pending" | "running" | "done"

export interface StepStatus {
  key: FirmStepKey
  label: string
  hint: string
  state: StepState
  /** Elapsed seconds spent on this step so far */
  elapsed: number
  /** Streaming text shown while the step is running */
  text: string
}

export interface AgentMessage {
  id: string
  role: "user" | "agent"
  text: string
  /** Present on agent messages that went through a thinking trace */
  thinking?: StepStatus[]
  /** Total elapsed seconds for the thinking trace */
  thinkingElapsed?: number
  createdAt: number
}

/* ================================================================== */
/*  Mock thinking scripts — enriched with skill context                */
/* ================================================================== */

function buildScripts(activeSkills: SkillContent[], failedSkills: string[]): Record<FirmStepKey, string[]> {
  const skillNames = activeSkills.map((s) => s.skillId.replace(/_/g, " "))
  const skillCount = activeSkills.length

  const base: Record<FirmStepKey, string[]> = {
    frame: [
      "Your tech weight is 41% against a 25% target.",
      "Drift is +16 percentage points over your threshold.",
      "The gap is well outside your 5% rebalance band.",
    ],
    inspect: [
      "Last rebalance: March 12, 2025.",
      "You skipped the June review per your memory notes.",
      `Risk tolerance logged as moderate, 5-year horizon.`,
    ],
    research: [
      "Confidence on current QQQ drift below 80%.",
      "Searching SPY vs QQQ YTD performance...",
      "QQQ up 18.2% YTD, SPY up 11.4% — concentration confirmed.",
    ],
    call: [
      "Trim NVDA by 6% and AAPL by 4%.",
      "Redirect into VOO to restore broad-market weight.",
      "Estimated tax hit: $1,240. Net volatility reduction: 1.3x.",
    ],
  }

  // If skills are active, enrich the thinking trace
  if (skillCount > 0) {
    base.inspect = [
      ...base.inspect,
      `${skillCount} skill${skillCount > 1 ? "s" : ""} loaded: ${skillNames.join(", ")}.`,
      `Skill context: ~${activeSkills.reduce((sum, s) => sum + s.tokenEstimate, 0).toLocaleString()} tokens of institutional knowledge available.`,
    ]
  }

  // Surface skill load failures in the thinking trace
  if (failedSkills.length > 0) {
    base.inspect = [
      ...base.inspect,
      `⚠️ Could not load ${failedSkills.length} skill${failedSkills.length > 1 ? "s" : ""}: ${failedSkills.join(", ")}.`,
    ]
  }

  return base
}

function buildResponse(activeSkills: SkillContent[]): string {
  if (activeSkills.length === 0) {
    return "Your tech concentration is 1.8x more volatile than the S&P 500. Trim NVDA by 6% and AAPL by 4%, redirect into VOO. Estimated tax impact: $1,240. This brings you back inside your 5% rebalance band.\n\nNext step: confirm the trade and enter your authorization key to execute."
  }

  const skillName = activeSkills[0].skillId.replace(/_/g, " ")
  return `[Using ${activeSkills.length} active skill${activeSkills.length > 1 ? "s" : ""}: ${activeSkills.map((s) => s.skillId).join(", ")}]\n\nI've loaded the institutional knowledge for ${skillName} (~${activeSkills[0].tokenEstimate.toLocaleString()} tokens of methodology, formulas, and validation rules).\n\nYour tech concentration is 1.8x more volatile than the S&P 500. Trim NVDA by 6% and AAPL by 4%, redirect into VOO. Estimated tax impact: $1,240. This brings you back inside your 5% rebalance band.\n\nNext step: confirm the trade and enter your authorization key to execute.`
}

/* ================================================================== */
/*  useAgentThinking                                                   */
/* ================================================================== */

interface UseAgentThinkingOptions {
  /** Called when the agent's final reply is ready to be appended */
  onReply?: (message: AgentMessage) => void
  /** Active skill IDs — their content is loaded and context injected */
  activeSkillIds?: string[]
}

interface UseAgentThinkingReturn {
  /** True while the agent is thinking + typing */
  isThinking: boolean
  /** Live step statuses (one per F.I.R.M. step), in order */
  steps: StepStatus[]
  /** Total elapsed seconds across all steps so far */
  totalElapsed: number
  /** Submit a user message and start the thinking flow */
  send: (userText: string) => void
  /** Cancel an in-flight thinking run */
  cancel: () => void
}

const STEP_DURATIONS_MS = [1400, 1600, 2200, 1200]
const STREAM_INTERVAL_MS = 120

export function useAgentThinking({
  onReply,
  activeSkillIds = [],
}: UseAgentThinkingOptions = {}): UseAgentThinkingReturn {
  const [isThinking, setIsThinking] = React.useState(false)
  const [steps, setSteps] = React.useState<StepStatus[]>(() =>
    firmSteps.map((s) => ({
      key: s.key,
      label: s.label,
      hint: s.hint,
      state: "pending",
      elapsed: 0,
      text: "",
    }))
  )

  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = React.useRef<number | null>(null)
  const stepStartRef = React.useRef<number>(0)
  const onReplyRef = React.useRef(onReply)
  const currentStepIdxRef = React.useRef(-1)
  const accumulatedElapsedRef = React.useRef(0)

  React.useEffect(() => {
    onReplyRef.current = onReply
  }, [onReply])

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const resetSteps = React.useCallback(() => {
    setSteps(
      firmSteps.map((s) => ({
        key: s.key,
        label: s.label,
        hint: s.hint,
        state: "pending",
        elapsed: 0,
        text: "",
      }))
    )
    accumulatedElapsedRef.current = 0
    currentStepIdxRef.current = -1
  }, [])

  const cancel = React.useCallback(() => {
    clearTimers()
    setIsThinking(false)
    resetSteps()
  }, [clearTimers, resetSteps])

  // Cleanup on unmount
  React.useEffect(() => clearTimers, [clearTimers])

  const send = React.useCallback(
    async (userText: string) => {
      if (!userText.trim()) return
      clearTimers()
      resetSteps()
      setIsThinking(true)
      accumulatedElapsedRef.current = 0
      currentStepIdxRef.current = -1

      // ── Load active skill contents before starting the thinking flow ──
      let loadedSkills: SkillContent[] = []
      const failedSkills: string[] = []
      if (activeSkillIds.length > 0) {
        try {
          const skillMap = await fetchSkillContents(activeSkillIds)
          loadedSkills = Array.from(skillMap.values())
          // Track which skills failed to load
          for (const id of activeSkillIds) {
            if (!skillMap.has(id)) failedSkills.push(id)
          }
        } catch {
          // If the entire fetch operation fails, proceed without skills
          console.warn("[useAgentThinking] Failed to load skill contents — proceeding without skills")
          failedSkills.push(...activeSkillIds)
        }
      }

      // Build scripts and response with loaded skill context
      const scripts = buildScripts(loadedSkills, failedSkills)
      const responseText = buildResponse(loadedSkills)

      // For each step: set running, stream text, then mark done
      STEP_DURATIONS_MS.forEach((durationMs, idx) => {
        // Hoist script so both the start and finish timers can read it
        const script = scripts[firmSteps[idx].key]

        // Start this step
        const startTimer = setTimeout(() => {
          currentStepIdxRef.current = idx
          stepStartRef.current = performance.now()

          setSteps((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, state: "running", text: "" } : s
            )
          )

          // Stream the script lines
          const lines = script
          let lineIdx = 0
          const streamOneLine = () => {
            if (lineIdx >= lines.length) return
            const line = lines[lineIdx]
            const lineTimer = setTimeout(() => {
              setSteps((prev) =>
                prev.map((s, i) =>
                  i === idx ? { ...s, text: line } : s
                )
              )
              lineIdx += 1
              streamOneLine()
            }, STREAM_INTERVAL_MS)
            timersRef.current.push(lineTimer)
          }
          streamOneLine()

          // RAF tick to update this step's elapsed seconds
          const tick = () => {
            const elapsedSec = (performance.now() - stepStartRef.current) / 1000
            setSteps((prev) =>
              prev.map((s, i) =>
                i === idx ? { ...s, elapsed: elapsedSec } : s
              )
            )
            if (currentStepIdxRef.current === idx) {
              rafRef.current = requestAnimationFrame(tick)
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }, accumulatedElapsedRef.current)

        timersRef.current.push(startTimer)
        accumulatedElapsedRef.current += durationMs

        // Finish this step
        const finishTimer = setTimeout(() => {
          const finalElapsed = durationMs / 1000
          setSteps((prev) =>
            prev.map((s, i) =>
              i === idx
                ? { ...s, state: "done", elapsed: finalElapsed, text: script[script.length - 1] }
                : s
            )
          )
          // Stop the RAF for this step
          if (currentStepIdxRef.current === idx && rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
          }
        }, accumulatedElapsedRef.current)

        timersRef.current.push(finishTimer)
      })

      // After all steps: deliver the reply
      const replyTimer = setTimeout(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        setIsThinking(false)
        const totalElapsed = STEP_DURATIONS_MS.reduce((a, b) => a + b, 0) / 1000
        const finalSteps = firmSteps.map((s, i) => ({
          key: s.key,
          label: s.label,
          hint: s.hint,
          state: "done" as const,
          elapsed: STEP_DURATIONS_MS[i] / 1000,
          text: scripts[s.key][scripts[s.key].length - 1],
        }))
        const reply: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: responseText,
          thinking: finalSteps,
          thinkingElapsed: totalElapsed,
          createdAt: Date.now(),
        }
        onReplyRef.current?.(reply)
        resetSteps()
      }, accumulatedElapsedRef.current + 200)

      timersRef.current.push(replyTimer)
    },
    [clearTimers, resetSteps, activeSkillIds]
  )

  // Compute total elapsed live from the steps (handles in-flight step)
  const totalElapsed = React.useMemo(
    () => steps.reduce((acc, s) => acc + s.elapsed, 0),
    [steps]
  )

  return {
    isThinking,
    steps,
    totalElapsed,
    send,
    cancel,
  }
}
