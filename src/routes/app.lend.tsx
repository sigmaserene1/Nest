import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, PiggyBank, HandCoins, ArrowDownToLine, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { useLending, BORROW_APR, SUPPLY_APR, MAX_LTV } from "@/lib/chain/lending";
import { useNestWrites } from "@/lib/chain/writes";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { fmtUSD } from "@/lib/nest-data";

export const Route = createFileRoute("/app/lend")({
  component: LendPage,
  head: () => ({
    meta: [
      { title: "Lend & Borrow USDC · Nest" },
      {
        name: "description",
        content:
          "Supply USDC to the Nest pool on Arc Testnet to earn interest, or borrow USDC against your supplied balance.",
      },
      { property: "og:title", content: "Lend & Borrow USDC · Nest" },
      {
        property: "og:description",
        content: "Earn interest on supplied USDC or borrow against it — fully onchain on Arc Testnet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Action = "supply" | "withdraw" | "borrow" | "repay";

const LABELS: Record<Action, string> = {
  supply: "Supply USDC",
  withdraw: "Withdraw",
  borrow: "Borrow USDC",
  repay: "Repay",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function LendPage() {
  const { position, supported, isLoading, refresh } = useLending();
  const { supplyUsdc, withdrawUsdc, borrowUsdc, repayUsdc, claimInterest } = useNestWrites();
  const { usdcBalance, isConnected, refetchBalance } = useArcWallet();

  const [action, setAction] = useState<Action>("supply");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const max: Record<Action, number> = {
    supply: usdcBalance,
    withdraw: Math.max(position.supplied - position.debt / (MAX_LTV / 100), 0),
    borrow: position.available,
    repay: Math.min(position.debt, usdcBalance),
  };

  const run = async () => {
    const value = Number(amount);
    setError(null);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    try {
      setBusy("Confirm in your wallet…");
      if (action === "supply") await supplyUsdc(value, setBusy);
      else if (action === "withdraw") await withdrawUsdc(value);
      else if (action === "borrow") await borrowUsdc(value);
      else await repayUsdc(value, setBusy);
      setAmount("");
      await Promise.all([refresh(), refetchBalance()]);
      toast.success(`${LABELS[action]} confirmed onchain`);
    } catch (e) {
      const msg = (e as Error).message.split("\n")[0];
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    try {
      setBusy("Claiming interest…");
      await claimInterest();
      await Promise.all([refresh(), refetchBalance()]);
      toast.success("Interest claimed");
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell greeting={<h1 className="text-xl font-bold">Lend &amp; Borrow</h1>}>
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold">USDC lending pool</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Supply USDC to earn {SUPPLY_APR}% APR. Borrow up to {MAX_LTV}% of what you supplied
                at {BORROW_APR}% APR. Interest accrues per second, onchain.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Wallet</div>
              <div className="text-sm font-bold">{fmtUSD(usdcBalance)}</div>
            </div>
          </div>
        </Card>

        {!supported && !isLoading && (
          <Card>
            <div className="text-sm font-bold">Lending not available on this deployment</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your home points at an ExpenseManager deployed before the lending module was added.
              Deploy the upgraded contract from Setup to enable Lend &amp; Borrow.
            </p>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <PiggyBank className="h-4 w-4" /> Your supply
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Supplied" value={fmtUSD(position.supplied)} />
              <Stat
                label="Interest earned"
                value={fmtUSD(position.supplyInterest)}
                hint={`${SUPPLY_APR}% APR`}
              />
            </div>
            <button
              onClick={claim}
              disabled={!!busy || position.supplyInterest <= 0}
              className="mt-4 w-full rounded-md border border-border py-2 text-xs font-bold disabled:opacity-50"
            >
              Claim interest
            </button>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <HandCoins className="h-4 w-4" /> Your loan
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Debt" value={fmtUSD(position.debt)} hint={`${BORROW_APR}% APR`} />
              <Stat label="Available to borrow" value={fmtUSD(position.available)} />
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground">
              Borrow limit {fmtUSD(position.borrowLimit)} · Pool liquidity{" "}
              {fmtUSD(position.liquidity)}
            </div>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-4 gap-2">
            {(["supply", "withdraw", "borrow", "repay"] as Action[]).map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAction(a);
                  setError(null);
                }}
                className={`rounded-md border py-2 text-xs font-bold capitalize ${
                  action === a
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-md border border-border px-3 py-3 text-sm outline-none focus:border-foreground"
            />
            <button
              onClick={() => setAmount(String(Math.floor(max[action] * 100) / 100))}
              className="rounded-md border border-border px-3 py-3 text-xs font-bold"
            >
              Max
            </button>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Max {LABELS[action].toLowerCase()}: {fmtUSD(max[action])}
          </div>

          {error && (
            <div className="mt-3 rounded-md border border-border p-3 text-xs font-semibold text-brand">
              {error}
            </div>
          )}

          <button
            onClick={run}
            disabled={!!busy || !isConnected || !supported}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md btn-gradient py-3 text-sm font-bold disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {busy}
              </>
            ) : (
              <>
                {action === "withdraw" ? (
                  <ArrowDownToLine className="h-4 w-4" />
                ) : action === "repay" ? (
                  <Undo2 className="h-4 w-4" />
                ) : action === "borrow" ? (
                  <HandCoins className="h-4 w-4" />
                ) : (
                  <PiggyBank className="h-4 w-4" />
                )}
                {LABELS[action]}
              </>
            )}
          </button>
          {!isConnected && (
            <div className="mt-2 text-center text-[11px] text-muted-foreground">
              Connect your wallet to use the pool.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
