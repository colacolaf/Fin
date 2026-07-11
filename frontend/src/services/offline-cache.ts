/**
 * offline-cache.ts — IndexedDB cache layer wrapping db.ts helpers.
 * SWR pattern: read from cache, revalidate from network when online.
 * TTL-based staleness per store.
 *
 * Uses: idb (via db.ts)
 */

import {
  getPortfolio,
  setPortfolio,
  getRecommendations,
  setRecommendation,
  type PortfolioSnapshot,
  type Recommendation,
} from "../db";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function isStale(fetchedAt: number, ttl = DEFAULT_TTL_MS): boolean {
  return Date.now() - fetchedAt > ttl;
}

// ---- Portfolio ----

export async function cachePortfolio(
  userId: string,
  data: unknown,
): Promise<void> {
  await setPortfolio(userId, data);
}

export async function getCachedPortfolio(userId: string): Promise<{
  data: unknown;
  isStale: boolean;
} | null> {
  const entry = await getPortfolio(userId);
  if (!entry) return null;
  return { data: entry.data, isStale: isStale(entry.fetchedAt) };
}

// ---- Recommendations ----

export async function cacheRecommendation(rec: Recommendation): Promise<void> {
  await setRecommendation(rec);
}

export async function getCachedRecommendations(
  agentType: string,
): Promise<Recommendation[]> {
  return getRecommendations(agentType);
}