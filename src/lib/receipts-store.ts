// Canonical payment receipts derived directly from Arc event logs.
// The chain is the source of truth; nothing is persisted in browser storage.

import { useEffect, useMemo, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { useContractAddress } from "./chain/config";
import { arcTestnet } from "./wagmi";

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

const toUsdc = (value: bigint | undefined) => Number(value ?? 0n) / 1_000_000;
const lower = (value: string | undefined) => (value ?? "").toLowerCase();

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
  const contractAddress = useContractAddress();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    if (!contractAddress || !publicClient) {
      setReceipts([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [settlements, transfers] = await Promise.all([
          publicClient.getLogs({ address: contractAddress, event: SPLIT_SETTLED, fromBlock: 0n }),
          publicClient.getLogs({ address: contractAddress, event: DIRECT_TRANSFER, fromBlock: 0n }),
        ]);

        const logs = [
          ...settlements.map((log) => ({
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            from: lower(log.args.from),
            to: lower(log.args.to),
            amount: toUsdc(log.args.amount),
            kind: "settle" as const,
            note: "Expense settlement",
          })),
          ...transfers.map((log) => ({
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            from: lower(log.args.from),
            to: lower(log.args.to),
            amount: toUsdc(log.args.amount),
            kind: "transfer" as const,
            note: log.args.note || "USDC transfer",
          })),
        ].filter((log) => Boolean(log.hash && log.blockNumber));

        const uniqueBlocks = Array.from(new Set(logs.map((log) => log.blockNumber!)));
        const timestampEntries = await Promise.all(
          uniqueBlocks.map(async (blockNumber) => {
            const block = await publicClient.getBlock({ blockNumber });
            return [blockNumber.toString(), Number(block.timestamp)] as const;
          }),
        );
        const timestamps = new Map(timestampEntries);

        const next = logs
          .map(
            (log): Receipt => ({
              hash: log.hash!,
              from: log.from,
              to: log.to,
              amount: log.amount,
              date: new Date(
                (timestamps.get(log.blockNumber!.toString()) ?? 0) * 1000,
              ).toISOString(),
              kind: log.kind,
              note: log.note,
              chainId: arcTestnet.id,
            }),
          )
          .sort((a, b) => b.date.localeCompare(a.date));

        if (!cancelled) setReceipts(next);
      } catch {
        // Keep the last verified onchain view. Never substitute fabricated data.
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [contractAddress, publicClient]);

  return useMemo(() => {
    if (!wallet) return receipts;
    const owner = wallet.toLowerCase();
    return receipts.filter((r) => r.from === owner || r.to === owner);
  }, [receipts, wallet]);
}
