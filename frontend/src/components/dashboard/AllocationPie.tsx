import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AssetClassBreakdown } from '@fin/shared';

interface Props {
  data: AssetClassBreakdown[];
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function AllocationPie({ data }: Props) {
  if (!data.length) {
    return (
      <div data-testid="allocation-pie" style={{
        background: 'var(--bg-surface, #0F1F3A)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted, #64748B)',
      }}>
        No allocation data
      </div>
    );
  }

  return (
    <div data-testid="allocation-pie" style={{
      background: 'var(--bg-surface, #0F1F3A)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 24,
    }}>
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #E8F4FD)' }}>
        Asset Allocation
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            dataKey="allocation_pct"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1A2A4A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#E8F4FD',
              fontSize: 13,
            }}
            formatter={(value: unknown, name: unknown) => [`${Number(value).toFixed(1)}%`, String(name)]}
          />
          <Legend
            wrapperStyle={{ color: 'var(--text-secondary, #94A3B8)', fontSize: 12, paddingTop: 16 }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}