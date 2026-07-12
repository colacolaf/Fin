import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface Props {
  totalValue: number;
  dailyChange: number;
  dailyChangePct: number;
  totalReturnPct: number;
  cash: number;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function PortfolioSummary({ totalValue, dailyChange, dailyChangePct, totalReturnPct, cash }: Props) {
  const animatedTotal = useAnimatedNumber(totalValue, { decimals: 2 });
  const animatedChange = useAnimatedNumber(Math.abs(dailyChange), { decimals: 2 });
  const animatedReturn = useAnimatedNumber(Math.abs(totalReturnPct), { decimals: 2 });
  const animatedCash = useAnimatedNumber(cash, { decimals: 2 });

  const isPositive = dailyChange >= 0;

  return (
    <div
      data-testid="portfolio-summary"
      style={{
        background: 'var(--bg-surface, #0F1F3A)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 24,
        transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Portfolio Value
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary, #E8F4FD)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt.format(animatedTotal)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div data-testid="daily-change" style={{
          flex: 1, minWidth: 120,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginBottom: 4 }}>Daily Change</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: isPositive ? '#34D399' : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
            {isPositive ? '▲' : '▼'} {fmt.format(animatedChange)} ({pct(dailyChangePct)})
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: 120,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginBottom: 4 }}>Total Return</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: totalReturnPct >= 0 ? '#34D399' : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
            {pct(totalReturnPct)}
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: 120,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginBottom: 4 }}>Cash</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary, #E8F4FD)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt.format(animatedCash)}
          </div>
        </div>
      </div>
    </div>
  );
}