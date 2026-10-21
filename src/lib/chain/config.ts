// Canonical ExpenseManager selection for Arc Testnet and Arc Mainnet.
// Login/session state is shared, but each network keeps its own active
// workspace selection because onchain workspaces are separate per network.

import { useCallback, useSyncExternalStore } from "react";
import {
  getArcEnvironment,
  useArcEnvironment,
  type ArcEnvironment,
} from "@/lib/arc-network";

const ROOM_KEY = (w: string) => `nest.room.${w.toLowerCase()}`;
const NETWORK_ROOM_KEY = (environment: ArcEnvironment, w: string) =>
  `nest.room.${environment}.${w.toLowerCase()}`;

function parseRoomId(value: string | null): number | null {
  const room = value ? Number(value) : NaN;
  return Number.isFinite(room) && room > 0 ? room : null;
}

function readRoomForEnvironment(
  environment: ArcEnvironment,
  wallet: string,
): number | null {
  if (typeof window === "undefined") return null;

  const networkRoom = parseRoomId(
    localStorage.getItem(NETWORK_ROOM_KEY(environment, wallet)),
  );
  if (networkRoom) return networkRoom;

  // Older builds stored one shared room key. Import it only for Testnet,
  // where the legacy selection was created; never reuse it for Mainnet.
  if (environment !== "testnet") return null;

  const legacyRoom = parseRoomId(localStorage.getItem(ROOM_KEY(wallet)));
  if (legacyRoom) {
    localStorage.setItem(NETWORK_ROOM_KEY(environment, wallet), String(legacyRoom));
  }
  return legacyRoom;
}

export const TESTNET_EXPENSE_MANAGER_ADDRESS =
  "0x709cbad88162b999882788155cde79ade46a6d42" as const;
export const TESTNET_EXPENSE_MANAGER_DEPLOYMENT_BLOCK = 54_971_156;

const rawMainnetAddress = String(
  import.meta.env.VITE_NEST_EXPENSE_MANAGER_MAINNET_ADDRESS ??
    "0x709cbad88162b999882788155cde79ade46a6d42",
).trim();
const rawMainnetBlock = Number(
  import.meta.env.VITE_NEST_EXPENSE_MANAGER_MAINNET_BLOCK ?? 21_213_840,
);

export const MAINNET_EXPENSE_MANAGER_ADDRESS =
  /^0x[a-fA-F0-9]{40}$/.test(rawMainnetAddress)
    ? (rawMainnetAddress.toLowerCase() as `0x${string}`)
    : null;

export const MAINNET_EXPENSE_MANAGER_DEPLOYMENT_BLOCK =
  Number.isSafeInteger(rawMainnetBlock) && rawMainnetBlock > 0 ? rawMainnetBlock : 0;

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

export function getContractAddressForEnvironment(
  environment: ArcEnvironment,
): `0x${string}` | null {
  return environment === "mainnet"
    ? MAINNET_EXPENSE_MANAGER_ADDRESS
    : TESTNET_EXPENSE_MANAGER_ADDRESS;
}

export function getDeploymentBlockForEnvironment(environment: ArcEnvironment): number {
  return environment === "mainnet"
    ? MAINNET_EXPENSE_MANAGER_DEPLOYMENT_BLOCK
    : TESTNET_EXPENSE_MANAGER_DEPLOYMENT_BLOCK;
}

export function getContractAddress(): `0x${string}` | null {
  return getContractAddressForEnvironment(getArcEnvironment());
}

export function setContractAddress(address: string) {
  const canonical = getContractAddress();
  if (!canonical || !isAddress(address) || address.toLowerCase() !== canonical.toLowerCase()) {
    throw new Error("This invite belongs to a different Nest network or retired contract.");
  }
}

export function useContractAddress(): `0x${string}` | null {
  const environment = useArcEnvironment();
  return getContractAddressForEnvironment(environment);
}

export function getActiveRoom(wallet?: string | null): number | null {
  if (typeof window === "undefined" || !wallet) return null;
  return readRoomForEnvironment(getArcEnvironment(), wallet);
}

export function setActiveRoom(wallet: string | null | undefined, roomId: number | null) {
  if (typeof window === "undefined" || !wallet) return;

  const environment = getArcEnvironment();
  const networkKey = NETWORK_ROOM_KEY(environment, wallet);
  if (roomId) {
    localStorage.setItem(networkKey, String(roomId));
  } else {
    localStorage.removeItem(networkKey);
    if (environment === "testnet") localStorage.removeItem(ROOM_KEY(wallet));
  }

  notify();
}

export function useActiveRoom(wallet?: string | null) {
  const environment = useArcEnvironment();

  const roomId = useSyncExternalStore(
    subscribe,
    () => (wallet ? readRoomForEnvironment(environment, wallet) : null),
    () => null,
  );

  const select = useCallback(
    (id: number | null) => {
      if (typeof window === "undefined" || !wallet) return;

      const networkKey = NETWORK_ROOM_KEY(environment, wallet);
      if (id) {
        localStorage.setItem(networkKey, String(id));
      } else {
        localStorage.removeItem(networkKey);
        if (environment === "testnet") localStorage.removeItem(ROOM_KEY(wallet));
      }
      notify();
    },
    [environment, wallet],
  );

  return { roomId, select };
}

/** Internal join code: `<contract>-<roomId>` — never shown to users. */
export function buildJoinCode(address: string, roomId: number) {
  return `${address}-${roomId}`;
}

export function parseJoinCode(code: string): { address: `0x${string}`; roomId: number } | null {
  const m = code.trim().match(/^(0x[a-fA-F0-9]{40})[-:](\d+)$/);
  if (!m) return null;
  return { address: m[1] as `0x${string}`, roomId: Number(m[2]) };
}

const b64url = {
  encode: (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  decode: (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/")),
};

export function encodeInvite(address: string, roomId: number) {
  return b64url.encode(buildJoinCode(address, roomId));
}

export function decodeInvite(token: string) {
  try {
    return parseJoinCode(b64url.decode(token.trim()));
  } catch {
    return null;
  }
}

export function buildInviteLink(address: string, roomId: number) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/app?invite=${encodeInvite(address, roomId)}`;
}

export function resolveInvite(input: string): { address: `0x${string}`; roomId: number } | null {
  const raw = input.trim();
  if (!raw) return null;
  const fromUrl = raw.match(/[?&]invite=([A-Za-z0-9\-_]+)/);
  const token = fromUrl ? fromUrl[1] : raw;
  return decodeInvite(token) ?? parseJoinCode(raw);
}

export function applyInvite(
  wallet: string | null | undefined,
  invite: { address: string; roomId: number },
) {
  setContractAddress(invite.address);
  if (wallet) setActiveRoom(wallet, invite.roomId);
}
