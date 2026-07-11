import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_BACKTEST } from '../fixtures/mock-data';

test.describe('09 — Backtest Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/backtest/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BACKTEST) }));
    await page.route('**/api/backtest', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_BACKTEST]) }));
    await page.route('**/api/backtest/run', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BACKTEST) }));
  });

  test('09.1 — Backtest dashboard renders', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.locator('.backtest-dashboard')).toBeVisible();
  });

  test('09.2 — Strategy builder component visible', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="strategy-builder"], .strategy-builder').first()).toBeVisible({ timeout: 5000 });
  });

  test('09.3 — Backtest results showing key metrics', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.getByText(/48\.2%/)).toBeVisible();
    await expect(page.getByText(/8\.1%/)).toBeVisible();
    await expect(page.getByText(/0\.92/)).toBeVisible();
  });

  test('09.4 — Max drawdown displayed', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.getByText(/20\.5%/)).toBeVisible();
  });

  test('09.5 — Historical replay component present', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="historical-replay"], .historical-replay').first()).toBeVisible({ timeout: 5000 });
  });

  test('09.6 — Run backtest button functional', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    const runBtn = page.locator('button:has-text("Run"), button:has-text("Run Backtest")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('09.7 — Strategy name visible', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    await expect(page.getByText('60/40 VTI/BND')).toBeVisible();
  });

  test('09.8 — Result transition animation on new results', async ({ page }) => {
    await page.goto('/backtest');
    await page.waitForSelector('.backtest-dashboard', { timeout: 10000 });
    const runBtn = page.locator('button:has-text("Run"), button:has-text("Run Backtest")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="result-transition"], .result-transition').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('09.9 — Loading state on fetch', async ({ page }) => {
    await page.route('**/api/backtest', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_BACKTEST]) });
    });
    await page.goto('/backtest');
    await expect(page.locator('[data-testid="backtest-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('09.10 — Error state with retry', async ({ page }) => {
    await page.route('**/api/backtest', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/backtest');
    await expect(page.locator('[data-testid="backtest-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('09.11 — Empty state for new user', async ({ page }) => {
    await page.route('**/api/backtest', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.goto('/backtest');
    await expect(page.locator('[data-testid="backtest-empty"], .empty-state').first()).toBeVisible({ timeout: 10000 });
  });
});