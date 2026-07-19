"use client"

import { useConnectors } from "@/lib/settings/use-connectors"
import { getAllSyncedData, type SyncedDebtData } from "@/lib/connectors/sync-data"

/**
 * Checks whether any bank or credit-card connector is connected,
 * and returns the synced debt data if available.
 */
export function useDebtConnection() {
  const { connectors } = useConnectors()

  const bankIds = [
    "chase",
    "wells-fargo",
    "bank-of-america",
    "citi",
    "amex",
    "capital-one",
    "discover",
    "us-bank",
    "pnc",
    "td-bank",
    "sofi",
    "navy-federal",
    "truist",
    "usaa",
    "bmo",
  ]

  const connectedBanks = connectors.filter(
    (c) => bankIds.includes(c.id) && c.status === "connected"
  )

  // Find the most recently synced credit/loans data
  const allData = typeof window !== "undefined" ? getAllSyncedData() : {}
  let syncedData: SyncedDebtData | null = null

  for (const bank of connectedBanks) {
    const d = allData[bank.id]
    if (d && (d.category === "credit" || d.category === "loans")) {
      if (!syncedData || d.data.lastSynced > syncedData.lastSynced) {
        syncedData = d.data
      }
    }
  }

  return {
    isConnected: connectedBanks.length > 0,
    connectedBanks,
    syncedData,
  }
}
