"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Key,
  Lock,
  TrendingUp,
  Landmark,
  CreditCard,
  Cpu,
  Check,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Plug,
  BarChart3,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/lib/use-local-storage"
import { availableModels } from "@/lib/agents"
import {
  validatePassword,
  generateKey,
  getStrength,
} from "@/lib/setup/validation"

/* ================================================================== */
/*  Step definitions                                                    */
/* ================================================================== */

interface StepDef {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: StepDef[] = [
  { id: "welcome", title: "Welcome", description: "Your locally hosted financial command center", icon: Sparkles },
  { id: "auth-key", title: "Authorization Key", description: "Protects app access and trade execution", icon: Key },
  { id: "encrypt-key", title: "Encryption Key", description: "Encrypts all local data at rest", icon: Lock },
  { id: "connect", title: "Connect Accounts", description: "Link your financial accounts", icon: Plug },
  { id: "model", title: "Select LLM", description: "Choose your AI model", icon: Cpu },
  { id: "tour", title: "App Tour", description: "How to use Finance OS", icon: LayoutDashboard },
  { id: "done", title: "All Set", description: "You're ready to go", icon: Check },
]

/* ================================================================== */
/*  Shared UI primitives                                                */
/* ================================================================== */

function StepLabel({ step, index, current }: { step: StepDef; index: number; current: number }) {
  const Icon = step.icon
  const isActive = index === current
  const isDone = index < current
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200",
      isActive && "bg-white/[0.06]",
      isDone && "opacity-50"
    )}>
      <div className={cn(
        "flex h-5 w-5 items-center justify-center rounded-md text-[9px]",
        isActive ? "bg-[#818CF8]/20 text-[#818CF8]" : isDone ? "bg-[#34D399]/15 text-[#34D399]" : "bg-white/[0.04] text-white/[0.25]"
      )}>
        {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      </div>
      <span className={cn("text-[10px]", isActive ? "text-white font-medium" : "text-white/[0.30]")}>
        {step.title}
      </span>
    </div>
  )
}

function StrengthBar({ value }: { value: string }) {
  const strength = getStrength(value)
  const colors = ["#F87171", "#FBBF24", "#FBBF24", "#34D399"]
  const labels = ["Weak", "Fair", "Good", "Strong"]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{ backgroundColor: i < strength ? colors[strength] : "rgba(255,255,255,0.06)" }}
          />
        ))}
      </div>
      {value.length > 0 && (
        <span className="text-[10px] font-medium" style={{ color: colors[strength] }}>
          {labels[strength]}
        </span>
      )}
    </div>
  )
}

