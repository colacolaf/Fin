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