import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import type { ReadinessResult } from '../../api/retirement';

interface Props {
  data: ReadinessResult | null;
}

const STROKE_DASH = 283; // 2 * PI * 45
const COLORS: Record<number, { ring: string; text: string }> = {
  0: { ring: '#ef4444', text: 'var(--color-danger)' },
  1: { ring: '#f59e0b', text: 'var(--color-warning)' },
  2: { ring: '#10b981', text: 'var(--color-success)' },
};

function colorForScore(s: number) {
  if (s < 40) return COLORS[0];
  if (s < 70) return COLORS[1];
  return COLORS[2];
}

const BREAKDOWN_ITEMS: [string, keyof ReadinessResult['breakdown']][] = [
  ['Projection', 'projection'],
  ['Savings Rate', 'savings_rate'],
  ['Funded Ratio', 'funded_ratio'],
  ['Age Benchmark', 'age_benchmark'],
];

export default function RetirementScore({ data }: Props) {
  if (!data) return <div className="retirement-score empty">No readiness data</div>;

  const { score, label, breakdown, details } = data;
  const animated = useAnimatedNumber(score, { decimals: 0 });
  const funded = useAnimatedNumber(details.funded_percentage, { decimals: 1 });
  const c = colorForScore(score);
  const offset = STROKE_DASH - (STROKE_DASH * Math.min(100, animated)) / 100;

  return (
    <div className="retirement-score">
      <div className="score-gauge">
        <svg viewBox="0 0 120 120" className="gauge-svg">
          <circle cx="60" cy="60" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="45" fill="none" stroke={c.ring}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={STROKE_DASH} strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
          <text x="60" y="52" textAnchor="middle" className="gauge-score"
            fill={c.text} fontSize="28" fontWeight="700">
            {animated}
          </text>
          <text x="60" y="72" textAnchor="middle" className="gauge-label"
            fill="var(--color-muted)" fontSize="11">
            / 100
          </text>
        </svg>
      </div>

      <div className="score-meta">
        <div className="score-label">{label}</div>
        <div className="score-funded">
          <span className="funded-value">{funded}%</span> funded
        </div>
        <div className="score-detail">
          Median nest egg: ${Math.round(details.median_nest_egg).toLocaleString()}
        </div>
        <div className="score-detail">
          Monthly: ${Math.round(details.median_monthly_income).toLocaleString()}/mo
        </div>
      </div>

      <div className="score-breakdown">
        {BREAKDOWN_ITEMS.map(([name, key]) => {
          const val = breakdown[key];
          return (
            <div key={key} className="breakdown-item">
              <span className="breakdown-name">{name}</span>
              <span className="breakdown-bar-track">
                <span
                  className="breakdown-bar"
                  style={{
                    width: `${Math.min(100, Math.max(0, val))}%`,
                    backgroundColor: colorForScore(val).ring,
                  }}
                />
              </span>
              <span className="breakdown-value">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
