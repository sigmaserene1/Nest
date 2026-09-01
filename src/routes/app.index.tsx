import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { Stagger, Item, Tap, AnimatedNumber } from "@/components/nest/motion";
import { EmptyState } from "@/components/nest/feedback";
import { ActionModal, useActionModal, type ActionMode } from "@/components/nest/action-modal";
import { ArcBadge, UsdcBadge, WalletChip, BlockTicker } from "@/components/nest/chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";

import { getMember, fmtUSD, fmtRelative, categoryMeta } from "@/lib/nest-data";
import {
  useExpenses,
  useComputedBalances,
  useHouseholdActivity,
  useMembers,
  useMe,
  useNestChain,
} from "@/lib/chain/nest-chain";
import {
  ArrowUpRight,
  Send,
  Download,
  Split,
  QrCode,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Home · Nest" },
      {
        name: "description",
        content:
          "Your Nest home dashboard: see what you owe, what you're owed, and settle shared household costs in USDC on Arc Testnet.",
      },
      { property: "og:title", content: "Home · Nest" },
      {
        property: "og:description",
        content: "Balances, recent shared expenses and one-tap USDC settlement for your household.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Greeting() {
  const { me: myId, myName: displayName } = useNestChain();
  const me = { ...getMember(myId ?? ""), name: displayName ?? "You" };
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = displayName ? displayName.split(" ")[0] : "there";
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-muted-foreground">{greet},</div>
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[28px]">{first} 👋</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/app/members" aria-label="Profile">
          <MemberAvatar member={me} size={44} ring />
        </Link>
      </div>
    </div>
  );
}

function Dashboard() {
  const members = useMembers();
  const expenses = useExpenses();
  const currentUserId = useMe();

  const activity = useHouseholdActivity();
  const { net, debts } = useComputedBalances();
  const iOwe = debts.filter((d) => d.fromId === currentUserId).reduce((s, d) => s + d.amount, 0);
  const owedToMe = debts.filter((d) => d.toId === currentUserId).reduce((s, d) => s + d.amount, 0);
  const myNet = net[currentUserId ?? ""] ?? 0;
  const monthlySpend = expenses.reduce((s, e) => s + e.amount, 0);
  const myShare = expenses.reduce((s, e) => s + e.amount / e.splitAmong.length, 0);
  const topCat = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  const action = useActionModal();
  const wallet = useArcWallet();

  return (
    <AppShell greeting={<Greeting />} onFabClick={() => action.open("send")}>
      {/* Hero wallet card */}
      <section


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
            <div className="text-[11px] uppercase tracking-widest text-background/60">
              Available balance
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-5xl font-bold tracking-tight tabular-nums">
                {wallet.isConnected && wallet.isOnArc ? (
                  <AnimatedNumber value={wallet.usdcBalance} decimals={2} />
                ) : (
                  "—"
                )}
              </div>
              <div className="text-sm font-semibold text-background/70">USDC</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-background/60">
              {wallet.address && <WalletChip address={wallet.address} variant="dark" />}
              <span>
                {wallet.isConnected
                  ? wallet.isOnArc
                    ? "Live on Arc Testnet"
                    : "Wrong network"
                  : "Connect your wallet to see your live balance"}
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-background/60">Net</div>
              <div className={`mt-0.5 text-sm font-bold tabular-nums ${myNet >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {myNet >= 0 ? "+" : ""}
                <AnimatedNumber value={Math.abs(myNet)} prefix="$" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-background/60">You owe</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-rose-300">
                <AnimatedNumber value={iOwe} prefix="$" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-background/60">To receive</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-emerald-300">
                <AnimatedNumber value={owedToMe} prefix="$" />
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex items-center gap-3">
            <button
              onClick={() => action.open("settle")}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 text-sm font-bold"
            >
              Settle Now
              {iOwe > 0 && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">
                  {fmtUSD(iOwe)}
                </span>
              )}
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              onClick={() => action.open("send")}
              className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white/10 text-background backdrop-blur transition duration-200 hover:bg-white/20 active:scale-95"
              aria-label="Send"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* Quick action pills */}
      <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickPill
          onClick={() => action.open("send")}
          label="Send"
          icon={<Send className="h-[18px] w-[18px]" />}
          tint="bg-brand/10 text-brand"
        />
        <QuickPill
          onClick={() => action.open("request")}
          label="Request"
          icon={<Download className="h-[18px] w-[18px]" />}
          tint="bg-emerald-500/10 text-emerald-600"
        />
        <QuickPill
          onClick={() => action.open("split")}
          label="Split"
          icon={<Split className="h-[18px] w-[18px]" />}
          tint="bg-indigo-500/10 text-indigo-600"
        />
        <QuickPill
          onClick={() => action.open("scan")}
          label="Scan QR"
          icon={<QrCode className="h-[18px] w-[18px]" />}
          tint="bg-amber-500/10 text-amber-600"
        />
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
                <div className="card-premium flex w-[128px] flex-col items-center p-4">
                  <div className="relative">
                    <MemberAvatar member={m} size={58} />
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-xs shadow-sm ring-1 ring-black/5">
                      {m.emoji}
                    </span>
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold">
                    {isMe ? "You" : m.name.split(" ")[0]}
                  </div>
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
      <section


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
            <div className="text-[11px] uppercase tracking-widest text-white/70">
              You spent this month
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {fmtUSD(myShare)}
            </div>
            <div className="mt-1 text-xs text-white/80">
              Household total {fmtUSD(monthlySpend)} · Most on {topCat?.[0] ?? "—"}{" "}
              {topCat ? categoryMeta[topCat[0] as keyof typeof categoryMeta]?.icon : ""}
            </div>
          </div>
          <Link
            to="/app/analytics"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
          >
            See insights <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

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
                  <div className="card-premium flex items-center gap-3 p-3.5">
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
        {activity.length === 0 && (
          <EmptyState
            emoji="🪶"
            title="No activity yet"
            description="Add a shared expense or settle up — every event lands here, straight from Arc."
          />
        )}
      </section>
      <ActionModal mode={action.mode} onClose={action.close} />
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
          className="card-premium flex min-w-[104px] flex-col items-center gap-2 p-3.5"
        >
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </button>
      </Tap>
    </Item>
  );
}
