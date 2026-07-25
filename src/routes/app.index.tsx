import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { Stagger, Item, Tap } from "@/components/nest/motion";
import { useActionModal, type ActionMode } from "@/components/nest/action-modal";
import { ArcBadge, UsdcBadge, WalletChip, TxHashPill, BlockTicker } from "@/components/nest/chain";
import {
  members,
  activity,
  expenses,
  settlements,
  computeBalances,
  currentUserId,
  getMember,
  fmtUSD,
  fmtRelative,
  walletBalance,
  categoryMeta,
  mockTxHash,
  myWallet,
} from "@/lib/nest-data";
import {
  ArrowUpRight,
  Send,
  Download,
  Split,
  QrCode,
  Plus,
  ArrowRight,
  Sparkles,
  Bell,
  TrendingUp,
  Home as HomeIcon,
} from "lucide-react";


export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Home · Nest" },
      { name: "description", content: "Your Nest wallet on Arc Testnet." },
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
      <div className="min-w-0">
        <div className="text-sm font-medium text-muted-foreground">{greet},</div>
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[28px]">{first} 👋</h1>
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
  const iOwe = debts.filter((d) => d.fromId === currentUserId).reduce((s, d) => s + d.amount, 0);
  const monthlySpend = expenses.reduce((s, e) => s + e.amount, 0);
  const myShare = expenses.reduce((s, e) => s + e.amount / e.splitAmong.length, 0);
  const topCat = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];
  const action = useActionModal();

  return (
    <AppShell greeting={<Greeting />} onFabClick={() => action.open("send")}>

      {/* Hero wallet card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-foreground via-slate-900 to-slate-800 p-6 text-background shadow-2xl">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <ArcBadge variant="light" />
            <div className="flex items-center gap-2">
              <BlockTicker />
              <UsdcBadge />
            </div>
          </div>

          <div className="relative mt-8">
            <div className="text-[11px] uppercase tracking-widest text-background/60">Available balance</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-5xl font-bold tracking-tight tabular-nums">{walletBalance.toFixed(2)}</div>
              <div className="text-sm font-semibold text-background/70">USDC</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-background/60">
              <WalletChip address={myWallet} variant="dark" />
              <span>≈ {fmtUSD(walletBalance)}</span>
            </div>
          </div>

          <div className="relative mt-7 flex items-center gap-3">
            <button
              onClick={() => action.open("settle")}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-bold text-white shadow-brand transition hover:brightness-110"
            >
              Settle Up
              {iOwe > 0 && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">{fmtUSD(iOwe)}</span>
              )}
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button onClick={() => action.open("send")} className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white/10 text-background backdrop-blur transition hover:bg-white/20" aria-label="Send">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Quick action pills */}
      <Stagger className="mt-5 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <QuickPill onClick={() => action.open("send")} label="Send" icon={<Send className="h-[18px] w-[18px]" />} tint="bg-brand/10 text-brand" />
        <QuickPill onClick={() => action.open("request")} label="Request" icon={<Download className="h-[18px] w-[18px]" />} tint="bg-emerald-500/10 text-emerald-600" />
        <QuickPill onClick={() => action.open("split")} label="Split" icon={<Split className="h-[18px] w-[18px]" />} tint="bg-indigo-500/10 text-indigo-600" />
        <QuickPill onClick={() => action.open("rent")} label="Pay Rent" icon={<HomeIcon className="h-[18px] w-[18px]" />} tint="bg-rose-500/10 text-rose-600" />
        <QuickPill onClick={() => action.open("scan")} label="Scan QR" icon={<QrCode className="h-[18px] w-[18px]" />} tint="bg-amber-500/10 text-amber-600" />

      </Stagger>

      {/* Roommate carousel */}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Roommates</h2>
          <Link to="/app/members" className="text-xs font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="mt-3 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {members.map((m) => {
            const balance = net[m.id] ?? 0;
            const positive = balance >= 0;
            const isMe = m.id === currentUserId;
            return (
              <Tap key={m.id} className="snap-start">
                <div className="flex w-[128px] flex-col items-center rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/[0.03]">
                  <div className="relative">
                    <MemberAvatar member={m} size={58} />
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-xs shadow-sm ring-1 ring-black/5">
                      {m.emoji}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold">{isMe ? "You" : m.name.split(" ")[0]}</div>
                  <div
                    className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      positive ? "bg-emerald-50 text-emerald-600" : "bg-brand/10 text-brand"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {fmtUSD(balance)}
                  </div>
                </div>
              </Tap>
            );
          })}
          <Tap className="snap-start">
            <Link
              to="/app/members"
              className="flex h-full w-[128px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/25 p-4 text-muted-foreground transition hover:border-brand hover:text-brand"
            >
              <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-muted/60">
                <Plus className="h-5 w-5" />
              </div>
              <div className="mt-3 text-xs font-semibold">Invite</div>
            </Link>
          </Tap>
        </div>
      </section>

      {/* Monthly insight */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-6"
      >
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3 w-3" /> Monthly insight
            </span>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </div>
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-white/70">You spent this month</div>
            <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{fmtUSD(myShare)}</div>
            <div className="mt-1 text-xs text-white/80">
              Household total {fmtUSD(monthlySpend)} · Most on {topCat?.[0] ?? "—"} {topCat ? categoryMeta[topCat[0] as keyof typeof categoryMeta]?.icon : ""}
            </div>
          </div>
          <Link
            to="/app/analytics"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
          >
            See insights <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.section>

      {/* Recent activity */}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent activity</h2>
          <Link to="/app/activity" className="text-xs font-semibold text-brand">
            See all
          </Link>
        </div>
        <Stagger className="mt-3 space-y-2.5">
          {activity.slice(0, 5).map((a) => {
            const m = getMember(a.actorId);
            const meta = a.category ? categoryMeta[a.category] : null;
            const isIncoming = a.kind === "settlement";
            return (
              <Item key={a.id}>
                <Tap>
                  <div className="flex items-center gap-3 rounded-[20px] bg-white p-3.5 shadow-card ring-1 ring-black/[0.03] transition hover:-translate-y-0.5">
                    <div className="relative shrink-0">
                      <MemberAvatar member={m} size={42} />
                      {meta && (
                        <span
                          className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] ring-2 ring-white"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        <span className="font-semibold">{m.name.split(" ")[0]}</span>{" "}
                        <span className="text-muted-foreground">{a.text}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{fmtRelative(a.date)}</span>
                        {isIncoming && <TxHashPill hash={mockTxHash(a.id)} />}
                      </div>
                    </div>
                    {a.amount != null && (
                      <div
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          isIncoming ? "text-emerald-600" : "text-foreground"
                        }`}
                      >
                        {isIncoming ? "+" : ""}
                        {fmtUSD(a.amount)}
                      </div>
                    )}
                  </div>
                </Tap>
              </Item>
            );
          })}
        </Stagger>
      </section>
      <action.Modal />
    </AppShell>
  );
}

function QuickPill({
  onClick,
  label,
  icon,
  tint,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Item className="snap-start">
      <Tap>
        <button
          onClick={onClick}
          className="flex min-w-[104px] flex-col items-center gap-2 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-black/[0.03]"
        >
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </button>
      </Tap>
    </Item>
  );
}


