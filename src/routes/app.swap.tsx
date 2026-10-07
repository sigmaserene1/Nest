import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { formatUnits, type EIP1193Provider } from "viem";
import type { SwapEstimate, SwapResult } from "@circle-fin/app-kit";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { ERC20_ABI, openExternal } from "@/lib/wagmi";
import { arcChainFor, useArcEnvironment } from "@/lib/arc-network";
import {
  NEST_SWAP_TOKENS,
  appKitArcChain,
  swapTokenFor,
  type NestSwapToken,
} from "@/lib/arc-swap-tokens";

export const Route = createFileRoute("/app/swap")({
  component: SwapPage,
  head: () => ({
    meta: [
      { title: "Swap · Nest" },
      {
        name: "description",
        content: "Review and swap USDC, EURC and cirBTC on Arc through Circle App Kit.",
      },
    ],
  }),
});

type ReviewedSwap = {
  estimate: SwapEstimate;
  account: string;
  environment: "mainnet" | "testnet";
  tokenIn: NestSwapToken;
  tokenOut: NestSwapToken;
  amountIn: string;
};

let appKitPromise: Promise<import("@circle-fin/app-kit").AppKit> | null = null;

async function getAppKit() {
  if (!appKitPromise) {
    appKitPromise = import("@circle-fin/app-kit").then(({ AppKit }) => new AppKit());
  }
  return appKitPromise;
}

