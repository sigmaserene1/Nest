import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { members, computeBalances, currentUserId, fmtUSD } from "@/lib/nest-data";
import { Copy, Check, UserPlus, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/members")({
  component: MembersPage,
  head: () => ({ meta: [{ title: "Members · Nest" }, { name: "description", content: "Your household roommates." }] }),
});

function MembersPage() {
  const { net } = computeBalances();
  const [copied, setCopied] = useState(false);
  const invite = "nest.app/join/bedford-loft-8fJ2";

  const copy = async () => {
    try { await navigator.clipboard?.writeText(invite); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <AppShell greeting={<div><div className="text-sm font-medium text-muted-foreground">Bedford Loft</div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Members</h1></div>}>
      <Card className="mt-6 !p-6 bg-gradient-to-br from-brand to-orange-500 text-white ring-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Invite roommate</div>
            <div className="mt-1 text-lg font-bold">Send a magic link</div>
            <div className="text-xs text-white/80">They'll be able to add expenses and settle in USDC.</div>
          </div>
          <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm hover:bg-white/25">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : invite}
          </button>
        </div>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {members.map((m) => {
          const bal = net[m.id] ?? 0;
          const positive = bal >= 0;
          const isMe = m.id === currentUserId;
          return (
            <Card key={m.id} className="!p-5">
              <div className="flex items-start gap-4">
                <MemberAvatar member={m} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-bold">{m.name}</div>
                    {isMe && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">You</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.handle}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">{m.wallet}</div>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 p-3">
                <span className="text-xs text-muted-foreground">Net balance</span>
                <span className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-600" : "text-brand"}`}>
                  {positive ? "+" : ""}{fmtUSD(bal)}
                </span>
              </div>
            </Card>
          );
        })}

        <button className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border p-5 text-sm font-semibold text-muted-foreground transition hover:border-brand hover:text-brand">
          <UserPlus className="h-4 w-4" /> Invite roommate
        </button>
      </div>
    </AppShell>
  );
}
