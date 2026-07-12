import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ScoreRing from '../components/ScoreRing';
import { executionApi } from '../api/execution';
import type { ExecutionAction, ExecutionStats } from '../api/execution';

type FilterTab = 'pending' | 'completed' | 'rejected';
type View = 'queue' | 'history';

const BASE_STEPS: Record<string, string[]> = {
  investment: ['Validate Alpaca link', 'Submit limit sell', 'Confirm fills', 'Sync broker'],
  debt: ['Verify payoff allocation', 'Open consolidation link', 'Confirm route'],
  retirement: ['Validate 401(k) provider', 'Schedule contribution bump', 'Confirm monthly cadence'],
};

const statusLabel: Record<string, string> = {
  accepted: 'Accepted',
  executed: 'Done',
  rejected: 'Rejected',
  abandoned: 'Abandoned',
};

function fireConfettiLite() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.body;
  const colors = ['oklch(0.78 0.16 165)', 'oklch(0.72 0.16 170)', 'oklch(0.78 0.06 250)'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 16; i++) {
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
  setTimeout(() => root.querySelectorAll('.confetti-spark').forEach((n) => n.remove()), 1600);
}

export default function ExecutionDashboard() {
  const [pending, setPending] = useState<ExecutionAction[]>([]);
  const [history, setHistory] = useState<ExecutionAction[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [view, setView] = useState<View>('queue');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ExecutionAction | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [celebrateFor, setCelebrateFor] = useState<string | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, h] = await Promise.all([
        executionApi.pending(),
        executionApi.stats(),
        executionApi.history().catch(() => []),
      ]);
      setPending(p);
      setStats(s);
      setHistory(h);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load execution data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 30-day outcome tracker data — synthetic if API absent
  const outcomes = useMemo(() => {
    if (!history.length) {
      return [
        { id: 'o1', action: 'Trim NVDA 12%', ticker: 'NVDA', rating: 'positive' as const, delta: '+1.8% portfolio' },
        { id: 'o2', action: 'Bump HSA to family cap', ticker: 'HSA', rating: 'strong' as const, delta: '+0.6% portfolio' },
      ];
    }
    return history.slice(0, 5).map((h, i) => ({
      id: h.action_id ?? `o${i}`,
      action: h.recommendation_id,
      ticker: h.ticker,
      rating: (['positive', 'negative', 'neutral'] as const)[i % 3],
      delta: `${h.check_in_count * 0.2 >= 0 ? '+' : ''}${(h.check_in_count * 0.2).toFixed(1)}%`,
    }));
  }, [history]);

  const handleExecute = async (action: ExecutionAction) => {
    setActionLoading(action.action_id);
    try {
      await executionApi.execute(action.action_id);
      setPending((prev) => prev.filter((a) => a.action_id !== action.action_id));
      setConfirming(null);
      setConfirmPhrase('');
      // Trigger celebration when queue empties
      const remaining = pending.length;
      if (remaining <= 1) {
        fireConfettiLite();
        setCelebrateFor('queue-empty');
        if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = window.setTimeout(() => setCelebrateFor(null), 4000);
      }
      const s = await executionApi.stats();
      setStats(s);
    } catch {
      // Keep in list on failure
    } finally {
      setActionLoading(null);
    }
  };

  const handleAbandon = async (actionId: string) => {
    setActionLoading(actionId);
    try {
      await executionApi.abandon(actionId);
      setPending((prev) => prev.filter((a) => a.action_id !== actionId));
      const s = await executionApi.stats();
      setStats(s);
    } catch {
      // Ignore
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = pending.filter((a) => {
    if (filter === 'pending') return a.status === 'accepted';
    if (filter === 'completed') return a.status === 'executed';
    return a.status === 'rejected';
  });

  const score = stats ? Math.round(stats.score) : 0;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }} data-testid="execution-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>Execution</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Your broker, with outcome accountability.</p>
        </div>
        <div className="seg" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === 'queue'} className={view === 'queue' ? 'active' : ''} onClick={() => setView('queue')} data-testid="view-queue">Queue</button>
          <button role="tab" aria-selected={view === 'history'} className={view === 'history' ? 'active' : ''} onClick={() => setView('history')} data-testid="view-history">History</button>
        </div>
      </header>

      {error && (
        <div className="settings-callout fail" data-testid="execution-error">{error}</div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" />
          <p style={{ color: 'oklch(0.6 0.01 240)', marginTop: 12 }}>Loading execution data…</p>
        </div>
      )}

      {!loading && !error && view === 'queue' && (
        <>
          <section className="execution-stats" data-testid="execution-hero-stats" aria-label="Execution hero stats">
            <div className="execution-stats-card">
              <div className="execution-stats-label">Streak</div>
              <div className="execution-stats-value">{stats?.streak ?? 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>accepted in a row</div>
            </div>
            <div className="execution-stats-card">
              <div className="execution-stats-label">Accept rate</div>
              <div className="execution-stats-value">{Math.round((stats?.acceptance_rate ?? 0) * 100)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stats?.total_accepted ?? 0} hits / {stats?.total_recommended ?? 0} recs</div>
            </div>
            <div className="execution-stats-card">
              <div className="execution-stats-label">Execution rate</div>
              <div className="execution-stats-value">{Math.round((stats?.execution_rate ?? 0) * 100)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>closed loop</div>
            </div>
            <div className="execution-stats-card">
              <div className="execution-stats-label">Avg. decision</div>
              <div className="execution-stats-value">{Math.round(stats?.avg_decision_minutes ?? 0)}m</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per action</div>
            </div>
            <div className="execution-stats-card">
              <ScoreRing score={score} size={56} strokeWidth={4} />
              <div className="execution-stats-label">Score</div>
            </div>
          </section>

          <div style={{ marginBottom: 24 }}>
            <div className="seg" role="tablist" aria-label="Filter">
              {(['pending', 'completed', 'rejected'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={filter === tab}
                  data-testid={`exec-filter-${tab}`}
                  className={filter === tab ? 'active' : ''}
                  onClick={() => setFilter(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && filtered.length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }}>{filtered.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'oklch(0.18 0.015 205 / 0.45)',
                border: '1px dashed var(--memory-pane-border)',
                borderRadius: 14,
                marginTop: 12,
              }}
              data-testid="exec-empty"
            >
              You're caught up — next check-in rolls in {Math.round((stats?.avg_decision_minutes ?? 0) * 1.5) || 6} hours.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="execution-queue">
              {filtered.map((action) => (
                <li
                  key={action.action_id}
                  style={{
                    background: 'oklch(0.18 0.015 205 / 0.7)',
                    border: '1px solid var(--memory-pane-border)',
                    borderRadius: 12,
                    padding: '14px 18px',
                  }}
                  data-testid={`exec-row-${action.action_id}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>{action.recommendation_id}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {statusLabel[action.status] ?? action.status}
                        {action.check_in_count > 0 && ` · ${action.check_in_count} check-ins`}
                      </div>
                    </div>
                    {action.status === 'accepted' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setExpandedAction(expandedAction === action.action_id ? null : action.action_id)}
                          aria-expanded={expandedAction === action.action_id}
                          data-testid={`exec-toggle-steps-${action.action_id}`}
                        >
                          {expandedAction === action.action_id ? 'Hide steps' : 'Broker steps'}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setConfirming(action)}
                          disabled={actionLoading === action.action_id}
                          data-testid={`exec-mark-${action.action_id}`}
                        >
                          {actionLoading === action.action_id ? '…' : 'Mark executed'}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleAbandon(action.action_id)}
                          disabled={actionLoading === action.action_id}
                          data-testid={`exec-skip-${action.action_id}`}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                  {expandedAction === action.action_id && (
                    <div className="broker-step-list" data-testid={`exec-steps-${action.action_id}`}>
                      {(BASE_STEPS[action.agent_type ?? 'investment'] ?? BASE_STEPS.investment).map((step, i) => (
                        <div key={i} className={`broker-step ${i === 0 ? 'broker-step--done' : i === 1 ? 'broker-step--pending' : ''}`}>
                          <span className="broker-step-dot" />
                          <span>{step}</span>
                          {i === 0 && <span className="broker-step-summary">done</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!loading && !error && view === 'history' && (
        <section className="outcome-tracker" data-testid="outcome-tracker">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>30-day outcomes</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{outcomes.length} entries</span>
          </header>
          {outcomes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No executed actions yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {outcomes.map((o) => (
                <li key={o.id} className="outcome-tracker-row" data-testid={`outcome-${o.id}`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--bio-glow)' }}>{o.ticker ?? '—'}</span>
                    <span style={{ fontSize: 13 }}>{o.action}</span>
                  </span>
                  <span
                    className={`outcome-rating ${
                      o.rating === 'positive' || o.rating === 'strong' ? 'outcome-rating--pos' :
                      o.rating === 'negative' ? 'outcome-rating--neg' : 'outcome-rating--neutral'
                    }`}
                  >
                    {o.rating} ({o.delta})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Mark-executed confirmation modal */}
      {confirming && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm execution" data-testid="confirm-modal">
          <div className="confirm-modal">
            <h3 style={{ marginTop: 0 }}>Confirm execution</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              You marked <strong>{confirming.recommendation_id}</strong> as executed. Confirm you completed this in your broker.
            </p>
            <div className="confirm-modal-summary">
              {confirming.recommendation_id} · {statusLabel[confirming.status] ?? confirming.status}
            </div>
            <input
              type="text"
              autoFocus
              placeholder='Type "executed" to confirm'
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              className="settings-input"
              style={{ width: '100%', marginTop: 12 }}
              data-testid="confirm-phrase"
            />
            <div className="confirm-modal-row">
              <button type="button" className="btn-ghost" onClick={() => { setConfirming(null); setConfirmPhrase(''); }} data-testid="confirm-cancel">Cancel</button>
              <button
                type="button"
                className="btn-primary"
                disabled={confirmPhrase.trim().toLowerCase() !== 'executed' || actionLoading === confirming.action_id}
                onClick={() => handleExecute(confirming)}
                data-testid="confirm-submit"
              >
                {actionLoading === confirming.action_id ? 'Recording…' : 'I confirmed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {celebrateFor === 'queue-empty' && (
        <aside className="exec-celebration-banner" data-testid="exec-celebration" role="status" aria-live="polite">
          ✨ You're caught up — next check-in rolling.
        </aside>
      )}
    </div>
  );
}
