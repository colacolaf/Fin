# Mobile & Offline Support

## Overview

Fin must work on mobile devices and survive network interruptions gracefully. This document specifies the Progressive Web App (PWA) architecture, offline context caching strategy, mobile-specific UI adaptations, and local-first data architecture. Phase 1 delivers read-only offline mode (cached portfolio snapshots + last 5 recommendations + agent memory graph). Phase 2 adds read-write offline with sync queue. Storage budget: ~200MB moderate ceiling, critical path fits within 50MB.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PWA SHELL                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Service Worker (sw.js)                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Cache-   │  │ Network- │  │ Background       │   │   │
│  │  │ First    │  │ First    │  │ Sync             │   │   │
│  │  │ (static) │  │ (API)    │  │ (Phase 2)        │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │              LOCAL-FIRST DATA LAYER                  │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ IndexedDB      │  │ Zustand Store              │   │   │
│  │  │ (persistent)   │  │ (in-memory, hydrated       │   │   │
│  │  │                │  │  from IDB on boot)         │   │   │
│  │  │ ├─ portfolio   │  │                            │   │   │
│  │  │ ├─ debts       │  │ ├─ userSlice              │   │   │
│  │  │ ├─ memory      │  │ ├─ portfolioSlice         │   │   │
│  │  │ ├─ recs        │  │ ├─ agentsSlice            │   │   │
│  │  │ ├─ context     │  │ ├─ memorySlice            │   │   │
│  │  │ └─ queue (P2)  │  │ └─ syncSlice (P2)         │   │   │
│  │  └────────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │              SYNC ENGINE (Phase 2)                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Conflict │  │ Mutation │  │ Background       │   │   │
│  │  │ Resolver │  │ Queue    │  │ Sync API         │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. PWA Architecture

### Web App Manifest

```json
// public/manifest.json
{
  "name": "Fin — Personal Finance Agent",
  "short_name": "Fin",
  "description": "AI-powered personal finance with debt, investment, and retirement agents",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1628",
  "theme_color": "#0a1628",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/dashboard.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide" },
    { "src": "/screenshots/dashboard-mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ],
  "categories": ["finance", "productivity"],
  "shortcuts": [
    { "name": "Portfolio", "url": "/portfolio", "icons": [{ "src": "/icons/portfolio-96.png", "sizes": "96x96" }] },
    { "name": "Agents", "url": "/agents", "icons": [{ "src": "/icons/agents-96.png", "sizes": "96x96" }] }
  ]
}
```

### Service Worker Strategy

Three cache tiers with distinct strategies:

```typescript
// sw.ts
// Tier 1: Static Assets — Cache-First
// JS bundles, CSS, fonts, icons, app shell HTML
// Cache name versioned by build hash for atomic updates
const STATIC_CACHE = 'fin-static-v${BUILD_HASH}';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/app.js',
  '/assets/vendor.js',
  '/assets/app.css',
  '/fonts/inter-var.woff2',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',  // Fallback page when completely offline
];

// Tier 2: API Data — Network-First with Cache Fallback
// Portfolio snapshots, recommendations, agent responses, user context
// Stale-while-revalidate for non-critical: agent memory graph, market news
const API_CACHE = 'fin-api-v1';

// Tier 3: External — Network-Only (no cache)
// Third-party scripts, analytics, connector calls (handled server-side)
// Never cached — these should always hit the network
```

### Service Worker Lifecycle

```typescript
// sw.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // Take control of all clients
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // API calls: network-first with cache fallback
  if (isApiCall(url)) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // Everything else: network-only
  event.respondWith(fetch(event.request));
});
```

### Cache Strategies

```typescript
// Cache-First: Serve from cache, update cache in background
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    // Background cache refresh
    fetch(request).then(response => {
      if (response.ok) caches.open(cacheName).then(c => c.put(request, response));
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    caches.open(cacheName).then(c => c.put(request, response.clone()));
    return response;
  } catch {
    return caches.match('/offline.html') as Promise<Response>;
  }
}

// Network-First: Try network, fall back to cache
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      caches.open(cacheName).then(c => c.put(request, response.clone()));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Set offline header so UI can show staleness indicator
      const headers = new Headers(cached.headers);
      headers.set('X-Fin-Offline', 'true');
      return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
    }
    return caches.match('/offline.html') as Promise<Response>;
  }
}
```

