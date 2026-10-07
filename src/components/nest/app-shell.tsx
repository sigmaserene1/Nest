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

const businessV2Configured = Boolean(
  import.meta.env.VITE_NEST_BUSINESS_V2_ADDRESS ||
    import.meta.env.VITE_NEST_BUSINESS_V2_MAINNET_ADDRESS,
);
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
      className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.985] ${
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
    <Link
      to={to}
      preload="intent"
      className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 active:scale-[0.97]"
    >
      <span
        className={`grid h-9 w-11 place-items-center rounded-2xl transition-all duration-200 ${active ? "bg-brand/10 text-brand" : "text-muted-foreground"}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.45 : 2} />
      </span>
      <span
        className={`max-w-full truncate text-[10px] font-bold tracking-[-0.01em] transition-colors ${active ? "text-brand" : "text-muted-foreground"}`}
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
  const {
    me: myId,
    myName: displayName,
    contractAddress,
    rooms,
    roomId,
  } = useNestChain();
  const me = getMember(myId ?? "");
  const wallet = useArcWallet();
  const myName = displayName ?? "You";

  return (
    <div className="app-canvas min-h-[100dvh] text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col p-4 lg:flex">
        <div className="glass-strong flex h-full flex-col rounded-3xl p-4">
          <div className="flex items-center justify-between px-1.5 py-1">
            <NestLogo />
          </div>

          <nav className="scroll-clean mt-5 flex-1 space-y-1 overflow-y-auto">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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
            <div className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
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

          <Link
            to="/app/profile"
            preload="intent"
            className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/60 p-3 transition hover:bg-muted active:scale-[0.985]"
            aria-label="Open your profile"
          >
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
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-72">
        <header className="mobile-app-header sticky top-0 z-30 border-b border-border/55 bg-background/82 backdrop-blur-2xl">
          <div className="mx-auto grid min-h-14 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 sm:min-h-16 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center lg:hidden">
              <NestLogo />
            </div>
            <div className="hidden min-w-0 lg:block" />
            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              {wallet.environment === "testnet" ? (
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                  title="Get test USDC"
                  aria-label="Get Arc Testnet USDC from Circle faucet"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/5 text-[14px] shadow-sm transition hover:border-brand/40 hover:bg-brand/10 active:scale-[0.94]"
                >
                  <span aria-hidden>🚰</span>
                </a>
              ) : null}
              <WalletHeader />
              <ThemeToggle className="shrink-0" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
          <RpcBanner />
          {wallet.environment === "mainnet" && !contractAddress && (
            <div className="mb-3 rounded-2xl border border-amber-400/35 bg-amber-50 px-4 py-3 text-amber-950">
              <div className="text-xs font-bold">Arc Mainnet selected · contract not configured</div>
              <p className="mt-1 text-[11px] leading-5">
                Deploy ExpenseManager on chain 5042, then set
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
                  VITE_NEST_EXPENSE_MANAGER_MAINNET_ADDRESS
                </code>
                and
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
                  VITE_NEST_EXPENSE_MANAGER_MAINNET_BLOCK
                </code>
                in the production environment.
              </p>
            </div>
          )}
          {wallet.environment === "mainnet" &&
            contractAddress &&
            rooms.length === 0 && (
              <div className="mb-3 rounded-2xl border border-sky-400/35 bg-sky-50 px-4 py-3 text-sky-950">
                <div className="text-xs font-bold">
                  Arc Mainnet connected · workspace migration pending
                </div>
                <p className="mt-1 text-[11px] leading-5">
                  Your Nest session is preserved. The selected workspace
                  {roomId ? ` #${roomId}` : ""} does not exist on the Mainnet contract yet,
                  so onchain balances and expenses will appear after that workspace is created or migrated.
                </p>
              </div>
            )}
        </div>

        {/* Secondary sections — the bottom bar only holds the five primary tabs */}
        <div className="scroll-clean mx-auto max-w-6xl overflow-x-auto px-4 pt-3 sm:px-6 lg:hidden">
          <div className="flex w-max gap-2 pb-0.5">
            {visibleDesktopExtra.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[11px] font-bold text-muted-foreground shadow-sm transition active:scale-[0.98] hover:border-brand/30 hover:text-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {greeting && (
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">{greeting}</div>
        )}
        <main className="mobile-safe-main mx-auto max-w-6xl px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>


      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav fixed left-1/2 z-40 w-[calc(100%-1rem)] max-w-[430px] -translate-x-1/2 lg:hidden">
        <div className="glass-strong relative flex min-h-[66px] items-center rounded-[26px] border-border/75 px-1.5 py-1.5 shadow-[0_16px_48px_rgba(15,23,42,0.16)]">
          <BottomTab to="/app" label="Home" icon={Home} exact />
          <BottomTab to="/app/expenses" label="Expenses" icon={Receipt} />
          <div className="relative -mt-7 mx-0.5">
            {onFabClick ? (
              <button
                onClick={onFabClick}
                className="grid h-14 w-14 place-items-center rounded-full btn-gradient ring-4 ring-background shadow-brand transition active:scale-[0.96]"
                aria-label="Quick action"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                to="/app/settle"
                preload="intent"
                className="grid h-14 w-14 place-items-center rounded-full btn-gradient ring-4 ring-background shadow-brand transition active:scale-[0.96]"
                aria-label="Settle up"
              >
                <ArrowLeftRight className="h-5 w-5" strokeWidth={2.4} />
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
    <As className={`card-premium p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </As>
  );
}
