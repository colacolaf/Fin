import * as React from "react"
import type { RetirementAccount, RetirementSummary, RetirementChartPoint } from "./types"
import { getAllSyncedData, type SyncedRetirementData } from "@/lib/connectors/sync-data"

/* ================================================================== */
/*  EMPTY DEFAULTS — zeroed / empty, ready for real data               */
/*  When a retirement connector is linked, swap these for API fetches. */
/* ================================================================== */

const emptyAccounts: RetirementAccount[] = []

const emptySummary: RetirementSummary = {
  totalSaved: 0,
  fundedPercentage: 0,
  projectedAnnualIncome: 0,
  targetRetirementAge: 65,
  currentAge: 0,
  yearsToRetirement: 0,
  monthlyGap: 0,
  neededAtRetirement: 0,
  employerMatchCaptured: 0,
  employerMatchAvailable: 0,
  socialSecurityEstimate: 0,
  monthlyContribution: 0,
  annualIncome: 0,
}

const emptyChartData: RetirementChartPoint[] = []

/* ================================================================== */
/*  MOCK DATA                                                         */
/* ================================================================== */

export const retirementAccounts: RetirementAccount[] = [
  {
    id: "401k",
    name: "Employer 401(k)",
    type: "401k",
    provider: "Fidelity",
    balance: 87_400,
    contributionRate: 12,
    employerMatch: 3_600,
    employerMatchMax: 4_200,
    vestedPercent: 80,
    color: "#818CF8",
  },
  {
    id: "roth",
    name: "Roth IRA",
    type: "roth_ira",
    provider: "Vanguard",
    balance: 32_100,
    contributionRate: 6,
    employerMatch: 0,
    employerMatchMax: 0,
    vestedPercent: 100,
    color: "#34D399",
  },
  {
    id: "ira",
    name: "Traditional IRA",
    type: "ira",
    provider: "Schwab",
    balance: 18_500,
    contributionRate: 0,
    employerMatch: 0,
    employerMatchMax: 0,
    vestedPercent: 100,
    color: "#FBBF24",
  },
  {
    id: "hsa",
    name: "HSA",
    type: "hsa",
    provider: "Optum",
    balance: 4_000,
    contributionRate: 3,
    employerMatch: 600,
    employerMatchMax: 1_000,
    vestedPercent: 100,
    color: "#67E8F9",
  },
]

export const retirementSummary: RetirementSummary = {
  totalSaved: 142_000,
  fundedPercentage: 68,
  projectedAnnualIncome: 48_000,
  targetRetirementAge: 65,
  currentAge: 43,
  yearsToRetirement: 22,
  monthlyGap: 580,
  neededAtRetirement: 210_000,
  employerMatchCaptured: 3_600,
  employerMatchAvailable: 4_200,
  socialSecurityEstimate: 24_000,
  monthlyContribution: 1_850,
  annualIncome: 95_000,
}

export const chartData: RetirementChartPoint[] = [
  { age: 43, projected: 142_000, target: 142_000, optimistic: 142_000, conservative: 142_000 },
  { age: 45, projected: 185_000, target: 165_000, optimistic: 195_000, conservative: 175_000 },
  { age: 47, projected: 232_000, target: 190_000, optimistic: 258_000, conservative: 210_000 },
  { age: 49, projected: 285_000, target: 218_000, optimistic: 332_000, conservative: 248_000 },
  { age: 51, projected: 342_000, target: 250_000, optimistic: 418_000, conservative: 290_000 },
  { age: 53, projected: 405_000, target: 286_000, optimistic: 518_000, conservative: 338_000 },
  { age: 55, projected: 475_000, target: 326_000, optimistic: 634_000, conservative: 390_000 },
  { age: 57, projected: 552_000, target: 370_000, optimistic: 768_000, conservative: 448_000 },
  { age: 59, projected: 638_000, target: 420_000, optimistic: 922_000, conservative: 512_000 },
  { age: 61, projected: 732_000, target: 476_000, optimistic: 1_100_000, conservative: 582_000 },
  { age: 63, projected: 836_000, target: 540_000, optimistic: 1_305_000, conservative: 658_000 },
  { age: 65, projected: 950_000, target: 610_000, optimistic: 1_540_000, conservative: 742_000 },
]

/* ================================================================== */
/*  useRetirementData — returns empty defaults until real data flows    */
/*  When a retirement connector is linked, replace the body with API.  */
/* ================================================================== */

export function useRetirementData() {
  const [data, setData] = React.useState({
    accounts: emptyAccounts as RetirementAccount[],
    summary: emptySummary,
    chartData: emptyChartData,
  })

  React.useEffect(() => {
    const all = typeof window !== "undefined" ? getAllSyncedData() : {}
    let synced: SyncedRetirementData | null = null
      for (const [, d] of Object.entries(all)) {
        if (d.category === "retirement") {
          if (!synced || d.data.lastSynced > synced.lastSynced) {
            synced = d.data
          }
        }
      }
      if (!synced) return

      setData({
        accounts: [
          {
            id: "401k", name: synced.connectorName, type: "401k" as const,
            provider: synced.connectorName, balance: synced.totalBalance,
            contributionRate: 12, employerMatch: synced.employerMatch,
            employerMatchMax: Math.round(synced.employerMatch / synced.employerMatchPercent * 100),
            vestedPercent: Math.round(synced.vestedBalance / synced.totalBalance * 100),
            color: "#818CF8",
          },
        ],
        summary: {
          totalSaved: synced.totalBalance,
          fundedPercentage: Math.min(95, Math.round(synced.totalBalance / synced.projectedAtRetirement * 100)),
          projectedAnnualIncome: Math.round(synced.projectedAtRetirement * 0.04),
          targetRetirementAge: 65,
          currentAge: 43,
          yearsToRetirement: 22,
          monthlyGap: Math.round(synced.projectedAtRetirement * 0.04 / 12 - synced.monthlyContribution),
          neededAtRetirement: synced.projectedAtRetirement,
          employerMatchCaptured: synced.employerMatch,
          employerMatchAvailable: Math.round(synced.employerMatch / synced.employerMatchPercent * 100),
          socialSecurityEstimate: 24000,
          monthlyContribution: synced.monthlyContribution,
          annualIncome: synced.monthlyContribution * 12 / 0.15,
        },
        chartData: emptyChartData,
      })
  }, [])

  return data
}
