import { isAddress, type Address } from "viem";
import { useArcEnvironment, type ArcEnvironment } from "@/lib/arc-network";

export const TESTNET_BRIDGE_REGISTRY_ADDRESS =
  "0x2dd392fc3f6b10e5520c309164216351f4f7c27b" as const;

function configuredAddress(environment: ArcEnvironment): Address | null {
  if (environment === "testnet") {
    const raw = String(
      import.meta.env.VITE_NEST_BRIDGE_REGISTRY_ADDRESS ??
        TESTNET_BRIDGE_REGISTRY_ADDRESS,
    ).trim();
    return isAddress(raw) ? (raw as Address) : TESTNET_BRIDGE_REGISTRY_ADDRESS;
  }

  const raw = String(
    import.meta.env.VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS ?? "",
  ).trim();
  return isAddress(raw) ? (raw as Address) : null;
}

export function getBridgeRegistryAddress(environment: ArcEnvironment) {
  return configuredAddress(environment);
}

export function useBridgeRegistryAddress() {
  return configuredAddress(useArcEnvironment());
}
