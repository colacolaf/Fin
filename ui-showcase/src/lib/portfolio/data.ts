import type {
  PortfolioAsset,
  ChartPoint,
  Trade,
  AllocationSlice,
  PortfolioSummary,
} from "./types"

/* ================================================================== */
/*  EMPTY DEFAULTS — zeroed / empty, ready for real data               */
/*  When a brokerage connector is linked, swap these for API fetches.  */
/* ================================================================== */

const emptySummary: PortfolioSummary = {
  totalValue: 0,
  dayPnl: 0,
  totalReturn: 0,
  annualized: 0,
  sharpe: 0,
  volatility: 0,
  winRate: 0,
  drawdown: 0,
}

const emptyChartData: ChartPoint[] = []

const emptyAllocationData: AllocationSlice[] = []

const emptyHoldings: PortfolioAsset[] = []

const emptyTrades: Trade[] = []

/* ------------------------------------------------------------------ */
/*  MOCK DATA (for reference / dev use only)                          */
/*  These are NOT exported by default — use the hook below.           */
/* ------------------------------------------------------------------ */

export const portfolioSummary: PortfolioSummary = {
  totalValue: 124_580,
  dayPnl: 1_247.50,
  totalReturn: 12.4,
  annualized: 18.2,
  sharpe: 1.42,
  volatility: 14.8,
  winRate: 72,
  drawdown: -15,
}

export const chartData: ChartPoint[] = [
  { date: "Jan", value: 98000, daily: -0.4 },
  { date: "Feb", value: 101200, daily: 3.3 },
  { date: "Mar", value: 97800, daily: -3.4 },
  { date: "Apr", value: 104500, daily: 6.9 },
  { date: "May", value: 108300, daily: 3.6 },
  { date: "Jun", value: 106100, daily: -2.0 },
  { date: "Jul", value: 112400, daily: 5.9 },
  { date: "Aug", value: 110800, daily: -1.4 },
  { date: "Sep", value: 115200, daily: 4.0 },
  { date: "Oct", value: 118600, daily: 3.0 },
  { date: "Nov", value: 121400, daily: 2.4 },
  { date: "Dec", value: 124580, daily: 2.6 },
]

export const allocationData: AllocationSlice[] = [
  { name: "VOO",  value: 62, color: "#818CF8", dollarValue: 77_240 },
  { name: "AAPL", value: 18, color: "#67E8F9", dollarValue: 22_424 },
  { name: "MSFT", value: 12, color: "#34D399", dollarValue: 14_950 },
  { name: "BND",  value: 8,  color: "#FBBF24", dollarValue: 9_966  },
]

export const holdings: PortfolioAsset[] = [
  {
    ticker: "VOO", name: "Vanguard S&P 500", weight: 62,
    today: 1.2, totalGain: 14.8, value: 77_231, shares: 170,
    sparkData: [42, 44, 41, 46, 48, 47, 50, 49, 52, 54, 53, 56],
  },
  {
    ticker: "AAPL", name: "Apple Inc.", weight: 18,
    today: 1.8, totalGain: 8.4, value: 22_428, shares: 120,
    sparkData: [18, 17, 19, 18, 20, 21, 19, 22, 21, 23, 22, 24],
  },
  {
    ticker: "MSFT", name: "Microsoft Corp.", weight: 12,
    today: 2.1, totalGain: 11.2, value: 14_947, shares: 36,
    sparkData: [38, 40, 39, 42, 41, 43, 45, 44, 46, 48, 47, 50],
  },
  {
    ticker: "BND", name: "Vanguard Total Bond", weight: 8,
    today: 0.1, totalGain: 1.2, value: 9_964, shares: 138,
    sparkData: [72, 72, 73, 72, 73, 73, 74, 73, 74, 74, 75, 75],
  },
]

export const trades: Trade[] = [
  { type: "BUY",  ticker: "VOO",  shares: 5,  price: 452.3, date: "Dec 12, 2:30 PM" },
  { type: "SELL", ticker: "AAPL", shares: 10, price: 198.5, date: "Dec 10, 10:15 AM" },
  { type: "BUY",  ticker: "MSFT", shares: 3,  price: 415.0, date: "Dec 8, 3:45 PM" },
  { type: "BUY",  ticker: "BND",  shares: 20, price: 72.1,  date: "Dec 5, 11:00 AM" },
  { type: "SELL", ticker: "TSLA", shares: 2,  price: 245.0, date: "Dec 3, 9:30 AM" },
]

/* ================================================================== */
/*  usePortfolioData — returns empty defaults until real data flows     */
/*  When a brokerage connector is linked and an API is wired, replace  */
/*  the body with a fetch / SWR / React Query call.                   */
/* ================================================================== */

export function usePortfolioData() {
  // TODO: swap for real API fetch when broker is connected
  return {
    summary: emptySummary,
    chartData: emptyChartData,
    allocationData: emptyAllocationData,
    holdings: emptyHoldings,
    trades: emptyTrades,
  }
}
