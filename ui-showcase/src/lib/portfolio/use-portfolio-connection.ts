"use client"

import { useConnectors } from "@/lib/settings/use-connectors"
import { getAllSyncedData, type SyncedPortfolioData } from "@/lib/connectors/sync-data"

/**
 * Checks whether any brokerage or portfolio-related connector is connected,
 * and returns the synced portfolio data if available.
 */
export function usePortfolioConnection() {
  const { connectors } = useConnectors()

  // Brokerage-relevant connector IDs (from the catalog in lib/connectors/data.ts)
  const brokerageIds = [
    "schwab",
    "fidelity",
    "robinhood",
    "interactive-brokers",
    "etrade",
    "webull",
    "alpaca",
    "tastytrade",
    "vanguard",
    "merrill",
  ]

  const connectedBrokers = connectors.filter(
    (c) => brokerageIds.includes(c.id) && c.status === "connected"
  )

  // Find the most recently synced brokerage data
  const allData = typeof window !== "undefined" ? getAllSyncedData() : {}
  let syncedData: SyncedPortfolioData | null = null

  for (const broker of connectedBrokers) {
    const d = allData[broker.id]
    if (d && d.category === "brokerage") {
      if (!syncedData || d.data.lastSynced > syncedData.lastSynced) {
        syncedData = d.data
      }
    }
  }

  return {
    isConnected: connectedBrokers.length > 0,
    connectedBrokers,
    syncedData,
  }
}
