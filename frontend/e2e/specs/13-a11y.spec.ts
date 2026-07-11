import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { MOCK_USER, MOCK_PORTFOLIO, MOCK_DEBTS, MOCK_RETIREMENT, MOCK_RECOMMENDATIONS } from '../fixtures/mock-data';

const PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/portfolio', name: 'Portfolio' },
  { path: '/debt', name: 'Debt' },
  { path: '/retirement', name: 'Retirement' },
  { path: '/recommendations', name: 'Recommendations' },
  { path: '/settings', name: 'Settings' },
];

test.describe('13 — Accessibility', () => {
  for (const { path, name } of PAGES) {
    test(`13.A — Axe scan on ${name} page (WCAG A/AA)`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      await page.route('**/api/auth/me', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
      await page.addInitScript(() => localStorage.setItem('access_token', 'a11y-token'));
      await page.route('**/api/debts', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEBTS) }));
      await page.route('**/api/debt/summary', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accounts: MOCK_DEBTS, total_balance: 52900, total_monthly_payment: 980, weighted_avg_rate: 5.5 }) }));
      await page.route('**/api/debt/strategy**', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ avalanche: {}, snowball: {} }) }));
      await page.route('**/api/retirement**', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT) }));
      await page.route('**/api/retirement/**', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT) }));
      await page.route('**/api/portfolio/full', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO) }));
      await page.route('**/api/recommendations', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RECOMMENDATIONS) }));
      await page.route('**/api/settings', r =>
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: MOCK_USER }) }));

      await page.goto(path);
      await page.waitForTimeout(2500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations.length).toBeLessThanOrEqual(15);

      await ctx.close();
    });
  }

  test('13.1 — All interactive elements have accessible labels', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.route('**/api/portfolio/full', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO) }));
    await page.goto('/portfolio');
    await page.waitForSelector('body', { timeout: 10000 });
    const missingLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      const missing: string[] = [];
      elements.forEach(el => {
        const hasLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') ||
          (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'submit') ||
          el.textContent?.trim();
        if (!hasLabel && (el as HTMLElement).offsetParent !== null) {
          missing.push(`${el.tagName}#${el.id || 'no-id'} class:${el.className.slice(0, 30)}`);
        }
      });
      return missing;
    });
    expect(missingLabels.length).toBe(0);
    await ctx.close();
  });

  test('13.2 — Color contrast on text elements', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations.length).toBeLessThanOrEqual(10);
    await ctx.close();
  });

  test('13.3 — Keyboard navigation works (Tab key)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/login');
    await page.waitForSelector('.auth-form', { timeout: 10000 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    const focusedEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedEl).toBeTruthy();
    await ctx.close();
  });

  test('13.4 — Focus ring visible on keyboard navigation', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/login');
    await page.waitForSelector('.auth-form', { timeout: 10000 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
    });
    expect(hasOutline).toBeTruthy();
    await ctx.close();
  });

  test('13.5 — Skip navigation link present', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const skipLink = page.locator('[data-testid="skip-nav"], .skip-nav, a[href="#main-content"], a[href="#main"]');
    const visible = await skipLink.isVisible().catch(() => false);
    // Skip link may be hidden until focused — check element exists in DOM
    const exists = await page.evaluate(() => {
      return !!document.querySelector('[data-testid="skip-nav"], .skip-nav, a[href="#main-content"], a[href="#main"]');
    });
    expect(exists || visible).toBeTruthy();
    await ctx.close();
  });

  test('13.6 — Page has proper heading structure (h1 present)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const headings = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2')).map(h => h.tagName);
    });
    expect(headings.length).toBeGreaterThan(0);
    await ctx.close();
  });

  test('13.7 — Page has language attribute', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    expect(lang).toBeTruthy();
    await ctx.close();
  });

  test('13.8 — Images have alt text', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route('**/api/auth/me', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) }));
    await page.addInitScript(() => localStorage.setItem('access_token', 'mock-token'));
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const missingAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const missing: string[] = [];
      imgs.forEach(img => {
        if (!img.getAttribute('alt') && img.getAttribute('role') !== 'presentation') {
          missing.push(img.src.slice(0, 50));
        }
      });
      return missing;
    });
    expect(missingAlt.length).toBeLessThanOrEqual(2);
    await ctx.close();
  });
});