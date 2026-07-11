# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-mobile.spec.ts >> 12 — Mobile Viewports >> Dashboard renders on iPhone 14
- Location: e2e/specs/12-mobile.spec.ts:10:5

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 410
Received:    440
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic "Agent fins":
        - button "investment agent — idle" [ref=e7] [cursor=pointer]:
          - img [ref=e8]
        - button "debt agent — idle" [ref=e10] [cursor=pointer]:
          - img [ref=e11]
        - button "retirement agent — idle" [ref=e13] [cursor=pointer]:
          - img [ref=e14]
    - banner [ref=e16]:
      - generic [ref=e17]:
        - button "Close sidebar" [expanded] [ref=e18] [cursor=pointer]
        - generic [ref=e22]: Fin
      - button "Synced" [ref=e24] [cursor=pointer]:
        - generic [ref=e26]: Synced
      - generic [ref=e28]:
        - generic [ref=e29]: m@fin.app
        - button "Log out" [ref=e30] [cursor=pointer]
    - navigation "Agent navigation" [ref=e31]:
      - navigation [ref=e32]:
        - generic [ref=e33]: Agents
        - button "▲ Investment idle" [ref=e34] [cursor=pointer]:
          - generic [ref=e35]: ▲
          - generic [ref=e36]: Investment
          - generic "idle" [ref=e37]
        - button "◆ Debt idle" [ref=e38] [cursor=pointer]:
          - generic [ref=e39]: ◆
          - generic [ref=e40]: Debt
          - generic "idle" [ref=e41]
        - button "● Retirement idle" [ref=e42] [cursor=pointer]:
          - generic [ref=e43]: ●
          - generic [ref=e44]: Retirement
          - generic "idle" [ref=e45]
      - generic [ref=e47]: Not synced
    - main [ref=e48]:
      - generic [ref=e49]:
        - heading "Fin Dashboard" [level=2] [ref=e50]
        - paragraph [ref=e51]: Select an agent from the sidebar to begin.
  - generic:
    - generic:
      - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('12 — Mobile Viewports', () => {
  4  |   const VIEWPORTS = [
  5  |     { width: 390, height: 844, name: 'iPhone 14' },
  6  |     { width: 412, height: 915, name: 'Pixel 7' },
  7  |   ];
  8  | 
  9  |   for (const vp of VIEWPORTS) {
  10 |     test(`Dashboard renders on ${vp.name}`, async ({ browser }) => {
  11 |       const context = await browser.newContext({
  12 |         viewport: { width: vp.width, height: vp.height },
  13 |       });
  14 | 
  15 |       const page = await context.newPage();
  16 | 
  17 |       await page.route('**/api/auth/me', r =>
  18 |         r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'm@fin.app', name: 'Mobile' }) }));
  19 |       await page.addInitScript(() => localStorage.setItem('access_token', 'mob-token'));
  20 | 
  21 |       await page.goto('/');
  22 |       await page.waitForTimeout(3000);
  23 | 
  24 |       // Page should be visible on mobile
  25 |       await expect(page.locator('body')).toBeVisible();
  26 |       // Content should not overflow horizontally
  27 |       const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  28 |       const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
> 29 |       expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 20);
     |                           ^ Error: expect(received).toBeLessThanOrEqual(expected)
  30 | 
  31 |       await context.close();
  32 |     });
  33 | 
  34 |     test(`Menu navigation works on ${vp.name}`, async ({ browser }) => {
  35 |       const context = await browser.newContext({
  36 |         viewport: { width: vp.width, height: vp.height },
  37 |       });
  38 | 
  39 |       const page = await context.newPage();
  40 | 
  41 |       await page.route('**/api/auth/me', r =>
  42 |         r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'm@fin.app', name: 'Mobile' }) }));
  43 |       await page.addInitScript(() => localStorage.setItem('access_token', 'mob-token'));
  44 | 
  45 |       await page.goto('/');
  46 |       await page.waitForTimeout(3000);
  47 | 
  48 |       // Check for hamburger menu or nav elements
  49 |       const hamburger = page.locator('button[aria-label="menu"], button[aria-label="toggle sidebar"], .hamburger, .menu-toggle');
  50 |       if (await hamburger.isVisible()) {
  51 |         await hamburger.click();
  52 |         await page.waitForTimeout(500);
  53 |       }
  54 | 
  55 |       // Navigate to debt page
  56 |       await page.route('**/api/debt/summary', r =>
  57 |         r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accounts: [], total_balance: 0, total_monthly_payment: 0, weighted_avg_rate: 0 }) }));
  58 |       await page.route('**/api/debt/strategy-comparison**', r =>
  59 |         r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ avalanche: {}, snowball: {} }) }));
  60 | 
  61 |       await page.goto('/debt');
  62 |       await page.waitForTimeout(2000);
  63 |       await expect(page.locator('body')).toBeVisible();
  64 | 
  65 |       await context.close();
  66 |     });
  67 |   }
  68 | });
```