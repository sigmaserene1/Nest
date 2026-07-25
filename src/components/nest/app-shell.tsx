import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Receipt, ArrowLeftRight, Activity, Users, PieChart, Bell, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { NestLogo } from "./logo";
import { MemberAvatar } from "./avatar";
import { PageTransition } from "./motion";
import { ArcBadge, UsdcBadge, WalletChip } from "./chain";
import { WalletHeader } from "./wallet-header";
import { getMember, currentUserId, myWallet } from "@/lib/nest-data";

const primary = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/expenses", label: "Expenses", icon: Receipt },
  { to: "/app/settle", label: "Settle", icon: ArrowLeftRight, center: true },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/analytics", label: "Insights", icon: PieChart },
] as const;

const desktopExtra = [{ to: "/app/members", label: "Members", icon: Users }] as const;

function useActive(path: string, exact = false) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function NavItem({ to, label, icon: Icon, exact }: { to: string; label: string; icon: typeof Home; exact?: boolean }) {
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
        className={`grid h-9 w-12 place-items-center rounded-2xl transition-all ${active ? "bg-foreground text-background" : "text-muted-foreground"}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 2} />
      </span>
      <span
        className={`text-[10px] font-semibold tracking-wide ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </Link>
  );
}

export function AppShell({ children, greeting, onFabClick }: { children: ReactNode; greeting?: ReactNode; onFabClick?: () => void }) {
  const me = getMember(currentUserId);

  return (
    <div className="min-h-screen text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 flex-col p-6 xl:flex">
        <div className="glass-strong flex h-full flex-col rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <NestLogo />
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
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
                <div className="text-2xl font-bold tracking-tight tabular-nums">245.75</div>
                <span className="text-xs font-medium text-background/60">USDC</span>
              </div>
            </div>
            <div className="relative mt-3">
              <WalletChip address={myWallet} variant="dark" />
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
            <MemberAvatar member={me} size={38} ring />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{me.name}</div>
              <div className="mt-0.5"><WalletChip address={myWallet} /></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <WalletHeader />
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
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="relative -mt-8 mx-1"
          >
            {onFabClick ? (
              <button
                onClick={onFabClick}
                className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-brand animate-pulse-brand"
                aria-label="Quick action"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                to="/app/settle"
                className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-brand animate-pulse-brand"
                aria-label="Settle up"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            )}

          </motion.div>
          <BottomTab to="/app/activity" label="Activity" icon={Activity} />
          <BottomTab to="/app/analytics" label="Insights" icon={PieChart} />
        </div>
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
  as?: any;
  [k: string]: any;
}) {
  return (
    <As className={`rounded-[20px] bg-card p-5 shadow-card ring-1 ring-black/[0.03] ${className}`} {...rest}>
      {children}
    </As>
  );
}
