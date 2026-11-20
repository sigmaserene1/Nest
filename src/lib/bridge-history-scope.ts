import type { ArcEnvironment } from "./arc-network";
const mainnets = new Set([1, 10, 137, 8453, 42161, 43114, 5042]);
const testnets = new Set([11155111, 11155420, 80002, 84532, 421614, 43113, 5042002]);
export function belongsToBridgeEnvironment(
  entry: { fromId: string; toId: string },
  environment: ArcEnvironment,
) {
  const chains = environment === "mainnet" ? mainnets : testnets;
  return chains.has(Number(entry.fromId)) && chains.has(Number(entry.toId));
}
export function bridgeHistoryStorageKey(
  owner: string | null | undefined,
  environment: ArcEnvironment,
) {
  return owner ? `nest.bridge.history.${environment}.${owner.toLowerCase()}` : null;
}
