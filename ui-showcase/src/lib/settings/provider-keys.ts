/* ================================================================== */
/*  Provider credential storage — localStorage-backed                 */
/*                                                                      */
/*  Keys are stored in `fo-provider-keys` as a JSON object:             */
/*    { "openai": "sk-...", "anthropic": "sk-ant-...", ... }            */
/*                                                                      */
/*  Last-verified timestamps in `fo-provider-verified`:                 */
/*    { "openai": 1720454400000, ... }                                  */
/* ================================================================== */

import { availableProviders, type ProviderOption, type ModelOption } from "@/lib/agents"

const PROVIDER_KEYS_KEY = "fo-provider-keys"
const PROVIDER_VERIFIED_KEY = "fo-provider-verified"

/* ------------------------------------------------------------------ */
/*  Raw localStorage access                                            */
/* ------------------------------------------------------------------ */

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked — silently fail
  }
}

/* ------------------------------------------------------------------ */
/*  Provider API keys                                                   */
/* ------------------------------------------------------------------ */

/** Get a single provider's API key from localStorage */
export function getProviderKey(providerId: string): string | null {
  const keys = readJson<Record<string, string>>(PROVIDER_KEYS_KEY, {})
  return keys[providerId] || null
}

/** Save a provider's API key to localStorage */
export function saveProviderKey(providerId: string, key: string): void {
  const keys = readJson<Record<string, string>>(PROVIDER_KEYS_KEY, {})
  if (key.trim() === "") {
    delete keys[providerId]
  } else {
    keys[providerId] = key
  }
  writeJson(PROVIDER_KEYS_KEY, keys)
}

/** Remove a provider's API key */
export function removeProviderKey(providerId: string): void {
  const keys = readJson<Record<string, string>>(PROVIDER_KEYS_KEY, {})
  delete keys[providerId]
  writeJson(PROVIDER_KEYS_KEY, keys)
}

/** Get all configured API keys as a record */
export function getAllProviderKeys(): Record<string, string> {
  return readJson<Record<string, string>>(PROVIDER_KEYS_KEY, {})
}

/* ------------------------------------------------------------------ */
/*  Verification timestamps                                             */
/* ------------------------------------------------------------------ */

/** Get the last-verified timestamp for a provider (ms since epoch) */
export function getProviderVerified(providerId: string): number | null {
  const verified = readJson<Record<string, number>>(PROVIDER_VERIFIED_KEY, {})
  return verified[providerId] || null
}

/** Mark a provider's key as verified right now */
export function markProviderVerified(providerId: string): void {
  const verified = readJson<Record<string, number>>(PROVIDER_VERIFIED_KEY, {})
  verified[providerId] = Date.now()
  writeJson(PROVIDER_VERIFIED_KEY, verified)
}

/** Clear verification for a provider (e.g. after key change) */
export function clearProviderVerification(providerId: string): void {
  const verified = readJson<Record<string, number>>(PROVIDER_VERIFIED_KEY, {})
  delete verified[providerId]
  writeJson(PROVIDER_VERIFIED_KEY, verified)
}

/* ------------------------------------------------------------------ */
/*  Derived queries                                                     */
/* ------------------------------------------------------------------ */

/** Check if a provider has an API key stored */
export function isProviderConfigured(providerId: string): boolean {
  return getProviderKey(providerId) !== null
}

/** Check if a provider is local (no API key needed) */
export function isProviderLocal(providerId: string): boolean {
  const provider = availableProviders.find((p) => p.id === providerId)
  return provider?.local ?? false
}

/** Check if a provider is ready to use (has key OR is local) */
export function isProviderReady(providerId: string): boolean {
  if (isProviderLocal(providerId)) return true
  return isProviderConfigured(providerId)
}

/**
 * Returns all providers that are ready for use (key configured or local).
 * Useful for filtering the model picker to only show usable models.
 */
export function getReadyProviders(): ProviderOption[] {
  return availableProviders.filter((p) => isProviderReady(p.id))
}

/**
 * Returns all models from providers that have keys configured (or are local).
 * This is the source of truth for which models the agent can actually call.
 */
export function getEnabledModels(): ModelOption[] {
  return getReadyProviders().flatMap((p) => p.models)
}

/**
 * Returns a provider's status as a human-readable string:
 * - "connected" if key is set and verified
 * - "needs-key" if no key and not local
 * - "unverified" if key is set but not verified
 * - "local" if it's a local provider
 */
export type ProviderStatus = "connected" | "needs-key" | "unverified" | "local"

export function getProviderStatus(providerId: string): ProviderStatus {
  if (isProviderLocal(providerId)) return "local"
  if (!isProviderConfigured(providerId)) return "needs-key"
  if (getProviderVerified(providerId) === null) return "unverified"
  return "connected"
}

/** Get a provider's setup URL (where users get API keys). Falls back to null. */
export function getProviderSetupUrl(providerId: string): string | null {
  return availableProviders.find((p) => p.id === providerId)?.setupUrl ?? null
}

/** Get a provider's display name. Falls back to the providerId. */
export function getProviderName(providerId: string): string {
  return availableProviders.find((p) => p.id === providerId)?.name ?? providerId
}