---

## 2. Offline Context Caching

### What Gets Cached (Phase 1: Read-Only)

| Data Domain | Storage | TTL | Size Estimate | Priority |
|-------------|---------|-----|---------------|----------|
| Portfolio snapshot (latest) | IndexedDB | Until next successful refresh | ~2KB | Critical |
| Debt snapshot (latest) | IndexedDB | Until next successful refresh | ~1KB | Critical |
| Last 5 recommendations (with full context) | IndexedDB | 30 days | ~25KB each = ~125KB | Critical |
| Agent memory graph (last known state) | IndexedDB | 7 days | ~50KB | High |
| User preferences / goals | IndexedDB | Permanent | ~5KB | Critical |
| Agent conversation history (last 10 messages/agent) | IndexedDB | 7 days | ~10KB each = ~100KB | High |
| Market data (last quotes snapshot) | IndexedDB | 24 hours (stale after) | ~5KB | Medium |
| UI state (last active tab, collapsed panels) | localStorage | Permanent | ~1KB | Low |
| Static assets (JS/CSS/fonts/images) | Cache API | Build-versioned | ~2MB | Critical |

**Total critical path**: ~2.3MB fits well within 50MB floor.  
**Total with all cached data**: ~3–5MB well within 200MB ceiling.

### IndexedDB Schema

```typescript
// db/schema.ts
interface FinDatabase {
  portfolios: {
    key: 'current'; // Only store latest snapshot
    value: PortfolioSnapshot;
  };
  debts: {
    key: 'current';
    value: DebtSnapshot;
  };
  recommendations: {
    key: string; // recommendation_id
    value: Recommendation;
    indexes: { agent: string; createdAt: Date };
  };
  memoryGraph: {
    key: string; // agent name
    value: AgentMemoryGraph;
    indexes: { updatedAt: Date };
  };
  agentConversations: {
    key: string; // `${agent}:${conversationId}`
    value: AgentConversation;
    indexes: { agent: string; updatedAt: Date };
  };
  marketData: {
    key: string; // symbol
    value: QuoteSnapshot;
    indexes: { updatedAt: Date };
  };
  // Phase 2
  syncQueue: {
    key: string; // auto-increment
    value: SyncOperation;
    indexes: { status: 'pending' | 'syncing' | 'failed'; createdAt: Date };
  };
}
```

### Hydration on App Boot

```typescript
// store/hydration.ts
async function hydrateStoreFromIDB(): Promise<HydratedState> {
  const db = await openFinDatabase();

  // 1. Critical data (blocking)
  const [portfolio, debts, preferences] = await Promise.all([
    db.get('portfolios', 'current'),
    db.get('debts', 'current'),
    db.get('preferences', 'current'),
  ]);

  // 2. High-priority data (parallel, non-blocking)
  const recommendationsPromise = db.getAll('recommendations')
    .then(recs => recs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
  const memoryGraphsPromise = db.getAll('memoryGraph');
  const conversationsPromise = db.getAll('agentConversations')
    .then(convos => convos.slice(0, 30)); // Last 30 messages

  // 3. Low-priority data (background, doesn't block UI)
  const marketDataPromise = db.getAll('marketData');

  // Show UI immediately with critical data
  const state = {
    portfolio: portfolio ?? null,
    debts: debts ?? null,
    preferences: preferences ?? getDefaultPreferences(),
    recommendations: [],
    memoryGraphs: [],
    conversations: [],
    marketData: [],
    isHydrated: false, // Becomes true when all data loaded
    isOffline: !navigator.onLine,
  };

  // Fill in high-priority data as it arrives
  const [recommendations, memoryGraphs, conversations] = await Promise.all([
    recommendationsPromise,
    memoryGraphsPromise,
    conversationsPromise,
  ]);
  state.recommendations = recommendations;
  state.memoryGraphs = memoryGraphs;
  state.conversations = conversations;
  state.isHydrated = true;

  // Background: market data
  marketDataPromise.then(data => { state.marketData = data; });

  return state;
}
```

