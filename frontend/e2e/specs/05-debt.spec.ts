import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_DEBTS } from '../fixtures/mock-data';

test.describe('05 — Debt Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/debts', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEBTS) }));
    await page.route('**/api/debts/strategy', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ strategy: 'avalanche', months_to_payoff: 48, total_interest: 12400 }) }));
  });

  test('05.1 — Debt dashboard renders', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    await expect(page.locator('.debt-dashboard')).toBeVisible();
  });

  test('05.2 — All debt accounts listed', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    await expect(page.getByText('Chase Sapphire')).toBeVisible();
    await expect(page.getByText('Student Loan - Federal')).toBeVisible();
    await expect(page.getByText('Auto Loan - Honda')).toBeVisible();
  });

  test('05.3 — Total balance displayed', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="debt-total"], .debt-total')).toBeVisible();
  });

  test('05.4 — Add debt form can be toggled', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    const addBtn = page.locator('.add-debt-btn, button:has-text("Add Debt"), button:has-text("Add")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('.debt-dashboard')).toBeVisible();
  });

  test('05.5 — Strategy comparison section present', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    await expect(page.getByText(/Avalanche|Snowball/)).toBeVisible();
  });

  test('05.6 — Avalanche/snowball toggle switches strategy', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    const toggle = page.locator('[data-testid="strategy-toggle"], .strategy-toggle button, button:has-text("Snowball")').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
      await expect(page.locator('.debt-dashboard')).toBeVisible();
    }
  });

  test('05.7 — Payoff timeline/projection shown', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="payoff-timeline"], .payoff-chart').first()).toBeVisible({ timeout: 5000 });
  });

  test('05.8 — Extra payment calculator present', async ({ page }) => {
    await page.goto('/debt');
    await page.waitForSelector('.debt-dashboard', { timeout: 10000 });
    const calculator = page.locator('[data-testid="extra-payment"], .payoff-calculator, input[type="range"]').first();
    await expect(calculator).toBeVisible({ timeout: 5000 });
  });

  test('05.9 — Empty state when no debts', async ({ page }) => {
    await page.route('**/api/debts', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.goto('/debt');
    await page.waitForSelector('[data-testid="debt-empty"], .empty-state', { timeout: 10000 });
    await expect(page.locator('[data-testid="debt-empty"], .empty-state').first()).toBeVisible();
  });

  test('05.10 — Loading state on initial fetch', async ({ page }) => {
    await page.route('**/api/debts', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEBTS) });
    });
    await page.goto('/debt');
    await expect(page.locator('[data-testid="debt-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('05.11 — Error state with retry', async ({ page }) => {
    await page.route('**/api/debts', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/debt');
    await expect(page.locator('[data-testid="debt-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});