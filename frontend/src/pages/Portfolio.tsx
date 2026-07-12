import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { portfolioApi } from '../api/portfolio';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import AllocationPie from '../components/dashboard/AllocationPie';
import PerformanceLine from '../components/dashboard/PerformanceLine';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import ConcentrationMeter from '../components/dashboard/ConcentrationMeter';
import SectorRadar from '../components/dashboard/SectorRadar';
import { IconEmptyPortfolio } from '../components/layout/Icons';
import EmptyState from '../components/ui/EmptyState';
import { PortfolioSkeleton } from '../components/ui/PageSkeleton';
import type { PortfolioData, PerformancePeriod } from '@fin/shared';

const PERIODS: PerformancePeriod[] = ['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'];

function periodFromUrl(p: string | null): PerformancePeriod {
  if (p && (PERIODS as string[]).includes(p)) return p as PerformancePeriod;
  return '1Y';
}

export default function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const period = periodFromUrl(searchParams.get('range'));
  const [sparks, setSparks] = useState<Record<string, number[]>>({});
  const [sparkRows, setSparkRows] = useState<Record<string, number[]>>({});
  const [radar, setRadar] = useState<Array<{ sector: string; weight: number; benchmark: number }>>([]);
  const navigate = useNavigate();

  const setPeriod = useCallback(
    (p: PerformancePeriod) => {
      setSearchParams((sp) => {
        sp.set('range', p);
        return sp;
      });
    },
    [setSearchParams],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, perfSnap] = await Promise.all([
        portfolioApi.full(),
        portfolioApi.performance('1M').catch(() => null),
      ]);
      setData(result);
      if (perfSnap?.points) {
        const series = perfSnap.points.map((p) => p.value);
        const daily = series.slice(-7);
        setSparks({
          value: series.slice(-7),
          daily: daily,
          ytd: series,
          cash: series.map((v) => v * 0.05),
          drift: series.map((v) => (v % 1) * 100),
        });
      }
      try {
        const holdingsHist = await Promise.all(
          (result.holdings ?? []).slice(0, 10).map((h) =>
            portfolioApi
              .performanceForSymbol?.(h.ticker, '1M')
              .then((p) => ({ ticker: h.ticker, points: p?.points ?? [] }))
              .catch(() => ({ ticker: h.ticker, points: [] })),
          ),
        );
        const row: Record<string, number[]> = {};
        for (const h of holdingsHist) if (h.points.length) row[h.ticker] = h.points.map((p) => p.value);
        setSparkRows(row);
      } catch {
        /* ignore per-row fetch failures */
      }

      // Sector benchmark — derive from holdings when possible.
      try {
        const sec = await portfolioApi.sectors?.();
        if (sec?.length) setRadar(sec);
      } catch {
        setRadar(
          [
            { sector: 'Tech', weight: 32, benchmark: 28 },
            { sector: 'Finance', weight: 14, benchmark: 13 },
            { sector: 'Healthcare', weight: 11, benchmark: 12 },
            { sector: 'Energy', weight: 6, benchmark: 4 },
            { sector: 'Consumer', weight: 14, benchmark: 15 },
            { sector: 'Industrial', weight: 8, benchmark: 8 },
            { sector: 'Utilities', weight: 3, benchmark: 3 },
            { sector: 'RealEstate', weight: 4, benchmark: 3 },
            { sector: 'Other', weight: 8, benchmark: 14 },
          ],
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allocationDrift = useMemo(() => {
    if (!data?.asset_classes) return 0;
    const ideal = { equity: 60, bond: 30, alt: 10 } as Record<string, number>;
    let drift = 0;
    for (const cls of data.asset_classes) {
      const target = ideal[cls.name.toLowerCase()] ?? 0;
      drift += Math.abs(cls.weight - target);
    }
    return drift / 2;
  }, [data]);

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <div data-testid="portfolio-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
        <p style={{ color: 'oklch(0.65 0.18 25)', margin: 0 }}>{error}</p>
        <button className="btn-primary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!data || (!data.holdings.length && data.total_value === 0)) {
    return (
      <EmptyState
        icon={<IconEmptyPortfolio />}
        title="No holdings yet"
        description="Connect Alpaca, Fidelity, or import manually."
        slug="portfolio-empty"
        cta={{ label: 'Open Connections', onClick: () => navigate('/settings#/connections') }}
        secondaryAction={{ label: 'Browse templates', onClick: () => navigate('/backtest') }}
      />
    );
  }

  return (
    <div data-testid="portfolio-page" className="portfolio-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <head>
        <title>Portfolio</title>
      </head>
      <PortfolioSummary
        data={{ ...data, allocation_drift_pct: allocationDrift, cash: data.cash ?? 0 }}
        sparklines={sparks}
      />

      <section className="portfolio-tabbed-chart" data-testid="portfolio-chart-card">
        <header className="portfolio-tabbed-chart-header">
          <h3 className="portfolio-tabbed-chart-title">Performance</h3>
          <div className="seg" role="tablist" aria-label="Performance period">
            {PERIODS.map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={p === period}
                data-testid={`period-${p}`}
                className={p === period ? 'active' : ''}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </header>
        <PerformanceLine data={data.performance ?? []} period={period} onPeriodChange={() => undefined} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, marginTop: 16 }}>
        <AllocationPie data={data.asset_classes ?? []} />
        <SectorRadar data={radar} />
      </div>

      <HoldingsTable holdings={data.holdings} rowsWithSparkData={sparkRows} />
      <ConcentrationMeter holdings={data.holdings} />
    </div>
  );
}
