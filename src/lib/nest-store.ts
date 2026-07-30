// Reactive, persisted stores for user-created expenses and completed settlements.
// Combines with the seed data in nest-data so every screen reflects the same state.

import { useSyncExternalStore, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  members as seedMembers,
  computeBalances as baseComputeBalances,
  getMember,
  setRuntimeMembers,
  type Expense,
  type Settlement,
  type ActivityEvent,
  type Debt,
  type Member,
} from "./nest-data";
import { currentUserId } from "./nest-data";
import { useDisplayName } from "./profile-store";
import {
  insertRoommate,
  deleteRoommateRow,
  remoteMemberId,
  useRemoteRoommates,
} from "./nest-remote";

// Every store is scoped to the connected wallet, so one account never sees
// another account's expense history (and there is no shared demo history).
let activeWallet: string | null = null;
const scopeListeners = new Set<() => void>();

export function setStoreWallet(address?: string | null) {
  const next = address ? address.toLowerCase() : null;
  if (next === activeWallet) return;
  activeWallet = next;
  scopeListeners.forEach((l) => l());
}

/** Keeps all local stores scoped to the connected wallet. Mount once in the app layout. */
export function useNestScope() {
  const { address } = useAccount();
  useEffect(() => {
    setStoreWallet(address);
  }, [address]);
}

