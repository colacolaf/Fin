import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Recommendation } from '../api/recommendations';
import { recommendationsApi } from '../api/recommendations';
import RecommendationCard from '../components/RecommendationCard';
import EmptyState from '../components/ui/EmptyState';
import { IconEmptyQuotes } from '../components/layout/Icons';
import { RecommendationsSkeleton } from '../components/ui/PageSkeleton';

type AgentFilter = 'all' | 'investment' | 'debt' | 'retirement';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'executed';
type FreshnessFilter = 'all' | 'fresh' | '30d' | '90d';

const DEMO_RECS: Recommendation[] = [
  { id: 'rec-1', agent_type: 'investment', action: 'Rebalance Portfolio', ticket: 'portfolio', ticker: 'PORT', quantity: undefined, rationale: 'Your equity allocation is 85%, exceeding your 70% target. Trim NVDA.', confidence_score: 92, status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), risks: '[]', alternatives: '[]', model_used: 'gpt-4', tokens_used: 1800 },
  { id: 'rec-2', agent_type: 'debt', action: 'Consolidate Credit Cards', ticket: 'debt', ticker: 'DEBT', quantity: undefined, rationale: 'You could save $2,400/year by consolidating your high-interest cards.', confidence_score: 88, status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(), risks: '["Credit score dip"]', alternatives: '["Negotiate APR"]', model_used: 'gpt-4', tokens_used: 1200 },
  { id: 'rec-3', agent_type: 'retirement', action: 'Increase 401(k) Contribution', ticket: 'retirement', ticker: 'RET', quantity: undefined, rationale: 'Increasing by 2% would add $380k to your retirement projection.', confidence_score: 85, status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), expires_at: undefined, risks: '[]', alternatives: '[]', model_used: 'gpt-4', tokens_used: 1500 },
  { id: 'rec-4', agent_type: 'investment', action: 'Tax-loss harvest NVDA losses', ticket: 'portfolio', ticker: 'NVDA', quantity: 50, rationale: 'Realize $4k of paper losses against offsetting gains before year-end.', confidence_score: 78, status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(), risks: '["Wash-sale risk", "Missing rebound"]', alternatives: '["Re-buy after 30 days"]', model_used: 'gpt-4', tokens_used: 2200 },
];

const STREAK_KEY = 'fin.recommendations.streak';

interface StreakState {
  accepted: number;
  declined: number;
  history: ('accepted' | 'rejected' | 'deferred')[];
}

function readStreak(): StreakState {
  if (typeof window === 'undefined') return { accepted: 0, declined: 0, history: [] };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { accepted: 0, declined: 0, history: [] };
    return JSON.parse(raw);
  } catch {
    return { accepted: 0, declined: 0, history: [] };
  }
}

