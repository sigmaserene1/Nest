import { MemberAvatar, AvatarStack } from "./avatar";
import { UsdcBadge } from "./chain";
import { getMember, fmtUSD, categoryMeta, type Expense } from "@/lib/nest-data";
import { X, Calendar } from "lucide-react";

export function ExpenseDetail({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const payer = getMember(expense.payerId);
  const meta = categoryMeta[expense.category];
  const split = expense.splitAmong.map(getMember);
  const perPerson = expense.amount / Math.max(expense.splitAmong.length, 1);

  const dateStr = new Date(expense.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Expense details</h3>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <span
          className="grid h-14 w-14 place-items-center rounded-2xl text-2xl"
          style={{ background: meta.bg }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xl font-bold">{expense.title}</div>
          <div className="text-sm text-muted-foreground">{expense.category}</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-muted/50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Amount
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-3xl font-bold tabular-nums">{fmtUSD(expense.amount)}</span>
          <UsdcBadge />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Row label="Paid by">
          <div className="flex items-center gap-1.5">
            <MemberAvatar member={payer} size={20} />
            <span className="text-sm font-semibold">{payer.name}</span>
          </div>
        </Row>
        <Row label="Split between">
          <AvatarStack members={split} size={22} max={4} />
        </Row>
        <Row label="Per person">
          <span className="text-sm font-bold tabular-nums">{fmtUSD(perPerson)}</span>
        </Row>
        <Row label="Date">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {dateStr}
          </span>
        </Row>
        {expense.note && (
          <div className="rounded-2xl bg-muted/50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Note
            </div>
            <div className="mt-1 text-sm">{expense.note}</div>
          </div>
        )}
      </div>

    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
