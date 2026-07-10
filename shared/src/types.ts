// ── Health ────────────────────────────────
export interface HealthResponse {
  status: string;
}

// ── Auth ──────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
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