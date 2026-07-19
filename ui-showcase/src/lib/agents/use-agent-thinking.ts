"use client"

import * as React from "react"
import {
  fetchSkillContents,
  type SkillContent,
} from "@/lib/skills/resolver"
import { firmSteps, type FirmStepKey, type ThinkingMode, type TokenMode } from "./index"
import { streamModel, type ChatMessage } from "@/lib/models/client"

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type StepState = "pending" | "running" | "done"

export interface StepStatus {
  key: FirmStepKey
  label: string
  hint: string
  state: StepState
  elapsed: number
  text: string
}

export interface AgentMessage {
  id: string
  role: "user" | "agent"
  text: string
  thinking?: StepStatus[]
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

function routeToSkills(userText: string, alreadyLoaded: string[]): SkillMatch[] {
  const lower = userText.toLowerCase()
  const matches: SkillMatch[] = []

  const greetingPatterns = /^(hi|hey|hello|thanks|thank you|ok|okay|got it|nice)\b/i
  if (greetingPatterns.test(lower.trim()) && lower.trim().split(/\s+/).length <= 3) {
    return []
  }

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

  if (/\b(pay.*off|payoff|debt.*strateg|avalanche|snowball|extra.*payment|how.*long.*debt|debt.*free)\b/i.test(lower) ||
      /\b(debt|credit.*card|student.*loan|car.*loan|mortgage).*(pay|strateg|plan|timeline)\b/i.test(lower)) {
    matches.push({ skillId: "debt_payoff_simulate", relevance: 10, reason: "debt payoff intent detected" })
  }

  if (/\b(debt.*invest|invest.*debt|pay.*debt.*or.*invest|should.*pay|extra.*money)\b/i.test(lower) ||
      /\b(payoff|debt).*(vs|versus|or).*(invest|market|portfolio|stock)\b/i.test(lower)) {
    matches.push({ skillId: "debt_vs_invest_analyze", relevance: 10, reason: "debt vs invest intent detected" })
  }

  if (/\b(retire|retirement|on track|readiness|how.*much.*retire|enough.*retire|retire.*age)\b/i.test(lower) ||
      /\b(retirement|retire).*(project|plan|save|enough|need|readiness)\b/i.test(lower)) {
    matches.push({ skillId: "retirement_readiness_score", relevance: 10, reason: "retirement readiness intent detected" })
  }

  if (/\b(employer.*match|401k.*match|match.*capture|full.*match|increase.*contribution|match.*percent)\b/i.test(lower) ||
      /\b(401k|401\(k\)).*(match|contribute|increase)\b/i.test(lower)) {
    matches.push({ skillId: "match_capture_recommend", relevance: 10, reason: "employer match intent detected" })
  }

  if (/\b(current|price|rate|news|recent|today|what.*is.*the|fed|market.*update)\b/i.test(lower)) {
    matches.push({ skillId: "search_web", relevance: 7, reason: "market data intent detected" })
  }

  return matches
    .filter((m) => !alreadyLoaded.includes(m.skillId) && m.relevance >= 7)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 2)
}

/* ================================================================== */
/*  System prompt builder                                               */
/* ================================================================== */

