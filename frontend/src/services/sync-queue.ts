/**
 * sync-queue.ts — Thin wrapper around IndexedDB mutations store.
 * Provides a non-React service for the useOfflineQueue hook.
 * Direct db access pattern matching useOfflineQueue.ts.
 *
 * Uses: idb (via db.ts db instance)
 */

import { db, type QueuedMutation } from "../db";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export function createQueueKey(): number {
  return Date.now();
}

export async function enqueue(m: QueuedMutation): Promise<void> {
  await db.add("mutations", { ...m, synced: false, createdAt: Date.now() });
}

export async function drain(apiBase = API_BASE): Promise<{
  succeeded: number;
  failed: number;
}> {
  const all = (await db.getAll("mutations")) as QueuedMutation[];
  let succeeded = 0;
  let failed = 0;

  for (const m of all) {
    try {
      const body = JSON.stringify(m.body);
      const sent = navigator.sendBeacon
        ? navigator.sendBeacon(
            `${apiBase}${m.endpoint}`,
            new Blob([body], { type: "application/json" }),
          )
        : false;

      const res = sent
        ? { ok: true }
        : await fetch(`${apiBase}${m.endpoint}`, {
            method: m.method,
            headers: { "Content-Type": "application/json" },
            body,
          });

      if (sent || res.ok) {
        await db.delete("mutations", m.createdAt);
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

export async function pendingCount(): Promise<number> {
  const all = await db.getAll("mutations");
  return all.length;
}

export function registerAutoDrain(apiBase?: string): () => void {
  const handler = () => {
    if (navigator.onLine) {
      drain(apiBase);
    }
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}