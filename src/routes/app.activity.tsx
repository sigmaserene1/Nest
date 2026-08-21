import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { getMember, fmtUSD, fmtRelative, categoryMeta } from "@/lib/nest-data";
import { useHouseholdActivity } from "@/lib/chain/nest-chain";
import { EmptyState } from "@/components/nest/feedback";
import { Stagger, Item } from "@/components/nest/motion";
import { ArrowLeftRight, UserPlus, Receipt, Send } from "lucide-react";

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

const filters = ["All", "Expenses", "Payments", "Members"] as const;

function ActivityPage() {
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const activity = useHouseholdActivity();

  const filtered = activity.filter((a) => {
    if (f === "All") return true;
    if (f === "Expenses") return a.kind === "expense";
    if (f === "Payments") return a.kind === "settlement" || a.kind === "transfer";
    return a.kind === "member";
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
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
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
          {filtered.map((a, i) => {
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
                className={`flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted/50 ${i !== filtered.length - 1 ? "border-b border-border/60" : ""}`}
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
                    className={`text-sm font-bold tabular-nums ${
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
            description="Add an expense or settle up to write your first onchain event."
          />
        )}
      </Card>
    </AppShell>
  );
}
