/* ================================================================== */
/*  Portfolio Data Types                                              */
/*  Shared across dashboard and fullscreen views                      */
/*  When connecting to a real API, these interfaces describe the      */
/*  shape of the API response. Swap mock data for fetch calls.        */
/* ================================================================== */

export interface PortfolioAsset {
  ticker: string
  name: string
  weight: number        // 0–100 allocation %
  today: number         // % change today
  totalGain: number     // % total return
  value: number         // current dollar value
  shares: number
  sparkData: number[]   // 12-point sparkline data
}

export interface ChartPoint {
  date: string
  value: number
  daily: number         // daily return %
}

export interface Trade {
  type: "BUY" | "SELL"
  ticker: string
  shares: number
  price: number
  date: string
}

export interface AllocationSlice {
  name: string
  value: number         // weight %
  color: string
  dollarValue: number
}

export interface PortfolioSummary {
  totalValue: number
  dayPnl: number
  totalReturn: number
  annualized: number
  sharpe: number
  volatility: number
  winRate: number
  drawdown: number
}
