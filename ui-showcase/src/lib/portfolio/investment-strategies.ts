/* ================================================================== */
/*  Investment Strategies — choosable, saved to localStorage           */
/*  Fed to the context file and Portfolio Agent                        */
/* ================================================================== */

export interface InvestmentStrategy {
  id: string
  label: string
  description: string
  riskLevel: "Low" | "Moderate" | "High"
  /** Brief allocation summary */
  allocation: string
}

export const investmentStrategies: InvestmentStrategy[] = [
  {
    id: "growth",
    label: "Growth-Focused",
    description: "80% equities tilted toward US large-cap. Individual stock positions for sector concentration. 8% bonds for stability. Rebalance quarterly or when drift exceeds 5%.",
    riskLevel: "Moderate",
    allocation: "80% Equity / 12% Cash / 8% Bonds",
  },
  {
    id: "aggressive-growth",
    label: "Aggressive Growth",
    description: "95% equities with heavy tech and growth stock tilt. Minimal bonds. Accepts higher volatility for maximum long-term returns. Rebalance semi-annually.",
    riskLevel: "High",
    allocation: "95% Equity / 5% Cash",
  },
  {
    id: "conservative",
    label: "Conservative Income",
    description: "40% equities, 50% bonds, 10% cash. Prioritizes capital preservation and steady income over growth. Suitable for near-retirement or risk-averse investors.",
    riskLevel: "Low",
    allocation: "40% Equity / 50% Bonds / 10% Cash",
  },
  {
    id: "balanced",
    label: "Balanced (60/40)",
    description: "Classic 60% equity / 40% bond split. Moderate growth with downside protection. Rebalance annually or when allocation drifts 5% from target.",
    riskLevel: "Moderate",
    allocation: "60% Equity / 40% Bonds",
  },
  {
    id: "dividend-income",
    label: "Dividend Income",
    description: "Focus on high-dividend stocks, REITs, and dividend ETFs. Prioritizes cash flow over capital appreciation. Reinvest dividends for compound growth.",
    riskLevel: "Moderate",
    allocation: "70% Dividend Equity / 20% REITs / 10% Cash",
  },
  {
    id: "boglehead-3-fund",
    label: "Boglehead 3-Fund",
    description: "Total US stock market, total international stock, and total bond market. Simple, low-cost, diversified. Set allocations and rebalance annually.",
    riskLevel: "Moderate",
    allocation: "50% US / 30% Intl / 20% Bonds",
  },
  {
    id: "tech-heavy",
    label: "Tech-Heavy / Sector Tilt",
    description: "Overweight technology and innovation sectors via QQQ, VGT, and individual tech names. Higher volatility, higher potential returns. Monitor concentration risk.",
    riskLevel: "High",
    allocation: "85% Tech Equity / 10% Cash / 5% Bonds",
  },
  {
    id: "esg-sustainable",
    label: "ESG / Sustainable",
    description: "Screen for environmental, social, and governance criteria. Use ESG ETFs and green bonds. May underperform broad market in fossil-fuel bull runs.",
    riskLevel: "Moderate",
    allocation: "70% ESG Equity / 20% Green Bonds / 10% Cash",
  },
  {
    id: "factor-tilt",
    label: "Factor Tilt (Value + Small Cap)",
    description: "Tilt toward small-cap value, momentum, and quality factors. Uses factor ETFs like AVUV, AVDV. Higher expected returns with higher tracking error risk.",
    riskLevel: "High",
    allocation: "65% Factor Equity / 20% Core / 15% Bonds",
  },
  {
    id: "global-market-cap",
    label: "Global Market Cap Weight",
    description: "Weight holdings by global market capitalization. ~60% US, ~30% International, ~10% bonds. The ultimate passive strategy with minimal tilts.",
    riskLevel: "Moderate",
    allocation: "60% US / 30% Intl / 10% Bonds",
  },
  {
    id: "retirement-target-date",
    label: "Target Date / Glide Path",
    description: "Auto-adjusting allocation that becomes more conservative as target retirement date approaches. Higher equity early, more bonds later. Set and forget.",
    riskLevel: "Moderate",
    allocation: "Glide path (auto-adjusted)",
  },
  {
    id: "all-weather",
    label: "All-Weather / Risk Parity",
    description: "Balanced across economic environments: stocks, long-term bonds, commodities, gold. Designed to perform in inflation, deflation, growth, and recession.",
    riskLevel: "Low",
    allocation: "30% Equity / 40% LT Bonds / 15% Commodities / 15% Gold",
  },
  {
    id: "momentum",
    label: "Momentum / Trend Following",
    description: "Rotate into assets with strongest recent performance. Use moving averages to signal entries/exits. Higher turnover, more taxable events. Requires active monitoring.",
    riskLevel: "High",
    allocation: "Variable (momentum-driven)",
  },
  {
    id: "real-assets",
    label: "Real Assets / Inflation Hedge",
    description: "Heavy allocation to REITs, commodities, TIPS, and infrastructure. Designed to protect purchasing power during inflationary periods.",
    riskLevel: "Moderate",
    allocation: "40% REITs / 30% Commodities / 20% TIPS / 10% Cash",
  },
  {
    id: "custom",
    label: "Custom Strategy",
    description: "Define your own allocation, risk tolerance, and rebalancing rules. Full flexibility — the agent adapts to your choices.",
    riskLevel: "Moderate",
    allocation: "User-defined",
  },
]

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                                */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "fo-investment-strategy"

export function getStoredStrategy(): InvestmentStrategy | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const id = JSON.parse(raw) as string
    return investmentStrategies.find((s) => s.id === id) ?? null
  } catch {
    return null
  }
}

export function saveStrategy(strategy: InvestmentStrategy): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy.id))
}
