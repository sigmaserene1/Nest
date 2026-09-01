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

import { AppShell, Card } from "@/components/nest/app-shell";
import { ChainLogo, ChainPicker, BridgeStepTracker, type TrackerState } from "@/components/nest/bridge-widgets";
import {
  ANY_DESTINATION_CALLER,
  CCTP_CHAINS,
  CCTP_STATUS,
  ERC20_ABI,
  FINALITY_FAST,
  MESSAGE_TRANSMITTER_V2_ABI,
  TOKEN_MESSENGER_V2_ABI,
  addressToBytes32,
  formatUsdc,
  getCctpFee,
  waitForAttestation,
} from "@/lib/cctp";
import { useBridgeHistory, type BridgeHistoryEntry } from "@/lib/bridge-history";
import { wagmiConfig } from "@/lib/wagmi";

export const Route = createFileRoute("/app/bridge")({
  component: BridgePage,
  head: () => ({
    meta: [
      { title: "Bridge native USDC · Nest" },
      {
        name: "description",
        content:
          "Move native USDC between Arc Testnet and supported EVM testnets using Circle CCTP v2.",
      },
    ],
  }),
});

const QUOTE_REFRESH_MS = 15_000;

function BridgePage() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { entries, addEntry, updateEntry, clearHistory } = useBridgeHistory();

  const [fromId, setFromId] = useState("arc");
  const [toId, setToId] = useState("base");
  const [amount, setAmount] = useState("1");
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
  const value = Number(amount);
  const isBusy = !["idle", "complete", "error"].includes(state);
  const recipient = recipientInput.trim() || address || "";
  const minimumReceived = Math.max(0, value - Number(formatUsdc(maxFee)));

  // Fetch the connected wallet's native USDC balance on the selected source chain.
  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      if (!address) {
        setSourceBalance(null);
        return;
      }
      try {
        const client = getPublicClient(wagmiConfig, { chainId: source.chainId as never });
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
        const fee = await getCctpFee(source.domain, destination.domain, amountUnits);
        if (!cancelled) {
          setMaxFee(fee);
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
  }, [isBusy, source.id, source.domain, destination.id, destination.domain, value]);

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
    setAmount(formatUsdc(sourceBalance));
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

      const sourceWallet = await getWalletClient(wagmiConfig, { chainId: source.chainId as never });
      const sourcePublic = getPublicClient(wagmiConfig, { chainId: source.chainId as never });
      if (!sourceWallet || !sourcePublic) throw new Error(`Unable to connect to ${source.name}.`);

      setState("checking");
      setStatusText("Checking your USDC and the current CCTP fee…");
      const [balance, fee] = await Promise.all([
        sourcePublic.readContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        getCctpFee(source.domain, destination.domain, amountUnits),
      ]);
      if (balance < amountUnits) {
        throw new Error(
          `Insufficient USDC on ${source.name}. You have ${formatUsdc(balance)} USDC.`,
        );
      }
      if (fee >= amountUnits) throw new Error("The CCTP fee is greater than this transfer amount.");
      setMaxFee(fee);
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
      if (allowance < amountUnits) {
        setState("approving");
        setStatusText(`Approve ${value.toFixed(2)} USDC for Circle CCTP…`);
        const approval = await sourceWallet.writeContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [source.tokenMessengerV2, amountUnits],
        });
        setApprovalHash(approval);
        const approvalReceipt = await sourcePublic.waitForTransactionReceipt({ hash: approval });
        if (approvalReceipt.status !== "success")
          throw new Error("USDC approval transaction reverted.");
      }

      setState("burning");
      setStatusText(`Burning native USDC on ${source.name}…`);
      const burn = await sourceWallet.writeContract({
        address: source.tokenMessengerV2,
        abi: TOKEN_MESSENGER_V2_ABI,
        functionName: "depositForBurn",
        args: [
          amountUnits,
          destination.domain,
          addressToBytes32(recipient as Address),
          source.usdc,
          ANY_DESTINATION_CALLER,
          fee,
          FINALITY_FAST,
        ],
      });
      setBurnHash(burn);
      updateEntry(entryId, { burnHash: burn });
      const burnReceipt = await sourcePublic.waitForTransactionReceipt({ hash: burn });
      if (burnReceipt.status !== "success") throw new Error("CCTP burn transaction reverted.");

      setState("attesting");
      setStatusText("Burn confirmed. Waiting for Circle attestation…");
      const attestation = await waitForAttestation(source.domain, burn, {
        timeoutMs: 30 * 60 * 1_000,
        intervalMs: 5_000,
        onPending: () => setStatusText("Burn confirmed. Waiting for Circle attestation…"),
      });

      setState("switching");
      setStatusText(`Switching to ${destination.name} to receive native USDC…`);
      if (getAccount(wagmiConfig).chainId !== destination.chainId) {
        await switchChainAsync({ chainId: destination.chainId as never });
      }
      const destinationWallet = await getWalletClient(wagmiConfig, { chainId: destination.chainId as never });
      const destinationPublic = getPublicClient(wagmiConfig, { chainId: destination.chainId as never });
      if (!destinationWallet || !destinationPublic)
        throw new Error(`Unable to connect to ${destination.name}.`);

      setState("minting");
      setStatusText(`Minting native USDC on ${destination.name}…`);
      const mint = await destinationWallet.writeContract({
        address: destination.messageTransmitterV2,
        abi: MESSAGE_TRANSMITTER_V2_ABI,
        functionName: "receiveMessage",
        args: [attestation.message!, attestation.attestation!],
      });
      setMintHash(mint);
      const mintReceipt = await destinationPublic.waitForTransactionReceipt({ hash: mint });
      if (mintReceipt.status !== "success") throw new Error("CCTP mint transaction reverted.");

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
            Move native USDC, simply.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arc ↔ supported testnets, powered by Circle’s burn-and-mint CCTP v2.
          </p>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="!p-0 overflow-hidden">
          <div className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ChainLogo id={source.id} size={6} />
                Native USDC transfer
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                CCTP V2
              </span>
            </div>
          </div>
          <div className="space-y-3 p-5 sm:p-6">
            <ChainPicker label="From" chain={source} disabled={isBusy} exclude={toId} onChange={chooseSource} />
            <div className="-my-1 flex justify-center">
              <button
                type="button"
                onClick={swapRoute}
                disabled={isBusy}
                aria-label="Reverse bridge route"
                className="relative z-10 grid h-10 w-10 place-items-center rounded-xl border bg-background text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>
            <ChainPicker label="To" chain={destination} disabled={isBusy} exclude={fromId} onChange={chooseDestination} />

            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">You send</label>
                {sourceBalance !== null && (
                  <button
                    type="button"
                    onClick={useMaxBalance}
                    disabled={isBusy}
                    className="text-[11px] font-bold text-brand disabled:opacity-50"
                  >
                    Balance {formatUsdc(sourceBalance)} · Max
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
                <span className="rounded-full bg-background px-3 py-2 text-sm font-bold shadow-sm">
                  USDC
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                ≈ ${Number.isFinite(value) ? value.toFixed(2) : "0.00"} USD
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Recipient</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={recipientInput}
                  onChange={(event) => setRecipientInput(event.target.value.trim())}
                  placeholder={address ?? "Connect wallet first"}
                  disabled={isBusy}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {address && recipientInput && (
                  <button
                    type="button"
                    onClick={() => setRecipientInput("")}
                    className="shrink-0 text-xs font-bold text-brand"
                  >
                    Use mine
                  </button>
                )}
              </div>
            </label>

            <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Estimated received</span>
                <span className="font-bold">{minimumReceived.toFixed(2)} USDC</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Maximum CCTP fee</span>
                <span>{formatUsdc(maxFee)} USDC</span>
              </div>
              {quoteAgeLabel && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="h-3 w-3" /> Quote refreshed {quoteAgeLabel}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!isConnected || isBusy || !Number.isFinite(value) || value <= 0}
              onClick={executeBridge}
              className="flex w-full items-center justify-center gap-2 rounded-xl btn-gradient py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isBusy
                ? actionLabel(state)
                : isConnected
                  ? `Bridge to ${destination.name}`
                  : "Connect wallet"}
            </button>
            <TransferNotice state={state} statusText={statusText} error={error} />
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
          <Card className="!p-5">
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
                <button
                  type="button"
                  onClick={clearHistory}
                  aria-label="Clear history"
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
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
              You will sign the source-chain burn and the destination-chain mint. Keep this page
              open until the attestation completes; the burn transaction link remains your recovery
              reference.
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
