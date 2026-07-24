import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import { expenses, fmtUSD, getMember, members } from "@/lib/nest-data";

export const Route = createFileRoute("/app/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Nest" },
      { name: "description", content: "Log rent, groceries, utilities and every shared cost your household splits." },
      { property: "og:title", content: "Expenses · Nest" },
      { property: "og:description", content: "Every shared cost, in one place." },
    ],
  }),
  component: Expenses,
});

const CATEGORIES = ["All", "Rent", "Groceries", "Electricity", "Internet", "Other"] as const;

function Expenses() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const filtered = cat === "All" ? expenses : expenses.filter((e) => e.category === cat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <AppShell
      title="Expenses"
      action={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground shadow-brand hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="h-4 w-4" /> Add expense
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search expenses…" className="w-56 bg-transparent outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="ml-auto flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                cat === c ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-muted-foreground hover:bg-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
        <span className="text-muted-foreground">{filtered.length} expenses</span>
        <span>Total <span className="font-semibold">{fmtUSD(total)}</span></span>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Paid by</th>
              <th className="px-4 py-2.5 font-medium">Split</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const payer = getMember(e.payerId);
              const split = e.splitAmong.map(getMember);
              return (
                <tr key={e.id} className={i > 0 ? "border-t border-border" : ""}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryPill c={e.category} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <MemberAvatar member={payer} size={22} />
                      <span className="text-xs">{payer.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AvatarStack members={split} size={22} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtUSD(e.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && <AddExpenseSheet onClose={() => setOpen(false)} />}
    </AppShell>
  );
}

function CategoryPill({ c }: { c: string }) {
  const map: Record<string, string> = {
    Rent: "bg-[oklch(0.965_0.045_27.3)] text-brand",
    Groceries: "bg-[oklch(0.96_0.06_155)] text-[oklch(0.4_0.14_155)]",
    Electricity: "bg-[oklch(0.965_0.09_75)] text-[oklch(0.5_0.15_75)]",
    Internet: "bg-[oklch(0.96_0.06_260)] text-[oklch(0.42_0.15_260)]",
    Other: "bg-surface text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[c] ?? map.Other}`}>{c}</span>;
}

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 md:items-center md:p-6" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl border border-border bg-background p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">New expense</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" placeholder="e.g. Whole Foods" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Amount (USD)</span>
              <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" placeholder="0.00" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand">
                {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Paid by</span>
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand">
              {members.map((m) => <option key={m.id}>{m.name}</option>)}
            </select>
          </label>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Split</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
                  <input type="checkbox" defaultChecked className="accent-[color:var(--brand)]" />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-brand">Add expense</button>
        </div>
      </div>
    </div>
  );
}
