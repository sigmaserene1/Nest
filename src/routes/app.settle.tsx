import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { computeBalances, currentUserId, getMember, fmtUSD } from "@/lib/nest-data";
import { Check, Loader2, ArrowRight, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/app/settle")({
  component: Settle,
  head: () => ({ meta: [{ title: "Settle up · Nest" }, { name: "description", content: "Pay your share instantly in USDC." }] }),
});

function Settle() {
  const { debts } = computeBalances();
  const mine = debts.filter((d) => d.fromId === currentUserId);
  const total = mine.reduce((s, d) => s + d.amount, 0);
  const [state, setState] = useState<"idle" | "confirming" | "pending" | "done">("idle");

  const start = () => {
    setState("confirming");
    setTimeout(() => setState("pending"), 900);
    setTimeout(() => setState("done"), 2300);
  };

  return (
    <AppShell greeting={<div><div className="text-sm font-medium text-muted-foreground">One-tap settle</div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Settle up</h1></div>}>
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Card className="!p-6 bg-gradient-to-br from-foreground to-slate-800 text-background ring-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-background/60">Total to pay</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-5xl font-bold tracking-tight tabular-nums">{fmtUSD(total)}</div>
              <span className="text-sm font-semibold text-background/60">USDC</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-background/70">
              <Zap className="h-3.5 w-3.5 text-brand" /> Instant on Arc · ~$0.001 fee
            </div>
            <button
              disabled={total === 0 || state !== "idle"}
              onClick={start}
              className="mt-6 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01] disabled:opacity-50"
            >
              {total === 0 ? "You're all settled" : `Pay all ${fmtUSD(total)}`}
            </button>
          </Card>

          <Card>
            <h3 className="text-sm font-bold">Breakdown</h3>
            <ul className="mt-4 space-y-2">
              {mine.map((d, i) => {
                const to = getMember(d.toId);
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                    <MemberAvatar member={to} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{to.name}</div>
                      <div className="text-[11px] text-muted-foreground">{to.wallet}</div>
                    </div>
                    <div className="text-sm font-bold tabular-nums">{fmtUSD(d.amount)}</div>
                  </li>
                );
              })}
              {mine.length === 0 && <li className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">Nothing to pay 🎉</li>}
            </ul>
          </Card>
        </div>

        <Card className="lg:col-span-2 !p-6">
          <h3 className="text-sm font-bold">How settlement works</h3>
          <ol className="mt-4 space-y-4">
            {[
              { t: "One transaction", d: "We batch all debts into a single USDC transfer." },
              { t: "Confirmed in ~1s", d: "Arc's sub-second finality means no waiting." },
              { t: "Everyone paid", d: "Your roommates get notified instantly." },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>
                <div>
                  <div className="text-sm font-semibold">{s.t}</div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Non-custodial — you sign every transaction.
          </div>
        </Card>
      </div>

      {state !== "idle" && <PayModal state={state} total={total} onClose={() => setState("idle")} />}
    </AppShell>
  );
}

function PayModal({ state, total, onClose }: { state: "confirming" | "pending" | "done"; total: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="glass-strong w-full max-w-sm rounded-[32px] p-8 text-center animate-pop-in">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-soft">
          {state === "done"
            ? <Check className="h-10 w-10 text-brand" strokeWidth={2.5} />
            : <Loader2 className="h-10 w-10 animate-spin text-brand" />}
        </div>
        <h3 className="mt-5 text-xl font-bold">
          {state === "confirming" && "Confirm in your wallet"}
          {state === "pending" && "Settling on Arc…"}
          {state === "done" && "All settled 🎉"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {state === "done" ? `You paid ${fmtUSD(total)} in USDC.` : "Sub-second finality — hang tight."}
        </p>
        {state === "done" && (
          <button onClick={onClose} className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">
            Done <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
