"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  ExternalLink,
  Server,
  AlertCircle,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ProviderOption, type ModelOption } from "@/lib/agents"

/* ================================================================== */
/*  Provider status badge                                              */
/* ================================================================== */

type ProviderStatus = "needs-key" | "key-saved" | "verified" | "local"

function statusConfig(status: ProviderStatus): { label: string; color: string; bg: string; dot: string; icon: LucideIcon } {
  switch (status) {
    case "needs-key":
      return { label: "Needs API Key", color: "#F87171", bg: "bg-[#F87171]/10", dot: "bg-[#F87171]", icon: AlertCircle }
    case "key-saved":
      return { label: "Key Saved (Untested)", color: "#FBBF24", bg: "bg-[#FBBF24]/10", dot: "bg-[#FBBF24]", icon: Clock }
    case "verified":
      return { label: "Verified", color: "#34D399", bg: "bg-[#34D399]/10", dot: "bg-[#34D399]", icon: Check }
    case "local":
      return { label: "Local", color: "#67E8F9", bg: "bg-[#67E8F9]/10", dot: "bg-[#67E8F9]", icon: Server }
  }
}

function formatVerified(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

/* ================================================================== */
/*  ProviderIcon — first-letter avatar with provider color             */
/* ================================================================== */

const providerColors: Record<string, string> = {
  openai: "#10A37F",
  anthropic: "#D97757",
  google: "#4285F4",
  groq: "#F55036",
  together: "#0F6CBD",
  mistral: "#F97316",
  deepseek: "#4D6BFE",
  xai: "#1DA1F2",
  cohere: "#39594D",
  local: "#67E8F9",
  openrouter: "#8B5CF6",
}

function ProviderIcon({ providerId, name }: { providerId: string; name: string }) {
  const color = providerColors[providerId] ?? "#818CF8"
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {name[0].toUpperCase()}
    </div>
  )
}

/* ================================================================== */
/*  Model toggle row                                                   */
/* ================================================================== */

function ModelToggleRow({
  model,
  enabled,
  onToggle,
}: {
  model: ModelOption
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100",
        enabled ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"
      )}
    >
      {/* Checkbox */}
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          enabled
            ? "border-[#818CF8] bg-[#818CF8]"
            : "border-white/[0.15] bg-transparent"
        )}
      >
        {enabled && <Check className="h-2.5 w-2.5 text-white" />}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-white">{model.label}</span>
          {model.strengths.slice(0, 2).map((s) => (
            <span
              key={s}
              className="rounded-full bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[8px] font-medium text-white/[0.45]"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/[0.35]">{model.pricing}</span>
          <span className="text-[9px] text-white/[0.20]">·</span>
          <span className="text-[10px] text-white/[0.30]">{model.contextWindow} ctx</span>
        </div>
      </div>
    </button>
  )
}

/* ================================================================== */
/*  ProviderCard                                                       */
/* ================================================================== */

export interface ProviderCardProps {
  provider: ProviderOption
  /** Current API key from localStorage */
  apiKey: string
  /** Called when the API key changes */
  onKeyChange: (key: string) => void
  /** Last verified timestamp (ms) — null unless genuinely verified by a real API call */
  verified: number | null
  /** Set of enabled model IDs */
  enabledModels: Set<string>
  /** Toggle a model on/off */
  onToggleModel: (modelId: string) => void
}

export function ProviderCard({
  provider,
  apiKey,
  onKeyChange,
  verified,
  enabledModels,
  onToggleModel,
}: ProviderCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [showKey, setShowKey] = React.useState(false)

  const isLocal = provider.local
  const hasKey = apiKey.length > 0
  const isVerified = verified !== null

  const status: ProviderStatus = isLocal
    ? "local"
    : isVerified
      ? "verified"
      : hasKey
        ? "key-saved"
        : "needs-key"

  const sc = statusConfig(status)

  const enabledCount = provider.models.filter((m) => enabledModels.has(m.id)).length

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        expanded
          ? "border-white/[0.10] bg-white/[0.04]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
      )}
    >
      {/* ── Header (click to expand) ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <ProviderIcon providerId={provider.id} name={provider.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white">{provider.name}</span>
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                sc.bg
              )}
              style={{ color: sc.color }}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
              {sc.label}
            </span>
            {/* Model count */}
            {enabledCount > 0 && (
              <span className="text-[10px] text-white/[0.30]">
                {enabledCount} model{enabledCount !== 1 ? "s" : ""} enabled
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-white/[0.35]">{provider.baseUrl}</p>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/[0.35] transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* ── Expanded content ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
              {/* ── API Key input (non-local only) ── */}
              {!isLocal && (
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.10em] text-white/[0.35]">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => onKeyChange(e.target.value)}
                        placeholder={`Paste your ${provider.name} API key…`}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 pl-3 pr-10 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-white/[0.18] focus:border-[#818CF8]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/[0.35] hover:text-white/[0.65] transition-colors"
                        aria-label={showKey ? "Hide key" : "Show key"}
                      >
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Key stored indicator — keys auto-save on every keystroke */}
                    {hasKey && (
                      <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#34D399]/20 bg-[#34D399]/5 px-3 text-[11px] font-medium text-[#34D399]">
                        <Check className="h-3 w-3" />
                        Stored
                      </span>
                    )}
                  </div>

                  {/* Verified timestamp — only shown when genuinely verified */}
                  {isVerified && (
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#34D399]" />
                      <span className="text-[10px] text-[#34D399]">
                        Last verified: {formatVerified(verified!)}
                      </span>
                    </div>
                  )}

                  {/* Key saved but not verified hint */}
                  {hasKey && !isVerified && (
                    <p className="text-[10px] text-white/[0.25]">
                      Key saved locally. Real API verification coming in a future update.
                    </p>
                  )}

                  {/* Get API key link */}
                  <a
                    href={provider.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#67E8F9]/70 hover:text-[#67E8F9] transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Get your {provider.name} API key
                  </a>
                </div>
              )}

              {/* ── Local provider status ── */}
              {isLocal && (
                <div className="flex items-center gap-2 rounded-lg border border-[#67E8F9]/20 bg-[#67E8F9]/5 px-3 py-2.5">
                  <Server className="h-3.5 w-3.5 text-[#67E8F9]" />
                  <span className="text-[12px] font-medium text-[#67E8F9]">
                    {provider.name}
                  </span>
                  <span className="text-[11px] text-white/[0.40]">
                    · {provider.baseUrl}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#67E8F9] ml-auto" />
                </div>
              )}

              {/* ── Available models ── */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.10em] text-white/[0.35] px-1">
                  Available Models
                </label>
                {provider.models.map((model) => (
                  <ModelToggleRow
                    key={model.id}
                    model={model}
                    enabled={enabledModels.has(model.id)}
                    onToggle={() => onToggleModel(model.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
