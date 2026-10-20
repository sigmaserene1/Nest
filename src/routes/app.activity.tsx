import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import {
  getMember,
  fmtUSD,
  fmtRelative,
  categoryMeta,
  type ActivityEvent,
} from "@/lib/nest-data";
import { useBridgeHistory, type BridgeHistoryEntry } from "@/lib/bridge-history";
import { useReceipts } from "@/lib/receipts-store";
import { useHouseholdActivity } from "@/lib/chain/nest-chain";
import { EmptyState } from "@/components/nest/feedback";
import { Stagger, Item } from "@/components/nest/motion";
import { ArrowLeftRight, UserPlus, Receipt, Send, Waypoints } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
  head: () => ({
    meta: [
      { title: "Activity · Nest" },
      {
        name: "description",
        content:
          "A full timeline of your household's onchain activity: expenses added, members joined and USDC settlements confirmed on Arc.",
      },
      { property: "og:title", content: "Activity · Nest" },
      {
        property: "og:description",
        content: "Every expense, member change and USDC settlement in your home, in one timeline.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const filters = ["All", "Expenses", "Payments", "Bridges", "Members"] as const;

type TimelineItem =
  | { type: "chain"; at: number; data: ActivityEvent }
  | { type: "bridge"; at: number; data: BridgeHistoryEntry };

function ActivityPage() {
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const { address } = useAccount();
  const activity = useHouseholdActivity();
  const receipts = useReceipts(address);
  const { entries: bridgeHistory } = useBridgeHistory(address);

  const timeline = useMemo<TimelineItem[]>(() => {
    const paymentKey = (item: {
      kind: string;
      actorId: string;
      counterpartyId?: string;
      amount?: number;
      date: string;
    }) =>
      [
        item.kind,
        item.actorId.toLowerCase(),
        item.counterpartyId?.toLowerCase() ?? "",
        (item.amount ?? 0).toFixed(6),
        Math.floor(new Date(item.date).getTime() / 1000),
      ].join(":");

    const recentPaymentKeys = new Set(
      activity
        .filter((item) => item.kind === "settlement" || item.kind === "transfer")
        .map(paymentKey),
    );

    const recoveredPayments: ActivityEvent[] = receipts
      .map((receipt) => {
        const kind: ActivityEvent["kind"] =
          receipt.kind === "settle" ? "settlement" : "transfer";
        return {
          id: `receipt-${receipt.hash}`,
          kind,
          actorId: receipt.from.toLowerCase(),
          counterpartyId: receipt.to.toLowerCase(),
          text:
            kind === "settlement"
              ? "settled a share onchain"
              : receipt.note
                ? `sent USDC · ${receipt.note}`
                : "sent USDC onchain",
          amount: receipt.amount,
          date: receipt.date,
        } satisfies ActivityEvent;
      })
      .filter((item) => !recentPaymentKeys.has(paymentKey(item)));

    return [
      ...activity.map((item) => ({
        type: "chain" as const,
        at: new Date(item.date).getTime(),
        data: item,
      })),
      ...recoveredPayments.map((item) => ({
        type: "chain" as const,
        at: new Date(item.date).getTime(),
        data: item,
      })),
      ...bridgeHistory.map((item) => ({
        type: "bridge" as const,
        at: item.completedAt ?? item.startedAt,
        data: item,
      })),
    ].sort((a, b) => b.at - a.at);
  }, [activity, bridgeHistory, receipts]);

  const filtered = timeline.filter((entry) => {
    if (f === "All") return true;
    if (entry.type === "bridge") return f === "Bridges" || f === "Payments";
    const a = entry.data;
    if (f === "Expenses") return a.kind === "expense";
    if (f === "Payments") return a.kind === "settlement" || a.kind === "transfer";
    if (f === "Members") return a.kind === "member";
    return false;
  });

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Live onchain feed</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Activity</h1>
        </div>
      }
    >
      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {filters.map((c) => (
          <button
            key={c}
            onClick={() => setF(c)}
            className={`min-h-9 shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              f === c ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-black/[0.04]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="mt-5 !p-2">
        <Stagger>
        <ul>
          {filtered.map((entry, i) => {
            if (entry.type === "bridge") {
              const bridge = entry.data;
              return (
                <Item
                  as="li"
                  key={`bridge-${bridge.id}`}
                  className={`flex items-start gap-3 rounded-2xl p-3.5 transition-colors hover:bg-muted/50 ${
                    i !== filtered.length - 1 ? "border-b border-border/60" : ""
                  }`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
                    <Waypoints className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-bold">
                        Bridged {bridge.amount} USDC
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          bridge.status === "complete"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : bridge.status === "error"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {bridge.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {bridge.fromName} → {bridge.toName}
                      {bridge.tool ? ` · ${bridge.tool}` : ""}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                      {bridge.burnHash ? (
                        <span>Source {bridge.burnHash.slice(0, 10)}…{bridge.burnHash.slice(-6)}</span>
                      ) : null}
                      {bridge.mintHash ? (
                        <span>Destination {bridge.mintHash.slice(0, 10)}…{bridge.mintHash.slice(-6)}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {fmtRelative(new Date(entry.at).toISOString())}
                      {bridge.recipient ? ` · To ${bridge.recipient.slice(0, 6)}…${bridge.recipient.slice(-4)}` : ""}
                    </div>
                  </div>
                </Item>
              );
            }

            const a = entry.data;
            const m = getMember(a.actorId);
            const meta = a.category ? categoryMeta[a.category] : null;
            const icon =
              a.kind === "settlement" ? (
                <ArrowLeftRight className="h-4 w-4" />
              ) : a.kind === "transfer" ? (
                <Send className="h-4 w-4" />
              ) : a.kind === "member" ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <Receipt className="h-4 w-4" />
              );
            return (
              <Item
                as="li"
                key={a.id}
                className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors hover:bg-muted/50 ${
                  i !== filtered.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <div className="relative">
                  <MemberAvatar member={m} size={42} />
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] text-foreground shadow-sm ring-1 ring-black/5">
                    {meta ? meta.icon : icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">{m.name.split(" ")[0]}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{fmtRelative(a.date)}</div>
                </div>
                {a.amount != null && (
                  <div
                    className={`shrink-0 text-right text-sm font-bold tabular-nums ${
                      a.kind === "settlement"
                        ? "text-red-500"
                        : a.kind === "transfer"
                          ? "text-emerald-600"
                          : "text-foreground"
                    }`}
                  >
                    {a.kind === "settlement" ? "-" : a.kind === "transfer" ? "+" : ""}
                    {fmtUSD(a.amount)}
                  </div>
                )}
              </Item>
            );
          })}
        </ul>
        </Stagger>
        {filtered.length === 0 && (
          <EmptyState
            emoji="📜"
            title="Nothing here yet"
            description="Expenses, payments, members and cross-chain bridges will appear here."
          />
        )}
      </Card>
    </AppShell>
  );
}
