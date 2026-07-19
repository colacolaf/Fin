"use client"

import { useConnectors } from "@/lib/settings/use-connectors"
import { getAllSyncedData, type SyncedRetirementData } from "@/lib/connectors/sync-data"

/**
 * Checks whether any retirement provider connector is connected,
 * and returns the synced retirement data if available.
 */
export function useRetirementConnection() {
  const { connectors } = useConnectors()

  const retirementIds = [
    "vanguard",
    "fidelity",
    "schwab",
    "tiaa",
    "empower",
    "principal",
    "t-rowe-price",
    "american-funds",
  ]

  const connectedRetirement = connectors.filter(
    (c) => retirementIds.includes(c.id) && c.status === "connected"
  )

  // Find the most recently synced retirement data
  const allData = typeof window !== "undefined" ? getAllSyncedData() : {}
  let syncedData: SyncedRetirementData | null = null

  for (const provider of connectedRetirement) {
    const d = allData[provider.id]
    if (d && d.category === "retirement") {
      if (!syncedData || d.data.lastSynced > syncedData.lastSynced) {
        syncedData = d.data
      }
    }
  }

  return {
    isConnected: connectedRetirement.length > 0,
    connectedRetirement,
    syncedData,
  }
}
