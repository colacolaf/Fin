/* ================================================================== */
/*  Trade Queue Types                                                  */
/* ================================================================== */

export interface PendingTrade {
  id: string
  side: "buy" | "sell"
  ticker: string
  name: string
  amount: number
  reasoning: string
  riskBefore: number // e.g. 1.8
  riskAfter: number // e.g. 1.1
  estimatedTax: number
  taxType: "short_term" | "long_term" | "none"
  fees: number
  broker: string
}


