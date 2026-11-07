import { CheckCircle2, ReceiptText } from "lucide-react";

const ROWS = [
  { name: "Maya", note: "Groceries", amount: "+24.50", ok: true },
  { name: "Leo", note: "Rent · Nov", amount: "-412.00", ok: true },
  { name: "Ava", note: "Dinner split", amount: "+18.75", ok: false },
];

/** Illustrative ledger, isolated from live wallet balances. */
export function HeroProduct() {
  return (
    <div className="hero-product-stage" aria-hidden="true">
      <div className="hero-product">
        <div className="hero-product-heading flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-brand" />
            <span className="text-xs font-semibold text-foreground">Apartment 4B</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Example workspace</span>
        </div>
        <div className="hero-product-ledger">
        <div className="hero-product-balance">
        <p className="text-[11px] font-medium text-muted-foreground">Shared balance</p>
        <p className="hero-product-total mt-2 font-display text-4xl font-semibold text-foreground">
          2,480.<span className="text-muted-foreground">00</span>
        </p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">USDC · On Arc</p>
        </div>
        <ul className="hero-product-entries">
          {ROWS.map((r) => (
            <li key={r.name} className="hero-product-row">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">{r.name[0]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{r.note}</span>
              </span>
              <span className="font-display text-sm font-bold text-foreground">{r.amount}</span>
              {r.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="hero-pending" />}
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}
