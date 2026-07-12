/**
 * Breadcrumbs — derived from `useLocation().pathname` against a static label map.
 * Renders inside the dashboard area, just under the TopBar.
 * Mobile (<767px): only shows the current leaf segment.
 */
import { Link, useLocation } from 'react-router-dom';

const LABELS: { match: string; label: string }[] = [
  { match: '/portfolio/holdings', label: 'Holdings' },
  { match: '/portfolio', label: 'Portfolio' },
  { match: '/debt', label: 'Debt' },
  { match: '/retirement', label: 'Retirement' },
  { match: '/memory', label: 'Memory' },
  { match: '/orchestrate', label: 'Multi-Agent' },
  { match: '/recommendations', label: 'Recommendations' },
  { match: '/execution', label: 'Execution' },
  { match: '/community', label: 'Community' },
  { match: '/analytics', label: 'Analytics' },
  { match: '/backtest', label: 'Backtest' },
  { match: '/questions', label: 'Questions' },
  { match: '/research', label: 'Research' },
  { match: '/settings', label: 'Settings' },
];

function buildSegments(pathname: string): { label: string; href: string }[] {
  const segments: { label: string; href: string }[] = [{ label: 'Fin', href: '/' }];
  if (pathname !== '/') {
    const parts = pathname.split('/').filter(Boolean);
    let accum = '';
    for (const part of parts) {
      accum += '/' + part;
      const entry = LABELS.find((l) => l.match === accum);
      if (entry) {
        // Skip if this segment's label duplicates its parent's prefix-mapped label
        segments.push({ label: entry.label, href: accum });
      }
    }
  }
  return segments;
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = buildSegments(pathname);

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs" data-testid="breadcrumb-root">
      <ol style={{ display: 'contents', listStyle: 'none', margin: 0, padding: 0 }}>
        {segments.map((s, i) => {
          const isLast = i === segments.length - 1;
          return (
            <li key={s.href}>
              {isLast ? (
                <span aria-current="page">{s.label}</span>
              ) : (
                <Link to={s.href}>{s.label}</Link>
              )}
              {!isLast && (
                <span aria-hidden className="sep">
                  {'\u203A'}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