function cleanAmount(value: string, decimals: number) {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid amount.");
  }
  const [, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Use at most ${decimals} decimal places for this asset.`);
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  return trimmed;
}

function readableSwapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /no route|unsupported route|331001|INPUT_UNSUPPORTED_ROUTE/i.test(message)
  ) {
    return "No executable App Kit route is available for this pair and amount right now. Try a smaller amount, reverse the pair, or retry later.";
  }
  if (/insufficient/i.test(message)) {
    return "The wallet does not have enough of the selected asset (or enough USDC for Arc gas).";
  }
  if (/rejected|denied|cancel/i.test(message)) {
    return "The wallet approval was cancelled.";
  }
  return message || "The swap could not be completed.";
}

function SwapPage() {
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const { address, connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [tokenIn, setTokenIn] = useState<NestSwapToken>("USDC");
  const [tokenOut, setTokenOut] = useState<NestSwapToken>("EURC");
  const [amountIn, setAmountIn] = useState("");
  const [reviewed, setReviewed] = useState<ReviewedSwap | null>(null);
  const [result, setResult] = useState<SwapResult | null>(null);
  const [busy, setBusy] = useState<"quote" | "swap" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load App Kit + its viem adapter as soon as the swap screen opens so the
  // first quote tap does not pay the dynamic-import cost.
  useEffect(() => {
    void Promise.all([
      import("@circle-fin/app-kit"),
      import("@circle-fin/adapter-viem-v2"),
    ]).catch(() => {});
  }, []);

  const inputToken = swapTokenFor(environment, tokenIn);
  const outputToken = swapTokenFor(environment, tokenOut);

  const {
    data: rawInputBalance,
    refetch: refetchInputBalance,
  } = useReadContract({
    address: inputToken.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcChain.id,
    query: {
      enabled: Boolean(address),
      refetchInterval: 15_000,
    },
  });

  const inputBalance = useMemo(() => {
    if (typeof rawInputBalance !== "bigint") return null;
    return Number(formatUnits(rawInputBalance, inputToken.decimals));
  }, [rawInputBalance, inputToken.decimals]);

  const clearReview = () => {
    setReviewed(null);
    setResult(null);
    setError(null);
  };

  const chooseInput = (next: NestSwapToken) => {
    if (next === tokenOut) setTokenOut(tokenIn);
    setTokenIn(next);
    clearReview();
  };

  const chooseOutput = (next: NestSwapToken) => {
    if (next === tokenIn) setTokenIn(tokenOut);
    setTokenOut(next);
    clearReview();
  };

  const flip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    clearReview();
  };

  const getAdapter = async () => {
    if (!connector) throw new Error("Connect your wallet first.");

    if (connector.id === "nest.circle" && environment === "mainnet") {
      throw new Error(
        "Nest's Circle embedded wallet currently runs on Arc Testnet. Use an external wallet for Arc Mainnet swaps.",
      );
    }

    const currentChainId = await connector.getChainId();
    if (currentChainId !== arcChain.id) {
      await switchChainAsync({ chainId: arcChain.id as never });
    }

    const provider = (await connector.getProvider()) as EIP1193Provider | undefined;
    if (!provider) throw new Error("The connected wallet did not provide an EVM signer.");

    const { createViemAdapterFromProvider } = await import(
      "@circle-fin/adapter-viem-v2"
    );
    return createViemAdapterFromProvider({ provider });
  };

  const requestParams = (amount: string) => ({
    tokenIn: inputToken.address,
    tokenOut: outputToken.address,
    amountIn: amount,
    config: {
      slippageBps: 300,
      allowanceStrategy: "approve" as const,
    },
  });

  const reviewQuote = async () => {
    setBusy("quote");
    setError(null);
    setResult(null);
    setReviewed(null);

    try {
      if (!address) throw new Error("Connect your wallet first.");
      if (tokenIn === tokenOut) throw new Error("Choose two different assets.");

      const amount = cleanAmount(amountIn, inputToken.decimals);
      if (inputBalance != null && Number(amount) > inputBalance) {
        throw new Error(`You only have ${inputBalance.toLocaleString(undefined, {
          maximumFractionDigits: inputToken.decimals,
        })} ${tokenIn} available.`);
      }

      const adapter = await getAdapter();
      const kit = await getAppKit();
      const estimate = await kit.estimateSwap({
        from: { adapter, chain: appKitArcChain(environment) },
        ...requestParams(amount),
      });

      setReviewed({
        estimate,
        account: address,
        environment,
        tokenIn,
        tokenOut,
        amountIn: amount,
      });
    } catch (cause) {
      setError(readableSwapError(cause));
    } finally {
      setBusy(null);
    }
  };

  const executeSwap = async () => {
    if (!reviewed || !address) return;

    setBusy("swap");
    setError(null);
    setResult(null);

    try {
      if (
        reviewed.account.toLowerCase() !== address.toLowerCase() ||
        reviewed.environment !== environment ||
        reviewed.tokenIn !== tokenIn ||
        reviewed.tokenOut !== tokenOut ||
        reviewed.amountIn !== amountIn.trim()
      ) {
        setReviewed(null);
        throw new Error("The swap details changed. Get a fresh quote before swapping.");
      }

      const adapter = await getAdapter();
      const kit = await getAppKit();
      const swapResult = await kit.swap({
        from: { adapter, chain: appKitArcChain(environment) },
        ...requestParams(reviewed.amountIn),
      });

      setResult(swapResult);
      setReviewed(null);
      await refetchInputBalance();
    } catch (cause) {
      setError(readableSwapError(cause));
    } finally {
      setBusy(null);
    }
  };

  const estimatedAmount = reviewed?.estimate.estimatedOutput?.amount ?? null;
  const highValue =
    environment === "mainnet" &&
    ((tokenIn !== "cirBTC" && Number(amountIn || 0) > 100) ||
      (tokenOut !== "cirBTC" && Number(estimatedAmount || 0) > 100));

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/app"
          aria-label="Back to home"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-card shadow-sm transition active:scale-[0.96]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Swap</h1>
          <p className="text-xs text-muted-foreground">
            USDC · EURC · cirBTC on {environment === "mainnet" ? "Arc Mainnet" : "Arc Testnet"}
          </p>
        </div>
      </div>

      {environment === "mainnet" ? (
        <div className="mb-4 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-xs leading-5 text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <strong className="text-foreground">Mainnet uses real assets.</strong>{" "}
            Review the quote, token pair and amount before signing. Start with a small amount when testing a new route.
          </p>
        </div>
      ) : null}

      <Card className="!p-4 sm:!p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="swap-amount" className="text-xs font-bold text-muted-foreground">
              You pay
            </label>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {inputBalance == null
                ? "Balance —"
                : `Balance ${inputBalance.toLocaleString(undefined, {
                    maximumFractionDigits: inputToken.decimals,
                  })} ${tokenIn}`}
            </span>
          </div>

          <div className="mt-2 flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-background/75 px-4 transition focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10">
            <input
              id="swap-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amountIn}
              onChange={(event) => {
                setAmountIn(event.target.value);
                clearReview();
              }}
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-[-0.04em] outline-none placeholder:text-muted-foreground/35"
            />
            <TokenBadge token={inputToken.symbol} />
          </div>

          <TokenPicker
            value={tokenIn}
            environment={environment}
            onChange={chooseInput}
          />
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-border" />
          <button
            type="button"
            onClick={flip}
            aria-label="Reverse swap pair"
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground shadow-sm transition hover:border-brand/35 hover:text-brand active:scale-[0.96]"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground">You receive</p>
          <div className="mt-2 flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-3xl font-bold tracking-[-0.04em] tabular-nums">
                {estimatedAmount ?? "—"}
              </div>
              <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                Estimated output
              </p>
            </div>
            <TokenBadge token={outputToken.symbol} />
          </div>

          <TokenPicker
            value={tokenOut}
            environment={environment}
            onChange={chooseOutput}
          />
        </div>

        <button
          type="button"
          onClick={() => void reviewQuote()}
          disabled={busy !== null || !amountIn.trim()}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy === "quote" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding route…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Review quote
            </>
          )}
        </button>
      </Card>

      {reviewed ? (
        <Card className="mt-4 !p-4 sm:!p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">
                App Kit quote
              </p>
              <h2 className="mt-1 text-base font-bold">Review before swapping</h2>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand" />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <ReviewRow label="You pay" value={`${reviewed.amountIn} ${reviewed.tokenIn}`} />
            <ReviewRow
              label="Estimated receive"
              value={`${reviewed.estimate.estimatedOutput.amount} ${reviewed.tokenOut}`}
            />
            <ReviewRow label="Network" value={environment === "mainnet" ? "Arc Mainnet" : "Arc Testnet"} />
            <ReviewRow label="Max slippage" value="3%" />
            <ReviewRow label="Routing" value="Circle App Kit" last />
          </div>

          {highValue ? (
            <p className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
              This is a higher-value mainnet swap. Double-check the amount and expected output before signing.
            </p>
          ) : null}

          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Swap routing uses third-party liquidity through Circle App Kit (currently LI.FI). Route availability and final output can change between quote and execution.
          </p>

          <button
            type="button"
            onClick={() => void executeSwap()}
            disabled={busy !== null}
            className="btn-gradient mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "swap" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Swapping…
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-4 w-4" />
                Swap {reviewed.tokenIn} → {reviewed.tokenOut}
              </>
            )}
          </button>
        </Card>
      ) : null}

      {result ? (
        <Card className="mt-4 !p-4 sm:!p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">Swap submitted</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {result.amountOut
                  ? `Received ${result.amountOut} ${tokenOut}.`
                  : "The swap was submitted. Check the explorer for final execution details."}
              </p>
              {result.explorerUrl ? (
                <button
                  type="button"
                  onClick={() => openExternal(result.explorerUrl!)}
                  className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold transition hover:border-brand/35 hover:text-brand"
                >
                  View transaction <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-4 px-1 text-[11px] leading-5 text-muted-foreground">
        Nest never auto-executes a swap. A quote must be reviewed first, and the swap only starts after you tap the Swap button and approve it in your connected wallet.
      </p>
    </AppShell>
  );
}

function TokenPicker({
  value,
  environment,
  onChange,
}: {
  value: NestSwapToken;
  environment: "mainnet" | "testnet";
  onChange: (token: NestSwapToken) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      {NEST_SWAP_TOKENS.map((symbol) => {
        const token = swapTokenFor(environment, symbol);
        const active = value === symbol;
        return (
          <button
            key={symbol}
            type="button"
            onClick={() => onChange(symbol)}
            className={`min-h-10 rounded-xl border px-2 text-xs font-bold transition active:scale-[0.98] ${
              active
                ? "border-brand/35 bg-brand/8 text-brand"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {token.symbol}
          </button>
        );
      })}
    </div>
  );
}

function TokenBadge({ token }: { token: NestSwapToken }) {
  return (
    <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-black shadow-sm">
      <span
        className={`grid h-6 w-6 place-items-center rounded-full text-[9px] ${
          token === "USDC"
            ? "bg-blue-500/12 text-blue-600"
            : token === "EURC"
              ? "bg-indigo-500/12 text-indigo-600"
              : "bg-amber-500/12 text-amber-700"
        }`}
      >
        {token === "cirBTC" ? "₿" : token[0]}
      </span>
      {token}
    </span>
  );
}

function ReviewRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 text-xs ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}
