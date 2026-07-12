import { useMemo } from 'react';
import type { Holding } from '@fin/shared';

interface ConcentrationMeterProps {
  holdings: Holding[];
}

function classify(value: number, okMax: number, watchMax: number) {
  if (value <= okMax) return 'ok';
  if (value <= watchMax) return 'watch';
  return 'reduce';
}

export default function ConcentrationMeter({ holdings }: ConcentrationMeterProps) {
  const stats = useMemo(() => {
    if (!holdings.length) return null;
    const total =
      holdings.reduce((sum, h) => sum + (h.market_value ?? h.allocation_pct ?? 0), 0) || 1;
    const ranked = [...holdings]
      .map((h) => ({ ...h, weight: ((h.market_value ?? h.allocation_pct ?? 0) / total) * 100 }))
      .sort((a, b) => b.weight - a.weight);
    const top = ranked[0]?.weight ?? 0;
    const top5 = ranked.slice(0, 5).reduce((s, h) => s + h.weight, 0);
    return { top, top5 };
  }, [holdings]);

  if (!stats) return null;

  return (
    <section className="concentration-meter" data-testid="concentration-meter">
      <header className="concentration-meter-header">
        <h3>Concentration</h3>
        <span className="concentration-meter-blurb">
          Larger single positions = more idiosyncratic risk.
        </span>
      </header>
      <div className="concentration-dual">
        <Gauge
          label="Largest holding"
          value={stats.top}
          kind={classify(stats.top, 12, 20)}
          testId="concentration-top"
        />
        <Gauge
          label="Top 5"
          value={stats.top5}
          kind={classify(stats.top5, 35, 55)}
          testId="concentration-top5"
        />
      </div>
    </section>
  );
}

function Gauge({ label, value, kind, testId }: { label: string; value: number; kind: 'ok' | 'watch' | 'reduce'; testId: string }) {
  const angle = Math.min(180, (value / 100) * 180);
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const x = cx + radius * Math.cos((Math.PI - angle) * (Math.PI / 180));
  const y = cy - radius * Math.sin((Math.PI - angle) * (Math.PI / 180));
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y}`;
  const color =
    kind === 'reduce'
      ? 'oklch(0.6 0.18 25)'
      : kind === 'watch'
        ? 'oklch(0.78 0.14 75)'
        : 'oklch(0.72 0.16 170)';

  return (
    <div className={`concentration-gauge concentration-gauge--${kind}`} data-testid={testId}>
      <svg width="180" height="100" viewBox="0 0 180 100" aria-hidden="true">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="oklch(0.25 0.02 210 / 0.65)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <div className="concentration-gauge-readout">
        <span className="concentration-gauge-value">{value.toFixed(1)}%</span>
        <span className={`concentration-gauge-kind concentration-gauge-kind--${kind}`}>
          {kind === 'ok' ? 'OK' : kind === 'watch' ? 'Watch' : 'Reduce'}
        </span>
      </div>
      <span className="concentration-gauge-label">{label}</span>
    </div>
  );
}
