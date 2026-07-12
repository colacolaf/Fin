/**
 * PageSkeleton — shape-matching placeholders per page.
 * Each skeleton mirrors the page's final layout so the morph-in feels clean.
 */

import { Skeleton, SkeletonLine } from './Skeleton';

// ── Portfolio: 5 hero tiles + chart + holdings rows ──────────────────────
export function PortfolioSkeleton() {
  return (
    <div className="portfolio-skeleton" data-testid="portfolio-skeleton" aria-hidden>
      <div className="portfolio-hero">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={96} radius={14} />
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Skeleton variant="rect" height={300} radius={14} />
      </div>
      <div style={{ marginTop: 16 }}>
        <SkeletonLine count={5} />
      </div>
    </div>
  );
}

// ── Recommendations: 3 stat tiles + 2 cards per row ─────────────────────
export function RecommendationsSkeleton() {
  return (
    <div data-testid="recommendations-skeleton" aria-hidden>
      <div className="portfolio-hero">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={120} radius={14} />
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={210} radius={14} />
        ))}
      </div>
    </div>
  );
}

// ── Debt: 2 strategy cards + 4 account rows ─────────────────────────────
export function DebtSkeleton() {
  return (
    <div data-testid="debt-skeleton" aria-hidden>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <Skeleton variant="rect" height={140} radius={14} />
        <Skeleton variant="rect" height={140} radius={14} />
      </div>
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={64} radius={12} />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard: ocean scene placeholder + 3 onboarding cards ─────────────
export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" aria-hidden style={{ padding: 24 }}>
      <Skeleton variant="rect" height={300} radius={18} />
      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          maxWidth: 820,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={156} radius={14} />
        ))}
      </div>
    </div>
  );
}

// ── Memory: 3-pane shell ────────────────────────────────────────────────
export function MemorySkeleton() {
  return (
    <div data-testid="memory-skeleton" aria-hidden style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 12, padding: 12 }}>
      <Skeleton variant="rect" height={420} radius={12} />
      <Skeleton variant="rect" height={420} radius={12} />
      <Skeleton variant="rect" height={420} radius={12} />
    </div>
  );
}

// ── Retirement: score hero + projection chart + 3 bucket cards ───────────
export function RetirementSkeleton() {
  return (
    <div data-testid="retirement-skeleton" aria-hidden>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 14,
        }}
      >
        <Skeleton variant="rect" height={220} radius={14} />
        <Skeleton variant="rect" height={220} radius={14} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton variant="rect" height={64} radius={12} />
      </div>
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
        }}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={120} radius={14} />
        ))}
      </div>
    </div>
  );
}

// ── Execution: 5 stat tiles + queue rows ────────────────────────────────
export function ExecutionSkeleton() {
  return (
    <div data-testid="execution-skeleton" aria-hidden>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 14,
        }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={96} radius={12} />
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <Skeleton variant="rect" height={36} radius={8} />
      </div>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={72} radius={12} />
        ))}
      </div>
    </div>
  );
}

// ── Generic last-resort fallback for unmapped routes ────────────────────
export function GenericSkeleton() {
  return (
    <div data-testid="generic-skeleton" aria-hidden style={{ padding: 24 }}>
      <SkeletonLine count={6} />
    </div>
  );
}
