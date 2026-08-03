import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar, AvatarStack } from "@/components/nest/avatar";
import { UsdcBadge } from "@/components/nest/chain";
import { ExpenseForm, type ExpenseInput } from "@/components/nest/expense-form";
import { ExpenseDetail } from "@/components/nest/expense-detail";
import { getMember, fmtUSD, categoryMeta, type Expense } from "@/lib/nest-data";
import { useExpenses } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { Search, Plus, X } from "lucide-react";

export const Route = createFileRoute("/app/expenses")({
  component: Expenses,
  head: () => ({
    meta: [
      { title: "Expenses · Nest" },
      { name: "description", content: "Every shared expense in one beautiful feed." },
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
    close();
    await writes.addExpense({
      title: data.title,
      category: data.category,
      amount: data.amount,
      participants: data.splitAmong,
    });
  };

  return (
    <AppShell
      greeting={<Header onAdd={() => setModal({ mode: "add" })} />}
      onFabClick={() => setModal({ mode: "add" })}
    >
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
                cat === c
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground ring-1 ring-black/[0.04] hover:text-foreground"
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

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={close}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 620, damping: 34, mass: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] p-6 sm:rounded-[32px]"
            >
              {modal.mode !== "detail" && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {modal.mode === "edit" ? "Edit expense" : "New expense"}
                    </h3>
                    <button
                      onClick={close}
                      className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ExpenseForm
                    initial={modal.mode === "edit" ? modal.expense : undefined}
                    onSave={handleSave}
                  />
                </>
              )}
              {modal.mode === "detail" && <ExpenseDetail expense={modal.expense} onClose={close} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}
