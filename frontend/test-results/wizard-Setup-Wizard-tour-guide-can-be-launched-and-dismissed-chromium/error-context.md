# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> Setup Wizard >> tour guide can be launched and dismissed
- Location: e2e/wizard.spec.ts:132:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Take a tour")')

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
> 136 |     await page.click('button:has-text("Take a tour")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  137 | 
  138 |     // Joyride tooltip should appear (react-joyride uses specific classes)
  139 |     // Just check the tour overlay exists — no crash
  140 |     await expect(page.locator('.react-joyride__overlay')).toBeVisible({ timeout: 5000 });
  141 | 
  142 |     // Dismiss by pressing Escape
  143 |     await page.keyboard.press('Escape');
  144 | 
  145 |     // Tour overlay should hide
  146 |     await expect(page.locator('.react-joyride__overlay')).not.toBeVisible({ timeout: 3000 });
  147 |   });
  148 | 
  149 |   test('broker connection test button calls real API', async ({ page }) => {
  150 |     await page.goto('/setup');
  151 | 
  152 |     // Fill broker credentials
  153 |     await page.fill('#apiKey', 'PK_TEST_API_KEY');
  154 |     await page.fill('#apiSecret', 'test-secret-at-least-16-chars');
  155 | 
  156 |     // Click "Test Connection" secondary button
  157 |     const testBtn = page.locator('button:has-text("Test Connection")');
  158 |     await expect(testBtn).toBeEnabled();
  159 |     await testBtn.click();
  160 | 
  161 |     // Should show spinner (testing state) then error or success
  162 |     // Since these are fake keys, expect the error state
  163 |     await expect(page.locator('text=✗ Connection Failed')).toBeVisible({ timeout: 10000 });
  164 | 
  165 |     // Reset back to idle after timeout
  166 |     await expect(testBtn).toHaveText('Test Connection', { timeout: 10000 });
  167 |   });
  168 | 
  169 |   test('mobile viewport renders correctly', async ({ page }) => {
  170 |     await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
  171 | 
  172 |     await page.goto('/setup');
  173 | 
  174 |     // Wizard should be visible
  175 |     await expect(page.locator('[data-testid="setup-wizard"]')).toBeVisible();
  176 | 
  177 |     // Title should still be present
  178 |     await expect(page.locator('text=Welcome to Fin')).toBeVisible();
  179 | 
  180 |     // Fill broker on mobile
  181 |     await FILL_BROKER(page);
  182 | 
  183 |     // Should advance to risk step
  184 |     await expect(page.locator('text=Risk Profile')).toBeVisible();
  185 |   });
  186 | });
```