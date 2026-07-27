// Local profile: the display name the connected wallet owner chose.
// Stored per wallet address in localStorage, reactive across the app.

import { useEffect, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";

const LEGACY_KEY = "nest.profile.displayName";
const nameKey = (w: string) => `nest.profile.displayName.${w}`;
const onboardedKey = (w: string) => `nest.profile.onboarded.${w}`;

const listeners = new Set<() => void>();
let activeWallet: string | null = null;
let cache: string | null | undefined;

function notify() {
  listeners.forEach((l) => l());
}

export function setActiveWallet(address?: string | null) {
  const next = address ? address.toLowerCase() : null;
  if (next === activeWallet) return;
  activeWallet = next;
  cache = undefined;
  notify();
}

function read(): string | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined" || !activeWallet) return (cache = null);
  try {
    let raw = localStorage.getItem(nameKey(activeWallet));
    if (!raw) {
      // one-time migration from the old single-profile key
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && legacy.trim()) {
        localStorage.setItem(nameKey(activeWallet), legacy);
        localStorage.setItem(onboardedKey(activeWallet), "1");
        localStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    cache = raw && raw.trim() ? raw : null;
  } catch {
    cache = null;
  }
  return cache;
}

export function getDisplayName(): string | null {
  return read();
}

export function setDisplayName(name: string) {
  const clean = name.trim();
  cache = clean || null;
  if (typeof window !== "undefined" && activeWallet) {
    if (clean) localStorage.setItem(nameKey(activeWallet), clean);
    else localStorage.removeItem(nameKey(activeWallet));
    localStorage.setItem(onboardedKey(activeWallet), "1");
  }
  notify();
}

/** True once the wallet has seen (and dismissed or completed) the onboarding prompt. */
export function hasOnboarded(address?: string | null): boolean {
  if (typeof window === "undefined" || !address) return true;
  try {
    return localStorage.getItem(onboardedKey(address.toLowerCase())) === "1";
  } catch {
    return true;
  }
}

export function markOnboarded(address?: string | null) {
  if (typeof window === "undefined" || !address) return;
  try {
    localStorage.setItem(onboardedKey(address.toLowerCase()), "1");
  } catch {
    /* ignore */
  }
}

/** Clears the saved profile for a wallet so onboarding can run again. */
export function clearProfile(address?: string | null) {
  if (typeof window === "undefined" || !address) return;
  const w = address.toLowerCase();
  localStorage.removeItem(nameKey(w));
  localStorage.removeItem(onboardedKey(w));
  if (activeWallet === w) cache = undefined;
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDisplayName(): string | null {
  const { address } = useAccount();
  useEffect(() => {
    setActiveWallet(address);
  }, [address]);
  return useSyncExternalStore(subscribe, read, () => null);
}