function RuleChecks({ results }: { results: { label: string; passed: boolean }[] }) {
  return (
    <div className="space-y-1.5">
      {results.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <div className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full",
            r.passed ? "bg-[#34D399]/15 text-[#34D399]" : "bg-white/[0.04] text-white/[0.20]"
          )}>
            {r.passed ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
          </div>
          <span className={cn("text-[11px]", r.passed ? "text-[#34D399]" : "text-white/[0.35]")}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ================================================================== */
/*  Step 1: Welcome                                                     */
/* ================================================================== */

function WelcomeStep() {
  const agents = [
    { icon: TrendingUp, label: "Portfolio Agent", desc: "Monitors holdings and suggests rebalancing moves.", color: "#818CF8" },
    { icon: CreditCard, label: "Debt Agent", desc: "Builds payoff plans and prioritizes high-interest accounts.", color: "#FBBF24" },
    { icon: PiggyBank, label: "Retirement Agent", desc: "Projects readiness and recommends contribution adjustments.", color: "#67E8F9" },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-[20px] font-semibold text-white">Welcome to Finance OS</h2>
        <p className="text-[13px] text-white/[0.45]">Your locally hosted personal finance intelligence.</p>
      </div>
      <div className="space-y-2.5">
        {agents.map((a) => {
          const Icon = a.icon
          return (
            <div key={a.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${a.color}15` }}>
                <Icon className="h-4.5 w-4.5" style={{ color: a.color }} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">{a.label}</p>
                <p className="text-[11px] text-white/[0.40]">{a.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-white/[0.35]">
        All data stays local. Your keys never leave this machine.
      </div>
    </div>
  )
}

/* PiggyBank import missing from lucide for the welcome step — use inline */
function PiggyBank(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z" />
      <path d="M2 9v1c0 1.1.9 2 2 2h1" />
      <path d="M16.5 13.5c.8-.8 2.5-1 3-1" />
    </svg>
  )
}

/* ================================================================== */
/*  Step 2 & 3: Key setup (Authorization / Encryption)                  */
/* ================================================================== */

function KeySetupStep({
  title,
  description,
  storageKey,
  onValid,
}: {
  title: string
  description: string
  storageKey: string
  onValid: (valid: boolean) => void
}) {
  const [value, setValue] = useLocalStorage(storageKey, "")
  const [showKey, setShowKey] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const { valid, results } = validatePassword(value)

  React.useEffect(() => { onValid(valid) }, [valid, onValid])

  const handleGenerate = () => {
    const key = generateKey()
    setValue(key)
    setShowKey(true)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-[20px] font-semibold text-white">{title}</h2>
        <p className="text-[13px] text-white/[0.45]">{description}</p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3.5 py-3">
        <AlertTriangle className="h-4 w-4 text-[#FBBF24] shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-medium text-[#FBBF24]">Save this key now.</p>
          <p className="text-[11px] text-white/[0.40] mt-0.5">
            Store it in a password manager. If you lose it, your encrypted data cannot be recovered.
          </p>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#818CF8]/20 bg-[#818CF8]/10 px-4 py-2.5 text-[12px] font-medium text-[#818CF8] transition-all hover:bg-[#818CF8]/15 active:scale-[0.98]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate secure key
      </button>

      {/* Or paste your own */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-white/[0.25] uppercase tracking-wider">or paste your own</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste or type your key…"
          className={cn(
            "w-full rounded-lg border bg-white/[0.02] px-4 py-3 pr-20 font-mono text-[13px] text-white outline-none transition-colors",
            "placeholder:text-white/[0.20] focus:border-[#818CF8]/30",
            valid && value ? "border-[#34D399]/30" : "border-white/[0.08]"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/[0.35] hover:text-white/[0.65] transition-colors"
          >
            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/[0.35] hover:text-white/[0.65] transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Strength + rules */}
      {value && (
        <div className="space-y-3">
          <StrengthBar value={value} />
          <RuleChecks results={results} />
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Step 4: Connect Accounts                                            */
/* ================================================================== */

const accountProviders = {
  portfolio: [
    { id: "schwab", label: "Schwab" },
    { id: "fidelity", label: "Fidelity" },
    { id: "vanguard", label: "Vanguard" },
    { id: "robinhood", label: "Robinhood" },
    { id: "etrade", label: "E*TRADE" },
  ],
  bank: [
    { id: "chase", label: "Chase" },
    { id: "boa", label: "Bank of America" },
    { id: "wells-fargo", label: "Wells Fargo" },
    { id: "citi", label: "Citibank" },
    { id: "capital-one", label: "Capital One" },
  ],
  debt: [
    { id: "sofi", label: "SoFi" },
    { id: "navient", label: "Navient" },
    { id: "sallie-mae", label: "Sallie Mae" },
    { id: "rocket", label: "Rocket Mortgage" },
    { id: "amex", label: "American Express" },
  ],
}

const providerSetupSteps: Record<string, { steps: string[]; url: string }> = {
  schwab: { steps: ["Go to developer.schwab.com and create an app", "Copy your Client ID and Secret", "Paste your API key below"], url: "https://developer.schwab.com" },
  fidelity: { steps: ["Visit Fidelity Developer Portal", "Register for API access", "Generate and copy your API key"], url: "https://www.fidelity.com" },
  vanguard: { steps: ["Log in to Vanguard", "Navigate to Account Settings → API Access", "Request a personal access token"], url: "https://www.vanguard.com" },
  robinhood: { steps: ["Go to Robinhood Settings → API Access", "Generate a read-only API token", "Paste the token below"], url: "https://robinhood.com" },
  etrade: { steps: ["Visit E*TRADE Developer Center", "Create an OAuth application", "Copy your Consumer Key and Secret"], url: "https://developer.etrade.com" },
  chase: { steps: ["Log in to Chase", "Go to Security → Account Access", "Generate a data-sharing token"], url: "https://www.chase.com" },
  boa: { steps: ["Log in to Bank of America", "Navigate to Security & Privacy", "Enable API access and copy token"], url: "https://www.bankofamerica.com" },
  "wells-fargo": { steps: ["Log in to Wells Fargo", "Go to Account Settings → Data Sharing", "Create a read-only access token"], url: "https://www.wellsfargo.com" },
  citi: { steps: ["Visit Citi Developer Portal", "Register your application", "Copy your Client ID and API key"], url: "https://developer.citi.com" },
  "capital-one": { steps: ["Go to Capital One DevExchange", "Create an account and new project", "Copy your API credentials"], url: "https://developer.capitalone.com" },
  sofi: { steps: ["Log in to SoFi", "Go to Settings → API Access", "Generate a personal access token"], url: "https://www.sofi.com" },
  navient: { steps: ["Log in to Navient", "Navigate to Account Settings", "Request API access and copy key"], url: "https://www.navient.com" },
  "sallie-mae": { steps: ["Log in to Sallie Mae", "Go to Account → Developer Tools", "Generate a read-only API key"], url: "https://www.salliemae.com" },
  rocket: { steps: ["Log in to Rocket Mortgage", "Navigate to Account → API Access", "Create a data sharing token"], url: "https://www.rocketmortgage.com" },
  amex: { steps: ["Log in to American Express", "Go to Account → Data Sharing", "Enable API access and copy key"], url: "https://www.americanexpress.com" },
}

function ConnectStep() {
  const [selectedCategory, setSelectedCategory] = React.useState<"portfolio" | "bank" | "debt">("portfolio")
  const [selectedProviders, setSelectedProviders] = useLocalStorage<Record<string, string>>("fo-connected-providers", {})
  const [apiKeys, setApiKeys] = useLocalStorage<Record<string, string>>("fo-api-keys", {})
  const [showKey, setShowKey] = React.useState<string | null>(null)

  const categories = [
    { id: "portfolio" as const, label: "Portfolio", icon: TrendingUp, color: "#818CF8" },
    { id: "bank" as const, label: "Bank", icon: Landmark, color: "#34D399" },
    { id: "debt" as const, label: "Debt", icon: CreditCard, color: "#FBBF24" },
  ]

  const providers = accountProviders[selectedCategory]

  const handleSelectProvider = (providerId: string) => {
    setSelectedProviders((prev) => ({ ...prev, [selectedCategory]: providerId }))
  }

  const handleApiKey = (providerId: string, key: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: key }))
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-[20px] font-semibold text-white">Connect Accounts</h2>
        <p className="text-[13px] text-white/[0.45]">Link your financial accounts. You can add more later in Settings.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-white" : "text-white/[0.40] hover:text-white/[0.60]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="connect-tab"
                  className="absolute inset-0 rounded-md bg-white/[0.06] border border-white/[0.08]"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative">{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Provider list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {providers.map((p) => {
          const isSelected = selectedProviders[selectedCategory] === p.id
          const hasKey = !!apiKeys[p.id]
          const setup = providerSetupSteps[p.id]
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border transition-all",
                isSelected
                  ? "border-[#818CF8]/25 bg-[#818CF8]/5"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectProvider(p.id)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  isSelected ? "bg-[#818CF8]/20 text-[#818CF8]" : "bg-white/[0.04] text-white/[0.40]"
                )}>
                  {p.label[0]}
                </div>
                <span className={cn("text-[13px] font-medium", isSelected ? "text-white" : "text-white/[0.65]")}>
                  {p.label}
                </span>
                {hasKey && <Check className="ml-auto h-3.5 w-3.5 text-[#34D399]" />}
              </button>

              {/* Setup steps + API key (shown when selected) */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.04] px-3.5 py-3 space-y-3">
                      {/* Install steps */}
                      {setup && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-white/[0.30]">Setup steps</p>
                          {setup.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-[9px] text-white/[0.35]">
                                {i + 1}
                              </span>
                              <span className="text-[11px] text-white/[0.50]">{step}</span>
                            </div>
                          ))}
                          <a
                            href={setup.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#818CF8] hover:underline mt-1"
                          >
                            Open {p.label} →
                          </a>
                        </div>
                      )}

                      {/* API key input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-white/[0.30]">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showKey === p.id ? "text" : "password"}
                            value={apiKeys[p.id] || ""}
                            onChange={(e) => handleApiKey(p.id, e.target.value)}
                            placeholder="Paste your API key…"
                            className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 pr-10 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-white/[0.20] focus:border-[#818CF8]/30"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(showKey === p.id ? null : p.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/[0.35] hover:text-white/[0.65]"
                          >
                            {showKey === p.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Skip note */}
      <p className="text-[10px] text-white/[0.25] text-center">
        You can skip this and connect accounts later in Settings → Connectors.
      </p>
    </div>
  )
}

/* ================================================================== */
/*  Step 5: Select LLM Model                                           */
/* ================================================================== */

const setupModels = [
  ...availableModels,
  { id: "gpt-4o", label: "GPT-4o", vendor: "OpenAI", description: "Fast, multimodal." },
  { id: "gemini-2", label: "Gemini 2.5 Pro", vendor: "Google", description: "Large context, reasoning." },
  { id: "deepseek-r1", label: "DeepSeek R1", vendor: "DeepSeek", description: "Open-weight reasoning." },
  { id: "qwen-3", label: "Qwen 3 72B", vendor: "Alibaba", description: "Multilingual, open." },
  { id: "mistral-large", label: "Mistral Large 3", vendor: "Mistral", description: "Fast, European." },
]

function ModelStep() {
  const [selected, setSelected] = useLocalStorage<string>("fo-selected-model", availableModels[0].id)
  const [customUrl, setCustomUrl] = useLocalStorage<string>("fo-custom-model-url", "")
  const [showCustom, setShowCustom] = React.useState(false)

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-[20px] font-semibold text-white">Select AI Model</h2>
        <p className="text-[13px] text-white/[0.45]">Choose which model powers your agents. Local models keep data private.</p>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {setupModels.map((m) => {
          const isActive = selected === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => { setSelected(m.id); setShowCustom(false) }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                isActive && !showCustom
                  ? "border-[#818CF8]/25 bg-[#818CF8]/5"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                isActive && !showCustom ? "bg-[#818CF8]/15 text-[#818CF8]" : "bg-white/[0.04] text-white/[0.40]"
              )}>
                <Cpu className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-white">{m.label}</span>
                  {isActive && !showCustom && <Check className="h-3.5 w-3.5 text-[#818CF8]" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">{m.vendor}</span>
                  <span className="text-[9px] text-white/[0.20]">·</span>
                  <span className="text-[10px] text-white/[0.40]">{m.description}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom URL */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition-all",
            showCustom
              ? "border-[#A78BFA]/25 bg-[#A78BFA]/5"
              : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            <Sparkles className="h-4 w-4 text-[#A78BFA]" />
          </div>
          <div>
            <span className="text-[12px] font-medium text-white">Custom endpoint</span>
            <p className="text-[10px] text-white/[0.35]">Connect any OpenAI-compatible API</p>
          </div>
        </button>
        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <label className="text-[10px] uppercase tracking-wider text-white/[0.30]">API Base URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1 or https://api.example.com"
                  className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-white/[0.20] focus:border-[#A78BFA]/30"
                />
                <label className="text-[10px] uppercase tracking-wider text-white/[0.30]">Model name</label>
                <input
                  type="text"
                  placeholder="e.g. llama3:70b, gpt-4-turbo"
                  className="w-full rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-white/[0.20] focus:border-[#A78BFA]/30"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip */}
      <p className="text-[10px] text-white/[0.25] text-center">
        You can change this later in Settings → AI Model.
      </p>
    </div>
  )
}

/* ================================================================== */
/*  Step 6: App Tour                                                    */
/* ================================================================== */

function TourStep() {
  const features = [
    { icon: LayoutDashboard, label: "Dashboard", desc: "Portfolio, debt, news, and agents at a glance.", color: "#818CF8" },
    { icon: MessageSquare, label: "Agent Chat", desc: "Click an orb to start a conversation with any agent.", color: "#FBBF24" },
    { icon: BarChart3, label: "Analytics", desc: "Agent health, connector status, and usage stats.", color: "#34D399" },
    { icon: Brain, label: "Memory", desc: "Search past chats, context files, and system prompts.", color: "#67E8F9" },
    { icon: Settings, label: "Settings", desc: "Security keys, connectors, notifications, and model config.", color: "#F87171" },
    { icon: Plug, label: "Connectors", desc: "Link and manage financial account connections.", color: "#A78BFA" },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-[20px] font-semibold text-white">How to Use Finance OS</h2>
        <p className="text-[13px] text-white/[0.45]">Everything is accessible from the sidebar.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.label} className="flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${f.color}15` }}>
                <Icon className="h-3.5 w-3.5" style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white">{f.label}</p>
                <p className="text-[10px] text-white/[0.35] mt-0.5">{f.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-white/[0.35]">
        <span className="text-white/[0.50] font-medium">Tip:</span> Press <kbd className="rounded border border-white/[0.08] bg-white/[0.03] px-1 py-0.5 font-mono text-[10px] mx-0.5">⌘B</kbd> to toggle the sidebar from anywhere.
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Step 7: All Set                                                     */
/* ================================================================== */

function DoneStep() {
  const authKey = typeof window !== "undefined" ? localStorage.getItem("fo-auth-key") : null
  const encryptKey = typeof window !== "undefined" ? localStorage.getItem("fo-encryption-key") : null
  const providers = typeof window !== "undefined" ? localStorage.getItem("fo-connected-providers") : null
  const model = typeof window !== "undefined" ? localStorage.getItem("fo-selected-model") : null

  const connectedCount = (() => {
    try {
      return providers ? Object.keys(JSON.parse(providers)).length : 0
    } catch { return 0 }
  })()

  const checkItems = [
    { label: "Authorization key set", done: !!authKey },
    { label: "Encryption key set", done: !!encryptKey },
    { label: connectedCount > 0 ? `${connectedCount} account(s) connected` : "Accounts (optional — connect later)", done: connectedCount > 0 || true },
    { label: "AI model selected", done: !!model },
  ]

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
          <Check className="h-6 w-6 text-[#34D399]" />
        </div>
        <h2 className="text-[20px] font-semibold text-white">You're All Set</h2>
        <p className="text-[13px] text-white/[0.45]">Finance OS is configured and ready to go.</p>
      </div>

      <div className="space-y-2">
        {checkItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
            <div className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              item.done ? "bg-[#34D399]/15 text-[#34D399]" : "bg-white/[0.06] text-white/[0.25]"
            )}>
              {item.done ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}
            </div>
            <span className={cn("text-[12px]", item.done ? "text-white/[0.65]" : "text-white/[0.35]")}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-white/[0.35]">
        <span className="text-white/[0.50] font-medium">Tip:</span> You can re-run setup anytime from Settings → Security → Setup Checklist.
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SetupWizard — main component                                        */
/* ================================================================== */

interface SetupWizardProps {
  open: boolean
  onClose: () => void
}

export function SetupWizard({ open, onClose }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [authValid, setAuthValid] = React.useState(false)
  const [encryptValid, setEncryptValid] = React.useState(false)

  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case 0: return true  // Welcome
      case 1: return authValid  // Auth key
      case 2: return encryptValid  // Encryption key
      case 3: return true  // Connect (optional)
      case 4: return true  // Model (always has default)
      case 5: return true  // Tour
      case 6: return true  // Done
      default: return true
    }
  }, [currentStep, authValid, encryptValid])

  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      // Mark setup complete
      localStorage.setItem("fo-setup-complete", "true")
      onClose()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#08090C]/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-4 z-[101] m-auto flex max-h-[680px] max-w-[560px] flex-col rounded-2xl border border-white/[0.08] bg-[#0C0D12]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="shrink-0 border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/[0.30]">
                  Setup · Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-[10px] text-white/[0.25]">
                  {steps[currentStep].title}
                </span>
              </div>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 flex-1 rounded-full"
                    style={{
                      backgroundColor: i <= currentStep ? "#818CF8" : "rgba(255,255,255,0.06)",
                    }}
                    layoutId={i === currentStep ? "wizard-progress" : undefined}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                ))}
              </div>
            </div>

            {/* Step sidebar + content */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar — step list */}
              <div className="hidden w-[160px] shrink-0 border-r border-white/[0.04] p-3 space-y-0.5 overflow-y-auto sm:block">
                {steps.map((step, i) => (
                  <StepLabel key={step.id} step={step} index={i} current={currentStep} />
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {currentStep === 0 && <WelcomeStep />}
                    {currentStep === 1 && (
                      <KeySetupStep
                        title="Authorization Key"
                        description="Protects app access and trade execution."
                        storageKey="fo-auth-key"
                        onValid={setAuthValid}
                      />
                    )}
                    {currentStep === 2 && (
                      <KeySetupStep
                        title="Encryption Key"
                        description="Encrypts all local data at rest."
                        storageKey="fo-encryption-key"
                        onValid={setEncryptValid}
                      />
                    )}
                    {currentStep === 3 && <ConnectStep />}
                    {currentStep === 4 && <ModelStep />}
                    {currentStep === 5 && <TourStep />}
                    {currentStep === 6 && <DoneStep />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation */}
            <div className="shrink-0 border-t border-white/[0.06] px-5 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium transition-all",
                  currentStep === 0
                    ? "text-white/[0.15] cursor-not-allowed"
                    : "text-white/[0.55] hover:text-white hover:bg-white/[0.04] active:scale-[0.97]"
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-5 py-2 text-[12px] font-medium transition-all active:scale-[0.97]",
                  canProceed
                    ? isLastStep
                      ? "bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/25 hover:bg-[#34D399]/20"
                      : "bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/25 hover:bg-[#818CF8]/20"
                    : "bg-white/[0.03] text-white/[0.20] border border-white/[0.06] cursor-not-allowed"
                )}
              >
                {isLastStep ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
