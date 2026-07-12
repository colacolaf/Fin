import { useState } from 'react';
import type { DebtAccount } from '@fin/shared';
import { IconChevronDown } from '../layout/Icons';

interface DebtAccountCardProps {
  account: DebtAccount;
  index: number;
  total_debt: number;
  perCardExtra?: Map<string, number>;
  onPerCardExtraChange?: (accountId: string, value: number) => void;
  savingsByAccount?: Record<string, { saved: number; monthsEarlier: number }>;
}

const debtIcons: Record<string, string> = {
  credit_card: '💳',
  student_loan: '🎓',
  mortgage: '🏠',
  auto_loan: '🚗',
  personal_loan: '💰',
  other: '💰',
};

export default function DebtAccountCard({ account, index, total_debt, perCardExtra, onPerCardExtraChange, savingsByAccount }: DebtAccountCardProps) {
  const [open, setOpen] = useState(false);
  const share = total_debt > 0 ? (account.balance / total_debt) * 100 : 0;
  // Progress ring — assume starting balance was double current (heuristic).
  const initialHeuristic = account.balance + account.balance * 0.6;
  const progressPct = Math.min(100, Math.max(0, ((initialHeuristic - account.balance) / initialHeuristic) * 100));
  const ringColor = progressPct >= 75 ? 'oklch(0.78 0.16 165)' : progressPct >= 50 ? 'oklch(0.78 0.14 75)' : 'oklch(0.6 0.18 25)';
  const extra = perCardExtra?.get(account.id) ?? 0;
  const savings = savingsByAccount?.[account.id];

  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (progressPct / 100) * c;

  return (
    <article className="debt-account-card" data-testid={`debt-account-${account.id}`}>
      <header className="debt-account-card-head">
        <div className="debt-account-priority">#{index + 1}</div>
        <div className="debt-account-card-info">
          <div className="debt-account-name">
            <span aria-hidden="true">{debtIcons[account.debt_type] ?? '💰'}</span> {account.name}
          </div>
          <div className="debt-account-meta">
            ${account.balance.toLocaleString()} · {account.interest_rate.toFixed(1)}% APR · ${account.minimum_payment.toLocaleString()}/mo
          </div>
        </div>
        <div className="debt-account-progress" aria-label={`${progressPct.toFixed(0)}% paid down`}>
          <svg width="56" height="56" viewBox="0 0 56 56" className="debt-account-progress-svg">
            <circle cx="28" cy="28" r={r} fill="none" stroke="oklch(0.25 0.02 210 / 0.6)" strokeWidth="3" />
            <circle cx="28" cy="28" r={r} fill="none" stroke={ringColor} strokeWidth="3" strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 28 28)" strokeLinecap="round" />
            <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight={700} fill="oklch(0.88 0.005 200)">{Math.round(progressPct)}%</text>
          </svg>
        </div>
      </header>

      <div className="debt-account-share-bar" aria-hidden="true">
        <div className="debt-account-share-fill" style={{ width: `${share.toFixed(1)}%` }} />
      </div>

      <button
        type="button"
        className="debt-account-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`debt-account-${account.id}-extra`}
        data-testid={`debt-account-toggle-${account.id}`}
      >
        Try +$ to this card <IconChevronDown size={14} className={open ? 'rotate-up' : ''} />
      </button>

      {open && (
        <div id={`debt-account-${account.id}-extra`} className="debt-account-extra">
          <label className="slider">
            <span className="slider-label">+$/mo</span>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={extra}
              onChange={(e) => onPerCardExtraChange?.(account.id, Number(e.target.value))}
              aria-valuenow={extra}
              aria-label={`Extra monthly payment to ${account.name}`}
              data-testid={`debt-account-extra-${account.id}`}
            />
            <span className="slider-value">${extra}/mo</span>
          </label>
          {savings && savings.saved > 0 && (
            <span className="savings-badge" data-testid={`debt-account-savings-${account.id}`}>
              Saves ${Math.round(savings.saved)} · {savings.monthsEarlier} mo earlier
            </span>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onPerCardExtraChange?.(account.id, 0)}
          >
            Reset
          </button>
        </div>
      )}
    </article>
  );
}
