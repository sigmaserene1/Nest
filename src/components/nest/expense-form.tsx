import { useState } from "react";
import type { ReactNode } from "react";
import { MemberAvatar } from "./avatar";
import { categoryMeta, type Expense } from "@/lib/nest-data";
import { useMembers, useMe, useNestChain } from "@/lib/chain/nest-chain";

const categories = Object.keys(categoryMeta) as Expense["category"][];

export type ExpenseInput = {
  title: string;
  amount: number;
  category: Expense["category"];
  payerId: string;
  splitAmong: string[];
  note?: string;
};

export function ExpenseForm({
  initial,
  onSave,
}: {
  initial?: Expense;
  onSave: (data: ExpenseInput) => void;
}) {
  const members = useMembers();
  const currentUserId = useMe();
  const { isDemo, rpcMessage } = useNestChain();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<Expense["category"]>(initial?.category ?? "Other");
  const [payerId, setPayerId] = useState(initial?.payerId ?? currentUserId);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial?.splitAmong ?? members.map((m) => m.id)),
  );
  const [note, setNote] = useState(initial?.note ?? "");

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const amt = parseFloat(amount) || 0;
  const canSave = !isDemo && title.trim().length > 0 && amt > 0 && selected.size > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      amount: amt,
      category,
      payerId,
      splitAmong: Array.from(selected),
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="mt-6 space-y-4">
      <Field label="What">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Trader Joe's"
          autoFocus
          className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </Field>

      <Field label="Amount">
        <div className="flex items-center rounded-2xl bg-muted/60 px-4 py-3 focus-within:ring-2 focus-within:ring-brand">
          <span className="text-lg font-bold text-muted-foreground">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            className="ml-2 w-full bg-transparent text-2xl font-bold tabular-nums outline-none"
          />
          <span className="text-xs font-semibold text-muted-foreground">USDC</span>
        </div>
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-xs font-semibold transition ${on ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground"}`}
              >
                <span>{categoryMeta[c].icon}</span>
                {c}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Paid by">
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setPayerId(m.id)}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-semibold transition ${payerId === m.id ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground"}`}
            >
              <MemberAvatar member={m} size={22} />
              {m.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Split between">
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-semibold transition ${selected.has(m.id) ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground"}`}
            >
              <MemberAvatar member={m} size={22} />
              {m.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Note (optional)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </Field>

      {isDemo && (
        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
          {rpcMessage}
        </div>
      )}

      <button
        onClick={save}
        disabled={!canSave}
        className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01] disabled:opacity-40"
      >
        {initial ? "Save changes" : "Add expense"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
