interface Account {
  name: string;
  type: '401k' | 'IRA' | 'Roth IRA' | 'Taxable' | 'HSA' | 'Pension';
  balance: number;
  contribution_pct: number;
}

interface Props {
  accounts: Account[];
  totalBalance: number;
}

const TYPE_COLORS: Record<string, string> = {
  '401k': '#6366f1',
  'IRA': '#8b5cf6',
  'Roth IRA': '#a78bfa',
  'Taxable': '#f59e0b',
  'HSA': '#10b981',
  'Pension': '#3b82f6',
};

export default function AccountBreakdown({ accounts, totalBalance }: Props) {
  if (!accounts.length) {
    return <div className="account-breakdown empty-state">No retirement accounts configured</div>;
  }

  const denominator = totalBalance || 1;

  return (
    <div className="account-breakdown">
      <h3>Account Breakdown</h3>
      <div className="accounts-bar" style={{ height: 12 }}>
        {accounts.map((a) => {
          const pct = (a.balance / denominator) * 100;
          return (
            <span
              key={a.name}
              className="accounts-bar-segment"
              style={{
                width: `${Math.max(1, pct)}%`,
                backgroundColor: TYPE_COLORS[a.type] || 'var(--color-muted)',
              }}
              title={`${a.name}: ${a.type} — $${a.balance.toLocaleString()}`}
            />
          );
        })}
      </div>
      <ul className="accounts-list">
        {accounts.map((a) => (
          <li key={a.name} className="accounts-item">
            <span className="account-dot" style={{ backgroundColor: TYPE_COLORS[a.type] || 'gray' }} />
            <span className="account-name">{a.name}</span>
            <span className="account-type">{a.type}</span>
            <span className="account-balance">${a.balance.toLocaleString()}</span>
            <span className="account-contrib">{a.contribution_pct}% contrib</span>
          </li>
        ))}
      </ul>
    </div>
  );
}