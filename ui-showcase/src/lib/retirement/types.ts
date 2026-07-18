/* ================================================================== */
/*  Retirement Data Types                                              */
/* ================================================================== */

export interface RetirementAccount {
  id: string
  name: string
  type: "401k" | "ira" | "roth_ira" | "roth_401k" | "sep_ira" | "hsa"
  provider: string
  balance: number
  contributionRate: number // percentage of income
  employerMatch: number // annual dollar amount
  employerMatchMax: number // max match available
  vestedPercent: number
  color: string
}

export interface RetirementSummary {
  totalSaved: number
  fundedPercentage: number
  projectedAnnualIncome: number
  targetRetirementAge: number
  currentAge: number
  yearsToRetirement: number
  monthlyGap: number // gap between projected and needed income
  neededAtRetirement: number
  employerMatchCaptured: number // annual
  employerMatchAvailable: number // annual
  socialSecurityEstimate: number // annual
  monthlyContribution: number
  annualIncome: number
}

export interface RetirementChartPoint {
  age: number
  projected: number
  target: number
  optimistic?: number
  conservative?: number
}
