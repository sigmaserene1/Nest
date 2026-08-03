// Read-only fallback dataset used when the Arc public RPC is unreachable.
// It exists purely so the interface stays navigable during an RPC outage —
// no writes are possible in this state and live data resumes automatically
// as soon as the RPC answers again.

import { makeMember, type ActivityEvent, type Expense, type Member } from "@/lib/nest-data";
import type { RoomInfo } from "./nest-chain";

export const RPC_DOWN_MESSAGE =
  "Arc public RPC is temporarily unavailable. Live blockchain functionality will automatically resume when Arc public RPC becomes available.";

const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";
const C = "0x3333333333333333333333333333333333333333";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const demoRoom: RoomInfo = {
  id: 0,
  name: "Demo home",
  creator: A,
  createdAt: Math.floor(Date.now() / 1000) - 86_400 * 30,
};

export function demoMembers(me: string | null): Member[] {
  const self = me ?? A;
  return [makeMember(self, "You"), makeMember(B, "Priya"), makeMember(C, "Marcus")];
}

export function demoExpenses(me: string | null): Expense[] {
  const self = (me ?? A).toLowerCase();
  const split = [self, B, C];
  const build = (
    id: string,
    title: string,
    category: Expense["category"],
    amount: number,
    payerId: string,
    hours: number,
    settledFor: string[] = [],
  ): Expense => {
    const share = +(amount / split.length).toFixed(2);
    return {
      id,
      title,
      category,
      amount,
      payerId,
      splitAmong: split,
      shares: Object.fromEntries(split.map((p) => [p, share])),
      settled: Object.fromEntries(split.map((p) => [p, p === payerId || settledFor.includes(p)])),
      date: hoursAgo(hours),
    };
  };

  return [
    build("3", "Groceries run", "Groceries", 96, self, 6),
    build("2", "Internet — August", "Internet", 60, B, 40, [self]),
    build("1", "Rent — August", "Rent", 2400, C, 96),
  ];
}

export function demoActivity(me: string | null): ActivityEvent[] {
  const self = (me ?? A).toLowerCase();
  return [
    { id: "d3", kind: "expense", actorId: self, text: "added Groceries run", amount: 96, date: hoursAgo(6) },
    { id: "d2", kind: "settlement", actorId: self, counterpartyId: B, text: "settled a share onchain", amount: 20, date: hoursAgo(30) },
    { id: "d1", kind: "expense", actorId: C, text: "added Rent — August", amount: 2400, date: hoursAgo(96) },
  ];
}
