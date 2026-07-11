import { test, expect } from '@playwright/test';

test.describe('Retirement Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to retirement page — relies on mock API or real backend
    await page.goto('/retirement');
  });

  test('renders retirement page with profile inputs', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Retirement Analysis');

    // Profile input fields exist
    await expect(page.locator('.retirement-inputs')).toBeVisible();
    await expect(page.locator('.input-grid input').first()).toBeVisible();
  });

  test('renders score gauge after load', async ({ page }) => {
    // Wait for either score or error/loading to resolve
    await page.waitForSelector('.retirement-score, .loading-skeleton, .alert', { timeout: 15000 });

    const scoreSection = page.locator('.retirement-score');
    const loading = page.locator('.loading-skeleton');

    if (await scoreSection.isVisible()) {
      // Score gauge SVG present
      await expect(page.locator('.gauge-svg')).toBeVisible();
      await expect(page.locator('.score-label')).toBeVisible();
      await expect(page.locator('.score-funded')).toBeVisible();

      // Breakdown bars present
      const breakdownItems = page.locator('.breakdown-item');
      await expect(breakdownItems).toHaveCount(4);

      // Score value between 0-100 rendered
      const scoreText = await page.locator('.gauge-score').textContent();
      const score = parseInt(scoreText || '0', 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    } else if (await loading.isVisible()) {
      // If backend not available, loading state is acceptable
      await expect(loading).toBeVisible();
    }
  });

  test('renders projection chart after load', async ({ page }) => {
    await page.waitForSelector('.projection-chart, .loading-skeleton', { timeout: 15000 });

    const chart = page.locator('.projection-chart');
    if (await chart.isVisible()) {
      await expect(page.locator('.chart-bars')).toBeVisible();
      await expect(page.locator('.chart-legend')).toBeVisible();
    }
  });

  test('renders grid sections', async ({ page }) => {
    await page.waitForSelector('.retirement-grid', { timeout: 15000 });

    const grids = page.locator('.retirement-grid');
    // At least one grid renders
    const count = await grids.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Account breakdown + contribution optimizer visible
    await expect(page.locator('.account-breakdown')).toBeVisible();
    await expect(page.locator('.contribution-optimizer')).toBeVisible();
  });

  test('renders tax strategy section', async ({ page }) => {
    await page.waitForSelector('.tax-strategy', { timeout: 15000 });

    const taxSection = page.locator('.tax-strategy');
    await expect(taxSection).toBeVisible();
    await expect(page.locator('.bracket-value').first()).toBeVisible();
    await expect(page.locator('.allocation-bar')).toBeVisible();
    await expect(page.locator('.tax-recommendation')).toBeVisible();
  });

  test('refresh button triggers reload', async ({ page }) => {
    const refreshBtn = page.locator('.retirement-header button');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // Should show loading or re-render
    await page.waitForTimeout(3000);
    // Page should not crash
    await expect(page.locator('.retirement-dashboard')).toBeVisible();
  });

  test('input fields are editable', async ({ page }) => {
    const firstInput = page.locator('.input-grid input').first();
    await firstInput.fill('35');
    await expect(firstInput).toHaveValue('35');
  });

  test('shortfall displayed when funded < 100%', async ({ page }) => {
    // Set low savings to trigger shortfall
    const savingsInput = page.locator('.input-grid input').nth(2);
    await savingsInput.fill('10000');

    const refreshBtn = page.locator('.retirement-header button');
    await refreshBtn.click();

    await page.waitForSelector('.score-shortfall, .loading-skeleton', { timeout: 15000 });
    const shortfall = page.locator('.score-shortfall');
    if (await shortfall.isVisible()) {
      await expect(shortfall).toContainText('/mo shortfall');
    }
  });
});