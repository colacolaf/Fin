import { api } from "./client";

export interface StrategyTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  strategy_code: string;
  params_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface BacktestRun {
  id: string;
  user_id: string;
  strategy_template_id: string | null;
  status: "pending" | "running" | "completed" | "failed";
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_cash: number;
  commission: number;
  total_return_pct: number | null;
  sharpe_ratio: number | null;
  max_drawdown_pct: number | null;
  win_rate_pct: number | null;
  total_trades: number | null;
  final_value: number | null;
  equity_curve_json: string | null;
  trades_json: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface PaperTrade {
  id: string;
  user_id: string;
  backtest_run_id: string | null;
  strategy_template_id: string | null;
  symbol: string;
  action: "buy" | "sell";
  quantity: number;
  price: number;
  order_type: string;
  status: string;
  pnl: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaperPortfolio {
  positions: Array<{
    symbol: string;
    quantity: number;
    cost_basis: number;
    current_value: number;
    pnl: number;
  }>;
  total_pnl: number;
  position_count: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const backtestApi = {
  // Strategy templates
  listStrategies: (offset = 0, limit = 20) =>
    api<{ strategies: StrategyTemplate[]; count: number }>(`/backtest/strategies${qs({ offset, limit })}`),

  getStrategy: (id: string) =>
    api<StrategyTemplate>(`/backtest/strategies/${id}`),

  createStrategy: (data: {
    name: string;
    category: string;
    strategy_code: string;
    description?: string;
    params_json?: string;
  }) =>
    api<StrategyTemplate>("/backtest/strategies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStrategy: (id: string, data: Record<string, string | null>) =>
    api<StrategyTemplate>(`/backtest/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteStrategy: (id: string) =>
    api<void>(`/backtest/strategies/${id}`, { method: "DELETE" }),

  // Backtest runs
  startRun: (data: {
    symbol: string;
    start_date: string;
    end_date: string;
    strategy_template_id?: string;
    initial_cash?: number;
    commission?: number;
    timeframe?: string;
  }) =>
    api<BacktestRun>("/backtest/runs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listRuns: (offset = 0, limit = 20) =>
    api<{ runs: BacktestRun[]; count: number }>(`/backtest/runs${qs({ offset, limit })}`),

  getRun: (id: string) =>
    api<BacktestRun>(`/backtest/runs/${id}`),

  // Paper trading
  createPaperTrade: (data: {
    symbol: string;
    action: "buy" | "sell";
    quantity: number;
    price: number;
    order_type?: string;
    backtest_run_id?: string;
    strategy_template_id?: string;
  }) =>
    api<PaperTrade>("/backtest/paper-trades", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listPaperTrades: (offset = 0, limit = 50) =>
    api<{ trades: PaperTrade[]; count: number }>(`/backtest/paper-trades${qs({ offset, limit })}`),

  paperPortfolio: () =>
    api<PaperPortfolio>("/backtest/paper-portfolio"),
};