/* ================================================================== */
/*  Debt Data Types                                                   */
/*  Shared across dashboard and fullscreen views                      */
/*  When connecting to a real API, these interfaces describe the      */
/*  shape of the API response. Swap mock data for fetch calls.        */
/* ================================================================== */

export interface Debt {
  id: string
  name: string
  type: "student_loan" | "credit_card" | "auto_loan" | "mortgage" | "medical" | "personal"
  balance: number
  originalBalance: number
  apr: number
  minimumPayment: number
  paymentDay: number
  estimatedPayoff: string
  interestPaid: number
  totalInterestProjected: number
  sparkData: number[]
  color: string
}

export interface DebtSummary {
  totalDebt: number
  monthlyPayment: number
  weightedApr: number
  debtCount: number
  estimatedDebtFree: string
  totalInterestRemaining: number
  monthOverMonthChange: number
  totalPaidThisMonth: number
  totalPaidThisWeek: number
  totalPaidThisYear: number
  percentPaid: number
  totalOriginalDebt: number
}

export interface DebtChartPoint {
  date: string
  totalBalance: number
  paidThisMonth: number
}

export interface DebtTheme {
  primary: string
  primaryDim: string
  primaryGlow: string
  chartColors: string[]
  urgentColor: string
  lowPriorityColor: string
  portfolioColor: string
  accentBg: string
  accentBorder: string
  ringClass: string
  gradientFrom: string
  gradientTo: string
  pillBg: string
  pillBorder: string
  pillText: string
  tabActive: string
  tabActiveBorder: string
  progressBg: string
  btnBg: string
  btnHover: string
  btnText: string
}
