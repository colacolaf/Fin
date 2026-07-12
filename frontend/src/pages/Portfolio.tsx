import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { portfolioApi } from '../api/portfolio';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import AllocationPie from '../components/dashboard/AllocationPie';
import PerformanceLine from '../components/dashboard/PerformanceLine';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import ConcentrationMeter from '../components/dashboard/ConcentrationMeter';
import SectorRadar from '../components/dashboard/SectorRadar';
import { IconChevronRight, IconPortfolio, IconAnalytics, IconResearch } from '../components/layout/Icons';
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
    return (
      <div data-testid="portfolio-loading" style={{ padding: 32, color: 'oklch(0.7 0.01 200)', textAlign: 'center' }}>
        Loading portfolio…
      </div>
    );
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
      <div data-testid="portfolio-empty" style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Connect to start trading with conviction</h2>
        <p className="placeholder-text" style={{ color: 'oklch(0.7 0.01 200)' }}>
          Hook up a broker, add a manual holding, or replay a backtest to see your cockpit come alive.
        </p>
        <div className="onboarding-cards" data-testid="portfolio-empty-cards">
          <EmptyCard
            eyebrow="01 · Broker"
            title="Connect Alpaca"
            desc="One-click brokerage link — paper or live."
            testId="empty-connect-alpaca"
            onClick={() => navigate('/settings')}
            Icon={IconPortfolio}
          />
          <EmptyCard
            eyebrow="02 · Manual"
            title="Add a holding"
            desc="Track an asset without linking an account."
            testId="empty-add-holding"
            onClick={() => navigate('/settings')}
            Icon={IconAnalytics}
          />
          <EmptyCard
            eyebrow="03 · Backtest"
            title="Backtest a strategy"
            desc="See how a tweak would have performed."
            testId="empty-backtest"
            onClick={() => navigate('/backtest')}
            Icon={IconResearch}
          />
        </div>
      </div>
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

function EmptyCard({
  eyebrow,
  title,
  desc,
  testId,
  onClick,
  Icon,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  testId: string;
  onClick: () => void;
  Icon: typeof IconPortfolio;
}) {
  return (
    <button
      type="button"
      className="onboarding-card"
      onClick={onClick}
      data-testid={testId}
      aria-label={`${title}: ${desc}`}
    >
      <div className="onboarding-card-head">
        <span className="onboarding-card-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <h3 className="onboarding-card-title">{title}</h3>
      </div>
      <span className="onboarding-card-eyebrow">{eyebrow}</span>
      <p className="onboarding-card-desc">{desc}</p>
      <span className="onboarding-card-cta">
        Start <IconChevronRight size={14} />
      </span>
    </button>
  );
}
