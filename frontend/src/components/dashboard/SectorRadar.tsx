import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SectorRadarProps {
  data: Array<{ sector: string; weight: number; benchmark: number }>;
}

export default function SectorRadar({ data }: SectorRadarProps) {
  if (!data.length) return null;
  return (
    <div className="sector-radar" data-testid="sector-radar" aria-label="Sector breakdown">
      <header className="sector-radar-header">
        <h3>Sector breakdown</h3>
        <span className="sector-radar-legend">
          <i className="legend-dot legend-dot--portfolio" /> Portfolio
          <i className="legend-dot legend-dot--bench" /> S&P 500
        </span>
      </header>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.32 0.02 210 / 0.45)" />
          <PolarAngleAxis
            dataKey="sector"
            tick={{ fill: 'oklch(0.7 0.01 200)', fontSize: 11 }}
          />
          <Radar
            name="Portfolio"
            dataKey="weight"
            stroke="oklch(0.72 0.16 170)"
            fill="oklch(0.72 0.16 170 / 0.32)"
            strokeWidth={1.4}
            isAnimationActive={false}
          />
          <Radar
            name="S&P 500"
            dataKey="benchmark"
            stroke="oklch(0.55 0.04 250)"
            fill="oklch(0.55 0.04 250 / 0.10)"
            strokeWidth={1}
            strokeDasharray="3 2"
            isAnimationActive={false}
          />
          <Tooltip
            cursor={{ stroke: 'oklch(0.45 0.02 210)', strokeWidth: 1 }}
            contentStyle={{
              background: 'oklch(0.18 0.015 205 / 0.92)',
              border: '1px solid oklch(0.3 0.02 210)',
              borderRadius: 10,
              color: 'oklch(0.88 0.005 200)',
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
