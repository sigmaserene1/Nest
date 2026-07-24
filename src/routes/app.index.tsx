import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/nest/app-shell";
import { WalletButton } from "@/components/nest/wallet-button";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import {
  activity,
  computeBalances,
  currentUserId,
  expenses,
  fmtRelative,
  fmtUSD,
  getMember,
  members,
} from "@/lib/nest-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Nest" },
      { name: "description", content: "Your household at a glance — balances, recent activity, and one-tap settle up." },
      { property: "og:title", content: "Dashboard · Nest" },
      { property: "og:description", content: "Your household at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { net, debts } = computeBalances();
  const you = net[currentUserId];
  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const yourShare = expenses.reduce((s, e) => (e.splitAmong.includes(currentUserId) ? s + e.amount / e.splitAmong.length : s), 0);

  return (
    <AppShell
      title="Dashboard"
      action={
        <>
          <WalletButton />
          <Link
            to="/app/expenses"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground shadow-brand hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="h-4 w-4" /> Add expense
          </Link>
        </>
      }
    >
      {/* Balance hero */}
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Overall balance</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              {you >= 0 ? "You're owed " : "You owe "}
              <span className="text-brand">{fmtUSD(Math.abs(you))}</span>
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              across {members.length - 1} roommates · Bedford Loft
            </div>
          </div>
          <Link
            to="/app/settle"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 md:self-auto"
          >
            Settle up <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="This month" value={fmtUSD(monthTotal)} trend="+12% vs June" up />
          <Stat label="Your share" value={fmtUSD(yourShare)} trend="-4% vs June" />
          <Stat label="Settlements" value="3" trend="July" />
          <Stat label="Pending" value={String(debts.length)} trend="to settle" />
        </div>
      </div>

      {/* Two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Balances list */}
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Who owes whom</h2>
            <Link to="/app/settle" className="text-xs font-medium text-brand hover:underline">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {debts.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">All squared up 🎉</div>}
            {debts.map((d, i) => {
              const from = getMember(d.fromId);
              const to = getMember(d.toId);
              return (
                <div key={i} className="flex items-center gap-3 py-3">
                  <MemberAvatar member={from} size={32} />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{from.name}</span>
                    <span className="text-muted-foreground"> owes </span>
                    <span className="font-medium">{to.name}</span>
                  </div>
                  <div className="text-sm font-semibold">{fmtUSD(d.amount)}</div>
                  <button className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface">Settle</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link to="/app/activity" className="text-xs font-medium text-brand hover:underline">All</Link>
          </div>
          <ul className="mt-4 space-y-4">
            {activity.slice(0, 6).map((a) => {
              const m = getMember(a.actorId);
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <MemberAvatar member={m} size={28} />
                  <div className="min-w-0 flex-1 text-sm">
                    <div>
                      <span className="font-medium">{m.name}</span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{fmtRelative(a.date)}</div>
                  </div>
                  {a.amount && <div className="text-sm font-semibold">{fmtUSD(a.amount)}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Members */}
      <div className="mt-6 rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Household</h2>
          <AvatarStack members={members} size={28} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {members.map((m) => {
            const bal = net[m.id];
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <MemberAvatar member={m} size={40} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.wallet}</div>
                </div>
                <div className={`text-sm font-semibold ${bal >= 0 ? "text-[oklch(0.55_0.16_155)]" : "text-brand"}`}>
                  {bal >= 0 ? "+" : "-"}{fmtUSD(Math.abs(bal))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, trend, up }: { label: string; value: string; trend?: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </div>
      )}
    </div>
  );
}
