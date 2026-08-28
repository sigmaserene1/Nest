// Shared types + presentation helpers for Nest.
// All financial application state lives onchain in NestTreasuryV2 — there is
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
  admin?: boolean;
};

export const CATEGORIES = [
  "Rent",
  "Groceries",
  "Utilities",
  "Internet",
  "Dining",
  "Other",
] as const;
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
  referenceId?: `0x${string}`;
};

export type ActivityEvent = {
  id: string;
  kind: "treasury" | "expense" | "settlement" | "member" | "transfer" | "policy" | "agent";
  actorId: string;
  counterpartyId?: string;
  text: string;
  date: string;
  amount?: number;
  category?: Category;
  memoId?: `0x${string}`;
};

export type Debt = { fromId: string; toId: string; amount: number };

/** Mirrors the contract's deterministic creditor order for preview surfaces. */
export function computeNetDebts(members: Member[], net: Record<string, number>): Debt[] {
  const creditors = members
    .map((member) => ({ id: member.id, amount: Math.max(0, net[member.id] ?? 0) }))
    .filter((entry) => entry.amount > 0.000001);
  const debts: Debt[] = [];

  for (const debtor of members) {
    let remaining = Math.max(0, -(net[debtor.id] ?? 0));
    for (const creditor of creditors) {
      if (remaining <= 0.000001 || creditor.amount <= 0.000001) continue;
      const amount = Math.min(remaining, creditor.amount);
      debts.push({ fromId: debtor.id, toId: creditor.id, amount: +amount.toFixed(6) });
      remaining -= amount;
      creditor.amount -= amount;
    }
  }

  return debts;
}

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
export function makeMember(address: string, name?: string, admin = false): Member {
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
    admin,
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

// ----------------------------------------------------------------- formatting

export function fmtUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
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
