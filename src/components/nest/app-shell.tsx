import { Link, useRouterState } from "@tanstack/react-router";
import type { ElementType, ReactNode } from "react";
import { Home, Receipt, ArrowLeftRight, Activity, Users, PieChart, Plus, ScrollText, Landmark, Bot, Waypoints, Briefcase } from "lucide-react";
import { NestLogo } from "./logo";
import { MemberAvatar } from "./avatar";
import { PageTransition } from "./motion";
import { ArcBadge, UsdcBadge, WalletChip } from "./chain";
import { WalletHeader } from "./wallet-header";
import { ThemeToggle } from "./theme-toggle";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useNestChain } from "@/lib/chain/nest-chain";
import { getMember } from "@/lib/nest-data";
import { ProfileOnboarding } from "./profile-modal";
import { RpcBanner } from "./rpc-banner";

const primary = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/expenses", label: "Expenses", icon: Receipt },
  { to: "/app/settle", label: "Settle", icon: ArrowLeftRight, center: true },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/analytics", label: "Insights", icon: PieChart },
] as const;

const desktopExtra = [
  { to: "/app/members", label: "Members", icon: Users },
  { to: "/app/agent", label: "Auto-settle agent", icon: Bot },
  { to: "/app/bridge", label: "Cross-chain deposit", icon: Waypoints },
  { to: "/app/syndicate", label: "Syndicate mode", icon: Briefcase },
  { to: "/app/receipts", label: "Receipts", icon: ScrollText },
  { to: "/app/lend", label: "Lend & Borrow", icon: Landmark },
] as const;

function useActive(path: string, exact = false) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
      {label}
    </Link>
  );
}

function BottomTab({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}) {
  const active = useActive(to, exact);
  return (
    <Link to={to} className="flex flex-1 flex-col items-center gap-1 py-2">
      <span

        className={`grid h-9 w-12 place-items-center rounded-2xl transition-all duration-300 ${active ? "bg-foreground text-background shadow-soft" : "text-muted-foreground"}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 2} />
      </span>
      <span
        className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </Link>

  );
}

export function AppShell({
  children,
  greeting,
  onFabClick,
}: {
  children: ReactNode;
  greeting?: ReactNode;
  onFabClick?: () => void;
}) {
  const { me: myId, myName: displayName } = useNestChain();
  const me = getMember(myId ?? "");
  const wallet = useArcWallet();
  const myName = displayName ?? "You";

  return (
    <div className="min-h-screen text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 flex-col p-6 xl:flex">
        <div className="glass-strong flex h-full flex-col rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <NestLogo />
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-slate-900 to-slate-800 p-4 text-background shadow-lg">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/40 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-indigo-500/30 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <ArcBadge variant="light" />
              <UsdcBadge />
            </div>
            <div className="relative mt-4">
              <div className="text-[11px] text-background/60">Wallet balance</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                {wallet.isConnected && wallet.isBalanceLoading ? (
                  <div className="h-7 w-24 animate-pulse rounded-lg bg-white/15" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight tabular-nums">
                    {wallet.isConnected && wallet.isOnArc ? wallet.usdcBalance.toFixed(2) : "—"}
                  </div>
                )}
                <span className="text-xs font-medium text-background/60">USDC</span>
              </div>
            </div>
            <div className="relative mt-3">
              {wallet.address ? (
                <WalletChip address={wallet.address} variant="dark" />
              ) : (
                <span className="text-[11px] text-background/60">Wallet not connected</span>
              )}
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {[...primary, ...desktopExtra].map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                exact={"exact" in item ? item.exact : false}
              />
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <MemberAvatar member={{ ...me, name: myName }} size={38} ring />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{myName}</div>
              <div className="mt-0.5">
                {wallet.address ? (
                  <WalletChip address={wallet.address} />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Not connected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <RpcBanner />
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <WalletHeader />
            </div>
            <ThemeToggle className="mt-1 shrink-0" />
          </div>
        </div>
        {/* Secondary sections — the bottom bar only holds the five primary tabs */}
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 pt-3 sm:px-6 xl:hidden">
          <div className="flex w-max gap-2">
            {desktopExtra.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {greeting && <div className="px-4 pt-5 sm:px-6 lg:px-8">{greeting}</div>}
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 lg:hidden">
        <div className="glass-strong relative flex items-center rounded-[28px] px-2 py-1">
          <BottomTab to="/app" label="Home" icon={Home} exact />
          <BottomTab to="/app/expenses" label="Expenses" icon={Receipt} />
          <div


            className="relative -mt-8 mx-1"
          >
            {onFabClick ? (
              <button
                onClick={onFabClick}
                className="grid h-14 w-14 place-items-center rounded-full btn-gradient animate-pulse-brand ring-4 ring-white/60"
                aria-label="Quick action"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                to="/app/settle"
                className="grid h-14 w-14 place-items-center rounded-full btn-gradient animate-pulse-brand ring-4 ring-white/60"
                aria-label="Settle up"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            )}
          </div>
          <BottomTab to="/app/activity" label="Activity" icon={Activity} />
          <BottomTab to="/app/analytics" label="Insights" icon={PieChart} />
        </div>
      </nav>

      <ProfileOnboarding />
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: As = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  [k: string]: unknown;
}) {
  return (
    <As className={`card-premium p-5 ${className}`} {...rest}>
      {children}
    </As>
  );
}
