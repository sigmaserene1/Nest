// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const rpcWebsocketsBrowserEntry = fileURLToPath(
  new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url),
);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Circle App Kit includes Solana-capable dependencies even when Nest is
    // using only an EVM Arc adapter. Cloudflare/TanStack SSR does not provide
    // rpc-websockets' "browser"/"node" export conditions, so resolve that
    // transitive dependency explicitly to its published browser ESM entry.
    resolve: {
      alias: [
        {
          find: /^rpc-websockets$/,
          replacement: rpcWebsocketsBrowserEntry,
        },
      ],
    },
    // Pre-bundle the router packages so Vite never lazily re-optimizes them
    // mid-session — that race orphans chunks holding the old React module and
    // crashes every page with "Cannot read properties of null (reading 'use')"
    // (TanStack/router#4264).
    optimizeDeps: {
      include: [
        "@tanstack/react-router",
        "@tanstack/react-store",
        "@circle-fin/w3s-pw-web-sdk",
        "@circle-fin/app-kit",
        "@circle-fin/adapter-viem-v2",
      ],
      esbuildOptions: {
        plugins: [
          {
            name: "stream-browser-polyfill",
            setup(build: any) {
              build.onResolve({ filter: /^stream$/ }, () => ({
                path: fileURLToPath(new URL("./node_modules/stream-browserify/index.js", import.meta.url)),
              }));
              build.onResolve({ filter: /^util\/?$/ }, () => ({
                path: fileURLToPath(new URL("./node_modules/util/util.js", import.meta.url)),
              }));
            },
          },
        ],
      },
    },
    // Some wallet dependencies (WalletConnect, rpc-websockets) import Node's
    // "events"/"buffer" modules. Earlier plugins externalize Node builtins for
    // the browser, so aliases never apply; rewrite those imports to the
    // installed browser polyfills in client code only.
    plugins: [
      {
        name: "node-builtin-browser-polyfills",
        enforce: "pre",
        transform(code, id, opts) {
          if (opts?.ssr || !id.includes("/node_modules/")) return null;
          const re = /(from\s*|import\s*|require\(\s*)(["'])(events|buffer|stream|util)\2/g;
          if (!re.test(code)) return null;
          const polyfills: Record<string, string> = {
            events: fileURLToPath(new URL("./node_modules/events/events.js", import.meta.url)),
            buffer: fileURLToPath(new URL("./node_modules/buffer/index.js", import.meta.url)),
            stream: fileURLToPath(new URL("./node_modules/stream-browserify/index.js", import.meta.url)),
            util: fileURLToPath(new URL("./node_modules/util/util.js", import.meta.url)),
          };
          return {
            code: code.replace(re, (_m, pre: string, _q: string, mod: string) => `${pre}${JSON.stringify(polyfills[mod])}`),
            map: null,
          };
        },
      },
    ],
  },
});
