import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Check, Minus, Plus, Sparkles } from "lucide-react";

/** Pointer-driven 3D tilt. Transforms only — GPU composited, no React re-render per move. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div className="tilt-stage">
      <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt-card ${className}`}>
        {children}
        <span aria-hidden className="tilt-glare" />
      </div>
    </div>
  );
}

const TOKENS = ["USDC", "EURC", "Arc Mainnet", "CCTP", "Ethereum", "Base", "Arbitrum", "Avalanche", "Optimism", "Polygon", "Gasless pay", "Onchain receipts"];

export function TokenMarquee() {
  const row = [...TOKENS, ...TOKENS];
  return (
    <div className="marquee-mask overflow-hidden border-y border-border bg-card/50 py-4" aria-label="Supported networks and assets">
      <div className="marquee-track flex w-max gap-10">
        {row.map((t, i) => (
          <span key={i} aria-hidden={i >= TOKENS.length} className="flex items-center gap-2.5 whitespace-nowrap font-display text-sm font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const NAMES = ["You", "Maya", "Leo", "Aisha", "Sam", "Noah"];

/** Live, local-only split preview. No chain calls — purely illustrative math. */
export function SplitPlayground({ onLaunch }: { onLaunch: () => void }) {
  const [amount, setAmount] = useState(240);
  const [people, setPeople] = useState(3);
  const [settled, setSettled] = useState(false);
  const share = Math.floor((amount / people) * 100) / 100;
  const owed = Math.round((amount - share) * 100) / 100;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
          <Sparkles className="h-3.5 w-3.5" /> Try it live
        </span>
        <h2 className="mt-6 text-3xl leading-[1.05] sm:text-5xl">
          Split a bill in{" "}
          <span className="font-quote font-normal italic text-brand">seconds.</span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          Drag the amount, add friends, and watch every share update instantly — the same math Nest settles onchain in USDC.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="block">
            <span className="flex justify-between text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Bill amount <span className="font-mono text-foreground">{amount} USDC</span>
            </span>
            <input
              type="range" min={10} max={1000} step={5} value={amount}
              onChange={(e) => { setAmount(Number(e.target.value)); setSettled(false); }}
              className="nest-range mt-3 w-full"
            />
          </label>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">People</span>
            <div className="flex items-center gap-3">
              <button aria-label="Remove person" onClick={() => { setPeople((p) => Math.max(2, p - 1)); setSettled(false); }} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background transition active:scale-90 hover:border-brand/40"><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center font-mono text-lg font-bold">{people}</span>
              <button aria-label="Add person" onClick={() => { setPeople((p) => Math.min(6, p + 1)); setSettled(false); }} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background transition active:scale-90 hover:border-brand/40"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <button
            onClick={() => setSettled(true)}
            className="w-full rounded-full bg-foreground py-3 text-sm font-bold text-background transition active:scale-[0.98] hover:bg-foreground/90"
          >
            {settled ? "Settled ✓ — now do it for real" : "Simulate settle"}
          </button>
          {settled && (
            <button onClick={onLaunch} className="w-full text-center text-xs font-bold text-brand hover:underline">
              Launch Nest and settle on Arc →
            </button>
          )}
        </div>
      </div>

      <TiltCard className="rounded-3xl border border-border bg-card p-7 shadow-elevated">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Dinner · Room #42</p>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success">Arc</span>
        </div>
        <p className="mt-5 font-display text-5xl font-bold tabular-nums">{amount.toFixed(2)}<span className="ml-2 text-lg text-muted-foreground">USDC</span></p>
        <ul className="mt-7 space-y-2.5">
          {NAMES.slice(0, people).map((n, i) => (
            <li key={n} className="split-row flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{n[0]}</span>
                {n}{i === 0 && <span className="text-[10px] font-bold uppercase text-muted-foreground">paid</span>}
              </span>
              <span className="flex items-center gap-2 font-mono text-sm font-bold tabular-nums">
                {i === 0 ? `+${owed.toFixed(2)}` : `−${share.toFixed(2)}`}
                {settled && i > 0 && <Check className="h-4 w-4 text-success" />}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-4 text-xs font-semibold text-muted-foreground">
          <span>Each share</span>
          <span className="font-mono text-base font-bold text-foreground">{share.toFixed(2)} USDC</span>
        </div>
      </TiltCard>
    </div>
  );
}
