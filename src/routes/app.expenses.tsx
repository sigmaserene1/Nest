import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import { UsdcBadge } from "@/components/nest/chain";
import { ExpenseForm, type ExpenseInput } from "@/components/nest/expense-form";
import { ExpenseDetail } from "@/components/nest/expense-detail";
import { getMember, fmtUSD, categoryMeta, type Expense } from "@/lib/nest-data";
import { useExpenses } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { ViewportPortal } from "@/components/nest/viewport-portal";
import { Loader2, Search, Plus, X } from "lucide-react";

export const Route = createFileRoute("/app/expenses")({
  component: Expenses,
  head: () => ({
    meta: [
      { title: "Expenses · Nest" },
      { name: "description", content: "Browse, search and filter every shared household expense recorded onchain on Arc, with each roommate's USDC share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Expenses · Nest" },
      { property: "og:description", content: "Browse, search and filter every shared household expense recorded onchain on Arc, with each roommate's USDC share." },
    ],
  }),
});

const cats = ["All", "Rent", "Groceries", "Utilities", "Internet", "Dining", "Other"] as const;

type ModalState =
  | { mode: "add" }
  | { mode: "detail"; expense: Expense }
  | { mode: "edit"; expense: Expense }
  | null;

function Expenses() {
  const allExpenses = useExpenses();
  const writes = useNestWrites();
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = allExpenses
    .filter((e) => cat === "All" || e.category === cat)
    .filter((e) => e.title.toLowerCase().includes(q.toLowerCase()));

  const grouped = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  const close = () => setModal(null);

  const handleSave = async (data: ExpenseInput) => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await writes.addExpense({
        title: data.title,
        category: data.category,
        amount: data.amount,
        participants: data.splitAmong,
      });
      close();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message.split("\n")[0] : "Could not add expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      greeting={<Header onAdd={() => setModal({ mode: "add" })} />}
      onFabClick={() => setModal({ mode: "add" })}
    >
      <div className="mt-4 flex flex-col gap-3">
        <div className="glass flex min-h-10 items-center gap-2 rounded-full px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search expenses…"
            aria-label="Search expenses"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <Button variant="ghost"
              key={c}
              onClick={() => setCat(c)}
              className={`h-8 shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                cat === c
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div className="mb-2 flex items-center justify-between px-1 text-xs">
              <span className="font-semibold text-muted-foreground">{day}</span>
              <span className="tabular-nums text-muted-foreground">
                {fmtUSD(items.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
            <Card className="!p-2">
              <ul className="divide-y divide-border/60">
                {items.map((e) => {
                  const payer = getMember(e.payerId);
                  const meta = categoryMeta[e.category];
                  const split = e.splitAmong.map(getMember);
                  return (
                    <li
                      key={e.id}
                      onClick={() => setModal({ mode: "detail", expense: e })}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setModal({ mode: "detail", expense: e }); } }}
                      tabIndex={0} role="button" aria-label={`View ${e.title}`}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/50 active:scale-[0.99]"
                    >
                      <span
                        className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
                        style={{ background: meta.bg }}
                      >
                        {meta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MemberAvatar member={payer} size={16} />
                          <span>
                            Paid by{" "}
                            <span className="font-medium text-foreground">
                              {payer.name.split(" ")[0]}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="text-sm font-bold tabular-nums">{fmtUSD(e.amount)}</div>
                          <UsdcBadge />
                        </div>
                        <div className="mt-1 flex justify-end">
                          <AvatarStack members={split} size={18} max={4} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        ))}
        {filtered.length === 0 && (
          <Card className="py-12 text-center">
            <div className="text-sm font-semibold">No expenses found</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Try a different filter or add a new expense.
            </div>
          </Card>
        )}
      </div>

              {modal && (
          <ViewportPortal><div



            onClick={close}
            role="dialog" aria-modal="true" aria-label={modal.mode === "detail" ? "Expense details" : "New expense"}
            className="nest-expense-backdrop fixed inset-0 z-50 flex items-end justify-center bg-overlay backdrop-blur-[6px] sm:items-center"
          >
            <div



              onClick={(e) => e.stopPropagation()}
              className="nest-expense-sheet mobile-sheet glass-strong max-h-[88dvh] w-[calc(100%-0.75rem)] max-w-md overflow-y-auto rounded-[30px] p-5 sm:max-h-[90vh] sm:w-full sm:p-6"
            >
              {modal.mode !== "detail" && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {modal.mode === "edit" ? "Edit expense" : "New expense"}
                    </h3>
                    <Button variant="ghost"
                      onClick={close}
                      disabled={saving}
                      className="grid h-9 w-9 place-items-center rounded-full bg-muted disabled:opacity-40"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <ExpenseForm
                    onSave={handleSave}
                    saving={saving}
                  />
                  {saveError ? (
                    <div
                      role="alert"
                      className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
                    >
                      {saveError}
                    </div>
                  ) : null}
                </>
              )}
              {modal.mode === "detail" && <ExpenseDetail expense={modal.expense} onClose={close} />}
            </div>
          </div></ViewportPortal>
        )}
          </AppShell>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-muted-foreground">Your household</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Expenses</h1>
      </div>
      <Button variant="ghost"
        onClick={onAdd}
        className="inline-flex h-10 items-center gap-1.5 rounded-full btn-gradient px-4 py-2 text-xs font-bold"
      >
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  );
}
