/**
 * Phase 40 — empty-state regression across every page.
 * Section 2.D — every route must render exactly one `data-testid="empty-state-{slug}"`
 * when the page is empty, with valid aria-label. Phase 38c regression for slug
 * collisions (the duplicate `multiagent-empty` regression is the canonical one).
 *
 * Strategy: hit each route, then either let the page render its natural empty
 * (zero holdings / opt-out community / no notes) OR mock the API to return []/0.
 * After navigation, assert (a) the empty-state appears, (b) only ONE appears
 * for that route (no slug duplication), and (c) it has a valid aria-label.
 *
 * Phase 39 T2.1-T2.5 rewrite: every multi-fetch route now exposes a single-
 * endpoint /api/<route>/empty probe. The mock body returned from this probe
 * is `{ empty: true }` — the page's `<EmptyState/>` branch handles the rest.
 *
 * Phase 39 T4: a new `slug collision` test at the end of this describe block
 * uses `for … continue` rather than `test.skip()` so non-fragile routes
 * independently verify that no OTHER route's slug leaks into their DOM.
 */
import { test, expect } from '../utils/cleanConsole';
import { EMPTY_STATE_SLUGS } from '../utils/routes';

// Phase 39 — KNOWN_FRAGILE_ROUTES was emptied by T2.1–T2.5 (every multi-fetch
// route now exposes a /empty probe). New fragility entries should be added
// here only when an underlying app bug is genuinely unfixable this pass.
const KNOWN_FRAGILE_ROUTES = new Set<string>([]);

test.describe('40 — empty-state regression', () => {
  for (const { route, slug, whenMock } of EMPTY_STATE_SLUGS) {
    test(`${route} renders <${slug}> as a status/group when empty`, async ({ page }) => {
      test.skip(
        KNOWN_FRAGILE_ROUTES.has(route),
        `known app limitation: ${route} makes multi-fetch calls not satisfiable from a single-endpoint mock`,
      );
      // Phase 39 T2.1-T2.5: every multi-fetch route now probes /api/<route>/empty
      // first; if it returns { empty: true } the page short-circuits to its
      // EmptyState branch synchronously. The mock body returns that shape.
      if (whenMock && whenMock.startsWith('/api/')) {
        // The /api/<route>/empty probe — new endpoint pattern.
        const isEmptyRoute = /\/empty$/.test(whenMock);
        // Legacy patterns kept as a fallback (debt, backtest use older routes).
        const isDebtSummary = /^\/api\/debt\/summary\b/.test(whenMock);
        const isRunsRoute = /^\/api\/backtest\/runs\b/.test(whenMock);
        // Phase 39 fix: prefix pattern with ** so the absolute fetch URL
        // (http://localhost:8000/api/...) is matched, not just a relative path.
        await page.route(`**${whenMock}`, (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: isEmptyRoute
              ? '{"empty":true}'
              : isRunsRoute
                ? JSON.stringify({ runs: [], total: 0 })
                : JSON.stringify({
                    accounts: [],
                    total_debt: 0,
                    debt_count: 0,
                    avg_interest_rate: 0,
                    monthly_payments: 0,
                  }),
          })
        );
      }

      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const locator = page.locator(`[data-testid="empty-state-${slug}"]`);
      await expect(locator).toHaveCount(1, { timeout: 10000 });

      // ARIA: either `role="status"` or `role="group"` — both valid per spec.
      const role = await locator.first().getAttribute('role');
      expect(['status', 'group']).toContain(role);

      // Accessible label must be present and non-empty.
      const ariaLabel = await locator.first().getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect((ariaLabel ?? '').length).toBeGreaterThan(5);
    });
  }

  // Phase 39 T4: slug collisions regression — assert no route leaks another
  // route's empty-state testid into its own DOM. Uses JS `continue` to keep
  // fragile routes inside the loop without short-circuiting the whole test.
  test('canonical slugs do not leak across routes', async ({ page }) => {
    for (const { route, slug } of EMPTY_STATE_SLUGS) {
      if (KNOWN_FRAGILE_ROUTES.has(route)) continue;
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const otherSlugs = EMPTY_STATE_SLUGS
        .filter((e) => e.slug !== slug)
        .map((e) => `[data-testid="empty-state-${e.slug}"]`);
      const leaks = await page.locator(otherSlugs.join(', ')).count();
      expect(leaks, `${route} should not render any other route's empty-state slug`).toBe(0);
    }
  });
});
