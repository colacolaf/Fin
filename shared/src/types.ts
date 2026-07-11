// ── Health ────────────────────────────────
export interface HealthResponse {
  status: string;
}

// ── Auth ──────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserOut;
}

export interface UserOut {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ── Portfolio ─────────────────────────────
export interface PortfolioSummary {
  total_value: number;
  daily_change_pct: number;
  total_gain_loss: number;
  cash: number;
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  gain_loss_pct: number;
  allocation_pct: number;
  asset_class: string;
}

export interface AssetClassBreakdown {
  name: string;
  value: number;
  allocation_pct: number;
  color: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
}

export type PerformancePeriod = '1W' | '1M' | '3M' | '1Y' | 'YTD';

export interface PortfolioData {
  total_value: number;
  daily_change: number;
  daily_change_pct: number;
  total_return_pct: number;
  holdings: Holding[];
  asset_classes: AssetClassBreakdown[];
  performance: PerformancePoint[];
}

// ── Agent ─────────────────────────────────
export type AgentMode = "investment" | "debt" | "retirement" | "multi";

export interface AgentRecommendation {
  id: string;
  agent_mode: AgentMode;
  title: string;
  description: string;
  confidence: number; // 0-1
  impact_estimate: number;
  created_at: string;
}

// ── API ───────────────────────────────────
export interface ApiError {
  detail: string;
}

// ── Debt ──────────────────────────────────
export interface DebtAccount {
  id: string;
  user_id: string;
  name: string;
  debt_type: 'credit_card' | 'student_loan' | 'mortgage' | 'auto_loan' | 'personal_loan' | 'other';
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  extra_payment: number;
  due_date: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DebtSummary {
  total_debt: number;
  monthly_payments: number;
  avg_interest_rate: number;
  debt_count: number;
  dti_ratio: DTIRatio | null;
  accounts: DebtAccount[];
}

export interface DTIRatio {
  total_monthly_debt: number;
  monthly_income: number;
  dti_pct: number;
  status: 'good' | 'caution' | 'danger';
  recommendation: string;
}

export interface PayoffMonth {
  month: number;
  balance_remaining: number;
  interest_paid: number;
  principal_paid: number;
  extra_paid: number;
}

export interface PayoffPlan {
  schedule: PayoffMonth[];
  total_months: number;
  total_interest: number;
  total_paid: number;
  payoff_date: string | null;
}

export interface StrategyComparison {
  avalanche: PayoffPlan;
  snowball: PayoffPlan;
  comparison: {
    interest_saved: number;
    months_saved: number;
    recommended: 'avalanche' | 'snowball';
  };
}

export interface PaymentEntry {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  balance_after: number;
  method: string;
}