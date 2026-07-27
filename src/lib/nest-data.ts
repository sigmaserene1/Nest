// Mock data for Nest — realistic household expense scenario.

export type Member = {
  id: string;
  name: string;
  handle: string;
  color: string;
  gradient: string;
  wallet?: string;
  emoji: string;
};

export type Expense = {
  id: string;
  title: string;
  category: "Rent" | "Groceries" | "Utilities" | "Internet" | "Dining" | "Other";
  amount: number;
  payerId: string;
  splitAmong: string[];
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
  kind: "expense" | "settlement" | "member" | "comment";
  actorId: string;
  text: string;
  date: string;
  amount?: number;
  category?: Expense["category"];
};

export const currentUserId = "u1";

export const members: Member[] = [
  { id: "u1", name: "Arjun Mehta", handle: "@arjun", color: "#E53935", gradient: "linear-gradient(135deg,#ff6a5b,#e53935)", wallet: "0x8f2c9d1e4b7a3f52c68e19d0f7b641aE4d20c9B1", emoji: "🦊" },
  { id: "u2", name: "Alex Chen", handle: "@alex", color: "#F59E0B", gradient: "linear-gradient(135deg,#fcd34d,#f59e0b)", wallet: "0x21a9c78b3D5f19E4a6b8c72e88b23F1a90cD6E88", emoji: "🐼" },
  { id: "u3", name: "Priya Shah", handle: "@priya", color: "#10B981", gradient: "linear-gradient(135deg,#6ee7b7,#059669)", wallet: "0x9c33e5B7A1F84dc2b91e07f012Df6A8c34Eb7A21", emoji: "🌿" },
  { id: "u4", name: "Marcus Lee", handle: "@marcus", color: "#6366F1", gradient: "linear-gradient(135deg,#a5b4fc,#6366f1)", wallet: "0x44e1B7c980A3f256d81a90CB2f3E7a9014D6bC12", emoji: "🎧" },
];

const allIds = members.map((m) => m.id);

export const expenses: Expense[] = [
  { id: "e1", title: "November Rent", category: "Rent", amount: 3200, payerId: "u2", splitAmong: allIds, date: "2026-07-01", note: "Landlord transfer" },
  { id: "e2", title: "Costco run", category: "Groceries", amount: 184.52, payerId: "u1", splitAmong: allIds, date: "2026-07-05" },
  { id: "e3", title: "Con Edison — July", category: "Utilities", amount: 142.18, payerId: "u3", splitAmong: allIds, date: "2026-07-08" },
  { id: "e4", title: "Verizon Fios", category: "Internet", amount: 89.99, payerId: "u4", splitAmong: allIds, date: "2026-07-10" },
  { id: "e5", title: "Trader Joe's", category: "Groceries", amount: 96.4, payerId: "u1", splitAmong: allIds, date: "2026-07-14" },
  { id: "e6", title: "Cleaning supplies", category: "Other", amount: 42.15, payerId: "u2", splitAmong: allIds, date: "2026-07-16" },
  { id: "e7", title: "Farmers market", category: "Groceries", amount: 58.9, payerId: "u3", splitAmong: allIds, date: "2026-07-19" },
  { id: "e8", title: "Sushi night", category: "Dining", amount: 128.2, payerId: "u1", splitAmong: allIds, date: "2026-07-21", note: "Sugarfish takeout" },
  { id: "e9", title: "Movie & popcorn", category: "Dining", amount: 62.5, payerId: "u4", splitAmong: allIds, date: "2026-07-22" },
];

export const settlements: Settlement[] = [
  { id: "s1", fromId: "u1", toId: "u2", amount: 812.5, txHash: "0x7d9a1c…f28e", status: "confirmed", date: "2026-07-02" },
  { id: "s2", fromId: "u4", toId: "u2", amount: 800.0, txHash: "0x2b41ac…9910", status: "confirmed", date: "2026-07-02" },
  { id: "s3", fromId: "u3", toId: "u1", amount: 35.62, txHash: "0xa1b8d3…44c1", status: "confirmed", date: "2026-07-15" },
];

