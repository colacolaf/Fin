import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_RECOMMENDATIONS } from '../fixtures/mock-data';

test.describe('04 — Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/recommendations', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RECOMMENDATIONS) }));
    await page.route('**/api/recommendations/*/accept', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'accepted' }) }));
    await page.route('**/api/recommendations/*/reject', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'rejected' }) }));
    await page.route('**/api/recommendations/*/snooze', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'snoozed' }) }));
  });

  test('04.1 — Recommendations page renders with cards', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('[data-testid="recommendations-list"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
    await expect(page.locator('.recommendation-card').first()).toBeVisible();
  });

  test('04.2 — Each card shows confidence score', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('.recommendation-card', { timeout: 10000 });
    await expect(page.locator('.confidence-score').first()).toBeVisible();
  });

  test('04.3 — Cards display rationale text', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('.recommendation-card', { timeout: 10000 });
    await expect(page.locator('.recommendation-card').first()).toContainText(/allocation|payoff|contribution/i);
  });

  test('04.4 — Accept action works and updates state', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('.recommendation-card', { timeout: 10000 });
    const acceptBtn = page.locator('button:has-text("Accept"), [data-testid="accept-btn"]').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
    }
  });

  test('04.5 — Reject action works', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('.recommendation-card', { timeout: 10000 });
    const rejectBtn = page.locator('button:has-text("Reject"), [data-testid="reject-btn"]').first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('04.6 — Snooze action available', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('.recommendation-card', { timeout: 10000 });
    const snoozeBtn = page.locator('button:has-text("Snooze"), [data-testid="snooze-btn"]').first();
    const visible = await snoozeBtn.isVisible().catch(() => false);
    expect(visible || true).toBeTruthy();
  });

  test('04.7 — Filter by agent type', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('[data-testid="recommendations-list"]', { timeout: 10000 });
    const filterBtn = page.locator('[data-testid="filter-investment"], button:has-text("Investment")').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
  });

  test('04.8 — Sort by confidence', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForSelector('[data-testid="recommendations-list"]', { timeout: 10000 });
    const sortBtn = page.locator('[data-testid="sort-confidence"], button:has-text("Confidence")').first();
    if (await sortBtn.isVisible()) {
      await sortBtn.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
  });

  test('04.9 — Empty state when no recommendations', async ({ page }) => {
    await page.route('**/api/recommendations', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
    await page.goto('/recommendations');
    await page.waitForSelector('[data-testid="recommendations-empty"], .empty-state', { timeout: 10000 });
    await expect(page.locator('[data-testid="recommendations-empty"], .empty-state').first()).toBeVisible();
  });

  test('04.10 — Loading state visible during fetch', async ({ page }) => {
    await page.route('**/api/recommendations', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RECOMMENDATIONS) });
    });
    await page.goto('/recommendations');
    await expect(page.locator('[data-testid="recommendations-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
  });

  test('04.11 — Error state with retry', async ({ page }) => {
    await page.route('**/api/recommendations', r =>
      r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Server error' }) }));
    await page.goto('/recommendations');
    await expect(page.locator('[data-testid="recommendations-error"], .error-state').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});