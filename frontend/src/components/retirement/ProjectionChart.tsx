import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line } from 'recharts';
import type { ProjectionResult } from '../../api/retirement';

interface Props {
  data: ProjectionResult;
  yearsToRetirement: number;
  glidePath?: { equityPct: number };
}

function TimeHorizonCapsule({ years }: { years: number }) {
  if (!years) return null;
  return (
    <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" className="time-horizon-capsule" aria-hidden="true">
      <defs>
        <linearGradient id="capsuleGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.72 0.16 170 / 0.7)" />
          <stop offset="100%" stopColor="oklch(0.55 0.01 200 / 0.4)" />
        </linearGradient>
      </defs>
      <rect x="0" y="2" width="100" height="4" rx="2" fill="url(#capsuleGrad)" />
      <text x="0" y="6" fontSize="6" fontWeight="600" fill="oklch(0.78 0.16 170)">TODAY</text>
      <text x="86" y="6" fontSize="6" fontWeight="600" fill="oklch(0.55 0.01 200)">RETIRE</text>
    </svg>
  );
}

export default function ProjectionChart({ data, yearsToRetirement, glidePath }: Props) {
  const series = (data.p10_path ?? []).map((_, i) => ({
    age: (data.start_age ?? 30) + i,
    median: data.median_path?.[i] ?? 0,
    p10: data.p10_path?.[i] ?? 0,
    p90: data.p90_path?.[i] ?? 0,
  }));

  return (
    <section className="bg-card" data-testid="projection-chart" style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Projected Nest Egg</h3>
        <span className="retirement-countdown-label">
          {glidePath ? `${glidePath.equityPct}% equity` : 'Default glide path'} · {yearsToRetirement} yr
        </span>
      </header>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <CartesianGrid stroke="oklch(0.32 0.02 210 / 0.4)" strokeDasharray="2 3" />
          <XAxis dataKey="age" stroke="oklch(0.55 0.01 200)" fontSize={11} />
          <YAxis stroke="oklch(0.55 0.01 200)" fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
          <Tooltip
            contentStyle={{
              background: 'oklch(0.18 0.015 205 / 0.92)',
              border: '1px solid oklch(0.3 0.02 210)',
              borderRadius: 10,
              color: 'oklch(0.88 0.005 200)',
              fontSize: 12,
            }}
            formatter={(value: unknown) => `$${Math.round(Number(value)).toLocaleString()}`}
          />
          <Bar dataKey="median" fill="oklch(0.72 0.16 170 / 0.7)" barSize={20} isAnimationActive={false} />
          <Line dataKey="p10" stroke="oklch(0.55 0.10 25 / 0.6)" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line dataKey="p90" stroke="oklch(0.55 0.10 170 / 0.6)" strokeWidth={1} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <TimeHorizonCapsule years={yearsToRetirement} />
    </section>
  );
}
