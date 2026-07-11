import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_EXECUTION } from '../fixtures/mock-data';

test.describe('07 — Execution Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/execution/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXECUTION) }));
    await page.route('**/api/execution', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_EXECUTION]) }));
  });

  test('07.1 — Execution dashboard renders', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.locator('.execution-dashboard')).toBeVisible();
  });

  test('07.2 — Progress bar visible with correct percentage', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="progress-bar"], .progress-bar')).toBeVisible();
    await expect(page.getByText(/33%/)).toBeVisible();
  });

  test('07.3 — Steps list shows completed and pending', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.getByText('Review recommendation')).toBeVisible();
    await expect(page.getByText('Place limit order for 10 VTI shares')).toBeVisible();
    await expect(page.getByText('Verify allocation reached')).toBeVisible();
  });

  test('07.4 — Check-in banner rendered', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="checkin-banner"], .checkin-banner').first()).toBeVisible({ timeout: 5000 });
  });

  test('07.5 — Mark step complete interaction', async ({ page }) => {
    await page.route('**/api/execution/*/step/*/complete', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'completed' }) }));
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    const checkbox = page.locator('[data-testid="step-checkbox"], .step-checkbox').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
      await page.waitForTimeout(500);
    }
  });

  test('07.6 — Before/After comparison component present', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="before-after"], .before-after-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('07.7 — Follow-through scheduled date visible', async ({ page }) => {
    await page.goto('/execution');
    await page.waitForSelector('.execution-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="follow-through"], .follow-through').first()).toBeVisible({ timeout: 5000 });
  });

  test('07.8 — Loading state on fetch', async ({ page }) => {
    await page.route('**/api/execution', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_EXECUTION]) });
    });
    await page.goto('/execution');
    await expect(page.locator('[data-testid="execution-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('07.9 — Error state with retry', async ({ page }) => {
    await page.route('**/api/execution', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/execution');
    await expect(page.locator('[data-testid="execution-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('07.10 — Empty state when no executions', async ({ page }) => {
    await page.route('**/api/execution', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.goto('/execution');
    await expect(page.locator('[data-testid="execution-empty"], .empty-state').first()).toBeVisible({ timeout: 10000 });
  });
});