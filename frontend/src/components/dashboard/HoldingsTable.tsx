import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Holding } from '@fin/shared';

interface Props {
  holdings: Holding[];
}

type SortKey = keyof Holding;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name' },
  { key: 'shares', label: 'Shares' },
  { key: 'avg_cost', label: 'Avg Cost' },
  { key: 'current_price', label: 'Current Price' },
  { key: 'market_value', label: 'Market Value' },
  { key: 'gain_loss_pct', label: 'Gain/Loss %' },
  { key: 'allocation_pct', label: 'Allocation %' },
];

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });

export default function HoldingsTable({ holdings }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('market_value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...holdings].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * dir;
      return ((Number(aVal) || 0) - (Number(bVal) || 0)) * dir;
    });
  }, [holdings, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const formatCell = (key: SortKey, value: unknown, row: Holding) => {
    if (key === 'gain_loss_pct') {
      const v = Number(value);
      return <span style={{ color: v >= 0 ? '#34D399' : '#EF4444' }}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</span>;
    }
    if (key === 'allocation_pct') return `${Number(value).toFixed(2)}%`;
    if (key === 'shares') return fmtNum.format(Number(value));
    if (['avg_cost', 'current_price', 'market_value'].includes(key)) return fmt.format(Number(value));
    return String(value);
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div data-testid="holdings-table" style={{
      background: 'var(--bg-surface, #0F1F3A)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 24,
    }}>
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #E8F4FD)' }}>
        Holdings
      </h3>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary, #94A3B8)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    textAlign: key === 'symbol' || key === 'name' ? 'left' : 'right',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}{sortIndicator(key)}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            {sorted.map((row, i) => (
              <motion.tr
                key={row.symbol}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)';
                }}
              >
                {COLUMNS.map(({ key }) => (
                  <td
                    key={key}
                    style={{
                      padding: '12px 16px',
                      fontSize: 14,
                      color: key === 'symbol' ? 'var(--accent-cyan, #00D4FF)' : 'var(--text-primary, #E8F4FD)',
                      fontVariantNumeric: typeof row[key] === 'number' ? 'tabular-nums' : undefined,
                      textAlign: key === 'symbol' || key === 'name' ? 'left' : 'right',
                      fontWeight: key === 'symbol' ? 600 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCell(key, row[key], row)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}