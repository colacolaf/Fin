import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e/specs',
  // Section 1.A: keep it fast in dev, parallel + 4 workers in CI.
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 60000,
  // Section 1: three reporters — terminal `list` for humans, html + json for CI artifacts.
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    // Section 3: retain trace + video + screenshot on failure so the trace-viewer
    // link buried in the HTML report is actionable.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    // vite-dev first compile on a cold start can hit ~150s when many routes
    // are pulled in by HMR. 180s leaves headroom without masking real hangs.
    timeout: 180_000,
  },
});
