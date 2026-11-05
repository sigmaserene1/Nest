import { CheckCircle2, ArrowUpRight, Users, Zap } from "lucide-react";

const ROWS = [
  { name: "Maya", note: "Groceries", amount: "+24.50", ok: true },
  { name: "Leo", note: "Rent · Nov", amount: "-412.00", ok: true },
  { name: "Ava", note: "Dinner split", amount: "+18.75", ok: false },
];

/** Floating glass product preview for the landing hero (pure CSS motion). */
export function HeroProduct() {
  return (
    <div className="hero-product-stage" aria-hidden="true">
      <div className="hero-product-glow" />
      <div className="hero-product">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-muted-foreground">Room · Apartment 4B</span>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-success">Live</span>
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shared balance</p>
        <p className="hero-product-total mt-1 font-display text-4xl font-bold text-foreground sm:text-5xl">
          2,480.<span className="text-muted-foreground">00</span> <span className="text-base font-semibold text-info">USDC</span>
        </p>
        <div className="hero-product-bar mt-4"><span /></div>
        <ul className="mt-5 space-y-2">
          {ROWS.map((r, i) => (
            <li key={r.name} className="hero-product-row" style={{ animationDelay: `${0.4 + i * 0.25}s` }}>
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
      <div className="hero-chip hero-chip-a"><Zap className="h-3.5 w-3.5 text-brand" /> Settled in 0.4s</div>
      <div className="hero-chip hero-chip-b"><Users className="h-3.5 w-3.5 text-info" /> 4 roommates</div>
      <div className="hero-chip hero-chip-c"><ArrowUpRight className="h-3.5 w-3.5 text-success" /> Gasless pay</div>
    </div>
  );
}