### Offline Detection & UI

```typescript
// hooks/useOnlineStatus.ts
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    // "Lie-fi" detection — browser says online but network is slow/dead
    isLieFi: useLieFiDetection(),
  };
}
```

**UI Indicators**:

| Network State | Visual Indicator |
|---------------|-----------------|
| Online | No indicator (normal) |
| Offline | Persistent bottom bar: "Offline — showing cached data from {time}" with subtle amber accent |
| Lie-fi (online but API failing) | Yellow staleness badge on agent cards |
| Reconnected | Toast notification: "Back online. Data refreshed." Auto-dismiss 3s |
| Data stale (>1hr offline) | Amber warning icon on portfolio value with tooltip |

---

## 3. Mobile-Specific UI Adaptations

### Responsive Breakpoints

From `docs/Features/Setup_wizard/Setup_wizard_frontend_spec`:

| Breakpoint | Width | Layout Strategy |
|------------|-------|-----------------|
| Mobile | 320–639px | Single column, bottom nav, swipeable cards, collapsible sections |
| Tablet Portrait | 640–767px | 2-column where beneficial, side nav collapsed |
| Tablet Landscape | 768–1023px | 2-column, side nav expanded, more content visible |
| Desktop | 1024–1439px | Full layout, 3-column agent cards, persistent side panels |
| Large Desktop | ≥1440px | Max-width 1440px centered, generous whitespace |

### Mobile Layout Architecture

```
┌──────────────────────┐
│  Status Bar           │
├──────────────────────┤
│  Top App Bar          │
│  Fin  🔔  ⚙️         │
├──────────────────────┤
│                      │
│  Main Content Area   │
│  (ScrollView)        │
│                      │
│  ┌────────────────┐  │
│  │ Agent Switcher │  │
│  │ [🦈 Inv] [🦋   │  │
│  │  Debt] [🐋 Ret] │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Metric Card    │  │
│  │ (current agent)│  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Recommendation │  │
│  │ Cards           │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Memory Graph   │  │
│  │ (collapsible)  │  │
│  └────────────────┘  │
│                      │
├──────────────────────┤
│  Bottom Nav Bar       │
│  🏠 Home  💬 Agents  │
│  📊 Port  ⚙️ Settings│
└──────────────────────┘
```

### Mobile Navigation

**Bottom Tab Bar** (visible on mobile only):

- Home (ocean viz, minimized)
- Agents (conversation view)
- Portfolio (data tables)
- Settings (gear)

Fixed height: 56px. Active tab indicated by agent-colored dot + bold label. Smooth transition between tabs via horizontal slide (not hard cut — `cubic-bezier(0.25, 1, 0.5, 1)` 250ms).

**Agent Switcher** (horizontal scrollable chips):

- Chips: Investment 🦈 | Debt 🦋 | Retirement 🐋
- Active chip: filled background (agent color at 15% opacity), bold text
- Swipe left/right to switch agent context
- Snaps to nearest chip on release (framer-motion drag with `snapTo`)

### Touch Optimizations

- **Minimum touch target**: 44×44px (WCAG 2.5.5)
- **Tap delay**: `touch-action: manipulation` on all interactive elements (removes 300ms delay)
- **Pull-to-refresh**: Drag down on main scroll view triggers manual data refresh (with haptic feedback on supported devices)
- **Swipe-to-dismiss**: Recommendation cards swipeable (right = accept, left = dismiss) — framer-motion drag gesture
- **Long-press**: On metric values → show tooltip with detail breakdown
- **No hover-dependent UI**: All hover states have equivalent focus/active states for touch

### Gesture Configuration

```typescript
// gestures/config.ts
import { drag } from 'framer-motion';

const SWIPE_THRESHOLD = 80; // px to trigger swipe action
const SWIPE_VELOCITY = 500; // px/s minimum for flick

const swipeGestures = {
  recommendationCard: {
    drag: 'x',
    dragConstraints: { left: 0, right: 0 }, // Will be overridden in gesture handler
    dragElastic: 0.2, // Resistance past threshold
    onDragEnd: (_, info) => {
      if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) {
        handleAccept();
      } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
        handleDismiss();
      }
    },
  },
  pullToRefresh: {
    drag: 'y',
    dragConstraints: { top: 0, bottom: 120 },
    dragElastic: 0.4,
    onDragEnd: (_, info) => {
      if (info.offset.y > 80) {
        triggerRefresh();
      }
    },
  },
};
```

