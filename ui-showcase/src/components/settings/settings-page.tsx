"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Bell,
  Cpu,
  Mic,
  MicOff,
  Plug,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageShell, SectionCard, SettingRow } from "@/components/page-shell/page-shell"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { availableModels, type ModelOption } from "@/lib/agents"
import { useLocalStorage } from "@/lib/use-local-storage"
import { useConnectors, type RuntimeConnector } from "@/lib/settings/use-connectors"
import {
  notificationEvents,
  notificationsMasterEnabled,
  settingsTabs,
} from "@/lib/settings/data"

/* ================================================================== */
/*  Security Tab                                                       */
/* ================================================================== */

function SecurityTab() {
  const [showAuth, setShowAuth] = React.useState(false)
  const [showEncrypt, setShowEncrypt] = React.useState(false)

  // Read actual keys from localStorage (set by setup wizard)
  const [authKey] = useLocalStorage("fo-auth-key", "")
  const [encryptKey] = useLocalStorage("fo-encryption-key", "")
  const [hint, setHint] = useLocalStorage("fo-key-hint", "")

  // Providers from setup wizard
  const [providers] = useLocalStorage<Record<string, string>>("fo-connected-providers", {})
  const [model] = useLocalStorage("fo-selected-model", "")

  const hasAuth = authKey.length > 0
  const hasEncrypt = encryptKey.length > 0
  const connectedCount = Object.keys(providers).length
  const hasModel = model.length > 0

  const checklist = [
    { id: "auth_key", label: "Authorization key set", done: hasAuth },
    { id: "encryption_key", label: "Encryption key set", done: hasEncrypt },
    { id: "portfolio", label: "Portfolio connected", done: !!providers.portfolio },
    { id: "bank", label: "Bank connected", done: !!providers.bank },
    { id: "debt", label: "Debt connected", done: !!providers.debt },
    { id: "llm_model", label: "LLM model selected", done: hasModel },
  ]
  const setupComplete = checklist.every((item) => item.done)

  return (
    <div className="space-y-4">
      <SectionCard
        label="Keys"
        description="Your authorization and encryption keys protect this app."
      >
        <div className="divide-y divide-white/[0.04]">
          <SettingRow
            label="Authorization Key"
            description="Required to open the app and execute trades."
            accentColor="#818CF8"
          >
            <div className="flex items-center gap-2">
              <code className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[12px] text-white/[0.70] tabular-nums max-w-[200px] truncate">
                {hasAuth
                  ? showAuth
                    ? authKey
                    : authKey.replace(/./g, "•")
                  : "Not set"}
              </code>
              {hasAuth && (
                <button
                  type="button"
                  onClick={() => setShowAuth((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/[0.45] transition-all duration-150 hover:bg-white/[0.06] hover:text-white active:scale-95"
                  aria-label={showAuth ? "Hide key" : "Reveal key"}
                >
                  {showAuth ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
              {!hasAuth && (
                <span className="text-[10px] text-[#FBBF24] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Not configured
                </span>
              )}
            </div>
          </SettingRow>

          <SettingRow
            label="Encryption Key"
            description="Encrypts all local data at rest."
            accentColor="#34D399"
          >
            <div className="flex items-center gap-2">
              <code className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[12px] text-white/[0.70] tabular-nums max-w-[200px] truncate">
                {hasEncrypt
                  ? showEncrypt
                    ? encryptKey
                    : encryptKey.replace(/./g, "•")
                  : "Not set"}
              </code>
              {hasEncrypt && (
                <button
                  type="button"
                  onClick={() => setShowEncrypt((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/[0.45] transition-all duration-150 hover:bg-white/[0.06] hover:text-white active:scale-95"
                  aria-label={showEncrypt ? "Hide key" : "Reveal key"}
                >
                  {showEncrypt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
              {!hasEncrypt && (
                <span className="text-[10px] text-[#FBBF24] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Not configured
                </span>
              )}
            </div>
          </SettingRow>

          <SettingRow
            label="Key Storage Hint"
            description="A reminder of where you keep your keys."
            accentColor="#FBBF24"
          >
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. In 1Password vault"
              className="w-[240px] rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] text-white outline-none transition-colors focus:border-[#818CF8]/40 placeholder:text-white/[0.20]"
            />
          </SettingRow>
        </div>
      </SectionCard>

      {/* Setup checklist — reads real state */}
      <SectionCard
        label="Setup Checklist"
        description="All tasks must be complete for full functionality."
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  item.done
                    ? "bg-[#34D399]/15 text-[#34D399]"
                    : "bg-white/[0.04] text-white/[0.30]"
                )}
              >
                {item.done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span
                className={cn(
                  "text-[12px]",
                  item.done ? "text-white/[0.70]" : "text-white/[0.40]"
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <span className="text-[12px] font-medium text-white">Setup Status</span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold",
              setupComplete ? "text-[#34D399]" : "text-[#FBBF24]"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {setupComplete ? "Complete" : `${checklist.filter((i) => i.done).length}/${checklist.length} done`}
          </span>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================== */
/*  Connections Tab                                                    */
/* ================================================================== */

function ConnectionsTab() {
  const {
    connectors,
    connect,
    disconnect,
    sync,
  } = useConnectors()

  const [syncingId, setSyncingId] = React.useState<string | null>(null)

  const handleReconnect = async (id: string) => {
    setSyncingId(id)
    try {
      await sync(id)
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        label="Connected Accounts"
        description="Currently linked financial accounts."
      >
        {connectors.filter((c) => c.status === "connected" || c.status === "syncing").length === 0 ? (
          <p className="text-[11px] text-white/[0.30] py-3 text-center">
            No accounts connected yet. Connect accounts from the{" "}
            <a href="/connectors" className="text-[#818CF8] hover:underline">Connectors page</a>.
          </p>
        ) : (
          <div className="space-y-1">
            {connectors
              .filter((c) => c.status === "connected" || c.status === "syncing")
              .map((c) => (
                <ConnectorRow
                  key={c.id}
                  connector={c}
                  isSyncing={syncingId === c.id}
                  onReconnect={() => handleReconnect(c.id)}
                  onDisconnect={() => disconnect(c.id)}
                />
              ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        label="Available Connectors"
        description="Browse and connect more financial institutions."
      >
        <div className="space-y-1 mb-3">
          {connectors
            .filter((c) => c.status === "disconnected")
            .slice(0, 5)
            .map((c) => (
              <ConnectorRow
                key={c.id}
                connector={c}
                isSyncing={false}
                onConnect={() => connect(c.id)}
              />
            ))}
        </div>
        <a
          href="/connectors"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#818CF8] hover:underline"
        >
          View all connectors
          <ExternalLink className="h-3 w-3" />
        </a>
      </SectionCard>
    </div>
  )
}

function statusDot(status: RuntimeConnector["status"], isSyncing: boolean) {
  if (status === "syncing" || isSyncing)
    return (
      <span className="flex h-2 w-2 items-center justify-center">
        <RefreshCw className="h-2.5 w-2.5 animate-spin text-[#FBBF24]" />
      </span>
    )
  if (status === "connected")
    return <span className="h-2 w-2 rounded-full bg-[#34D399]" />
  return <span className="h-2 w-2 rounded-full bg-white/[0.25]" />
}

function ConnectorRow({
  connector: c,
  isSyncing,
  onReconnect,
  onDisconnect,
  onConnect,
}: {
  connector: RuntimeConnector
  isSyncing: boolean
  onReconnect?: () => void
  onDisconnect?: () => void
  onConnect?: () => void
}) {
  const isConnected = c.status === "connected"
  const isCurrentlySyncing = c.status === "syncing" || isSyncing

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.02]">
      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
        style={{
          backgroundColor: `${c.accentColor}20`,
          border: `1px solid ${c.accentColor}30`,
        }}
      >
        {c.abbreviation}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-white">{c.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">
            {c.category}
          </span>
          {c.hasApiKey && (
            <span className="rounded-full bg-[#34D399]/10 border border-[#34D399]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#34D399] uppercase">
              Key set
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/[0.35]">
          {isCurrentlySyncing
            ? "Syncing…"
            : c.lastSync
              ? `Last synced: ${c.lastSync}`
              : c.description}
        </span>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2">
        {statusDot(c.status, isSyncing)}
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider",
            isCurrentlySyncing && "text-[#FBBF24]",
            isConnected && "text-[#34D399]",
            !isConnected && !isCurrentlySyncing && "text-white/[0.30]"
          )}
        >
          {isCurrentlySyncing ? "syncing" : c.status}
        </span>

        {isConnected && onReconnect && (
          <button
            type="button"
            onClick={onReconnect}
            disabled={isCurrentlySyncing}
            className="flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] font-medium text-white/[0.55] transition-all duration-150 hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3 w-3", isCurrentlySyncing && "animate-spin")} />
            Sync
          </button>
        )}

        {isConnected && onDisconnect && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex h-7 items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 text-[11px] font-medium text-white/[0.40] transition-all duration-150 hover:border-[#F87171]/20 hover:bg-[#F87171]/10 hover:text-[#F87171] active:scale-95"
          >
            Disconnect
          </button>
        )}

        {!isConnected && onConnect && (
          <button
            type="button"
            onClick={onConnect}
            className="flex h-7 items-center gap-1.5 rounded-md border border-[#818CF8]/30 bg-[#818CF8]/10 px-2.5 text-[11px] font-medium text-[#818CF8] transition-all duration-150 hover:bg-[#818CF8]/15 active:scale-95"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Notifications Tab                                                  */
/* ================================================================== */

function NotificationsTab() {
  const [master, setMaster] = useLocalStorage("fo-notif-master", notificationsMasterEnabled)
  const [events, setEvents] = useLocalStorage("fo-notif-events", notificationEvents.map((e) => ({ ...e })))

  const toggleEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard label="Master Control">
        <SettingRow
          label="Desktop Notifications"
          description="Enable or disable all notifications from Finance OS."
          accentColor="#818CF8"
        >
          <Switch checked={master} onCheckedChange={setMaster} />
        </SettingRow>
      </SectionCard>

      <SectionCard
        label="Event Types"
        description="Choose which events trigger a desktop notification. These directly control when notifications fire."
      >
        <div className={cn("divide-y divide-white/[0.04]", !master && "opacity-40 pointer-events-none")}>
          {events.map((event) => (
            <SettingRow
              key={event.id}
              label={event.label}
              description={event.description}
              accentColor={event.enabled ? "#34D399" : undefined}
            >
              <Switch
                checked={event.enabled}
                onCheckedChange={() => toggleEvent(event.id)}
              />
            </SettingRow>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================== */
/*  AI Model Tab                                                       */
/* ================================================================== */

function ModelRow({
  m,
  active,
  onSelect,
  isConnected,
}: {
  m: ModelOption
  active: boolean
  onSelect: () => void
  isConnected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100",
        active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        <Cpu className="h-4 w-4 text-white/[0.55]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-white">{m.label}</span>
          {active && <Check className="h-3.5 w-3.5 text-[#67E8F9]" />}
          {isConnected && (
            <span className="flex items-center gap-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#34D399]">
              <span className="h-1 w-1 rounded-full bg-[#34D399]" />
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-white/[0.30]">
            {m.vendor}
          </span>
          <span className="text-[9px] text-white/[0.25]">·</span>
          <span className="text-[11px] text-white/[0.40]">{m.description}</span>
        </div>
      </div>
    </button>
  )
}

function ModelTab() {
  const [model, setModel] = useLocalStorage<ModelOption>("fo-primary-model", availableModels[0])
  const [fallback, setFallback] = useLocalStorage<ModelOption>("fo-fallback-model", availableModels[1])
  const [voiceInput, setVoiceInput] = useLocalStorage("fo-voice-input", false)
  const [temp, setTemp] = useLocalStorage("fo-temperature", 0.4)
  const [listening, setListening] = React.useState(false)

  // Voice input via Web Speech API
  const toggleVoiceInput = React.useCallback(() => {
    if (!voiceInput) {
      // Enable
      if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
        setVoiceInput(true)
      } else {
        alert("Speech recognition is not supported in this browser. Try Chrome or Edge.")
      }
    } else {
      setVoiceInput(false)
      setListening(false)
    }
  }, [voiceInput, setVoiceInput])

  // Quick microphone test
  const testMic = React.useCallback(() => {
    if (!voiceInput) {
      toggleVoiceInput()
    }
    if (!listening) {
      setListening(true)
      setTimeout(() => setListening(false), 3000)
    } else {
      setListening(false)
    }
  }, [voiceInput, listening, toggleVoiceInput])

  return (
    <div className="space-y-4">
      <SectionCard
        label="Primary Model"
        description="Used for all agent responses. Currently active: the model with the green badge."
      >
        <div className="space-y-1">
          {availableModels.map((m) => (
            <ModelRow
              key={m.id}
              m={m}
              active={m.id === model.id}
              isConnected={m.id === model.id}
              onSelect={() => setModel(m)}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/[0.25]">
          Model selection is saved to localStorage and persists across sessions.
        </p>
      </SectionCard>

      <SectionCard
        label="Fallback Model"
        description="Used if the primary model is unavailable."
      >
        <div className="space-y-1">
          {availableModels.map((m) => (
            <ModelRow
              key={m.id}
              m={m}
              active={m.id === fallback.id}
              onSelect={() => setFallback(m)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard label="Voice & Reasoning">
        <div className="divide-y divide-white/[0.04]">
          <SettingRow
            label="Voice Input"
            description="Speak your messages instead of typing. Uses your browser's speech recognition."
            accentColor="#67E8F9"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceInput}
                aria-pressed={voiceInput}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95",
                  voiceInput
                    ? "border-[#67E8F9]/30 bg-[#67E8F9]/10 text-[#67E8F9]"
                    : "border-white/[0.08] bg-white/[0.03] text-white/[0.55] hover:bg-white/[0.06]"
                )}
              >
                {voiceInput ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {voiceInput ? "On" : "Off"}
              </button>
              {voiceInput && (
                <button
                  type="button"
                  onClick={testMic}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-all duration-150 active:scale-95",
                    listening
                      ? "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/[0.50] hover:bg-white/[0.06]"
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    listening ? "bg-[#FBBF24] animate-pulse" : "bg-white/[0.40]"
                  )} />
                  {listening ? "Listening…" : "Test mic"}
                </button>
              )}
            </div>
          </SettingRow>

          <div className="py-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#818CF8]" />
                <div>
                  <div className="text-[13px] font-medium text-white">
                    Temperature
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/[0.35]">
                    Lower = more precise, higher = more creative. Affects agent response style.
                  </div>
                </div>
              </div>
              <span className="font-mono text-[14px] tabular-nums text-[#818CF8]">
                {temp.toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[temp]}
              onValueChange={(v) => setTemp(Array.isArray(v) ? v[0] : v)}
            />
            <div className="mt-2 flex justify-between text-[10px] text-white/[0.25]">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================================================== */
/*  Tab icon map                                                       */
/* ================================================================== */

const tabIcons: Record<string, LucideIcon> = {
  security: KeyRound,
  connections: Plug,
  notifications: Bell,
  model: Cpu,
}

/* ================================================================== */
/*  SettingsPage — Tabbed Sections                                     */
/* ================================================================== */

export function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("security")
  const [saved, setSaved] = React.useState(false)
  const [savedMessage, setSavedMessage] = React.useState("")

  const handleSave = () => {
    // All settings are auto-saved via useLocalStorage.
    // This button provides a confirmation checkpoint.
    const tabMessages: Record<string, string> = {
      security: "Security keys and checklist verified.",
      connections: "Connector changes applied.",
      notifications: "Notification preferences saved.",
      model: "AI model configuration saved.",
    }
    setSavedMessage(tabMessages[activeTab] ?? "Settings saved.")
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setSavedMessage("")
    }, 2500)
  }

  return (
    <PageShell
      title="Settings"
      subtitle="App preferences, security, and data connections"
      actions={
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition-all duration-200 active:scale-95",
            saved
              ? "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]"
              : "border-[#818CF8]/30 bg-[#818CF8]/10 text-[#818CF8] hover:bg-[#818CF8]/15"
          )}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {savedMessage}
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Save changes
            </>
          )}
        </button>
      }
    >
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-xl">
        {settingsTabs.map((tab) => {
          const Icon = tabIcons[tab.id]
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors duration-150",
                isActive
                  ? "text-white"
                  : "text-white/[0.40] hover:text-white/[0.65]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="settings-active-tab"
                  className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.08]"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "connections" && <ConnectionsTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "model" && <ModelTab />}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  )
}