function buildSystemPrompt(
  loadedSkills: SkillContent[],
  autoLoadedSkills: SkillMatch[],
  thinkingMode: ThinkingMode,
  tokenMode: TokenMode,
): string {
  const base = `You are a world-class institutional finance agent powered by Finance OS. You use the F.I.R.M. reasoning framework (Frame Reality → Inspect Context → Research Gaps → Make the Call) to deliver precise, evidence-based financial analysis.`

  const toneInstructions: Record<TokenMode, string> = {
    normal: "Communicate in clear, professional prose with structured formatting, complete explanations, and teaching layers when helpful.",
    compressed: "Be concise. Trim filler words. Use caveman-lite prose. ~40% fewer tokens than normal.",
    ultra: "Use caveman-full prose. Single-sentence explanations. No teaching layer. Minimal formatting. ~65% token reduction.",
    bare: "Keyword-dense output. No prose. Only raw essential facts and numbers. Maximum density.",
  }

  const thinkInstructions: Record<ThinkingMode, string> = {
    full: "Run the complete F.I.R.M. framework with all mental models, validation, and teaching layers.",
    fast: "Use condensed reasoning. Skip the teaching layer and redundant validation steps. Get to the answer quickly.",
  }

  let prompt = `${base}\n\n${thinkInstructions[thinkingMode]}\n${toneInstructions[tokenMode]}`

  // Inject skill context
  if (loadedSkills.length > 0) {
    const skillContexts = loadedSkills.map((s) => s.content).join("\n\n---\n\n")
    prompt += `\n\n## Active Institutional Knowledge\n\nThe following expert methodologies and frameworks are loaded and should inform your analysis:\n\n${skillContexts}`
  }

  if (autoLoadedSkills.length > 0) {
    const skillList = autoLoadedSkills.map((m) => `- ${m.skillId.replace(/_/g, " ")} (relevance: ${m.relevance}/10)`).join("\n")
    prompt += `\n\n## Auto-Loaded Skills\n${skillList}`
  }

  prompt += `\n\n## Response Format\n- Never overstate certainty. Always identify assumptions and risks.\n- When recommending actions, include the math and tradeoffs.\n- If you need more data, say what you need and why.`

  return prompt
}

/* ================================================================== */
/*  Mock fallback helpers                                               */
/* ================================================================== */

function mockFrameLines(thinkingMode: ThinkingMode): string[] {
  return thinkingMode === "fast"
    ? ["Analyzing your request..."]
    : ["Framing the financial context...", "Identifying relevant factors and constraints.", "Establishing the gap to your goals."]
}

function mockInspectLines(
  loadedSkills: SkillContent[],
  failedSkills: string[],
  autoLoadedSkills: SkillMatch[],
): string[] {
  const lines: string[] = []
  if (autoLoadedSkills.length > 0) {
    lines.push(...autoLoadedSkills.map((m) => `🎯 Auto-loaded: ${m.skillId.replace(/_/g, " ")} (${m.relevance}/10)`))
  }
  if (loadedSkills.length > 0) {
    lines.push(`${loadedSkills.length} skill(s) loaded — institutional knowledge available.`)
  }
  if (failedSkills.length > 0) {
    lines.push(`⚠️ Could not load: ${failedSkills.join(", ")}`)
  }
  return lines
}

function mockResearchLines(thinkingMode: ThinkingMode): string[] {
  return thinkingMode === "fast"
    ? ["Checking market context..."]
    : ["Assessing market conditions and recent data.", "Cross-referencing with available research.", "Confidence assessment in progress."]
}

/* ================================================================== */
/*  useAgentThinking                                                   */
/* ================================================================== */

interface UseAgentThinkingOptions {
  onReply?: (message: AgentMessage) => void
  activeSkillIds?: string[]
  thinkingMode?: ThinkingMode
  tokenMode?: TokenMode
  /** Currently selected model ID — if null, falls back to mock */
  modelId?: string | null
}

interface UseAgentThinkingReturn {
  isThinking: boolean
  steps: StepStatus[]
  totalElapsed: number
  send: (userText: string) => void
  cancel: () => void
}

