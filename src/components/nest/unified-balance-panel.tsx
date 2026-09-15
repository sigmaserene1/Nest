import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Loader2, RefreshCw, WalletCards, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

import { Card } from "@/components/nest/app-shell";
import {
  depositUnifiedUsdc,
  getUnifiedBalances,
  spendUnifiedUsdcToArc,
  type UnifiedBalanceSnapshot,
  type UnifiedSourceChain,
} from "@/lib/circle-unified";

type SourceChain = UnifiedSourceChain;

const SOURCE_OPTIONS: Array<{ id: SourceChain; label: string }> = [
  { id: "Base_Sepolia", label: "Base Sepolia" },
  { id: "Avalanche_Fuji", label: "Avalanche Fuji" },
];

function positiveAmount(value: string): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function formatAmount(value: string | undefined): string {
  const number = Number(value ?? 0);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    : "0.00";
}

export function UnifiedBalancePanel({
  defaultSpendAmount,
  defaultDepositAmount,
  compact = false,
  contextLabel,
}: UnifiedBalancePanelProps) {
  const { address, isConnected } = useAccount();
  const [snapshot, setSnapshot] = useState<UnifiedBalanceSnapshot | null>(null);
  const [source, setSource] = useState<SourceChain>("Base_Sepolia");
  const [depositAmount, setDepositAmount] = useState(
    defaultDepositAmount && defaultDepositAmount > 0 ? defaultDepositAmount.toFixed(6) : "1",
  );
  const [spendAmount, setSpendAmount] = useState(
    defaultSpendAmount && defaultSpendAmount > 0 ? defaultSpendAmount.toFixed(6) : "1",
  );
  const [busy, setBusy] = useState<"refresh" | "deposit" | "spend" | null>(null);
  const [lastExplorerUrl, setLastExplorerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSpendAmount && defaultSpendAmount > 0) {
      setSpendAmount(defaultSpendAmount.toFixed(6));
    }
  }, [defaultSpendAmount]);

  useEffect(() => {
    if (defaultDepositAmount && defaultDepositAmount > 0) {
      setDepositAmount(defaultDepositAmount.toFixed(6));
    }
  }, [defaultDepositAmount]);

  useEffect(() => {
    if (!isConnected) {
      setSnapshot(null);
      setLastExplorerUrl(null);
    }
  }, [isConnected, address]);

  const confirmed = Number(snapshot?.totalConfirmedBalance ?? 0);

  const chainBreakdown = useMemo(() => {
    const rows = snapshot?.breakdown?.flatMap((owner) => owner.breakdown ?? []) ?? [];
    const totals = new Map<string, number>();

    for (const row of rows) {
      const key = row.chain ?? "Unknown";
      totals.set(key, (totals.get(key) ?? 0) + Number(row.confirmedBalance ?? 0));
    }

    return [...totals.entries()].filter(([, value]) => value > 0);
  }, [snapshot]);

  const loadBalances = async (): Promise<UnifiedBalanceSnapshot> => getUnifiedBalances();

  const refresh = async () => {
    if (!isConnected) return;

    try {
      setBusy("refresh");
      setSnapshot(await loadBalances());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read Unified Balance.");
    } finally {
      setBusy(null);
    }
  };

  const deposit = async () => {
    if (!positiveAmount(depositAmount)) {
      return toast.error("Enter a positive deposit amount.");
    }

    try {
      setBusy("deposit");
      setLastExplorerUrl(null);
      const result = await depositUnifiedUsdc(
        source,
        Number(depositAmount).toFixed(6),
      );

      const explorerUrl = (result as { explorerUrl?: string }).explorerUrl;
      setLastExplorerUrl(explorerUrl ?? null);
      toast.success("USDC deposit submitted to Circle Unified Balance.");
      setSnapshot(await loadBalances());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unified Balance deposit failed.");
    } finally {
      setBusy(null);
    }
  };

  const spendToArc = async () => {
    if (!address) return toast.error("Connect your wallet first.");
    if (!positiveAmount(spendAmount)) return toast.error("Enter a positive spend amount.");
    if (Number(spendAmount) > confirmed) {
      return toast.error("Confirmed Unified Balance is lower than this amount.");
    }

    try {
      setBusy("spend");
      setLastExplorerUrl(null);

      const result = await spendUnifiedUsdcToArc(
        Number(spendAmount).toFixed(6),
        address,
      );

      const explorerUrl = (result as { explorerUrl?: string }).explorerUrl;
      setLastExplorerUrl(explorerUrl ?? null);
      toast.success("Unified USDC is being delivered to Arc.");
      setSnapshot(await loadBalances());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unified Balance spend failed.");
    } finally {
      setBusy(null);
    }
  };

  const loading = busy !== null;

  return (
    <Card className={compact ? "!p-4" : "!p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Circle Unified Balance</h2>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
                Gateway
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {contextLabel ??
                "Deposit USDC across supported testnets, then deliver the combined balance to Arc."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={!isConnected || loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold disabled:opacity-50"
        >
          {busy === "refresh" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Confirmed
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {formatAmount(snapshot?.totalConfirmedBalance)} USDC
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pending
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {formatAmount(snapshot?.totalPendingBalance)} USDC
          </div>
        </div>
      </div>

      {chainBreakdown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chainBreakdown.map(([chain, balance]) => (
            <span
              key={chain}
              className="rounded-full border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {chain.replaceAll("_", " ")} · {balance.toFixed(2)}
            </span>
          ))}
        </div>
      )}

      {!isConnected ? (
        <div className="mt-4 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          Connect your Nest wallet first. Unified Balance uses the same browser wallet—no private
          key or Circle API key is required.
        </div>
      ) : (
        <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2"}`}>
          <div className="rounded-xl border p-3">
            <div className="text-xs font-bold">Deposit into Unified Balance</div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <select
                value={source}
                onChange={(event) => setSource(event.target.value as SourceChain)}
                disabled={loading}
                className="min-w-0 rounded-lg border bg-background px-3 py-2 text-xs"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                disabled={loading}
                className="w-28 rounded-lg border bg-background px-3 py-2 text-right text-xs tabular-nums"
                aria-label="Unified Balance deposit amount"
              />
            </div>
            <button
              type="button"
              onClick={deposit}
              disabled={loading || !positiveAmount(depositAmount)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand/20 bg-brand-soft px-3 py-2.5 text-xs font-bold text-brand disabled:opacity-50"
            >
              {busy === "deposit" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-3.5 w-3.5" />
              )}
              Deposit {positiveAmount(depositAmount) ? Number(depositAmount).toFixed(2) : "0.00"} USDC
            </button>
          </div>

          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold">Spend Unified USDC to Arc</div>
              <span className="text-[10px] text-muted-foreground">Auto-allocation</span>
            </div>
            <input
              value={spendAmount}
              onChange={(event) => setSpendAmount(event.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              disabled={loading}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm tabular-nums"
              aria-label="Unified Balance spend amount"
            />
            <button
              type="button"
              onClick={spendToArc}
              disabled={loading || confirmed <= 0 || !positiveAmount(spendAmount)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg btn-gradient px-3 py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {busy === "spend" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Deliver to Arc
            </button>
          </div>
        </div>
      )}

      {lastExplorerUrl && (
        <a
          href={lastExplorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-[11px] font-bold text-brand hover:underline"
        >
          View latest Circle transaction ↗
        </a>
      )}

      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
        Confirmed Gateway funds can be auto-allocated across supported source chains. Arc delivery
        uses Circle forwarding so a second destination-chain signature is not required.
      </p>
    </Card>
  );
}
