import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { debtApi } from '../api/debt';
import DebtSummary from '../components/debt/DebtSummary';
import PayoffStrategyToggle, { type Strategy } from '../components/debt/PayoffStrategyToggle';
import PayoffTimeline from '../components/debt/PayoffTimeline';
import DebtAccountCard from '../components/debt/DebtAccountCard';
import { DebtSkeleton } from '../components/ui/PageSkeleton';
import type {
  DebtAccount,
  DebtSummary as DebtSummaryType,
  StrategyComparison,
  PayoffPlan,
} from '@fin/shared';

type DebtFormData = {
  name: string;
  debt_type: string;
  balance: string;
  interest_rate: string;
  minimum_payment: string;
};

const INITIAL_FORM: DebtFormData = {
  name: '',
  debt_type: 'credit_card',
  balance: '',
  interest_rate: '',
  minimum_payment: '',
};

const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'other', label: 'Other' },
];

function fireConfettiLite() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Lightweight in-DOM confetti without adding canvas-confetti as a heavy dep.
  const root = document.body;
  const colors = ['oklch(0.78 0.16 165)', 'oklch(0.72 0.16 170)', 'oklch(0.78 0.06 250)'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 24; i++) {
    const node = document.createElement('span');
    node.className = 'confetti-spark';
    node.style.position = 'fixed';
    node.style.left = `${20 + Math.random() * 60}%`;
    node.style.top = `${10 + Math.random() * 30}%`;
    node.style.background = colors[i % colors.length];
    node.style.animation = `confetti-drop ${900 + Math.random() * 600}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`;
    frag.appendChild(node);
  }
  root.appendChild(frag);
  setTimeout(() => {
    root.querySelectorAll('.confetti-spark').forEach((n) => n.remove());
  }, 1600);
}

