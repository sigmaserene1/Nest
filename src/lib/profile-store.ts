// Local profile: the display name the connected wallet owner chose.
// Persisted in localStorage, reactive across the app.

import { useSyncExternalStore } from "react";

const KEY = "nest.profile.displayName";

const listeners = new Set<() => void>();
let cache: string | null | undefined;

function read(): string | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return (cache = null);
  try {
    const raw = localStorage.getItem(KEY);
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
  if (typeof window !== "undefined") {
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useDisplayName(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
