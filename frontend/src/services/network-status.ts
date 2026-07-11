/**
 * network-status.ts — Non-React online/offline detection service.
 * Exposes reactive state without React hooks for use in plain services.
 *
 * Uses: navigator.onLine + online/offline events
 */

type Listener = (online: boolean) => void;

const listeners = new Set<Listener>();

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function getNetworkStatus(): boolean {
  return isOnline();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Immediately notify with current state
  listener(isOnline());
  return () => {
    listeners.delete(listener);
  };
}

// Listen globally, notify all subscribers
if (typeof window !== "undefined") {
  const notify = () => {
    const online = isOnline();
    listeners.forEach((fn) => fn(online));
  };
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
}