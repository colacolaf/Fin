/* ================================================================== */
/*  lib/connectors/sync-data.ts                                        */
/*                                                                      */
/*  Generates realistic mock financial data when a connector syncs.     */
/*  Data is stored in fo-connector-data in localStorage and read by     */
/*  connection hooks to feed live dashboards.                           */
/* ================================================================== */

import type { ConnectorCategory } from "./data"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface SyncedHoldings {
  ticker: string
  name: string
  shares: number
  price: number
  value: number
  allocation: number
}

export interface SyncedPortfolioData {
  totalValue: number
  cashBalance: number
  dayChange: number
  dayChangePercent: number
  totalReturn: number
  totalReturnPercent: number
  holdings: SyncedHoldings[]
  lastSynced: number
  connectorId: string
  connectorName: string
}

export interface SyncedDebtItem {
  id: string
  name: string
  type: "credit-card" | "student-loan" | "personal-loan" | "mortgage" | "auto-loan"
  balance: number
  apr: number
  monthlyPayment: number
  minPayment: number
}

export interface SyncedDebtData {
  totalDebt: number
  monthlyPayment: number
  weightedApr: number
  estimatedDebtFree: string
  items: SyncedDebtItem[]
  lastSynced: number
  connectorId: string
  connectorName: string
}

export interface SyncedRetirementData {
  totalBalance: number
  monthlyContribution: number
  employerMatch: number
  employerMatchPercent: number
  annualReturn: number
  projectedAtRetirement: number
  vestedBalance: number
  lastSynced: number
  connectorId: string
  connectorName: string
}

export interface SyncedBankingData {
  checkingBalance: number
  savingsBalance: number
  totalBalance: number
  recentTransactions: { date: string; description: string; amount: number }[]
  lastSynced: number
  connectorId: string
  connectorName: string
}

export type SyncedConnectorData =
  | { category: "brokerage" | "crypto"; data: SyncedPortfolioData }
  | { category: "credit" | "loans"; data: SyncedDebtData }
  | { category: "retirement"; data: SyncedRetirementData }
  | { category: "banking"; data: SyncedBankingData }

/* ------------------------------------------------------------------ */
/*  All synced data — one key per connector                            */
/* ------------------------------------------------------------------ */

const DATA_KEY = "fo-connector-data"

export function getSyncedData(connectorId: string): SyncedConnectorData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    const all = JSON.parse(raw) as Record<string, SyncedConnectorData>
    return all[connectorId] ?? null
  } catch {
    return null
  }
}

export function getAllSyncedData(): Record<string, SyncedConnectorData> {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SyncedConnectorData>
  } catch {
    return {}
  }
}

function saveSyncedData(connectorId: string, data: SyncedConnectorData): void {
  try {
    const all = getAllSyncedData()
    all[connectorId] = data
    localStorage.setItem(DATA_KEY, JSON.stringify(all))
  } catch {
    // storage full
  }
}

/* ------------------------------------------------------------------ */
/*  Data generators — realistic mock data per category                 */
/* ------------------------------------------------------------------ */

