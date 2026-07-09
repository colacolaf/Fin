# Data Refresh Pipeline

## Overview

The Data Refresh Pipeline ensures every agent conversation starts with fresh, accurate portfolio data. It orchestrates scheduled portfolio/debt refresh jobs, decrypts API credentials at runtime, detects stale data via quality flags, invalidates caches on mutation, and handles retries with agent-diagnosed failure attribution. Integrates Alpaca (brokerage/market data), Plaid (account linking), and Finnhub (market data/indicators) as defined in the Connectors specification.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REFRESH SCHEDULER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Hourly   │  │ Daily    │  │ On-Demand                │  │
│  │ Finnhub  │  │ Plaid    │  │ Login trigger + Manual   │  │
│  │ quotes   │  │ sync     │  │ refresh button           │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬──────────────┘  │
│       │             │                    │                  │
│       └─────────────┼────────────────────┘                  │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CREDENTIAL RESOLVER                     │    │
│  │  Encrypted at rest (AES-256-GCM) → decrypt runtime  │    │
│  │  Key from env/secrets manager, never logged         │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CONNECTOR ORCHESTRATOR                  │    │
│  │  Alpaca │ Plaid │ Finnhub                           │    │
│  │  ───────┼───────┼─────────                          │    │
│  │  Tier 1 │ Tier 1│ Tier 2                            │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              STALENESS DETECTOR                      │    │
│  │  Per-source TTL check → data_quality_flags          │    │
│  │  Stale → serve snapshot + flag, queue refresh        │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CACHE INVALIDATION                      │    │
│  │  Write-through on mutations, TTL-based expiry        │    │
│  │  Invalidation keys: user_id:portfolio, user_id:debts │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              RETRY + ERROR HANDLER                    │    │
│  │  Exponential backoff (3 retries / 5 min window)      │    │
│  │  Agent-diagnosed failure → data_quality_flags        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Scheduling Strategy

### Strategy: Hybrid (Cron Baseline + On-Demand Triggers)

Rationale: The free tiers of our connectors impose rate limits (Finnhub: 60 calls/min, Alpaca: 200 calls/min paper, Plaid: development-only sandbox). A cron baseline keeps data warm without exceeding limits, while on-demand triggers ensure fresh data when the user is actively engaging.

### Schedule Table

| Job | Frequency | Connector | Data Fetched | Free-Tier Budget |
|-----|-----------|-----------|-------------|------------------|
| Market Quotes | Every 60 min (market hours only) | Finnhub | Real-time quotes for all held symbols | 1 call per symbol per hour (~30-40 calls/hour max) |
| Market Quotes | Every 15 min (market hours) | Alpaca | Paper-trading quotes, account snapshot | 200 calls/min — well within limit |
| Account Sync | Daily at 06:00 UTC | Plaid | Balances, transactions, holdings from linked accounts | 1 call/day — Plaid dev sandbox |
| Portfolio Valuation | After every quote refresh | Internal | Aggregate positions, P&L, allocation % | Compute-only, no API cost |
| Debt Snapshot | Daily at 06:00 UTC | Plaid + Internal | Loan balances, APR, payoff projections | Bundled with account sync |
| On-Demand | User login event | All | Full portfolio + debt refresh | Triggered max ~5-10x/day per user |
| On-Demand | Manual "Refresh" button | All | Full portfolio + debt refresh | Rate-limited client-side: 1 per 60 seconds |

### Market Hours Awareness

- **Pre-market (04:00–09:30 ET)**: Skip Finnhub, use Alpaca only (paper quotes available)
- **Market open (09:30–16:00 ET)**: Full schedule active
- **After-hours (16:00–20:00 ET)**: Alpaca only, extended-hours quotes
- **Weekends/Holidays**: All scheduled jobs suspended; on-demand still available (serves last close data)

### Implementation

