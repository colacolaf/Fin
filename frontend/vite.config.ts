import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service worker entry
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",

      includeAssets: [
        "favicon.svg",
        "offline.html",
        "icons/icon-192.png",
        "icons/icon-512.png",
      ],

      manifest: {
        name: "Fin",
        short_name: "Fin",
        description: "Multi-agent financial planner with offline support",
        theme_color: "#0a1628",
        background_color: "#0a1628",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },

      devOptions: {
        enabled: false, // SW disabled in dev to avoid stale cache issues
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 5173,
  },
});