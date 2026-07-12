import { useState } from 'react';

const MOCK = [
  { id: 'rec-1', agent: 'investment', title: 'Rebalance Portfolio', rationale: 'Your equity allocation is 85%, exceeding your 70% target.', confidence: 0.92, status: 'pending' },
  { id: 'rec-2', agent: 'debt', title: 'Consolidate Credit Cards', rationale: 'You could save $2,400/year by consolidating your high-interest cards.', confidence: 0.88, status: 'pending' },
  { id: 'rec-3', agent: 'retirement', title: 'Increase 401(k) Contribution', rationale: 'Increasing by 2% would add $380k to your retirement projection.', confidence: 0.85, status: 'pending' },
];

export default function RecommendationsDashboard() {
  const [recs] = useState(MOCK);

  return (
    <div data-testid="recommendations-page" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #E8F4FD)' }}>
        Recommendations
      </h2>
      <div data-testid="recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {recs.map((rec: any) => (
          <div key={rec.id} className="recommendation-card" data-testid="recommendation-card"
            style={{ background: 'var(--bg-surface, #0F1F3A)', borderRadius: 12, padding: 20, border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary, #E8F4FD)' }}>{rec.title}</span>
              <span className="confidence-score" data-testid={`confidence-${rec.id}`}
                style={{ background: rec.confidence > 0.85 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: rec.confidence > 0.85 ? '#34D399' : '#FBBF24', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {Math.round(rec.confidence * 100)}%
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary, #94A3B8)', fontSize: 14, margin: '0 0 12px' }}>{rec.rationale}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="accept-btn" style={{ background: 'var(--accent-primary, #00D4FF)', color: '#0F1F3A', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Accept</button>
              <button data-testid="reject-btn" style={{ background: 'transparent', color: 'var(--text-secondary, #94A3B8)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Reject</button>
              <button data-testid="snooze-btn" style={{ background: 'transparent', color: 'var(--text-secondary, #94A3B8)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Snooze</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}