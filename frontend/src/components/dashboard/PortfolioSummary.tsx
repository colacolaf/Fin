import { useMemo } from 'react';
import type { PortfolioData } from '@fin/shared';

interface PortfolioSummaryProps {
  data: PortfolioData;
  sparklines: Record<string, number[]>;
}

interface Tile {
  key: 'value' | 'daily' | 'ytd' | 'cash' | 'drift';
  label: string;
  value: string;
  delta?: string;
  deltaKind?: 'pos' | 'neg' | 'flat';
  sparkline?: number[];
  testId: string;
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function MiniSparkline({ values, kind }: { values: number[]; kind?: 'pos' | 'neg' | 'flat' }) {
  if (!values.length) return null;
  const w = 88;
  const h = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const path = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const stroke =
    kind === 'neg'
      ? 'oklch(0.65 0.18 25)'
      : kind === 'pos'
        ? 'oklch(0.72 0.16 170)'
        : 'oklch(0.55 0.02 210)';
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-hidden="true"
      data-testid="mini-sparkline"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PortfolioSummary({ data, sparklines }: PortfolioSummaryProps) {
  const tiles = useMemo<Tile[]>(
    () => [
      {
        key: 'value',
        label: 'Portfolio value',
        value: fmtUsd(data.total_value),
        sparkline: sparklines.value ?? [],
        testId: 'hero-value',
      },
      {
        key: 'daily',
        label: 'Today',
        value: fmtUsd(data.daily_change),
        delta: fmtPct(data.daily_change_pct),
        deltaKind: data.daily_change >= 0 ? 'pos' : 'neg',
        sparkline: sparklines.daily ?? [],
        testId: 'hero-daily',
      },
      {
        key: 'ytd',
        label: 'YTD return',
        value: fmtPct(data.total_return_pct),
        deltaKind: data.total_return_pct >= 0 ? 'pos' : 'neg',
        sparkline: sparklines.ytd ?? [],
        testId: 'hero-ytd',
      },
      {
        key: 'cash',
        label: 'Cash',
        value: fmtUsd(data.cash ?? 0),
        sparkline: sparklines.cash ?? [],
        testId: 'hero-cash',
      },
      {
        key: 'drift',
        label: 'Allocation drift',
        value: fmtPct(data.allocation_drift_pct ?? 0),
        deltaKind:
          Math.abs(data.allocation_drift_pct ?? 0) > 5
            ? 'neg'
            : Math.abs(data.allocation_drift_pct ?? 0) > 2
              ? 'flat'
              : 'pos',
        sparkline: sparklines.drift ?? [],
        testId: 'hero-drift',
      },
    ],
    [data, sparklines],
  );

  return (
    <div className="portfolio-hero" role="group" aria-label="Portfolio hero metrics" data-testid="portfolio-hero">
      {tiles.map((t) => (
        <article
          key={t.key}
          className={`portfolio-hero-tile${t.deltaKind ? ` portfolio-hero-tile--${t.deltaKind}` : ''}`}
          data-testid={t.testId}
        >
          <span className="portfolio-hero-label">{t.label}</span>
          <span className="portfolio-hero-value">{t.value}</span>
          <div className="portfolio-hero-meta">
            {t.delta && (
              <span className={`portfolio-hero-delta portfolio-hero-delta--${t.deltaKind}`}>{t.delta}</span>
            )}
            {t.sparkline && t.sparkline.length > 0 && <MiniSparkline values={t.sparkline} kind={t.deltaKind} />}
          </div>
        </article>
      ))}
    </div>
  );
}
