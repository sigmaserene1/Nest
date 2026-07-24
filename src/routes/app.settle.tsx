import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/nest/app-shell";
import { WalletButton } from "@/components/nest/wallet-button";
import { MemberAvatar } from "@/components/nest/avatar";
import { BuiltOnArc } from "@/components/nest/logo";
import { computeBalances, currentUserId, fmtUSD, getMember } from "@/lib/nest-data";
import { ArrowRight, Check, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/settle")({
  head: () => ({
    meta: [
      { title: "Settle up · Nest" },
      { name: "description", content: "Clear your household balances with a one-click USDC transfer on Arc." },
      { property: "og:title", content: "Settle up · Nest" },
      { property: "og:description", content: "One-click USDC settlement." },
    ],
  }),
  component: Settle,
});

function Settle() {
  const { debts } = computeBalances();
  const [active, setActive] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "confirming" | "pending" | "done">("idle");

  const startSettle = (i: number) => {
    setActive(i);
    setState("confirming");
    setTimeout(() => setState("pending"), 900);
    setTimeout(() => setState("done"), 2200);
  };
  const close = () => {
    setActive(null);
    setState("idle");
  };

  return (
    <AppShell title="Settle up" action={<WalletButton />}>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Simplified balances</h2>
            <p className="text-sm text-muted-foreground">Nest reduces the debt graph to the fewest possible transfers.</p>
          </div>
          <BuiltOnArc />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {debts.length === 0 && (
          <div className="rounded-2xl border border-border bg-background p-10 text-center">
            <div className="text-4xl">🎉</div>
            <div className="mt-2 text-lg font-semibold">All squared up</div>
            <div className="text-sm text-muted-foreground">Everyone's balances are zero.</div>
          </div>
        )}
        {debts.map((d, i) => {
          const from = getMember(d.fromId);
          const to = getMember(d.toId);
          const isYou = d.fromId === currentUserId;
          return (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
              <MemberAvatar member={from} size={40} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <MemberAvatar member={to} size={40} />
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">{from.name}</span>
                  <span className="text-muted-foreground"> pays </span>
                  <span className="font-medium">{to.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">Sends {fmtUSD(d.amount)} USDC on Arc</div>
              </div>
              <div className="text-lg font-semibold">{fmtUSD(d.amount)}</div>
              {isYou ? (
                <button
                  onClick={() => startSettle(i)}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-brand hover:-translate-y-0.5 transition-transform"
                >
                  Settle
                </button>
              ) : (
                <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground" disabled>
                  Waiting
                </button>
              )}
            </div>
          );
        })}
      </div>

      {active !== null && (
        <SettleModal
          state={state}
          debt={debts[active]}
          onClose={close}
        />
      )}
    </AppShell>
  );
}

function SettleModal({
  state,
  debt,
  onClose,
}: {
  state: "idle" | "confirming" | "pending" | "done";
  debt: { fromId: string; toId: string; amount: number };
  onClose: () => void;
}) {
  const to = getMember(debt.toId);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={state === "done" ? onClose : undefined}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <MemberAvatar member={to} size={56} />
          <div className="mt-3 text-sm text-muted-foreground">Sending to {to.name}</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight">{fmtUSD(debt.amount)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{to.wallet}</div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
          <Row k="Network" v="Arc testnet" />
          <Row k="Asset" v="USDC" />
          <Row k="Gas" v="≈ $0.001 (paid in USDC)" />
          <Row k="Est. finality" v="< 1 second" />
        </div>

        <div className="mt-6">
          {state === "confirming" && (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-medium text-brand-foreground opacity-90">
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for wallet signature…
            </button>
          )}
          {state === "pending" && (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-medium text-brand-foreground opacity-90">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting to Arc…
            </button>
          )}
          {state === "done" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-[oklch(0.96_0.06_155)] py-3 text-sm font-medium text-[oklch(0.4_0.14_155)]">
                <Check className="h-4 w-4" /> Confirmed
              </div>
              <a href="#" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                View on Arc explorer <ExternalLink className="h-3 w-3" />
              </a>
              <button onClick={onClose} className="w-full rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-surface">
                Done
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-center"><BuiltOnArc /></div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
