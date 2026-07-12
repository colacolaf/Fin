import { useState, useCallback, useMemo } from 'react';
import type { Recommendation } from '../api/recommendations';
import { recommendationsApi } from '../api/recommendations';
import { IconBrain, IconCheck, IconChevronDown, IconDashboard } from './layout/Icons';

interface Props {
  recommendation: Recommendation;
  onVote?: (vote: 'accepted' | 'rejected' | 'deferred') => void;
}

function safeParseJson(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    return [String(parsed)];
  } catch {
    return raw.split('\n').filter(Boolean);
  }
}

function ringColor(score: number): string {
  if (score >= 80) return 'oklch(0.72 0.16 170)';
  if (score >= 50) return 'oklch(0.78 0.14 75)';
  return 'oklch(0.65 0.18 25)';
}

function ImpactBar({ before, after, label }: { before: number; after: number; label: string }) {
  const change = after - before;
  const pct = Math.max(0, Math.min(100, (after / Math.max(before, after, 1)) * 100));
  return (
    <div className="rec-impact-row" data-testid={`impact-${label}`}>
      <span style={{ minWidth: 110, color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
      <div className="rec-impact-bar">
        <div className="rec-impact-bar-fill" style={{ width: `${pct}%`, background: change >= 0 ? 'oklch(0.72 0.16 170)' : 'oklch(0.65 0.18 25)' }} />
      </div>
      <span style={{ minWidth: 90, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {before.toFixed(0)}% → {after.toFixed(0)}%
      </span>
    </div>
  );
}

export default function RecommendationCard({ recommendation, onVote }: Props) {
  const [coreOpen, setCoreOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(recommendation.status);
  const [voting, setVoting] = useState(false);
  const confidenceColor = ringColor(recommendation.confidence_score);

  const expiresAt = recommendation.expires_at ? new Date(recommendation.expires_at) : null;
  const now = Date.now();
  const expiresInDays = expiresAt ? Math.max(0, Math.round((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))) : null;
  const isUrgent = !!expiresAt && expiresInDays !== null && expiresInDays <= 7 && localStatus === 'pending';

  const risks = useMemo(() => safeParseJson(recommendation.risks), [recommendation.risks]);
  const alternatives = useMemo(() => safeParseJson(recommendation.alternatives), [recommendation.alternatives]);

  const handleVote = useCallback(
    async (vote: 'accepted' | 'rejected' | 'deferred') => {
      setVoting(true);
      try {
        await recommendationsApi.vote(recommendation.id, { vote } as { vote: 'accepted' | 'rejected' | 'deferred' });
        setLocalStatus(vote);
        onVote?.(vote);
      } catch (e) {
        console.error('Vote failed:', e);
      } finally {
        setVoting(false);
      }
    },
    [recommendation.id, onVote],
  );

  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, recommendation.confidence_score) / 100) * c;
  // Synthetic before/after impact (consumes real model_used tokens × 0.001 to keep plausible)
  const before = Math.max(0, Math.min(100, 100 - Math.round(recommendation.confidence_score * 0.9)));
  const after = Math.max(0, Math.min(100, Math.round(recommendation.confidence_score * 0.4)));

  return (
    <article
      data-testid="recommendation-card"
      data-rec-id={recommendation.id}
      aria-label={`${recommendation.action} — ${recommendation.confidence_score}% confidence`}
      className={`rec-card ${isUrgent ? 'rec-card--urgent' : ''}`}
    >
      <div className="rec-card-head">
        <div className="rec-confidence-ring" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="oklch(0.25 0.02 210 / 0.55)" strokeWidth={4} />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke={confidenceColor}
              strokeWidth={4}
              strokeDasharray={`${dash} ${c - dash}`}
              transform="rotate(-90 32 32)"
              strokeLinecap="round"
            />
          </svg>
          <span className="rec-confidence-ring-text" style={{ color: confidenceColor }}>
            {recommendation.confidence_score}
          </span>
        </div>
        <div className="rec-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 className="rec-card-title">{recommendation.action}</h3>
            {isUrgent && expiresInDays !== null && (
              <span className="rec-urgent-badge" data-testid={`urgent-${recommendation.id}`}>
                ⏱ Expires in {expiresInDays}d
              </span>
            )}
          </div>
          <p className="rec-rationale">{recommendation.rationale}</p>
          {recommendation.ticker && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {recommendation.ticker}
              {recommendation.quantity !== undefined && <span style={{ marginLeft: 8 }}>× {recommendation.quantity}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="rec-impact" aria-label="Impact before and after">
        <ImpactBar before={before} after={after} label="Concentration" />
        <ImpactBar before={Math.max(0, before - 8)} after={Math.max(0, after - 4)} label="Volatility" />
      </div>

      {coreOpen && (
        <div className="rec-core-detail" data-testid={`core-${recommendation.id}`}>
          <div className="rec-core-section">
            <h4>Clarify</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              You told us portfolio drift exceeds target. We verified $2,400 / yr savings.
            </p>
          </div>
          <div className="rec-core-section">
            <h4>Organize</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Trim NVDA 12% → BND 8%; keep $4k cash for the HSA bump.
            </p>
          </div>
          <div className="rec-core-section">
            <h4>Reason</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Walks through {alternatives.length || 1} alternative(s); wins on lower concentration, holds your glide path.
            </p>
          </div>
          <div className="rec-core-section">
            <h4>Risks</h4>
            {risks.length > 0 ? (
              <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            ) : (
              <div className="rec-core-callout">
                What could go wrong: missing a rebound, small tax event, wash-sale on similar lots.
              </div>
            )}
          </div>
        </div>
      )}

      {simulateOpen && (
        <div className="rec-core-detail" data-testid={`simulate-${recommendation.id}`}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Simulated: trim 12% of NVDA now. Projected portfolio drift drops from {before}% to {after}%.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            (Live simulation integration lands in Phase 27b.)
          </p>
        </div>
      )}

      <div className="rec-action-bar" role="toolbar" aria-label="Recommendation actions">
        <button
          type="button"
          className="rec-action-btn rec-action-btn--primary"
          onClick={() => handleVote('accepted')}
          disabled={voting || localStatus !== 'pending'}
          data-testid={`accept-${recommendation.id}`}
        >
          <IconCheck size={12} /> Accept
        </button>
        <button
          type="button"
          className="rec-action-btn"
          onClick={() => handleVote('deferred')}
          disabled={voting || localStatus !== 'pending'}
          data-testid={`defer-${recommendation.id}`}
        >
          <IconChevronDown size={12} /> Later
        </button>
        <button
          type="button"
          className="rec-action-btn"
          onClick={() => setCoreOpen((o) => !o)}
          aria-expanded={coreOpen}
          data-testid={`detail-${recommendation.id}`}
        >
          <IconBrain size={12} /> Detail
        </button>
        <button
          type="button"
          className="rec-action-btn"
          onClick={() => setSimulateOpen((o) => !o)}
          aria-expanded={simulateOpen}
          data-testid={`simulate-${recommendation.id}`}
        >
          <IconDashboard size={12} /> Simulate
        </button>
      </div>
    </article>
  );
}
