# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> Setup Wizard >> can click completed step dot to go back
- Location: e2e/wizard.spec.ts:104:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="apiKey"]')

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
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const FILL_BROKER = async (page: Page) => {
> 4   |   await page.fill('input[name="apiKey"]', 'test-api-key-12345');
      |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
  40  |     await expect(page.locator('text=Welcome to Fin')).toBeVisible();
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
```