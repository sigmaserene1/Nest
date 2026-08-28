// Append-only receipt ledger for completed onchain settlements.
// Records are keyed by tx hash and never mutated once written — a receipt is
// proof of a confirmed Arc Testnet transaction, so editing it makes no sense.

import { useSyncExternalStore } from "react";

export type Receipt = {
  hash: string;
  from: string;
  to: string;
  amount: number;
  /** ISO timestamp of when the transaction confirmed. */
  date: string;
  kind: "settle" | "pay" | "rent" | "qr" | "transfer";
  note?: string;
  chainId: number;
};

const KEY = "nest.receipts.v1";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

let cache: Receipt[] | null = null;

function readAll(): Receipt[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Receipt[]) : [];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

const EMPTY: Receipt[] = [];

export function getReceipts(): Receipt[] {
  return readAll();
}

/** Writes a receipt once. Existing hashes are ignored — receipts are immutable. */
export function recordReceipt(r: Receipt) {
  if (typeof window === "undefined" || !r.hash) return;
  const all = readAll();
  if (all.some((x) => x.hash.toLowerCase() === r.hash.toLowerCase())) return;
  const next = [Object.freeze({ ...r }), ...all];
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full — the onchain record is still the source of truth */
  }
  notify();
}

export function useReceipts(wallet?: string | null): Receipt[] {
  const all = useSyncExternalStore(subscribe, readAll, () => EMPTY);
  if (!wallet) return all;
  const w = wallet.toLowerCase();
  return all.filter((r) => r.from.toLowerCase() === w || r.to.toLowerCase() === w);
}
