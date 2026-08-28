import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  CheckCircle2,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Split,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { fmtRelative, fmtUSD, getMember, shortAddress } from "@/lib/nest-data";
import { explorerTxUrl } from "@/lib/wagmi";

export const Route = createFileRoute("/app/settle")({
  component: SettlePage,
  head: () => ({
    meta: [
      { title: "Net settlement · Nest" },
      {
        name: "description",
        content: "Preview and execute a deterministic net USDC settlement on Arc.",
      },
    ],
  }),
});

function SettlePage() {
  const wallet = useArcWallet();
  const { me, debts, net, settlements, usdcAllowance } = useNestChain();
  const { settleNet } = useNestWrites();
  const myDebts = debts.filter((debt) => debt.fromId === me);
  const totalDebt = myDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const requested = amount ? Number(amount) : totalDebt;
  const payable = Math.min(Math.max(0, requested || 0), totalDebt);
  const reserveAfter = wallet.usdcBalance - payable;

  const route = useMemo(() => {
    let remaining = payable;
    return myDebts
      .map((debt) => {
        const payment = Math.min(remaining, debt.amount);
        remaining -= payment;
        return { ...debt, amount: payment };
      })
      .filter((debt) => debt.amount > 0.000001);
  }, [myDebts, payable]);

  const canSettle = payable > 0 && payable <= wallet.usdcBalance && reserveAfter >= 0.01 && !busy;
  const needsApproval = usdcAllowance + 0.000001 < payable;

  const execute = async () => {
    if (!canSettle) return;
    setBusy(true);
    setStep("");
    try {
      const hash = await settleNet(payable, setStep);
      toast.success("Net settlement final on Arc", {
        description: `${hash.slice(0, 10)}...${hash.slice(-6)}`,
        action: {
          label: "Arcscan",
          onClick: () => window.open(explorerTxUrl(hash), "_blank", "noopener"),
        },
      });
      setAmount("");
    } catch (error) {
      toast.error("Settlement failed", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const mySettlements = settlements.filter((settlement) => settlement.debtorId === me);

  return (
    <AppShell
      greeting={
        <div>
          <div className="protocol-label">Atomic USDC routing</div>
          <h1 className="mt-2 text-2xl font-semibold">Net settlement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One contract call pays the current creditor route and reduces every position atomically.
          </p>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="protocol-label">Contract preview</div>
              <h2 className="mt-1 text-base font-semibold">Payment route</h2>
            </div>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {route.length} transfers
            </span>
          </div>

          {route.length > 0 ? (
            <div className="mt-5 divide-y divide-border border-y border-border">
              {route.map((debt, index) => {
                const creditor = getMember(debt.toId);
                return (
                  <div
                    key={`${debt.toId}-${index}`}
                    className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-4"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <ArrowDownRight className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{creditor.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {shortAddress(debt.toId)}
                      </div>
                    </div>
                    <div className="protocol-value text-sm font-semibold">
                      {fmtUSD(debt.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              <div>
                <div className="text-sm font-medium text-emerald-200">Nothing to settle</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your onchain net position is {fmtUSD(net[me ?? ""] ?? 0)}.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Status label="Total debt" value={fmtUSD(totalDebt)} />
            <Status label="Allowance" value={`${usdcAllowance.toFixed(2)} USDC`} />
            <Status
              label="Wallet after"
              value={`${Math.max(0, reserveAfter).toFixed(2)} USDC`}
              warning={reserveAfter < 0.01 && payable > 0}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Split className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Execute route</h2>
          </div>
          <label className="mt-5 block">
            <span className="protocol-label">Maximum to settle</span>
            <div className="relative mt-2">
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder={totalDebt.toFixed(2)}
                className="protocol-value h-12 pr-16 text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USDC
              </span>
            </div>
          </label>
          <button
            type="button"
            onClick={() => setAmount(totalDebt.toFixed(6))}
            className="mt-2 text-[11px] font-medium text-primary hover:underline"
          >
            Use full net debt
          </button>

          <div className="mt-5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>USDC approval</span>
              <span className={needsApproval ? "text-amber-300" : "text-emerald-300"}>
                {needsApproval ? "Required" : "Ready"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Arc memo</span>
              <span className="text-emerald-300">Attached</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Finality</span>
              <span>1 confirmation</span>
            </div>
          </div>

          {payable > wallet.usdcBalance && (
            <div className="mt-4 rounded-md border border-red-400/25 bg-red-400/5 p-3 text-xs text-red-300">
              Your Arc USDC balance is below this settlement amount.
            </div>
          )}
          {reserveAfter >= 0 && reserveAfter < 0.01 && payable > 0 && (
            <div className="mt-4 rounded-md border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-amber-300">
              Leave at least 0.01 USDC available for Arc gas.
            </div>
          )}

          <Button onClick={execute} disabled={!canSettle} className="mt-5 h-11 w-full">
            {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
            {busy ? step || "Finalizing" : `Settle ${fmtUSD(payable)}`}
          </Button>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
            The contract can transfer only the approved amount and only toward a positive treasury
            balance.
          </p>
        </Card>
      </div>

      <Card className="mt-5 !p-0">
        <div className="border-b border-border px-5 py-4">
          <div className="protocol-label">Immutable receipts</div>
          <h2 className="mt-1 text-base font-semibold">Your settlement history</h2>
        </div>
        <div className="divide-y divide-border">
          {mySettlements.map((settlement) => (
            <div
              key={settlement.id}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div>
                <div className="text-sm font-medium">Settlement #{settlement.id}</div>
                <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                  memo {shortAddress(settlement.memoId)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {settlement.byAgent ? "Agent" : "Wallet"} · {settlement.payments.length} payments ·{" "}
                {fmtRelative(settlement.date)}
              </div>
              <div className="protocol-value text-sm font-semibold">{fmtUSD(settlement.total)}</div>
            </div>
          ))}
          {mySettlements.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No settlement receipts for this wallet yet.
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" /> Nest never holds pooled member
        funds. USDC is transferred from the debtor directly to each creditor inside one atomic
        transaction.
      </div>
    </AppShell>
  );
}

function Status({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="protocol-label">{label}</div>
      <div
        className={`protocol-value mt-2 text-sm ${warning ? "text-amber-300" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