export default function DebtDashboard() {
  const [summary, setSummary] = useState<DebtSummaryType | null>(null);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const [perCardExtra, setPerCardExtra] = useState<Map<string, number>>(new Map());
  const [addingAccount, setAddingAccount] = useState(false);
  const [form, setForm] = useState<DebtFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [celebrationFor, setCelebrationFor] = useState<string | null>(null);
  const preCelebrateCountRef = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, comp] = await Promise.all([
        debtApi.getSummary(),
        debtApi.getStrategyComparison(extraPayment),
      ]);
      setSummary(sum);
      setComparison(comp);
    } catch (e) {
      if (e instanceof Error && e.message.includes('404')) {
        setSummary(null);
        setComparison(null);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load debt data');
      }
    } finally {
      setLoading(false);
    }
  }, [extraPayment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const accounts: DebtAccount[] = useMemo(() => summary?.accounts ?? [], [summary]);
  const totalDebt = summary?.total_debt ?? 0;

  const sortedAccounts = useMemo(() => {
    const sorted = [...accounts];
    if (strategy === 'avalanche') sorted.sort((a, b) => b.interest_rate - a.interest_rate);
    else sorted.sort((a, b) => a.balance - b.balance);
    return sorted;
  }, [accounts, strategy]);

  const plan: PayoffPlan | null = strategy === 'avalanche' ? comparison?.avalanche ?? null : comparison?.snowball ?? null;
  const planOther: PayoffPlan | null = strategy === 'avalanche' ? comparison?.snowball ?? null : comparison?.avalanche ?? null;
  const savingsBadge = useMemo(() => {
    if (!comparison) return null;
    const used = strategy === 'avalanche' ? comparison.avalanche : comparison.snowball;
    const other = strategy === 'avalanche' ? comparison.snowball : comparison.avalanche;
    const saved = (other?.total_interest ?? 0) - (used?.total_interest ?? 0);
    const monthsEarlier = (other?.months ?? 0) - (used?.months ?? 0);
    return { saved, monthsEarlier };
  }, [comparison, strategy]);

  const handlePerCardExtraChange = useCallback((accountId: string, value: number) => {
    setPerCardExtra((prev) => {
      const next = new Map(prev);
      next.set(accountId, value);
      return next;
    });
  }, []);

  const perCardSavings = useMemo(() => {
    const out: Record<string, { saved: number; monthsEarlier: number }> = {};
    for (const a of accounts) {
      const extra = perCardExtra.get(a.id) ?? 0;
      if (!extra) continue;
      const r = a.interest_rate / 100 / 12;
      const monthsOriginal = Math.log(a.balance / (a.minimum_payment || 1)) / Math.log(1 + r) || 0;
      const newMonthly = (a.minimum_payment || 0) + extra;
      const monthsBoosted = newMonthly > a.balance ? 1 : Math.log(a.balance / newMonthly) / Math.log(1 + r);
      const monthsDelta = Math.max(0, Math.round(monthsOriginal - monthsBoosted));
      const savedInterest = monthsDelta * a.minimum_payment * (a.interest_rate / 100);
      out[a.id] = { saved: Math.max(0, savedInterest), monthsEarlier: monthsDelta };
    }
    return out;
  }, [accounts, perCardExtra]);

  // Celebration detection — if a debt's balance dropped to 0 from a prior state, fire confetti
  // + post a sticky banner that auto-dismisses after 4s. Single detection per debt per lifetime.
  const celebrationTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!accounts.length) return;
    const zeroIds = accounts.filter((a) => a.balance === 0).map((a) => a.id);
    const ids = new Set(zeroIds);
    for (const id of zeroIds) {
      if (!preCelebrateCountRef.current.has(id)) {
        setCelebrationFor(id);
        fireConfettiLite();
        if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = window.setTimeout(() => setCelebrationFor(null), 4000);
        break; // one celebration at a time
      }
    }
    preCelebrateCountRef.current = ids;
    return () => {
      if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    };
  }, [accounts]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const parsed = {
      name: form.name.trim(),
      debt_type: form.debt_type,
      balance: parseFloat(form.balance),
      interest_rate: parseFloat(form.interest_rate),
      minimum_payment: parseFloat(form.minimum_payment),
    };
    if (!parsed.name || isNaN(parsed.balance) || isNaN(parsed.interest_rate) || isNaN(parsed.minimum_payment)) return;
    setSubmitting(true);
    try {
      await debtApi.createAccount(parsed);
      setAddingAccount(false);
      setForm(INITIAL_FORM);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await debtApi.deleteAccount(id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="debt-dashboard" data-testid="debt-dashboard">
        <DebtSkeleton />
      </div>
    );
  }

  const fadeVariants = {
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
  };

  return (
    <div className="debt-dashboard" data-testid="debt-dashboard">
      <header className="debt-header">
        <div>
          <h1>Debt Decision Theater</h1>
          <p className="debt-sub">Avalanche vs. snowball — with what-ifs per card.</p>
        </div>
        <button className="btn-primary" onClick={() => setAddingAccount(true)} data-testid="debt-add">+ Add Debt</button>
      </header>

      {error && (
        <div className="settings-callout fail" data-testid="debt-error-banner">{error}</div>
      )}

      <div data-testid="debt-summary">
        <DebtSummary
          total_debt={totalDebt}
          monthly_payments={summary?.monthly_payments ?? 0}
          avg_interest_rate={summary?.avg_interest_rate ?? 0}
          debt_count={summary?.debt_count ?? 0}
          dti_ratio={null}
        />
      </div>

      <section className="strategy-cards-wrap">
        <header className="strategy-cards-section-head">
          <h2>Choose your strategy</h2>
          {comparison?.comparison && (
            <span className="strategy-cards-section-meta" data-testid="strategy-meta">
              {strategy === 'avalanche'
                ? `Avalanche saves $${Math.round(comparison.comparison.interest_saved).toLocaleString()} vs. snowball`
                : `Snowball frees up ${comparison.comparison.months_saved ?? '—'} months earlier`}
            </span>
          )}
        </header>
        <PayoffStrategyToggle
          strategy={strategy}
          onChange={setStrategy}
          comparison={
            comparison
              ? {
                  avalanche_interest: comparison.avalanche?.total_interest ?? 0,
                  snowball_interest: comparison.snowball?.total_interest ?? 0,
                  avalanche_months: comparison.avalanche?.months ?? 0,
                  snowball_months: comparison.snowball?.months ?? 0,
                  interest_saved: comparison.comparison?.interest_saved ?? 0,
                }
              : null
          }
          comparisonSeries={{
            avalanche: comparison?.avalanche?.balance_path ?? [],
            snowball: comparison?.snowball?.balance_path ?? [],
          }}
        />
      </section>

      <div className="debt-extra-payment-section">
        <div className="extra-payment-header">
          <h3>Extra monthly payment (global)</h3>
          <span className="extra-payment-value">${extraPayment.toLocaleString()}/mo</span>
        </div>
        <input
          type="range"
          className="extra-payment-slider"
          min={0}
          max={2000}
          step={50}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          aria-label="Global extra monthly payment"
        />
        <div className="extra-payment-labels">
          <span>$0</span>
          <span>$1,000</span>
          <span>$2,000</span>
        </div>
        {savingsBadge && savingsBadge.saved > 0 && (
          <div className="savings-global" data-testid="savings-global">
            Save ${Math.round(savingsBadge.saved).toLocaleString()} · {savingsBadge.monthsEarlier} mo earlier vs. alternate strategy.
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={strategy + (plan?.months ?? 0)}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeVariants}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <PayoffTimeline plan={plan} />
          {planOther && (
            <div className="plan-other-detail" data-testid="plan-other-detail">
              Cross-reference: <strong>{strategy === 'avalanche' ? 'Snowball' : 'Avalanche'}</strong>{' '}
              finishes in {planOther.months} mo, ${Math.round(planOther.total_interest ?? 0).toLocaleString()} interest.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="debt-payoff-section">
        <h2>Your debts</h2>
        <div className="payoff-progress-bars">
          {sortedAccounts.length > 0 ? (
            sortedAccounts.map((account, idx) => (
              <DebtAccountCard
                key={account.id}
                account={account}
                index={idx}
                total_debt={totalDebt}
                perCardExtra={perCardExtra}
                onPerCardExtraChange={handlePerCardExtraChange}
                savingsByAccount={perCardSavings}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No debt accounts yet.</p>
              <button className="btn-primary" onClick={() => setAddingAccount(true)}>Add your first debt</button>
            </div>
          )}
        </div>
      </div>

      {celebrationFor && (
        <aside className="debt-celebration-banner" data-testid="debt-celebration" role="status" aria-live="polite">
          🎉 Debt paid off — congrats!
        </aside>
      )}

      {/* Existing accounts-table kept for backward-parity. */}
      {sortedAccounts.length > 0 && (
        <div className="debt-accounts-section">
          <h2>All Accounts</h2>
          <div className="debt-accounts-table-wrap">
            <table className="debt-accounts-table">
              <thead>
                <tr>
                  <th>#</th><th>Account</th><th>Type</th><th>Balance</th><th>APR</th><th>Min Payment</th><th></th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((account, idx) => (
                  <tr key={account.id} className="debt-account-row">
                    <td>{idx + 1}</td>
                    <td>{account.debt_type === 'credit_card' ? '💳' : account.debt_type === 'mortgage' ? '🏠' : '💰'} {account.name}</td>
                    <td>{account.debt_type.replace('_', ' ')}</td>
                    <td>${account.balance.toLocaleString()}</td>
                    <td>{account.interest_rate.toFixed(1)}%</td>
                    <td>${account.minimum_payment.toLocaleString()}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => setDeleteTarget(account.id)} aria-label={`Delete ${account.name}`}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals: Add + Delete (kept) */}
      {addingAccount && (
        <div className="modal-overlay" onClick={() => setAddingAccount(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Debt Account</h3>
            <form className="add-debt-form" onSubmit={handleAddAccount}>
              <label>Account Name<input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Debt Type<select value={form.debt_type} onChange={(e) => setForm({ ...form, debt_type: e.target.value })}>{DEBT_TYPES.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}</select></label>
              <label>Balance ($)<input type="number" required step="0.01" min="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></label>
              <label>Interest Rate (%)<input type="number" required step="0.01" min="0" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} /></label>
              <label>Minimum Payment ($)<input type="number" required step="0.01" min="0" value={form.minimum_payment} onChange={(e) => setForm({ ...form, minimum_payment: e.target.value })} /></label>
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => { setAddingAccount(false); setForm(INITIAL_FORM); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" style={{ maxWidth: 360, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>This will permanently remove this debt account.</p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'oklch(0.5 0.16 25)', color: 'oklch(0.92 0.06 25)' }} onClick={() => handleDelete(deleteTarget)} disabled={deletingId === deleteTarget}>
                {deletingId === deleteTarget ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
