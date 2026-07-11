# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retirement.spec.ts >> Retirement Dashboard >> renders projection chart after load
- Location: e2e/retirement.spec.ts:45:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('.projection-chart, .loading-skeleton') to be visible

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Sign In" [level=1] [ref=e5]
  - generic [ref=e6]:
    - text: Email
    - textbox "Email" [ref=e7]
  - generic [ref=e8]:
    - text: Password
    - textbox "Password" [ref=e9]
  - button "Sign In" [ref=e10] [cursor=pointer]
  - paragraph [ref=e11]:
    - text: No account?
    - link "Register" [ref=e12] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Retirement Dashboard', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to retirement page — relies on mock API or real backend
  6   |     await page.goto('/retirement');
  7   |   });
  8   | 
  9   |   test('renders retirement page with profile inputs', async ({ page }) => {
  10  |     await expect(page.locator('h1')).toContainText('Retirement Analysis');
  11  | 
  12  |     // Profile input fields exist
  13  |     await expect(page.locator('.retirement-inputs')).toBeVisible();
  14  |     await expect(page.locator('.input-grid input').first()).toBeVisible();
  15  |   });
  16  | 
  17  |   test('renders score gauge after load', async ({ page }) => {
  18  |     // Wait for either score or error/loading to resolve
  19  |     await page.waitForSelector('.retirement-score, .loading-skeleton, .alert', { timeout: 15000 });
  20  | 
  21  |     const scoreSection = page.locator('.retirement-score');
  22  |     const loading = page.locator('.loading-skeleton');
  23  | 
  24  |     if (await scoreSection.isVisible()) {
  25  |       // Score gauge SVG present
  26  |       await expect(page.locator('.gauge-svg')).toBeVisible();
  27  |       await expect(page.locator('.score-label')).toBeVisible();
  28  |       await expect(page.locator('.score-funded')).toBeVisible();
  29  | 
  30  |       // Breakdown bars present
  31  |       const breakdownItems = page.locator('.breakdown-item');
  32  |       await expect(breakdownItems).toHaveCount(4);
  33  | 
  34  |       // Score value between 0-100 rendered
  35  |       const scoreText = await page.locator('.gauge-score').textContent();
  36  |       const score = parseInt(scoreText || '0', 10);
  37  |       expect(score).toBeGreaterThanOrEqual(0);
  38  |       expect(score).toBeLessThanOrEqual(100);
  39  |     } else if (await loading.isVisible()) {
  40  |       // If backend not available, loading state is acceptable
  41  |       await expect(loading).toBeVisible();
  42  |     }
  43  |   });
  44  | 
  45  |   test('renders projection chart after load', async ({ page }) => {
> 46  |     await page.waitForSelector('.projection-chart, .loading-skeleton', { timeout: 15000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  47  | 
  48  |     const chart = page.locator('.projection-chart');
  49  |     if (await chart.isVisible()) {
  50  |       await expect(page.locator('.chart-bars')).toBeVisible();
  51  |       await expect(page.locator('.chart-legend')).toBeVisible();
  52  |     }
  53  |   });
  54  | 
  55  |   test('renders grid sections', async ({ page }) => {
  56  |     await page.waitForSelector('.retirement-grid', { timeout: 15000 });
  57  | 
  58  |     const grids = page.locator('.retirement-grid');
  59  |     // At least one grid renders
  60  |     const count = await grids.count();
  61  |     expect(count).toBeGreaterThanOrEqual(1);
  62  | 
  63  |     // Account breakdown + contribution optimizer visible
  64  |     await expect(page.locator('.account-breakdown')).toBeVisible();
  65  |     await expect(page.locator('.contribution-optimizer')).toBeVisible();
  66  |   });
  67  | 
  68  |   test('renders tax strategy section', async ({ page }) => {
  69  |     await page.waitForSelector('.tax-strategy', { timeout: 15000 });
  70  | 
  71  |     const taxSection = page.locator('.tax-strategy');
  72  |     await expect(taxSection).toBeVisible();
  73  |     await expect(page.locator('.bracket-value').first()).toBeVisible();
  74  |     await expect(page.locator('.allocation-bar')).toBeVisible();
  75  |     await expect(page.locator('.tax-recommendation')).toBeVisible();
  76  |   });
  77  | 
  78  |   test('refresh button triggers reload', async ({ page }) => {
  79  |     const refreshBtn = page.locator('.retirement-header button');
  80  |     await expect(refreshBtn).toBeVisible();
  81  |     await refreshBtn.click();
  82  | 
  83  |     // Should show loading or re-render
  84  |     await page.waitForTimeout(3000);
  85  |     // Page should not crash
  86  |     await expect(page.locator('.retirement-dashboard')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('input fields are editable', async ({ page }) => {
  90  |     const firstInput = page.locator('.input-grid input').first();
  91  |     await firstInput.fill('35');
  92  |     await expect(firstInput).toHaveValue('35');
  93  |   });
  94  | 
  95  |   test('shortfall displayed when funded < 100%', async ({ page }) => {
  96  |     // Set low savings to trigger shortfall
  97  |     const savingsInput = page.locator('.input-grid input').nth(2);
  98  |     await savingsInput.fill('10000');
  99  | 
  100 |     const refreshBtn = page.locator('.retirement-header button');
  101 |     await refreshBtn.click();
  102 | 
  103 |     await page.waitForSelector('.score-shortfall, .loading-skeleton', { timeout: 15000 });
  104 |     const shortfall = page.locator('.score-shortfall');
  105 |     if (await shortfall.isVisible()) {
  106 |       await expect(shortfall).toContainText('/mo shortfall');
  107 |     }
  108 |   });
  109 | });
```