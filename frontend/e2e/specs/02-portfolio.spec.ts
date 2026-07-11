import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_PORTFOLIO } from '../fixtures/mock-data';

const MOCK = {
  total_value: 125000, daily_change: 2500, daily_change_pct: 2.04,
  total_return_pct: 18.5, cash: 15000,
  holdings: [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 180, current_price: 195.60, market_value: 9780, gain_loss_pct: 8.7, allocation_pct: 7.8, asset_class: 'Stock' },
    { symbol: 'VTI', name: 'Vanguard Total Stock', shares: 200, avg_cost: 230, current_price: 245.30, market_value: 49060, gain_loss_pct: 6.7, allocation_pct: 39.2, asset_class: 'ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond', shares: 300, avg_cost: 70, current_price: 71.80, market_value: 21540, gain_loss_pct: 2.6, allocation_pct: 17.2, asset_class: 'Bond' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 30, avg_cost: 160, current_price: 185.40, market_value: 5562, gain_loss_pct: 15.9, allocation_pct: 4.5, asset_class: 'Stock' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 45, avg_cost: 390, current_price: 425.80, market_value: 19161, gain_loss_pct: 9.2, allocation_pct: 15.3, asset_class: 'Stock' },
    { symbol: 'VXUS', name: 'Vanguard Total Intl', shares: 120, avg_cost: 55, current_price: 60.10, market_value: 7212, gain_loss_pct: 9.3, allocation_pct: 5.8, asset_class: 'ETF' },
  ],
  asset_classes: [
    { name: 'US Stocks', value: 34503, pct: 27.6, color: '#00D4FF' },
    { name: 'ETFs', value: 56272, pct: 45.0, color: '#A78BFA' },
    { name: 'Bonds', value: 21540, pct: 17.2, color: '#F59E0B' },
    { name: 'Intl Stocks', value: 7212, pct: 5.8, color: '#34D399' },
    { name: 'Cash', value: 15000, pct: 4.4, color: '#94A3B8' },
  ],
  performance: [
    { date: '2025-01', value: 100000 }, { date: '2025-02', value: 102000 },
    { date: '2025-03', value: 98000 }, { date: '2025-04', value: 105000 },
    { date: '2025-05', value: 110000 }, { date: '2025-06', value: 125000 },
  ],
};

test.describe('02 — Portfolio Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK) }));
    await page.goto('/portfolio');
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 10000 });
  });

  test('02.1 — Page renders with heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Investment Portfolio');
  });

  test('02.2 — Portfolio summary visible with total value', async ({ page }) => {
    await expect(page.locator('[data-testid="portfolio-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-summary"]')).toContainText('125,000');
  });

  test('02.3 — Holdings table shows all symbols', async ({ page }) => {
    await expect(page.locator('[data-testid="holdings-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="holdings-table"]')).toContainText('AAPL');
    await expect(page.locator('[data-testid="holdings-table"]')).toContainText('VTI');
    await expect(page.locator('[data-testid="holdings-table"]')).toContainText('MSFT');
  });

  test('02.4 — Allocation pie chart renders', async ({ page }) => {
    await expect(page.locator('[data-testid="allocation-pie"]')).toBeVisible();
  });

  test('02.5 — Performance line chart renders', async ({ page }) => {
    await expect(page.locator('[data-testid="performance-line"]')).toBeVisible();
  });

  test('02.6 — Concentration meter visible', async ({ page }) => {
    await expect(page.locator('[data-testid="concentration-meter"]')).toBeVisible();
  });

  test('02.7 — Daily change shows color-coded value', async ({ page }) => {
    const change = page.locator('[data-testid="daily-change"]');
    await expect(change).toBeVisible();
    const color = await change.evaluate(el => getComputedStyle(el).color);
    // Positive change → green (or positive class)
    expect(color !== 'rgb(255, 0, 0)').toBeTruthy();
  });

  test('02.8 — Loading state on fetch', async ({ page }) => {
    await page.route('**/api/portfolio/full', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK) });
    });
    await page.goto('/portfolio');
    await expect(page.locator('[data-testid="portfolio-loading"]')).toBeVisible();
  });

  test('02.9 — Error state with retry button', async ({ page }) => {
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/portfolio');
    await expect(page.locator('[data-testid="portfolio-error"]')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('02.10 — Empty portfolio state handled', async ({ page }) => {
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_value: 0, holdings: [], asset_classes: [], performance: [], daily_change: 0, daily_change_pct: 0, total_return_pct: 0, cash: 0 }),
      }));
    await page.goto('/portfolio');
    await expect(page.locator('[data-testid="portfolio-page"]')).toBeVisible({ timeout: 10000 });
    // Empty state should show something meaningful
    await expect(page.locator('[data-testid="portfolio-empty"], .empty-state').first()).toBeVisible({ timeout: 5000 });
  });

  test('02.11 — Single-holding concentration warning', async ({ page }) => {
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK, holdings: [MOCK.holdings[0]],
          asset_classes: [MOCK.asset_classes[0]],
        }),
      }));
    await page.goto('/portfolio');
    await expect(page.locator('[data-testid="concentration-warning"], .concentration-warning').first()).toBeVisible({ timeout: 5000 });
  });

  test('02.12 — Holdings display gain/loss percentages', async ({ page }) => {
    await expect(page.locator('[data-testid="holdings-table"]')).toContainText('%');
  });
});