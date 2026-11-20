import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address, Hex } from "viem";
import { useReadContract } from "wagmi";
import { pullAccountCache, pushAccountCache } from "@/lib/account-cache";
import { NEST_BRIDGE_REGISTRY_ABI } from "@/contracts/nest-bridge-registry-artifact";
import { arcChainFor, useArcEnvironment, type ArcEnvironment } from "@/lib/arc-network";
import { useBridgeRegistryAddress } from "@/lib/bridge-registry";
import { belongsToBridgeEnvironment, bridgeHistoryStorageKey } from "./bridge-history-scope";

export type BridgeHistoryStatus = "pending" | "complete" | "error";

export type BridgeHistoryEntry = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  amount: string;
  status: BridgeHistoryStatus;
  startedAt: number;
  burnHash?: Hex;
  mintHash?: Hex;
  explorerFrom: string;
  explorerTo: string;
  errorMessage?: string;
  tool?: string;
  recipient?: string;
  completedAt?: number;
  registryTxHash?: Hex;
  registryExplorer?: string;
};

const LEGACY_STORAGE_KEY = "nest.bridge.history";
const STORAGE_PREFIX = "nest.bridge.history.";
const MAX_ENTRIES = 100;

function readHistory(
  owner: string | null | undefined,
  environment: ArcEnvironment,
): BridgeHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const key = bridgeHistoryStorageKey(owner, environment);
  if (!key) return [];
  try {
    const raw =
      window.localStorage.getItem(key) ??
      (owner ? window.localStorage.getItem(`${STORAGE_PREFIX}${owner.toLowerCase()}`) : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry) => belongsToBridgeEnvironment(entry, environment))
      : [];
  } catch {
    return [];
  }
}

function writeHistory(
  entries: BridgeHistoryEntry[],
  owner: string | null | undefined,
  environment: ArcEnvironment,
) {
  if (typeof window === "undefined") return;
  const key = bridgeHistoryStorageKey(owner, environment);
  if (!key) return;
  window.localStorage.setItem(
    key,
    JSON.stringify(
      entries
        .filter((entry) => belongsToBridgeEnvironment(entry, environment))
        .slice(0, MAX_ENTRIES),
    ),
  );
}

function mergeHistory(local: BridgeHistoryEntry[], remote: BridgeHistoryEntry[]) {
  const byId = new Map<string, BridgeHistoryEntry>();
  for (const entry of [...remote, ...local]) {
    const key =
      entry.burnHash?.toLowerCase() ||
      entry.id ||
      `${entry.startedAt}-${entry.fromId}-${entry.toId}`;
    const previous = byId.get(key);
    byId.set(key, previous ? { ...entry, ...previous } : entry);
  }
  return [...byId.values()].sort((a, b) => b.startedAt - a.startedAt).slice(0, MAX_ENTRIES);
}

function explorerForChainId(chainId: number) {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    10: "https://optimistic.etherscan.io",
    137: "https://polygonscan.com",
    8453: "https://basescan.org",
    42161: "https://arbiscan.io",
    43114: "https://snowtrace.io",
    5042: "https://explorer.arc.io",
    11155111: "https://sepolia.etherscan.io",
    11155420: "https://sepolia-optimism.etherscan.io",
    84532: "https://sepolia.basescan.org",
    421614: "https://sepolia.arbiscan.io",
    43113: "https://testnet.snowtrace.io",
    80002: "https://amoy.polygonscan.com",
    5042002: "https://explorer.testnet.arc.io",
  };
  return explorers[chainId] ?? "";
}

type OnchainBridge = {
  id: bigint;
  owner: Address;
  recipient: Address;
  sourceChainId: bigint;
  destinationChainId: bigint;
  amount: bigint;
  sourceTxHash: Hex;
  destinationTxHash: Hex;
  sourceName: string;
  destinationName: string;
  provider: string;
  createdAt: bigint;
};

function fromOnchainBridge(record: OnchainBridge): BridgeHistoryEntry {
  const sourceChainId = Number(record.sourceChainId);
  const destinationChainId = Number(record.destinationChainId);
  const at = Number(record.createdAt) * 1000;
  return {
    id: `onchain-${record.id.toString()}`,
    fromId: String(sourceChainId),
    toId: String(destinationChainId),
    fromName: record.sourceName,
    toName: record.destinationName,
    amount: (Number(record.amount) / 1_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    }),
    status: "complete",
    startedAt: at,
    completedAt: at,
    burnHash: record.sourceTxHash,
    mintHash: record.destinationTxHash,
    explorerFrom: explorerForChainId(sourceChainId),
    explorerTo: explorerForChainId(destinationChainId),
    tool: record.provider,
    recipient: record.recipient,
  };
}

export function useBridgeHistory(owner?: string | null) {
  const [entries, setEntries] = useState<BridgeHistoryEntry[]>([]);
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const registryAddress = useBridgeRegistryAddress();

  const registryQuery = useReadContract({
    address: registryAddress ?? undefined,
    abi: NEST_BRIDGE_REGISTRY_ABI,
    functionName: "getUserBridges",
    args: registryAddress && owner ? [owner as Address, 100n] : undefined,
    chainId: arcChain.id,
    query: {
      enabled: Boolean(registryAddress && owner),
      refetchInterval: 20_000,
    },
  });

  const onchainEntries = useMemo(
    () =>
      ((registryQuery.data as readonly OnchainBridge[] | undefined) ?? []).map(fromOnchainBridge),
    [registryQuery.data],
  );

  useEffect(() => {
    // Remove the old shared history so wallets never see each other's transfers.
    if (typeof window !== "undefined") window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const local = readHistory(owner, environment);
    setEntries(local);
    if (!owner) return;

    let cancelled = false;
    void pullAccountCache(environment).then((cache) => {
      if (cancelled || !cache || !Array.isArray(cache.bridgeHistory)) return;
      const remote = (cache.bridgeHistory as BridgeHistoryEntry[]).filter((entry) =>
        belongsToBridgeEnvironment(entry, environment),
      );
      setEntries((current) => {
        const next = mergeHistory(current, remote);
        writeHistory(next, owner, environment);
        void pushAccountCache(environment, { bridgeHistory: next });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [owner, environment]);

  useEffect(() => {
    if (!owner || onchainEntries.length === 0) return;
    setEntries((current) => {
      const next = mergeHistory(current, onchainEntries);
      writeHistory(next, owner, environment);
      void pushAccountCache(environment, { bridgeHistory: next });
      return next;
    });
  }, [onchainEntries, owner, environment]);

  const addEntry = useCallback(
    (entry: BridgeHistoryEntry) => {
      setEntries((previous) => {
        const next = [entry, ...previous].slice(0, MAX_ENTRIES);
        writeHistory(next, owner, environment);
        void pushAccountCache(environment, { bridgeHistory: next });
        return next;
      });
    },
    [owner, environment],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<BridgeHistoryEntry>) => {
      setEntries((previous) => {
        const next = previous.map((item) => (item.id === id ? { ...item, ...patch } : item));
        writeHistory(next, owner, environment);
        void pushAccountCache(environment, { bridgeHistory: next });
        return next;
      });
    },
    [owner, environment],
  );

  const clearHistory = useCallback(() => {
    writeHistory([], owner, environment);
    setEntries([]);
    void pushAccountCache(environment, { bridgeHistory: [] });
  }, [owner, environment]);

  return {
    entries: entries.filter((entry) => belongsToBridgeEnvironment(entry, environment)),
    addEntry,
    updateEntry,
    clearHistory,
  };
}
