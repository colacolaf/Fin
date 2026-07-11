import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PayoffPlan } from '@fin/shared';

interface Props {
  plan: PayoffPlan | null;
}

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatTooltip(value: number | string) {
  if (typeof value === 'string') return value;
  return FMT.format(value);
}

export default function PayoffTimeline({ plan }: Props) {
  if (!plan || plan.schedule.length === 0) {
    return (
      <div className="debt-payoff-section">
        <h2>Payoff Timeline</h2>
        <p className="empty-state" style={{ padding: '1rem', color: 'var(--text-muted)' }}>
          No payoff plan yet. Add debts to see your timeline.
        </p>
      </div>
    );
  }

  const payoffDate = plan.payoff_date
    ? new Date(plan.payoff_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${plan.total_months} months`;

  const years = Math.floor(plan.total_months / 12);
  const months = plan.total_months % 12;
  const duration = years > 0 ? `${years}y ${months}m` : `${months}m`;

  // Map PayoffMonth to chart-friendly keys
  const chartData = plan.schedule.map((p) => ({
    month: p.month,
    balance: p.balance_remaining,
    principal: p.principal_paid,
    interest: p.interest_paid,
  }));

  return (
    <div className="debt-payoff-section">
      <h2>Payoff Timeline</h2>

      <div className="payoff-highlights">
        <div className="payoff-highlight">
          <span className="payoff-highlight-label">Payoff Date</span>
          <span className="payoff-highlight-value">{payoffDate}</span>
        </div>
        <div className="payoff-highlight">
          <span className="payoff-highlight-label">Duration</span>
          <span className="payoff-highlight-value">{duration}</span>
        </div>
        <div className="payoff-highlight">
          <span className="payoff-highlight-label">Total Interest</span>
          <span className="payoff-highlight-value">{FMT.format(plan.total_interest)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="debtPayoffGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--bio-debt)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--bio-debt)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.02 200)" />
          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            tick={{ fontSize: 11 }}
            label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fill: 'var(--text-muted)', fontSize: 11 } }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatTooltip}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--surface-overlay)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
            }}
            formatter={(value: unknown) => formatTooltip(value as number)}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--bio-debt)"
            strokeWidth={2}
            fill="url(#debtPayoffGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}