function writeStreak(s: StreakState) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export default function RecommendationsDashboard() {
  const navigate = useNavigate();
  const [recs, setRecs] = useState<Recommendation[]>(DEMO_RECS);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [agentFilter, setAgentFilter] = useState<AgentFilter>((searchParams.get('agent') as AgentFilter) ?? 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) ?? 'pending');
  const [freshFilter, setFreshFilter] = useState<FreshnessFilter>((searchParams.get('fresh') as FreshnessFilter) ?? 'all');
  const [minConfidence, setMinConfidence] = useState<number>(Number(searchParams.get('c') ?? 0));
  const [streak, setStreak] = useState<StreakState>(() => readStreak());

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      // Phase 39 fix T2.2: short-circuit to empty-state when the /empty probe says so.
      try {
        const probe = await recommendationsApi.empty();
        if (probe?.empty === true) {
          setRecs([]);
          setLoading(false);
          return;
        }
      } catch { /* probe missing — fall through */ }
      const list = await recommendationsApi.list();
      if (Array.isArray(list) && list.length) setRecs(list);
    } catch {
      setRecs(DEMO_RECS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  // Persist filters to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (agentFilter !== 'all') sp.set('agent', agentFilter);
    if (statusFilter !== 'all') sp.set('status', statusFilter);
    if (freshFilter !== 'all') sp.set('fresh', freshFilter);
    if (minConfidence > 0) sp.set('c', String(minConfidence));
    setSearchParams(sp, { replace: true });
  }, [agentFilter, statusFilter, freshFilter, minConfidence, setSearchParams]);

  // Per-minute rec refresh (so urgent-glow "Expires in" re-evaluates)
  useEffect(() => {
    const id = setInterval(() => setRecs((r) => [...r]), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let out = [...recs];
    if (agentFilter !== 'all') out = out.filter((r) => r.agent_type === agentFilter);
    if (statusFilter !== 'all') out = out.filter((r) => r.status === statusFilter);
    if (freshFilter !== 'all') {
      const now = Date.now();
      const horizon = freshFilter === 'fresh' ? 7 : freshFilter === '30d' ? 30 : 90;
      out = out.filter((r) => {
        const ageDays = (now - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays <= horizon;
      });
    }
    if (minConfidence > 0) out = out.filter((r) => r.confidence_score >= minConfidence);
    return out;
  }, [recs, agentFilter, statusFilter, freshFilter, minConfidence]);

  const handleVote = useCallback(async (rec: Recommendation, vote: 'accepted' | 'rejected' | 'deferred') => {
    try {
      await recommendationsApi.vote(rec.id, { vote } as unknown as { vote: 'accepted' | 'rejected' | 'deferred' });
    } catch { /* optimistic */ }
    setRecs((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: vote } : r)));
    setStreak((prev) => {
      const next: StreakState = {
        accepted: vote === 'accepted' ? prev.accepted + 1 : 0,
        declined: vote === 'rejected' ? prev.declined + 1 : prev.accepted > 0 ? 0 : prev.declined,
        history: [...prev.history.slice(-29), vote],
      };
      writeStreak(next);
      return next;
    });
  }, []);

  return (
    <div data-testid="recommendations-page" style={{ padding: 24, maxWidth: 1080, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Recommendations</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>Accept, defer, or simulate. Filter the queue below.</p>
        </div>
      </header>

      <div className="voting-streak" data-testid="voting-streak">
        <span className="voting-streak-label">Accept streak</span>
        <span className="voting-streak-value">{streak.accepted}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          {streak.accepted > 0 ? `${streak.accepted} in a row — keep going.` : 'No active streak.'}
        </span>
      </div>

      <div className="rec-filter-strip" data-testid="rec-filter-strip">
        <div className="seg" role="tablist" aria-label="Agent filter">
          {(['all', 'investment', 'debt', 'retirement'] as AgentFilter[]).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={agentFilter === a}
              data-testid={`rec-filter-agent-${a}`}
              className={agentFilter === a ? 'active' : ''}
              onClick={() => setAgentFilter(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Status filter">
          {(['all', 'pending', 'accepted', 'rejected', 'executed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={statusFilter === s}
              data-testid={`rec-filter-status-${s}`}
              className={statusFilter === s ? 'active' : ''}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Freshness filter">
          {(['all', 'fresh', '30d', '90d'] as FreshnessFilter[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={freshFilter === f}
              data-testid={`rec-filter-fresh-${f}`}
              className={freshFilter === f ? 'active' : ''}
              onClick={() => setFreshFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="slider" style={{ minWidth: 200 }}>
          <span className="slider-label">Min confidence</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            aria-label="Minimum confidence"
            data-testid="rec-confidence-slider"
          />
          <span className="slider-value">{minConfidence}%</span>
        </label>
      </div>

      {loading ? (
        <RecommendationsSkeleton />
      ) : (
        <div className="recommendations-list" data-testid="recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 ? (
            recs.length === 0 ? (
              <EmptyState
                icon={<IconEmptyQuotes />}
                title="No active recommendations"
                description="Run an agent to generate suggestions. The Investment agent is the fastest path."
                slug="recommendations-empty"
                cta={{ label: 'Run investment agent', onClick: () => fetchRecs() }}
                secondaryAction={{ label: 'Configure risk', onClick: () => navigate('/settings#/agent-prefs') }}
              />
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--memory-pane-border)', borderRadius: 12 }}>
                No recommendations match your filter.
              </div>
            )
          ) : (
            filtered.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} onVote={(v) => handleVote(rec, v)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
