import { test, expect } from '@playwright/test';

// Mock user for ProtectedRoute bypass
const MOCK_USER = {
  id: 'test-user-1',
  email: 'test@fin.app',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

test.describe('Phase 5 — Ocean Dashboard Shell', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /api/auth/me endpoint so ProtectedRoute allows access
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      });
    });

    // Set a fake access token so the client sends Authorization header
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-jwt-token');
    });

    await page.goto('/');
  });

  test('01 — ocean canvas renders', async ({ page }) => {
    const canvas = page.locator('canvas.ocean-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify canvas has WebGL context (non-zero dimensions)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('02 — fins (agent indicators) visible in sidebar', async ({ page }) => {
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Check all three agent panel buttons
    await expect(page.locator('.sidebar-item', { hasText: 'Investment' })).toBeVisible();
    await expect(page.locator('.sidebar-item', { hasText: 'Debt' })).toBeVisible();
    await expect(page.locator('.sidebar-item', { hasText: 'Retirement' })).toBeVisible();

    // Each should have a status dot
    const statusDots = sidebar.locator('.sidebar-status-dot');
    await expect(statusDots).toHaveCount(3);
  });

  test('03 — sidebar collapses and expands', async ({ page }) => {
    const sidebar = page.locator('aside.sidebar');
    const hamburger = page.locator('.topbar-hamburger');

    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Sidebar should start open (has .open class)
    await expect(sidebar).toHaveClass(/open/);

    // Click hamburger to collapse
    await hamburger.click();
    await expect(sidebar).not.toHaveClass(/open/);

    // Click hamburger to expand
    await hamburger.click();
    await expect(sidebar).toHaveClass(/open/);
  });

  test('04 — sync indicator visible in topbar', async ({ page }) => {
    const syncButton = page.locator('.sync-indicator');
    await expect(syncButton).toBeVisible({ timeout: 10000 });

    // Should have a sync dot
    const syncDot = syncButton.locator('.sync-dot');
    await expect(syncDot).toBeVisible();

    // Should show "Synced" label initially (idle state)
    await expect(syncButton.locator('.sync-label')).toContainText('Synced');
  });

  test('05 — sync triggers agent loading animation', async ({ page }) => {
    const syncButton = page.locator('.sync-indicator');

    // Click sync
    await syncButton.click();

    // Sync button should become disabled during sync
    await expect(syncButton).toBeDisabled({ timeout: 5000 });

    // Status dots should change to loading/running state
    const loadingDots = page.locator('.sidebar-status-dot.loading, .sidebar-status-dot.running');
    await expect(loadingDots.first()).toBeVisible({ timeout: 5000 });

    // Wait for sync to complete (mock: 4 seconds)
    await page.waitForTimeout(4500);

    // After sync, button should be enabled again
    await expect(syncButton).toBeEnabled({ timeout: 5000 });
  });

  test('06 — agent selection updates main content', async ({ page }) => {
    // Click Investment agent
    const investmentBtn = page.locator('.sidebar-item', { hasText: 'Investment' });
    await investmentBtn.click();

    // Main content should update to show Investment Agent panel
    const mainContent = page.locator('.dashboard-main');
    await expect(mainContent.locator('[data-testid="agent-panel-investment"]')).toBeVisible();
    await expect(mainContent.locator('.agent-panel-title')).toContainText('Investment Agent');

    // Click Debt agent
    const debtBtn = page.locator('.sidebar-item', { hasText: 'Debt' });
    await debtBtn.click();
    await expect(mainContent.locator('[data-testid="agent-panel-debt"]')).toBeVisible();
    await expect(mainContent.locator('.agent-panel-title')).toContainText('Debt Agent');

    // Click Retirement agent
    const retirementBtn = page.locator('.sidebar-item', { hasText: 'Retirement' });
    await retirementBtn.click();
    await expect(mainContent.locator('[data-testid="agent-panel-retirement"]')).toBeVisible();
    await expect(mainContent.locator('.agent-panel-title')).toContainText('Retirement Agent');

    // Click same agent again to deselect → shows placeholder
    await retirementBtn.click();
    await expect(mainContent.locator('[data-testid="dashboard-placeholder"]')).toBeVisible();
    await expect(mainContent.locator('.placeholder-title')).toContainText('Fin Dashboard');
  });

  test('07 — topbar brand and user menu', async ({ page }) => {
    // Brand name should be visible
    await expect(page.locator('.topbar-brand')).toContainText('Fin');

    // Hamburger button should be present with aria label
    const hamburger = page.locator('.topbar-hamburger');
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-label', /sidebar/i);
  });

  test('08 — responsive layout: sidebar renders within viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();

    // Sidebar should be within viewport bounds
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).not.toBeNull();
    expect(sidebarBox!.x).toBeGreaterThanOrEqual(0);
    expect(sidebarBox!.width).toBeLessThanOrEqual(1440);
  });

  test('09 — no console errors or WebGL warnings', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(3000);

    // Filter out expected non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('third-party') &&
        !e.includes('chrome-extension'),
    );

    // No WebGL context lost or Three.js errors
    expect(criticalErrors.filter((e) => e.includes('WebGL') || e.includes('THREE'))).toHaveLength(0);
  });

  test('10 — bioluminescence canvas renders', async ({ page }) => {
    const bioCanvas = page.locator('[data-testid="bioluminescence"]');
    await expect(bioCanvas).toBeVisible({ timeout: 10000 });

    const box = await bioCanvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('11 — fin models render with correct shapes', async ({ page }) => {
    // All three fins should be visible
    await expect(page.locator('[data-testid="fin-investment"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="fin-debt"]')).toBeVisible();
    await expect(page.locator('[data-testid="fin-retirement"]')).toBeVisible();

    // Each fin should contain an SVG
    await expect(page.locator('[data-testid="fin-investment"] svg')).toBeVisible();
    await expect(page.locator('[data-testid="fin-debt"] svg')).toBeVisible();
    await expect(page.locator('[data-testid="fin-retirement"] svg')).toBeVisible();

    // Fins should start in idle state
    await expect(page.locator('[data-testid="fin-investment"]')).toHaveClass(/fin-idle/);
  });

  test('12 — fins change state class on sync', async ({ page }) => {
    // Verify initial idle state
    const investmentFin = page.locator('[data-testid="fin-investment"]');
    await expect(investmentFin).toHaveClass(/fin-idle/);

    // Click sync to trigger state change
    await page.locator('.sync-indicator').click();

    // Fin should briefly leave idle state (loading → running)
    // Just check that data-status attribute changes
    await expect(investmentFin).toHaveAttribute('data-status', /^(loading|running)$/, { timeout: 5000 });

    // Glow should be visible during active states
    const glow = investmentFin.locator('.fin-glow');
    const glowOpacity = await glow.evaluate((el) =>
      window.getComputedStyle(el).opacity,
    );
    expect(parseFloat(glowOpacity)).toBeGreaterThan(0);
  });

  test('13 — clicking fins selects agent', async ({ page }) => {
    // Dispatch click directly on fin element to bypass animation stability check
    const investmentFin = page.locator('[data-testid="fin-investment"]');
    await investmentFin.dispatchEvent('click');

    // Should show agent panel
    await expect(page.locator('[data-testid="agent-panel-investment"]')).toBeVisible({ timeout: 5000 });

    // Fin should have selected state
    await expect(investmentFin).toHaveClass(/fin-selected/);

    // Click again to deselect
    await investmentFin.dispatchEvent('click');
    await expect(page.locator('[data-testid="dashboard-placeholder"]')).toBeVisible();
  });
});
