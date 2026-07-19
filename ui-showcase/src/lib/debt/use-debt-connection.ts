"use client"

import { useConnectors } from "@/lib/settings/use-connectors"

/**
 * Checks whether any bank or credit-card connector is connected.
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

  return {
    isConnected: connectedBanks.length > 0,
    connectedBanks,
  }
}
