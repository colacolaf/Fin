/**
 * registerSW.ts — registers the Workbox service worker via vite-plugin-pwa virtual module.
 * Called from main.tsx after app mount.
 */

import { registerSW as registerPwaSW } from "virtual:pwa-register";

export function registerSW(): void {
  if (!("serviceWorker" in navigator)) {
    console.debug("[SW] Service workers not supported");
    return;
  }

  const updateSW = registerPwaSW({
    onNeedRefresh() {
      // New content available — dispatch event for UI update banner
      window.dispatchEvent(new CustomEvent("sw-update-available"));
    },
    onOfflineReady() {
      console.debug("[SW] App ready for offline use");
      window.dispatchEvent(new CustomEvent("sw-offline-ready"));
    },
    onRegistered(registration) {
      if (registration) {
        console.debug(`[SW] Registered with scope: ${registration.scope}`);
      }
    },
    onRegisterError(error) {
      console.error("[SW] Registration failed:", error);
    },
  });

  // Store update function on window for component access
  (window as any).__updateSW = updateSW;
}

/**
 * Apply a waiting service worker update.
 * Called by the update banner's "Refresh" button.
 */
export function applySWUpdate(): void {
  const updateSW = (window as any).__updateSW;
  if (typeof updateSW === "function") {
    updateSW();
  } else {
    window.location.reload();
  }
}