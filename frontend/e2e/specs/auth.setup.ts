import { test as setup } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

const MOCK_USER = {
  id: 'test-user-1',
  email: 'test@fin.app',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

setup('authenticate', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**/api/auth/refresh', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'mock-refreshed-token', token_type: 'bearer' }),
    });
  });

  await page.route('**/api/auth/logout', (route) => {
    route.fulfill({ status: 204 });
  });

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock-jwt-token');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="ocean-canvas"]', { timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });
});

export { AUTH_FILE };