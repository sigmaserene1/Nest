import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, Info, Link2, Wallet } from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { UsdcBadge, WalletChip } from "@/components/nest/chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useComputedBalances, useMe } from "@/lib/chain/nest-chain";
import { fmtUSD } from "@/lib/nest-data";
import { buildRoute, CCTP_SOURCES, CCTP_STATUS, estimateFee } from "@/lib/cctp";

export const Route = createFileRoute("/app/bridge")({
  component: BridgePage,
  head: () => ({
    meta: [
      { title: "Deposit USDC from any chain · Nest" },
      {
        name: "description",
        content:
          "Pay your Nest share from Arbitrum, Base, OP or Ethereum — Circle CCTP routes native USDC to Arc and settles your balance.",
      },
      { property: "og:title", content: "Deposit USDC from any chain · Nest" },
      {
        property: "og:description",
        content: "Cross-chain USDC debt consolidation into Arc, powered by Circle CCTP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function BridgePage() {
  const me = useMe();
  const wallet = useArcWallet();
  const { debts } = useComputedBalances();
  const owed = useMemo(
    () => debts.filter((d) => d.fromId === me).reduce((s, d) => s + d.amount, 0),
    [debts, me],
  );
  const [sourceId, setSourceId] = useState(CCTP_SOURCES[1].id);
  const [amount, setAmount] = useState<string>(owed > 0 ? owed.toFixed(2) : "25");

  const source = CCTP_SOURCES.find((c) => c.id === sourceId) ?? CCTP_SOURCES[0];
  const value = Number(amount) || 0;
  const fee = estimateFee(value);
  const steps = buildRoute(source, value);

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Cross-chain</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Deposit from any chain</h1>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <h3 className="text-sm font-bold">Pay from</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CCTP_SOURCES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSourceId(c.id)}
                  className={`rounded-lg border p-3 text-left ${
                    c.id === sourceId ? "border-foreground bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <span
                    className="block h-2.5 w-2.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="mt-2 block text-xs font-bold leading-tight">{c.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    domain {c.domain} · {c.eta}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold text-muted-foreground">Amount (USDC)</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-3 text-2xl font-bold tabular-nums"
                />
                <UsdcBadge size="md" />
              </div>
            </label>

            {owed > 0 && (
              <button
                onClick={() => setAmount(owed.toFixed(2))}
                className="mt-2 text-xs font-semibold text-brand"
              >
                Use my open balance · {fmtUSD(owed)}
              </button>
            )}

            <div className="mt-5 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Burned on {source.name}</span>
                <span className="font-bold tabular-nums">{fmtUSD(value)}</span>
              </div>
              <div className="my-2 flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minted natively on Arc</span>
                <span className="font-bold tabular-nums">{fmtUSD(Math.max(value - fee, 0))}</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                CCTP fast-transfer fee ≈ {fmtUSD(fee)} · no wrapped assets, no third-party bridge.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Destination</span>
              <span className="ml-auto">
                {wallet.address ? (
                  <WalletChip address={wallet.address} />
                ) : (
                  <span className="text-xs text-muted-foreground">Connect a wallet</span>
                )}
              </span>
            </div>

            <button
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-muted py-3 text-sm font-bold text-muted-foreground"
            >
              Execute route — awaiting Arc CCTP domain
            </button>
            <p className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {CCTP_STATUS}
            </p>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="!p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Link2 className="h-4 w-4 text-brand" /> Route
            </div>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="!p-6">
            <h3 className="text-sm font-bold">Why it matters</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Roommates rarely hold USDC on the same chain. CCTP burns native USDC where it sits and
              mints it on Arc, so the group always settles in one place — with no wrapped tokens and
              no liquidity pools in between.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