const PORTFOLIO_TEMPLATES: SyncedPortfolioData[] = [
  {
    totalValue: 284_750,
    cashBalance: 12_430,
    dayChange: 1_245,
    dayChangePercent: 0.44,
    totalReturn: 42_180,
    totalReturnPercent: 17.4,
    holdings: [
      { ticker: "AAPL", name: "Apple Inc.", shares: 85, price: 198.42, value: 16_866, allocation: 5.9 },
      { ticker: "MSFT", name: "Microsoft Corp.", shares: 42, price: 442.57, value: 18_588, allocation: 6.5 },
      { ticker: "VTI", name: "Vanguard Total Stock Market ETF", shares: 320, price: 287.12, value: 91_878, allocation: 32.3 },
      { ticker: "VXUS", name: "Vanguard Total Intl Stock ETF", shares: 180, price: 63.41, value: 11_414, allocation: 4.0 },
      { ticker: "BND", name: "Vanguard Total Bond Market ETF", shares: 400, price: 73.24, value: 29_296, allocation: 10.3 },
      { ticker: "NVDA", name: "NVIDIA Corp.", shares: 55, price: 142.80, value: 7_854, allocation: 2.8 },
      { ticker: "GOOGL", name: "Alphabet Inc.", shares: 30, price: 192.11, value: 5_763, allocation: 2.0 },
      { ticker: "AMZN", name: "Amazon.com Inc.", shares: 25, price: 228.33, value: 5_708, allocation: 2.0 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  {
    totalValue: 156_200,
    cashBalance: 8_920,
    dayChange: -432,
    dayChangePercent: -0.28,
    totalReturn: 22_340,
    totalReturnPercent: 14.3,
    holdings: [
      { ticker: "SPY", name: "SPDR S&P 500 ETF", shares: 110, price: 583.41, value: 64_175, allocation: 41.1 },
      { ticker: "QQQ", name: "Invesco QQQ Trust", shares: 75, price: 496.32, value: 37_224, allocation: 23.8 },
      { ticker: "AAPL", name: "Apple Inc.", shares: 40, price: 198.42, value: 7_937, allocation: 5.1 },
      { ticker: "TSLA", name: "Tesla Inc.", shares: 20, price: 362.18, value: 7_244, allocation: 4.6 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
]

const DEBT_TEMPLATES: Record<string, SyncedDebtData> = {
  amex: {
    totalDebt: 8_450,
    monthlyPayment: 450,
    weightedApr: 27.24,
    estimatedDebtFree: "Jan 2028",
    items: [
      { id: "amex-gold", name: "Amex Gold", type: "credit-card", balance: 4_200, apr: 27.24, monthlyPayment: 250, minPayment: 140 },
      { id: "amex-plat", name: "Amex Platinum", type: "credit-card", balance: 4_250, apr: 27.24, monthlyPayment: 200, minPayment: 128 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  chase: {
    totalDebt: 5_840,
    monthlyPayment: 320,
    weightedApr: 22.99,
    estimatedDebtFree: "Oct 2027",
    items: [
      { id: "chase-sapphire", name: "Chase Sapphire", type: "credit-card", balance: 3_200, apr: 22.99, monthlyPayment: 180, minPayment: 96 },
      { id: "chase-freedom", name: "Chase Freedom", type: "credit-card", balance: 2_640, apr: 22.99, monthlyPayment: 140, minPayment: 79 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  sofi: {
    totalDebt: 28_400,
    monthlyPayment: 587,
    weightedApr: 6.8,
    estimatedDebtFree: "Apr 2030",
    items: [
      { id: "sofi-student", name: "Student Loan Refi", type: "student-loan", balance: 18_500, apr: 5.49, monthlyPayment: 350, minPayment: 350 },
      { id: "sofi-personal", name: "Personal Loan", type: "personal-loan", balance: 9_900, apr: 9.99, monthlyPayment: 237, minPayment: 237 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  default: {
    totalDebt: 4_800,
    monthlyPayment: 280,
    weightedApr: 21.5,
    estimatedDebtFree: "Sep 2027",
    items: [
      { id: "default-card", name: "Credit Card", type: "credit-card", balance: 4_800, apr: 21.5, monthlyPayment: 280, minPayment: 144 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
}

const RETIREMENT_TEMPLATES: SyncedRetirementData[] = [
  {
    totalBalance: 342_000,
    monthlyContribution: 1_200,
    employerMatch: 480,
    employerMatchPercent: 4.0,
    annualReturn: 8.2,
    projectedAtRetirement: 1_850_000,
    vestedBalance: 342_000,
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  {
    totalBalance: 187_500,
    monthlyContribution: 850,
    employerMatch: 340,
    employerMatchPercent: 4.0,
    annualReturn: 7.5,
    projectedAtRetirement: 920_000,
    vestedBalance: 156_000,
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
]

const BANKING_TEMPLATES: SyncedBankingData[] = [
  {
    checkingBalance: 8_420,
    savingsBalance: 24_600,
    totalBalance: 33_020,
    recentTransactions: [
      { date: "2026-07-18", description: "Direct Deposit - Employer", amount: 4_250 },
      { date: "2026-07-17", description: "Amazon.com", amount: -87.42 },
      { date: "2026-07-16", description: "Netflix Subscription", amount: -15.99 },
      { date: "2026-07-15", description: "Transfer to Savings", amount: -500 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
  {
    checkingBalance: 3_150,
    savingsBalance: 12_800,
    totalBalance: 15_950,
    recentTransactions: [
      { date: "2026-07-18", description: "Direct Deposit - Employer", amount: 2_850 },
      { date: "2026-07-17", description: "Rent Payment", amount: -1_800 },
      { date: "2026-07-15", description: "Uber Eats", amount: -34.50 },
      { date: "2026-07-14", description: "Coffee Shop", amount: -5.75 },
    ],
    lastSynced: 0,
    connectorId: "",
    connectorName: "",
  },
]

/* ------------------------------------------------------------------ */
/*  generateSyncData — returns realistic mock data for a connector     */
/* ------------------------------------------------------------------ */

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h) + id.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function generateSyncData(
  connectorId: string,
  connectorName: string,
  category: ConnectorCategory,
): SyncedConnectorData {
  const h = hashId(connectorId)
  const now = Date.now()

  switch (category) {
    case "brokerage":
    case "crypto": {
      const base = { ...PORTFOLIO_TEMPLATES[h % PORTFOLIO_TEMPLATES.length] }
      base.lastSynced = now
      base.connectorId = connectorId
      base.connectorName = connectorName
      // Add slight variation based on connector hash
      const variation = 1 + ((h % 20) - 10) / 100 // ±10%
      base.totalValue = Math.round(base.totalValue * variation)
      base.dayChange = Math.round(base.dayChange * variation)
      return { category, data: base }
    }

    case "credit":
    case "loans": {
      const template = DEBT_TEMPLATES[connectorId] ?? DEBT_TEMPLATES.default
      const base = { ...template }
      base.lastSynced = now
      base.connectorId = connectorId
      base.connectorName = connectorName
      return { category, data: base }
    }

    case "retirement": {
      const base = { ...RETIREMENT_TEMPLATES[h % RETIREMENT_TEMPLATES.length] }
      base.lastSynced = now
      base.connectorId = connectorId
      base.connectorName = connectorName
      const variation = 1 + ((h % 16) - 8) / 100
      base.totalBalance = Math.round(base.totalBalance * variation)
      base.projectedAtRetirement = Math.round(base.projectedAtRetirement * variation)
      return { category, data: base }
    }

    case "banking": {
      const base = { ...BANKING_TEMPLATES[h % BANKING_TEMPLATES.length] }
      base.lastSynced = now
      base.connectorId = connectorId
      base.connectorName = connectorName
      return { category, data: base }
    }
  }
}

export function syncAndPersist(
  connectorId: string,
  connectorName: string,
  category: ConnectorCategory,
): SyncedConnectorData {
  const data = generateSyncData(connectorId, connectorName, category)
  saveSyncedData(connectorId, data)
  return data
}
