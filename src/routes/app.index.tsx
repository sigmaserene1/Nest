import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import {
  members,
  expenses,
  activity,
  computeBalances,
  currentUserId,
  getMember,
  fmtUSD,
  fmtRelative,
  walletBalance,
  categoryMeta,
} from "@/lib/nest-data";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus, ArrowLeftRight, UserPlus, Sparkles, Bell } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Home · Nest" },
      { name: "description", content: "Your household at a glance." },
    ],
  }),
});

function Greeting() {
  const me = getMember(currentUserId);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = me.name.split(" ")[0];
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-muted-foreground">{greet}, {first}</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Welcome home 👋</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="glass grid h-11 w-11 place-items-center rounded-2xl" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <Link to="/app/members" aria-label="Profile">
          <MemberAvatar member={me} size={44} ring />
        </Link>
      </div>
    </div>
  );
}

function Dashboard() {
  const { net, debts } = computeBalances();
  const myNet = net[currentUserId] ?? 0;
  const iOwe = debts.filter((d) => d.fromId === currentUserId).reduce((s, d) => s + d.amount, 0);
  const owedToMe = debts.filter((d) => d.toId === currentUserId).reduce((s, d) => s + d.amount, 0);
  const monthlySpend = expenses.reduce((s, e) => s + e.amount, 0);

  const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const totalCat = catEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <AppShell greeting={<Greeting />}>
      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          label="You owe"
          value={fmtUSD(iOwe)}
          hint={iOwe > 0 ? "Tap to settle" : "All clear"}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="brand"
          to="/app/settle"
        />
        <BalanceCard
          label="You're owed"
          value={fmtUSD(owedToMe)}
          hint="From roommates"
          icon={<ArrowDownRight className="h-4 w-4" />}
          accent="success"
        />
        <BalanceCard
          label="Wallet"
          value={`${walletBalance.toFixed(2)}`}
          suffix="USDC"
          hint="On Arc"
          icon={<Wallet className="h-4 w-4" />}
          accent="dark"
        />
        <BalanceCard
          label="This month"
          value={fmtUSD(monthlySpend)}
          hint="Household total"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="soft"
        />
      </section>

      {/* Roommates + Quick actions */}
      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Your home</h2>
              <p className="text-xs text-muted-foreground">Bedford Loft · 4 members</p>
            </div>
            <Link to="/app/members" className="text-xs font-semibold text-brand">Manage</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {members.map((m) => {
              const balance = net[m.id] ?? 0;
              const positive = balance >= 0;
              return (
                <div key={m.id} className="flex flex-col items-center rounded-2xl bg-muted/50 p-4 text-center transition hover:scale-[1.02]">
                  <MemberAvatar member={m} size={52} />
                  <div className="mt-3 text-sm font-semibold">{m.name.split(" ")[0]}</div>
                  <div className={`mt-1 text-[11px] font-semibold ${positive ? "text-emerald-600" : "text-brand"}`}>
                    {positive ? "+" : ""}{fmtUSD(balance)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <QuickAction to="/app/expenses" icon={<Plus className="h-4 w-4" />} label="Add expense" desc="Split with roommates" primary />
            <QuickAction to="/app/settle" icon={<ArrowLeftRight className="h-4 w-4" />} label="Settle up" desc={`${fmtUSD(iOwe)} to pay`} />
            <QuickAction to="/app/members" icon={<UserPlus className="h-4 w-4" />} label="Invite roommate" desc="Share invite link" />
          </div>
        </Card>
      </section>

      {/* Spending + Recent */}
      <section className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Spending this month</h2>
              <p className="text-xs text-muted-foreground">{fmtUSD(totalCat)} across {catEntries.length} categories</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <Sparkles className="h-3 w-3" /> On track
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {catEntries.map(([cat, val]) => {
              const meta = categoryMeta[cat as keyof typeof categoryMeta];
              const pct = (val / totalCat) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: meta.bg }}>
                        <span className="text-base">{meta.icon}</span>
                      </span>
                      <span className="font-semibold">{cat}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{fmtUSD(val)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Recent activity</h2>
            <Link to="/app/activity" className="text-xs font-semibold text-brand">See all</Link>
          </div>
          <ul className="mt-4 space-y-2">
            {activity.slice(0, 5).map((a) => {
              const m = getMember(a.actorId);
              const meta = a.category ? categoryMeta[a.category] : null;
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted/60">
                  <div className="relative">
                    <MemberAvatar member={m} size={38} />
                    {meta && (
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] shadow-sm ring-1 ring-black/5">
                        {meta.icon}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      <span className="font-semibold">{m.name.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{fmtRelative(a.date)}</div>
                  </div>
                  {a.amount != null && (
                    <div className="text-sm font-semibold tabular-nums">{fmtUSD(a.amount)}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Debt graph */}
      <section className="mt-5">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Who owes whom</h2>
              <p className="text-xs text-muted-foreground">Simplified — {debts.length} transfers to settle everything</p>
            </div>
            <AvatarStack members={members} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {debts.map((d, i) => {
              const from = getMember(d.fromId);
              const to = getMember(d.toId);
              return (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={from} size={36} />
                    <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <MemberAvatar member={to} size={36} />
                    <div className="text-sm">
                      <div className="font-semibold">{from.name.split(" ")[0]} → {to.name.split(" ")[0]}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums">{fmtUSD(d.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function BalanceCard({ label, value, hint, icon, accent, suffix, to }: {
  label: string; value: string; hint: string; icon: React.ReactNode; suffix?: string;
  accent: "brand" | "success" | "dark" | "soft"; to?: string;
}) {
  const styles = {
    brand: "bg-gradient-to-br from-brand to-orange-500 text-white",
    success: "bg-card ring-1 ring-black/[0.04]",
    dark: "bg-gradient-to-br from-foreground to-slate-800 text-background",
    soft: "bg-card ring-1 ring-black/[0.04]",
  }[accent];
  const iconBg = {
    brand: "bg-white/20 text-white",
    success: "bg-emerald-50 text-emerald-600",
    dark: "bg-white/15 text-white",
    soft: "bg-indigo-50 text-indigo-600",
  }[accent];
  const inner = (
    <div className={`relative overflow-hidden rounded-3xl p-4 shadow-card transition hover:scale-[1.015] ${styles}`}>
      <div className="flex items-start justify-between">
        <span className={`text-[11px] font-semibold uppercase tracking-wider opacity-80`}>{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${iconBg}`}>{icon}</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        {suffix && <span className="text-xs font-semibold opacity-70">{suffix}</span>}
      </div>
      <div className="mt-1 text-[11px] opacity-70">{hint}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickAction({ to, icon, label, desc, primary = false }: {
  to: string; icon: React.ReactNode; label: string; desc: string; primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl p-3 transition hover:scale-[1.01] ${
        primary ? "bg-foreground text-background" : "bg-muted/60"
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${primary ? "bg-brand text-white" : "bg-white text-foreground shadow-sm"}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className={`text-[11px] ${primary ? "text-background/60" : "text-muted-foreground"}`}>{desc}</div>
      </div>
    </Link>
  );
}
