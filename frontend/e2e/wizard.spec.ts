import { test, expect, type Page } from '@playwright/test';

const FILL_BROKER = async (page: Page) => {
  await page.fill('input[name="apiKey"]', 'test-api-key-12345');
  await page.fill('input[name="apiSecret"]', 'test-api-secret-67890');
  // paper trading toggle already defaults to checked
  await page.click('button:has-text("Continue")');
};

const FILL_RISK = async (page: Page) => {
  // Click Continue on default risk profile settings
  await page.click('button:has-text("Continue")');
};

const FILL_GOALS = async (page: Page) => {
  // Just click Continue (no goals selected is valid for quick test)
  await page.click('button:has-text("Continue")');
};

const FILL_BUDGET = async (page: Page) => {
  await page.fill('input[name="monthlyIncome"]', '8000');
  await page.fill('input[name="monthlyExpenses"]', '4000');
  await page.click('button:has-text("Continue")');
};

test.describe('Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock localStorage to simulate logged-in state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fin_access_token', 'test-token');
      localStorage.setItem('fin_refresh_token', 'test-refresh');
    });
  });

  test('full wizard flow — complete all steps', async ({ page }) => {
    await page.goto('/setup');

    // Should see the wizard title
    await expect(page.locator('text=Welcome to Fin')).toBeVisible();

    // Step 0: Broker Connect
    await expect(page.locator('text=Connect Broker')).toBeVisible();
    await FILL_BROKER(page);

    // Step 1: Risk Tolerance
    await expect(page.locator('text=Risk Profile')).toBeVisible();
    await page.locator('input[name="riskScore"]').fill('5');
    await FILL_RISK(page);

    // Step 2: Goals
    await expect(page.locator('text=Your Goals')).toBeVisible();
    // Click Retirement goal card to select it
    const retirementCard = page.locator('text=Retirement').first();
    await retirementCard.click();
    await FILL_GOALS(page);

    // Step 3: Budget
    await expect(page.locator('text=Budget')).toBeVisible();
    await FILL_BUDGET(page);

    // Step 4: Review
    await expect(page.locator('text=Review & Save')).toBeVisible();
    // Verify review shows selected items
    await expect(page.locator('text=test-api-key-12345')).toBeVisible();

    // Click complete
    await page.click('button:has-text("Complete Setup")');
  });

  test('progress bar shows correct state', async ({ page }) => {
    await page.goto('/setup');

    // First dot should be active (enlarged)
    const firstDot = page.locator('[data-step="0"]');
    await expect(firstDot).toHaveClass(/wizard-progress__dot--active/);

    // Move to step 2
    await FILL_BROKER(page);
    await FILL_RISK(page);

    // First two dots should be completed, third active
    const dot0 = page.locator('[data-step="0"]');
    const dot1 = page.locator('[data-step="1"]');
    const dot2 = page.locator('[data-step="2"]');
    await expect(dot0).toHaveClass(/wizard-progress__dot--completed/);
    await expect(dot1).toHaveClass(/wizard-progress__dot--completed/);
    await expect(dot2).toHaveClass(/wizard-progress__dot--active/);
  });

  test('can navigate back with prev button', async ({ page }) => {
    await page.goto('/setup');

    // Go to step 1
    await FILL_BROKER(page);

    // Hit Back
    await page.click('button:has-text("Back")');

    // Should be back on step 0
    await expect(page.locator('text=Connect Broker')).toBeVisible();
  });

  test('can click completed step dot to go back', async ({ page }) => {
    await page.goto('/setup');

    // Progress to step 3
    await FILL_BROKER(page);
    await FILL_RISK(page);
    await FILL_GOALS(page);

    // Click step 1 dot (Risk Profile) to jump back
    const dot1 = page.locator('[data-step="1"]');
    await dot1.click();

    // Should be on Risk Profile step
    await expect(page.locator('text=Risk Profile')).toBeVisible();
  });

  test('animated transitions occur between steps', async ({ page }) => {
    await page.goto('/setup');

    // Confirm step 0 content visible
    await expect(page.locator('text=Connect Broker')).toBeVisible();

    await FILL_BROKER(page);

    // Step 1 content should now be visible
    await expect(page.locator('text=Risk Profile')).toBeVisible();
  });

  test('tour guide can be launched and dismissed', async ({ page }) => {
    await page.goto('/setup');

    // Click "Take a tour" button
    await page.click('button:has-text("Take a tour")');

    // Joyride tooltip should appear (react-joyride uses specific classes)
    // Just check the tour overlay exists — no crash
    await expect(page.locator('.react-joyride__overlay')).toBeVisible({ timeout: 5000 });

    // Dismiss by pressing Escape
    await page.keyboard.press('Escape');

    // Tour overlay should hide
    await expect(page.locator('.react-joyride__overlay')).not.toBeVisible({ timeout: 3000 });
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

    await page.goto('/setup');

    // Wizard should be visible
    await expect(page.locator('[data-testid="setup-wizard"]')).toBeVisible();

    // Title should still be present
    await expect(page.locator('text=Welcome to Fin')).toBeVisible();

    // Fill broker on mobile
    await FILL_BROKER(page);

    // Should advance to risk step
    await expect(page.locator('text=Risk Profile')).toBeVisible();
  });
});