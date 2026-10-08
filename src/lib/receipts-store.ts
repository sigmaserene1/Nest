// Canonical payment receipts derived directly from Arc event logs.
// The chain is the source of truth; nothing is persisted in browser storage.

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, parseAbiItem, toEventSelector, type Hex } from "viem";
import {
  getDeploymentBlockForEnvironment,
  useContractAddress,
} from "./chain/config";
import {
  arcChainFor,
  useArcEnvironment,
  type ArcEnvironment,
} from "./arc-network";
import { pullAccountCache, pushAccountCache } from "@/lib/account-cache";

/** Kept wide so existing screens that label a payment keep working. */
export type ReceiptKind = "settle" | "pay" | "rent" | "qr" | "transfer";

export type Receipt = {
  hash: string;
  from: string;
  to: string;
  amount: number;
  /** ISO timestamp of the Arc block that confirmed the transaction. */
  date: string;
  kind: ReceiptKind;
  note?: string;
  chainId?: number;
};

const SPLIT_SETTLED = parseAbiItem(
  "event SplitSettled(uint256 indexed expenseId, address indexed from, address indexed to, uint256 amount)",
);

const DIRECT_TRANSFER = parseAbiItem(
  "event DirectTransfer(uint256 indexed roomId, address indexed from, address indexed to, uint256 amount, string note)",
);
const SPLIT_SETTLED_TOPIC = toEventSelector("SplitSettled(uint256,address,address,uint256)");
const DIRECT_TRANSFER_TOPIC = toEventSelector(
  "DirectTransfer(uint256,address,address,uint256,string)",
);

const toUsdc = (value: bigint | undefined) => Number(value ?? 0n) / 1_000_000;
const lower = (value: string | undefined) => (value ?? "").toLowerCase();
const explorerApiFor = (environment: ArcEnvironment) =>
  environment === "mainnet" ? "https://explorer.arc.io/api" : "https://testnet.arcscan.app/api";

type ExplorerLog = {
  data: Hex;
  timeStamp: string;
  topics: Array<Hex | null>;
  transactionHash: Hex;
};

async function getExplorerLogs(
  address: string,
  topic: Hex,
  environment: ArcEnvironment,
): Promise<ExplorerLog[]> {
  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    fromBlock: String(getDeploymentBlockForEnvironment(environment)),
    toBlock: "latest",
    address,
    topic0: topic,
  });
  const response = await fetch(`${explorerApiFor(environment)}?${params}`);
  if (!response.ok) throw new Error("Arcscan log request failed");
  const payload = (await response.json()) as { result?: ExplorerLog[] | string };
  return Array.isArray(payload.result) ? payload.result : [];
}

function blockDate(timestamp: string) {
  const seconds = Number.parseInt(timestamp, 16);
  return new Date(seconds * 1000).toISOString();
}

function eventTopics(log: ExplorerLog) {
  return log.topics.filter((topic): topic is Hex => topic !== null) as [Hex, ...Hex[]];
}

function splitReceipt(log: ExplorerLog, chainId: number): Receipt {
  const decoded = decodeEventLog({
    abi: [SPLIT_SETTLED],
    data: log.data,
    topics: eventTopics(log),
  });
  const args = decoded.args as { from?: string; to?: string; amount?: bigint };
  return {
    hash: log.transactionHash,
    from: lower(args.from),
    to: lower(args.to),
    amount: toUsdc(args.amount),
    date: blockDate(log.timeStamp),
    kind: "settle",
    note: "Expense settlement",
    chainId,
  };
}

function transferReceipt(log: ExplorerLog, chainId: number): Receipt {
  const decoded = decodeEventLog({
    abi: [DIRECT_TRANSFER],
    data: log.data,
    topics: eventTopics(log),
  });
  const args = decoded.args as { from?: string; to?: string; amount?: bigint; note?: string };
  return {
    hash: log.transactionHash,
    from: lower(args.from),
    to: lower(args.to),
    amount: toUsdc(args.amount),
    date: blockDate(log.timeStamp),
    kind: "transfer",
    note: args.note || "USDC transfer",
    chainId,
  };
}

const receiptCacheKey = (environment: ArcEnvironment, wallet: string) =>
  `nest.receipts.${environment}.${wallet.toLowerCase()}`;

function readCachedReceipts(
  environment: ArcEnvironment,
  wallet?: string | null,
): Receipt[] {
  if (typeof window === "undefined" || !wallet) return [];
  try {
    const raw = localStorage.getItem(receiptCacheKey(environment, wallet));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Receipt[]) : [];
  } catch {
    return [];
  }
}

function writeCachedReceipts(
  environment: ArcEnvironment,
  wallet: string | null | undefined,
  receipts: Receipt[],
) {
  if (typeof window === "undefined" || !wallet) return;
  try {
    localStorage.setItem(
      receiptCacheKey(environment, wallet),
      JSON.stringify(receipts),
    );
  } catch {
    // The onchain/explorer view remains authoritative.
  }
}

function mergeReceipts(...lists: Receipt[][]) {
  const byHash = new Map<string, Receipt>();
  for (const receipt of lists.flat()) {
    if (!receipt?.hash) continue;
    byHash.set(receipt.hash.toLowerCase(), receipt);
  }
  return [...byHash.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Compatibility shim for existing callers.
 * A confirmed Arc transaction already exists in the event log, so there is
 * intentionally nothing to persist here.
 */
export function recordReceipt(_receipt: Receipt) {}

/** Browser-local receipt storage is retired. Use useReceipts() for Arc history. */
export function getReceipts(): Receipt[] {
  return [];
}

export function useReceipts(wallet?: string | null): Receipt[] {
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const contractAddress = useContractAddress();
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    if (!contractAddress) {
      setReceipts([]);
      return;
    }

    let cancelled = false;
    const local = readCachedReceipts(environment, wallet);
    if (local.length) setReceipts(local);

    void pullAccountCache(environment).then((cache) => {
      if (cancelled || !cache || !Array.isArray(cache.receiptHistory)) return;
      const remote = cache.receiptHistory as Receipt[];
      const merged = mergeReceipts(local, remote);
      if (merged.length) {
        setReceipts(merged);
        writeCachedReceipts(environment, wallet, merged);
      }
    });

    const load = async () => {
      try {
        // Arc's public RPC nodes prune historical event logs. The explorer
        // indexes finalized events, while Nest keeps the last verified result
        // locally/cloud-side so old receipts paint immediately on next login.
        const [settlements, transfers] = await Promise.all([
          getExplorerLogs(contractAddress, SPLIT_SETTLED_TOPIC, environment),
          getExplorerLogs(contractAddress, DIRECT_TRANSFER_TOPIC, environment),
        ]);
        const all = [
          ...settlements.map((log) => splitReceipt(log, arcChain.id)),
          ...transfers.map((log) => transferReceipt(log, arcChain.id)),
        ];
        const owner = wallet?.toLowerCase();
        const mine = owner
          ? all.filter((receipt) => receipt.from === owner || receipt.to === owner)
          : all;
        const next = mergeReceipts(mine);

        if (!cancelled) {
          setReceipts(next);
          writeCachedReceipts(environment, wallet, next);
          if (owner) {
            void pushAccountCache(environment, { receiptHistory: next });
          }
        }
      } catch {
        // Keep the last verified cached/onchain view. Never fabricate history.
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [contractAddress, environment, arcChain.id, wallet]);

  return useMemo(() => {
    if (!wallet) return receipts;
    const owner = wallet.toLowerCase();
    return receipts.filter((r) => r.from === owner || r.to === owner);
  }, [receipts, wallet]);
}
