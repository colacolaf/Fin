import { test, expect } from '@playwright/test';
import { MOCK_USER } from '../fixtures/mock-data';

test.describe('14 — Cross-Agent Orchestration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
    await page.route('**/api/orchestration/**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) }));
    await page.route('**/api/orchestration/run', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        result: [{ agent: 'investment', confidence: 0.85 }, { agent: 'debt', confidence: 0.92 }, { agent: 'retirement', confidence: 0.78 }],
        summary: 'Multi-agent analysis complete. 3 recommendations generated.',
      })}));
  });

  test('14.1 — Page renders orchestration title', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    await expect(page.locator('.ocean-heading')).toContainText('Multi-Agent');
  });

  test('14.2 — Skill chips are visible', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    await expect(page.locator('.agent-chip').first()).toBeVisible();
  });

  test('14.3 — Run button exists', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
    await expect(runBtn).toBeVisible();
  });

  test('14.4 — Can select a skill chip', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const debtChip = page.locator('.agent-chip:has-text("Debt")').first();
    if (await debtChip.isVisible()) {
      await debtChip.click();
      await page.waitForTimeout(300);
      await expect(debtChip).toHaveClass(/active/);
    }
  });

  test('14.5 — Subtitle text present', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    await expect(page.locator('.ocean-subtitle')).toContainText(/multiple ai agents/i);
  });

  test('14.6 — All three agent chips visible (Investment, Debt, Retirement)', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    await expect(page.locator('.agent-chip:has-text("Investment")').first()).toBeVisible();
    await expect(page.locator('.agent-chip:has-text("Debt")').first()).toBeVisible();
    await expect(page.locator('.agent-chip:has-text("Retirement")').first()).toBeVisible();
  });

  test('14.7 — Run shows loading state', async ({ page }) => {
    await page.route('**/api/orchestration/run', async route => {
      await new Promise(r => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: [], summary: '' }) });
    });
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await expect(page.locator('[data-testid="orchestration-loading"], .loading-spinner').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('14.8 — Results panel appears after run', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('.agent-card, [data-testid="agent-result"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('14.9 — Confidence scores shown per agent result', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.getByText(/85%|0\.85/)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/92%|0\.92/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('14.10 — Summary text displays after run', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.getByText(/3 recommendations generated/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('14.11 — Can select multiple skill chips', async ({ page }) => {
    await page.goto('/orchestration');
    await page.waitForSelector('.ocean-page', { timeout: 10000 });
    const chips = page.locator('.agent-chip');
    const count = await chips.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      await chips.nth(i).click();
      await page.waitForTimeout(200);
    }
    const activeChips = page.locator('.agent-chip.active');
    await expect(activeChips.first()).toBeVisible({ timeout: 2000 });
  });
});