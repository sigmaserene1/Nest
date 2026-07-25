// Lightweight tx history persisted to localStorage.
// Tracks real onchain USDC transfers submitted via the app.

import { useSyncExternalStore } from "react";
import type { ActionMode } from "@/components/nest/action-modal-types";

export type TxStatus = "pending" | "confirmed" | "failed";

export type StoredTx = {
  hash: string;
  from: string;
  to: string;
  amount: number; // USDC
  mode: ActionMode;
  note?: string;
  recipientName?: string;
  createdAt: string;
  status: TxStatus;
  error?: string;
};

const KEY = "nest.tx.v1";
const listeners = new Set<() => void>();

function read(): StoredTx[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredTx[]) : [];
  } catch {
    return [];
  }
}

function write(list: StoredTx[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

export const txStore = {
  all(): StoredTx[] {
    return read();
  },
  add(tx: StoredTx) {
    write([tx, ...read().filter((t) => t.hash !== tx.hash)]);
  },
  update(hash: string, patch: Partial<StoredTx>) {
    write(read().map((t) => (t.hash === hash ? { ...t, ...patch } : t)));
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    if (typeof window !== "undefined") {
      const onStorage = (e: StorageEvent) => e.key === KEY && fn();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(fn);
        window.removeEventListener("storage", onStorage);
      };
    }
    return () => listeners.delete(fn);
  },
};

export function useTxHistory(): StoredTx[] {
  return useSyncExternalStore(
    (cb) => txStore.subscribe(cb),
    () => txStore.all(),
    () => [],
  );
}
