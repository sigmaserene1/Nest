import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { UsdcBadge, WalletChip } from "@/components/nest/chain";
import { getMember, fmtUSD, type Debt } from "@/lib/nest-data";
import { useComputedBalances, useMe } from "@/lib/chain/nest-chain";
import { ActionModal } from "@/components/nest/action-modal";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { Shield, Zap, ArrowRight, ArrowDownToLine, ArrowUpRight, Send } from "lucide-react";

export const Route = createFileRoute("/app/settle")({
  component: Settle,
  head: () => ({
    meta: [
      { title: "Settle up · Nest" },
      {
        name: "description",
        content:
          "See exactly what you owe each roommate and settle your share peer-to-peer in native USDC on Arc.",
      },
      { property: "og:title", content: "Settle up · Nest" },
      {
        property: "og:description",
        content:
          "See exactly what you owe each roommate and settle your share peer-to-peer in native USDC on Arc.",
      },
    ],
  }),
});

function Settle() {
  const { debts } = useComputedBalances();
  const currentUserId = useMe();
  const mine = useMemo(() => debts.filter((d) => d.fromId === currentUserId), [debts]);
  const total = mine.reduce((s, d) => s + d.amount, 0);
  const wallet = useArcWallet();
  const shortfall = Math.max(0, total - wallet.usdcBalance);
  const [active, setActive] = useState<Debt | null>(null);
  const [queue, setQueue] = useState(false);
  const [freeSend, setFreeSend] = useState(false);

  const startSettlement = () => {
    if (mine.length === 0) {
      setFreeSend(true);
      return;
    }

    setQueue(mine.length > 1);
    setActive(mine[0]);
  };

  const settle = () => {
    if (shortfall > 0) return;
    startSettlement();
  };

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">One-tap settle</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Settle up</h1>
        </div>
      }
    >
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="settle-total-card !p-0 ring-0">
            <div className="relative overflow-hidden p-5 sm:p-7">
              <div className="settle-total-card__glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full" />
              <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Total to pay
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-4xl font-bold tracking-[-0.04em] text-slate-950 tabular-nums sm:text-5xl">
                    {fmtUSD(total)}
                  </div>
                  <span className="text-sm font-semibold text-slate-600">USDC</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                  <Zap className="h-3.5 w-3.5 text-brand" /> Instant on Arc · ~$0.001 fee
                </div>
                {wallet.isConnected && shortfall > 0 && wallet.environment === "testnet" && (
                  <Link
                    to="/app/bridge"
                    search={{
                      from: "base",
                      to: "arc",
                      amount: shortfall.toFixed(6),
                      returnTo: "/app/settle",
                    }}
                    className="mt-4 flex items-center justify-between rounded-2xl border border-slate-400/35 bg-slate-950/[0.06] px-4 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-950/[0.1]"
                  >
                    <span>
                      Need {fmtUSD(shortfall)} more USDC on Arc
                      <span className="mt-0.5 block font-medium text-slate-600">
                        Bridge the exact shortfall before settling
                      </span>
                    </span>
                    <ArrowDownToLine className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={settle}
                  disabled={shortfall > 0}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-4 text-sm font-bold disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {mine.length === 0
                    ? "Send USDC to a roommate"
                    : shortfall > 0
                      ? `Bridge ${fmtUSD(shortfall)} USDC first`
                      : mine.length > 1
                        ? `Settle all onchain · ${fmtUSD(total)}`
                        : `Pay ${getMember(mine[0].toId).name.split(" ")[0]} ${fmtUSD(mine[0].amount)}`}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>

          <Card className="settle-breakdown-card">
            <h2 className="text-sm font-bold">Breakdown</h2>
            <ul className="mt-4 space-y-2">
              {mine.map((d, i) => {
                const to = getMember(d.toId);
                return (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-3 sm:flex-nowrap"
                  >
                    <MemberAvatar member={to} size={40} ring />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{to.name}</div>
                      <div className="mt-0.5">
                        {to.wallet && <WalletChip address={to.wallet} />}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">{fmtUSD(d.amount)}</div>
                      <div className="mt-0.5">
                        <UsdcBadge />
                      </div>
                    </div>
                    <button
                      onClick={() => setActive(d)}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl btn-gradient px-3 py-2 text-xs font-bold sm:ml-2 sm:w-auto sm:rounded-full"
                    >
                      Pay <ArrowRight className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
              {mine.length === 0 && (
                <li className="settle-empty-state rounded-2xl border p-4 text-sm font-semibold">
                  Nothing to pay 🎉
                </li>
              )}
            </ul>
          </Card>
        </div>

        <Card className="settle-explainer !p-5 sm:!p-6">
          <h2 className="text-sm font-bold">How settlement works</h2>
          <ol className="mt-5 space-y-5">
            {[
              { t: "Exact amount", d: "We send the precise USDC you owe — nothing more." },
              { t: "Confirmed in ~1s", d: "Arc's sub-second finality means no waiting." },
              { t: "Balances update", d: "Debts are cleared the moment the tx confirms." },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="settle-step-number grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{s.t}</div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="settle-security-note mt-6 flex items-center gap-2 rounded-2xl p-3 text-[11px] text-muted-foreground">
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
      />

      {freeSend && <ActionModal mode="send" onClose={() => setFreeSend(false)} />}
    </AppShell>
  );
}
