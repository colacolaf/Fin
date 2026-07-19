"use client"

import { useConnectors } from "@/lib/settings/use-connectors"

/**
 * Checks whether any brokerage or portfolio-related connector is connected.
 * Returns `isConnected: true` if at least one brokerage connector has real
 * localStorage state (API key, provider connection, or explicit status).
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

  return {
    isConnected: connectedBrokers.length > 0,
    connectedBrokers,
  }
}
