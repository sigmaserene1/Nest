import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Fingerprint, ListTree, Radio, ShieldCheck, Users } from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { useNestChain } from "@/lib/chain/nest-chain";
import { fmtRelative, fmtUSD, getMember, shortAddress, type ActivityEvent } from "@/lib/nest-data";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
  head: () => ({ meta: [{ title: "Contract activity · Nest" }] }),
});

const filters = ["All", "Ledger", "Settlement", "Agents", "Access"] as const;

function ActivityPage() {
  const { activity } = useNestChain();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const filtered = activity.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Ledger") return item.kind === "expense" || item.kind === "treasury";
    if (filter === "Settlement") return item.kind === "settlement" || item.kind === "transfer";
    if (filter === "Agents") return item.kind === "agent" || item.kind === "policy";
    return item.kind === "member";
  });

  return (
    <AppShell
      greeting={
        <div>
          <div className="protocol-label">Contract event projection</div>
          <h1 className="mt-2 text-2xl font-semibold">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No browser-generated events. This timeline is decoded from Treasury V2 state.
          </p>
        </div>
      }
    >
      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-emerald-300" /> {activity.length} recent contract
            events
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-2.5 py-2 text-[11px] font-medium ${filter === item ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No matching contract events.
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
}

function ActivityRow({ item }: { item: ActivityEvent }) {
  const actor = getMember(item.actorId);
  const config =
    item.kind === "agent"
      ? { icon: Bot, color: "text-sky-300", bg: "bg-sky-400/10" }
      : item.kind === "policy"
        ? { icon: ShieldCheck, color: "text-violet-300", bg: "bg-violet-400/10" }
        : item.kind === "settlement" || item.kind === "transfer"
          ? { icon: Fingerprint, color: "text-emerald-300", bg: "bg-emerald-400/10" }
          : item.kind === "member"
            ? { icon: Users, color: "text-amber-300", bg: "bg-amber-400/10" }
            : { icon: ListTree, color: "text-primary", bg: "bg-primary/10" };
  const Icon = config.icon;

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[36px_1fr_auto] sm:items-center">
      <span className={`grid h-9 w-9 place-items-center rounded-md ${config.bg} ${config.color}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-sm">
          <span className="font-medium">{actor.name}</span>{" "}
          <span className="text-muted-foreground">{item.text}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground">
          <span>{shortAddress(item.actorId)}</span>
          {item.counterpartyId && <span>to {shortAddress(item.counterpartyId)}</span>}
          {item.memoId && !/^0x0+$/.test(item.memoId) && (
            <span>memo {shortAddress(item.memoId)}</span>
          )}
          <span>{fmtRelative(item.date)}</span>
        </div>
      </div>
      {item.amount != null && (
        <div className="protocol-value text-sm font-medium">{fmtUSD(item.amount)}</div>
      )}
    </div>
  );
}
