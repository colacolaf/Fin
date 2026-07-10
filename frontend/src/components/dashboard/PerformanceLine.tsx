import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import type { PerformancePoint, PerformancePeriod } from '@fin/shared';

interface Props {
  data: PerformancePoint[];
  period: PerformancePeriod;
  onPeriodChange: (p: PerformancePeriod) => void;
}

const PERIODS: PerformancePeriod[] = ['1W', '1M', '3M', '1Y', 'YTD'];

const monthAbbr = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short' });
};

const fmtK = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  return `$${(v / 1000).toFixed(0)}K`;
};

const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

export default function PerformanceLine({ data, period, onPeriodChange }: Props) {
  const hasData = data.length > 0;

  return (
    <div data-testid="performance-line" style={{
      background: 'var(--bg-surface, #0F1F3A)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #E8F4FD)' }}>
          Performance
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              data-testid={`period-${p}`}
              onClick={() => onPeriodChange(p)}
              style={{
                padding: '4px 12px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background: p === period ? 'var(--accent-cyan, #00D4FF)' : 'transparent',
                color: p === period ? '#0A1628' : 'var(--text-secondary, #94A3B8)',
                transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #64748B)' }}>
          No performance data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={monthAbbr}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickFormatter={fmtK}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: '#1A2A4A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#E8F4FD',
                fontSize: 13,
              }}
              formatter={(value: unknown) => [fmtFull(Number(value)), 'Value']}
              labelFormatter={(label: unknown) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
            <Area type="monotone" dataKey="value" fill="url(#perfGrad)" stroke="none" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00D4FF"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}