```typescript
// scheduler/scheduler.ts
interface RefreshJob {
  id: string;
  connector: 'alpaca' | 'plaid' | 'finnhub' | 'internal';
  frequency: CronExpression;
  marketHoursOnly: boolean;
  retryConfig: RetryConfig;
  stalenessThreshold: number; // seconds
}

const JOBS: RefreshJob[] = [
  {
    id: 'alpaca-quotes',
    connector: 'alpaca',
    frequency: '*/15 * * * 1-5', // Every 15 min, Mon-Fri
    marketHoursOnly: false,       // Paper trading available 24/7
    retryConfig: DEFAULT_RETRY,
    stalenessThreshold: 900,      // 15 min
  },
  {
    id: 'finnhub-quotes',
    connector: 'finnhub',
    frequency: '0 * * * 1-5',    // Hourly, Mon-Fri
    marketHoursOnly: true,
    retryConfig: DEFAULT_RETRY,
    stalenessThreshold: 3600,     // 1 hour
  },
  {
    id: 'plaid-sync',
    connector: 'plaid',
    frequency: '0 6 * * *',       // Daily 06:00 UTC
    marketHoursOnly: false,
    retryConfig: { maxRetries: 5, baseDelayMs: 60000, maxDelayMs: 600000 },
    stalenessThreshold: 86400,    // 24 hours
  },
  {
    id: 'debt-snapshot',
    connector: 'internal',
    frequency: '0 6 * * *',
    marketHoursOnly: false,
    retryConfig: DEFAULT_RETRY,
    stalenessThreshold: 86400,
  },
];
```

---

## 2. Credential Resolution

### Encryption at Rest

All third-party API credentials stored encrypted with **AES-256-GCM**. Encryption key sourced from environment variable `FIN_CREDENTIAL_KEY` (in production: cloud secrets manager — AWS Secrets Manager / GCP Secret Manager / Vault). The key is never logged, never stored in the database, and never included in agent context.

### Runtime Decryption Flow

```
User Context Loaded
       │
       ▼
┌──────────────────────────┐
│ Read encrypted credentials│
│ from user_context.        │
│ credentials.encrypted     │
│ (Base64 ciphertext)       │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ Resolve decryption key    │
│ 1. Check FIN_CREDENTIAL_KEY│
│    env var                │
│ 2. (Prod) Fetch from      │
│    secrets manager        │
│ 3. Cache in-memory for    │
│    session duration       │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ AES-256-GCM decrypt       │
│ • Extract nonce (first    │
│   12 bytes)               │
│ • Extract auth tag (last  │
│   16 bytes)               │
│ • Decrypt ciphertext      │
│ • Verify auth tag         │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ Plaintext credentials     │
│ → Connector clients       │
│ • Never serialized        │
│ • Never passed to LLM     │
│ • Cleared on session end  │
└──────────────────────────┘
```

### Credential Schema

```typescript
// types/credentials.ts
interface EncryptedCredentials {
  alpaca: {
    encryptedApiKey: string;     // AES-256-GCM ciphertext (Base64)
    encryptedSecretKey: string;
    encryptedAt: ISO8601;        // Rotation tracking
  };
  plaid: {
    encryptedClientId: string;
    encryptedSecret: string;
    encryptedAccessToken: string;
    encryptedAt: ISO8601;
  };
  finnhub: {
    encryptedApiKey: string;
    encryptedAt: ISO8601;
  };
}

// Runtime-only, never persisted
interface ResolvedCredentials {
  alpaca: { apiKey: string; secretKey: string };
  plaid: { clientId: string; secret: string; accessToken: string };
  finnhub: { apiKey: string };
}
```

### Security Constraints

- Credentials **must never** appear in agent system prompts or LLM context
- Credentials **must never** be logged (redact in logger middleware)
- Decrypted credentials cleared from memory on session teardown
- Key rotation: re-encrypt with new key on credential update, store `encryptedAt` timestamp
- Audit log: record each credential use (connector, timestamp, success/failure) without the credential value

---

## 3. Staleness Detection

### Per-Source TTL Configuration

