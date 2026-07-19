"use client"

import * as React from "react"
import {
  fetchSkillContents,
  type SkillContent,
} from "@/lib/skills/resolver"
import { firmSteps, type FirmStepKey, type ThinkingMode, type TokenMode } from "./index"

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
/*  Intent → Skill Router (auto-suggestion when no skills are toggled) */
/* ================================================================== */

interface SkillMatch {
  skillId: string
  relevance: number
  reason: string
}

/**
 * Analyze a user message and return the best-matching skills.
 * This mirrors the intent→skill mapping in route_skills.md.
 */
function routeToSkills(userText: string, alreadyLoaded: string[]): SkillMatch[] {
  const lower = userText.toLowerCase()
  const matches: SkillMatch[] = []

  // Skip greetings / small talk — only for very short messages (≤ 3 words)
  // Removed "good" and "great" — they appear in real questions like "Good portfolio strategy?"
  const greetingPatterns = /^(hi|hey|hello|thanks|thank you|ok|okay|got it|nice)\b/i
  if (greetingPatterns.test(lower.trim()) && lower.trim().split(/\s+/).length <= 3) {
    return []
  }

  /* ── Portfolio domain ── */
  if (/\b(analyze|allocation|diversif|concentrat|holdings|portfolio|positions|exposure|overweight|underweight|sector|tech)\b.*\b(portfolio|my|how|what|too)\b/i.test(lower) ||
      /\b(portfolio|allocation|diversif|concentrat).*(analy|check|review|look|see|assess)\b/i.test(lower) ||
      /\b(too.*(much|heavy|concentrated).*(tech|stock|single)|overweight.*(tech|stock|sector))\b/i.test(lower)) {
    matches.push({ skillId: "portfolio_analyze", relevance: 10, reason: "portfolio analysis intent detected" })
  }

  if (/\b(rebalance|trim|reduc|add to|increase.*position|sell.*buy|buy.*sell|reallocat)\b/i.test(lower)) {
    matches.push({ skillId: "rebalance_recommend", relevance: 10, reason: "rebalancing intent detected" })
  }

  if (/\b(value|worth|price|estimate|valuation).*(startup|private|share|equity|stock option|ISO|NSO|RSU)\b/i.test(lower) ||
      /\b(startup|private.*share|private.*equity|stock option|409a|secondary)\b/i.test(lower)) {
    matches.push({ skillId: "value_private_asset", relevance: 10, reason: "private asset valuation intent detected" })
  }

  if (/\b(trade|buy|sell|execut|place.*order|purchase)\b/i.test(lower) &&
      !/\b(paper|simulat|test)\b/i.test(lower)) {
    matches.push({ skillId: "execute_trade", relevance: 8, reason: "trade execution intent detected" })
  }

  if (/\b(paper.*trad|simulat|test.*trade|practice)\b/i.test(lower)) {
    matches.push({ skillId: "enable_paper_trading", relevance: 10, reason: "paper trading intent detected" })
  }

  /* ── Debt domain ── */
  if (/\b(pay.*off|payoff|debt.*strateg|avalanche|snowball|extra.*payment|how.*long.*debt|debt.*free)\b/i.test(lower) ||
      /\b(debt|credit.*card|student.*loan|car.*loan|mortgage).*(pay|strateg|plan|timeline)\b/i.test(lower)) {
    matches.push({ skillId: "debt_payoff_simulate", relevance: 10, reason: "debt payoff intent detected" })
  }

  if (/\b(debt.*invest|invest.*debt|pay.*debt.*or.*invest|should.*pay|extra.*money)\b/i.test(lower) ||
      /\b(payoff|debt).*(vs|versus|or).*(invest|market|portfolio|stock)\b/i.test(lower)) {
    matches.push({ skillId: "debt_vs_invest_analyze", relevance: 10, reason: "debt vs invest intent detected" })
  }

  /* ── Retirement domain ── */
  if (/\b(retire|retirement|on track|readiness|how.*much.*retire|enough.*retire|retire.*age)\b/i.test(lower) ||
      /\b(retirement|retire).*(project|plan|save|enough|need|readiness)\b/i.test(lower)) {
    matches.push({ skillId: "retirement_readiness_score", relevance: 10, reason: "retirement readiness intent detected" })
  }

  if (/\b(employer.*match|401k.*match|match.*capture|full.*match|increase.*contribution|match.*percent)\b/i.test(lower) ||
      /\b(401k|401\(k\)).*(match|contribute|increase)\b/i.test(lower)) {
    matches.push({ skillId: "match_capture_recommend", relevance: 10, reason: "employer match intent detected" })
  }

  /* ── Universal domain ── */
  if (/\b(current|price|rate|news|recent|today|what.*is.*the|fed|market.*update)\b/i.test(lower)) {
    matches.push({ skillId: "search_web", relevance: 7, reason: "market data intent detected" })
  }

  // Filter: remove already-loaded skills, enforce minimum relevance ≥ 7,
  // sort by relevance descending, take top 2
  return matches
    .filter((m) => !alreadyLoaded.includes(m.skillId) && m.relevance >= 7)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 2) // Max 2 auto-loaded skills per message
}

