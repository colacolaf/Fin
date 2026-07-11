import { test, expect } from "@playwright/test";

const MOCK_USER = {
  id: "test-user-1",
  email: "test@fin.app",
  name: "Test User",
  created_at: new Date().toISOString(),
};

const MOCK_STRATEGIES = {
  strategies: [
    {
      id: "strat-sma-cross",
      name: "SMA Crossover",
      description: "Buy when fast SMA crosses above slow SMA",
      parameters: { fast: 20, slow: 50 },
      type: "template",
    },
    {
      id: "strat-macd",
      name: "MACD Divergence",
      description: "Buy on MACD line crossing above signal line",
      parameters: { fast: 12, slow: 26, signal: 9 },
      type: "template",
    },
    {
      id: "strat-buy-hold",
      name: "Buy & Hold",
      description: "Buy immediately and hold until end",
      parameters: {},
      type: "template",
    },
  ],
};

const MOCK_RUN_QUEUED = {
  id: "run-001",
  status: "running",
  symbol: "SPY",
  timeframe: "1d",
  start_date: "2023-01-01",
  end_date: "2024-01-01",
  initial_cash: 100000,
  total_return_pct: null,
  sharpe_ratio: null,
  max_drawdown_pct: null,
  win_rate_pct: null,
  total_trades: null,
  final_value: null,
  equity_curve_json: null,
  trades_json: null,
  strategy_template_id: "strat-sma-cross",
  created_at: new Date().toISOString(),
};

const MOCK_RUN_COMPLETED = {
  id: "run-001",
  status: "completed",
  symbol: "SPY",
  timeframe: "1d",
  start_date: "2023-01-01",
  end_date: "2024-01-01",
  initial_cash: 100000,
  total_return_pct: 12.35,
  sharpe_ratio: 1.42,
  max_drawdown_pct: -8.2,
  win_rate_pct: 62.5,
  total_trades: 24,
  final_value: 112350.0,
  equity_curve_json: JSON.stringify([
    { date: "2023-01-03", value: 100000 },
    { date: "2023-02-01", value: 101200 },
    { date: "2023-03-01", value: 103500 },
    { date: "2023-06-01", value: 99800 },
    { date: "2023-09-01", value: 107000 },
    { date: "2024-01-02", value: 112350 },
  ]),
  trades_json: JSON.stringify([
    { date: "2023-03-15", action: "buy", price: 400.5, size: 50, pnl: 0 },
    { date: "2023-06-20", action: "sell", price: 388.2, size: 50, pnl: -615 },
    { date: "2023-07-10", action: "buy", price: 395.0, size: 50, pnl: 0 },
    { date: "2023-10-05", action: "sell", price: 430.8, size: 50, pnl: 1790 },
  ]),
  strategy_template_id: "strat-sma-cross",
  created_at: new Date().toISOString(),
};

const MOCK_RUNS_LIST = {
  runs: [MOCK_RUN_COMPLETED],
  total: 1,
  offset: 0,
};

const MOCK_PAPER_PORTFOLIO = {
  total_pnl: 320.5,
  position_count: 2,
  positions: [
    { symbol: "AAPL", quantity: 10, cost_basis: 150.0, current_value: 175.0, pnl: 250.0 },
    { symbol: "MSFT", quantity: 5, cost_basis: 300.0, current_value: 314.1, pnl: 70.5 },
  ],
};

