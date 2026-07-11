// Mock all external API integrations for E2E tests
// No real API calls in CI — deterministic, realistic mock data
import type { Page } from '@playwright/test';
import {
  MOCK_PORTFOLIO,
  MOCK_RECOMMENDATIONS,
  MOCK_DEBTS,
  MOCK_RETIREMENT,
  MOCK_COMMUNITY,
  MOCK_BACKTEST,
  MOCK_EXECUTION,
  MOCK_MARKET_DATA,
  MOCK_USER,
} from './mock-data';

// No auth — local-only mode. The backend no longer requires tokens.
// The /api/auth/me mock is kept for tests that still reference it; it's a harmless no-op.
export async function mockAuth(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) })
  );
}

export async function mockPortfolio(page: Page) {
  await page.route('**/api/portfolio', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO) })
  );
  await page.route('**/api/portfolio/holdings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO.holdings) })
  );
}

export async function mockRecommendations(page: Page) {
  await page.route('**/api/recommendations', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RECOMMENDATIONS) })
  );
  await page.route('**/api/recommendations/*/accept', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'accepted' }) })
  );
  await page.route('**/api/recommendations/*/reject', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'rejected' }) })
  );
}

export async function mockDebt(page: Page) {
  await page.route('**/api/debts', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEBTS) })
  );
  await page.route('**/api/debts/strategy', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ strategy: 'avalanche', months_to_payoff: 48, total_interest: 12400 }),
    })
  );
}

export async function mockRetirement(page: Page) {
  await page.route('**/api/retirement', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT) })
  );
  await page.route('**/api/retirement/projection', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RETIREMENT.projections) })
  );
}

export async function mockCommunity(page: Page) {
  await page.route('**/api/community/benchmarks', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.benchmarks) })
  );
  await page.route('**/api/community/leaderboard', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.leaderboard) })
  );
  await page.route('**/api/community/votes', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COMMUNITY.votes) })
  );
}

export async function mockBacktest(page: Page) {
  await page.route('**/api/backtest', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BACKTEST) })
  );
}

export async function mockExecution(page: Page) {
  await page.route('**/api/execution/*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXECUTION) })
  );
}

export async function mockMarketData(page: Page) {
  // Finnhub quotes
  await page.route('**/api/data/quotes', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKET_DATA.quotes) })
  );
  // Finnhub news
  await page.route('**/api/data/news', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MARKET_DATA.news) })
  );
  // Upstash cache — no-op
  await page.route('**/api/data/cache**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cached: true }) })
  );
}

export async function mockPlaid(page: Page) {
  await page.route('**/api/integrations/plaid/link-token', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ link_token: 'link-sandbox-token' }) })
  );
  await page.route('**/api/integrations/plaid/accounts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'acct-1', name: 'Checking', type: 'depository', balance: 15200 },
        { id: 'acct-2', name: 'Savings', type: 'depository', balance: 45000 },
      ]),
    })
  );
}

export async function mockAlpaca(page: Page) {
  await page.route('**/api/integrations/alpaca/account', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ account_id: 'alpaca-test', status: 'ACTIVE', buying_power: 50000 }),
    })
  );
  await page.route('**/api/integrations/alpaca/positions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PORTFOLIO.holdings) })
  );
}

// Setup all mocks at once for authenticated contexts
export async function setupAllMocks(page: Page) {
  await mockAuth(page);
  await mockPortfolio(page);
  await mockRecommendations(page);
  await mockDebt(page);
  await mockRetirement(page);
  await mockCommunity(page);
  await mockBacktest(page);
  await mockExecution(page);
  await mockMarketData(page);
  await mockPlaid(page);
  await mockAlpaca(page);
}