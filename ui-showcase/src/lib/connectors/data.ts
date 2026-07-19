/* ================================================================== */
/*  Connector data — real financial institutions for the Card Grid page */
/*  In production these come from Plaid's institution list + user state. */
/* ================================================================== */

export type ConnectorCategory =
  | "banking"
  | "brokerage"
  | "retirement"
  | "credit"
  | "loans"
  | "crypto"

export const connectorCategories: { id: ConnectorCategory; label: string }[] = [
  { id: "banking", label: "Banking" },
  { id: "brokerage", label: "Brokerage" },
  { id: "retirement", label: "Retirement" },
  { id: "credit", label: "Credit" },
  { id: "loans", label: "Loans" },
  { id: "crypto", label: "Crypto" },
]

export interface ConnectorItem {
  id: string
  name: string
  category: ConnectorCategory
  description: string
  status: "connected" | "disconnected" | "syncing" | "error"
  /** Number of linked accounts (only shown when connected) */
  accountCount?: number
  /** Last sync time string (only shown when connected/syncing) */
  lastSync?: string
  /** Two-letter abbreviation shown in the icon square */
  abbreviation: string
  /** Accent color for the icon background */
  accentColor: string
  /** Whether this is a popular / recommended connector */
  popular?: boolean
}

export const connectorItems: ConnectorItem[] = [
  /* ---- Banking ---- */
  {
    id: "chase",
    name: "Chase",
    category: "banking",
    description: "Checking, savings, and credit accounts.",
    status: "connected",
    accountCount: 2,
    lastSync: "5m ago",
    abbreviation: "CH",
    accentColor: "#1A73E8",
    popular: true,
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo",
    category: "banking",
    description: "Checking, savings, mortgage, and home equity.",
    status: "disconnected",
    abbreviation: "WF",
    accentColor: "#CC0000",
  },
  {
    id: "bank-of-america",
    name: "Bank of America",
    category: "banking",
    description: "Checking, savings, and Merrill investment accounts.",
    status: "disconnected",
    abbreviation: "BA",
    accentColor: "#012169",
  },
  {
    id: "citi",
    name: "Citibank",
    category: "banking",
    description: "Checking, savings, and global accounts.",
    status: "disconnected",
    abbreviation: "CI",
    accentColor: "#003B70",
  },
  {
    id: "us-bank",
    name: "US Bank",
    category: "banking",
    description: "Checking, savings, and personal banking.",
    status: "disconnected",
    abbreviation: "US",
    accentColor: "#003087",
  },
  {
    id: "pnc",
    name: "PNC Bank",
    category: "banking",
    description: "Checking, savings, and virtual wallet.",
    status: "disconnected",
    abbreviation: "PN",
    accentColor: "#F47920",
  },
  {
    id: "capital-one-bank",
    name: "Capital One",
    category: "banking",
    description: "Checking, savings, and 360 accounts.",
    status: "disconnected",
    abbreviation: "CO",
    accentColor: "#004977",
    popular: true,
  },

  /* ---- Brokerage ---- */
  {
    id: "schwab",
    name: "Schwab",
    category: "brokerage",
    description: "Stocks, ETFs, mutual funds, and options.",
    status: "connected",
    accountCount: 3,
    lastSync: "2m ago",
    abbreviation: "SC",
    accentColor: "#00A0DC",
    popular: true,
  },
  {
    id: "fidelity",
    name: "Fidelity",
    category: "brokerage",
    description: "Stocks, ETFs, IRAs, and managed portfolios.",
    status: "disconnected",
    abbreviation: "FI",
    accentColor: "#4A9F4A",
    popular: true,
  },
  {
    id: "etrade",
    name: "E*TRADE",
    category: "brokerage",
    description: "Stocks, options, futures, and IRAs.",
    status: "disconnected",
    abbreviation: "ET",
    accentColor: "#6B2D8B",
  },
  {
    id: "robinhood",
    name: "Robinhood",
    category: "brokerage",
    description: "Commission-free stock, ETF, and crypto trading.",
    status: "disconnected",
    abbreviation: "RH",
    accentColor: "#00C805",
  },
  {
    id: "interactive-brokers",
    name: "Interactive Brokers",
    category: "brokerage",
    description: "Global stocks, options, futures, and forex.",
    status: "disconnected",
    abbreviation: "IB",
    accentColor: "#DC1431",
  },

  /* ---- Retirement ---- */
  {
    id: "vanguard",
    name: "Vanguard",
    category: "retirement",
    description: "401(k), IRA, and low-cost index funds.",
    status: "syncing",
    accountCount: 1,
    lastSync: "syncing now",
    abbreviation: "VG",
    accentColor: "#96232D",
    popular: true,
  },
  {
    id: "fidelity-retirement",
    name: "Fidelity",
    category: "retirement",
    description: "401(k), IRA, and employer retirement plans.",
    status: "disconnected",
    abbreviation: "FI",
    accentColor: "#4A9F4A",
  },
  {
    id: "empower",
    name: "Empower",
    category: "retirement",
    description: "401(k) and workplace retirement accounts.",
    status: "disconnected",
    abbreviation: "EM",
    accentColor: "#0072CE",
  },
  {
    id: "tiaa",
    name: "TIAA",
    category: "retirement",
    description: "403(b), IRA, and annuity accounts.",
    status: "disconnected",
    abbreviation: "TI",
    accentColor: "#005B82",
  },

  /* ---- Credit Cards ---- */
  {
    id: "amex",
    name: "American Express",
    category: "credit",
    description: "Credit cards, rewards, and membership points.",
    status: "connected",
    accountCount: 2,
    lastSync: "1m ago",
    abbreviation: "AE",
    accentColor: "#006FCF",
    popular: true,
  },
  {
    id: "discover",
    name: "Discover",
    category: "credit",
    description: "Cashback credit cards and banking.",
    status: "disconnected",
    abbreviation: "DI",
    accentColor: "#FF6600",
  },
  {
    id: "chase-credit",
    name: "Chase",
    category: "credit",
    description: "Sapphire, Freedom, and Ink credit cards.",
    status: "disconnected",
    abbreviation: "CH",
    accentColor: "#1A73E8",
  },
  {
    id: "citi-credit",
    name: "Citi",
    category: "credit",
    description: "ThankYou rewards and cashback cards.",
    status: "disconnected",
    abbreviation: "CI",
    accentColor: "#003B70",
  },

  /* ---- Loans ---- */
  {
    id: "sofi",
    name: "SoFi",
    category: "loans",
    description: "Student loans, refinancing, and personal loans.",
    status: "disconnected",
    abbreviation: "SF",
    accentColor: "#5B6EF7",
    popular: true,
  },
  {
    id: "navient",
    name: "Navient",
    category: "loans",
    description: "Federal and private student loans.",
    status: "disconnected",
    abbreviation: "NV",
    accentColor: "#00529B",
  },
  {
    id: "sallie-mae",
    name: "Sallie Mae",
    category: "loans",
    description: "Student loans and college planning.",
    status: "disconnected",
    abbreviation: "SM",
    accentColor: "#0067B2",
  },
  {
    id: "rocket-mortgage",
    name: "Rocket Mortgage",
    category: "loans",
    description: "Home mortgages and refinancing.",
    status: "disconnected",
    abbreviation: "RM",
    accentColor: "#C8102E",
  },

  /* ---- Crypto ---- */
  {
    id: "coinbase",
    name: "Coinbase",
    category: "crypto",
    description: "Bitcoin, Ethereum, and 200+ cryptocurrencies.",
    status: "disconnected",
    abbreviation: "CB",
    accentColor: "#0052FF",
    popular: true,
  },
  {
    id: "kraken",
    name: "Kraken",
    category: "crypto",
    description: "Crypto exchange with staking and futures.",
    status: "disconnected",
    abbreviation: "KR",
    accentColor: "#7B61FF",
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "crypto",
    description: "Regulated crypto exchange and custody.",
    status: "disconnected",
    abbreviation: "GE",
    accentColor: "#00DCFA",
  },
]
