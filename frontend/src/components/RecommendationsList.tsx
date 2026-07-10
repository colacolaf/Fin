import { useState, useEffect, useCallback, useRef } from 'react';
import type { Recommendation } from '../api/recommendations';
import { recommendationsApi } from '../api/recommendations';
import RecommendationCard from './RecommendationCard';

interface FilterState {
  agent_type: string; // '' = all, or 'investment' | 'debt' | 'retirement'
  status: string;     // '' = all, or 'pending' | 'accepted' | 'rejected' | 'executed'
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  filterBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  select: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'var(--bg-surface, #0F1F3A)',
    color: 'var(--text-primary, #E8F4FD)',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  refreshBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary, #E8F4FD)',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 200ms',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 16,
    color: 'var(--text-secondary, #94A3B8)',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.08)',
    borderTopColor: 'var(--color-blue, #60A5FA)',
    animation: 'spin 0.8s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    padding: 60,
    color: 'var(--color-red, #EF4444)',
    fontSize: 14,
  },
  retryBtn: {
    padding: '8px 20px',
    borderRadius: 8,
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.08)',
    color: 'var(--color-red, #EF4444)',
    fontSize: 13,
    cursor: 'pointer',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: 60,
    color: 'var(--text-muted, #64748B)',
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-secondary, #94A3B8)',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'var(--text-muted, #64748B)',
  },
};

export default function RecommendationsList() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ agent_type: '', status: '' });
  const mountedRef = useRef(true);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filters.agent_type) params.agent_type = filters.agent_type;
      if (filters.status) params.status = filters.status;
      params.limit = 50;
      const data = await recommendationsApi.list(params as { agent_type?: string; status?: string; limit?: number; offset?: number });
      if (mountedRef.current) {
        setRecommendations(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load recommendations');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters.agent_type, filters.status]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRecommendations();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRecommendations]);

  // Inject keyframe for spinner
  useEffect(() => {
    const styleId = 'rec-spinner-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  const handleVote = useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div style={styles.container}>
      {/* Filter bar */}
      <div style={styles.filterBar}>
        <select
          value={filters.agent_type}
          onChange={(e) => setFilters((f) => ({ ...f, agent_type: e.target.value }))}
          style={styles.select}
          aria-label="Filter by agent type"
        >
          <option value="">All Agents</option>
          <option value="investment">Investment</option>
          <option value="debt">Debt</option>
          <option value="retirement">Retirement</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          style={styles.select}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="executed">Executed</option>
        </select>

        <button onClick={fetchRecommendations} style={styles.refreshBtn} aria-label="Refresh recommendations">
          <span style={{ fontSize: 14 }}>↻</span>
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <div style={{ fontSize: 14 }}>Loading recommendations…</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={styles.errorContainer}>
          <div style={{ fontSize: 32 }}>⚠</div>
          <div>{error}</div>
          <button onClick={fetchRecommendations} style={styles.retryBtn}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && recommendations.length === 0 && (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>📝</div>
          <div style={styles.emptyTitle}>No recommendations yet</div>
          <div style={styles.emptySubtitle}>
            Recommendations from your agents will appear here
          </div>
        </div>
      )}

      {/* Grid of cards */}
      {!loading && !error && recommendations.length > 0 && (
        <div style={styles.grid}>
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} onVote={handleVote} />
          ))}
        </div>
      )}
    </div>
  );
}