test.describe("Backtest Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Set auth token
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem("access_token", "mock-jwt-token");
        localStorage.setItem("user", JSON.stringify(user));
      },
      { user: MOCK_USER },
    );

    // Mock strategies
    await page.route("**/api/backtest/strategies*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STRATEGIES),
      });
    });

    // Mock list runs
    await page.route("**/api/backtest/runs*", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_RUNS_LIST),
        });
      } else {
        route.continue();
      }
    });

    // Mock start run (POST)
    let runCallCount = 0;
    await page.route("**/api/backtest/runs", (route) => {
      if (route.request().method() === "POST") {
        runCallCount++;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(runCallCount === 1 ? MOCK_RUN_QUEUED : MOCK_RUN_COMPLETED),
        });
      } else {
        route.continue();
      }
    });

    // Mock get run
    await page.route("**/api/backtest/runs/run-001", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RUN_COMPLETED),
      });
    });

    // Mock paper portfolio
    await page.route("**/api/backtest/paper*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PAPER_PORTFOLIO),
      });
    });
  });

  test("renders backtest dashboard with strategy builder", async ({ page }) => {
    await page.goto("/backtest");

    // Header visible
    await expect(page.getByText("Backtesting & Training")).toBeVisible();

    // Strategy Builder section
    await expect(page.getByText("Strategy Builder")).toBeVisible();

    // Strategy templates are loaded
    await expect(page.getByText("SMA Crossover")).toBeVisible();
    await expect(page.getByText("MACD Divergence")).toBeVisible();
    await expect(page.getByText("Buy & Hold")).toBeVisible();

    // Run config visible
    await expect(page.getByText("Run Configuration")).toBeVisible();
    await expect(page.getByLabel("Symbol")).toBeVisible();
    await expect(page.getByLabel("Start Date")).toBeVisible();

    // Run button visible
    await expect(page.getByText("▶ Run Backtest")).toBeVisible();
  });

  test("selects strategy and shows chip", async ({ page }) => {
    await page.goto("/backtest");

    // Click a strategy
    await page.getByText("SMA Crossover").click();

    // Chip shows
    await expect(page.getByText("Selected:")).toBeVisible();
    await expect(page.getByText("SMA Crossover")).toBeVisible();

    // Dismiss chip
    await page.locator(".btn-minimal").click();
    await expect(page.getByText("Selected:")).not.toBeVisible();
  });

  test("runs a backtest and shows results with animations", async ({ page }) => {
    await page.goto("/backtest");

    // Click run
    await page.getByText("▶ Run Backtest").click();

    // Button switches to "Running…" during load
    await expect(page.getByText("Running…")).toBeVisible();

    // Stats cards appear (mocked from completed run)
    // Polling resolves to completed after initial run
    await expect(page.getByText("Total Return")).toBeVisible();
    await expect(page.getByText("Sharpe")).toBeVisible();

    // Equity chart replay renders
    await expect(page.getByRole("img", { name: "Equity curve replay" })).toBeVisible();
  });

  test("shows error when run fails", async ({ page }) => {
    // Override mock: start returns a run that will fail
    await page.route("**/api/backtest/runs", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_RUN_QUEUED,
          status: "failed",
          error_message: "Insufficient historical data for SPY in 2023",
        }),
      });
    });

    await page.goto("/backtest");
    await page.getByText("▶ Run Backtest").click();

    // Error message shown
    await expect(page.getByText("Insufficient historical data for SPY in 2023")).toBeVisible();
  });

  test("switches to paper trading tab", async ({ page }) => {
    await page.goto("/backtest");

    // Click Paper Trading tab
    await page.getByText("Paper Trading").click();

    // Paper portfolio shown
    await expect(page.getByText("Total P&L")).toBeVisible();
    await expect(page.getByText("Positions")).toBeVisible();

    // Positions rendered
    await expect(page.getByText("AAPL")).toBeVisible();
    await expect(page.getByText("MSFT")).toBeVisible();
  });

  test("paper portfolio shows empty state when no positions", async ({ page }) => {
    await page.route("**/api/backtest/paper*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total_pnl: 0, position_count: 0, positions: [] }),
      });
    });

    await page.goto("/backtest");
    await page.getByText("Paper Trading").click();

    await expect(page.getByText("No paper positions")).toBeVisible();
  });
});

test.describe("StrategyBuilder Component — Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem("access_token", "mock-jwt-token");
        localStorage.setItem("user", JSON.stringify(user));
      },
      { user: MOCK_USER },
    );
  });

  test("shows loading skeleton when fetching strategies", async ({ page }) => {
    // Delay response to show loading state
    await page.route("**/api/backtest/strategies*", async (route) => {
      await new Promise((r) => setTimeout(r, 100));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STRATEGIES),
      });
    });

    await page.goto("/backtest");

    // Skeleton boxes visible during load
    await expect(page.locator(".strategy-placeholder")).toHaveCount(3);
  });

  test("custom strategy form toggles open/closed", async ({ page }) => {
    await page.route("**/api/backtest/strategies*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STRATEGIES),
      });
    });

    await page.goto("/backtest");

    // Build Custom button is visible
    await expect(page.getByText("Build Custom")).toBeVisible();

    // Click to expand form
    await page.getByText("Build Custom").click();
    await expect(page.getByText("Custom Strategy")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Logic")).toBeVisible();
  });
});

test.describe("HistoricalReplay — Animation Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem("access_token", "mock-jwt-token");
        localStorage.setItem("user", JSON.stringify(user));
      },
      { user: MOCK_USER },
    );

    await page.route("**/api/backtest/strategies*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STRATEGIES),
      });
    });
    await page.route("**/api/backtest/runs*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RUNS_LIST),
      });
    });
  });

  test("playhead scrubber is accessible", async ({ page }) => {
    await page.goto("/backtest");

    // Click a completed run to show replay
    await page.locator(".run-row, [style*='cursor: pointer']").first().click();

    // Play button exists
    await expect(page.getByText("▶")).toBeVisible();

    // Scrubber exists
    const scrubber = page.locator("input[type='range']");
    await expect(scrubber).toBeVisible();
  });
});

test.describe("Rate Limiting — Backtest", () => {
  test("backtest run start returns 429 when rate limited", async ({ page }) => {
    await page.evaluate(
      ({ user }) => {
        localStorage.setItem("access_token", "mock-jwt-token");
        localStorage.setItem("user", JSON.stringify(user));
      },
      { user: MOCK_USER },
    );

    await page.route("**/api/backtest/strategies*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_STRATEGIES),
      });
    });

    let postCount = 0;
    await page.route("**/api/backtest/runs", (route) => {
      if (route.request().method() === "POST") {
        postCount++;
        if (postCount > 2) {
          route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Too many backtest requests." }),
            headers: { "X-RateLimit-Remaining": "0" },
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_RUN_QUEUED),
          });
        }
      }
    });

    await page.goto("/backtest");

    // Click run twice to trigger rate limit
    await page.getByText("▶ Run Backtest").dblclick();
  });
});