export function useAgentThinking({
  onReply,
  activeSkillIds = [],
  thinkingMode = "full",
  tokenMode = "normal",
  modelId = null,
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
  const abortRef = React.useRef<AbortController | null>(null)

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
    abortRef.current?.abort()
    setIsThinking(false)
    resetSteps()
  }, [clearTimers, resetSteps])

  React.useEffect(() => cancel, [cancel])

  const send = React.useCallback(
    async (userText: string) => {
      if (!userText.trim()) return
      clearTimers()
      abortRef.current?.abort()
      resetSteps()
      setIsThinking(true)
      accumulatedElapsedRef.current = 0
      currentStepIdxRef.current = -1

      // ── Skill routing + loading ──
      const autoMatches = activeSkillIds.length === 0
        ? routeToSkills(userText, activeSkillIds)
        : []

      const allSkillIds = [...activeSkillIds, ...autoMatches.map((m) => m.skillId)]

      let loadedSkills: SkillContent[] = []
      const failedSkills: string[] = []
      if (allSkillIds.length > 0) {
        try {
          const skillMap = await fetchSkillContents(allSkillIds)
          loadedSkills = Array.from(skillMap.values())
          for (const id of allSkillIds) {
            if (!skillMap.has(id)) failedSkills.push(id)
          }
        } catch {
          console.warn("[useAgentThinking] Failed to load skill contents")
          failedSkills.push(...allSkillIds)
        }
      }

      // ── Build system prompt ──
      const systemPrompt = buildSystemPrompt(loadedSkills, autoMatches, thinkingMode, tokenMode)

      // ── Run F.I.R.M. steps ──
      const MOCK_STEP_MS = thinkingMode === "fast" ? [400, 300, 500] : [800, 600, 1000]

      // Step 1: Frame
      const runFrame = () => {
        const frameLines = mockFrameLines(thinkingMode)
        currentStepIdxRef.current = 0
        stepStartRef.current = performance.now()
        setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, state: "running", text: frameLines[0] } : s))
        frameLines.slice(1).forEach((line, i) => {
          timersRef.current.push(setTimeout(() => {
            setSteps((prev) => prev.map((s, j) => j === 0 ? { ...s, text: line } : s))
          }, (i + 1) * 200))
        })
        const tick = () => {
          setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, elapsed: (performance.now() - stepStartRef.current) / 1000 } : s))
          if (currentStepIdxRef.current === 0) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        const done = () => {
          setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, state: "done", elapsed: MOCK_STEP_MS[0] / 1000, text: frameLines[frameLines.length - 1] } : s))
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
          accumulatedElapsedRef.current += MOCK_STEP_MS[0]
          runInspect()
        }
        timersRef.current.push(setTimeout(done, MOCK_STEP_MS[0]))
      }

      // Step 2: Inspect
      const runInspect = () => {
        const lines = mockInspectLines(loadedSkills, failedSkills, autoMatches)
        currentStepIdxRef.current = 1
        stepStartRef.current = performance.now()
        setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, state: "running", text: lines[0] ?? "" } : s))
        lines.slice(1).forEach((line, i) => {
          timersRef.current.push(setTimeout(() => {
            setSteps((prev) => prev.map((s, j) => j === 1 ? { ...s, text: line } : s))
          }, (i + 1) * 200))
        })
        const tick = () => {
          setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, elapsed: (performance.now() - stepStartRef.current) / 1000 } : s))
          if (currentStepIdxRef.current === 1) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        const done = () => {
          setSteps((prev) => prev.map((s, i) => i === 1 ? { ...s, state: "done", elapsed: MOCK_STEP_MS[1] / 1000, text: lines[lines.length - 1] ?? "" } : s))
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
          accumulatedElapsedRef.current += MOCK_STEP_MS[1]
          runResearch()
        }
        timersRef.current.push(setTimeout(done, MOCK_STEP_MS[1]))
      }

      // Step 3: Research
      const runResearch = () => {
        const lines = mockResearchLines(thinkingMode)
        currentStepIdxRef.current = 2
        stepStartRef.current = performance.now()
        setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, state: "running", text: lines[0] } : s))
        lines.slice(1).forEach((line, i) => {
          timersRef.current.push(setTimeout(() => {
            setSteps((prev) => prev.map((s, j) => j === 2 ? { ...s, text: line } : s))
          }, (i + 1) * 200))
        })
        const tick = () => {
          setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, elapsed: (performance.now() - stepStartRef.current) / 1000 } : s))
          if (currentStepIdxRef.current === 2) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        const done = () => {
          setSteps((prev) => prev.map((s, i) => i === 2 ? { ...s, state: "done", elapsed: MOCK_STEP_MS[2] / 1000, text: lines[lines.length - 1] } : s))
          if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
          accumulatedElapsedRef.current += MOCK_STEP_MS[2]
          runCall()
        }
        timersRef.current.push(setTimeout(done, MOCK_STEP_MS[2]))
      }

      // Step 4: Call — real API or mock fallback
      const runCall = async () => {
        currentStepIdxRef.current = 3
        stepStartRef.current = performance.now()
        setSteps((prev) => prev.map((s, i) => i === 3 ? { ...s, state: "running", text: "" } : s))

        const messages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ]

        let responseText = ""

        if (!modelId) {
          // ── Mock fallback — no model configured ──
          responseText = mockFallbackResponse(loadedSkills, tokenMode, userText)
          setSteps((prev) =>
            prev.map((s, i) => i === 3 ? { ...s, text: responseText } : s)
          )
          finishCall(responseText)
          return
        }

        // ── Real API call with streaming ──
        const abortController = new AbortController()
        abortRef.current = abortController

        try {
          for await (const token of streamModel(modelId, messages, {
            temperature: 0.4,
            systemPrompt,
            signal: abortController.signal,
          })) {
            responseText += token
            setSteps((prev) =>
              prev.map((s, i) => i === 3 ? { ...s, text: responseText } : s)
            )
          }
        } catch (_err) {
          if (abortController.signal.aborted) {
            responseText += "\n\n[Request cancelled.]"
          } else {
            responseText = mockFallbackResponse(loadedSkills, tokenMode, userText)
            setSteps((prev) =>
              prev.map((s, i) => i === 3 ? { ...s, text: responseText } : s)
            )
          }
        }

        finishCall(responseText)
      }

      const finishCall = (finalText: string) => {
        const callElapsed = (performance.now() - stepStartRef.current) / 1000
        setSteps((prev) =>
          prev.map((s, i) =>
            i === 3
              ? { ...s, state: "done", elapsed: callElapsed, text: finalText }
              : s
          )
        )
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        setIsThinking(false)

        const totalElapsed = accumulatedElapsedRef.current / 1000 + callElapsed
        const finalSteps = firmSteps.map((s, i) => ({
          key: s.key,
          label: s.label,
          hint: s.hint,
          state: "done" as const,
          elapsed: 0,
          text: "",
        }))
        // Use current steps state via callback
        setSteps((current) => {
          const reply: AgentMessage = {
            id: `agent-${Date.now()}`,
            role: "agent",
            text: finalText,
            thinking: current,
            thinkingElapsed: totalElapsed,
            createdAt: Date.now(),
          }
          onReplyRef.current?.(reply)
          return current
        })
      }

      // ── Kick off the F.I.R.M. pipeline ──
      runFrame()
    },
    [clearTimers, resetSteps, activeSkillIds, thinkingMode, tokenMode, modelId],
  )

  const totalElapsed = React.useMemo(
    () => steps.reduce((acc, s) => acc + s.elapsed, 0),
    [steps],
  )

  return {
    isThinking,
    steps,
    totalElapsed,
    send,
    cancel,
  }
}

