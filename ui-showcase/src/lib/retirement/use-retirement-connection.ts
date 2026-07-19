"use client"

import { useConnectors } from "@/lib/settings/use-connectors"

/**
 * Checks whether any retirement provider connector is connected.
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

  return {
    isConnected: connectedRetirement.length > 0,
    connectedRetirement,
  }
}
