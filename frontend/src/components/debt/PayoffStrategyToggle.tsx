import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export type Strategy = 'avalanche' | 'snowball';

interface PayoffStrategyToggleProps {
  strategy: Strategy;
  onChange: (s: Strategy) => void;
  comparison: null | {
    avalanche_interest: number;
    snowball_interest: number;
    avalanche_months: number;
    snowball_months: number;
    interest_saved: number;
  };
  comparisonSeries?: { avalanche: number[]; snowball: number[] };
}

function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtMonths(m: number): string {
  if (m <= 0) return '— mo';
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

function useAnimatedNumber(target: number, durMs = 380): number {
  const [val, setVal] = useState(target);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = val;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function PayoffStrategyToggle({ strategy, onChange, comparison, comparisonSeries }: PayoffStrategyToggleProps) {
  return (
    <div className="strategy-cards-row" data-testid="strategy-cards-row">
      <StrategyCard
        name="avalanche"
        label="Avalanche"
        eyebrow="Highest APR first"
        months={comparison?.avalanche_months ?? 60}
        interest={comparison?.avalanche_interest ?? 0}
        series={comparisonSeries?.avalanche ?? []}
        active={strategy === 'avalanche'}
        onSelect={() => onChange('avalanche')}
      />
      <StrategyCard
        name="snowball"
        label="Snowball"
        eyebrow="Smallest balance first"
        months={comparison?.snowball_months ?? 60}
        interest={comparison?.snowball_interest ?? 0}
        series={comparisonSeries?.snowball ?? []}
        active={strategy === 'snowball'}
        onSelect={() => onChange('snowball')}
      />
    </div>
  );
}

function StrategyCard({
  label,
  eyebrow,
  months,
  interest,
  series,
  active,
  onSelect,
}: {
  name: string;
  label: string;
  eyebrow: string;
  months: number;
  interest: number;
  series: number[];
  active: boolean;
  onSelect: () => void;
}) {
  const animatedMonths = useAnimatedNumber(months);
  const animatedInterest = useAnimatedNumber(interest);
  const data = series.slice(-24).map((v, i) => ({ i, balance: v }));
  const interestSavedHint = label === 'Avalanche' && series.length ? 'Saves the most interest overall' : 'Wins on quick psychological wins';

  return (
    <button
      type="button"
      className={`strategy-card ${active ? 'strategy-card--active' : 'strategy-card--inactive'}`}
      onClick={onSelect}
      data-testid={`strategy-card-${label.toLowerCase()}`}
      aria-pressed={active}
      aria-label={`${label} strategy: ${fmtMonths(months)} payoff, ${fmtUsd(interest)} total interest`}
    >
      <header className="strategy-card-head">
        <span className="strategy-card-eyebrow">{eyebrow}</span>
        <h3 className="strategy-card-title">{label}</h3>
      </header>
      <div className="strategy-card-stats">
        <span className="strategy-card-stat-label">Payoff in</span>
        <span className="strategy-card-stat-value">{fmtMonths(Math.round(animatedMonths))}</span>
        <span className="strategy-card-stat-label">Total interest</span>
        <span className="strategy-card-stat-value">{fmtUsd(Math.round(animatedInterest))}</span>
      </div>
      <div className="strategy-card-chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height={56}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.16 170 / 0.5)" />
                <stop offset="100%" stopColor="oklch(0.72 0.16 170 / 0)" />
              </linearGradient>
            </defs>
            <Area dataKey="balance" type="monotone" stroke="oklch(0.72 0.16 170)" strokeWidth={1.6} fill={`url(#grad-${label})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <footer className="strategy-card-foot">
        <span className="strategy-card-cta">{active ? '✓ Selected' : 'Choose ' + label}</span>
        <span className="strategy-card-hint">{interestSavedHint}</span>
      </footer>
    </button>
  );
}
