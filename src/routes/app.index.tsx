import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { Stagger, Item, Tap, AnimatedNumber } from "@/components/nest/motion";
import { EmptyState } from "@/components/nest/feedback";
import { ActionModal, useActionModal, type ActionMode } from "@/components/nest/action-modal";
import { ArcBadge, UsdcBadge, UsdcMark, WalletChip } from "@/components/nest/chain";
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
  ArrowDownToLine,
  ArrowLeftRight,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Home · Nest" },
      {
        name: "description",
        content:
          "Your Nest home dashboard: see what you owe, what you're owed, and settle shared costs in USDC on Arc.",
      },
      { property: "og:title", content: "Home · Nest" },
      {
        property: "og:description",
        content: "Balances, recent shared expenses and one-tap USDC settlement for your household.",
      },
      { property: "og:type", content: "website" },
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
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-[28px]">{first} 👋</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to="/app/profile" aria-label="Your profile" className="active:scale-[0.95]">
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
  const settlementShortfall = Math.max(0, iOwe - wallet.usdcBalance);

  return (
    <AppShell greeting={<Greeting />} onFabClick={() => action.open("send")}>
      {/* Hero wallet card */}
      <section


        className="mt-6"
      >
        <div className="nest-wallet-panel relative overflow-hidden rounded-[28px] p-5 sm:p-6">

          <div className="relative flex items-center justify-between">
            <ArcBadge variant="light" />
            <div className="flex items-center gap-2">
              <UsdcBadge />
            </div>
          </div>

          <div className="relative mt-8">
            <div className="text-[11px] uppercase tracking-widest text-wallet-foreground/60">
              Available balance
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="text-4xl font-bold tracking-[-0.04em] tabular-nums sm:text-5xl">
                {wallet.isConnected && wallet.isOnArc ? (
                  <AnimatedNumber value={wallet.usdcBalance} decimals={2} />
                ) : (
                  "—"
                )}
              </div>
              <UsdcMark size={40} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-wallet-foreground/60">
              {wallet.address && <WalletChip address={wallet.address} variant="dark" />}
              <span>
                {wallet.isConnected
                  ? wallet.isOnArc
                    ? wallet.isBalanceFromCache
                      ? `Last verified · refreshing ${wallet.arcChain.name}`
                      : `Live on ${wallet.arcChain.name}`
                    : "Wrong network"
                  : "Connect your wallet to see your live balance"}
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-wallet-foreground/10 p-3 backdrop-blur sm:gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-wallet-foreground/60">Net</div>
              <div className={`mt-0.5 text-sm font-bold tabular-nums ${myNet >= 0 ? "text-wallet-positive" : "text-wallet-negative"}`}>
                {myNet >= 0 ? "+" : ""}
                <AnimatedNumber value={Math.abs(myNet)} prefix="$" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-wallet-foreground/60">You owe</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-wallet-negative">
                <AnimatedNumber value={iOwe} prefix="$" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-wallet-foreground/60">To receive</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums text-wallet-positive">
                <AnimatedNumber value={owedToMe} prefix="$" />
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex items-center gap-3">
            <Button variant="ghost"
              onClick={() => action.open("settle")}
              className="group flex flex-1 items-center justify-center gap-1.5 h-11 rounded-full btn-gradient text-xs font-bold sm:text-[13px]"
            >
              Settle Now
              {iOwe > 0 && (
                <span className="rounded-full bg-wallet-foreground/25 px-2 py-0.5 text-[10px] font-bold">
                  {fmtUSD(iOwe)}
                </span>
              )}
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            <Button variant="ghost"
              onClick={() => action.open("send")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wallet-foreground/10 text-wallet-foreground backdrop-blur transition duration-200 hover:bg-wallet-foreground/20 active:scale-95"
              aria-label="Send"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </Button>
          </div>

        </div>
      </section>

      {/* Quick actions — compact five-up strip on phones */}
      <Stagger className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        <QuickPill
          onClick={() => action.open("send")}
          label="Send"
          icon={<Send className="h-[17px] w-[17px]" />}
          tint="bg-brand/10 text-brand"
        />
        <QuickPill
          onClick={() => action.open("request")}
          label="Request"
          icon={<Download className="h-[17px] w-[17px]" />}
          tint="bg-success/10 text-success"
        />
        <QuickPill
          onClick={() => action.open("split")}
          label="Split"
          icon={<Split className="h-[17px] w-[17px]" />}
          tint="bg-info/10 text-info"
        />

        <QuickPill
          onClick={() => action.open("scan")}
          label="Scan QR"
          icon={<QrCode className="h-[17px] w-[17px]" />}
          tint="bg-warning/10 text-warning"
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
      <section className="mt-6">
        <div className="card-premium relative overflow-hidden p-5">
          <div className="relative flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
              <Sparkles className="h-3 w-3" /> Monthly insight
            </span>
            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="relative mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                You spent this month
              </div>
              <div className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {fmtUSD(myShare)}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                Household total {fmtUSD(monthlySpend)} · Most on {topCat?.[0] ?? "—"}{" "}
                {topCat ? categoryMeta[topCat[0] as keyof typeof categoryMeta]?.icon : ""}
              </div>
            </div>
            <Link
              to="/app/analytics"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-2 text-xs font-semibold transition hover:border-brand/40 hover:text-brand"
            >
              See insights <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
      <section className="mt-7">
        <h2 className="text-base font-bold">More in Nest</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <QuickLinkPill to="/app/swap" label="Swap" icon={<ArrowLeftRight className="h-[17px] w-[17px]" />} tint="bg-info/10 text-info" />
          <Button asChild variant="outline" className="h-16 justify-start rounded-2xl bg-card px-4 text-xs">
            <Link to="/app/bridge" search={{ from: "base", to: "arc", amount: settlementShortfall > 0 ? settlementShortfall.toFixed(6) : undefined, returnTo: "/app/" }}>
              <ArrowDownToLine className="h-4 w-4" />
              {settlementShortfall > 0 ? `Fund ${fmtUSD(settlementShortfall)} from another chain` : "Fund Arc from another chain"}
            </Link>
          </Button>
        </div>
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
    <Item>
      <Tap>
        <Button variant="ghost"
          type="button"
          onClick={onClick}
          className="card-premium flex h-auto min-h-16 w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center transition hover:border-brand/40 sm:flex-row sm:justify-start sm:gap-3 sm:px-3"
        >
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10 ${tint}`}>
            {icon}
          </span>
          <span className="truncate text-[10px] font-bold leading-none sm:text-xs">
            {label}
          </span>
        </Button>
      </Tap>
    </Item>
  );
}

function QuickLinkPill({
  to,
  label,
  icon,
  tint,
}: {
  to: "/app/swap";
  label: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Item>
      <Tap>
        <Link
          to={to}
          preload="intent"
          className="card-premium flex h-auto min-h-16 w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center transition hover:border-brand/40 sm:flex-row sm:justify-start sm:gap-3 sm:px-3"
        >
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10 ${tint}`}>
            {icon}
          </span>
          <span className="truncate text-[10px] font-bold leading-none sm:text-xs">
            {label}
          </span>
        </Link>
      </Tap>
    </Item>
  );
}
