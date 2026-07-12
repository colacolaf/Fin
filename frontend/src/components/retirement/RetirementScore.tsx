import { useEffect, useState } from 'react';
import type { ReadinessResult } from '../../api/retirement';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface RetirementScoreNewProps {
  data: ReadinessResult;
  currentAge: number;
  retirementAge: number;
}

function useCountdown(from: number, to: number): number {
  const [v, setV] = useState(Math.max(0, to - from));
  useEffect(() => {
    setV(Math.max(0, to - from));
  }, [from, to]);
  return v;
}

export default function RetirementScore({ data, currentAge, retirementAge }: RetirementScoreNewProps) {
  const animatedScore = useAnimatedNumber(data.score);
  const animatedFunded = useAnimatedNumber(data.funded_pct);
  const years = useCountdown(currentAge, retirementAge);
  const closeToRetirement = years < 5;
  const color: string =
    animatedScore >= 75 ? 'oklch(0.72 0.16 170)' : animatedScore >= 50 ? 'oklch(0.78 0.14 75)' : 'oklch(0.65 0.18 25)';

  const ringR = 70;
  const ringC = 2 * Math.PI * ringR;
  const ringDash = (Math.min(100, animatedScore) / 100) * ringC;

  return (
    <section className="retirement-countdown" data-testid="retirement-score" aria-label="Retirement readiness">
      <div className="retirement-countdown-ring">
        <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
          <circle cx="85" cy="85" r={ringR} fill="none" stroke="oklch(0.25 0.02 210 / 0.55)" strokeWidth="9" />
          <circle
            cx="85"
            cy="85"
            r={ringR}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={`${ringDash} ${ringC - ringDash}`}
            transform="rotate(-90 85 85)"
            strokeLinecap="round"
          />
        </svg>
        <div className="retirement-countdown-number" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {years}
        </div>
      </div>
      <span className="retirement-countdown-label">
        {closeToRetirement ? 'Less than 5 years — review glide-path' : `Years to retirement`}
      </span>
      <div style={{ display: 'flex', gap: 24, marginTop: 12, justifyContent: 'center' }}>
        <div>
          <span className="retirement-countdown-label">Readiness score</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>{Math.round(animatedScore)}/100</div>
        </div>
        <div>
          <span className="retirement-countdown-label">Funded %</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.round(animatedFunded)}%</div>
        </div>
      </div>
    </section>
  );
}
