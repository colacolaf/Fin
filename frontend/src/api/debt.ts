import { api } from './client';
import type {
  DebtAccount,
  DebtSummary,
  PayoffPlan,
  StrategyComparison,
  PaymentEntry,
  DTIRatio,
} from '@fin/shared';

export interface CreateDebtRequest {
  name: string;
  debt_type?: string;
  balance: number;
  interest_rate: number;
  minimum_payment?: number;
}

export interface UpdateDebtRequest {
  name?: string;
  debt_type?: string;
  balance?: number;
  interest_rate?: number;
  minimum_payment?: number;
}

export interface LogPaymentRequest {
  debt_id: string;
  amount: number;
  payment_date?: string;
  method?: string;
}

export const debtApi = {
  getAccounts: () =>
    api<{ accounts: DebtAccount[] }>('/debt/accounts'),

  createAccount: (body: CreateDebtRequest) =>
    api<DebtAccount>('/debt/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAccount: (id: string, body: UpdateDebtRequest) =>
    api<DebtAccount>(`/debt/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteAccount: (id: string) =>
    api<void>(`/debt/accounts/${id}`, { method: 'DELETE' }),

  getSummary: () =>
    api<DebtSummary>('/debt/summary'),

  createLinkToken: () =>
    api<{ link_token: string }>('/debt/link-token', { method: 'POST' }),

  exchangeToken: (publicToken: string) =>
    api<{ detail: string; sync: { accounts_added: number; accounts_updated: number; total_debt: number } }>(
      '/debt/exchange-token',
      { method: 'POST', body: JSON.stringify({ public_token: publicToken }) }
    ),

  getPayoffPlan: (strategy: 'avalanche' | 'snowball' = 'avalanche', extraPayment: number = 0) =>
    api<PayoffPlan>(`/debt/payoff-plan?strategy=${strategy}&extra_payment=${extraPayment}`),

  getStrategyComparison: (extraPayment: number = 0) =>
    api<StrategyComparison>(`/debt/strategy-comparison?extra_payment=${extraPayment}`),

  getDTI: (monthlyIncome: number) =>
    api<DTIRatio>(`/debt/dti?monthly_income=${monthlyIncome}`),

  logPayment: (body: LogPaymentRequest) =>
    api<PaymentEntry>('/debt/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getPayments: () =>
    api<{ payments: PaymentEntry[] }>('/debt/payments'),
};