/* ================================================================== */
/*  Mock thinking scripts — enriched with skill context                */
/* ================================================================== */

function buildScripts(
  activeSkills: SkillContent[],
  failedSkills: string[],
  autoLoadedSkills: SkillMatch[],
  thinkingMode: ThinkingMode,
): Record<FirmStepKey, string[]> {
  const skillNames = activeSkills.map((s) => s.skillId.replace(/_/g, " "))
  const skillCount = activeSkills.length
  const isFast = thinkingMode === "fast"

  const base: Record<FirmStepKey, string[]> = {
    frame: isFast
      ? ["Concentration detected — tech at 41% vs 25% target."]
      : [
          "Your tech weight is 41% against a 25% target.",
          "Drift is +16 percentage points over your threshold.",
          "The gap is well outside your 5% rebalance band.",
        ],
    inspect: isFast
      ? ["Context loaded. Last rebalance: Mar 2025. Moderate risk, 5yr horizon."]
      : [
          "Last rebalance: March 12, 2025.",
          "You skipped the June review per your memory notes.",
          `Risk tolerance logged as moderate, 5-year horizon.`,
        ],
    research: isFast
      ? ["QQQ +18.2% YTD vs SPY +11.4% — concentration confirmed."]
      : [
          "Confidence on current QQQ drift below 80%.",
          "Searching SPY vs QQQ YTD performance...",
          "QQQ up 18.2% YTD, SPY up 11.4% — concentration confirmed.",
        ],
    call: isFast
      ? ["Trim NVDA 6% + AAPL 4% → VOO. Tax ~$1.2k."]
      : [
          "Trim NVDA by 6% and AAPL by 4%.",
          "Redirect into VOO to restore broad-market weight.",
          "Estimated tax hit: $1,240. Net volatility reduction: 1.3x.",
        ],
  }

  // If skills were auto-loaded by the router, surface them in the trace
  if (autoLoadedSkills.length > 0) {
    const lines = autoLoadedSkills.map(
      (m) => `🎯 Auto-loaded skill: ${m.skillId.replace(/_/g, " ")} (relevance ${m.relevance}/10 — ${m.reason})`
    )
    base.inspect = [...lines, ...base.inspect]
  }

  // If skills are active (manual or auto-loaded), show token budget
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

function buildResponse(activeSkills: SkillContent[], tokenMode: TokenMode): string {
  if (activeSkills.length === 0) {
    const base = "Your tech concentration is 1.8x more volatile than the S&P 500. Trim NVDA by 6% and AAPL by 4%, redirect into VOO."
    const detail = "Estimated tax impact: $1,240. This brings you back inside your 5% rebalance band.\n\nNext step: confirm the trade and enter your authorization key to execute."

    switch (tokenMode) {
      case "normal": return `${base} ${detail}`
      case "compressed": return `${base} Tax: ~$1.2k. Back in band. Next: authorize trade.`
      case "ultra": return `Tech conc 1.8x vs S&P. Trim NVDA 6% AAPL 4% → VOO. Tax ~$1.2k. Back in 5% band. Confirm trade + auth key.`
      case "bare": return `Sell NVDA -6% AAPL -4%, buy VOO. Tax $1.2k. Auth needed.`
    }
  }

  const skillName = activeSkills[0].skillId.replace(/_/g, " ")
  const tokens = activeSkills[0].tokenEstimate.toLocaleString()

  switch (tokenMode) {
    case "normal":
      return `[Using ${activeSkills.length} active skill${activeSkills.length > 1 ? "s" : ""}: ${activeSkills.map((s) => s.skillId).join(", ")}]\n\nI've loaded the institutional knowledge for ${skillName} (~${tokens} tokens of methodology, formulas, and validation rules).\n\nYour tech concentration is 1.8x more volatile than the S&P 500. Trim NVDA by 6% and AAPL by 4%, redirect into VOO. Estimated tax impact: $1,240. This brings you back inside your 5% rebalance band.\n\nNext step: confirm the trade and enter your authorization key to execute.`
    case "compressed":
      return `[Skills: ${activeSkills.map((s) => s.skillId).join(", ")}] Tech conc 1.8x vs S&P. Trim NVDA 6% AAPL 4% → VOO. Tax ~$1.2k. Back in 5% band. Next: authorize trade.`
    case "ultra":
      return `[${skillName}] Tech conc 1.8x. NVDA -6% AAPL -4% → VOO. Tax $1.2k. Confirm + auth.`
    case "bare":
      return `Sell NVDA -6% AAPL -4%, buy VOO. Tax $1.2k. Auth.`
  }
}

/* ================================================================== */
/*  useAgentThinking                                                   */
/* ================================================================== */

interface UseAgentThinkingOptions {
  /** Called when the agent's final reply is ready to be appended */
  onReply?: (message: AgentMessage) => void
  /** Active skill IDs — their content is loaded and context injected */
  activeSkillIds?: string[]
  /** Thinking mode — controls reasoning depth */
  thinkingMode?: ThinkingMode
  /** Token mode — controls output compression level */
  tokenMode?: TokenMode
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
  thinkingMode = "full",
  tokenMode = "normal",
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

      // ── Auto-route to skills based on user intent (before manual skills are loaded) ──
      const autoMatches = activeSkillIds.length === 0
        ? routeToSkills(userText, activeSkillIds)
        : []

      // Combine manual + auto-suggested skill IDs
      const allSkillIds = [
        ...activeSkillIds,
        ...autoMatches.map((m) => m.skillId),
      ]

      // ── Load skill contents before starting the thinking flow ──
      let loadedSkills: SkillContent[] = []
      const failedSkills: string[] = []
      if (allSkillIds.length > 0) {
        try {
          const skillMap = await fetchSkillContents(allSkillIds)
          loadedSkills = Array.from(skillMap.values())
          // Track which skills failed to load
          for (const id of allSkillIds) {
            if (!skillMap.has(id)) failedSkills.push(id)
          }
        } catch {
          console.warn("[useAgentThinking] Failed to load skill contents — proceeding without skills")
          failedSkills.push(...allSkillIds)
        }
      }

      // Build scripts and response with loaded skill context
      const scripts = buildScripts(loadedSkills, failedSkills, autoMatches, thinkingMode)
      const responseText = buildResponse(loadedSkills, tokenMode)

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
    [clearTimers, resetSteps, activeSkillIds, thinkingMode, tokenMode]
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
