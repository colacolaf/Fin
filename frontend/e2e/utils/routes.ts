/**
 * Phase-39 — single source of truth for the canonical route list.
 * Sections 1.7 / 7 — use these in any spec that iterates every page,
 * so a new route appears in every spec on next edit.
 *
 * `EMPTY_STATE_SLUGS` covers the Phase 38a/b/c regression. Each entry
 * pairs a slug with the route that should render it empty + the API path
 * that, when fulfilled with [], flips the page to its empty branch.
 * `multiagent-empty` is the canonical Phase 38c regression slug the
 * prompt's §2.D called out by name — keep it.
 */
export const ROUTES = [
  '/',
  '/portfolio',
  '/debt',
  '/retirement',
  '/memory',
  '/orchestrate',
  '/recommendations',
  '/execution',
  '/community',
  '/backtest',
  '/settings',
] as const;

export type Route = (typeof ROUTES)[number];

export const EMPTY_STATE_SLUGS: ReadonlyArray<{ slug: string; route: Route; whenMock: string | null }> = [
  { slug: 'portfolio-empty', route: '/portfolio', whenMock: '/api/portfolio/full' },
  { slug: 'debt-empty', route: '/debt', whenMock: '/api/debt/summary' },
  { slug: 'memory-empty', route: '/memory', whenMock: null /* natural first-paint */ },
  { slug: 'recommendations-empty', route: '/recommendations', whenMock: '/api/recommendations' },
  { slug: 'execution-empty', route: '/execution', whenMock: '/api/execution/pending' },
  { slug: 'community-empty', route: '/community', whenMock: null /* rendered when not opted-in */ },
  { slug: 'backtest-empty', route: '/backtest', whenMock: '/api/backtest/runs' },
  // Phase 38c explicit regression — leaked slug when MultiAgent shipped.
  { slug: 'multiagent-empty', route: '/orchestrate', whenMock: null /* natural first-paint */ },
];
