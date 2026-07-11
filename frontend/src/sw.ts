/**
 * Service worker entry — built by vite-plugin-pwa.
 * Handles: precaching, API caching (NetworkFirst), static assets (CacheFirst),
 * images (StaleWhileRevalidate), background sync for offline votes.
 *
 * Uses: workbox-precaching, workbox-routing, workbox-strategies,
 *       workbox-expiration, workbox-background-sync
 */

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// ---- 1. Precache static assets (injected by vite-plugin-pwa) ----
declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

// ---- 2. API routes: Network First, fallback to cache ----
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 3600 }),
    ],
  }),
);

// ---- 3. Static assets (JS, CSS, fonts): Cache First ----
registerRoute(
  ({ request }) => ["script", "style", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 86400 }),
    ],
  }),
);

// ---- 4. Images: Stale While Revalidate ----
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 86400 }),
    ],
  }),
);

// ---- 5. Background Sync for vote queue ----
const voteSync = new BackgroundSyncPlugin("vote-queue", {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url }) => url.pathname === "/api/votes",
  new NetworkFirst({
    cacheName: "vote-sync",
    plugins: [voteSync],
  }),
  "POST",
);

// ---- 6. Offline fallback ----
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const cache = await caches.open("static-assets");
    const cached = await cache.match("/index.html");
    return cached || Response.error();
  }
  return Response.error();
});

// ---- 7. Skip waiting + claim clients (immediate activation) ----
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});