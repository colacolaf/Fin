import { useState, useCallback, useMemo } from 'react';
import type { Recommendation } from '../api/recommendations';
import { recommendationsApi } from '../api/recommendations';

interface Props {
  recommendation: Recommendation;
  onVote?: () => void;
}

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  investment: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA' },
  debt: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171' },
  retirement: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.15)', text: '#FACC15' },
  accepted: { bg: 'rgba(34, 197, 94, 0.15)', text: '#34D399' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  executed: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD' },
};

const CONFIDENCE_COLORS = (score: number) => {
  if (score >= 80) return 'var(--color-green, #34D399)';
  if (score >= 50) return 'var(--color-yellow, #FBBF24)';
  return 'var(--color-red, #EF4444)';
};

function safeParseJson(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return raw.split('\n').filter(Boolean);
  }
}

export default function RecommendationCard({ recommendation, onVote }: Props) {
  const [showFullRationale, setShowFullRationale] = useState(false);
  const [risksOpen, setRisksOpen] = useState(false);
  const [alternativesOpen, setAlternativesOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(recommendation.status);
  const [voting, setVoting] = useState(false);

  const agentStyle = AGENT_COLORS[recommendation.agent_type] || AGENT_COLORS.investment;
  const statusStyle = STATUS_COLORS[localStatus] || STATUS_COLORS.pending;
  const confidenceColor = CONFIDENCE_COLORS(recommendation.confidence_score);

  const rationaleTruncated =
    recommendation.rationale.length > 200 && !showFullRationale
      ? recommendation.rationale.slice(0, 200) + '...'
      : recommendation.rationale;

  const risks = useMemo(() => safeParseJson(recommendation.risks), [recommendation.risks]);
  const alternatives = useMemo(() => safeParseJson(recommendation.alternatives), [recommendation.alternatives]);

  const handleVote = useCallback(
    async (vote: 'accepted' | 'rejected' | 'deferred') => {
      setVoting(true);
      try {
        await recommendationsApi.vote(recommendation.id, { vote });
        setLocalStatus(vote);
        onVote?.();
      } catch (e) {
        console.error('Vote failed:', e);
      } finally {
        setVoting(false);
      }
    },
    [recommendation.id, onVote],
  );

  return (
    <div
      data-testid="recommendation-card"
      style={{
        background: 'var(--bg-surface, #0F1F3A)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 20,
        maxWidth: 380,
        transition: 'box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Header: agent badge + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: agentStyle.bg,
            color: agentStyle.text,
          }}
        >
          {recommendation.agent_type}
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 500,
            background: statusStyle.bg,
            color: statusStyle.text,
          }}
        >
          {localStatus}
        </span>
      </div>

      {/* Action / title */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary, #E8F4FD)',
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {recommendation.action}
      </div>

      {/* Ticker + quantity if present */}
      {recommendation.ticker && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', marginBottom: 10 }}>
          {recommendation.ticker}
          {recommendation.quantity != null && (
            <span style={{ marginLeft: 8, color: 'var(--text-muted, #64748B)' }}>× {recommendation.quantity}</span>
          )}
        </div>
      )}

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Confidence
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: confidenceColor, fontVariantNumeric: 'tabular-nums' }}>
            {recommendation.confidence_score}%
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(recommendation.confidence_score, 100)}%`,
              borderRadius: 2,
              background: confidenceColor,
              transition: 'width 400ms ease',
            }}
          />
        </div>
      </div>

      {/* Rationale */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: 8 }}>
        {rationaleTruncated}
      </div>
      {recommendation.rationale.length > 200 && (
        <button
          onClick={() => setShowFullRationale(!showFullRationale)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 12,
            color: 'var(--color-blue, #60A5FA)',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          {showFullRationale ? 'Show less' : 'View full rationale'}
        </button>
      )}

      {/* Risks collapsible */}
      {risks.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <button
            onClick={() => setRisksOpen(!risksOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-red, #F87171)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 10, transition: 'transform 200ms', display: 'inline-block', transform: risksOpen ? 'rotate(90deg)' : 'none' }}>
              ▶
            </span>
            Risks ({risks.length})
          </button>
          {risksOpen && (
            <ul
              style={{
                margin: '4px 0 0 16px',
                padding: 0,
                fontSize: 12,
                color: 'var(--text-muted, #64748B)',
                lineHeight: 1.5,
              }}
            >
              {risks.map((r, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Alternatives collapsible */}
      {alternatives.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setAlternativesOpen(!alternativesOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-yellow, #FBBF24)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 10, transition: 'transform 200ms', display: 'inline-block', transform: alternativesOpen ? 'rotate(90deg)' : 'none' }}>
              ▶
            </span>
            Alternatives ({alternatives.length})
          </button>
          {alternativesOpen && (
            <ul
              style={{
                margin: '4px 0 0 16px',
                padding: 0,
                fontSize: 12,
                color: 'var(--text-muted, #64748B)',
                lineHeight: 1.5,
              }}
            >
              {alternatives.map((a, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Model info */}
      {recommendation.model_used && (
        <div style={{ fontSize: 10, color: 'var(--text-muted, #64748B)', marginBottom: 12 }}>
          via {recommendation.model_used}
          {recommendation.tokens_used != null && ` · ${recommendation.tokens_used} tokens`}
        </div>
      )}

      {/* Vote buttons */}
      {localStatus === 'pending' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            onClick={() => handleVote('accepted')}
            disabled={voting}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid rgba(52, 211, 153, 0.3)',
              background: 'rgba(52, 211, 153, 0.08)',
              color: 'var(--color-green, #34D399)',
              fontSize: 12,
              fontWeight: 600,
              cursor: voting ? 'not-allowed' : 'pointer',
              opacity: voting ? 0.5 : 1,
              transition: 'background 200ms',
            }}
          >
            ✓ Accept
          </button>
          <button
            onClick={() => handleVote('deferred')}
            disabled={voting}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(148, 163, 184, 0.08)',
              color: 'var(--text-secondary, #94A3B8)',
              fontSize: 12,
              fontWeight: 600,
              cursor: voting ? 'not-allowed' : 'pointer',
              opacity: voting ? 0.5 : 1,
              transition: 'background 200ms',
            }}
          >
            ⏳ Defer
          </button>
          <button
            onClick={() => handleVote('rejected')}
            disabled={voting}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--color-red, #EF4444)',
              fontSize: 12,
              fontWeight: 600,
              cursor: voting ? 'not-allowed' : 'pointer',
              opacity: voting ? 0.5 : 1,
              transition: 'background 200ms',
            }}
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  );
}