import type { Debt, DebtSummary, DebtChartPoint, DebtTheme } from "./types"

/* ================================================================== */
/*  MOCK DATA                                                         */
/*  Replace each constant with an API fetch call when ready.          */
/*  All data follows the interfaces in types.ts.                      */
/* ================================================================== */

export const debts: Debt[] = [
  {
    id: "sl",
    name: "Student Loan",
    type: "student_loan",
    balance: 18_400,
    originalBalance: 48_000,
    apr: 6.8,
    minimumPayment: 320,
    paymentDay: 15,
    estimatedPayoff: "Aug 2027",
    interestPaid: 2_100,
    totalInterestProjected: 4_800,
    sparkData: [48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26],
    color: "", // set by theme
  },
  {
    id: "cc",
    name: "Credit Card",
    type: "credit_card",
    balance: 8_230,
    originalBalance: 13_200,
    apr: 22.9,
    minimumPayment: 250,
    paymentDay: 22,
    estimatedPayoff: "Mar 2028",
    interestPaid: 1_840,
    totalInterestProjected: 3_200,
    sparkData: [13, 12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9, 8.8, 8.5, 8.2],
    color: "",
  },
  {
    id: "al",
    name: "Auto Loan",
    type: "auto_loan",
    balance: 12_100,
    originalBalance: 26_400,
    apr: 4.5,
    minimumPayment: 380,
    paymentDay: 1,
    estimatedPayoff: "Nov 2027",
    interestPaid: 1_200,
    totalInterestProjected: 2_400,
    sparkData: [26, 24, 22, 21, 20, 18, 17, 16, 15, 14, 13, 12.1],
    color: "",
  },
  {
    id: "med",
    name: "Medical",
    type: "medical",
    balance: 8_500,
    originalBalance: 11_800,
    apr: 0,
    minimumPayment: 150,
    paymentDay: 10,
    estimatedPayoff: "Jun 2028",
    interestPaid: 0,
    totalInterestProjected: 0,
    sparkData: [11.8, 11.3, 10.8, 10.4, 10, 9.7, 9.4, 9.1, 8.9, 8.7, 8.6, 8.5],
    color: "",
  },
]

export const debtSummary: DebtSummary = {
  totalDebt: 47_230,
  monthlyPayment: 1_100,
  weightedApr: 8.5,
  debtCount: 4,
  estimatedDebtFree: "Aug 2028",
  totalInterestRemaining: 6_840,
  monthOverMonthChange: -1_240,
  totalPaidThisMonth: 1_240,
  totalPaidThisWeek: 420,
  totalPaidThisYear: 8_400,
  percentPaid: 52, // (99400 - 47230) / 99400 ≈ 52%
  totalOriginalDebt: 99_400,
}

export const chartData: DebtChartPoint[] = [
  { date: "Jan", totalBalance: 55_630, paidThisMonth: 1_100 },
  { date: "Feb", totalBalance: 54_950, paidThisMonth: 680 },
  { date: "Mar", totalBalance: 53_800, paidThisMonth: 1_150 },
  { date: "Apr", totalBalance: 52_600, paidThisMonth: 1_200 },
  { date: "May", totalBalance: 51_400, paidThisMonth: 1_200 },
  { date: "Jun", totalBalance: 50_500, paidThisMonth: 900 },
  { date: "Jul", totalBalance: 49_800, paidThisMonth: 700 },
  { date: "Aug", totalBalance: 49_100, paidThisMonth: 700 },
  { date: "Sep", totalBalance: 48_600, paidThisMonth: 500 },
  { date: "Oct", totalBalance: 47_800, paidThisMonth: 800 },
  { date: "Nov", totalBalance: 47_500, paidThisMonth: 300 },
  { date: "Dec", totalBalance: 47_230, paidThisMonth: 270 },
]

/* ================================================================== */
/*  THEMES                                                            */
/* ================================================================== */

export const amberTheme: DebtTheme = {
  primary: "#FBBF24",
  primaryDim: "rgba(251,191,36,0.15)",
  primaryGlow: "rgba(251,191,36,0.3)",
  chartColors: ["#FBBF24", "#FB7185", "#818CF8", "#34D399"],
  urgentColor: "#FB7185",
  lowPriorityColor: "#34D399",
  portfolioColor: "#818CF8",
  accentBg: "rgba(251,191,36,0.10)",
  accentBorder: "rgba(251,191,36,0.25)",
  ringClass: "ring-amber-400/30",
  gradientFrom: "from-amber-400/20",
  gradientTo: "to-amber-400/0",
  pillBg: "bg-amber-400/10",
  pillBorder: "border-amber-400/20",
  pillText: "text-amber-400",
  tabActive: "text-amber-400",
  tabActiveBorder: "border-amber-400",
  progressBg: "bg-amber-400",
  btnBg: "bg-amber-400/10",
  btnHover: "hover:bg-amber-400/20",
  btnText: "text-amber-400",
}

export const roseTheme: DebtTheme = {
  primary: "#FB7185",
  primaryDim: "rgba(251,113,133,0.15)",
  primaryGlow: "rgba(251,113,133,0.3)",
  chartColors: ["#FB7185", "#FBBF24", "#A78BFA", "#34D399"],
  urgentColor: "#FBBF24",
  lowPriorityColor: "#34D399",
  portfolioColor: "#A78BFA",
  accentBg: "rgba(251,113,133,0.10)",
  accentBorder: "rgba(251,113,133,0.25)",
  ringClass: "ring-rose-400/30",
  gradientFrom: "from-rose-400/20",
  gradientTo: "to-rose-400/0",
  pillBg: "bg-rose-400/10",
  pillBorder: "border-rose-400/20",
  pillText: "text-rose-400",
  tabActive: "text-rose-400",
  tabActiveBorder: "border-rose-400",
  progressBg: "bg-rose-400",
  btnBg: "bg-rose-400/10",
  btnHover: "hover:bg-rose-400/20",
  btnText: "text-rose-400",
}

export const midnightTheme: DebtTheme = {
  primary: "#67E8F9",
  primaryDim: "rgba(103,232,249,0.12)",
  primaryGlow: "rgba(103,232,249,0.25)",
  chartColors: ["#67E8F9", "#FB7185", "#818CF8", "#34D399"],
  urgentColor: "#FB7185",
  lowPriorityColor: "#34D399",
  portfolioColor: "#818CF8",
  accentBg: "rgba(103,232,249,0.08)",
  accentBorder: "rgba(103,232,249,0.20)",
  ringClass: "ring-cyan-400/30",
  gradientFrom: "from-cyan-400/15",
  gradientTo: "to-cyan-400/0",
  pillBg: "bg-cyan-400/10",
  pillBorder: "border-cyan-400/20",
  pillText: "text-cyan-400",
  tabActive: "text-cyan-400",
  tabActiveBorder: "border-cyan-400",
  progressBg: "bg-cyan-400",
  btnBg: "bg-cyan-400/10",
  btnHover: "hover:bg-cyan-400/20",
  btnText: "text-cyan-400",
}

export const allThemes = [
  { key: "amber", label: "Amber", theme: amberTheme, accent: "#FBBF24" },
  { key: "rose", label: "Rose", theme: roseTheme, accent: "#FB7185" },
  { key: "midnight", label: "Midnight", theme: midnightTheme, accent: "#67E8F9" },
] as const

/** Apply theme colors to debt objects */
export function getDebtsWithTheme(theme: DebtTheme): Debt[] {
  return debts.map((d, i) => ({
    ...d,
    color: theme.chartColors[i % theme.chartColors.length],
  }))
}