function makeStore<T>(baseKey: string) {
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;
  let cachedScope: string | null | undefined;

  const scopedKey = () => `${baseKey}:${activeWallet ?? "guest"}`;

  const read = (): T[] => {
    if (cache && cachedScope === activeWallet) return cache;
    cachedScope = activeWallet;
    if (typeof window === "undefined") return (cache = []);
    try {
      const raw = localStorage.getItem(scopedKey());
      cache = raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      cache = [];
    }
    return cache!;
  };

  const write = (list: T[]) => {
    cache = list;
    cachedScope = activeWallet;
    if (typeof window !== "undefined") {
      localStorage.setItem(scopedKey(), JSON.stringify(list));
    }
    listeners.forEach((l) => l());
  };


  return {
    all: read,
    add: (item: T) => write([item, ...read()]),
    update: (id: string, patch: Partial<T>) => {
      const list = read();
      const idx = list.findIndex((i) => (i as { id?: string }).id === id);
      if (idx === -1) return false;
      const next = [...list];
      next[idx] = { ...next[idx], ...patch };
      write(next);
      return true;
    },
    remove: (id: string) => {
      const list = read();
      const next = list.filter((i) => (i as { id?: string }).id !== id);
      if (next.length === list.length) return false;
      write(next);
      return true;
    },
    clear: () => write([]),

    subscribe(fn: () => void) {
      listeners.add(fn);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = null;
          fn();
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(fn);
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
  };
}

export const expenseStore = makeStore<Expense>("nest.expenses.v1");
export const settlementStore = makeStore<Settlement>("nest.settlements.v1");

// Edits/deletions applied on top of the seed expenses (which live in code, not storage).
type ExpenseOverride = { id: string; deleted?: boolean; patch?: Partial<Expense> };
export const expenseOverrideStore = makeStore<ExpenseOverride>("nest.expenseOverrides.v1");

// Roommates invited by the user (seed members stay as sample data).
export const memberStore = makeStore<Member>("nest.members.v1");

// Demo/seed roommates the user removed.
export const hiddenMemberStore = makeStore<{ id: string }>("nest.hiddenMembers.v1");

const PALETTE = [
  { color: "#EC4899", gradient: "linear-gradient(135deg,#f9a8d4,#ec4899)", emoji: "🌸" },
  { color: "#0EA5E9", gradient: "linear-gradient(135deg,#7dd3fc,#0284c7)", emoji: "🌊" },
  { color: "#8B5CF6", gradient: "linear-gradient(135deg,#c4b5fd,#7c3aed)", emoji: "🪐" },
  { color: "#14B8A6", gradient: "linear-gradient(135deg,#5eead4,#0d9488)", emoji: "🍀" },
  { color: "#F97316", gradient: "linear-gradient(135deg,#fdba74,#ea580c)", emoji: "🔥" },
];

export function isValidEvmAddress(a: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(a.trim());
}

export type AddRoommateResult = { ok: true; member: Member } | { ok: false; error: string };

/**
 * Adds a roommate. When a wallet is connected the roommate is stored onchain-identity-wide
 * in Lovable Cloud (so the person added also sees you), otherwise locally.
 */
export async function addRoommate(
  nameRaw: string,
  walletRaw: string,
  owner?: { wallet?: string | null; name?: string },
): Promise<AddRoommateResult> {
  const name = nameRaw.trim();
  const wallet = walletRaw.trim();
  if (!name) return { ok: false, error: "Please enter a full name." };
  if (name.length > 60) return { ok: false, error: "Name must be under 60 characters." };
  if (!isValidEvmAddress(wallet)) return { ok: false, error: "Enter a valid Arc wallet address (0x…)." };
  if (owner?.wallet && owner.wallet.toLowerCase() === wallet.toLowerCase()) {
    return { ok: false, error: "That's your own wallet address." };
  }

  const existing = [...seedMembers, ...memberStore.all()];
  if (existing.some((m) => m.wallet?.toLowerCase() === wallet.toLowerCase())) {
    return { ok: false, error: "That wallet address is already a roommate." };
  }

  const skin = PALETTE[memberStore.all().length % PALETTE.length];
  const member: Member = {
    id: owner?.wallet ? remoteMemberId(wallet) : `um-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    handle: `@${name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    wallet,
    ...skin,
  };

  if (owner?.wallet) {
    const res = await insertRoommate({
      ownerWallet: owner.wallet,
      ownerName: owner.name || "Roommate",
      wallet,
      name,
    });
    if (!res.ok) return res;
    return { ok: true, member };
  }

  memberStore.add(member);
  return { ok: true, member };
}

export function removeRoommate(id: string, remoteRowId?: string) {
  if (remoteRowId) {
    void deleteRoommateRow(remoteRowId);
    return;
  }
  if (memberStore.remove(id)) return;
  // Seed/demo roommate — hide it locally so it disappears everywhere.
  if (!hiddenMemberStore.all().some((h) => h.id === id)) hiddenMemberStore.add({ id });
}

export function useCustomMembers(): Member[] {
  const local = useStore(memberStore);
  const { members: remote } = useRemoteRoommates();
  return useMemo(() => [...local, ...remote], [local, remote]);
}

export function useMembers(): Member[] {
  const custom = useStore(memberStore);
  const hidden = useStore(hiddenMemberStore);
  const displayName = useDisplayName();
  const { members: remote, myWallet } = useRemoteRoommates();
  return useMemo(() => {
    const hiddenIds = new Set(hidden.map((h) => h.id));
    const seeded = seedMembers
      .filter((m) => m.id === currentUserId || !hiddenIds.has(m.id))
      .map((m) =>
        m.id === currentUserId
          ? {
              ...m,
              wallet: myWallet ?? m.wallet,
              name: displayName ?? m.name,
              handle: displayName ? `@${displayName.split(" ")[0].toLowerCase()}` : m.handle,
            }
          : m,
      );
    const list = [...seeded, ...custom];
    const seen = new Set(list.map((m) => m.wallet?.toLowerCase()).filter(Boolean) as string[]);
    for (const r of remote) {
      const w = r.wallet!.toLowerCase();
      if (seen.has(w)) continue;
      seen.add(w);
      list.push(r);
    }
    setRuntimeMembers(list);
    return list;
  }, [custom, hidden, remote, myWallet, displayName]);
}





const EMPTY: unknown[] = [];

function useStore<T>(store: ReturnType<typeof makeStore<T>>): T[] {
  return useSyncExternalStore(store.subscribe, store.all, () => EMPTY as T[]);
}

export function useExpenses(): Expense[] {
  const extras = useStore(expenseStore);
  const overrides = useStore(expenseOverrideStore);
  return useMemo(() => {
    const map = new Map(overrides.map((o) => [o.id, o]));
    return [...extras, ...seedExpenses]
      .filter((e) => !map.get(e.id)?.deleted)
      .map((e) => {
        const patch = map.get(e.id)?.patch;
        return patch ? { ...e, ...patch } : e;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [extras, overrides]);
}


export function useSettlements(): Settlement[] {
  const extras = useStore(settlementStore);
  return useMemo(
    () => [...extras, ...seedSettlements].sort((a, b) => b.date.localeCompare(a.date)),
    [extras],
  );
}

export function useComputedBalances(): { net: Record<string, number>; debts: Debt[] } {
  const expenses = useExpenses();
  const settlements = useSettlements();
  const allMembers = useMembers();
  return useMemo(
    () => baseComputeBalances(expenses, settlements),
    [expenses, settlements, allMembers],
  );
}


export function useHouseholdActivity(): ActivityEvent[] {
  const extraExpenses = useStore(expenseStore);
  const extraSettlements = useStore(settlementStore);

  return useMemo(() => {
    const fromExpenses: ActivityEvent[] = extraExpenses.map((e) => ({
      id: `ex-${e.id}`,
      kind: "expense",
      actorId: e.payerId,
      text: `added ${e.title}`,
      amount: e.amount,
      category: e.category,
      date: new Date(e.date).toISOString(),
    }));
    const fromSettlements: ActivityEvent[] = extraSettlements.map((s) => {
      const to = getMember(s.toId);
      return {
        id: `st-${s.id}`,
        kind: "settlement",
        actorId: s.fromId,
        text: `settled with ${to.name.split(" ")[0]}`,
        amount: s.amount,
        date: new Date(s.date).toISOString(),
      };
    });
    return [...fromExpenses, ...fromSettlements, ...seedActivity].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
  }, [extraExpenses, extraSettlements]);
}

export function addExpense(input: Omit<Expense, "id" | "date"> & { date?: string }): Expense {
  const expense: Expense = {
    id: `ux-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: input.date ?? new Date().toISOString(),
    title: input.title,
    category: input.category,
    amount: input.amount,
    payerId: input.payerId,
    splitAmong: input.splitAmong,
    note: input.note,
  };
  expenseStore.add(expense);
  return expense;
}

export function recordSettlement(input: {
  fromId: string;
  toId: string;
  amount: number;
  txHash: string;
}): Settlement {
  const s: Settlement = {
    id: `us-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    fromId: input.fromId,
    toId: input.toId,
    amount: input.amount,
    txHash: input.txHash,
    status: "confirmed",
    date: new Date().toISOString(),
  };
  settlementStore.add(s);
  return s;
}

export function updateExpense(id: string, patch: Partial<Omit<Expense, "id">>): void {
  if (expenseStore.update(id, patch)) return;
  const existing = expenseOverrideStore.all().find((o) => o.id === id);
  if (existing) expenseOverrideStore.update(id, { patch: { ...existing.patch, ...patch } });
  else expenseOverrideStore.add({ id, patch });
}

export function deleteExpense(id: string): void {
  if (expenseStore.remove(id)) return;
  const existing = expenseOverrideStore.all().find((o) => o.id === id);
  if (existing) expenseOverrideStore.update(id, { deleted: true });
  else expenseOverrideStore.add({ id, deleted: true });
}
