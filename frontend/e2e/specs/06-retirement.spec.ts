import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_RETIREMENT } from '../fixtures/mock-data';

test.describe('06 — Retirement Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/retirement', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT) }));
    await page.route('**/api/retirement/projection', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT.projections) }));
  });

  test('06.1 — Retirement dashboard renders', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('.retirement-dashboard')).toBeVisible();
  });

  test('06.2 — Current savings displayed', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.getByText(/185,000|185000/)).toBeVisible();
  });

  test('06.3 — Projection chart renders', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="projection-chart"]')).toBeVisible();
  });

  test('06.4 — Retirement age shown', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.getByText('65')).toBeVisible();
  });

  test('06.5 — Monthly contribution visible', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="monthly-contribution"], .contribution-value').first()).toBeVisible();
  });

  test('06.6 — Monte Carlo simulation toggle exists', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    const mcToggle = page.locator('[data-testid="monte-carlo-toggle"], button:has-text("Monte Carlo")').first();
    await expect(mcToggle).toBeVisible({ timeout: 5000 });
  });

  test('06.7 — Income replacement ratio visible', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="replacement-ratio"], .replacement-gauge').first()).toBeVisible({ timeout: 5000 });
  });

  test('06.8 — Shortfall/surplus indicator present', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="shortfall-indicator"], .shortfall-badge').first()).toBeVisible({ timeout: 5000 });
  });

  test('06.9 — Scenario comparison (optimistic/pessimistic/baseline)', async ({ page }) => {
    await page.goto('/retirement');
    await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="scenario-comparison"], .scenario-tabs').first()).toBeVisible({ timeout: 5000 });
  });

  test('06.10 — Loading state on initial fetch', async ({ page }) => {
    await page.route('**/api/retirement', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT) });
    });
    await page.goto('/retirement');
    await expect(page.locator('[data-testid="retirement-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('06.11 — Error state with retry', async ({ page }) => {
    await page.route('**/api/retirement', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/retirement');
    await expect(page.locator('[data-testid="retirement-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});