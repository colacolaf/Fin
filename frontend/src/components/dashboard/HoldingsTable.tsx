import { useMemo, useState, useEffect } from 'react';
import type { Holding } from '@fin/shared';

interface HoldingsTableProps {
  holdings: Holding[];
  density?: 'compact' | 'comfortable';
  rowsWithSparkData?: Record<string, number[]>;
}

type SortKey = 'ticker' | 'allocation' | 'value' | 'daily_pnl' | 'weight';
type SortDir = 'asc' | 'desc' | null;

const DENSITY_KEY = 'fin.portfolio.density';

function readDensity(): 'compact' | 'comfortable' {
  if (typeof window === 'undefined') return 'comfortable';
  return (localStorage.getItem(DENSITY_KEY) as 'compact' | 'comfortable') ?? 'comfortable';
}

function MiniRowSparkline({ values }: { values: number[] }) {
  if (!values?.length) return null;
  const w = 64;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="holdings-row-spark">
      <path d={path} fill="none" stroke="oklch(0.72 0.16 170)" strokeWidth={1.3} />
    </svg>
  );
}

export default function HoldingsTable({ holdings, rowsWithSparkData, density: densityProp }: HoldingsTableProps) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>(densityProp ?? readDensity());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'allocation', dir: 'desc' });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch {
      /* noop */
    }
  }, [density]);

  const filtered = useMemo(() => {
    const totalValue =
      holdings.reduce(
        (sum, h) => sum + (h.market_value ?? h.allocation_pct ?? 0),
        0,
      ) || 1;
    let rows = holdings.map((h) => ({
      ...h,
      _allocation: h.allocation_pct ?? ((h.market_value ?? 0) / totalValue) * 100,
      _weight: (h.market_value ?? h.allocation_pct ?? 0),
      _value: h.market_value ?? h.allocation_pct ?? 0,
      _daily_pnl: h.daily_change_pct ?? 0,
    }));
    if (debouncedSearch) {
      rows = rows.filter((r) =>
        r.ticker.toLowerCase().includes(debouncedSearch) ||
        r.name?.toLowerCase().includes(debouncedSearch),
      );
    }
    if (sort.dir) {
      const dir = sort.dir === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const va = sort.key === 'ticker' ? a.ticker : (a as Record<string, number>)[`_${sort.key}`];
        const vb = sort.key === 'ticker' ? b.ticker : (b as Record<string, number>)[`_${sort.key}`];
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    return rows;
  }, [holdings, debouncedSearch, sort]);

  const totalShown = filtered.length;
  const cycleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : s.dir === 'desc' ? null : 'asc' } : { key, dir: 'desc' }));
  };

  return (
    <section className="holdings-card" data-testid="holdings-table-card">
      <header className="holdings-toolbar">
        <div className="holdings-toolbar-left">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name…"
            className="holdings-search"
            aria-label="Search holdings"
            data-testid="holdings-search"
            style={{
              padding: '6px 10px',
              background: 'oklch(0.15 0.01 210 / 0.6)',
              border: '1px solid oklch(0.3 0.02 210)',
              borderRadius: 6,
              color: 'oklch(0.88 0.005 200)',
              fontSize: 13,
              minWidth: 200,
            }}
          />
          <span className="holdings-count">({totalShown})</span>
        </div>
        <div className="seg" role="group" aria-label="Row density">
          <button
            className={density === 'compact' ? 'active' : ''}
            onClick={() => setDensity('compact')}
            data-testid="density-compact"
          >
            Compact
          </button>
          <button
            className={density === 'comfortable' ? 'active' : ''}
            onClick={() => setDensity('comfortable')}
            data-testid="density-comfortable"
          >
            Comfortable
          </button>
        </div>
      </header>

      <div className={`holdings-table-wrap holdings-table--${density}`}>
        <table className="holdings-table" data-testid="holdings-table">
          <thead>
            <tr>
              <th onClick={() => cycleSort('ticker')} aria-sort={sort.key === 'ticker' ? (sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none') : 'none'} data-testid="sort-ticker">
                Ticker {sortIndicator(sort, 'ticker')}
              </th>
              <th className="hide-sm" onClick={() => cycleSort('allocation')} aria-sort={sort.key === 'allocation' ? (sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none') : 'none'} data-testid="sort-allocation">
                Allocation {sortIndicator(sort, 'allocation')}
              </th>
              <th onClick={() => cycleSort('value')} aria-sort={sort.key === 'value' ? (sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none') : 'none'} data-testid="sort-value">
                Value {sortIndicator(sort, 'value')}
              </th>
              <th className="hide-sm" onClick={() => cycleSort('daily_pnl')} aria-sort={sort.key === 'daily_pnl' ? (sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none') : 'none'} data-testid="sort-daily">
                Daily {sortIndicator(sort, 'daily_pnl')}
              </th>
              <th className="hide-sm holdings-spark-col">7-day spark</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.ticker}
                onMouseEnter={() => setHovered(r.ticker)}
                onMouseLeave={() => setHovered((cur) => (cur === r.ticker ? null : cur))}
                className={hovered === r.ticker ? 'hover-row' : ''}
                data-testid={`holdings-row-${r.ticker}`}
              >
                <td className="holdings-ticker" data-testid={`holdings-ticker-${r.ticker}`}>
                  <strong>{r.ticker}</strong>
                  {r.name && <span className="holdings-name">{r.name}</span>}
                </td>
                <td className="hide-sm">{(r._allocation ?? 0).toFixed(1)}%</td>
                <td>${(r._value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className={`hide-sm holdings-pnl ${r._daily_pnl >= 0 ? 'pos' : 'neg'}`}>
                  {r._daily_pnl >= 0 ? '+' : ''}{r._daily_pnl.toFixed(2)}%
                </td>
                <td className="hide-sm holdings-spark-col">
                  {hovered === r.ticker && rowsWithSparkData?.[r.ticker] ? (
                    <MiniRowSparkline values={rowsWithSparkData[r.ticker]} />
                  ) : (
                    <span className="holdings-spark-placeholder" aria-hidden="true">↗</span>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="holdings-empty">No holdings match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function sortIndicator(sort: { key: SortKey; dir: SortDir }, key: SortKey) {
  if (sort.key !== key || !sort.dir) return <span className="sort-bullet" aria-hidden="true">·</span>;
  return <span className="sort-bullet active">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
}
