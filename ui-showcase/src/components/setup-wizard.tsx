"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Building2, CreditCard, Landmark, ShieldCheck, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Onboarding,
  ChoiceGroup,
  FeatureCarousel,
  TipsList,
  useOnboarding,
} from "@/components/ui/onboarding"

const STEP_CONFIG = [
  {
    title: "Welcome to Finance OS",
    description: "Your locally hosted financial command center.",
  },
  {
    title: "Connect your accounts",
    description: "Securely link portfolio, bank, and debt accounts.",
  },
  {
    title: "You're ready",
    description: "A few tips before you open your dashboard.",
  },
]

const FEATURES = [
  {
    id: "portfolio",
    icon: TrendingUp,
    title: "Portfolio Agent",
    description:
      "Monitors holdings across brokerages and suggests rebalancing moves.",
  },
  {
    id: "debt",
    icon: CreditCard,
    title: "Debt Agent",
    description:
      "Builds payoff plans and prioritizes high-interest accounts.",
  },
  {
    id: "retirement",
    icon: Landmark,
    title: "Retirement Agent",
    description:
      "Projects readiness and recommends contribution adjustments.",
  },
] as const

const ACCOUNT_TYPES = [
  { id: "brokerage", label: "Brokerage", icon: TrendingUp },
  { id: "bank", label: "Bank", icon: Landmark },
  { id: "retirement", label: "Retirement", icon: Wallet },
  { id: "debt", label: "Debt", icon: CreditCard },
  { id: "other", label: "Other", icon: Building2 },
] as const

const TIPS = [
  {
    number: 1,
    text: "All data stays local. Your encryption key never leaves this machine.",
  },
  {
    number: 2,
    text: "Agents run offline with Ollama. Paid LLMs are optional.",
  },
  {
    number: 3,
    text: "Trade execution is opt-in and requires your authorization key.",
  },
] as const

export default function SetupWizard() {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  return (
    <div className="relative z-0 grid h-full w-full place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <Onboarding
        totalSteps={3}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl"
      >
        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left panel — step number + progress */}
          <div className="flex flex-col justify-between border-b bg-muted/30 p-6 md:border-b-0 md:border-r">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Finance OS Setup
              </p>
              <StepNumber />
            </div>
            <Onboarding.StepIndicator className="justify-start" />
          </div>

          {/* Right panel — step content */}
          <div className="flex flex-col p-6 md:p-8">
            <div className="flex-1">
              <Onboarding.Step step={1}>
                <WelcomeStep />
              </Onboarding.Step>
              <Onboarding.Step step={2}>
                <AccountsStep
                  selected={selectedAccounts}
                  onChange={setSelectedAccounts}
                />
              </Onboarding.Step>
              <Onboarding.Step step={3}>
                <TipsStep />
              </Onboarding.Step>
            </div>
            <Onboarding.Navigation className="mt-8" />
          </div>
        </div>
      </Onboarding>
    </div>
  )
}

function StepNumber() {
  const { currentStep, totalSteps } = useOnboarding()
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-6xl font-semibold tracking-tighter text-foreground">
        {currentStep}
      </span>
      <span className="text-lg text-muted-foreground">/ {totalSteps}</span>
    </div>
  )
}

function WelcomeStep() {
  const { stepValue, setStepValue } = useOnboarding()
  return (
    <div className="flex h-full flex-col gap-6">
      <Onboarding.Header
        title={STEP_CONFIG[0].title}
        description={STEP_CONFIG[0].description}
      />
      <FeatureCarousel
        value={stepValue}
        onValueChange={setStepValue}
        totalItems={FEATURES.length}
        className="flex flex-col gap-3"
      >
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon
          const isActive = stepValue === index
          return (
            <FeatureCarousel.Item
              key={feature.id}
              index={index}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                isActive
                  ? "border-primary/30 bg-primary/10"
                  : "border-transparent hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {feature.title}
                </p>
                {isActive && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                )}
              </div>
            </FeatureCarousel.Item>
          )
        })}
      </FeatureCarousel>
    </div>
  )
}

function AccountsStep({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (value: string[]) => void
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <Onboarding.Header
        title={STEP_CONFIG[1].title}
        description={STEP_CONFIG[1].description}
      />
      <div className="grid grid-cols-2 gap-3">
        {ACCOUNT_TYPES.map((account) => {
          const Icon = account.icon
          const isSelected = selected.includes(account.id)
          return (
            <button
              key={account.id}
              onClick={() => toggle(account.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-primary/30 bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {account.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <ShieldCheck className="size-4" />
        You can add or remove accounts later in Settings.
      </div>
    </div>
  )
}

function TipsStep() {
  return (
    <div className="flex h-full flex-col gap-6">
      <Onboarding.Header
        title={STEP_CONFIG[2].title}
        description={STEP_CONFIG[2].description}
      />
      <TipsList
        title="Tips"
        className="flex flex-col gap-4"
      >
        {TIPS.map((tip) => (
          <TipsList.Item
            key={tip.number}
            number={tip.number}
            className="flex items-start gap-3"
          >
            <p className="text-sm leading-relaxed text-foreground">
              {tip.text}
            </p>
          </TipsList.Item>
        ))}
      </TipsList>
    </div>
  )
}
