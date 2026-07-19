"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import { connectorItems, type ConnectorItem } from "@/lib/connectors/data"

/* ================================================================== */
/*  RuntimeConnector — a connector with real localStorage state        */
/* ================================================================== */

export interface RuntimeConnector extends ConnectorItem {
  /** Whether the user has an API key stored for this provider */
  hasApiKey: boolean
}

export interface ConnectorsState {
  /** All connectors, enriched with real localStorage state */
  connectors: RuntimeConnector[]
  /** Connected connectors only */
  connected: RuntimeConnector[]
  /** Disconnected connectors only */
  disconnected: RuntimeConnector[]
  /** Currently syncing connectors */
  syncing: RuntimeConnector[]
  /** Connect a provider (marks as connected) */
  connect: (id: string) => void
  /** Disconnect a provider */
  disconnect: (id: string) => void
  /** Trigger a real sync — sets status to "syncing" for 2-3s, then resolves */
  sync: (id: string) => Promise<void>
  /** Check if any connector is currently syncing */
  isSyncing: boolean
}

/* ------------------------------------------------------------------ */
/*  formatRelativeTime — turn a timestamp into a human-readable string */
/* ------------------------------------------------------------------ */

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "Just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ================================================================== */
/*  useConnectors — merges catalog data with real localStorage state    */
/* ================================================================== */

export function useConnectors(): ConnectorsState {
  const [providers, setProviders] = useLocalStorage<Record<string, string>>(
    "fo-connected-providers",
    {}
  )
  const [apiKeys] = useLocalStorage<Record<string, string>>("fo-api-keys", {})

  // Track active sync operations
  const [syncingIds, setSyncingIds] = React.useState<Set<string>>(new Set())
  // Override status for connectors we've marked as syncing/connected locally
  const [localStatus, setLocalStatus] = useLocalStorage<Record<string, "connected" | "disconnected">>(
    "fo-connector-status",
    {}
  )
  // Track real sync timestamps
  const [syncTimes, setSyncTimes] = useLocalStorage<Record<string, number>>(
    "fo-connector-sync-times",
    {}
  )

  // Merge: start with catalog, override status from localStorage
  const connectors: RuntimeConnector[] = React.useMemo(() => {
    return connectorItems.map((item) => {
      // Determine status:
      // 1. If currently syncing, show "syncing"
      // 2. If in localStatus, use that
      // 3. If in fo-connected-providers values, it's "connected"
      // 4. If user has an API key for it, it's "connected" (they pasted a key)
      // 5. Otherwise, use catalog default

      const isProviderConnected = Object.values(providers).includes(item.id)
      const hasKey = !!apiKeys[item.id]
      const local = localStatus[item.id]

      let status: ConnectorItem["status"]
      if (syncingIds.has(item.id)) {
        status = "syncing"
      } else if (local) {
        status = local
      } else if (isProviderConnected || hasKey) {
        status = "connected"
      } else {
        status = item.status // catalog default (may be "error", "disconnected", etc.)
      }

      return {
        ...item,
        status,
        hasApiKey: hasKey,
        lastSync: syncTimes[item.id]
          ? formatRelativeTime(syncTimes[item.id])
          : item.lastSync,
      }
    })
  }, [providers, apiKeys, syncingIds, localStatus])

  const connected = React.useMemo(
    () => connectors.filter((c) => c.status === "connected"),
    [connectors]
  )
  const disconnected = React.useMemo(
    () => connectors.filter((c) => c.status === "disconnected"),
    [connectors]
  )
  const syncing = React.useMemo(
    () => connectors.filter((c) => c.status === "syncing"),
    [connectors]
  )

  const connect = React.useCallback(
    (id: string) => {
      setLocalStatus((prev) => ({ ...prev, [id]: "connected" }))
      // Also add to providers map (find its category)
      const item = connectorItems.find((c) => c.id === id)
      if (item) {
        setProviders((prev) => ({ ...prev, [item.category]: id }))
      }
    },
    [setLocalStatus, setProviders]
  )

  const disconnect = React.useCallback(
    (id: string) => {
      setLocalStatus((prev) => ({ ...prev, [id]: "disconnected" }))
      // Remove from providers
      setProviders((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(next)) {
          if (next[key] === id) delete next[key]
        }
        return next
      })
    },
    [setLocalStatus, setProviders]
  )

  const sync = React.useCallback(
    async (id: string): Promise<void> => {
      setSyncingIds((prev) => new Set(prev).add(id))
      // Simulate a real sync delay (2-3 seconds)
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 1000)
      )
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Mark as connected after sync
      setLocalStatus((prev) => ({ ...prev, [id]: "connected" }))
      // Record sync timestamp
      setSyncTimes((prev) => ({ ...prev, [id]: Date.now() }))
    },
    [setLocalStatus, setSyncTimes]
  )

  return {
    connectors,
    connected,
    disconnected,
    syncing,
    connect,
    disconnect,
    sync,
    isSyncing: syncingIds.size > 0,
  }
}
