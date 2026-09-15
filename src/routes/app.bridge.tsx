import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import { isAddress, type Address, type Hex } from "viem";
import { getAccount, getPublicClient, getWalletClient } from "@wagmi/core";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { AppShell, Card } from "@/components/nest/app-shell";
import { ChainLogo, ChainPicker, BridgeStepTracker, type TrackerState } from "@/components/nest/bridge-widgets";
import { UsdcMark } from "@/components/nest/chain";
import { Button } from "@/components/ui/button";
import {
  ANY_DESTINATION_CALLER,
  CCTP_CHAINS,
  CCTP_STATUS,
  ERC20_ABI,
  FORWARDING_SERVICE_HOOK_DATA,
  TOKEN_MESSENGER_V2_ABI,
  addressToBytes32,
  cctpFinalityForSource,
  formatUsdc,
  getCctpForwardingQuote,
  waitForForwardedMint,
} from "@/lib/cctp";
import { useBridgeHistory, type BridgeHistoryEntry } from "@/lib/bridge-history";
import {
  BRIDGE_TOKENS,
  bridgeToken,
  tokenAddressFor,
  type BridgeTokenId,
} from "@/lib/bridge-tokens";
import { wagmiConfig } from "@/lib/wagmi";

const RETURN_PATHS = new Set(["/app/", "/app/settle", "/app/business"]);

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
      { title: "Bridge native USDC · Nest" },
      {
        name: "description",
        content:
          "Move native USDC between Arc Testnet and supported EVM testnets using Circle CCTP v2.",
      },
      { property: "og:title", content: "Bridge native USDC · Nest" },
      {
        property: "og:description",
        content: "Move native USDC across Arc and supported testnets with Circle CCTP v2.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const QUOTE_REFRESH_MS = 15_000;

function BridgePage() {
  const search = Route.useSearch();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { entries, addEntry, updateEntry, clearHistory } = useBridgeHistory(address);

  const initialFrom =
    search.from && CCTP_CHAINS.some((chain) => chain.id === search.from) ? search.from : "arc";
  const initialTo =
    search.to &&
    search.to !== initialFrom &&
    CCTP_CHAINS.some((chain) => chain.id === search.to)
      ? search.to
      : initialFrom === "arc"
        ? "base"
        : "arc";
  const initialAmount =
    search.amount && Number.isFinite(Number(search.amount)) && Number(search.amount) > 0
      ? search.amount
      : "1";

  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(initialTo);
  const [amount, setAmount] = useState(initialAmount);
  const [tokenId, setTokenId] = useState<BridgeTokenId>("usdc");
  const [recipientInput, setRecipientInput] = useState("");
  const [state, setState] = useState<TrackerState>("idle");
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [approvalHash, setApprovalHash] = useState<Hex | "">("");
  const [burnHash, setBurnHash] = useState<Hex | "">("");
  const [mintHash, setMintHash] = useState<Hex | "">("");
  const [maxFee, setMaxFee] = useState<bigint>(0n);
  const [quoteAt, setQuoteAt] = useState<number | null>(null);
  const [sourceBalance, setSourceBalance] = useState<bigint | null>(null);
  const activeEntryId = useRef<string | null>(null);

  const source = CCTP_CHAINS.find((chain) => chain.id === fromId) ?? CCTP_CHAINS[0];
  const destination = CCTP_CHAINS.find((chain) => chain.id === toId) ?? CCTP_CHAINS[1];
  const token = bridgeToken(tokenId);
  const finalityThreshold = cctpFinalityForSource(source);
  const routeSupported =
    token.transferable &&
    Boolean(tokenAddressFor(token, source.id)) &&
    Boolean(tokenAddressFor(token, destination.id));
  const value = Number(amount);
  const hasValidAmount = Number.isFinite(value) && value > 0;
  const isBusy = !["idle", "complete", "error"].includes(state);
  const recipient = recipientInput.trim() || address || "";
  const amountUnits = hasValidAmount ? BigInt(Math.round(value * 1_000_000)) : 0n;
  const totalRequired = amountUnits + maxFee;
  const insufficientBalance = sourceBalance !== null && totalRequired > sourceBalance;
  const estimatedReceived = hasValidAmount ? value : 0;

  // Fetch the connected wallet's native USDC balance on the selected source chain.
  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!address) {
        setSourceBalance(null);
        return;
      }
      try {
        const client = getPublicClientForChain(source.chainId);
        if (!client) return;
        const balance = await client.readContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        if (!cancelled) setSourceBalance(balance);
      } catch {
        if (!cancelled) setSourceBalance(null);
      }
    }
    loadBalance();
    const interval = setInterval(loadBalance, QUOTE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, source.chainId, source.usdc, state]);

  // Auto-refresh the CCTP fee quote while the form is idle and the amount is valid.
  useEffect(() => {
    if (isBusy || source.id === destination.id || !Number.isFinite(value) || value <= 0) return;
    let cancelled = false;
    async function refreshQuote() {
      try {
        const amountUnits = BigInt(Math.round(value * 1_000_000));
        const quote = await getCctpForwardingQuote(
          source.domain,
          destination.domain,
          amountUnits,
          finalityThreshold,
        );
        if (!cancelled) {
          setMaxFee(quote.maxFee);
          setQuoteAt(Date.now());
        }
      } catch {
        // Quote refresh failures are non-fatal; the pre-flight check inside
        // executeBridge will surface a hard error if the amount truly can't be quoted.
      }
    }
    refreshQuote();
    const interval = setInterval(refreshQuote, QUOTE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    isBusy,
    source.id,
    source.domain,
    destination.id,
    destination.domain,
    value,
    finalityThreshold,
  ]);

  const swapRoute = () => {
    if (isBusy) return;
    setFromId(toId);
    setToId(fromId);
    setMaxFee(0n);
    setError("");
    setStatusText("");
  };

  const chooseSource = (id: string) => {
    if (id === toId) setToId(fromId);
    setFromId(id);
    setMaxFee(0n);
  };

  const chooseDestination = (id: string) => {
    if (id === fromId) setFromId(toId);
    setToId(id);
    setMaxFee(0n);
  };

  const useMaxBalance = () => {
    if (sourceBalance === null || isBusy) return;
    const spendable = sourceBalance > maxFee ? sourceBalance - maxFee : 0n;
    setAmount(formatUsdc(spendable));
  };

  async function executeBridge() {
    if (!address) return setError("Connect the wallet that holds the source USDC.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a valid USDC amount.");
    if (source.id === destination.id) return setError("Choose two different chains.");
    if (!isAddress(recipient)) return setError("Enter a valid EVM recipient address.");

    setError("");
    setApprovalHash("");
    setBurnHash("");
    setMintHash("");

    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeEntryId.current = entryId;

    try {
      const amountUnits = BigInt(Math.round(value * 1_000_000));
      if (amountUnits <= 0n) throw new Error("The amount is below one USDC base unit.");

      setState("switching");
      setStatusText(`Switching to ${source.name}…`);
      if (getAccount(wagmiConfig).chainId !== source.chainId) {
        await switchChainAsync({ chainId: source.chainId as never });
      }

      const sourceWallet = await getWalletClientForChain(source.chainId);
      const sourcePublic = getPublicClientForChain(source.chainId);
      if (!sourceWallet || !sourcePublic) throw new Error(`Unable to connect to ${source.name}.`);

      setState("checking");
      setStatusText("Checking your USDC and Circle forwarding fee…");
      const [balance, quote] = await Promise.all([
        sourcePublic.readContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        getCctpForwardingQuote(
          source.domain,
          destination.domain,
          amountUnits,
          finalityThreshold,
        ),
      ]);
      if (balance < quote.totalAmount) {
        throw new Error(
          `Insufficient USDC on ${source.name}. You need ${formatUsdc(quote.totalAmount)} USDC including forwarding fees, and have ${formatUsdc(balance)} USDC.`,
        );
      }
      setMaxFee(quote.maxFee);
      setQuoteAt(Date.now());

      addEntry({
        id: entryId,
        fromId: source.id,
        toId: destination.id,
        fromName: source.name,
        toName: destination.name,
        amount: value.toFixed(2),
        status: "pending",
        startedAt: Date.now(),
        explorerFrom: source.explorer,
        explorerTo: destination.explorer,
      });

      const allowance = await sourcePublic.readContract({
        address: source.usdc,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, source.tokenMessengerV2],
      });
      if (allowance < quote.totalAmount) {
        setState("approving");
        setStatusText(`Approve ${formatUsdc(quote.totalAmount)} USDC for Circle CCTP…`);
        const approval = await sourceWallet.writeContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [source.tokenMessengerV2, quote.totalAmount],
        });
        setApprovalHash(approval);
        const approvalReceipt = await sourcePublic.waitForTransactionReceipt({ hash: approval });
        if (approvalReceipt.status !== "success")
          throw new Error("USDC approval transaction reverted.");
      }

      setState("burning");
      setStatusText(`Burning native USDC on ${source.name} with Circle forwarding…`);
      const burn = await sourceWallet.writeContract({
        address: source.tokenMessengerV2,
        abi: TOKEN_MESSENGER_V2_ABI,
        functionName: "depositForBurnWithHook",
        args: [
          quote.totalAmount,
          destination.domain,
          addressToBytes32(recipient as Address),
          source.usdc,
          ANY_DESTINATION_CALLER,
          quote.maxFee,
          finalityThreshold,
          FORWARDING_SERVICE_HOOK_DATA,
        ],
      });
      setBurnHash(burn);
      updateEntry(entryId, { burnHash: burn });
      const burnReceipt = await sourcePublic.waitForTransactionReceipt({ hash: burn });
      if (burnReceipt.status !== "success") throw new Error("CCTP burn transaction reverted.");

      setState("attesting");
      setStatusText("Burn confirmed. Circle is attesting and forwarding the mint…");
      const mint = await waitForForwardedMint(source.domain, burn, {
        timeoutMs: 30 * 60 * 1_000,
        intervalMs: 5_000,
        onPending: () =>
          setStatusText("Burn confirmed. Circle is attesting and forwarding the mint…"),
      });

      setMintHash(mint);
      setState("minting");
      setStatusText(`Circle submitted the mint on ${destination.name}. Confirming…`);
      const destinationPublic = getPublicClientForChain(destination.chainId);
      if (!destinationPublic) throw new Error(`Unable to connect to ${destination.name}.`);
      const mintReceipt = await destinationPublic.waitForTransactionReceipt({ hash: mint });
      if (mintReceipt.status !== "success") throw new Error("Forwarded CCTP mint reverted.");

      setState("complete");
      setStatusText(`${value.toFixed(2)} USDC is now native on ${destination.name}.`);
      updateEntry(entryId, { status: "complete", mintHash: mint });
    } catch (caught) {
      console.error("CCTP bridge error:", caught);
      setState("error");
      const message = getReadableError(caught);
      setError(message);
      if (activeEntryId.current) {
        updateEntry(activeEntryId.current, { status: "error", errorMessage: message });
      }
    }
  }

  const quoteAgeLabel = useMemo(() => {
    if (!quoteAt) return null;
    const seconds = Math.max(0, Math.round((Date.now() - quoteAt) / 1000));
    return seconds < 5 ? "just now" : `${seconds}s ago`;
  }, [quoteAt, statusText]);

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-xs font-bold tracking-[0.16em] text-brand">CCTP ROUTER</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
            Move USDC across chains, then keep working.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fund Nest or move USDC out with Circle CCTP v2 + destination forwarding.
          </p>
        </div>
      }
    >
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-visible !p-0">
          <div className="border-b border-border/70 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-info/10">
                    <UsdcMark size={20} />
                  </span>
                  Bridge USDC
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Native USDC · no wrapped assets</p>
              </div>
              <span className="rounded-lg border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                CCTP V2
              </span>
            </div>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <div className="relative grid gap-3 sm:grid-cols-2">
              <ChainPicker label="From" chain={source} disabled={isBusy} exclude={toId} onChange={chooseSource} />
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 max-sm:top-[calc(50%+10px)]">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={swapRoute}
                  disabled={isBusy}
                  aria-label="Reverse bridge route"
                  title="Reverse bridge route"
                  className="h-10 w-10 rounded-full border-4 border-card bg-background shadow-soft transition-transform hover:rotate-180"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>
              <ChainPicker label="To" chain={destination} disabled={isBusy} exclude={fromId} onChange={chooseDestination} />
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-bold uppercase text-muted-foreground">Token</span>
              <div className="grid grid-cols-2 gap-2">
                {BRIDGE_TOKENS.map((option) => {
                  const active = option.id === tokenId;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      type="button"
                      disabled={isBusy}
                      onClick={() => setTokenId(option.id)}
                      className={`h-auto justify-start gap-2 rounded-xl px-3 py-3 ${
                        active ? "border-brand bg-brand-soft" : "bg-card hover:border-brand/40"
                      }`}
                    >
                      <UsdcMark size={22} className={option.id === "eurc" ? "opacity-60 grayscale" : ""} />
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-bold">{option.symbol}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {option.transferable ? option.name : "Not bridgeable yet"}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {!routeSupported && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>{token.unavailableReason ?? `${token.symbol} is not available on this route yet.`} Switch back to USDC to continue.</span>
              </div>
            )}

            <div className="rounded-xl border bg-muted/30 p-4 transition focus-within:border-brand">
              <div className="flex items-center justify-between">
                <label htmlFor="bridge-amount" className="text-[11px] font-bold uppercase text-muted-foreground">You send</label>
                {sourceBalance !== null && tokenId === "usdc" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={useMaxBalance}
                    disabled={isBusy}
                    className="h-7 rounded-lg px-2 text-[11px] font-bold text-brand"
                  >
                    Balance {formatUsdc(sourceBalance)} · Max
                  </Button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="bridge-amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
                <span className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-bold shadow-sm">
                  <UsdcMark size={20} /> {token.symbol}
                </span>
              </div>
              <div className={`mt-2 text-xs ${insufficientBalance ? "text-destructive" : "text-muted-foreground"}`}>
                {insufficientBalance
                  ? `Insufficient ${token.symbol} on ${source.name}`
                  : `≈ ${Number.isFinite(value) ? value.toFixed(2) : "0.00"} ${token.symbol}`}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Recipient</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-3 py-3 transition focus-within:border-brand">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={recipientInput}
                  onChange={(event) => setRecipientInput(event.target.value.trim())}
                  placeholder={address ?? "Connect wallet first"}
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {address && recipientInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setRecipientInput("")}
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
                <span className="flex items-center gap-1.5 font-bold"><UsdcMark size={15} />{estimatedReceived.toFixed(2)} USDC</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Maximum CCTP + forwarding fee</span>
                <span>{formatUsdc(maxFee)} USDC</span>
              </div>
              {quoteAgeLabel && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="h-3 w-3" /> Quote refreshed {quoteAgeLabel}
                </div>
              )}
            </div>

            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  type="button"
                  disabled={
                    isConnected && (isBusy || !hasValidAmount || insufficientBalance || !routeSupported)
                  }
                  onClick={isConnected ? executeBridge : openConnectModal}
                  className="h-13 w-full rounded-xl btn-gradient text-sm font-bold"
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isConnected ? <Send className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  {isBusy
                    ? actionLabel(state)
                    : !isConnected
                      ? "Connect wallet"
                      : !routeSupported
                        ? `${token.symbol} transfers unavailable`
                        : !hasValidAmount
                          ? "Enter an amount"
                          : insufficientBalance
                            ? `Insufficient ${token.symbol} balance`
                            : `Confirm transfer · ${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${token.symbol} to ${destination.name}`}
                </Button>
              )}
            </ConnectButton.Custom>
            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Secured by Circle CCTP · Native {token.symbol}
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
            {(approvalHash || burnHash || mintHash) && (
              <div className="space-y-2 border-t pt-4">
                {approvalHash && (
                  <TxLink label="USDC approval" hash={approvalHash} explorer={source.explorer} />
                )}
                {burnHash && (
                  <TxLink label={`Burn on ${source.name}`} hash={burnHash} explorer={source.explorer} />
                )}
                {mintHash && (
                  <TxLink label={`Mint on ${destination.name}`} hash={mintHash} explorer={destination.explorer} />
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
            <BridgeStepTracker state={state} sourceName={source.name} destinationName={destination.name} />
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
              <p className="mt-3 text-xs text-muted-foreground">Your bridge transfers will show up here.</p>
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
              <p>{CCTP_STATUS}</p>
            </div>
            <p className="mt-3 border-t pt-3">
              You sign on the source chain. Circle's Forwarding Service handles the destination
              mint, so you do not need destination-chain gas or a second destination signature.
              Keep the burn transaction link as your recovery reference.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
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
        <ChainLogo id={entry.fromId} size={6} />
        <ChainLogo id={entry.toId} size={6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold">
          {entry.fromName} → {entry.toName}
        </div>
        <div className="text-[11px] text-muted-foreground">{entry.amount} USDC</div>
      </div>
      <div className="flex items-center gap-1">
        {icon}
        {link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
      </div>
    </div>
  );

  return <li>{link ? <a href={link} target="_blank" rel="noreferrer">{row}</a> : row}</li>;
}

function TransferNotice({ state, statusText, error }: { state: TrackerState; statusText: string; error: string }) {
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
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${state === "complete" ? "text-green-600" : state === "error" ? "text-red-500" : "animate-spin"}`} />
      <span>{statusText}</span>
    </div>
  );
}

function TxLink({ label, hash, explorer }: { label: string; hash: Hex; explorer: string }) {
  return (
    <a
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-muted"
    >
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-1 text-brand">
        {hash.slice(0, 8)}…<ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

async function getWalletClientForChain(chainId: number) {
  // The route is selected at runtime from the configured CCTP chain list,
  // so the chain id isn't known to wagmi's config type at compile time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getWalletClient(wagmiConfig, { chainId: chainId as any });
}

function getPublicClientForChain(chainId: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getPublicClient(wagmiConfig, { chainId: chainId as any });
}

function actionLabel(state: TrackerState) {
  if (state === "approving") return "Approving USDC…";
  if (state === "burning") return "Burning native USDC…";
  if (state === "attesting") return "Waiting for Circle…";
  if (state === "minting") return "Minting native USDC…";
  return "Preparing route…";
}

function getReadableError(error: unknown): string {
  const maybeError = error as { shortMessage?: string; details?: string; message?: string };
  const message = maybeError.shortMessage || maybeError.details || maybeError.message || "Unknown wallet error.";
  if (message.includes("User rejected")) return "You rejected the transaction in your wallet.";
  if (message.toLowerCase().includes("insufficient funds")) return "The wallet does not have enough funds for this transaction.";
  if (message.includes("used nonce")) return "This CCTP message has already been received on the destination chain.";
  return message;
}