| Data Source | Staleness Threshold | Rationale |
|-------------|---------------------|-----------|
| Alpaca positions | 15 min | Market data moves intraday |
| Alpaca account snapshot | 15 min | Cash balance, buying power |
| Finnhub quotes | 60 min | Free-tier hourly cadence |
| Plaid balances | 24 hours | Bank API refresh cycle |
| Plaid transactions | 24 hours | Pending transactions settle daily |
| Debt balances (manual) | 7 days | User updates debt manually |
| Portfolio valuation (computed) | 15 min | Derived from quote data |

### Detection Flow

```typescript
// staleness/detector.ts
interface StalenessReport {
  source: string;
  lastRefreshedAt: ISO8601;
  stalenessSeconds: number;
  thresholdSeconds: number;
  isStale: boolean;
  qualityFlag: DataQualityFlag;
}

function detectStaleness(userContext: UserContext): StalenessReport[] {
  const now = Date.now();
  const reports: StalenessReport[] = [];

  // Portfolio data (Alpaca)
  if (userContext.portfolio.lastUpdated) {
    const age = (now - new Date(userContext.portfolio.lastUpdated).getTime()) / 1000;
    reports.push({
      source: 'alpaca_portfolio',
      lastRefreshedAt: userContext.portfolio.lastUpdated,
      stalenessSeconds: age,
      thresholdSeconds: 900,
      isStale: age > 900,
      qualityFlag: age > 900 ? 'STALE_PORTFOLIO' : 'FRESH',
    });
  }

  // Debt data (Plaid + manual)
  if (userContext.debts.lastUpdated) {
    const age = (now - new Date(userContext.debts.lastUpdated).getTime()) / 1000;
    reports.push({
      source: 'debts',
      lastRefreshedAt: userContext.debts.lastUpdated,
      stalenessSeconds: age,
      thresholdSeconds: 86400,
      isStale: age > 86400,
      qualityFlag: age > 86400 ? 'STALE_DEBTS' : 'FRESH',
    });
  }

  return reports;
}
```

### data_quality_flags Mapping

From `docs/SystemPrompts/User_context_file_shema`, the `data_quality_flags` field in the User Context File:

```json
{
  "data_quality_flags": [
    {
      "source": "alpaca_portfolio",
      "status": "STALE_PORTFOLIO",
      "last_good_snapshot_at": "2026-07-08T14:30:00Z",
      "stale_since": "2026-07-08T14:45:00Z",
      "reason": "Finnhub rate limit exceeded (60/min). Serving last known good snapshot.",
      "agent_diagnosis": "Market data 15 min behind. P&L may not reflect last quarter-hour moves. Verify before executing trades."
    }
  ]
}
```

### Agent-Aware Staleness

When the staleness detector marks data as stale, it generates an `agent_diagnosis` string that is injected into the agent's system prompt via the User Context File. The agent then:

1. Reads the `data_quality_flags` at context injection
2. Acknowledges the staleness condition in its response: *"Note: your portfolio data is ~20 minutes behind. Recent market moves may not be reflected."*
3. Adjusts recommendation confidence accordingly (wider error margins on projections)
4. Flags any recommendation derived from stale data with `confidence_penalty: 0.15`

---

## 4. Cache Invalidation

### Cache Architecture

```typescript
// cache/invalidation.ts
interface CacheKey {
  userId: string;
  domain: 'portfolio' | 'debts' | 'quotes' | 'plaid';
  subkey?: string; // e.g., symbol for quotes
}

// Invalidation rules
const INVALIDATION_RULES: Record<string, InvalidationRule> = {
  'portfolio': {
    ttl: 900, // 15 min
    invalidateOn: ['trade_executed', 'account_update', 'deposit', 'withdrawal'],
    cascade: ['portfolio_valuation'],
  },
  'debts': {
    ttl: 86400,
    invalidateOn: ['debt_updated', 'debt_added', 'debt_paid', 'plaid_sync'],
    cascade: [],
  },
  'quotes': {
    ttl: 3600,
    invalidateOn: ['market_close', 'manual_refresh'],
    cascade: ['portfolio_valuation'],
  },
  'plaid': {
    ttl: 86400,
    invalidateOn: ['plaid_sync_complete', 'account_linked', 'account_unlinked'],
    cascade: ['debts', 'portfolio'],
  },
};
```

