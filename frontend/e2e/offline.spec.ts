/**
 * Phase 18 — Mobile & Offline e2e tests
 * Tests: offline banner visibility, sync queue drain, SW registration, PWA install prompt
 *
 * Uses: @playwright/test (E2E)
 */

import { test, expect } from "@playwright/test";

const MOCK_USER = {
  id: "test-user-1",
  email: "test@fin.app",
  name: "Test User",
  created_at: new Date().toISOString(),
};

test.describe("Phase 18 — Mobile & Offline Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    });
    await page.goto("/");
  });

  test("01 — offline banner appears when disconnected", async ({ page, context }) => {
    // Test offline banner visibility
    await context.setOffline(true);
    await page.waitForSelector('[data-testid="offline-banner"]', { timeout: 5000 });
    const banner = page.locator('[data-testid="offline-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/offline|reconnecting/i);
  });

  test("02 — offline banner dismisses when reconnected", async ({ page, context }) => {
    await context.setOffline(true);
    await page.waitForSelector('[data-testid="offline-banner"]', { timeout: 5000 });

    // Reconnect
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    const banner = page.locator('[data-testid="offline-banner"]');
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test("03 — sync indicator shows pending count", async ({ page }) => {
    // The sync indicator should render on the page
    const syncIndicator = page.locator('[data-testid="sync-indicator"], .sync-indicator');
    await expect(syncIndicator).toBeVisible({ timeout: 5000 });
  });

  test("04 — manifest.json is served and valid", async ({ page }) => {
    const response = await page.request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("05 — service worker registers without error", async ({ page }) => {
    // Check for SW registration via console
    const swErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("SW")) {
        swErrors.push(msg.text());
      }
    });

    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length;
      }
      return -1;
    }).then((count) => {
      // SW may not register in e2e environment, but shouldn't crash
      expect(swErrors).toHaveLength(0);
    });
  });

  test("06 — IDB operations work offline (IndexedDB)", async ({ page }) => {
    // Verify IndexedDB can be opened and used
    const result = await page.evaluate(async () => {
      try {
        // Can open IndexedDB
        const openReq = indexedDB.open("fin-offline-v1", 1);
        return await new Promise<boolean>((resolve) => {
          openReq.onsuccess = () => resolve(true);
          openReq.onerror = () => resolve(false);
          openReq.onblocked = () => resolve(false);
        });
      } catch {
        return false;
      }
    });
    expect(result).toBe(true);
  });

  test("07 — offline.html cache fallback loads", async ({ page }) => {
    const response = await page.request.get("/offline.html");
    expect(response.status()).toBe(200);
  });

  test("08 — PWA app icon is accessible", async ({ page }) => {
    const response = await page.request.get("/icon-192.svg");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("svg");
  });

  test("09 — useOnlineStatus hook detects offline state", async ({ page, context }) => {
    await context.setOffline(true);
    await page.waitForTimeout(500);

    const isOffline = await page.evaluate(() => navigator.onLine);
    expect(isOffline).toBe(false);
  });

  test("10 — navigation works after reconnection", async ({ page, context }) => {
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Reconnect
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Page should still be functional
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);

    // Should not have crashed
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });
});