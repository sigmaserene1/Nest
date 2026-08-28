import { Link, useRouterState } from "@tanstack/react-router";
import type { ElementType, ReactNode } from "react";
import {
  Activity,
  ArrowDownUp,
  Bot,
  Braces,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  ListTree,
  Plus,
  Radio,
  Users,
  Waypoints,
} from "lucide-react";
import { NestLogo } from "./logo";
import { PageTransition } from "./motion";
import { WalletHeader } from "./wallet-header";
import { WalletChip } from "./chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useNestChain } from "@/lib/chain/nest-chain";
import { explorerAddrUrl } from "@/lib/wagmi";

const primary = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/expenses", label: "Ledger", icon: ListTree },
  { to: "/app/settle", label: "Settle", icon: ArrowDownUp },
  { to: "/app/agent", label: "Agents", icon: Bot },
  { to: "/app/activity", label: "Activity", icon: Activity },
] as const;

const utility = [
  { to: "/app/members", label: "Access", icon: Users },
  { to: "/app/bridge", label: "Fund with App Kit", icon: Waypoints },
] as const;

function useActive(path: string, exact = false) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      className={`group flex h-10 items-center gap-3 rounded-md px-3 text-sm transition ${
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={active ? 2.35 : 1.8} />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
    </Link>
  );
}

function MobileTab({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const active = useActive(to, exact);
  return (
    <Link
      to={to}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      <span className="truncate text-[9px] font-medium uppercase">{label}</span>
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
  const wallet = useArcWallet();
  const { contractAddress, room, protocolVersion } = useNestChain();

  return (
    <div className="protocol-app min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <NestLogo size={30} />
          <span className="ml-auto rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
            V{protocolVersion ?? "-"}
          </span>
        </div>

        <div className="border-b border-border p-4">
          <div className="protocol-label">Active treasury</div>
          <div className="mt-2 truncate text-sm font-semibold">{room?.name ?? "Loading"}</div>
          {contractAddress && (
            <a
              href={explorerAddrUrl(contractAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-primary"
            >
              {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
              <Braces className="h-3 w-3" />
            </a>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="protocol-label px-3 pb-2 pt-1">Protocol</div>
          {primary.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <div className="protocol-label px-3 pb-2 pt-6">Operations</div>
          {utility.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Arc Testnet live
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-xs tabular-nums">
              {wallet.isOnArc ? wallet.usdcBalance.toFixed(2) : "--"} USDC
            </span>
            {wallet.address && <WalletChip address={wallet.address} />}
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <div className="lg:hidden">
              <NestLogo size={28} showWord={false} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate">{room?.name ?? "Nest treasury"}</span>
              </div>
            </div>
            <Link
              to="/app/bridge"
              className="hidden h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary sm:inline-flex"
            >
              <CircleDollarSign className="h-4 w-4" /> Fund
            </Link>
            <div className="min-w-0">
              <WalletHeader />
            </div>
          </div>
        </header>

        {greeting && <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6">{greeting}</div>}
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {onFabClick && (
        <button
          type="button"
          onClick={onFabClick}
          className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground shadow-lg shadow-primary/20 lg:hidden"
          aria-label="Record obligation"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 px-1 backdrop-blur-xl lg:hidden">
        {primary.map((item) => (
          <MobileTab key={item.to} {...item} />
        ))}
      </nav>
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
  [key: string]: unknown;
}) {
  return (
    <As
      className={`rounded-lg border border-border bg-card p-5 shadow-none ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}
