import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";

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
};

const LEGACY_STORAGE_KEY = "nest.bridge.history";
const STORAGE_PREFIX = "nest.bridge.history.";
const MAX_ENTRIES = 12;

function storageKey(owner?: string | null) {
  return owner ? `${STORAGE_PREFIX}${owner.toLowerCase()}` : null;
}

function readHistory(owner?: string | null): BridgeHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const key = storageKey(owner);
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: BridgeHistoryEntry[], owner?: string | null) {
  if (typeof window === "undefined") return;
  const key = storageKey(owner);
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useBridgeHistory(owner?: string | null) {
  const [entries, setEntries] = useState<BridgeHistoryEntry[]>([]);

  useEffect(() => {
    // Remove the old shared history so wallets never see each other's transfers.
    if (typeof window !== "undefined") window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    setEntries(readHistory(owner));
  }, [owner]);

  const addEntry = useCallback(
    (entry: BridgeHistoryEntry) => {
      setEntries((previous) => {
        const next = [entry, ...previous].slice(0, MAX_ENTRIES);
        writeHistory(next, owner);
        return next;
      });
    },
    [owner],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<BridgeHistoryEntry>) => {
      setEntries((previous) => {
        const next = previous.map((item) => (item.id === id ? { ...item, ...patch } : item));
        writeHistory(next, owner);
        return next;
      });
    },
    [owner],
  );

  const clearHistory = useCallback(() => {
    writeHistory([], owner);
    setEntries([]);
  }, [owner]);

  return { entries, addEntry, updateEntry, clearHistory };
}
