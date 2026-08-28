// Client selection for a Nest Treasury V2 deployment. The selected address is
// only navigation state; balances, members, policies, receipts, and activity
// remain onchain in the selected treasury contract.

import { useCallback, useSyncExternalStore } from "react";

const CONTRACT_KEY = "nest.treasury.v2";
const configuredAddress = (import.meta.env.VITE_NEST_TREASURY_ADDRESS as string | undefined) ?? "";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (typeof window !== "undefined") window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") window.removeEventListener("storage", callback);
  };
}

export function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function getContractAddress(): `0x${string}` | null {
  if (typeof window !== "undefined") {
    const selected = window.localStorage.getItem(CONTRACT_KEY);
    if (selected && isAddress(selected)) return selected as `0x${string}`;
  }
  return isAddress(configuredAddress) ? (configuredAddress as `0x${string}`) : null;
}

export function setContractAddress(address: string) {
  if (!isAddress(address)) throw new Error("Enter a valid Arc contract address.");
  if (typeof window !== "undefined") window.localStorage.setItem(CONTRACT_KEY, address);
  notify();
}

export function clearContractAddress() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CONTRACT_KEY);
  notify();
}

export function useContractAddress(): `0x${string}` | null {
  return useSyncExternalStore(subscribe, getContractAddress, getContractAddress);
}

// Compatibility selectors for routes that still describe the selected
// treasury as a room. V2 uses one treasury per deployment, so the id is 1.
export function getActiveRoom(): number | null {
  return getContractAddress() ? 1 : null;
}

export function setActiveRoom(_wallet: string | null | undefined, roomId: number | null) {
  if (roomId == null) clearContractAddress();
}

export function useActiveRoom(_wallet?: string | null) {
  const address = useContractAddress();
  const select = useCallback((id: number | null) => {
    if (id == null) clearContractAddress();
  }, []);
  return { roomId: address ? 1 : null, select };
}

export type TreasuryInvite = { address: `0x${string}`; roomId: 1; version: 2 };

const b64url = {
  encode: (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  decode: (value: string) => atob(value.replace(/-/g, "+").replace(/_/g, "/")),
};

export function buildJoinCode(address: string, _roomId = 1) {
  return `nest-v2:${address}`;
}

export function parseJoinCode(code: string): TreasuryInvite | null {
  const modern = code.trim().match(/^nest-v2:(0x[a-fA-F0-9]{40})$/);
  if (modern) return { address: modern[1] as `0x${string}`, roomId: 1, version: 2 };

  const bare = code.trim();
  if (isAddress(bare)) return { address: bare, roomId: 1, version: 2 };
  return null;
}

export function encodeInvite(address: string, roomId = 1) {
  return b64url.encode(buildJoinCode(address, roomId));
}

export function decodeInvite(token: string): TreasuryInvite | null {
  try {
    return parseJoinCode(b64url.decode(token.trim()));
  } catch {
    return null;
  }
}

export function buildInviteLink(address: string, roomId = 1) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/app?invite=${encodeInvite(address, roomId)}`;
}

export function resolveInvite(input: string): TreasuryInvite | null {
  const raw = input.trim();
  if (!raw) return null;
  const tokenFromUrl = raw.match(/[?&]invite=([A-Za-z0-9_-]+)/)?.[1];
  return decodeInvite(tokenFromUrl ?? raw) ?? parseJoinCode(raw);
}

export function applyInvite(_wallet: string | null | undefined, invite: TreasuryInvite) {
  setContractAddress(invite.address);
}
