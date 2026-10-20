import type { ArcEnvironment } from "@/lib/arc-network";

export type CircleArcBlockchain = "ARC" | "ARC-TESTNET";

export function circleBlockchainFor(environment: ArcEnvironment): CircleArcBlockchain {
  return environment === "mainnet" ? "ARC" : "ARC-TESTNET";
}
