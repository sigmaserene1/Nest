import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { computeBalances, fmtUSD, members } from "@/lib/nest-data";
import { Copy, UserPlus, Crown } from "lucide-react";

export const Route = createFileRoute("/app/members")({
  head: () => ({
    meta: [
      { title: "Members · Nest" },
      { name: "description", content: "Manage roommates in your household, invite new members, and view connected wallets." },
      { property: "og:title", content: "Members · Nest" },
      { property: "og:description", content: "Household members and invites." },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { net } = computeBalances();
  return (
    <AppShell
      title="Members"
      action={
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground shadow-brand hover:-translate-y-0.5 transition-transform">
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Invite link</h3>
            <p className="text-xs text-muted-foreground">Anyone with this link can join Bedford Loft.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="font-mono text-xs">nest.app/join/BEDFORD-LOFT-4G7</span>
            <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
        {members.map((m, i) => {
          const bal = net[m.id];
          return (
            <div key={m.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <MemberAvatar member={m} size={44} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {m.name}
                  {i === 0 && <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand"><Crown className="h-2.5 w-2.5" /> Admin</span>}
                </div>
                <div className="text-xs text-muted-foreground">{m.handle} · {m.wallet}</div>
              </div>
              <div className={`text-sm font-semibold ${bal >= 0 ? "text-[oklch(0.55_0.16_155)]" : "text-brand"}`}>
                {bal >= 0 ? "+" : "-"}{fmtUSD(Math.abs(bal))}
              </div>
              <button className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-surface">Manage</button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
