import type { DebtAccount } from '@fin/shared';

const TYPE_ICONS: Record<string, string> = {
  credit_card: '💳',
  student_loan: '🎓',
  mortgage: '🏠',
  auto_loan: '🚗',
  personal_loan: '💰',
  other: '💰',
};

interface Props {
  account: DebtAccount;
  index: number;
  total_debt: number;
}

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function DebtAccountCard({ account, index, total_debt }: Props) {
  const pct = total_debt > 0 ? Math.max(1, (account.balance / total_debt) * 100) : 0;
  const icon = TYPE_ICONS[account.debt_type] ?? TYPE_ICONS.other;

  return (
    <div className="payoff-progress-item">
      <div className="payoff-progress-label">
        <span>
          {icon} {account.name}
        </span>
        <span>{FMT.format(account.balance)}</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="payoff-progress-meta">
        <span>{account.interest_rate.toFixed(1)}% APR</span>
        <span>Min: {FMT.format(account.minimum_payment)}/mo</span>
        <span>{account.debt_type.replace('_', ' ')}</span>
      </div>
    </div>
  );
}