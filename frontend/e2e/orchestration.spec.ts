
import { test, expect } from "@playwright/test";

const MOCK_USER = {
  id: "test-user-1",
  email: "test@fin.app",
  name: "Test User",
  created_at: new Date().toISOString(),
};

test.describe("Phase 13 — Multi-Agent Orchestration", () => {
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

    await page.route("**/api/orchestrate/run", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: {
            investment: { expected_return: 0.08, risk_score: 3 },
            debt: { highest_interest_rate: 0.18, total_balance: 15000 },
            retirement: { readiness_score: 62, monthly_income: 4200 },
          },
          cross_agent: {
            conflicts: [
              {
                category: "debt_vs_invest",
                resolution: "pay_debt",
                recommendation:
                  "High-interest debt (18%) exceeds expected market return (8%). Prioritize debt payoff.",
              },
            ],
          },
          summary: { total_agents: 3, succeeded: 3, failed: 0 },
        }),
      });
    });

    await page.goto("/orchestrate");
  });

  test("01 — page renders with heading, skill chips, agent chips, and run button", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toContainText("Multi-Agent Orchestration");

    // 4 skill chips + 3 agent chips = 7 total .agent-chip elements
    await expect(page.locator(".agent-selector .agent-chip")).toHaveCount(7);

    // Run button: "▶ Run All Agents"
    await expect(page.locator("button:has-text('Run All Agents')")).toBeVisible();
  });

  test("02 — run button disabled when no agents selected", async ({ page }) => {
    const runBtn = page.locator("button:has-text('Run All Agents')");

    // Default: Investment pre-selected → enabled
    await expect(runBtn).toBeEnabled();

    // Click Investment chip to deselect it (the only agent selected by default)
    const investmentChip = page
      .locator(".agent-selector")
      .last()
      .locator("button.agent-chip:has-text('Investment')");
    await investmentChip.click();

    // Now nothing selected → disabled
    await expect(runBtn).toBeDisabled();
  });

  test("03 — select Financial Health skill and run all agents", async ({ page }) => {
    // Click "Financial Health" skill chip (first .agent-selector = skills)
    await page
      .locator(".agent-selector")
      .first()
      .locator("button.agent-chip:has-text('Financial Health')")
      .click();

    // Select all 3 agents (second .agent-selector = agents)
    const agentSelector = page.locator(".agent-selector").last();
    for (const label of ["Investment", "Debt", "Retirement"]) {
      const chip = agentSelector.locator(`button.agent-chip:has-text('${label}')`);
      const isActive = await chip.evaluate((el) => el.classList.contains("active"));
      if (!isActive) await chip.click();
    }

    // Click ▶ Run All Agents
    await page.locator("button:has-text('Run All Agents')").click();

    // Stop button replaces Run button (streaming started)
    await expect(page.locator("button:has-text('Stop')")).toBeVisible();

    // Status bar appears with agent labels
    await expect(page.locator(".agent-status-bar")).toBeVisible();
  });

  test("04 — stop button appears and works", async ({ page }) => {
    // Select all agents
    const agentSelector = page.locator(".agent-selector").last();
    for (const label of ["Investment", "Debt", "Retirement"]) {
      const chip = agentSelector.locator(`button.agent-chip:has-text('${label}')`);
      const isActive = await chip.evaluate((el) => el.classList.contains("active"));
      if (!isActive) await chip.click();
    }

    // Start
    await page.locator("button:has-text('Run All Agents')").click();

    // Stop button visible (text: "■ Stop")
    const stopBtn = page.locator("button:has-text('Stop')");
    await expect(stopBtn).toBeVisible();

    // Click stop
    await stopBtn.click();

    // Run button re-appears
    await expect(page.locator("button:has-text('Run All Agents')")).toBeVisible();
  });

  test("05 — status bar shows agent statuses", async ({ page }) => {
    const agentSelector = page.locator(".agent-selector").last();
    for (const label of ["Investment", "Debt", "Retirement"]) {
      const chip = agentSelector.locator(`button.agent-chip:has-text('${label}')`);
      const isActive = await chip.evaluate((el) => el.classList.contains("active"));
      if (!isActive) await chip.click();
    }

    await page.locator("button:has-text('Run All Agents')").click();

    // 3 agent status labels with class agent-status-label
    await expect(page.locator(".agent-status-label")).toHaveCount(3);
  });
});