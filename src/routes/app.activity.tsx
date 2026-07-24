import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { activity, fmtRelative, fmtUSD, getMember } from "@/lib/nest-data";
import { Activity as ActivityIcon, ArrowLeftRight, Receipt, UserPlus } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  head: () => ({
    meta: [
      { title: "Activity · Nest" },
      { name: "description", content: "A live feed of every expense, settlement, and change in your household." },
      { property: "og:title", content: "Activity · Nest" },
      { property: "og:description", content: "A live feed of every household update." },
    ],
  }),
  component: ActivityPage,
});

function iconFor(kind: string) {
  if (kind === "settlement") return ArrowLeftRight;
  if (kind === "member") return UserPlus;
  return Receipt;
}

function ActivityPage() {
  return (
    <AppShell title="Activity">
      <div className="rounded-2xl border border-border bg-background">
        <ul>
          {activity.map((a, i) => {
            const m = getMember(a.actorId);
            const Icon = iconFor(a.kind);
            return (
              <li key={a.id} className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="relative">
                  <MemberAvatar member={m} size={36} />
                  <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-surface">
                    <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{m.name}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{fmtRelative(a.date)}</div>
                </div>
                {a.amount && <div className="text-sm font-semibold">{fmtUSD(a.amount)}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
