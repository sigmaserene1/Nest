import { getCircleSession } from "@/lib/circle-sdk";
import {
  patchNestAccountCache,
  readNestAccountCache,
} from "@/lib/account-cache.functions";

export type AccountCacheScope = "testnet" | "mainnet" | "global";

export type NestAccountCache = {
  snapshot: unknown | null;
  bridgeHistory: unknown[];
  receiptHistory: unknown[];
  preferences: Record<string, unknown>;
  agentConfig: unknown | null;
  agentRuns: unknown[];
  updatedAt: string;
};

function token() {
  return getCircleSession()?.userToken ?? null;
}

export async function pullAccountCache(
  scope: AccountCacheScope,
): Promise<NestAccountCache | null> {
  const userToken = token();
  if (!userToken) return null;
  try {
    const result = await readNestAccountCache({
      data: { userToken, scope },
    });
    return result.configured && result.row
      ? (result.row as NestAccountCache)
      : null;
  } catch {
    return null;
  }
}

export async function pushAccountCache(
  scope: AccountCacheScope,
  patch: {
    snapshot?: unknown;
    bridgeHistory?: unknown;
    receiptHistory?: unknown;
    preferences?: unknown;
    agentConfig?: unknown;
    agentRuns?: unknown;
  },
) {
  const userToken = token();
  if (!userToken) return false;
  try {
    const result = await patchNestAccountCache({
      data: { userToken, scope, patch },
    });
    return result.configured;
  } catch {
    return false;
  }
}
