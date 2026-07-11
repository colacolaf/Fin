/**
 * useOfflineQueue — queues mutations when offline, replays on connectivity.
 * Reads/writes to IndexedDB via idb. Background sync via workbox for SW-side replay.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../db";
import type { QueuedMutation, StaleData } from "../db";
import { useOnlineStatus } from "./useOnlineStatus";

interface QueueStats {
  pending: number;
  hasPending: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

/**
 * Sends a queued mutation to the server.
 * Uses sendBeacon for fire-and-forget reliability on mobile.
 */
async function replayMutation(m: QueuedMutation): Promise<boolean> {
  try {
    const body = JSON.stringify(m.body);
    if (navigator.sendBeacon && m.method === "POST") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(`${API_BASE}${m.endpoint}`, blob);
      return sent;
    }
    const res = await fetch(`${API_BASE}${m.endpoint}`, {
      method: m.method,
      headers: { "Content-Type": "application/json" },
      body: body,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useOfflineQueue() {
  const { online } = useOnlineStatus();
  const [stats, setStats] = useState<QueueStats>({ pending: 0, hasPending: false });
  const isReplaying = useRef(false);

  const refreshStats = useCallback(async () => {
    const mutations = await db.getAll("mutations");
    setStats({ pending: mutations.length, hasPending: mutations.length > 0 });
  }, []);

  // Replay queue when coming back online
  useEffect(() => {
    if (!online || isReplaying.current) return;
    isReplaying.current = true;

    (async () => {
      const mutations = await db.getAll("mutations");
      // Sort oldest first
      mutations.sort((a: QueuedMutation, b: QueuedMutation) => a.createdAt - b.createdAt);

      for (const m of mutations) {
        const ok = await replayMutation(m);
        if (ok) {
          await db.delete("mutations", m.id!);
        } else {
          // Don't retry this batch — next online event will try again
          break;
        }
      }
      await refreshStats();
      isReplaying.current = false;
    })();
  }, [online, refreshStats]);

  // Enqueue a mutation (call this instead of fetch when offline)
  const enqueue = useCallback(
    async (endpoint: string, method: string, body: unknown) => {
      const m: QueuedMutation = {
        endpoint,
        method,
        body,
        createdAt: Date.now(),
        synced: false,
      };
      await db.add("mutations", m);
      await refreshStats();
    },
    [refreshStats],
  );

  // Mark data as stale with its key
  const markStale = useCallback(
    async (store: StaleData["store"], key: string) => {
      const existing = await db.get("staleData", key);
      await db.put("staleData", {
        key,
        store,
        staleAt: Date.now(),
        retryCount: (existing?.retryCount ?? 0) + 1,
      });
    },
    [],
  );

  // Check if a data key is stale
  const isStale = useCallback(async (key: string): Promise<boolean> => {
    const entry = await db.get("staleData", key);
    return !!entry;
  }, []);

  return { stats, enqueue, markStale, isStale, refreshStats };
}