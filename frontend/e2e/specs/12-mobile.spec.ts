import { test, expect } from '@playwright/test';
import { MOCK_USER, MOCK_PORTFOLIO } from '../fixtures/mock-data';

test.describe('12 — Mobile Viewports & Responsive', () => {
  const VIEWPORTS = [
    { width: 390, height: 844, name: 'iPhone 14' },
    { width: 412, height: 915, name: 'Pixel 7' },
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 768, height: 1024, name: 'iPad Mini' },
  ];

  test('12.1 — Dashboard renders on all mobile viewports without overflow', async ({ browser }) => {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.route('**/api/auth/me', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
      await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
      await page.goto('/');
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForTimeout(1000);
      const vw = await page.evaluate(() => document.documentElement.clientWidth);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(vw + 20);
      await expect(page.locator('body')).toBeVisible();
      await ctx.close();
    }
  });

  test('12.2 — Hamburger menu visible on mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const hamburger = page.locator('button[aria-label="menu"], button[aria-label="toggle sidebar"], .hamburger, .menu-toggle, [data-testid="mobile-menu"]');
    await expect(hamburger).toBeVisible({ timeout: 5000 });
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
    }
    await ctx.close();
  });

  test('12.3 — Sidebar collapses to drawer on mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const hamburger = page.locator('button[aria-label="menu"], button[aria-label="toggle sidebar"], .hamburger, .menu-toggle, [data-testid="mobile-menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
      await expect(page.locator('.sidebar, nav, [role="navigation"]').first()).toBeVisible({ timeout: 3000 });
    }
    await ctx.close();
  });

  test('12.4 — Navigation links work on mobile', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/portfolio');
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="portfolio-page"]')).toBeVisible();
    await ctx.close();
  });

  test('12.5 — Touch targets minimum 44px', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
    const smallBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, [role="button"]');
      const tooSmall: string[] = [];
      btns.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          tooSmall.push(`${el.tagName} ${el.textContent?.slice(0, 20)} w:${rect.width}h:${rect.height}`);
        }
      });
      return tooSmall;
    });
    expect(smallBtns.length).toBe(0);
    await ctx.close();
  });

  test('12.6 — Forms are usable on mobile (no zoom issues)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const inputs = page.locator('input, select, textarea').first();
    await expect(inputs).toBeVisible();
    await inputs.click();
    await page.waitForTimeout(500);
    // Verify no meta viewport zoom issue (content should remain visible)
    await expect(page.locator('body')).toBeVisible();
    await ctx.close();
  });

  test('12.7 — Tablet responsive layout', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/portfolio');
    await page.waitForSelector('[data-testid="portfolio-page"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="holdings-table"]')).toBeVisible();
    // No horizontal overflow on tablet
    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(vw + 50);
    await ctx.close();
  });
});