// Where the shared ExpenseManager contract lives, and which room is active.
// The address is global (all roommates must point at the same deployment);
// the selected room is remembered per wallet.

import { useCallback, useSyncExternalStore } from "react";

const ADDR_KEY = "nest.contract.address";
const ROOM_KEY = (w: string) => `nest.room.${w.toLowerCase()}`;

const ENV_ADDRESS = (import.meta.env.VITE_EXPENSE_MANAGER_ADDRESS as string | undefined)?.trim();

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

export function isAddress(v: string): v is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(v.trim());
}

export function getContractAddress(): `0x${string}` | null {
  if (ENV_ADDRESS && isAddress(ENV_ADDRESS)) return ENV_ADDRESS as `0x${string}`;
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(ADDR_KEY);
  return v && isAddress(v) ? (v as `0x${string}`) : null;
}

export function setContractAddress(address: string) {
  if (typeof window === "undefined" || !isAddress(address)) return;
  localStorage.setItem(ADDR_KEY, address);
  notify();
}

export function useContractAddress(): `0x${string}` | null {
  return useSyncExternalStore(subscribe, getContractAddress, () => null);
}

export function getActiveRoom(wallet?: string | null): number | null {
  if (typeof window === "undefined" || !wallet) return null;
  const v = localStorage.getItem(ROOM_KEY(wallet));
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setActiveRoom(wallet: string | null | undefined, roomId: number | null) {
  if (typeof window === "undefined" || !wallet) return;
  if (roomId) localStorage.setItem(ROOM_KEY(wallet), String(roomId));
  else localStorage.removeItem(ROOM_KEY(wallet));
  notify();
}

export function useActiveRoom(wallet?: string | null) {
  const roomId = useSyncExternalStore(
    subscribe,
    () => getActiveRoom(wallet),
    () => null,
  );
  const select = useCallback((id: number | null) => setActiveRoom(wallet, id), [wallet]);
  return { roomId, select };
}

/** Shareable join code: `<contract>-<roomId>` */
export function buildJoinCode(address: string, roomId: number) {
  return `${address}-${roomId}`;
}

export function parseJoinCode(code: string): { address: `0x${string}`; roomId: number } | null {
  const m = code.trim().match(/^(0x[a-fA-F0-9]{40})[-:](\d+)$/);
  if (!m) return null;
  return { address: m[1] as `0x${string}`, roomId: Number(m[2]) };
}