### Mobile Typography Scale

| Role | Desktop | Mobile |
|------|---------|--------|
| Page title | 28px/700 | 22px/700 |
| Section heading | 20px/600 | 18px/600 |
| Metric value | 32px/700 | 24px/700 |
| Body text | 16px/400 (line-height 1.6) | 15px/400 (line-height 1.5) |
| Caption/label | 12px/400 | 11px/400 |
| Minimum font size | Never below 11px | Never below 11px |

### Mobile-Specific Component Adaptations

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Ocean visualization | Full Three.js scene | Static gradient + animated SVG fins (save GPU/battery) |
| Agent cards | 3-column vertical stack | Swipeable card stack, 1 card visible |
| Memory graph | Persistent right panel | Fullscreen modal triggered by FAB |
| Settings | Side panel | Full-page view with back button |
| Recommendation list | Scrollable list with detail panel | Stacked cards with expand-on-tap |
| Data tables | Full table with sortable headers | Card-based layout (1 row = 1 card) |
| Charts | D3/TradingView full size | Simplified sparklines + tap to expand |

---

## 4. Local-First Data Architecture

### State Management

From `docs/Frontend_Architecture.md`, the state management approach uses **Zustand** with slices. The local-first architecture extends this by persisting slices to IndexedDB and using the server as a synchronization target (not the source of truth during active use).

```typescript
// store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idb-storage';

interface FinStore {
  // User
  user: UserState;
  // Portfolio (local-first)
  portfolio: PortfolioState;
  // Agents
  agents: AgentsState;
  // Recommendations
  recommendations: RecommendationsState;
  // Memory
  memory: MemoryState;
  // Sync (Phase 2)
  sync: SyncState;

  // Actions
  hydrateFromIDB: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

export const useFinStore = create<FinStore>()(
  persist(
    (set, get) => ({
      // ... slices
    }),
    {
      name: 'fin-store',
      storage: createJSONStorage(() => idbStorage), // Persist to IndexedDB
      partialize: (state) => ({
        // Only persist data, not UI-only state
        portfolio: state.portfolio,
        agents: state.agents,
        recommendations: state.recommendations,
        memory: state.memory,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        // Handle schema migrations
        if (version === 0) {
          // Migrate from v0 to v1
        }
        return persistedState as FinStore;
      },
    }
  )
);
```

### Zustand IDB Storage Adapter

```typescript
// store/idb-storage.ts
import { StateStorage } from 'zustand/middleware';
import { openFinDatabase } from '../db/schema';

export const idbStorage: StateStorage = {
  getItem: async (key: string) => {
    const db = await openFinDatabase();
    return db.get('zStore', key) ?? null;
  },
  setItem: async (key: string, value: string) => {
    const db = await openFinDatabase();
    await db.put('zStore', value, key);
  },
  removeItem: async (key: string) => {
    const db = await openFinDatabase();
    await db.delete('zStore', key);
  },
};
```

### Data Flow: Online vs. Offline

**Online Path**:
```
User Action → Zustand Store (optimistic update) → Server API
                                                  │
                                                  ▼
                                        Server confirms → Store reconciled
                                        Server rejects  → Store rolled back + error toast
```

**Offline Path (Phase 1 — Read)**:
```
User Action (view only) → Zustand Store (reads from IndexedDB hydration)
                          No writes attempted → disabled buttons with tooltip
```

**Offline Path (Phase 2 — Read/Write)**:
```
User Action → Zustand Store (optimistic update)
              → IndexedDB persisted immediately
              → Mutation queued in syncQueue
              → When online: Background Sync API fires
                → Server processes queue in order
                → Conflicts resolved (server-wins with notification)
                → Store reconciled to server state
```

### Conflict Resolution Strategy (Phase 2)

For read-write offline, conflicts arise when the same data is modified both locally and on the server. Strategy:

| Data Type | Resolution Strategy |
|-----------|---------------------|
| User preferences | Last-write-wins (LWW) with timestamp |
| Manual debt update | Server-wins (authoritative Plaid data trumps manual edits) |
| Recommendation vote | Merge (both votes recorded, user sees both) |
| Agent conversation | Append-only (no conflicts possible) |
| Portfolio positions | Server-wins (brokerage data is authoritative) |

---

## 5. Storage Management

### Quota Monitoring

```typescript
// storage/quota.ts
interface StorageEstimate {
  quota: number;   // Total available in bytes
  usage: number;   // Currently used in bytes
  percentUsed: number;
}

async function getStorageEstimate(): Promise<StorageEstimate> {
  const estimate = await navigator.storage.estimate();
  return {
    quota: estimate.quota ?? 0,
    usage: estimate.usage ?? 0,
    percentUsed: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0,
  };
}
```

### Storage Budgets

| Tier | Ceiling | Description |
|------|---------|-------------|
| Critical floor | 50MB | Must work on all devices. Portfolio + debts + preferences + last 3 recs + static shell. |
| Standard | 200MB | Full offline experience. 30 days history, 20 recs, memory graphs, market data. |
| Opt-in extended | 500MB | User opts in via Settings. Full offline mode with model weights (Phase 3). |

### Cache Eviction Policy

When approaching the storage ceiling:

1. **Evict oldest market data** (keep only last 24 hours) — saves ~3MB
2. **Evict conversations older than 7 days** — saves ~50MB
3. **Evict recommendations older than 30 days** — saves ~100MB
4. **Never evict**: Portfolio snapshots, debt snapshots, user preferences, static shell

```typescript
// storage/eviction.ts
async function evictIfNeeded(targetPercentUsed: number = 80): Promise<void> {
  const estimate = await getStorageEstimate();
  if (estimate.percentUsed < targetPercentUsed) return;

  const db = await openFinDatabase();

  // Tier 1: Old market data
  await db.delete('marketData', {
    where: { updatedAt: { lt: Date.now() - 24 * 60 * 60 * 1000 } }
  });

  // Re-check
  const after1 = await getStorageEstimate();
  if (after1.percentUsed < targetPercentUsed) return;

  // Tier 2: Old conversations
  await db.delete('agentConversations', {
    where: { updatedAt: { lt: Date.now() - 7 * 24 * 60 * 60 * 1000 } }
  });

  // Re-check
  const after2 = await getStorageEstimate();
  if (after2.percentUsed < targetPercentUsed) return;

  // Tier 3: Old recommendations
  await db.delete('recommendations', {
    where: { createdAt: { lt: Date.now() - 30 * 24 * 60 * 60 * 1000 } }
  });
}
```

### Persistent Storage Request

Browsers may evict IndexedDB data under storage pressure. Request persistent storage to reduce this risk:

```typescript
// storage/persist.ts
async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  const isPersisted = await navigator.storage.persist();
  return isPersisted;
}

// Call on first user login or during setup wizard
// If denied, show a one-time notification explaining the offline benefit
```

---

## 6. Background Sync (Phase 2)

### Sync Queue

```typescript
// sync/queue.ts
interface SyncOperation {
  id: string;
  type: 'vote' | 'preference_update' | 'debt_update' | 'goal_update' | 'conversation_message';
  payload: unknown;
  createdAt: Date;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  maxRetries: number;
}

async function enqueueOperation(op: Omit<SyncOperation, 'id' | 'status' | 'retryCount'>): Promise<void> {
  const db = await openFinDatabase();
  await db.add('syncQueue', {
    ...op,
    id: crypto.randomUUID(),
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
  });
  // Register background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('fin-sync');
  }
}
```

### Background Sync Handler (Service Worker)

```typescript
// sw.ts
self.addEventListener('sync', (event) => {
  if (event.tag === 'fin-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue(): Promise<void> {
  const db = await openFinDatabase();
  const pendingOps = await db.getAll('syncQueue', { where: { status: 'pending' } });

  for (const op of pendingOps.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    try {
      op.status = 'syncing';
      await db.put('syncQueue', op);

      await sendToServer(op);

      await db.delete('syncQueue', op.id);
    } catch (error) {
      op.retryCount++;
      op.status = op.retryCount >= op.maxRetries ? 'failed' : 'pending';
      await db.put('syncQueue', op);
    }
  }
}
```