### Invalidation Triggers

| Trigger Event | Invalidated Keys | Behavior |
|---------------|-----------------|----------|
| User executes trade | `user:*:portfolio`, `user:*:quotes` | Immediate invalidation, queued refresh |
| Plaid daily sync completes | `user:*:plaid`, `user:*:debts`, `user:*:portfolio` | Cascade invalidate, background refresh |
| User manually refreshes | `user:*` (all keys) | Full invalidation, blocking refresh |
| Agent updates debt record | `user:*:debts` | Immediate invalidation, recompute projections |
| Market close (16:00 ET) | `user:*:quotes` | TTL natural expiry, no forced refresh until next open |
| TTL natural expiry | Per-domain | Lazy refresh on next read (stale-while-revalidate) |

### Stale-While-Revalidate Pattern

On cache miss or TTL expiry, serve the stale cached value immediately and trigger an async background refresh. The next read returns fresh data. Prevents blocking the UI on slow connector responses.

```typescript
async function getWithSWR<T>(key: CacheKey, fetcher: () => Promise<T>): Promise<{ data: T; isStale: boolean }> {
  const cached = await cache.get(key);
  if (cached && !isExpired(cached)) {
    return { data: cached.value, isStale: false };
  }
  if (cached) {
    // Stale — serve immediately, refresh in background
    backgroundRefresh(key, fetcher);
    return { data: cached.value, isStale: true };
  }
  // No cache — must block
  const fresh = await fetcher();
  await cache.set(key, fresh, getTTL(key));
  return { data: fresh, isStale: false };
}
```

---

## 5. Retry and Error Handling

### Retry Strategy

**Exponential backoff: 3 retries over a 5-minute window.**

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1st retry | 10 seconds | 10s |
| 2nd retry | 60 seconds | 70s |
| 3rd retry | 230 seconds (~4 min) | 300s (5 min) |

Jitter: ±25% random jitter on each delay to prevent thundering herd on rate-limit recovery.

```typescript
// retry/backoff.ts
const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 10000,
  maxDelayMs: 300000,
  backoffMultiplier: 6,     // 10s → 60s → 360s (capped at 300s)
  jitter: 0.25,
};

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const capped = Math.min(exponential, config.maxDelayMs);
  const jittered = capped * (1 + (Math.random() * 2 - 1) * config.jitter);
  return Math.round(jittered);
}
```

### Error Classification

| Error Type | Retryable? | Agent Diagnosis | User-Visible |
|------------|-----------|-----------------|--------------|
| Rate limit (429) | Yes — backoff | "Connector rate-limited. Data may be delayed by up to X minutes." | Subtle indicator |
| Auth failure (401/403) | No | "Connector credentials expired or revoked. User must re-link account in Settings." | Red badge on connector |
| Timeout (>15s) | Yes — backoff | "Connector unresponsive. Using last known snapshot from X minutes ago." | Yellow staleness badge |
| 5xx server error | Yes — backoff | "Connector experiencing outage. Data may be incomplete." | Yellow staleness badge |
| Network error | Yes — backoff | "Network unavailable. Offline data from X minutes ago." | Offline indicator |
| Parse error (malformed response) | No | "Connector returned unexpected data format. Investigation required." | Red badge, admin alert |
| Quota exceeded | No | "Free-tier quota exhausted for today. Data will refresh at midnight UTC." | Orange quota badge |

### Agent Diagnosis Pipeline

When a refresh job exhausts retries, the error handler:

1. Classifies the error using the table above
2. Generates a structured `data_quality_flag` with `agent_diagnosis` field
3. Writes the flag to the User Context File
4. The agent reads the diagnosis on next context injection
5. The agent surfaces the condition in its conversational response with appropriate hedging

