# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 15-ocean-dashboard.spec.ts >> 15 — Ocean Dashboard Pass >> 15.6 — Back button closes Agent Context View
- Location: e2e/specs/15-ocean-dashboard.spec.ts:108:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-testid="ocean-canvas"]')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const MOCK_USER = { id: 'u1', email: 'test@fin.app', name: 'Ocean Test' };
  4   | 
  5   | test.describe('15 — Ocean Dashboard Pass', () => {
  6   |   test.beforeEach(async ({ page }) => {
  7   |     await page.route('**/api/auth/me', (r) =>
  8   |       r.fulfill({
  9   |         status: 200,
  10  |         contentType: 'application/json',
  11  |         body: JSON.stringify(MOCK_USER),
  12  |       }),
  13  |     );
  14  |     await page.addInitScript(() =>
  15  |       localStorage.setItem('access_token', 'ocean-token'),
  16  |     );
  17  |     await page.goto('/');
  18  |     // Canvas element is aria-hidden; 'visible' state flukes on <canvas>.
  19  |     // Wait for DOM attach first, then confirm Three.js resized the buffer.
> 20  |     await page.waitForSelector('[data-testid="ocean-canvas"]', {
      |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  21  |       state: 'attached',
  22  |       timeout: 15000,
  23  |     });
  24  |     await page.waitForFunction(
  25  |       () => {
  26  |         const c = document.querySelector(
  27  |           '[data-testid="ocean-canvas"]',
  28  |         ) as HTMLCanvasElement | null;
  29  |         return !!c && c.width > 0 && c.height > 0;
  30  |       },
  31  |       { timeout: 12000 },
  32  |     );
  33  |   });
  34  | 
  35  |   test('15.1 — Sidebar starts collapsed (icons only) on desktop', async ({ page }) => {
  36  |     const sidebar = page.locator('[data-testid="sidebar"]');
  37  |     await expect(sidebar).toBeVisible();
  38  |     await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  39  |     // Width should be the collapsed rail (64px)
  40  |     const width = await sidebar.evaluate((el) => el.clientWidth);
  41  |     expect(width).toBeLessThanOrEqual(72);
  42  |     // All 6 top + 5 bottom nav items attached
  43  |     for (const k of [
  44  |       'dashboard',
  45  |       'portfolio',
  46  |       'debt',
  47  |       'retirement',
  48  |       'questions',
  49  |       'research',
  50  |     ]) {
  51  |       await expect(page.locator(`[data-testid="nav-${k}"]`)).toBeAttached();
  52  |     }
  53  |     for (const k of ['settings', 'memory', 'chat', 'trade', 'analytics']) {
  54  |       await expect(page.locator(`[data-testid="nav-${k}"]`)).toBeAttached();
  55  |     }
  56  |     // In collapsed mode, labels fade (opacity 0)
  57  |     const labelOpacity = await page
  58  |       .locator('[data-testid="nav-portfolio"] .sidebar-item-label')
  59  |       .evaluate((el) => Number(getComputedStyle(el).opacity));
  60  |     expect(labelOpacity).toBeLessThan(0.1);
  61  |   });
  62  | 
  63  |   test('15.2 — Hamburger toggles sidebar width (no translateX)', async ({ page }) => {
  64  |     const sidebar = page.locator('[data-testid="sidebar"]');
  65  |     const collapsedWidth = await sidebar.evaluate((el) => el.clientWidth);
  66  | 
  67  |     await page.getByRole('button', { name: /open sidebar/i }).click();
  68  | 
  69  |     const expandedWidth = await sidebar.evaluate((el) => el.clientWidth);
  70  |     expect(expandedWidth).toBeGreaterThan(collapsedWidth + 50);
  71  |     await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  72  | 
  73  |     // Toggle again → back to collapsed
  74  |     await page.getByRole('button', { name: /close sidebar/i }).click();
  75  |     await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  76  |   });
  77  | 
  78  |   test('15.3 — Ocean canvas is visible behind everything (z-index 0)', async ({ page }) => {
  79  |     const scene = page.locator('[data-testid="ocean-scene"]');
  80  |     await expect(scene).toBeVisible();
  81  |     const z = await scene.evaluate((el) =>
  82  |       Number(getComputedStyle(el).zIndex),
  83  |     );
  84  |     expect(z).toBe(0);
  85  |   });
  86  | 
  87  |   test('15.4 — All three fins render', async ({ page }) => {
  88  |     for (const fin of ['investment', 'debt', 'retirement']) {
  89  |       await expect(page.locator(`[data-testid="fin-${fin}"]`)).toBeVisible();
  90  |     }
  91  |   });
  92  | 
  93  |   test('15.5 — Click fin opens Agent Context View (submarine cabin)', async ({ page }) => {
  94  |     await page.locator('[data-testid="fin-investment"]').click();
  95  | 
  96  |     const panel = page.locator('[data-testid="agent-panel-investment"]');
  97  |     await expect(panel).toBeVisible();
  98  |     await expect(page.locator('[data-testid="agent-sidebar"]')).toBeVisible();
  99  |     await expect(page.locator('[data-testid="agent-main-pane"]')).toBeVisible();
  100 |     await expect(
  101 |       page.locator('[data-testid="recommendation-skeleton"]'),
  102 |     ).toBeVisible();
  103 |     await expect(
  104 |       page.locator('[data-testid="agent-chat-input"]'),
  105 |     ).toBeAttached();
  106 |   });
  107 | 
  108 |   test('15.6 — Back button closes Agent Context View', async ({ page }) => {
  109 |     await page.locator('[data-testid="fin-debt"]').click();
  110 |     await expect(page.locator('[data-testid="agent-panel-debt"]')).toBeVisible();
  111 | 
  112 |     await page.locator('[data-testid="agent-back"]').click();
  113 |     await expect(
  114 |       page.locator('[data-testid="agent-panel-debt"]'),
  115 |     ).not.toBeVisible();
  116 |     await expect(
  117 |       page.locator('[data-testid="dashboard-placeholder"]'),
  118 |     ).toBeVisible();
  119 |   });
  120 | 
```