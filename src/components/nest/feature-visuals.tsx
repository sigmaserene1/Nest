import { ArrowRight, Check } from "lucide-react";

/** Illustrative mini-interfaces for landing feature cards. Never reads wallet or contract state. */
const row = "flex items-center justify-between rounded-lg border border-border bg-background/70 px-3 py-2 text-xs";

function Avatar({ l, tone }: { l: string; tone: string }) {
  return <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${tone}`}>{l}</span>;
}

export function FeatureVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <div className="fv-panel space-y-2">
          {[
            ["M", "Rent · March", "1,800.00", "bg-brand-soft text-brand"],
            ["L", "Groceries", "86.40", "bg-success/15 text-success"],
            ["A", "Internet", "45.00", "bg-info/15 text-info"],
          ].map(([l, t, a, tone], i) => (
            <div key={t} className={`${row} fv-row`} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="flex items-center gap-2"><Avatar l={l} tone={tone} /> <span className="font-semibold">{t}</span></span>
              <span className="font-mono tabular-nums">{a} <span className="text-muted-foreground">USDC</span></span>
            </div>
          ))}
        </div>
      );
    case 1:
      return (
        <div className="fv-panel space-y-3">
          {[["Maya", 72, "+412.50", "text-success"], ["Leo", 40, "−180.00", "text-brand"], ["Ava", 25, "−232.50", "text-brand"]].map(([n, w, v, c]) => (
            <div key={n as string} className="text-xs">
              <div className="mb-1 flex justify-between"><span className="font-semibold">{n}</span><span className={`font-mono tabular-nums ${c}`}>{v}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><span className="fv-bar block h-full rounded-full bg-brand" style={{ width: `${w}%` }} /></div>
            </div>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="fv-panel flex items-center justify-between gap-2 text-xs">
          <span className="flex flex-col items-center gap-1"><Avatar l="L" tone="bg-info/15 text-info" />Leo</span>
          <span className="fv-flow relative h-px flex-1 bg-border"><span className="fv-dot" /></span>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono font-semibold tabular-nums">180.00 USDC</span>
          <span className="fv-flow relative h-px flex-1 bg-border"><span className="fv-dot" /></span>
          <span className="flex flex-col items-center gap-1"><Avatar l="M" tone="bg-brand-soft text-brand" />Maya</span>
        </div>
      );
    case 3:
      return (
        <div className="fv-panel space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground"><span>Run cap</span><span className="font-mono">250 / 500 USDC</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><span className="fv-bar block h-full w-1/2 rounded-full bg-success" /></div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Queued 4", "Skipped dust 1", "Wallet approval"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-background/70 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      );
    case 4:
      return (
        <div className="fv-panel flex items-center gap-2 text-xs font-semibold">
          {["Base", "Burn", "Attest", "Arc"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`rounded-md border px-2.5 py-1.5 ${i === 3 ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background/70"}`}>{s}</span>
              {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </div>
      );
    default:
      return (
        <div className="fv-panel fv-receipt font-mono text-[11px]">
          <div className="flex justify-between"><span>SETTLED</span><span className="flex items-center gap-1 text-success"><Check className="h-3 w-3" />Confirmed</span></div>
          <div className="my-2 border-t border-dashed border-border" />
          <div className="flex justify-between"><span className="text-muted-foreground">Tx</span><span>0x7a3f…c91e</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">180.00 USDC</span></div>
        </div>
      );
  }
}
