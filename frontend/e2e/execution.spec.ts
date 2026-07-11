import { test, expect } from "@playwright/test";

const MOCK_USER = {
  id: "test-user-1",
  email: "test@fin.app",
  name: "Test User",
  created_at: new Date().toISOString(),
};

const MOCK_PENDING = [
  {
    action_id: "act-001",
    recommendation_id: "rec-invest-001",
    status: "accepted",
    accepted_at: new Date().toISOString(),
    next_check_in: null,
    check_in_count: 2,
  },
  {
    action_id: "act-002",
    recommendation_id: "rec-debt-001",
    status: "accepted",
    accepted_at: new Date().toISOString(),
    next_check_in: null,
    check_in_count: 0,
  },
];

const MOCK_STATS = {
  score: 72,
  streak: 5,
  acceptance_rate: 0.68,
  execution_rate: 0.75,
  total_accepted: 12,
  total_executed: 9,
  total_rejected: 3,
  decision_speed_avg_hours: 4.2,
  check_in_response_rate: 0.80,
};

test.describe("Phase 14 — Execution Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem("access_token", "mock-jwt-token");
    });

    await page.route("**/api/execution/pending", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PENDING),
      });
    });

    await page.route("**/api/execution/stats", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STATS),
      });
    });

    await page.route("**/api/execution/execute", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ action_id: "act-001", status: "executed" }),
      });
    });

    await page.route("**/api/execution/abandon", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ action_id: "act-001", status: "abandoned" }),
      });
    });

    await page.goto("/execution");
  });

  test("01 — page renders heading and score ring", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Execution");
    await expect(page.locator('[role="meter"]')).toBeVisible();
    await expect(page.locator('[role="meter"]')).toHaveAttribute("aria-valuenow", "72");
  });

  test("02 — stats grid shows follow-through metrics", async ({ page }) => {
    await expect(page.locator("text=Streak")).toBeVisible();
    await expect(page.locator("text=5 days")).toBeVisible();
    await expect(page.locator("text=Accept Rate")).toBeVisible();
    await expect(page.locator("text=68%")).toBeVisible();
    await expect(page.locator("text=Exec Rate")).toBeVisible();
    await expect(page.locator("text=75%")).toBeVisible();
  });

  test("03 — pending actions list with check-in count", async ({ page }) => {
    // Default filter is "pending"
    await expect(page.locator("text=rec-invest-001")).toBeVisible();
    await expect(page.locator("text=rec-debt-001")).toBeVisible();
    // check-in count for first action
    await expect(page.locator("text=2 check-ins")).toBeVisible();
  });

  test("04 — filter tabs switch correctly", async ({ page }) => {
    // Click "Completed" tab
    await page.locator("button:has-text('Completed')").click();
    await expect(page.locator("text=No completed actions")).toBeVisible();

    // Click "Rejected" tab
    await page.locator("button:has-text('Rejected')").click();
    await expect(page.locator("text=No rejected actions")).toBeVisible();

    // Back to Pending
    await page.locator("button:has-text('Pending')").click();
    await expect(page.locator("text=rec-invest-001")).toBeVisible();
  });

  test("05 — Done button executes action", async ({ page }) => {
    // Click Done on first action
    const doneBtn = page.locator("button:has-text('Done')").first();
    await doneBtn.click();

    // Action removed from list
    await expect(page.locator("text=rec-invest-001")).not.toBeVisible();
    // Second action still there
    await expect(page.locator("text=rec-debt-001")).toBeVisible();

    // Stats refreshed (mocked, still 72)
    await expect(page.locator('[role="meter"]')).toHaveAttribute("aria-valuenow", "72");
  });

  test("06 — Skip button abandons action", async ({ page }) => {
    const skipBtn = page.locator("button:has-text('Skip')").first();
    await skipBtn.click();

    // Action removed
    await expect(page.locator("text=rec-invest-001")).not.toBeVisible();
  });

  test("07 — empty state after all actions done", async ({ page }) => {
    // Click Done on each action. Use nth() to avoid stale element issues.
    const firstDone = page.locator("button:has-text('Done')").first();
    await firstDone.click();
    // Wait for first action to be removed
    await expect(page.locator("text=rec-invest-001")).not.toBeVisible();

    const secondDone = page.locator("button:has-text('Done')").first();
    await secondDone.click();
    // Wait for second action to be removed
    await expect(page.locator("text=rec-debt-001")).not.toBeVisible();

    // Empty state shown
    await expect(page.locator("text=No pending actions")).toBeVisible();
  });

  test("08 — error state with retry button", async ({ page }) => {
    // Break the stats endpoint to trigger error
    await page.unroute("**/api/execution/pending");
    await page.route("**/api/execution/pending", (route) => {
      route.fulfill({ status: 500, contentType: "application/json", body: '{"detail":"Internal error"}' });
    });

    await page.reload();

    await expect(page.locator("text=Internal error")).toBeVisible();
    await expect(page.locator("button:has-text('Retry')")).toBeVisible();
  });

  test("09 — score ring uses oklch colors", async ({ page }) => {
    const ring = page.locator('[role="meter"]');
    await expect(ring).toBeVisible();

    // Score 72 = green (>75 would be green, 72 is amber)
    // Verify the SVG circle stroke uses the expected color
    const foregroundCircle = ring.locator("circle").last();
    const stroke = await foregroundCircle.getAttribute("stroke");
    expect(stroke).toBe("oklch(0.72 0.15 85)"); // amber for 50-74
  });
});