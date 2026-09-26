import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  History,
  Info,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  isAddress,
  numberToHex,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { AppShell, Card } from "@/components/nest/app-shell";
import { BridgeStepTracker, type TrackerState } from "@/components/nest/bridge-widgets";
import { UsdcMark } from "@/components/nest/chain";
import { Button } from "@/components/ui/button";
import { useBridgeHistory, type BridgeHistoryEntry } from "@/lib/bridge-history";
import {
  getLifiApprovalAddress,
  getLifiChains,
  getLifiQuote,
  getLifiTokens,
  isCircleNativeUsdcRoute,
  lifiCostUsd,
  lifiExplorerFor,
  lifiToolName,
  pickUsdcToken,
  waitForLifiTransfer,
  type LifiChain,
  type LifiQuote,
  type LifiToken,
  type LifiTransactionRequest,
} from "@/lib/lifi";

const RETURN_PATHS = new Set(["/app/", "/app/settle", "/app/business"]);
const QUOTE_REFRESH_MS = 20_000;

const ERC20_APPROVAL_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export const Route = createFileRoute("/app/bridge")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
    amount: typeof search.amount === "string" ? search.amount : undefined,
    returnTo:
      typeof search.returnTo === "string" && RETURN_PATHS.has(search.returnTo)
        ? search.returnTo
        : undefined,
  }),
  component: BridgePage,
  head: () => ({
    meta: [
      { title: "LiFi bridge · Nest" },
      {
        name: "description",
        content:
          "Bridge USDC across LI.FI-supported EVM chains from Nest with CCTP-preferred routing.",
      },
      { property: "og:title", content: "LiFi bridge · Nest" },
      {
        property: "og:description",
        content: "Move USDC across LI.FI-supported EVM chains with Circle-native routes preferred.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function BridgePage() {
  const search = Route.useSearch();
  const { address, chainId, connector, isConnected } = useAccount();
  const { entries, addEntry, updateEntry, clearHistory } = useBridgeHistory(address);

  const [chains, setChains] = useState<LifiChain[]>([]);
  const [tokensByChain, setTokensByChain] = useState<Record<number, LifiToken[]>>({});
  const [fromChainId, setFromChainId] = useState<number | null>(null);
  const [toChainId, setToChainId] = useState<number | null>(null);
  const [amount, setAmount] = useState(
    search.amount && Number.isFinite(Number(search.amount)) && Number(search.amount) > 0
      ? search.amount
      : "1",
  );
  const [recipientInput, setRecipientInput] = useState("");
  const [state, setState] = useState<TrackerState>("loading");
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [sourceTxHash, setSourceTxHash] = useState<Hex | "">("");
  const [destinationTxHash, setDestinationTxHash] = useState<Hex | "">("");
  const [quote, setQuote] = useState<LifiQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteAt, setQuoteAt] = useState<number | null>(null);
  const [isQuoteLoading, setQuoteLoading] = useState(false);
  const [chainError, setChainError] = useState("");
  const initializedChains = useRef(false);
  const activeEntryId = useRef<string | null>(null);

  const source = chains.find((chain) => chain.id === fromChainId) ?? null;
  const destination = chains.find((chain) => chain.id === toChainId) ?? null;
  const sourceToken = source ? pickUsdcToken(tokensByChain[source.id]) : undefined;
  const destinationToken = destination ? pickUsdcToken(tokensByChain[destination.id]) : undefined;
  const recipient = recipientInput.trim() || address || "";
  const value = Number(amount);
  const hasValidAmount = Number.isFinite(value) && value > 0;
  const amountUnits = useMemo(() => {
    if (!sourceToken || !hasValidAmount) return 0n;
    try {
      return parseUnits(amount, sourceToken.decimals);
    } catch {
      return 0n;
    }
  }, [amount, hasValidAmount, sourceToken]);

  const routeSupported = Boolean(
    source && destination && source.id !== destination.id && sourceToken && destinationToken,
  );
  const isMainnetRoute = Boolean(source?.mainnet || destination?.mainnet);
  const isBusy = !["idle", "complete", "error"].includes(state);
  const quoteCostUsd = quote ? lifiCostUsd(quote) : 0;
  const estimatedReceived =
    quote && destinationToken?.decimals !== undefined
      ? formatUnits(BigInt(quote.estimate.toAmount ?? "0"), destinationToken.decimals)
      : hasValidAmount
        ? amount
        : "0";
  const minimumReceived =
    quote && destinationToken?.decimals !== undefined && quote.estimate.toAmountMin
      ? formatUnits(BigInt(quote.estimate.toAmountMin), destinationToken.decimals)
      : null;
  const routePreferenceLabel = quote
    ? isCircleNativeUsdcRoute(quote)
      ? "Circle CCTP/native USDC selected"
      : "CCTP preferred; LI.FI fallback selected"
    : "CCTP/native USDC preferred";

  useEffect(() => {
    let cancelled = false;
    async function loadChains() {
      try {
        const next = await getLifiChains();
        if (cancelled) return;
        setChains(next);
        setChainError("");
        setState((current) => (current === "loading" ? "idle" : current));
      } catch (caught) {
        if (cancelled) return;
        setChainError(getReadableError(caught));
        setState("error");
      }
    }
    loadChains();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chains.length || initializedChains.current) return;

    const searchedFrom = chainIdFromSearch(search.from, chains);
    const currentWalletChain =
      chainId && chains.some((chain) => chain.id === chainId) ? chainId : undefined;
    const fallbackFrom =
      searchedFrom ??
      currentWalletChain ??
      preferredChain(chains, [5042, 8453, 1, 42161, 10, 137])?.id ??
      chains[0]?.id;
    const searchedTo = chainIdFromSearch(search.to, chains);
    const fallbackTo =
      searchedTo && searchedTo !== fallbackFrom
        ? searchedTo
        : (preferredChain(chains, [8453, 5042, 42161, 10, 137, 1], fallbackFrom)?.id ??
          chains.find((chain) => chain.id !== fallbackFrom)?.id);

    setFromChainId(fallbackFrom ?? null);
    setToChainId(fallbackTo ?? null);
    initializedChains.current = true;
  }, [chainId, chains, search.from, search.to]);

  useEffect(() => {
    const ids = [fromChainId, toChainId].filter((id): id is number => typeof id === "number");
    const missing = ids.filter((id) => !tokensByChain[id]);
    if (!missing.length) return;

    let cancelled = false;
    async function loadTokens() {
      try {
        const next = await getLifiTokens(missing);
        if (!cancelled) {
          setTokensByChain((previous) => ({ ...previous, ...next }));
        }
      } catch (caught) {
        if (!cancelled) setQuoteError(getReadableError(caught));
      }
    }
    loadTokens();
    return () => {
      cancelled = true;
    };
  }, [fromChainId, toChainId, tokensByChain]);

  useEffect(() => {
    if (isBusy) return;
    if (
      !address ||
      !source ||
      !destination ||
      !sourceToken ||
      !destinationToken ||
      !hasValidAmount ||
      amountUnits <= 0n ||
      !isAddress(recipient)
    ) {
      setQuote(null);
      setQuoteAt(null);
      if (!routeSupported) setQuoteError("");
      return;
    }

    const quoteParams = {
      fromChain: source.id,
      toChain: destination.id,
      fromToken: sourceToken.address,
      toToken: destinationToken.address,
      fromAmount: amountUnits.toString(),
      fromAddress: address,
      toAddress: recipient as Address,
    };
    let cancelled = false;
    async function refreshQuote(silent = false) {
      if (!silent) setQuoteLoading(true);
      try {
        const next = await getLifiQuote(quoteParams);
        if (!cancelled) {
          setQuote(next);
          setQuoteAt(Date.now());
          setQuoteError("");
        }
      } catch (caught) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(getReadableError(caught));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }

    refreshQuote();
    const interval = setInterval(() => refreshQuote(true), QUOTE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    address,
    amountUnits,
    destination,
    destinationToken,
    hasValidAmount,
    isBusy,
    recipient,
    routeSupported,
    source,
    sourceToken,
  ]);

  const quoteAgeLabel = useMemo(() => {
    if (!quoteAt) return null;
    const seconds = Math.max(0, Math.round((Date.now() - quoteAt) / 1000));
    return seconds < 5 ? "just now" : `${seconds}s ago`;
  }, [quoteAt]);

  const resetTransientState = () => {
    if (isBusy) return;
    setState("idle");
    setError("");
    setStatusText("");
    setSourceTxHash("");
    setDestinationTxHash("");
  };

  const swapRoute = () => {
    if (isBusy || !source || !destination) return;
    setFromChainId(destination.id);
    setToChainId(source.id);
    setQuote(null);
    setQuoteError("");
    resetTransientState();
  };

  const chooseSource = (id: number) => {
    if (isBusy) return;
    if (id === toChainId) setToChainId(fromChainId);
    setFromChainId(id);
    setQuote(null);
    setQuoteError("");
    resetTransientState();
  };

  const chooseDestination = (id: number) => {
    if (isBusy) return;
    if (id === fromChainId) setFromChainId(toChainId);
    setToChainId(id);
    setQuote(null);
    setQuoteError("");
    resetTransientState();
  };

  async function executeBridge() {
    if (!address || !connector) return setError("Connect the wallet that holds the source USDC.");
    if (!source || !destination) return setError("LI.FI chains are still loading.");
    if (!sourceToken || !destinationToken) {
      return setError("USDC is not available for this source/destination pair on LI.FI.");
    }
    if (!Number.isFinite(value) || value <= 0 || amountUnits <= 0n)
      return setError("Enter a valid USDC amount.");
    if (source.id === destination.id) return setError("Choose two different chains.");
    if (!isAddress(recipient)) return setError("Enter a valid EVM recipient address.");

    setError("");
    setSourceTxHash("");
    setDestinationTxHash("");
    activeEntryId.current = null;

    try {
      setState("quoting");
      setStatusText("Getting executable LI.FI route...");
      const executionQuote =
        quote ??
        (await getLifiQuote({
          fromChain: source.id,
          toChain: destination.id,
          fromToken: sourceToken.address,
          toToken: destinationToken.address,
          fromAmount: amountUnits.toString(),
          fromAddress: address,
          toAddress: recipient as Address,
        }));
      setQuote(executionQuote);
      setQuoteAt(Date.now());

      const provider = await getConnectorProvider(connector);

      setState("switching");
      setStatusText(`Switching wallet to ${source.name}...`);
      await switchToLifiChain(provider, source);

      const approvalAddress = getLifiApprovalAddress(executionQuote);
      const requiredAmount = BigInt(executionQuote.action.fromAmount || amountUnits.toString());
      if (approvalAddress && !isNativeTokenAddress(sourceToken.address)) {
        setState("checking");
        setStatusText("Checking USDC allowance for LI.FI route...");
        const allowance = await readErc20Allowance(
          provider,
          sourceToken.address,
          address,
          approvalAddress,
        );

        if (allowance < requiredAmount) {
          setState("approving");
          setStatusText(
            `Approve ${formatUnits(requiredAmount, sourceToken.decimals)} USDC for LI.FI...`,
          );
          const approvalHash = await sendErc20Approval(
            provider,
            sourceToken.address,
            address,
            approvalAddress,
            requiredAmount,
          );
          await waitForEip1193Receipt(provider, approvalHash);
        }
      }

      setState("bridging");
      setStatusText(`Confirm the ${lifiToolName(executionQuote)} bridge transaction...`);
      const sourceHash = await sendLifiTransaction(
        provider,
        executionQuote.transactionRequest,
        address,
      );
      setSourceTxHash(sourceHash);

      const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      activeEntryId.current = entryId;
      addEntry({
        id: entryId,
        fromId: String(source.id),
        toId: String(destination.id),
        fromName: source.name,
        toName: destination.name,
        amount: Number(formatUnits(requiredAmount, sourceToken.decimals)).toFixed(2),
        status: "pending",
        startedAt: Date.now(),
        burnHash: sourceHash,
        explorerFrom: lifiExplorerFor(source),
        explorerTo: lifiExplorerFor(destination),
      });

      setStatusText("Source transaction sent. Waiting for source confirmation...");
      await waitForEip1193Receipt(provider, sourceHash);

      setState("tracking");
      setStatusText("LI.FI is tracking destination delivery...");
      const status = await waitForLifiTransfer(
        {
          bridge: executionQuote.tool,
          fromChain: source.id,
          toChain: destination.id,
          txHash: sourceHash,
        },
        {
          onPending: (next) =>
            setStatusText(
              next.substatusMessage ||
                next.substatus ||
                "LI.FI is tracking destination delivery...",
            ),
        },
      );

      const receivingHash = status.receiving?.txHash;
      if (receivingHash) setDestinationTxHash(receivingHash);
      setState("complete");
      setStatusText(
        `${formatCompactAmount(estimatedReceived)} USDC delivered to ${destination.name}.`,
      );
      updateEntry(entryId, { status: "complete", mintHash: receivingHash });
    } catch (caught) {
      console.error("LI.FI bridge error:", caught);
      setState("error");
      const message = getReadableError(caught);
      setError(message);
      if (activeEntryId.current) {
        updateEntry(activeEntryId.current, { status: "error", errorMessage: message });
      }
    }
  }

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-xs font-bold tracking-[0.16em] text-brand">LI.FI BRIDGE</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
            Move USDC across LI.FI-supported chains.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            LI.FI handles broad routing while Nest asks for Circle CCTP/native USDC routes whenever
            they exist.
          </p>
        </div>
      }
    >
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-visible !p-0">
          <div className="border-b border-border/70 px-4 py-4 sm:px-6">
            {isMainnetRoute && (
              <p className="mb-3 rounded-xl border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Mainnet route: this transfer uses real USDC. Check both networks, the selected provider, and fees before signing.
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-info/10">
                    <UsdcMark size={20} />
                  </span>
                  Bridge USDC
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  All LI.FI EVM routes, with CCTP/native USDC preferred
                </p>
              </div>
              <span className="rounded-lg border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                LI.FI
              </span>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {chainError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600">
                <b>Could not load LI.FI chains</b>
                <p className="mt-1">{chainError}</p>
              </div>
            )}

            <div className="relative grid gap-3 sm:grid-cols-2">
              <LifiChainPicker
                label="From"
                chain={source}
                chains={chains}
                disabled={isBusy || !chains.length}
                exclude={toChainId ?? undefined}
                onChange={chooseSource}
              />
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 max-sm:top-[calc(50%+10px)]">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={swapRoute}
                  disabled={isBusy || !source || !destination}
                  aria-label="Reverse bridge route"
                  title="Reverse bridge route"
                  className="h-10 w-10 rounded-full border-4 border-card bg-background shadow-soft transition-transform hover:rotate-180"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>
              <LifiChainPicker
                label="To"
                chain={destination}
                chains={chains}
                disabled={isBusy || !chains.length}
                exclude={fromChainId ?? undefined}
                onChange={chooseDestination}
              />
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-bold uppercase text-muted-foreground">
                Token
              </span>
              <div className="rounded-xl border border-brand bg-brand-soft px-3 py-3">
                <div className="flex items-center gap-2">
                  <UsdcMark size={22} />
                  <div className="min-w-0">
                    <div className="text-sm font-bold">USDC</div>
                    <div className="text-[10px] text-muted-foreground">
                      {sourceToken && destinationToken
                        ? `${sourceToken.name} -> ${destinationToken.name}`
                        : "Loading LI.FI token lists..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!routeSupported && source && destination && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  LI.FI does not expose USDC on one side of this pair yet. Choose another source or
                  destination chain.
                </span>
              </div>
            )}

            <div className="rounded-xl border bg-muted/30 p-4 transition focus-within:border-brand">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="bridge-amount"
                  className="text-[11px] font-bold uppercase text-muted-foreground"
                >
                  You send
                </label>
                {source && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {sourceToken ? `on ${source.name}` : "Loading token"}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="bridge-amount"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value.replace(/[^0-9.]/g, ""));
                    setQuote(null);
                    setQuoteError("");
                    resetTransientState();
                  }}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
                <span className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-bold shadow-sm">
                  <UsdcMark size={20} /> USDC
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                LI.FI checks liquidity, approval target, bridge tool, and destination estimate
                before execution.
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Recipient</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3 py-3 transition focus-within:border-brand">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={recipientInput}
                  onChange={(event) => {
                    setRecipientInput(event.target.value.trim());
                    setQuote(null);
                    setQuoteError("");
                    resetTransientState();
                  }}
                  placeholder={address ?? "Connect wallet first"}
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {address && recipientInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setRecipientInput("");
                      setQuote(null);
                      setQuoteError("");
                      resetTransientState();
                    }}
                    className="h-7 shrink-0 px-2 text-xs font-bold text-brand"
                  >
                    Use mine
                  </Button>
                )}
              </div>
            </label>

            <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Recipient receives</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <UsdcMark size={15} />
                  {formatCompactAmount(estimatedReceived)} USDC
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Route provider</span>
                <span>
                  {quote
                    ? lifiToolName(quote)
                    : isQuoteLoading
                      ? "Finding route..."
                      : "LI.FI quote"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Route priority</span>
                <span className="text-right">{routePreferenceLabel}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Estimated network/bridge cost</span>
                <span>
                  {quoteCostUsd > 0
                    ? `$${quoteCostUsd.toFixed(2)}`
                    : quote
                      ? "Included in quote"
                      : "--"}
                </span>
              </div>
              {minimumReceived && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Minimum received</span>
                  <span>{formatCompactAmount(minimumReceived)} USDC</span>
                </div>
              )}
              {quote?.estimate.executionDuration && (
                <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Estimated duration</span>
                  <span>{formatDuration(quote.estimate.executionDuration)}</span>
                </div>
              )}
              {quoteAgeLabel && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="h-3 w-3" /> Quote refreshed {quoteAgeLabel}
                </div>
              )}
              {quoteError && (
                <div className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-2 py-1.5 text-[11px] text-foreground">
                  {quoteError}
                  {(source?.id === 5042002 || destination?.id === 5042002) && (
                    <p className="mt-1">LI.FI may list Arc Testnet without an executable route for this pair. Try a different amount or chain; no transfer will be sent without a quote.</p>
                  )}
                </div>
              )}
            </div>

            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  type="button"
                  disabled={
                    isConnected &&
                    (isBusy || isQuoteLoading || !quote || !hasValidAmount || !source || !destination || !routeSupported)
                  }
                  onClick={isConnected ? executeBridge : openConnectModal}
                  className="h-13 w-full rounded-xl btn-gradient text-sm font-bold"
                >
                  {isBusy || isQuoteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isConnected ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {isBusy
                    ? actionLabel(state)
                    : !isConnected
                      ? "Connect wallet"
                      : !source || !destination
                        ? "Loading LI.FI chains"
                        : !routeSupported
                          ? "USDC route unavailable"
                        : !hasValidAmount
                          ? "Enter an amount"
                            : isQuoteLoading
                              ? "Finding LI.FI route..."
                              : !quote
                                ? "No executable LI.FI route"
                              : `Confirm transfer · ${value.toLocaleString(undefined, {
                                  maximumFractionDigits: 6,
                                })} USDC to ${destination.name}`}
                </Button>
              )}
            </ConnectButton.Custom>

            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> LI.FI routing · CCTP/native USDC
              preferred · Destination status tracked
            </div>

            <TransferNotice state={state} statusText={statusText} error={error} />

            {state === "complete" && search.returnTo && (
              <a
                href={search.returnTo}
                className="flex w-full items-center justify-center rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-xs font-bold text-brand transition hover:bg-brand/10"
              >
                Return to your Nest flow
              </a>
            )}

            {(sourceTxHash || destinationTxHash) && source && destination && (
              <div className="space-y-2 border-t pt-4">
                {sourceTxHash && (
                  <TxLink
                    label={`Source on ${source.name}`}
                    hash={sourceTxHash}
                    explorer={lifiExplorerFor(source)}
                  />
                )}
                {destinationTxHash && (
                  <TxLink
                    label={`Destination on ${destination.name}`}
                    hash={destinationTxHash}
                    explorer={lifiExplorerFor(destination)}
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="!p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-brand" />
              Transfer status
            </div>
            <BridgeStepTracker
              state={state}
              sourceName={source?.name ?? "source"}
              destinationName={destination?.name ?? "destination"}
            />
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <History className="h-4 w-4 text-brand" />
                Recent transfers
              </div>
              {entries.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={clearHistory}
                  aria-label="Clear history"
                  title="Clear transfer history"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {entries.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Your bridge transfers will show up here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {entries.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </Card>

          <Card className="!p-5 text-xs leading-5 text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p>
                This bridge uses LI.FI as the main router while preferring Circle CCTP/native USDC
                routes. Every transfer still has an executable quote, source confirmation, LI.FI
                destination polling, timeout, and error state, so the old attestation/status spinner
                cannot silently hold the flow.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function LifiChainPicker({
  label,
  chain,
  chains,
  disabled,
  exclude,
  onChange,
}: {
  label: string;
  chain: LifiChain | null;
  chains: LifiChain[];
  disabled: boolean;
  exclude?: number;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = chains.filter((item) => {
    const haystack = `${item.name} ${item.key} ${item.id}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="relative">
      <span className="mb-2 block text-[11px] font-bold uppercase text-muted-foreground">
        {label} network
      </span>
      <Button
        variant="outline"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="h-auto min-h-16 w-full justify-start rounded-xl border-border bg-card px-3 py-3 shadow-none hover:bg-muted/50"
      >
        <LifiChainLogo chain={chain} size={10} />
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">
              {chain?.name ?? "Loading..."}
            </span>
            {chain && (
              <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand">
                {chain.mainnet === false ? "Testnet" : "Mainnet"}
              </span>
            )}
          </span>
          <span className="mt-1 block text-[10px] font-medium text-muted-foreground">
            {chain ? `Chain ${chain.id} · ${chain.key}` : "Fetching LI.FI networks"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover p-2 shadow-elevated">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search LI.FI chains..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="scroll-clean mt-2 max-h-72 space-y-1 overflow-y-auto">
            {options.map((option) => (
              <Button
                variant="ghost"
                key={option.id}
                type="button"
                disabled={option.id === exclude}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left disabled:opacity-40 ${
                  option.id === chain?.id ? "bg-brand-soft" : ""
                }`}
              >
                <LifiChainLogo chain={option} size={9} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{option.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-bold uppercase text-muted-foreground">
                      {option.mainnet === false ? "Testnet" : "Mainnet"}
                    </span>
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    Chain {option.id} · {option.key}
                  </span>
                </span>
              </Button>
            ))}
            {options.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No chains match "{query}".
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LifiChainLogo({ chain, size = 10 }: { chain: LifiChain | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = (chain?.key || chain?.name || "?").slice(0, 4).toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-border/70 bg-card text-[9px] font-black text-foreground shadow-sm"
      style={{ width: size * 4, height: size * 4 }}
    >
      {chain?.logoURI && !failed ? (
        <img
          src={chain.logoURI}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function HistoryRow({ entry }: { entry: BridgeHistoryEntry }) {
  const icon =
    entry.status === "complete" ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
    ) : entry.status === "error" ? (
      <XCircle className="h-3.5 w-3.5 text-red-500" />
    ) : (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
    );
  const link = entry.mintHash
    ? `${entry.explorerTo}/tx/${entry.mintHash}`
    : entry.burnHash
      ? `${entry.explorerFrom}/tx/${entry.burnHash}`
      : null;

  const row = (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:bg-muted">
      <div className="flex items-center gap-1">
        <MiniChainLogo name={entry.fromName} />
        <MiniChainLogo name={entry.toName} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold">
          {entry.fromName} {"->"} {entry.toName}
        </div>
        <div className="text-[11px] text-muted-foreground">{entry.amount} USDC</div>
      </div>
      <div className="flex items-center gap-1">
        {icon}
        {link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
      </div>
    </div>
  );

  return (
    <li>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer">
          {row}
        </a>
      ) : (
        row
      )}
    </li>
  );
}

function MiniChainLogo({ name }: { name: string }) {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full border bg-card text-[8px] font-black">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TransferNotice({
  state,
  statusText,
  error,
}: {
  state: TrackerState;
  statusText: string;
  error: string;
}) {
  if (error)
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600">
        <b>Transfer paused</b>
        <p className="mt-1">{error}</p>
      </div>
    );
  if (!statusText) return null;
  const Icon = state === "complete" ? CheckCircle2 : state === "error" ? XCircle : Loader2;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${state === "complete" ? "text-green-600" : state === "error" ? "text-red-500" : "animate-spin"}`}
      />
      <span>{statusText}</span>
    </div>
  );
}

function TxLink({ label, hash, explorer }: { label: string; hash: Hex; explorer: string }) {
  if (!explorer) return null;
  return (
    <a
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-muted"
    >
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-1 text-brand">
        {hash.slice(0, 8)}...
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function chainIdFromSearch(value: string | undefined, chains: LifiChain[]) {
  if (!value) return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && chains.some((chain) => chain.id === numeric)) return numeric;
  const byKey = chains.find((chain) => chain.key.toLowerCase() === value.toLowerCase());
  return byKey?.id;
}

function preferredChain(chains: LifiChain[], candidates: number[], exclude?: number) {
  return candidates
    .map((id) => chains.find((chain) => chain.id === id && chain.id !== exclude))
    .find(Boolean);
}

async function getConnectorProvider(
  connector: NonNullable<ReturnType<typeof useAccount>["connector"]>,
) {
  const provider = await connector.getProvider();
  if (!provider) throw new Error("The connected wallet did not expose an EIP-1193 provider.");
  return provider as Eip1193Provider;
}

async function switchToLifiChain(provider: Eip1193Provider, chain: LifiChain) {
  const chainId = numberToHex(chain.id);
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
    return;
  } catch (caught) {
    const code = getErrorCode(caught);
    if (code !== 4902 && code !== -32603) throw caught;
  }

  const rpcUrls = chain.metamask?.rpcUrls?.filter(Boolean) ?? [];
  if (!rpcUrls.length) {
    throw new Error(`${chain.name} is not configured with an RPC URL from LI.FI.`);
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId,
        chainName: chain.metamask?.chainName ?? chain.name,
        nativeCurrency:
          chain.metamask?.nativeCurrency ??
          (chain.nativeToken
            ? {
                name: chain.nativeToken.name,
                symbol: chain.nativeToken.symbol,
                decimals: chain.nativeToken.decimals,
              }
            : { name: "Ether", symbol: "ETH", decimals: 18 }),
        rpcUrls,
        blockExplorerUrls: chain.metamask?.blockExplorerUrls ?? [],
      },
    ],
  });
}

async function readErc20Allowance(
  provider: Eip1193Provider,
  token: Address,
  owner: Address,
  spender: Address,
) {
  const data = encodeFunctionData({
    abi: ERC20_APPROVAL_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
  const result = await provider.request({
    method: "eth_call",
    params: [{ to: token, data }, "latest"],
  });
  const decoded = decodeFunctionResult({
    abi: ERC20_APPROVAL_ABI,
    functionName: "allowance",
    data: result as Hex,
  });
  return typeof decoded === "bigint" ? decoded : BigInt(String(decoded));
}

async function sendErc20Approval(
  provider: Eip1193Provider,
  token: Address,
  owner: Address,
  spender: Address,
  amount: bigint,
): Promise<Hex> {
  const data = encodeFunctionData({
    abi: ERC20_APPROVAL_ABI,
    functionName: "approve",
    args: [spender, amount],
  });
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [{ from: owner, to: token, data, value: "0x0" }],
  });
  return hash as Hex;
}

async function sendLifiTransaction(
  provider: Eip1193Provider,
  transaction: LifiTransactionRequest | undefined,
  from: Address,
): Promise<Hex> {
  if (!transaction) throw new Error("LI.FI did not return a transaction request.");
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [normalizeTransactionRequest(transaction, from)],
  });
  return hash as Hex;
}

function normalizeTransactionRequest(transaction: LifiTransactionRequest, from: Address) {
  const request: Record<string, string> = {
    from,
    to: transaction.to,
  };
  if (transaction.data) request.data = transaction.data;
  const value = toQuantity(transaction.value ?? "0");
  if (value) request.value = value;
  const gas = toQuantity(transaction.gas ?? transaction.gasLimit);
  if (gas) request.gas = gas;
  const gasPrice = toQuantity(transaction.gasPrice);
  if (gasPrice) request.gasPrice = gasPrice;
  const maxFeePerGas = toQuantity(transaction.maxFeePerGas);
  if (maxFeePerGas) request.maxFeePerGas = maxFeePerGas;
  const maxPriorityFeePerGas = toQuantity(transaction.maxPriorityFeePerGas);
  if (maxPriorityFeePerGas) request.maxPriorityFeePerGas = maxPriorityFeePerGas;
  return request;
}

function toQuantity(value?: string) {
  if (!value) return undefined;
  if (value.startsWith("0x")) return value;
  return numberToHex(BigInt(value));
}

async function waitForEip1193Receipt(provider: Eip1193Provider, hash: Hex): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < 10 * 60 * 1000) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { status?: Hex } | null;
    if (receipt) {
      if (receipt.status === "0x0") throw new Error("The wallet transaction reverted.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  throw new Error("Timed out waiting for source-chain transaction confirmation.");
}

function isNativeTokenAddress(address: Address) {
  const normalized = address.toLowerCase();
  return (
    normalized === "0x0000000000000000000000000000000000000000" ||
    normalized === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  );
}

function getErrorCode(error: unknown) {
  const maybe = error as {
    code?: number;
    data?: { originalError?: { code?: number } };
  };
  return maybe.code ?? maybe.data?.originalError?.code;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}

function formatCompactAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function actionLabel(state: TrackerState) {
  if (state === "loading") return "Loading LI.FI...";
  if (state === "quoting") return "Finding route...";
  if (state === "switching") return "Switching chain...";
  if (state === "checking") return "Checking approval...";
  if (state === "approving") return "Approving USDC...";
  if (state === "bridging") return "Sending bridge transaction...";
  if (state === "tracking") return "Tracking destination...";
  return "Preparing route...";
}

function getReadableError(error: unknown): string {
  const maybeError = error as { shortMessage?: string; details?: string; message?: string };
  const message =
    maybeError.shortMessage || maybeError.details || maybeError.message || "Unknown wallet error.";
  if (message.includes("User rejected")) return "You rejected the transaction in your wallet.";
  if (message.toLowerCase().includes("insufficient funds"))
    return "The wallet does not have enough funds for this transaction.";
  if (message.toLowerCase().includes("no available routes"))
    return "LI.FI could not find a route for this pair and amount.";
  if (message.toLowerCase().includes("allowance")) return "USDC approval failed or was rejected.";
  return message;
}
