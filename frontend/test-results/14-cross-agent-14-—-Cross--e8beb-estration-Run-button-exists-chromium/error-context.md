# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 14-cross-agent.spec.ts >> 14 — Cross-Agent Orchestration >> Run button exists
- Location: e2e/specs/14-cross-agent.spec.ts:23:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.ocean-page') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const MOCK_USER = { id: 'u1', email: 'test@fin.app', name: 'Test User' };
  4  | 
  5  | test.describe('14 — Cross-Agent Orchestration', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.route('**/api/auth/me', r =>
  8  |       r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
  9  |     await page.addInitScript(() => localStorage.setItem('access_token', 'mock-jwt-token'));
  10 | 
  11 |     await page.goto('/orchestration');
> 12 |     await page.waitForSelector('.ocean-page', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  13 |   });
  14 | 
  15 |   test('Page renders orchestration title', async ({ page }) => {
  16 |     await expect(page.locator('.ocean-heading')).toContainText('Multi-Agent');
  17 |   });
  18 | 
  19 |   test('Skill chips are visible', async ({ page }) => {
  20 |     await expect(page.locator('.agent-chip').first()).toBeVisible();
  21 |   });
  22 | 
  23 |   test('Run button exists', async ({ page }) => {
  24 |     const runBtn = page.locator('.ocean-btn-primary, button:has-text("Run")').first();
  25 |     await expect(runBtn).toBeVisible();
  26 |   });
  27 | 
  28 |   test('Can select a skill chip', async ({ page }) => {
  29 |     const debtChip = page.locator('.agent-chip:has-text("Debt")').first();
  30 |     if (await debtChip.isVisible()) {
  31 |       await debtChip.click();
  32 |       await page.waitForTimeout(300);
  33 |       // After clicking, the chip should have active class
  34 |       await expect(debtChip).toHaveClass(/active/);
  35 |     }
  36 |   });
  37 | 
  38 |   test('Subtitle text present', async ({ page }) => {
  39 |     await expect(page.locator('.ocean-subtitle')).toContainText(/multiple ai agents/i);
  40 |   });
  41 | });
```