import type { NewsArticle, NewsFeed, NewsSource, NewsCategory } from "./types"

/* ================================================================== */
/*  MOCK DATA                                                         */
/*  Replace with API fetch calls when ready.                          */
/*  All data follows the interfaces in types.ts.                      */
/* ================================================================== */

/** Source logo letter — maps to a colored circle initial in the UI */
export const sourceColors: Record<NewsSource, string> = {
  Reuters: "#FF8C00",
  Bloomberg: "#FFFFFF",
  CNBC: "#00B4D8",
  WSJ: "#CBD5E1",
  FT: "#FCD0B1",
  MarketWatch: "#4ADE80",
}

/** Vivid category colors for the news feed */
export const categoryColors: Record<NewsCategory, { bg: string; text: string; dot: string }> = {
  "Earnings":    { bg: "rgba(52,211,153,0.20)", text: "#6EE7B7", dot: "#34D399" },
  "Fed / Macro": { bg: "rgba(251,191,36,0.20)",  text: "#FCD34D", dot: "#FBBF24" },
  "Crypto":      { bg: "rgba(167,139,250,0.20)", text: "#C4B5FD", dot: "#A78BFA" },
  "Indices":     { bg: "rgba(103,232,249,0.20)", text: "#A5F3FC", dot: "#67E8F9" },
  "Buybacks":    { bg: "rgba(251,113,133,0.20)", text: "#FDA4AF", dot: "#FB7185" },
  "IPO":         { bg: "rgba(244,114,182,0.20)", text: "#F9A8D4", dot: "#F472B6" },
  "Tech":        { bg: "rgba(129,140,248,0.20)", text: "#A5B4FC", dot: "#818CF8" },
  "Energy":      { bg: "rgba(253,186,116,0.20)", text: "#FED7AA", dot: "#FDBA74" },
  "Policy":      { bg: "rgba(148,163,184,0.20)", text: "#CBD5E1", dot: "#94A3B8" },
  "M&A":         { bg: "rgba(251,146,60,0.20)",  text: "#FDBA74", dot: "#FB923C" },
}

export const newsArticles: NewsArticle[] = [
  {
    id: "n1",
    headline: "NVIDIA beats Q2 estimates, stock surges 8% after hours",
    source: "Reuters",
    category: "Earnings",
    url: "https://reuters.com/technology/nvidia-earnings",
    publishedAt: "2026-07-17T18:45:00Z",
    timeAgo: "12m",
    isBreaking: true,
  },
  {
    id: "n2",
    headline: "Fed signals potential rate cut in September meeting",
    source: "Bloomberg",
    category: "Fed / Macro",
    url: "https://bloomberg.com/markets/fed-rate-cut",
    publishedAt: "2026-07-17T18:23:00Z",
    timeAgo: "34m",
    isBreaking: false,
  },
  {
    id: "n3",
    headline: "Bitcoin breaks $72K as ETF inflows hit record $1.2B",
    source: "CNBC",
    category: "Crypto",
    url: "https://cnbc.com/crypto/bitcoin-etf-inflows",
    publishedAt: "2026-07-17T17:57:00Z",
    timeAgo: "1h",
    isBreaking: false,
  },
  {
    id: "n4",
    headline: "Apple announces $110B buyback program, shares rise",
    source: "Reuters",
    category: "Buybacks",
    url: "https://reuters.com/technology/apple-buyback",
    publishedAt: "2026-07-17T16:45:00Z",
    timeAgo: "2h",
    isBreaking: false,
  },
  {
    id: "n5",
    headline: "S&P 500 hits all-time high on broad tech rally",
    source: "WSJ",
    category: "Indices",
    url: "https://wsj.com/market-data/sp500-ath",
    publishedAt: "2026-07-17T15:30:00Z",
    timeAgo: "3h",
    isBreaking: false,
  },
  {
    id: "n6",
    headline: "Amazon AWS revenue growth accelerates to 19% YoY",
    source: "FT",
    category: "Earnings",
    url: "https://ft.com/technology/amazon-aws-earnings",
    publishedAt: "2026-07-17T14:15:00Z",
    timeAgo: "4h",
    isBreaking: false,
  },
  {
    id: "n7",
    headline: "Treasury yields fall to 4.1% on cooling inflation data",
    source: "Bloomberg",
    category: "Fed / Macro",
    url: "https://bloomberg.com/markets/treasury-yields",
    publishedAt: "2026-07-17T13:00:00Z",
    timeAgo: "5h",
    isBreaking: false,
  },
  {
    id: "n8",
    headline: "Tesla deliveries beat expectations, stock up 4% pre-market",
    source: "CNBC",
    category: "Earnings",
    url: "https://cnbc.com/tesla-deliveries",
    publishedAt: "2026-07-17T12:30:00Z",
    timeAgo: "6h",
    isBreaking: false,
  },
  {
    id: "n9",
    headline: "Microsoft Copilot enterprise adoption triples in Q2",
    source: "Reuters",
    category: "Tech",
    url: "https://reuters.com/technology/microsoft-copilot",
    publishedAt: "2026-07-17T11:00:00Z",
    timeAgo: "7h",
    isBreaking: false,
  },
  {
    id: "n10",
    headline: "Oil drops below $78 on OPEC+ output increase signals",
    source: "MarketWatch",
    category: "Energy",
    url: "https://marketwatch.com/oil-opec-output",
    publishedAt: "2026-07-17T10:00:00Z",
    timeAgo: "8h",
    isBreaking: false,
  },
  {
    id: "n11",
    headline: "SEC approves new crypto custody framework for banks",
    source: "WSJ",
    category: "Policy",
    url: "https://wsj.com/sec-crypto-custody",
    publishedAt: "2026-07-17T09:00:00Z",
    timeAgo: "9h",
    isBreaking: false,
  },
  {
    id: "n12",
    headline: "Broadcom in advanced talks to acquire VMware rival Nutanix",
    source: "FT",
    category: "M&A",
    url: "https://ft.com/broadcom-nutanix",
    publishedAt: "2026-07-17T08:00:00Z",
    timeAgo: "10h",
    isBreaking: false,
  },
]

export const newsFeed: NewsFeed = {
  articles: newsArticles,
  lastUpdated: "2026-07-17T18:57:00Z",
  isLive: true,
}
