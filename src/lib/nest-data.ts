// Shared types + presentation helpers for Nest.
// All application state lives onchain in the ExpenseManager contract — there is
// no mock data here, only formatting and deterministic avatar styling.

export type Member = {
  /** Lowercase wallet address — the canonical onchain identity. */
  id: string;
  name: string;
  handle: string;
  color: string;
  gradient: string;
  wallet?: string;
  emoji: string;
};

export const CATEGORIES = ["Rent", "Groceries", "Utilities", "Internet", "Dining", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Expense = {
  /** Onchain expense id, as a string. */
  id: string;
  title: string;
  category: Category;
  amount: number;
  payerId: string;
  splitAmong: string[];
  /** Per-participant share, keyed by lowercase address. */
  shares: Record<string, number>;
  /** Participants who have already paid their share (payer included). */
  settled: Record<string, boolean>;
  date: string;
  note?: string;
};

export type Settlement = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  txHash: string;
  status: "confirmed" | "pending";
  date: string;
};

export type ActivityEvent = {
  id: string;
  kind: "expense" | "settlement" | "member" | "transfer";
  actorId: string;
  counterpartyId?: string;
  text: string;
  date: string;
  amount?: number;
  category?: Category;
};

export type Debt = { fromId: string; toId: string; amount: number };

export function normalizeCategory(raw: string): Category {
  return (CATEGORIES as readonly string[]).includes(raw) ? (raw as Category) : "Other";
}

// ----------------------------------------------------------------- identities

const PALETTE = [
  { color: "#E53935", gradient: "linear-gradient(135deg,#ff6a5b,#e53935)", emoji: "🦊" },
  { color: "#F59E0B", gradient: "linear-gradient(135deg,#fcd34d,#f59e0b)", emoji: "🐼" },
  { color: "#10B981", gradient: "linear-gradient(135deg,#6ee7b7,#059669)", emoji: "🌿" },
  { color: "#6366F1", gradient: "linear-gradient(135deg,#a5b4fc,#6366f1)", emoji: "🎧" },
  { color: "#EC4899", gradient: "linear-gradient(135deg,#f9a8d4,#ec4899)", emoji: "🌸" },
  { color: "#0EA5E9", gradient: "linear-gradient(135deg,#7dd3fc,#0284c7)", emoji: "🌊" },
  { color: "#8B5CF6", gradient: "linear-gradient(135deg,#c4b5fd,#7c3aed)", emoji: "🪐" },
  { color: "#14B8A6", gradient: "linear-gradient(135deg,#5eead4,#0d9488)", emoji: "🍀" },
];

function hashAddr(a: string): number {
  let h = 0;
  for (let i = 2; i < a.length; i++) h = (h * 31 + a.charCodeAt(i)) >>> 0;
  return h;
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Builds the display identity for a wallet address (name comes from the contract). */
export function makeMember(address: string, name?: string): Member {
  const id = address.toLowerCase();
  const skin = PALETTE[hashAddr(id) % PALETTE.length];
  const display = name && name.trim() ? name.trim() : shortAddress(address);
  return {
    id,
    name: display,
    handle:
      name && name.trim()
        ? `@${name
            .trim()
            .split(" ")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")}`
        : shortAddress(address),
    wallet: address,
    ...skin,
  };
}

// Runtime registry so non-hook helpers can resolve a member by address.
let runtimeMembers: Member[] = [];

export function setRuntimeMembers(list: Member[]) {
  // Never replace good data with an empty polling result.
  if (list.length === 0 && runtimeMembers.length > 0) return;

  runtimeMembers = list;
}
export function setRuntimeMembers(list: Member[]) {
  // Never replace good data with an empty polling result.
  if (list.length === 0 && runtimeMembers.length > 0) return;

  runtimeMembers = list;
}

export function allMembers(): Member[] {
  return runtimeMembers;
}

export function getMember(id: string): Member {
  const key = (id ?? "").toLowerCase();
  return (
    runtimeMembers.find((m) => m.id === key) ??
    makeMember(key.startsWith("0x") ? key : "0x0000000000000000000000000000000000000000")
  );
}

// ------------------------------------------------------------------ balances

/**
 * Net position per member derived from onchain expenses.
 * Positive = the household owes them; negative = they owe the household.
 * Settled shares are excluded because settlement moves real USDC.
 */
export function computeBalances(expensesList: Expense[]): { net: Record<string, number>; debts: Debt[] } {
  const net: Record<string, number> = {};
  const pair = new Map<string, number>(); // `${debtor}|${creditor}` -> amount

  for (const m of runtimeMembers) net[m.id] = 0;

  for (const e of expensesList) {
    net[e.payerId] ??= 0;
    for (const uid of e.splitAmong) {
      if (uid === e.payerId) continue;
      if (e.settled[uid]) continue;
      const amt = e.shares[uid] ?? 0;
      if (amt <= 0) continue;
      net[uid] = (net[uid] ?? 0) - amt;
      net[e.payerId] = (net[e.payerId] ?? 0) + amt;
      const k = `${uid}|${e.payerId}`;
      pair.set(k, (pair.get(k) ?? 0) + amt);
    }
  }

  const debts: Debt[] = [];
  for (const [k, amount] of pair) {
    if (amount < 0.005) continue;
    const [fromId, toId] = k.split("|");
    debts.push({ fromId, toId, amount: +amount.toFixed(2) });
  }
  debts.sort((a, b) => b.amount - a.amount);
  return { net, debts };
}

// ----------------------------------------------------------------- formatting

export function fmtUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.round((Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const categoryMeta: Record<Category, { icon: string; color: string; bg: string }> = {
  Rent: { icon: "🏠", color: "#e53935", bg: "#ffe9e8" },
  Groceries: { icon: "🛒", color: "#f59e0b", bg: "#fff4e0" },
  Utilities: { icon: "⚡", color: "#6366f1", bg: "#eceffe" },
  Internet: { icon: "📶", color: "#3b82f6", bg: "#e5eefe" },
  Dining: { icon: "🍜", color: "#ec4899", bg: "#fde7f1" },
  Other: { icon: "✨", color: "#10b981", bg: "#dcf7ec" },
};
