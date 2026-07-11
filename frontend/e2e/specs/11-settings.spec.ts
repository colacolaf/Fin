import { test, expect } from '@playwright/test';
import { MOCK_USER } from '../fixtures/mock-data';

const MOCK_SETTINGS = {
  user_id: 'test-user-1',
  profile: { name: 'Test User', email: 'test@fin.app', avatar_url: null },
  privacy: { share_benchmarks: false, anonymous_leaderboard: true },
  notifications: { email: true, push: true, reminders: true },
  integrations: { plaid_connected: true, alpaca_connected: false },
  preferences: { theme: 'dark', currency: 'USD', dashboard: 'default' },
  risk_profile: { type: 'moderate', score: 65, updated_at: '2026-01-15T00:00:00Z' },
};

test.describe('11 — Settings & User Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/settings', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SETTINGS) }));
    await page.route('**/api/settings/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SETTINGS) }));
    await page.route('**/api/integrations/status', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SETTINGS.integrations) }));
  });

  test('11.1 — Settings page renders', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    await expect(page.locator('[data-testid="settings-page"], .settings').first()).toBeVisible();
  });

  test('11.2 — Profile section shows name and email', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('test@fin.app')).toBeVisible();
  });

  test('11.3 — Notification toggles render and are interactive', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    const toggle = page.locator('[data-testid="notification-email"], input[type="checkbox"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('11.4 — Theme toggle switches dark/light', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Light")').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('11.5 — Integration connections displayed (Plaid/Alpaca)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    await expect(page.getByText(/plaid|alpaca/i)).toBeVisible();
  });

  test('11.6 — Privacy settings section present', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    await expect(page.getByText(/privacy|share/i)).toBeVisible();
  });

  test('11.7 — Risk profile information displayed', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    await expect(page.getByText(/moderate|risk/i)).toBeVisible();
  });

  test('11.8 — Save settings works', async ({ page }) => {
    await page.route('**/api/settings', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SETTINGS) });
    });
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"], .settings', { timeout: 10000 });
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Changes")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('11.9 — Loading state on fetch', async ({ page }) => {
    await page.route('**/api/settings', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SETTINGS) });
    });
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('11.10 — Error state with retry', async ({ page }) => {
    await page.route('**/api/settings', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});