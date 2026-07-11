/**
 * SyncIndicator — shows pending offline mutations and sync status.
 * Animated pulse when syncing, checkmark when done, count badge when pending.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

export default function SyncIndicator() {
  const { online, wasOffline } = useOnlineStatus();
  const { stats } = useOfflineQueue();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (wasOffline && online && stats.hasPending) {
      setSyncing(true);
      setSynced(false);
    }
    if (!stats.hasPending && syncing) {
      setSyncing(false);
      setSynced(true);
      const timer = setTimeout(() => setSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [online, stats.hasPending, wasOffline, syncing]);

  return (
    <AnimatePresence>
      {(syncing || synced || stats.hasPending) && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 12,
            backgroundColor: synced
              ? "var(--color-success, #10b981)"
              : stats.hasPending
                ? "var(--color-surface, rgba(255,255,255,0.1))"
                : "transparent",
            color: synced
              ? "#fff"
              : "var(--color-text-secondary, #94a3b8)",
            fontSize: 12,
            fontWeight: 500,
            transition: "background-color 0.3s ease",
          }}
          role="status"
          aria-label={
            syncing
              ? "Syncing..."
              : synced
                ? "Synced"
                : `${stats.pending} pending`
          }
        >
          {syncing ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ display: "flex" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </motion.span>
              Syncing...
            </>
          ) : synced ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Synced
            </>
          ) : (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-warning, #f59e0b)",
                }}
              />
              {stats.pending} pending
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}