---

## 7. Network Resilience Patterns

### Retry with Exponential Backoff (Client-Side)

```typescript
// network/retry.ts
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = baseDelay * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### Optimistic UI Updates

All user mutations follow this pattern:

1. Apply change to Zustand store immediately (optimistic)
2. Persist to IndexedDB
3. Send to server
4. If server rejects → rollback store + IDB, show error toast
5. If offline → keep optimistic state, queue for sync

```typescript
// hooks/useOptimisticMutation.ts
async function optimisticMutate<T>(
  optimisticUpdate: () => void,
  serverMutation: () => Promise<T>,
  rollback: () => void
): Promise<void> {
  optimisticUpdate();
  try {
    await serverMutation();
  } catch (error) {
    rollback();
    throw error;
  }
}
```

---

## 8. Offline UX States

### State Matrix

| Network | Cached Data | UX State |
|---------|-------------|----------|
| Online | Fresh | Full functionality, live data |
| Online | Stale | Full functionality, data freshness indicator, background refresh |
| Offline | Has cache | Read-only mode: view portfolio, recs, memory. Write buttons disabled with tooltip "Available when online". |
| Offline | No cache (first visit) | Offline landing page: "Connect to the internet to set up Fin" with retry button |
| Lie-fi | Any | Yellow warning bar: "Slow connection — data may be delayed" |
| Reconnecting | Any | Toast: "Back online. Syncing latest data…" → resolved |

### Offline Landing Page

When the user is offline with no cached data:

```
┌───────────────────────────────┐
│                               │
│         🐋  Fin               │
│                               │
│   No internet connection      │
│                               │
│   You'll need to connect to   │
│   the internet the first time │
│   you use Fin. After that,    │
│   you can view your portfolio │
│   and recommendations offline.│
│                               │
│       [Try Again]             │
│                               │
│       [Continue Offline]      │
│       (limited mode)          │
│                               │
└───────────────────────────────┘
```

---

## 9. Testing Strategy

### Offline Testing Checklist

- [ ] Toggle airplane mode: app loads cached portfolio + recs
- [ ] Kill server process: app shows staleness indicators, no crashes
- [ ] Slow 3G throttling (DevTools): app loads progressively, critical data first
- [ ] IndexedDB quota exceeded: eviction runs, critical data preserved
- [ ] Clear site data: first-visit offline page shows
- [ ] Service worker update: new version installs, old cache cleaned, no double-cache
- [ ] Background sync (Phase 2): queue processes on reconnect, conflicts resolved
- [ ] Persistent storage request: granted on supported browsers, graceful fallback on unsupported

### Mobile Testing Checklist

- [ ] 320px viewport: no horizontal scroll, all content accessible
- [ ] Touch targets ≥44px: no overlapping tap areas
- [ ] Orientation change: layout adapts without data loss
- [ ] PWA install prompt: fires correctly, installed app works
- [ ] Splash screen: app loads with correct background color
- [ ] iOS safe areas: content not hidden behind notch/home indicator
- [ ] Haptic feedback: pull-to-refresh and swipe actions trigger where supported
- [ ] Keyboard: input fields not hidden behind keyboard on focus

---

## Phase 2 Roadmap

- **Read-Write Offline**: User can vote on recommendations, update goals, send messages while offline
- **Background Sync API**: Mutation queue processed automatically when back online
- **Conflict Resolution UI**: Show merge conflicts to user when both local and server state changed
- **Offline Agent Responses**: Cached agent response templates for common questions (no LLM needed locally)
- **Push Notifications**: New recommendations pushed even when app is closed
- **Periodic Background Sync**: Refresh portfolio data in background when online

## Phase 3 Roadmap (Future)

- **Local LLM Inference**: WebLLM / ONNX Runtime Web for basic agent responses without server
- **Full Offline Mode**: 500MB opt-in storage for model weights + full data
- **Peer-to-Peer Sync**: Sync data across user's devices without server intermediary (CRDT-based)