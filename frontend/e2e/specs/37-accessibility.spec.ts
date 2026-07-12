/**
 * Phase 37 — axe-core accessibility sweep across all routes.
 * Verifies: zero WCAG 2.2 AA violations on every public route +
 * skip-to-content focused on first Tab.
 */
import { test, expect } from '@playwright/test';
import { runAxeCheck } from '../utils/audit';

const ROUTES = [
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
];

test.describe('axe-core accessibility', () => {
  for (const route of ROUTES) {
    test(`${route} has zero WCAG2AA violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await runAxeCheck(page);
    });
  }

  test('Skip-to-content visible on first Tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    const skip = page.locator('[data-testid="skip-to-content"]');
    await expect(skip).toBeFocused();
  });
});
