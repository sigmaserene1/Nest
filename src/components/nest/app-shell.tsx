import { Link, useRouterState } from "@tanstack/react-router";
import type { ElementType, ReactNode } from "react";
import {
  Home,
  Receipt,
  ArrowLeftRight,
  Activity,
  Users,
  PieChart,
  Plus,
  ScrollText,
  Bot,
  Waypoints,
  Briefcase,
  Building2,
} from "lucide-react";
import { NestLogo } from "./logo";
import { MemberAvatar } from "./avatar";
import { PageTransition } from "./motion";
import { WalletChip } from "./chain";
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
  { to: "/app/agent", label: "Settlement assistant", icon: Bot },
  { to: "/app/bridge", label: "Bridge", icon: Waypoints },
  { to: "/app/syndicate", label: "Payouts", icon: Briefcase },
  { to: "/app/receipts", label: "Receipts", icon: ScrollText },
] as const;

const businessV2Configured = Boolean(import.meta.env.VITE_NEST_BUSINESS_V2_ADDRESS);
const visibleDesktopExtra = businessV2Configured
  ? [...desktopExtra, { to: "/app/business", label: "Business", icon: Building2 }]
  : desktopExtra;

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
      preload="intent"
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.985] ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
    <Link
      to={to}
      preload="intent"
        className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 active:scale-[0.985]"
    >
      <span
        className={`grid h-8 w-11 place-items-center rounded-lg transition-all duration-200 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 2} />
      </span>
      <span
        className={`truncate text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
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
    <div className="app-canvas min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between px-2 py-1">
            <NestLogo size={34} />
          </div>

          <nav className="scroll-clean mt-8 flex-1 space-y-1 overflow-y-auto">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workspace
            </div>
            {primary.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                exact={"exact" in item ? item.exact : false}
              />
            ))}
            <div className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Treasury & tools
            </div>
            {visibleDesktopExtra.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                exact={false}
              />
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
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
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center lg:hidden">
              <NestLogo />
            </div>
            <div className="hidden min-w-0 lg:block" />
            <div className="flex shrink-0 items-center gap-2">
              <WalletHeader />
              <ThemeToggle className="shrink-0" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <RpcBanner />
        </div>

        {/* Secondary sections — the bottom bar only holds the five primary tabs */}
        <div className="scroll-clean mx-auto max-w-7xl overflow-x-auto px-4 pt-3 sm:px-6 lg:hidden">
          <div className="flex w-max gap-2">
            {visibleDesktopExtra.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {greeting && (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">{greeting}</div>
        )}
        <main className="mx-auto max-w-7xl px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>


      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="relative mx-auto flex max-w-md items-center py-1">
          <BottomTab to="/app" label="Home" icon={Home} exact />
          <BottomTab to="/app/expenses" label="Expenses" icon={Receipt} />
          <div className="relative -mt-8 mx-1">
            {onFabClick ? (
              <button
                onClick={onFabClick}
                className="grid h-12 w-12 place-items-center rounded-xl btn-gradient ring-4 ring-background"
                aria-label="Quick action"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                to="/app/settle"
                preload="intent"
                className="grid h-12 w-12 place-items-center rounded-xl btn-gradient ring-4 ring-background"
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
