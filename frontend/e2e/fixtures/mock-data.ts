// Deterministic seed data factories for all domains
// No randomness — all dates/timestamps are fixed for reproducibility

export const MOCK_USER = {
  id: 'test-user-1',
  email: 'test@fin.app',
  name: 'Test User',
  created_at: '2025-01-15T00:00:00Z',
};

export const MOCK_PORTFOLIO = {
  id: 'portfolio-1',
  user_id: 'test-user-1',
  total_value: 125000.50,
  cash_balance: 15000.25,
  last_synced: '2026-07-10T12:00:00Z',
  holdings: [
    { symbol: 'AAPL', shares: 50, avg_cost: 175.30, current_price: 195.60, value: 9780.00, allocation_pct: 7.8 },
    { symbol: 'VTI', shares: 200, avg_cost: 220.10, current_price: 245.30, value: 49060.00, allocation_pct: 39.2 },
    { symbol: 'BND', shares: 300, avg_cost: 72.50, current_price: 71.80, value: 21540.00, allocation_pct: 17.2 },
    { symbol: 'GOOGL', shares: 30, avg_cost: 140.20, current_price: 185.40, value: 5562.00, allocation_pct: 4.5 },
    { symbol: 'MSFT', shares: 45, avg_cost: 370.10, current_price: 425.80, value: 19161.00, allocation_pct: 15.3 },
    { symbol: 'VXUS', shares: 120, avg_cost: 58.30, current_price: 60.10, value: 7212.00, allocation_pct: 5.8 },
  ],
};

export const MOCK_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    agent_type: 'investment',
    title: 'Increase VTI allocation by 5%',
    description: 'Your VTI allocation is below target for your risk profile. Increasing by 5% would optimize your equity exposure.',
    confidence: 0.87,
    impact_score: 7.5,
    status: 'pending',
    created_at: '2026-07-10T08:00:00Z',
    reasoning: 'Target allocation model suggests 44% VTI for moderate risk. Current is 39.2%.',
  },
  {
    id: 'rec-2',
    agent_type: 'debt',
    title: 'Prioritize credit card payoff',
    description: 'Your Chase card at 22.99% APR should be paid before your student loan at 5.5%.',
    confidence: 0.94,
    impact_score: 9.0,
    status: 'pending',
    created_at: '2026-07-09T14:30:00Z',
    reasoning: 'Snowball vs avalanche comparison shows $1,200 savings by prioritizing the higher APR.',
  },
  {
    id: 'rec-3',
    agent_type: 'retirement',
    title: 'Increase 401(k) contribution by 2%',
    description: 'At your current savings rate, you would have a shortfall of $180,000 at retirement. A 2% increase closes 60% of that gap.',
    confidence: 0.82,
    impact_score: 8.2,
    status: 'accepted',
    created_at: '2026-07-08T10:00:00Z',
    reasoning: 'Projected retirement shortfall analysis with 7% annual return assumption.',
  },
];

export const MOCK_DEBTS = [
  {
    id: 'debt-1',
    name: 'Chase Sapphire',
    type: 'credit_card',
    balance: 8500.00,
    apr: 22.99,
    min_payment: 250.00,
    created_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 'debt-2',
    name: 'Student Loan - Federal',
    type: 'student_loan',
    balance: 32000.00,
    apr: 5.5,
    min_payment: 350.00,
    created_at: '2020-09-01T00:00:00Z',
  },
  {
    id: 'debt-3',
    name: 'Auto Loan - Honda',
    type: 'auto_loan',
    balance: 12400.00,
    apr: 4.9,
    min_payment: 380.00,
    created_at: '2024-06-15T00:00:00Z',
  },
];

