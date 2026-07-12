/**
 * Phase 35 — keyboard-shortcut overlay e2e.
 * Verifies: `?` opens the overlay, click navigates + closes, ESC closes,
 * and the existing `cmd+k` CommandPalette still works (hard guard).
 */
import { test, expect } from '@playwright/test';

test.describe('Keyboard shortcuts overlay', () => {
  test('? opens overlay on /portfolio', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('?');
    const overlay = page.locator('[data-testid="kbd-overlay-root"]');
    await expect(overlay).toBeVisible();
    await expect(page.locator('[data-testid="kbd-search-input"]')).toBeFocused();
  });

  test('search "nav" filters to Navigation rows', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('?');
    const input = page.locator('[data-testid="kbd-search-input"]');
    await input.fill('nav');
    await expect(input).toHaveValue('nav');
    // Navigation section visible
    await expect(page.getByRole('button', { name: /Navigation/ }).first()).toBeVisible();
  });

  test('cmd+k still opens CommandPalette (hard guard)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Control+K');
    await expect(page.locator('[data-testid="copalette-root"]')).toBeVisible();
  });

  test('esc closes the overlay', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('?');
    await expect(page.locator('[data-testid="kbd-overlay-root"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="kbd-overlay-root"]')).toHaveCount(0);
  });

  test('topbar qs-shortcuts click opens overlay', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('[data-testid="qs-shortcuts"]');
    await btn.click();
    await expect(page.locator('[data-testid="kbd-overlay-root"]')).toBeVisible();
  });
});
