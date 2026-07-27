import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { UsdcBadge, WalletChip } from "@/components/nest/chain";
import { currentUserId, getMember, fmtUSD, type Debt } from "@/lib/nest-data";
import { useComputedBalances, recordSettlement } from "@/lib/nest-store";
import { ActionModal } from "@/components/nest/action-modal";
import { Shield, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/settle")({
  component: Settle,
  head: () => ({ meta: [{ title: "Settle up · Nest" }, { name: "description", content: "Pay your share instantly in USDC." }] }),
});

function Settle() {
  const { debts } = useComputedBalances();
  const mine = useMemo(() => debts.filter((d) => d.fromId === currentUserId), [debts]);
  const total = mine.reduce((s, d) => s + d.amount, 0);
  const [active, setActive] = useState<Debt | null>(null);
  const [queue, setQueue] = useState(false);
  const [freeSend, setFreeSend] = useState(false);


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
              onClick={() => {
                if (mine.length === 0) {
                  setFreeSend(true);
                  return;
                }
                setQueue(mine.length > 1);
                setActive(mine[0]);
              }}
              className="mt-6 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01]"
            >
              {mine.length === 0
                ? "Send USDC to a roommate"
                : mine.length > 1
                  ? `Settle all onchain · ${fmtUSD(total)}`
                  : `Pay ${getMember(mine[0].toId).name.split(" ")[0]} ${fmtUSD(mine[0].amount)}`}
            </button>


          </Card>

          <Card>
            <h3 className="text-sm font-bold">Breakdown</h3>
            <ul className="mt-4 space-y-2">
              {mine.map((d, i) => {
                const to = getMember(d.toId);
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                    <MemberAvatar member={to} size={40} ring />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{to.name}</div>
                      <div className="mt-0.5">{to.wallet && <WalletChip address={to.wallet} />}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">{fmtUSD(d.amount)}</div>
                      <div className="mt-0.5"><UsdcBadge /></div>
                    </div>
                    <button
                      onClick={() => setActive(d)}
                      className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-2 text-xs font-bold text-white shadow-brand hover:brightness-110"
                    >
                      Pay <ArrowRight className="h-3 w-3" />
                    </button>
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
              { t: "Exact amount", d: "We send the precise USDC you owe — nothing more." },
              { t: "Confirmed in ~1s", d: "Arc's sub-second finality means no waiting." },
              { t: "Balances update", d: "Debts are cleared the moment the tx confirms." },
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

      <ActionModal
        mode={active ? "settle" : null}
        onClose={() => {
          const paidTo = active?.toId;
          setActive(null);
          if (!queue) return;
          const next = mine.find((d) => d.toId !== paidTo);
          if (next) setTimeout(() => setActive(next), 260);
          else setQueue(false);
        }}
        defaultAmount={active?.amount}
        defaultRecipientId={active?.toId}
        defaultToAddress={active ? getMember(active.toId).wallet : undefined}
        lockRecipient
        lockAmount
        onSuccess={({ hash, amount, recipientId }) => {
          if (!recipientId) return;
          recordSettlement({
            fromId: currentUserId,
            toId: recipientId,
            amount,
            txHash: hash,
          });
        }}
      />
    </AppShell>
  );
}
