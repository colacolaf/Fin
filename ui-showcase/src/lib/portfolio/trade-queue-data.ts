import type { PendingTrade } from "./trade-queue-types"

export const pendingTrades: PendingTrade[] = [
  {
    id: "trade-1",
    side: "sell",
    ticker: "NVDA",
    name: "NVIDIA Corp",
    amount: 5_000,
    reasoning:
      "Your NVDA position is 22% of portfolio, making you 1.8x more volatile than the S&P 500. Rebalancing to VOO reduces concentration risk significantly.",
    riskBefore: 1.8,
    riskAfter: 1.1,
    estimatedTax: 186,
    taxType: "long_term",
    fees: 0,
    broker: "Schwab",
  },
  {
    id: "trade-2",
    side: "buy",
    ticker: "VXUS",
    name: "Vanguard Int'l Stock",
    amount: 2_000,
    reasoning:
      "You have zero international equity exposure. Adding VXUS diversifies geographic risk and captures non-US growth. 0.07% expense ratio.",
    riskBefore: 1.1,
    riskAfter: 1.0,
    estimatedTax: 0,
    taxType: "none",
    fees: 0,
    broker: "Schwab",
  },
  {
    id: "trade-3",
    side: "sell",
    ticker: "AAPL",
    name: "Apple Inc",
    amount: 1_500,
    reasoning:
      "AAPL + MSFT together are 28% of your portfolio. Reducing AAPL by $1,500 and moving to BND brings bond allocation closer to your 10% target.",
    riskBefore: 1.0,
    riskAfter: 0.95,
    estimatedTax: 90,
    taxType: "long_term",
    fees: 0,
    broker: "Fidelity",
  },
]
