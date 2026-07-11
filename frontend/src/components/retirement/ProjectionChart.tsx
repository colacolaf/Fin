import { useMemo } from 'react';
import type { ProjectionResult } from '../../api/retirement';

interface Props {
  data: ProjectionResult | null;
  yearsToRetirement: number;
}

export default function ProjectionChart({ data, yearsToRetirement }: Props) {
  if (!data || !data.years.length) {
    return <div className="projection-chart empty-chart">No projection data</div>;
  }

  const { years, median_path: medianPath, p10_path: p10Path, p90_path: p90Path } = data;

  const maxBalance = useMemo(() => {
    let m = 0;
    for (const v of p90Path) m = Math.max(m, v);
    return m || 1;
  }, [p90Path]);

  const barWidth = `${Math.max(2, 90 / years.length)}%`;

  return (
    <div className="projection-chart">
      <h3>Monte Carlo Projection</h3>
      <div className="chart-bars" style={{ height: 200 }}>
        {years.map((yr, i) => {
          const median = medianPath[i];
          const low = p10Path[i];
          const high = p90Path[i];
          const medianH = (median / maxBalance) * 100;
          const lowH = (low / maxBalance) * 100;
          const highH = (high / maxBalance) * 100;
          const isRetired = i >= yearsToRetirement;

          return (
            <div
              key={yr}
              className={`chart-col ${isRetired ? 'retired' : ''}`}
              style={{ width: barWidth }}
              title={`Year ${yr}: $${median.toLocaleString()}`}
            >
              <div className="bar-range" style={{ height: `${highH}%` }}>
                <div
                  className="bar-median"
                  style={{ height: `${(medianH / highH) * 100}%` }}
                />
              </div>
              <div
                className="bar-low-line"
                style={{ bottom: `${lowH}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="swatch median"/> Median</span>
        <span className="legend-item"><span className="swatch high"/> 90th %ile</span>
        <span className="legend-item"><span className="swatch low"/> 10th %ile</span>
        <span className="legend-item"><span className="swatch retired"/> Retirement</span>
      </div>
    </div>
  );
}
