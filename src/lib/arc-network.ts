import { defineChain } from "viem";
import { useSyncExternalStore } from "react";

export type ArcEnvironment = "testnet" | "mainnet";

export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

export const ARC_TESTNET_RPC_URLS = [
  "https://arc-testnet.drpc.org",
  "https://5042002.rpc.thirdweb.com",
  "https://rpc.testnet.arc.network",
] as const;

export const ARC_MAINNET_RPC_URLS = ["https://rpc.mainnet.arc.io"] as const;

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [...ARC_TESTNET_RPC_URLS] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
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

export function arcRpcFor(environment: ArcEnvironment) {
  return arcChainFor(environment).rpcUrls.default.http[0];
}

export function arcEnvironmentLabel(environment: ArcEnvironment) {
  return environment === "mainnet" ? "Mainnet" : "Testnet";
}
