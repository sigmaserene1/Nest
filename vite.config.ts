// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Pre-bundle the router packages so Vite never lazily re-optimizes them
    // mid-session — that race orphans chunks holding the old React module and
    // crashes every page with "Cannot read properties of null (reading 'use')"
    // (TanStack/router#4264).
    optimizeDeps: {
      include: ["@tanstack/react-router", "@tanstack/react-store"],
    },
    resolve: {
      alias: {
        // WalletConnect's heartbeat imports Node's "events" module; use the
        // browser polyfill so the client bundle builds.
        events: "/dev-server/node_modules/events/events.js",
      },
    },
  },
});
