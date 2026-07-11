# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-retirement.spec.ts >> 06 — Retirement Dashboard >> Projected savings displayed
- Location: e2e/specs/06-retirement.spec.ts:32:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/1,450,000|1\.45M|1450000/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/1,450,000|1\.45M|1450000/)

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const MOCK_USER = { id: 'u1', email: 'test@fin.app', name: 'Test User' };
  4  | 
  5  | test.describe('06 — Retirement Dashboard', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.route('**/api/auth/me', r =>
  8  |       r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
  9  |     await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
  10 | 
  11 |     await page.route('**/api/retirement/**', r =>
  12 |       r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
  13 |         current_age: 35,
  14 |         retirement_age: 65,
  15 |         monthly_contribution: 1200,
  16 |         current_savings: 85000,
  17 |         projected_annual_return: 0.07,
  18 |         projected_savings: 1450000,
  19 |         monthly_income_at_retirement: 4800,
  20 |         on_track: true,
  21 |         gap: 0,
  22 |       })}));
  23 | 
  24 |     await page.goto('/retirement');
  25 |     await page.waitForSelector('.retirement-dashboard', { timeout: 10000 });
  26 |   });
  27 | 
  28 |   test('Page renders retirement dashboard', async ({ page }) => {
  29 |     await expect(page.locator('.retirement-dashboard')).toBeVisible();
  30 |   });
  31 | 
  32 |   test('Projected savings displayed', async ({ page }) => {
> 33 |     await expect(page.getByText(/1,450,000|1\.45M|1450000/)).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  34 |   });
  35 | 
  36 |   test('On-track indicator present', async ({ page }) => {
  37 |     await expect(page.getByText(/on track/i)).toBeVisible();
  38 |   });
  39 | 
  40 |   test('Monthly contribution visible', async ({ page }) => {
  41 |     await expect(page.getByText(/1,200/)).toBeVisible();
  42 |   });
  43 | 
  44 |   test('Retirement age visible', async ({ page }) => {
  45 |     await expect(page.getByText('65')).toBeVisible();
  46 |   });
  47 | });
```