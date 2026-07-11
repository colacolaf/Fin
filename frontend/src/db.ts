/**
 * db.ts — IndexedDB layer using idb (promise-based wrapper).
 * Schema: portfolio, recommendations, userContext, mutations, staleData.
 *
 * Requires: npm install idb
 */

import { openDB } from "idb";

// ---- Types ----

export interface PortfolioSnapshot {
  id: string;
  data: unknown;
  fetchedAt: number;
}

export interface Recommendation {
  id: string;
  agentType: string;
  data: unknown;
  fetchedAt: number;
}

export interface UserContext {
  id: string;
  data: unknown;
  fetchedAt: number;
}

export interface QueuedMutation {
  id?: number;
  endpoint: string;
  method: string;
  body: unknown;
  createdAt: number;
  synced: boolean;
}

export interface StaleData {
  key: string;
  store: string;
  staleAt: number;
  retryCount: number;
}

// ---- idb v8 schema types (defined manually, not exported by idb v8) ----

interface DBStoreSchema<K, V> {
  key: K;
  value: V;
  indexes?: Record<string, unknown>;
}

interface DBSchema {
  [storeName: string]: DBStoreSchema<unknown, unknown>;
}

interface FinDB extends DBSchema {
  portfolio: DBStoreSchema<string, PortfolioSnapshot>;
  recommendations: DBStoreSchema<string, Recommendation> & {
    indexes: { "by-agent": string };
  };
  userContext: DBStoreSchema<string, UserContext>;
  mutations: DBStoreSchema<number, QueuedMutation> & {
    indexes: { "by-synced": boolean };
  };
  staleData: DBStoreSchema<string, StaleData>;
}

// ---- Singleton ----

let dbPromise: ReturnType<typeof openDB<FinDB>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FinDB>("fin-offline-v1", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("portfolio")) {
          db.createObjectStore("portfolio", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("recommendations")) {
          const recStore = db.createObjectStore("recommendations", {
            keyPath: "id",
          });
          recStore.createIndex("by-agent", "agentType");
        }
        if (!db.objectStoreNames.contains("userContext")) {
          db.createObjectStore("userContext", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("mutations")) {
          const mutStore = db.createObjectStore("mutations", {
            keyPath: "id",
            autoIncrement: true,
          });
          mutStore.createIndex("by-synced", "synced");
        }
        if (!db.objectStoreNames.contains("staleData")) {
          db.createObjectStore("staleData", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Ergonomic helpers ----

export const db = {
  get: async (
    store: string,
    key: IDBValidKey | IDBKeyRange,
  ): Promise<unknown> => {
    const d = await getDB();
    return d.get(store as never, key);
  },
  put: async (store: string, value: unknown): Promise<unknown> => {
    const d = await getDB();
    return d.put(store as never, value);
  },
  add: async (store: string, value: unknown): Promise<unknown> => {
    const d = await getDB();
    return d.add(store as never, value);
  },
  delete: async (
    store: string,
    key: IDBValidKey | IDBKeyRange,
  ): Promise<void> => {
    const d = await getDB();
    return d.delete(store as never, key);
  },
  getAll: async (store: string): Promise<unknown[]> => {
    const d = await getDB();
    return d.getAll(store as never);
  },
  getAllFromIndex: async (
    store: string,
    index: string,
    value: unknown,
  ): Promise<unknown[]> => {
    const d = await getDB();
    return d.getAllFromIndex(store as never, index, value as IDBValidKey | IDBKeyRange);
  },
};

// ---- Write-through cache helpers ----

export async function getPortfolio(
  userId: string,
): Promise<PortfolioSnapshot | null> {
  const cached = (await db.get("portfolio", userId)) as
    | PortfolioSnapshot
    | undefined;
  if (!cached) return null;
  const age = Date.now() - cached.fetchedAt;
  return {
    ...cached,
    data: { ...(cached.data as Record<string, unknown>), _isStale: age > 900_000 },
  };
}

export async function setPortfolio(
  userId: string,
  data: unknown,
): Promise<void> {
  await db.put("portfolio", {
    id: userId,
    data,
    fetchedAt: Date.now(),
  });
}

export async function getRecommendations(
  agentType: string,
): Promise<Recommendation[]> {
  return (await db.getAllFromIndex(
    "recommendations",
    "by-agent",
    agentType,
  )) as Recommendation[];
}

export async function setRecommendation(rec: Recommendation): Promise<void> {
  await db.put("recommendations", { ...rec, fetchedAt: Date.now() });
}

export async function queueVote(
  userId: string,
  recId: string,
  vote: string,
): Promise<void> {
  await db.add("mutations", {
    endpoint: "/votes",
    method: "POST",
    body: { userId, recommendationId: recId, vote },
    createdAt: Date.now(),
    synced: false,
  });
}