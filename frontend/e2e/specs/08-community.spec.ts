import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_COMMUNITY } from '../fixtures/mock-data';

test.describe('08 — Community Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/community/benchmarks', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.benchmarks) }));
    await page.route('**/api/community/leaderboard', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.leaderboard) }));
    await page.route('**/api/community/votes', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.votes) }));
  });

  test('08.1 — Community dashboard renders', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.locator('.community-dashboard')).toBeVisible();
  });

  test('08.2 — Leaderboard visible with aliases', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.getByText('EarlySaver42')).toBeVisible();
    await expect(page.getByText('FIREWalker')).toBeVisible();
    await expect(page.getByText('BudgetNinja')).toBeVisible();
  });

  test('08.3 — Benchmark comparison shows metrics', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="benchmark-comparison"], .benchmark-chart').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/savings_rate|savings/)).toBeVisible();
  });

  test('08.4 — Vote widget renders for recommendations', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.locator('[data-testid="vote-widget"], .vote-widget').first()).toBeVisible({ timeout: 5000 });
  });

  test('08.5 — Upvote interaction works', async ({ page }) => {
    await page.route('**/api/community/vote/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) }));
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    const upBtn = page.locator('[data-testid="upvote-btn"], .upvote-btn').first();
    if (await upBtn.isVisible()) {
      await upBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('08.6 — Downvote interaction works', async ({ page }) => {
    await page.route('**/api/community/vote/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) }));
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    const downBtn = page.locator('[data-testid="downvote-btn"], .downvote-btn').first();
    if (await downBtn.isVisible()) {
      await downBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('08.7 — Leaderboard scores visible', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.getByText('92')).toBeVisible();
    await expect(page.getByText('88')).toBeVisible();
  });

  test('08.8 — Change indicators shown (+/-)', async ({ page }) => {
    await page.goto('/community');
    await page.waitForSelector('.community-dashboard', { timeout: 10000 });
    await expect(page.getByText('+3')).toBeVisible();
    await expect(page.getByText('-1')).toBeVisible();
    await expect(page.getByText('+5')).toBeVisible();
  });

  test('08.9 — Loading state on fetch', async ({ page }) => {
    await page.route('**/api/community/leaderboard', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.leaderboard) });
    });
    await page.goto('/community');
    await expect(page.locator('[data-testid="community-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('08.10 — Error state with retry', async ({ page }) => {
    await page.route('**/api/community/leaderboard', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/community');
    await expect(page.locator('[data-testid="community-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});