// Reactive, persisted stores for user-created expenses and completed settlements.
// Combines with the seed data in nest-data so every screen reflects the same state.

import { useSyncExternalStore, useMemo } from "react";
import {
  expenses as seedExpenses,
  settlements as seedSettlements,
  activity as seedActivity,
  computeBalances as baseComputeBalances,
  getMember,
  type Expense,
  type Settlement,
  type ActivityEvent,
  type Debt,
} from "./nest-data";

function makeStore<T>(key: string) {
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;

  const read = (): T[] => {
    if (cache) return cache;
    if (typeof window === "undefined") return (cache = []);
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      cache = [];
    }
    return cache!;
  };

  const write = (list: T[]) => {
    cache = list;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(list));
    }
    listeners.forEach((l) => l());
  };

  return {
    all: read,
    add: (item: T) => write([item, ...read()]),
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

function useStore<T>(store: ReturnType<typeof makeStore<T>>): T[] {
  return useSyncExternalStore(store.subscribe, store.all, () => [] as T[]);
}

export function useExpenses(): Expense[] {
  const extras = useStore(expenseStore);
  return useMemo(
    () => [...extras, ...seedExpenses].sort((a, b) => b.date.localeCompare(a.date)),
    [extras],
  );
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
  return useMemo(
    () => baseComputeBalances(expenses, settlements),
    [expenses, settlements],
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
