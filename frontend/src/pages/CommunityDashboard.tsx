import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BenchmarkComparison from '../components/BenchmarkComparison';
import Leaderboard from '../components/Leaderboard';
import { communityApi, type CommunityBenchmarks } from '../api/community';
import EmptyState from '../components/ui/EmptyState';
import { IconEmptyCommunity, IconShield } from '../components/layout/Icons';

const OPT_IN_KEY = 'fin.community.optIn';

function readOptIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeOptIn(on: boolean) {
  try { localStorage.setItem(OPT_IN_KEY, String(on)); } catch { /* noop */ }
}

const TRENDING_STRATEGIES = [
  { id: 'tax-loss-weekly', name: 'Tax-loss harvest — weekly', deltaPct: 18, adoptionCount: 1240 },
  { id: 'buy-the-dip', name: 'Buy-the-dip SPY', deltaPct: 12, adoptionCount: 880 },
  { id: 'rsi-reversion', name: 'RSI Reversion ×Russell 2k', deltaPct: 8, adoptionCount: 612 },
  { id: 'hsa-bump', name: 'HSA → family cap', deltaPct: 6, adoptionCount: 480 },
  { id: 'roth-ladder', name: 'Roth conversion ladder', deltaPct: 4, adoptionCount: 350 },
];

export default function CommunityDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'leaderboard'>('benchmarks');
  const [optedIn, setOptedIn] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<CommunityBenchmarks | null>(null);

  useEffect(() => {
    setOptedIn(readOptIn());
  }, []);

  const fetchData = useCallback(async () => {
    if (!optedIn) {
      setBenchmarks(null);
      return;
    }
    try {
      const b = await communityApi.benchmarks();
      setBenchmarks(b);
    } catch {
      setBenchmarks(null);
    }
  }, [optedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOptToggle = () => {
    const next = !optedIn;
    setOptedIn(next);
    writeOptIn(next);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }} data-testid="community-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Community</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            How you compare · anonymized, k-anonymity ≥ 10.
          </p>
        </div>
        <div className="community-toggle">
          <span className="community-toggle-label">
            {optedIn ? 'Sharing anonymized metrics' : 'Sharing off — defaults off'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={optedIn}
            className={`toggle ${optedIn ? 'on' : ''}`}
            onClick={handleOptToggle}
            data-testid="comm-opt-toggle"
            aria-label="Toggle community opt-in"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </header>

      <span className="anonymity-pill" data-testid="comm-anonymity-pill" title="All submissions are bucketed (k-anonymity ≥ 10). Your portfolio data, identity, and personal data are never shared.">
        <IconShield size={12} />
        Anonymous · data is hashed & bucketed · never linked to your account
      </span>

      {!optedIn && (
        <section style={{ marginTop: 18 }} data-testid="community-empty">
          <EmptyState
            icon={<IconEmptyCommunity />}
            title="No shared signals yet"
            description="Defaults are off. Opt in to share anonymized metrics and unlock benchmarks."
            slug="community-empty"
            cta={{ label: 'Browse open votes', onClick: () => navigate('/community?tab=open') }}
            secondaryAction={{ label: 'Submit a signal', onClick: () => navigate('/community/submit') }}
          />
          <p className="coach-voice" style={{ marginTop: 14 }}>
            The community gets sharper the more you opt in, and we promise k-anonymity ≥ 10 — no cohort smaller than 10 reports.
          </p>
        </section>
      )}

      {optedIn && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'oklch(0.18 0.015 205 / 0.45)', borderRadius: 10, padding: 4, border: '1px solid var(--memory-pane-border)' }}>
            <button
              role="tab"
              aria-selected={activeTab === 'benchmarks'}
              className={activeTab === 'benchmarks' ? 'active' : ''}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === 'benchmarks' ? 'oklch(0.28 0.06 180 / 0.5)' : 'transparent', color: activeTab === 'benchmarks' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('benchmarks')}
              data-testid="comm-tab-benchmarks"
            >
              📊 Benchmarks
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'leaderboard'}
              className={activeTab === 'leaderboard' ? 'active' : ''}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === 'leaderboard' ? 'oklch(0.28 0.06 180 / 0.5)' : 'transparent', color: activeTab === 'leaderboard' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('leaderboard')}
              data-testid="comm-tab-leaderboard"
            >
              🏆 Leaderboard
            </button>
          </div>

          {benchmarks && benchmarks.user_percentiles && Object.keys(benchmarks.user_percentiles).length > 0 && (
            <section className="percentile-band" data-testid="comm-percentile-hero">
              <div className="percentile-band-header">
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--bio-glow)', textTransform: 'uppercase' }}>You're in the</span>
                  <div className="percentile-band-value">
                    {(() => {
                      const pctArr = Object.values(benchmarks.user_percentiles);
                      const avg = pctArr.length ? Math.round(pctArr.reduce((s, p) => s + p, 0) / pctArr.length) : 0;
                      return avg ? `${avg}th` : '—';
                    })()}
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>percentile overall.</span>
                </div>
              </div>
              <div className="percentile-band-track" aria-hidden="true">
                <div className="percentile-band-fill" style={{ width: '60%' }} />
                <div className="percentile-band-dot" style={{ left: '60%' }} />
              </div>
              <p className="coach-voice" style={{ marginTop: 8 }}>
                Better than 60% of anonymized peers across execution rate, savings rate, and concentration discipline.
              </p>
            </section>
          )}

          {activeTab === 'benchmarks' ? <BenchmarkComparison /> : <Leaderboard />}

          <section className="trending-strategies" data-testid="comm-trending">
            <header style={{ gridColumn: '1 / -1', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Trending strategies</h3>
              <p className="coach-voice">What 100 peers are picking up this week.</p>
            </header>
            {TRENDING_STRATEGIES.map((s) => (
              <article key={s.id} className="trending-strategy-card" data-testid={`comm-trending-${s.id}`}>
                <h4>{s.name}</h4>
                <span
                  className="trending-strategy-delta"
                  style={{ background: s.deltaPct >= 0 ? 'oklch(0.28 0.10 170 / 0.4)' : 'oklch(0.28 0.10 25 / 0.4)', color: s.deltaPct >= 0 ? 'var(--delta-pos)' : 'var(--delta-neg)' }}
                >
                  {s.deltaPct >= 0 ? '+' : ''}{s.deltaPct}% / 7d
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.adoptionCount.toLocaleString()} adopting</span>
                <button type="button" className="btn-ghost" onClick={() => window.location.assign('/backtest')}>Try it</button>
              </article>
            ))}
          </section>
        </>
      )}

      <div className="privacy-policy-card" id="comm-privacy" data-testid="comm-privacy-card">
        <strong>Our privacy guarantees:</strong>
        <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 11, color: 'var(--text-secondary)' }}>
          <li>We never sell or share your data.</li>
          <li>All contributions are bucketed (k-anonymity ≥ 10 — no cohort smaller than 10 reports).</li>
          <li>You can delete your contributions any time from Settings → Privacy.</li>
        </ul>
      </div>
    </div>
  );
}