export const activity: ActivityEvent[] = [
  { id: "a1", kind: "expense", actorId: "u1", text: "added Sushi night", amount: 128.2, category: "Dining", date: "2026-07-21T20:14:00Z" },
  { id: "a2", kind: "expense", actorId: "u4", text: "added Movie & popcorn", amount: 62.5, category: "Dining", date: "2026-07-22T22:00:00Z" },
  { id: "a3", kind: "expense", actorId: "u3", text: "added Farmers market", amount: 58.9, category: "Groceries", date: "2026-07-19T11:02:00Z" },
  { id: "a4", kind: "expense", actorId: "u2", text: "added Cleaning supplies", amount: 42.15, category: "Other", date: "2026-07-16T09:30:00Z" },
  { id: "a5", kind: "settlement", actorId: "u3", text: "settled with you", amount: 35.62, date: "2026-07-15T14:22:00Z" },
  { id: "a6", kind: "expense", actorId: "u1", text: "added Trader Joe's", amount: 96.4, category: "Groceries", date: "2026-07-14T18:41:00Z" },
  { id: "a7", kind: "expense", actorId: "u4", text: "added Verizon Fios", amount: 89.99, category: "Internet", date: "2026-07-10T10:00:00Z" },
  { id: "a8", kind: "member", actorId: "u4", text: "joined Bedford Loft", date: "2026-06-28T15:00:00Z" },
];

// Runtime registry: seed members plus any roommates the user has invited.
// Kept in sync by the member store so non-hook helpers (getMember, computeBalances)
// resolve custom roommates too.
let runtimeMembers: Member[] = members;

export function setRuntimeMembers(list: Member[]) {
  runtimeMembers = list.length ? list : members;
}

export function allMembers(): Member[] {
  return runtimeMembers;
}

export function getMember(id: string): Member {
  return runtimeMembers.find((m) => m.id === id) ?? members.find((m) => m.id === id) ?? members[0];
}


export type Debt = { fromId: string; toId: string; amount: number };

export function computeBalances(
  expensesList: Expense[] = expenses,
  settlementsList: Settlement[] = settlements,
): { net: Record<string, number>; debts: Debt[] } {
  const net: Record<string, number> = Object.fromEntries(runtimeMembers.map((m) => [m.id, 0]));
  for (const e of expensesList) {
    const share = e.amount / e.splitAmong.length;
    net[e.payerId] += e.amount;
    for (const uid of e.splitAmong) net[uid] -= share;
  }
  for (const s of settlementsList) {
    net[s.fromId] += s.amount;
    net[s.toId] -= s.amount;
  }
  const creditors = Object.entries(net).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, v }));
  const debtors = Object.entries(net).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, v: -v }));
  creditors.sort((a, b) => b.v - a.v);
  debtors.sort((a, b) => b.v - a.v);
  const debts: Debt[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    debts.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: +amt.toFixed(2) });
    debtors[i].v -= amt;
    creditors[j].v -= amt;
    if (debtors[i].v < 0.01) i++;
    if (creditors[j].v < 0.01) j++;
  }
  return { net, debts };
}

export function fmtUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const walletBalance = 245.75;
export const myWallet = "0x8f2c9d1e4b7a3f52c68e19d0f7b641Ae";

export function mockTxHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hex = (h.toString(16) + "abcdef1234567890").padEnd(40, "0");
  return `0x${hex.slice(0, 40)}`;
}

export const categoryMeta: Record<Expense["category"], { icon: string; color: string; bg: string }> = {
  Rent: { icon: "🏠", color: "#e53935", bg: "#ffe9e8" },
  Groceries: { icon: "🛒", color: "#f59e0b", bg: "#fff4e0" },
  Utilities: { icon: "⚡", color: "#6366f1", bg: "#eceffe" },
  Internet: { icon: "📶", color: "#3b82f6", bg: "#e5eefe" },
  Dining: { icon: "🍜", color: "#ec4899", bg: "#fde7f1" },
  Other: { icon: "✨", color: "#10b981", bg: "#dcf7ec" },
};
