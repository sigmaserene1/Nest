import { defineChain, fallback, http } from "viem";
import { useSyncExternalStore } from "react";

export type ArcEnvironment = "testnet" | "mainnet";

export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

export const ARC_TESTNET_RPC_URLS = [
  // Circle's current official public endpoint.
  "https://rpc.testnet.arc.io",
  // Current Arc-listed provider fallbacks.
  "https://rpc.blockdaemon.testnet.arc.io",
  "https://rpc.drpc.testnet.arc.io",
  "https://rpc.quicknode.testnet.arc.io",
] as const;

export const ARC_MAINNET_RPC_URLS = [
  // Circle's current official public endpoint.
  "https://rpc.mainnet.arc.io",
  // Current Arc-listed provider fallbacks.
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
] as const;

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [...ARC_TESTNET_RPC_URLS] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.testnet.arc.io" },
  },
  testnet: true,
});

export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc Mainnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [...ARC_MAINNET_RPC_URLS] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
  testnet: false,
});

const STORAGE_KEY = "nest.arc.environment";
const CHANGE_EVENT = "nest:arc-environment";
const requestedDefault = String(import.meta.env.VITE_ARC_DEFAULT_NETWORK ?? "").toLowerCase();
export const DEFAULT_ARC_ENVIRONMENT: ArcEnvironment =
  requestedDefault === "mainnet" ? "mainnet" : "testnet";

export function getArcEnvironment(): ArcEnvironment {
  if (typeof window === "undefined") return DEFAULT_ARC_ENVIRONMENT;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "mainnet" || stored === "testnet" ? stored : DEFAULT_ARC_ENVIRONMENT;
}

export function setArcEnvironment(environment: ArcEnvironment) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, environment);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function useArcEnvironment(): ArcEnvironment {
  return useSyncExternalStore(subscribe, getArcEnvironment, () => DEFAULT_ARC_ENVIRONMENT);
}

export function arcChainFor(environment: ArcEnvironment) {
  return environment === "mainnet" ? arcMainnet : arcTestnet;
}

export function arcExplorerFor(environment: ArcEnvironment) {
  return arcChainFor(environment).blockExplorers.default.url;
}

export function arcRpcUrlsFor(environment: ArcEnvironment) {
  return environment === "mainnet" ? ARC_MAINNET_RPC_URLS : ARC_TESTNET_RPC_URLS;
}

/**
 * Current Arc public RPC transport used by wagmi and Circle App Kit.
 * The explicit URLs prevent SDK chain defaults from falling back to the
 * retired *.arc.network endpoints, while fallback keeps transient RPC
 * failures from breaking quotes and gas reads.
 */
export function arcRpcTransportFor(environment: ArcEnvironment) {
  return fallback(
    arcRpcUrlsFor(environment).map((url) =>
      http(url, { batch: true, retryCount: 2, timeout: 15_000 }),
    ),
    { rank: true },
  );
}

export function arcRpcFor(environment: ArcEnvironment) {
  return arcRpcUrlsFor(environment)[0];
}

export function arcEnvironmentLabel(environment: ArcEnvironment) {
  return environment === "mainnet" ? "Mainnet" : "Testnet";
}
