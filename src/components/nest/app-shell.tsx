import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Activity,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { NestLogo, BuiltOnArc } from "./logo";
import { MemberAvatar } from "./avatar";
import { getMember, currentUserId } from "@/lib/nest-data";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/expenses", label: "Expenses", icon: Receipt },
  { to: "/app/activity", label: "Activity", icon: Activity },
  { to: "/app/settle", label: "Settle up", icon: ArrowLeftRight },
  { to: "/app/history", label: "Transactions", icon: Wallet },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/members", label: "Members", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const me = getMember(currentUserId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <NestLogo />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-3 mb-3 rounded-xl border border-border bg-surface p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current home</div>
          <div className="mt-0.5 text-sm font-semibold">Bedford Loft</div>
          <div className="mt-1 text-[11px] text-muted-foreground">4 members · since Mar 2026</div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <MemberAvatar member={me} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{me.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{me.wallet}</div>
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <BuiltOnArc />
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-5 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div className="ml-auto flex items-center gap-2">{action}</div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
