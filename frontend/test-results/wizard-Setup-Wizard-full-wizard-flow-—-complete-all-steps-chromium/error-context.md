# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> Setup Wizard >> full wizard flow — complete all steps
- Location: e2e/wizard.spec.ts:36:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Welcome to Fin')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Welcome to Fin')

```

```yaml
- heading "Sign In" [level=1]
- text: Email
- textbox "Email"
- text: Password
- textbox "Password"
- button "Sign In"
- paragraph:
  - text: No account?
  - link "Register":
    - /url: /register
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const FILL_BROKER = async (page: Page) => {
  4   |   await page.fill('input[name="apiKey"]', 'test-api-key-12345');
  5   |   await page.fill('input[name="apiSecret"]', 'test-api-secret-67890');
  6   |   // paper trading toggle already defaults to checked
  7   |   await page.click('button:has-text("Continue")');
  8   | };
  9   | 
  10  | const FILL_RISK = async (page: Page) => {
  11  |   // Click Continue on default risk profile settings
  12  |   await page.click('button:has-text("Continue")');
  13  | };
  14  | 
  15  | const FILL_GOALS = async (page: Page) => {
  16  |   // Just click Continue (no goals selected is valid for quick test)
  17  |   await page.click('button:has-text("Continue")');
  18  | };
  19  | 
  20  | const FILL_BUDGET = async (page: Page) => {
  21  |   await page.fill('input[name="monthlyIncome"]', '8000');
  22  |   await page.fill('input[name="monthlyExpenses"]', '4000');
  23  |   await page.click('button:has-text("Continue")');
  24  | };
  25  | 
  26  | test.describe('Setup Wizard', () => {
  27  |   test.beforeEach(async ({ page }) => {
  28  |     // Mock localStorage to simulate logged-in state
  29  |     await page.goto('/');
  30  |     await page.evaluate(() => {
  31  |       localStorage.setItem('fin_access_token', 'test-token');
  32  |       localStorage.setItem('fin_refresh_token', 'test-refresh');
  33  |     });
  34  |   });
  35  | 
  36  |   test('full wizard flow — complete all steps', async ({ page }) => {
  37  |     await page.goto('/setup');
  38  | 
  39  |     // Should see the wizard title
> 40  |     await expect(page.locator('text=Welcome to Fin')).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  41  | 
  42  |     // Step 0: Broker Connect
  43  |     await expect(page.locator('text=Connect Broker')).toBeVisible();
  44  |     await FILL_BROKER(page);
  45  | 
  46  |     // Step 1: Risk Tolerance
  47  |     await expect(page.locator('text=Risk Profile')).toBeVisible();
  48  |     await page.locator('input[name="riskScore"]').fill('5');
  49  |     await FILL_RISK(page);
  50  | 
  51  |     // Step 2: Goals
  52  |     await expect(page.locator('text=Your Goals')).toBeVisible();
  53  |     // Click Retirement goal card to select it
  54  |     const retirementCard = page.locator('text=Retirement').first();
  55  |     await retirementCard.click();
  56  |     await FILL_GOALS(page);
  57  | 
  58  |     // Step 3: Budget
  59  |     await expect(page.locator('text=Budget')).toBeVisible();
  60  |     await FILL_BUDGET(page);
  61  | 
  62  |     // Step 4: Review
  63  |     await expect(page.locator('text=Review & Save')).toBeVisible();
  64  |     // Verify review shows selected items
  65  |     await expect(page.locator('text=test-api-key-12345')).toBeVisible();
  66  | 
  67  |     // Click complete
  68  |     await page.click('button:has-text("Complete Setup")');
  69  |   });
  70  | 
  71  |   test('progress bar shows correct state', async ({ page }) => {
  72  |     await page.goto('/setup');
  73  | 
  74  |     // First dot should be active (enlarged)
  75  |     const firstDot = page.locator('[data-step="0"]');
  76  |     await expect(firstDot).toHaveClass(/wizard-progress__dot--active/);
  77  | 
  78  |     // Move to step 2
  79  |     await FILL_BROKER(page);
  80  |     await FILL_RISK(page);
  81  | 
  82  |     // First two dots should be completed, third active
  83  |     const dot0 = page.locator('[data-step="0"]');
  84  |     const dot1 = page.locator('[data-step="1"]');
  85  |     const dot2 = page.locator('[data-step="2"]');
  86  |     await expect(dot0).toHaveClass(/wizard-progress__dot--completed/);
  87  |     await expect(dot1).toHaveClass(/wizard-progress__dot--completed/);
  88  |     await expect(dot2).toHaveClass(/wizard-progress__dot--active/);
  89  |   });
  90  | 
  91  |   test('can navigate back with prev button', async ({ page }) => {
  92  |     await page.goto('/setup');
  93  | 
  94  |     // Go to step 1
  95  |     await FILL_BROKER(page);
  96  | 
  97  |     // Hit Back
  98  |     await page.click('button:has-text("Back")');
  99  | 
  100 |     // Should be back on step 0
  101 |     await expect(page.locator('text=Connect Broker')).toBeVisible();
  102 |   });
  103 | 
  104 |   test('can click completed step dot to go back', async ({ page }) => {
  105 |     await page.goto('/setup');
  106 | 
  107 |     // Progress to step 3
  108 |     await FILL_BROKER(page);
  109 |     await FILL_RISK(page);
  110 |     await FILL_GOALS(page);
  111 | 
  112 |     // Click step 1 dot (Risk Profile) to jump back
  113 |     const dot1 = page.locator('[data-step="1"]');
  114 |     await dot1.click();
  115 | 
  116 |     // Should be on Risk Profile step
  117 |     await expect(page.locator('text=Risk Profile')).toBeVisible();
  118 |   });
  119 | 
  120 |   test('animated transitions occur between steps', async ({ page }) => {
  121 |     await page.goto('/setup');
  122 | 
  123 |     // Confirm step 0 content visible
  124 |     await expect(page.locator('text=Connect Broker')).toBeVisible();
  125 | 
  126 |     await FILL_BROKER(page);
  127 | 
  128 |     // Step 1 content should now be visible
  129 |     await expect(page.locator('text=Risk Profile')).toBeVisible();
  130 |   });
  131 | 
  132 |   test('tour guide can be launched and dismissed', async ({ page }) => {
  133 |     await page.goto('/setup');
  134 | 
  135 |     // Click "Take a tour" button
  136 |     await page.click('button:has-text("Take a tour")');
  137 | 
  138 |     // Joyride tooltip should appear (react-joyride uses specific classes)
  139 |     // Just check the tour overlay exists — no crash
  140 |     await expect(page.locator('.react-joyride__overlay')).toBeVisible({ timeout: 5000 });
```