export const MOCK_RETIREMENT = {
  id: 'retirement-1',
  user_id: 'test-user-1',
  current_age: 34,
  retirement_age: 65,
  life_expectancy: 90,
  current_savings: 185000.00,
  annual_income: 120000.00,
  savings_rate: 0.12,
  employer_match: 0.04,
  projected_monthly_income: 4200.00,
  projected_monthly_needs: 5800.00,
  monthly_shortfall: 1600.00,
  accounts: [
    { name: '401(k)', balance: 120000.00, contribution_pct: 0.12, employer_match_pct: 0.04 },
    { name: 'Roth IRA', balance: 45000.00, contribution_pct: 0.04, employer_match_pct: 0 },
    { name: 'Taxable Brokerage', balance: 20000.00, contribution_pct: 0.02, employer_match_pct: 0 },
  ],
  projections: [
    { age: 65, conservative: 1200000, moderate: 1800000, aggressive: 2400000 },
    { age: 75, conservative: 1000000, moderate: 1600000, aggressive: 2200000 },
    { age: 85, conservative: 700000, moderate: 1200000, aggressive: 1800000 },
  ],
};

export const MOCK_COMMUNITY = {
  benchmarks: [
    { metric: 'savings_rate', user_value: 12, community_avg: 15, top_quartile: 22 },
    { metric: 'debt_to_income', user_value: 0.42, community_avg: 0.35, top_quartile: 0.15 },
    { metric: 'net_worth_age_ratio', user_value: 1.8, community_avg: 2.1, top_quartile: 3.5 },
  ],
  leaderboard: [
    { user_id: 'anon-1', alias: 'EarlySaver42', score: 92, change: '+3' },
    { user_id: 'anon-2', alias: 'FIREWalker', score: 88, change: '-1' },
    { user_id: 'anon-3', alias: 'BudgetNinja', score: 85, change: '+5' },
  ],
  votes: [
    { recommendation_id: 'rec-1', up: 42, down: 8 },
    { recommendation_id: 'rec-2', up: 55, down: 3 },
    { recommendation_id: 'rec-3', up: 38, down: 12 },
  ],
};

export const MOCK_BACKTEST = {
  id: 'backtest-1',
  strategy_name: '60/40 VTI/BND',
  start_date: '2020-01-01',
  end_date: '2025-12-31',
  initial_balance: 100000,
  final_balance: 148200,
  total_return_pct: 48.2,
  annualized_return_pct: 8.1,
  max_drawdown_pct: -20.5,
  sharpe_ratio: 0.92,
  trades: 24,
};

export const MOCK_EXECUTION = {
  id: 'exec-1',
  recommendation_id: 'rec-1',
  status: 'in_progress',
  steps: [
    { id: 'step-1', description: 'Review recommendation', completed: true, completed_at: '2026-07-10T09:00:00Z' },
    { id: 'step-2', description: 'Place limit order for 10 VTI shares', completed: false },
    { id: 'step-3', description: 'Verify allocation reached', completed: false },
  ],
  check_in_scheduled: '2026-07-17T12:00:00Z',
  progress_pct: 33,
};

export const MOCK_MARKET_DATA = {
  quotes: {
    AAPL: { price: 195.60, change_pct: 1.2, volume: 45000000 },
    VTI: { price: 245.30, change_pct: -0.3, volume: 3200000 },
    BND: { price: 71.80, change_pct: 0.1, volume: 1800000 },
    GOOGL: { price: 185.40, change_pct: 2.1, volume: 22000000 },
    MSFT: { price: 425.80, change_pct: 0.8, volume: 19000000 },
    VXUS: { price: 60.10, change_pct: -0.5, volume: 4100000 },
  },
  news: [
    { title: 'Fed holds rates steady', source: 'Reuters', sentiment: 'neutral', timestamp: '2026-07-10T10:00:00Z' },
    { title: 'Tech sector leads market gains', source: 'Bloomberg', sentiment: 'positive', timestamp: '2026-07-10T09:30:00Z' },
  ],
};

// Helper: combine all data for seeding
export function seedData() {
  return {
    user: MOCK_USER,
    portfolio: MOCK_PORTFOLIO,
    recommendations: MOCK_RECOMMENDATIONS,
    debts: MOCK_DEBTS,
    retirement: MOCK_RETIREMENT,
    community: MOCK_COMMUNITY,
    backtest: MOCK_BACKTEST,
    execution: MOCK_EXECUTION,
    marketData: MOCK_MARKET_DATA,
  };
}