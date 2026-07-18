/* ================================================================== */
/*  News Data Types                                                   */
/*  Shared across dashboard and any expanded views                    */
/*  When connecting to a real API (Finnhub, Alpha Vantage, etc.),     */
/*  these interfaces describe the shape of the API response.          */
/*  Swap mock data for fetch calls.                                   */
/* ================================================================== */

export type NewsCategory =
  | "Earnings"
  | "Fed / Macro"
  | "Crypto"
  | "Indices"
  | "Buybacks"
  | "IPO"
  | "Tech"
  | "Energy"
  | "Policy"
  | "M&A"

export type NewsSource = "Reuters" | "Bloomberg" | "CNBC" | "WSJ" | "FT" | "MarketWatch"

export interface NewsArticle {
  id: string
  headline: string
  source: NewsSource
  category: NewsCategory
  url: string
  publishedAt: string       // ISO timestamp
  timeAgo: string           // pre-formatted "12m ago", "2h ago"
  /** True if article appeared in last 5 minutes — drives the LIVE dot */
  isBreaking: boolean
}

export interface NewsFeed {
  articles: NewsArticle[]
  lastUpdated: string       // ISO timestamp
  isLive: boolean           // connection status indicator
}
