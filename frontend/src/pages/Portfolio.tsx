import { useEffect, useState, useCallback } from 'react';
import { portfolioApi } from '../api/portfolio';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import AllocationPie from '../components/dashboard/AllocationPie';
import PerformanceLine from '../components/dashboard/PerformanceLine';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import ConcentrationMeter from '../components/dashboard/ConcentrationMeter';
import type { PortfolioData, PerformancePeriod } from '@fin/shared';

export default function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PerformancePeriod>('1Y');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await portfolioApi.full();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div data-testid="portfolio-loading" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400,
        color: 'var(--text-secondary, #94A3B8)', fontSize: 16,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        Loading portfolio...
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="portfolio-error" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 400, color: 'var(--text-primary, #E8F4FD)', gap: 16,
      }}>
        <p style={{ color: '#EF4444', margin: 0 }}>{error}</p>
        <button
          onClick={fetchData}
          style={{
            padding: '10px 24px',
            background: 'var(--accent-cyan, #00D4FF)',
            color: '#0A1628',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  if (!data.holdings.length && data.total_value === 0) {
    return (
      <div data-testid="portfolio-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div data-testid="portfolio-empty" className="empty-state" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 400, color: 'var(--text-primary, #E8F4FD)', gap: 12,
        }}>
          <p style={{ fontSize: 18, margin: 0 }}>No portfolio data yet.</p>
          <p style={{ color: 'var(--text-secondary, #94A3B8)', margin: 0 }}>
            Connect an account or add holdings to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="portfolio-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #E8F4FD)' }}>
        Investment Portfolio
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 20,
      }}>
        <PortfolioSummary
          totalValue={data.total_value}
          dailyChange={data.daily_change}
          dailyChangePct={data.daily_change_pct}
          totalReturnPct={data.total_return_pct}
          cash={0}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          ...(typeof window !== 'undefined' && window.innerWidth <= 768 ? { gridTemplateColumns: '1fr' } : {}),
        }}>
          <AllocationPie data={data.asset_classes} />
          <PerformanceLine
            data={data.performance}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        <HoldingsTable holdings={data.holdings} />
        <ConcentrationMeter holdings={data.holdings} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          #portfolio-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}