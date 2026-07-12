import { test, expect } from '@playwright/test';
import { MOCK_USER } from '../fixtures/mock-data';

test.describe('15 — Ocean Dashboard Pass', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      }),
    );
    await page.addInitScript(() =>
      localStorage.setItem('access_token', 'ocean-token'),
    );
    await page.goto('/');
    // Canvas element is aria-hidden; 'visible' state flukes on <canvas>.
    // Wait for DOM attach first, then confirm Three.js resized the buffer.
    await page.waitForSelector('[data-testid="ocean-canvas"]', {
      state: 'attached',
      timeout: 15000,
    });
    await page.waitForFunction(
      () => {
        const c = document.querySelector(
          '[data-testid="ocean-canvas"]',
        ) as HTMLCanvasElement | null;
        return !!c && c.width > 0 && c.height > 0;
      },
      { timeout: 12000 },
    );
  });

  test('15.1 — Sidebar starts collapsed (icons only) on desktop', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    const width = await sidebar.evaluate((el) => el.clientWidth);
    expect(width).toBeLessThanOrEqual(72);
    for (const k of [
      'dashboard',
      'portfolio',
      'debt',
      'retirement',
      'questions',
      'research',
    ]) {
      await expect(page.locator(`[data-testid="nav-${k}"]`)).toBeAttached();
    }
    for (const k of ['settings', 'memory', 'chat', 'trade', 'analytics']) {
      await expect(page.locator(`[data-testid="nav-${k}"]`)).toBeAttached();
    }
    const labelOpacity = await page
      .locator('[data-testid="nav-portfolio"] .sidebar-item-label')
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(labelOpacity).toBeLessThan(0.1);
  });

  test('15.2 — Hamburger toggles sidebar width (no translateX)', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    const collapsedWidth = await sidebar.evaluate((el) => el.clientWidth);

    await page.getByRole('button', { name: /open sidebar/i }).click();

    const expandedWidth = await sidebar.evaluate((el) => el.clientWidth);
    expect(expandedWidth).toBeGreaterThan(collapsedWidth + 50);
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    await page.getByRole('button', { name: /close sidebar/i }).click();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  test('15.3 — Ocean canvas is visible behind everything (z-index 0)', async ({ page }) => {
    const scene = page.locator('[data-testid="ocean-scene"]');
    await expect(scene).toBeVisible();
    const z = await scene.evaluate((el) =>
      Number(getComputedStyle(el).zIndex),
    );
    expect(z).toBe(0);
  });

  test('15.4 — All three fins render', async ({ page }) => {
    for (const fin of ['investment', 'debt', 'retirement']) {
      await expect(page.locator(`[data-testid="fin-${fin}"]`)).toBeVisible();
    }
  });

  test('15.5 — Click fin opens Agent Context View (submarine cabin)', async ({ page }) => {
    await page.locator('[data-testid="fin-investment"]').click();

    const panel = page.locator('[data-testid="agent-panel-investment"]');
    await expect(panel).toBeVisible();
    await expect(page.locator('[data-testid="agent-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-main-pane"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="recommendation-skeleton"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="agent-chat-input"]'),
    ).toBeAttached();
  });

  test('15.6 — Back button closes Agent Context View', async ({ page }) => {
    await page.locator('[data-testid="fin-debt"]').click();
    await expect(page.locator('[data-testid="agent-panel-debt"]')).toBeVisible();

    await page.locator('[data-testid="agent-back"]').click();
    await expect(
      page.locator('[data-testid="agent-panel-debt"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="dashboard-placeholder"]'),
    ).toBeVisible();
  });

  test('15.7 — Screenshots (collapsed/expanded/agent) + same-fin re-click closes', async ({ page }) => {
    // Collapsed (default desktop state)
    await page.screenshot({
      path: 'test-results/ocean-sidebar-collapsed.png',
      fullPage: false,
    });

    // Expand via hamburger
    await page.getByRole('button', { name: /open sidebar/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: 'test-results/ocean-sidebar-expanded.png',
      fullPage: false,
    });

    // Open via fin click → assert panel mounted → screenshot
    await page.locator('[data-testid="fin-retirement"]').click();
    await expect(
      page.locator('[data-testid="agent-panel-retirement"]'),
    ).toBeVisible();
    await page.screenshot({
      path: 'test-results/ocean-agent-context.png',
      fullPage: false,
    });

    // Same-fin re-click closes (Dashboard's `prev === agent ? null : agent`).
    await page.locator('[data-testid="fin-retirement"]').click();
    await expect(
      page.locator('[data-testid="agent-panel-retirement"]'),
    ).toHaveCount(0);
  });
});
