"use client"

import * as React from "react"
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
/*  Mock thinking scripts                                              */
/*  In production these come from the streaming LLM API.               */
/* ================================================================== */

const sampleScripts: Record<FirmStepKey, string[]> = {
  frame: [
    "Your tech weight is 41% against a 25% target.",
    "Drift is +16 percentage points over your threshold.",
    "The gap is well outside your 5% rebalance band.",
  ],
  inspect: [
    "Last rebalance: March 12, 2025.",
    "You skipped the June review per your memory notes.",
    "Risk tolerance logged as moderate, 5-year horizon.",
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

const sampleResponses = [
  "Your tech concentration is 1.8x more volatile than the S&P 500. Trim NVDA by 6% and AAPL by 4%, redirect into VOO. Estimated tax impact: $1,240. This brings you back inside your 5% rebalance band.\n\nNext step: confirm the trade and enter your authorization key to execute.",
  "On track. Your debt avalanche saves $520 in interest vs. snowball over the next 24 months. The Credit Card at 19.9% APR should be your next target — redirect the $200/month surplus there.\n\nNext step: confirm the reallocation and I will update your payoff timeline.",
  "Your retirement contribution rate is 8% against a 12% target for your stated retirement age. Closing that gap moves your debt-free date forward by 4 years.\n\nNext step: increase your 401(k) contribution by 4% in your next paycheck.",
]

/* ================================================================== */
/*  useAgentThinking                                                   */
/* ================================================================== */

interface UseAgentThinkingOptions {
  /** Called when the agent's final reply is ready to be appended */
  onReply?: (message: AgentMessage) => void
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
    (userText: string) => {
      if (!userText.trim()) return
      clearTimers()
      resetSteps()
      setIsThinking(true)
      accumulatedElapsedRef.current = 0
      currentStepIdxRef.current = -1

      // For each step: set running, stream text, then mark done
      STEP_DURATIONS_MS.forEach((durationMs, idx) => {
        // Hoist script so both the start and finish timers can read it
        const script = sampleScripts[firmSteps[idx].key]

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
          text: sampleScripts[s.key][sampleScripts[s.key].length - 1],
        }))
        const reply: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
          thinking: finalSteps,
          thinkingElapsed: totalElapsed,
          createdAt: Date.now(),
        }
        onReplyRef.current?.(reply)
        resetSteps()
      }, accumulatedElapsedRef.current + 200)

      timersRef.current.push(replyTimer)
    },
    [clearTimers, resetSteps]
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
