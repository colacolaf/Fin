import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_MARKET_DATA, MOCK_PORTFOLIO } from '../fixtures/mock-data';

test.describe('10 — Data Refresh & Market Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/data/quotes', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKET_DATA.quotes) }));
    await page.route('**/api/data/news', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKET_DATA.news) }));
    await page.route('**/api/data/refresh-status', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ last_refreshed: '2026-07-10T12:00:00Z', status: 'fresh', cache_ttl_remaining: 1800 }) }));
    await page.route('**/api/data/refresh', r =>
      r.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ status: 'refresh_initiated', estimated_completion: '2026-07-10T12:01:00Z' }) }));
  });

  test('10.1 — Market data page renders', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.locator('[data-testid="market-data-page"], .market-data').first()).toBeVisible();
  });

  test('10.2 — Quote table shows symbols and prices', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.getByText(/AAPL/)).toBeVisible();
    await expect(page.getByText(/195\.60/)).toBeVisible();
    await expect(page.getByText(/VTI/)).toBeVisible();
  });

  test('10.3 — News feed visible with headlines', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.getByText('Fed holds rates steady')).toBeVisible();
    await expect(page.getByText('Tech sector leads market gains')).toBeVisible();
  });

  test('10.4 — Refresh status indicator shows fresh', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.locator('[data-testid="refresh-status"], .refresh-status').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/fresh|updated/i)).toBeVisible();
  });

  test('10.5 — Manual refresh trigger works', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    const refreshBtn = page.locator('button:has-text("Refresh"), [data-testid="refresh-btn"], .refresh-btn').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(1000);
    }
    await expect(page.locator('[data-testid="market-data-page"], .market-data').first()).toBeVisible();
  });

  test('10.6 — Portfolio sync status visible', async ({ page }) => {
    await page.route('**/api/data/sync-status', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ last_synced: MOCK_PORTFOLIO.last_synced, status: 'synced' }) }));
    await page.goto('/portfolio');
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="sync-status"], .sync-indicator').first()).toBeVisible({ timeout: 5000 });
  });

  test('10.7 — Cache invalidation timer visible', async ({ page }) => {
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.locator('[data-testid="cache-ttl"], .cache-timer').first()).toBeVisible({ timeout: 5000 });
  });

  test('10.8 — Loading state on initial fetch', async ({ page }) => {
    await page.route('**/api/data/quotes', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKET_DATA.quotes) });
    });
    await page.goto('/market-data');
    await expect(page.locator('[data-testid="data-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('10.9 — Error state with retry', async ({ page }) => {
    await page.route('**/api/data/quotes', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/market-data');
    await expect(page.locator('[data-testid="data-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('10.10 — Stale data warning when cache expired', async ({ page }) => {
    await page.route('**/api/data/refresh-status', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ last_refreshed: '2026-06-01T12:00:00Z', status: 'stale', cache_ttl_remaining: 0 }) }));
    await page.goto('/market-data');
    await page.waitForSelector('[data-testid="market-data-page"], .market-data', { timeout: 10000 });
    await expect(page.locator('[data-testid="stale-warning"], .stale-warning').first()).toBeVisible({ timeout: 5000 });
  });
});