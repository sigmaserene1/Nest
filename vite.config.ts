// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const CIRCLE_APP_KIT_STUB = "\0nest:circle-app-kit-server-stub";
const CIRCLE_VIEM_ADAPTER_STUB = "\0nest:circle-viem-adapter-server-stub";

/**
 * Circle App Kit drives injected browser wallets. Its cross-chain bundle also
 * contains optional Solana WebSocket code that cannot run inside a Cloudflare
 * Worker. Swap only the server-side imports for explicit browser-only stubs;
 * the client build continues to receive Circle's real packages.
 */
function circleAppKitBrowserOnly(): Plugin {
  return {
    name: "nest-circle-app-kit-browser-only",
    enforce: "pre",
    resolveId(source, _importer, options) {
      if (!options?.ssr) return null;
      if (source === "@circle-fin/app-kit") return CIRCLE_APP_KIT_STUB;
      if (source === "@circle-fin/adapter-viem-v2") return CIRCLE_VIEM_ADAPTER_STUB;
      return null;
    },
    load(id) {
      if (id === CIRCLE_APP_KIT_STUB) {
        return `
          const browserOnly = () => { throw new Error("Circle App Kit can only run in a connected browser wallet.") }
          export class AppKit {
            bridge() { return browserOnly() }
            retryBridge() { return browserOnly() }
          }
        `;
      }
      if (id === CIRCLE_VIEM_ADAPTER_STUB) {
        return `export const createViemAdapterFromProvider = () => { throw new Error("Circle App Kit can only run in a connected browser wallet.") }`;
      }
      return null;
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [circleAppKitBrowserOnly()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
