import { useMemo } from 'react';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import type { Holding } from '@fin/shared';

interface Props {
  holdings: Holding[];
}

export default function ConcentrationMeter({ holdings }: Props) {
  const { maxAllocation, topSymbol } = useMemo(() => {
    if (!holdings.length) return { maxAllocation: 0, topSymbol: '' };
    const top = holdings.reduce((max, h) => h.allocation_pct > max.allocation_pct ? h : max, holdings[0]);
    return { maxAllocation: top.allocation_pct, topSymbol: top.symbol };
  }, [holdings]);

  const animatedPct = useAnimatedNumber(maxAllocation, { decimals: 1 });

  const barColor = maxAllocation < 20 ? '#34D399' : maxAllocation <= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div data-testid="concentration-meter" style={{
      background: 'var(--bg-surface, #0F1F3A)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 24,
    }}>
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #E8F4FD)' }}>
        Portfolio Concentration
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div data-testid="concentration-warning" className={maxAllocation > 30 ? 'concentration-warning' : ''} style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: 4,
            background: barColor,
            width: `${Math.min(maxAllocation, 100)}%`,
            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
        </div>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: barColor,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'right',
        }}>
          {animatedPct}%
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)' }}>
        Highest: <span style={{ color: 'var(--accent-cyan, #00D4FF)', fontWeight: 600 }}>{topSymbol}</span>
      </div>
    </div>
  );
}