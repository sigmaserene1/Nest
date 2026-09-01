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

const STORAGE_KEY = "nest.bridge.history";
const MAX_ENTRIES = 12;

function readHistory(): BridgeHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: BridgeHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useBridgeHistory() {
  const [entries, setEntries] = useState<BridgeHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(readHistory());
  }, []);

  const addEntry = useCallback((entry: BridgeHistoryEntry) => {
    setEntries((previous) => {
      const next = [entry, ...previous].slice(0, MAX_ENTRIES);
      writeHistory(next);
      return next;
    });
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<BridgeHistoryEntry>) => {
    setEntries((previous) => {
      const next = previous.map((item) => (item.id === id ? { ...item, ...patch } : item));
      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    writeHistory([]);
    setEntries([]);
  }, []);

  return { entries, addEntry, updateEntry, clearHistory };
}