/* ================================================================== */
/*  Mock fallback — used when no model is configured                   */
/* ================================================================== */

function mockFallbackResponse(loadedSkills: SkillContent[], tokenMode: TokenMode, userText: string): string {
  const skillNote = loadedSkills.length > 0
    ? `Skills loaded: ${loadedSkills.map((s) => s.skillId).join(", ")}`
    : "Add an API key in Settings → AI Models"
  const prefix = `[Mock — no model configured. ${skillNote}]\n\n`
  const userQuestion = userText.length > 0 ? `You asked: "${userText.slice(0, 200)}${userText.length > 200 ? "..." : ""}"\n\n` : ""

  const base = userQuestion + "I'd analyze this properly with a real model connected. For now, here's what I can tell you:"

  switch (tokenMode) {
    case "normal":
      return `${prefix}${base}\n\nBased on general financial principles, I'd recommend reviewing your current positions, checking your allocation against your targets, and considering any rebalancing needs. Connect a model via Settings → AI Models for personalized analysis.`
    case "compressed":
      return `${prefix}${base}\nCheck positions vs targets, review allocations, consider rebalancing. Connect a model for specifics.`
    case "ultra":
      return `${prefix}${base}\nReview positions + allocations, check rebalance needs. Connect model for details.`
    case "bare":
      return `${prefix}${base}\nCheck allocations. Connect model.`
  }
}
