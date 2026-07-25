import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import { UsdcBadge } from "@/components/nest/chain";
import { members, getMember, fmtUSD, categoryMeta, currentUserId, type Expense } from "@/lib/nest-data";
import { useExpenses, addExpense } from "@/lib/nest-store";
import { Search, Plus, X } from "lucide-react";

export const Route = createFileRoute("/app/expenses")({
  component: Expenses,
  head: () => ({ meta: [{ title: "Expenses · Nest" }, { name: "description", content: "Every shared expense in one beautiful feed." }] }),
});

const cats = ["All", "Rent", "Groceries", "Utilities", "Internet", "Dining", "Other"] as const;

function Expenses() {
  const allExpenses = useExpenses();
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = allExpenses
    .filter((e) => cat === "All" || e.category === cat)
    .filter((e) => e.title.toLowerCase().includes(q.toLowerCase()));

  const grouped = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <AppShell greeting={<Header onAdd={() => setOpen(true)} />}>
      <div className="mt-4 flex flex-col gap-3">
        <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search expenses…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                cat === c ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-black/[0.04] hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div className="mb-2 flex items-center justify-between px-1 text-xs">
              <span className="font-semibold text-muted-foreground">{day}</span>
              <span className="tabular-nums text-muted-foreground">{fmtUSD(items.reduce((s, e) => s + e.amount, 0))}</span>
            </div>
            <Card className="!p-2">
              <ul className="divide-y divide-border/60">
                {items.map((e) => {
                  const payer = getMember(e.payerId);
                  const meta = categoryMeta[e.category];
                  const split = e.splitAmong.map(getMember);
                  return (
                    <li key={e.id} className="flex items-center gap-3 p-3 transition hover:bg-muted/50 rounded-2xl">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl text-xl" style={{ background: meta.bg }}>
                        {meta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MemberAvatar member={payer} size={16} />
                          <span>Paid by <span className="font-medium text-foreground">{payer.name.split(" ")[0]}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="text-sm font-bold tabular-nums">{fmtUSD(e.amount)}</div>
                          <UsdcBadge />
                        </div>
                        <div className="mt-1 flex justify-end"><AvatarStack members={split} size={18} max={4} /></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        ))}
      </div>

      {open && <AddExpenseSheet onClose={() => setOpen(false)} />}
    </AppShell>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-muted-foreground">Bedford Loft</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Expenses</h1>
      </div>
      <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]">
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map((m) => m.id)));
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const amt = parseFloat(amount) || 0;
  const canSave = title.trim().length > 0 && amt > 0 && selected.size > 0;

  const save = () => {
    if (!canSave) return;
    addExpense({
      title: title.trim(),
      amount: amt,
      category: "Other",
      payerId: currentUserId,
      splitAmong: Array.from(selected),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center">
      <div className="glass-strong w-full max-w-md rounded-t-[32px] p-6 sm:rounded-[32px] animate-pop-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">New expense</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 space-y-4">
          <Field label="What">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trader Joe's" className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand" />
          </Field>
          <Field label="Amount">
            <div className="flex items-center rounded-2xl bg-muted/60 px-4 py-3 focus-within:ring-2 focus-within:ring-brand">
              <span className="text-lg font-bold text-muted-foreground">$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" placeholder="0.00" className="ml-2 w-full bg-transparent text-2xl font-bold tabular-nums outline-none" />
              <span className="text-xs font-semibold text-muted-foreground">USDC</span>
            </div>
          </Field>
          <Field label="Split between">
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = selected.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1 pr-3 text-xs font-semibold transition ${on ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground"}`}
                  >
                    <MemberAvatar member={m} size={22} />
                    {m.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <button onClick={save} disabled={!canSave} className="mt-6 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01] disabled:opacity-40">
          Add expense
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
