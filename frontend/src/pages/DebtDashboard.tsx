import { useEffect, useState, useCallback, useMemo } from 'react';
import { debtApi } from '../api/debt';
import DebtSummary from '../components/debt/DebtSummary';
import PayoffStrategyToggle from '../components/debt/PayoffStrategyToggle';
import PayoffTimeline from '../components/debt/PayoffTimeline';
import DebtAccountCard from '../components/debt/DebtAccountCard';
import type {
  DebtAccount,
  DebtSummary as DebtSummaryType,
  StrategyComparison,
  PayoffPlan,
} from '@fin/shared';

type Strategy = 'avalanche' | 'snowball';

// ── Types for debt form ──

interface DebtFormData {
  name: string;
  debt_type: string;
  balance: string;
  interest_rate: string;
  minimum_payment: string;
}

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

// ── Dashboard ──

export default function DebtDashboard() {
  const [summary, setSummary] = useState<DebtSummaryType | null>(null);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const [addingAccount, setAddingAccount] = useState(false);
  const [form, setForm] = useState<DebtFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Data Fetching ──

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

  // ── Derived Data ──

  const accounts: DebtAccount[] = useMemo(() => summary?.accounts ?? [], [summary]);

  const sortedAccounts = useMemo(() => {
    const sorted = [...accounts];
    if (strategy === 'avalanche') {
      sorted.sort((a, b) => b.interest_rate - a.interest_rate);
    } else {
      sorted.sort((a, b) => a.balance - b.balance);
    }
    return sorted;
  }, [accounts, strategy]);

  const totalDebt = summary?.total_debt ?? 0;
  const plan: PayoffPlan | null = strategy === 'avalanche' ? comparison?.avalanche ?? null : comparison?.snowball ?? null;

  // ── Handlers ──

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

    if (!parsed.name || isNaN(parsed.balance) || isNaN(parsed.interest_rate) || isNaN(parsed.minimum_payment)) {
      return;
    }

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

  // ── Render ──

  if (loading) {
    return (
      <div className="debt-dashboard" data-testid="debt-dashboard">
        <div className="loading" data-testid="debt-loading">Loading debt dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="debt-dashboard" data-testid="debt-dashboard">
        <div className="error" data-testid="debt-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="debt-dashboard" data-testid="debt-dashboard">
      {/* Header */}
      <header className="debt-header">
        <h1>Debt Dashboard</h1>
        <div className="debt-header-actions">
          <button className="btn btn-primary" onClick={() => setAddingAccount(true)}>
            + Add Debt
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div data-testid="debt-summary" className="debt-total">
        <DebtSummary
          total_debt={totalDebt}
          monthly_payments={summary?.monthly_payments ?? 0}
          avg_interest_rate={summary?.avg_interest_rate ?? 0}
          debt_count={summary?.debt_count ?? 0}
          dti_ratio={null}
        />
      </div>

      {/* Strategy Toggle */}
      <PayoffStrategyToggle
        strategy={strategy}
        onChange={setStrategy}
        comparison={comparison?.comparison ?? null}
      />

      {/* Extra Payment Slider */}
      <div className="debt-extra-payment-section">
        <div className="extra-payment-header">
          <h3>Extra Monthly Payment</h3>
          <span className="extra-payment-value">
            ${extraPayment.toLocaleString()}/mo
          </span>
        </div>
        <input
          type="range"
          className="extra-payment-slider"
          min={0}
          max={2000}
          step={50}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
        />
        <div className="extra-payment-labels">
          <span>$0</span>
          <span>$1,000</span>
          <span>$2,000</span>
        </div>
      </div>

      {/* Payoff Timeline */}
      <PayoffTimeline plan={plan} />

      {/* Accounts with Progress Bars */}
      <div className="debt-payoff-section">
        <h2>Your Debts</h2>
        <div className="payoff-progress-bars">
          {sortedAccounts.length > 0 ? (
            sortedAccounts.map((account, idx) => (
              <DebtAccountCard
                key={account.id}
                account={account}
                index={idx}
                total_debt={totalDebt}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No debt accounts yet.</p>
              <button className="btn btn-primary" onClick={() => setAddingAccount(true)}>
                Add your first debt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accounts Table */}
      {sortedAccounts.length > 0 && (
        <div className="debt-accounts-section">
          <h2>All Accounts</h2>
          <div className="debt-accounts-table-wrap">
            <table className="debt-accounts-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>APR</th>
                  <th>Min Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((account, idx) => (
                  <tr key={account.id} className="debt-account-row">
                    <td className="priority-cell">{idx + 1}</td>
                    <td className="name-cell">
                      <span className="account-icon">
                        {account.debt_type === 'credit_card' && '💳'}
                        {account.debt_type === 'student_loan' && '🎓'}
                        {account.debt_type === 'mortgage' && '🏠'}
                        {account.debt_type === 'auto_loan' && '🚗'}
                        {account.debt_type === 'personal_loan' && '💰'}
                        {account.debt_type === 'other' && '💰'}
                      </span>
                      {account.name}
                    </td>
                    <td className="type-cell">{account.debt_type.replace('_', ' ')}</td>
                    <td>${account.balance.toLocaleString()}</td>
                    <td>{account.interest_rate.toFixed(1)}%</td>
                    <td>${account.minimum_payment.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--text-xs)', padding: '0.25rem 0.5rem' }}
                        onClick={() => setDeleteTarget(account.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {addingAccount && (
        <div className="modal-overlay" onClick={() => setAddingAccount(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Debt Account</h3>
            <form className="add-debt-form" onSubmit={handleAddAccount}>
              <label>
                Account Name
                <input
                  type="text"
                  placeholder="e.g. Chase Sapphire"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Debt Type
                <select
                  value={form.debt_type}
                  onChange={(e) => setForm({ ...form, debt_type: e.target.value })}
                >
                  {DEBT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Balance ($)
                <input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  required
                />
              </label>
              <label>
                Interest Rate (%)
                <input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                  required
                />
              </label>
              <label>
                Minimum Payment ($)
                <input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={form.minimum_payment}
                  onChange={(e) => setForm({ ...form, minimum_payment: e.target.value })}
                  required
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setAddingAccount(false); setForm(INITIAL_FORM); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h3>Delete Account?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
              This will permanently remove this debt account.
            </p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'oklch(65% 0.18 25)' }}
                onClick={() => handleDelete(deleteTarget)}
                disabled={deletingId === deleteTarget}
              >
                {deletingId === deleteTarget ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}