```typescript
// error/agent_diagnosis.ts
interface DiagnosisResult {
  source: string;
  status: DataQualityStatus;
  reason: string;
  agentDiagnosis: string;
  lastGoodSnapshotAt: ISO8601;
  retriesExhausted: number;
  nextRetryAt: ISO8601 | null;
}

function diagnose(
  source: string,
  error: ConnectorError,
  retriesAttempted: number,
  lastSnapshot: ISO8601
): DiagnosisResult {
  const classification = classifyError(error);
  const base = {
    source,
    lastGoodSnapshotAt: lastSnapshot,
    retriesExhausted: retriesAttempted,
  };

  switch (classification) {
    case 'RATE_LIMITED':
      return {
        ...base,
        status: 'STALE_RATE_LIMITED',
        reason: `${source} rate limit exceeded after ${retriesAttempted} retries.`,
        agentDiagnosis: `Market data from ${source} is delayed. Quotes may be up to 60 minutes stale. Use with caution for time-sensitive decisions.`,
        nextRetryAt: calculateNextRetry(),
      };
    case 'AUTH_FAILURE':
      return {
        ...base,
        status: 'CREDENTIAL_EXPIRED',
        reason: `${source} authentication failed. Credentials may be revoked.`,
        agentDiagnosis: `Cannot access ${source}. Ask the user to re-link their account in Settings → Connections. Until re-linked, I'll work with the last known snapshot.`,
        nextRetryAt: null,
      };
    case 'TIMEOUT':
      return {
        ...base,
        status: 'STALE_TIMEOUT',
        reason: `${source} timed out after ${retriesAttempted} retries.`,
        agentDiagnosis: `${source} is unresponsive. Using the last snapshot from ${formatTime(lastSnapshot)}. I'll note where this matters for accuracy.`,
        nextRetryAt: calculateNextRetry(),
      };
    default:
      return {
        ...base,
        status: 'STALE_UNKNOWN',
        reason: `${source} failed with unclassified error.`,
        agentDiagnosis: `Could not refresh ${source}. Working with potentially stale data. Verify critical numbers before acting.`,
        nextRetryAt: null,
      };
  }
}
```

### Circuit Breaker

If a connector fails 5+ consecutive refresh attempts, the circuit breaker trips:

- **Open state**: All requests to that connector short-circuit immediately (no network call)
- **Half-open state**: After 10 minutes, allow one probe request
- **Closed state**: Probe succeeds → resume normal operation; fails → back to open for 20 minutes

```typescript
// circuit_breaker.ts
class ConnectorCircuitBreaker {
  private failures: Map<string, number> = new Map();
  private state: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  private openedAt: Map<string, number> = new Map();

  private readonly FAILURE_THRESHOLD = 5;
  private readonly OPEN_DURATION_MS = 10 * 60 * 1000;  // 10 min
  private readonly OPEN_DURATION_EXTENDED_MS = 20 * 60 * 1000; // 20 min

