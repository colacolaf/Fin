import { api } from './client';
import type { Holding, AssetClassBreakdown, PerformancePoint, PortfolioData } from '@fin/shared';

export const portfolioApi = {
  summary: () =>
    api<{
      total_value: number;
      daily_change: number;
      daily_change_pct: number;
      total_return_pct: number;
      cash: number;
    }>('/portfolio/summary'),

  holdings: () => api<Holding[]>('/portfolio/holdings'),

  performance: (period: string = '1Y') =>
    api<PerformancePoint[]>(`/portfolio/performance?period=${period}`),

  assetClasses: () => api<AssetClassBreakdown[]>('/portfolio/asset-classes'),

  full: () => api<PortfolioData>('/portfolio/full'),
};