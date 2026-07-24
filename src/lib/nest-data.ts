// Mock data for Nest — realistic household expense scenario.
// Replace with Lovable Cloud reads in the backend wiring pass.

export type Member = {
  id: string;
  name: string;
  handle: string;
  color: string;
  wallet?: string;
};

export type Expense = {
  id: string;
  title: string;
  category: "Rent" | "Groceries" | "Electricity" | "Internet" | "Other";
  amount: number; // USD
  payerId: string;
  splitAmong: string[]; // member ids
  date: string; // ISO
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
};

export const currentUserId = "u1";

export const members: Member[] = [
  { id: "u1", name: "You", handle: "@you", color: "#E41E26", wallet: "0x8f2c…41Ae" },
  { id: "u2", name: "Alex Chen", handle: "@alex", color: "#F59E0B", wallet: "0x21a9…88b2" },
  { id: "u3", name: "Priya Shah", handle: "@priya", color: "#10B981", wallet: "0x9c33…12df" },
  { id: "u4", name: "Marcus Lee", handle: "@marcus", color: "#3B82F6", wallet: "0x44e1…7a90" },
];

const allIds = members.map((m) => m.id);

export const expenses: Expense[] = [
  { id: "e1", title: "November Rent", category: "Rent", amount: 3200, payerId: "u2", splitAmong: allIds, date: "2026-07-01", note: "Landlord — Chase transfer" },
  { id: "e2", title: "Costco run", category: "Groceries", amount: 184.52, payerId: "u1", splitAmong: allIds, date: "2026-07-05" },
  { id: "e3", title: "Con Edison — July", category: "Electricity", amount: 142.18, payerId: "u3", splitAmong: allIds, date: "2026-07-08" },
  { id: "e4", title: "Verizon Fios", category: "Internet", amount: 89.99, payerId: "u4", splitAmong: allIds, date: "2026-07-10" },
  { id: "e5", title: "Trader Joe's", category: "Groceries", amount: 96.4, payerId: "u1", splitAmong: allIds, date: "2026-07-14" },
  { id: "e6", title: "Cleaning supplies", category: "Other", amount: 42.15, payerId: "u2", splitAmong: allIds, date: "2026-07-16" },
  { id: "e7", title: "Farmers market", category: "Groceries", amount: 58.9, payerId: "u3", splitAmong: allIds, date: "2026-07-19" },
  { id: "e8", title: "Dinner delivery", category: "Other", amount: 74.2, payerId: "u1", splitAmong: allIds, date: "2026-07-21" },
];

export const settlements: Settlement[] = [
  { id: "s1", fromId: "u1", toId: "u2", amount: 812.5, txHash: "0x7d9a1c…f28e", status: "confirmed", date: "2026-07-02" },
  { id: "s2", fromId: "u4", toId: "u2", amount: 800.0, txHash: "0x2b41ac…9910", status: "confirmed", date: "2026-07-02" },
  { id: "s3", fromId: "u3", toId: "u1", amount: 35.62, txHash: "0xa1b8d3…44c1", status: "confirmed", date: "2026-07-15" },
];

export const activity: ActivityEvent[] = [
  { id: "a1", kind: "expense", actorId: "u1", text: "added Dinner delivery", amount: 74.2, date: "2026-07-21T20:14:00Z" },
  { id: "a2", kind: "expense", actorId: "u3", text: "added Farmers market", amount: 58.9, date: "2026-07-19T11:02:00Z" },
  { id: "a3", kind: "expense", actorId: "u2", text: "added Cleaning supplies", amount: 42.15, date: "2026-07-16T09:30:00Z" },
  { id: "a4", kind: "settlement", actorId: "u3", text: "settled with You", amount: 35.62, date: "2026-07-15T14:22:00Z" },
  { id: "a5", kind: "expense", actorId: "u1", text: "added Trader Joe's", amount: 96.4, date: "2026-07-14T18:41:00Z" },
  { id: "a6", kind: "expense", actorId: "u4", text: "added Verizon Fios", amount: 89.99, date: "2026-07-10T10:00:00Z" },
  { id: "a7", kind: "member", actorId: "u4", text: "joined the home", date: "2026-06-28T15:00:00Z" },
];

export function getMember(id: string): Member {
  return members.find((m) => m.id === id) ?? members[0];
}

// Simplified debt graph — who owes whom, net.
export type Debt = { fromId: string; toId: string; amount: number };

export function computeBalances(): { net: Record<string, number>; debts: Debt[] } {
  const net: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const e of expenses) {
    const share = e.amount / e.splitAmong.length;
    net[e.payerId] += e.amount;
    for (const uid of e.splitAmong) net[uid] -= share;
  }
  for (const s of settlements) {
    net[s.fromId] += s.amount;
    net[s.toId] -= s.amount;
  }
  // Greedy debt simplification
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
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
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