  async execute<T>(connector: string, fn: () => Promise<T>): Promise<T> {
    if (this.isOpen(connector)) {
      throw new CircuitBreakerOpenError(connector);
    }
    try {
      const result = await fn();
      this.onSuccess(connector);
      return result;
    } catch (error) {
      this.onFailure(connector);
      throw error;
    }
  }
}
```

---

## 6. Connector Integration Details

Referenced from `docs/Skills_Connectors_Models/Connectors_specification`:

### Alpaca (Tier 1 — Primary Brokerage & Market Data)

- **Auth**: API Key + Secret Key (paper trading keys for development)
- **Endpoints used**:
  - `GET /v2/account` — Account snapshot (cash, buying power, portfolio value)
  - `GET /v2/positions` — All open positions with cost basis, P&L
  - `GET /v2/orders` — Recent order history (last 30 days)
  - `GET /v2/assets` — Asset reference data
- **Rate limit**: 200 calls/min (paper), free tier
- **Refresh job**: Every 15 min, market-hours-aware

### Plaid (Tier 1 — Account Linking & Bank Data)

- **Auth**: Client ID + Secret + per-user Access Token (Link token flow)
- **Endpoints used**:
  - `POST /transactions/sync` — Incremental transaction sync
  - `POST /accounts/balance/get` — Real-time balance check
  - `POST /liabilities/get` — Debt/loan data (balances, APRs, terms)
  - `POST /investments/holdings/get` — Investment holdings from linked bank brokerages
- **Rate limit**: Development sandbox (no hard limit in dev, production requires Plaid contract)
- **Refresh job**: Daily at 06:00 UTC
- **Webhook support** (Phase 2): Plaid can push `TRANSACTIONS_REMOVED`, `HOLDINGS_UPDATE`, `DEFAULT_UPDATE` webhooks to trigger on-demand refresh

### Finnhub (Tier 2 — Market Data & Indicators)

- **Auth**: API Key (single key, no secret)
- **Endpoints used**:
  - `GET /quote?symbol=X` — Real-time quote (price, change, % change, high, low, open, prev close)
  - `GET /stock/candle?symbol=X&resolution=D` — Daily candles for charts
  - `GET /stock/profile2?symbol=X` — Company profile (market cap, industry, logo)
  - `GET /news?category=general` — Market news (used for sentiment context)
- **Rate limit**: 60 calls/min, free tier
- **Refresh job**: Hourly during market hours

---

## 7. Pipeline Execution Order

On any refresh trigger (scheduled or on-demand):

```
1. Credential Resolution
   Decrypt Alpaca + Plaid + Finnhub credentials
   │
2. Parallel Connector Calls (non-blocking)
   ├── Alpaca: Account + Positions + Orders
   ├── Plaid: Balances + Transactions + Liabilities + Holdings (if investment accts linked)
   └── Finnhub: Quotes for all held symbols (batched, ≤60/min)
   │
3. Staleness Detection
   Check each result age against TTL thresholds
   │
4. Data Merge
   Combine connector results into normalized portfolio + debt structures
   │
5. Cache Invalidation
   Clear stale cache entries, write fresh data
   │
6. Quality Flag Generation
   Generate data_quality_flags with agent_diagnosis for any stale/error conditions
   │
7. User Context File Update
   Write updated portfolio, debts, data_quality_flags to User Context File
   │
8. Agent Notification
   Emit event so active agent conversations pick up fresh context
```

---

## 8. Monitoring & Observability

### Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `refresh.success_rate` | % of refresh jobs succeeding per connector | < 90% over 1 hour |
| `refresh.latency_p95` | 95th percentile refresh duration | > 15s |
| `refresh.staleness_max` | Maximum staleness in seconds across all sources | > 2x TTL threshold |
| `refresh.retry_rate` | % of jobs requiring ≥1 retry | > 20% |
| `circuit_breaker.open` | Binary: is circuit breaker open per connector | > 0 (any open) |
| `credential.decrypt_errors` | Count of credential decryption failures | > 0 (immediate alert) |

### Logging

- Structured JSON logs: `{ source, event, durationMs, retriesAttempted, error?, timestamp }`
- Credential values **redacted** in all log output (middleware replaces with `[REDACTED]`)
- Agent diagnoses logged at INFO level for auditing

---

## Phase 2 Roadmap

- **Plaid webhook integration**: Real-time push from Plaid for transaction/holding updates (eliminates polling)
- **Polygon.io addition** (Tier 2): 5 free calls/min, adds websocket streaming for real-time quotes on key symbols
- **Dead-letter queue**: Failed refreshes queued for async retry beyond the 3-immediate-retry window (retry up to 24 hours)
- **Refresh health dashboard**: Admin UI showing per-connector health, circuit breaker state, staleness timelines
- **User notification preferences**: Opt-in push/email when portfolio data is significantly stale (>1 hour during market hours)

---

## Implementation Tasks

See `tasks/Data_refresh_pipeline.md` for the phased breakdown of implementation tasks with acceptance criteria.