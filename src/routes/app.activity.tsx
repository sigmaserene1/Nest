import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { TxHashPill } from "@/components/nest/chain";
import { activity, getMember, fmtUSD, fmtRelative, categoryMeta, mockTxHash } from "@/lib/nest-data";
import { ArrowLeftRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
  head: () => ({ meta: [{ title: "Activity · Nest" }, { name: "description", content: "Everything happening in your home." }] }),
});

const filters = ["All", "Expenses", "Payments", "Members"] as const;

function ActivityPage() {
  const [f, setF] = useState<(typeof filters)[number]>("All");

  const filtered = activity.filter((a) => {
    if (f === "All") return true;
    if (f === "Expenses") return a.kind === "expense";
    if (f === "Payments") return a.kind === "settlement";
    return a.kind === "member";
  });

  return (
    <AppShell greeting={<div><div className="text-sm font-medium text-muted-foreground">Live feed</div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Activity</h1></div>}>
      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {filters.map((c) => (
          <button
            key={c}
            onClick={() => setF(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              f === c ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-black/[0.04]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="mt-5 !p-2">
        <ul>
          {filtered.map((a, i) => {
            const m = getMember(a.actorId);
            const meta = a.category ? categoryMeta[a.category] : null;
            const icon =
              a.kind === "settlement" ? <ArrowLeftRight className="h-4 w-4" /> :
              a.kind === "member" ? <UserPlus className="h-4 w-4" /> : null;
            return (
              <li key={a.id} className={`relative flex items-center gap-3 p-3 ${i !== filtered.length - 1 ? "border-b border-border/60" : ""}`}>
                <div className="relative">
                  <MemberAvatar member={m} size={42} />
                  <span className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] shadow-sm ring-1 ring-black/5 ${a.kind === "settlement" ? "text-emerald-600" : "text-foreground"}`}>
                    {meta ? meta.icon : icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">{m.name.split(" ")[0]}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{fmtRelative(a.date)}</span>
                    {a.kind === "settlement" && <TxHashPill hash={mockTxHash(a.id)} />}
                  </div>
                </div>
                {a.amount != null && (
                  <div className={`text-sm font-bold tabular-nums ${a.kind === "settlement" ? "text-emerald-600" : ""}`}>
                    {a.kind === "settlement" ? "+" : ""}{fmtUSD(a.amount)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </AppShell>
  );
}
