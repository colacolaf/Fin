/**
 * useOnlineStatus — online/offline detection with edge-resilient debounce.
 * Returns { online, wasOffline, lastOnline, lastOffline }.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface OnlineStatus {
  online: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const lastOnline = useRef<Date | null>(null);
  const lastOffline = useRef<Date | null>(null);
  // Debounce timer to handle flaky mobile connections
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOnline = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // 500ms debounce — edge networks bounce on/off frequently
    debounceRef.current = setTimeout(() => {
      lastOnline.current = new Date();
      setOnline(true);
    }, 500);
  }, []);

  const handleOffline = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastOffline.current = new Date();
      setOnline(false);
      setWasOffline(true);
    }, 500);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleOnline, handleOffline]);

  return {
    online,
    wasOffline,
    lastOnline: lastOnline.current,
    lastOffline: lastOffline.current,
  };
}