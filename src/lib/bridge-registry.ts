import { isAddress, type Address } from "viem";
import { useArcEnvironment, type ArcEnvironment } from "@/lib/arc-network";

function configuredAddress(environment: ArcEnvironment): Address | null {
  const raw = String(
    environment === "mainnet"
      ? import.meta.env.VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS ?? ""
      : import.meta.env.VITE_NEST_BRIDGE_REGISTRY_ADDRESS ?? "",
  ).trim();
  return isAddress(raw) ? (raw as Address) : null;
}

export function getBridgeRegistryAddress(environment: ArcEnvironment) {
  return configuredAddress(environment);
}

export function useBridgeRegistryAddress() {
  return configuredAddress(useArcEnvironment());
}
