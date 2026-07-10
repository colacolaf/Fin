# 18 — Mobile & Offline Support

## What & Why
Capacitor wrapper for iOS/Android. IndexedDB offline cache via idb. Service worker via Workbox for PWA installability. Background sync when online. Per Mobile_and_offline_support.md.

## Files to Create / Modify
```
frontend/
├── capacitor.config.ts        # Capacitor config
├── src/
│   ├── services/
│   │   ├── offline-cache.ts   # IndexedDB cache layer (idb)
│   │   ├── sync-queue.ts      # Background sync queue
│   │   └── network-status.ts  # Online/offline detection
│   ├── hooks/
│   │   ├── useOfflineCache.ts
│   │   └── useNetworkStatus.ts
│   ├── components/
│   │   └── shared/
│   │       └── OfflineBanner.tsx
│   └── sw.ts                  # Service worker entry
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # PWA icons (192, 512)
├── workbox-config.js          # Workbox config
├── ios/                       # Capacitor iOS (generated)
└── android/                   # Capacitor Android (generated)
```

## Steps
1. `capacitor.config.ts` — install @capacitor/core, @capacitor/ios, @capacitor/android. Config: appId com.fin.app, appName Fin, bundledWebRuntime false. npx cap add ios && npx cap add android.
2. `frontend/public/manifest.json` — PWA manifest: name "Fin", short_name "Fin", theme_color "#0a1628", background_color "#0a1628", display standalone, icons 192x192 + 512x512, start_url /.
3. `frontend/workbox-config.js` — precache HTML/JS/CSS. Runtime cache: API responses (stale-while-revalidate), images (cache-first), fonts (cache-first). Cache name: fin-v1.
4. `frontend/src/sw.ts` — import workbox-precaching, workbox-routing, workbox-strategies. Precache manifest. Route /api/* → network-first (5s timeout → cache fallback). Route /static/* → cache-first. Background sync for POST/PUT requests.
5. `frontend/src/services/offline-cache.ts` — IndexedDB via idb library. Stores: portfolio, debts, recommendations, user-context. write(key, value, ttl?), read(key) → {value, isStale}, clear(). TTL per store.
6. `frontend/src/services/sync-queue.ts` — queue mutations while offline: accept_recommendation, mark_executed, vote. On reconnect, drain queue in order. Conflict resolution: server wins on version mismatch.
7. `frontend/src/services/network-status.ts` — navigator.onLine + online/offline events. Emit status changes. Periodic health check: GET /api/health every 30s.
8. `frontend/src/hooks/useOfflineCache.ts` — hook wrapping offline-cache. Returns {data, isStale, refresh}. SWR pattern. Falls back to cached when offline.
9. `frontend/src/hooks/useNetworkStatus.ts` — returns {isOnline, wasOffline}. Updates in real-time via events.
10. `frontend/src/components/shared/OfflineBanner.tsx` — top banner: "You're offline. Changes will sync when reconnected." Yellow when offline. Green pulse when reconnected + syncing. Hide after sync complete.
11. Wrap all API calls with offline-aware layer: if online → fetch + cache. If offline → read cache. Mutations → queue for sync.
12. Playwright (emulate offline): verify cached data renders, mutations queue, reconnect drains queue, PWA installable check (lighthouse).

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`
- `impeccable` (offline UX, sync indicators)
- `ui-animation` (online/offline transitions)

## GitHub Repos Needed
- `ionic-team/capacitor` (cross-platform native wrapper)
- `GoogleChrome/workbox` (service worker tooling)
- `jakearchibald/idb` (IndexedDB wrapper)

## Edge Cases & Risks
- Cache grows unbounded → TTL-based eviction, max 50MB total, LRU per store
- Conflict on sync → server version wins, show "Updated from server" toast
- User clears browser data → re-cache on next online session, no user impact
- Capacitor build fails → native layer is nice-to-have, PWA is the core offline story. Degrade gracefully: PWA works standalone without Capacitor
- Background sync not supported (Firefox) → fallback to sync on next page load
- Large portfolio (100+ symbols) → paginate cache writes, lazy load
- IndexedDB blocked (private browsing) → fall back to in-memory cache, warn user

## Done When
- [ ] Capacitor configured, iOS + Android projects generated
- [ ] PWA manifest: installable, standalone, themed
- [ ] Workbox precaches shell + runtime caches API responses
- [ ] IndexedDB stores portfolio, debts, recommendations
- [ ] Sync queue drains mutations on reconnect, server-wins conflicts
- [ ] OfflineBanner shows/hides based on network status
- [ ] API layer: online=network+cache, offline=cache_only
- [ ] Playwright: offline mode → cached data renders → reconnect → sync completes
- [ ] Lighthouse PWA audit: installable, offline-ready, fast load
- [ ] Git: review diff, squash merge to main with `[18] Mobile & offline support`