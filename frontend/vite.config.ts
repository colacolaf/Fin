import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
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

      // Ponytail: only ship files that actually exist in /public.
      includeAssets: [
        "favicon.svg",
        "offline.html",
        "icons/icon-192.svg",
        "icons/icon-512.svg",
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
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
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
    // Phase 39 fix T8.3: rollup-plugin-visualizer gated on env flag.
    // Run `BUILD_ANALYZE=true npx vite build` to produce dist/stats.html.
    ...(process.env.BUILD_ANALYZE
      ? [visualizer({ filename: "dist/stats.html", gzipSize: true })]
      : []),
  ],

  build: {
    rollupOptions: {
      output: {
        // Phase 39 fix T8.3: chunk the four heaviest deps identified by a
        // previous stats.html analysis so each lands under the 2 MiB
        // PWA precache limit. Tune after re-running the analyzer.
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          codemirror: [
            "@uiw/react-codemirror",
            "@codemirror/state",
            "@codemirror/view",
            "@codemirror/lang-markdown",
            "@codemirror/theme-one-dark",
          ],
          framer: ["framer-motion"],
          charts: ["recharts"],
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 5173,
  },
});