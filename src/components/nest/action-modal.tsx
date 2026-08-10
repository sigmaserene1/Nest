import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, X, ArrowRight, QrCode, AlertTriangle, ExternalLink } from "lucide-react";
import { isAddress, parseUnits } from "viem";
import { toast } from "sonner";
import { MemberAvatar } from "./avatar";
import { PaymentQr } from "./qr";
import { getMember, fmtUSD, type Member } from "@/lib/nest-data";
import { useMembers, useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { USDC_ADDRESS, USDC_DECIMALS, arcTestnet, openExplorerTx } from "@/lib/wagmi";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { recordReceipt } from "@/lib/receipts-store";
import type { ActionMode } from "./action-modal-types";

export type { ActionMode };

const META: Record<
  ActionMode,
  { title: string; verb: string; cta: (a: number) => string; accent: string }
> = {
  send: {
    title: "Send USDC",
    verb: "sent",
    cta: (a) => `Send ${fmtUSD(a)}`,
    accent: "bg-brand text-white shadow-brand",
  },
  request: {
    title: "Request USDC",
    verb: "requested",
    cta: (a) => `Request ${fmtUSD(a)}`,
    accent: "bg-emerald-600 text-white",
  },
  split: {
    title: "Split an expense",
    verb: "split",
    cta: (a) => `Split ${fmtUSD(a)}`,
    accent: "bg-indigo-600 text-white",
  },
  scan: {
    title: "Scan to pay",
    verb: "sent",
    cta: (a) => `Pay ${fmtUSD(a)}`,
    accent: "bg-brand text-white shadow-brand",
  },
  rent: {
    title: "Pay rent",
    verb: "paid rent",
    cta: (a) => `Pay ${fmtUSD(a)}`,
    accent: "bg-brand text-white shadow-brand",
  },
  settle: {
    title: "Settle up",
    verb: "settled",
    cta: (a) => `Settle ${fmtUSD(a)}`,
    accent: "bg-brand text-white shadow-brand",
  },
};

type Props = {
  mode: ActionMode | null;
  onClose: () => void;
  defaultAmount?: number;
  defaultRecipientId?: string;
  defaultToAddress?: string;
  lockRecipient?: boolean;
  lockAmount?: boolean;
  onSuccess?: (info: {
    hash: string;
    amount: number;
    recipientId?: string;
    toAddress: string;
    mode: ActionMode;
  }) => void;
};

export function ActionModal({
  mode,
  onClose,
  defaultAmount,
  defaultRecipientId,
  defaultToAddress,
  lockRecipient,
  lockAmount,
  onSuccess,
}: Props) {
  const members = useMembers();
  const { me, isDemo, rpcMessage, refresh } = useNestChain();
  const writes = useNestWrites();
  const wallet = useArcWallet();
  const others = useMemo(() => members.filter((m) => m.id !== me), [members, me]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [toAddress, setToAddress] = useState("");
  const [stage, setStage] = useState<"form" | "confirming" | "pending" | "done" | "failed">("form");
  const [step, setStep] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState("");

  const paymentUri = useMemo(() => {
    if (!isAddress(toAddress)) return "";
    const amt = Number(amount) > 0 ? parseUnits(String(amount), USDC_DECIMALS).toString() : "";
    const base = `ethereum:${USDC_ADDRESS}@${arcTestnet.id}/transfer?address=${toAddress}`;
    return amt ? `${base}&uint256=${amt}` : base;
  }, [toAddress, amount]);

  useEffect(() => {
    if (!mode) return;
    setStage("form");
    setNote("");
    setError("");
    setStep("");
    setTxHash("");
    setSplitIds([]);
    setAmount(defaultAmount ? String(defaultAmount) : "");
    const rid = defaultRecipientId ?? "";
    setRecipientId(rid);
    setToAddress(defaultToAddress ?? (rid ? (getMember(rid).wallet ?? "") : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!mode) return null;
  const meta = META[mode];
  const amt = parseFloat(amount) || 0;

  const isSplit = mode === "split" && !lockRecipient;
  const movesFunds = mode === "send" || mode === "scan" || mode === "settle" || mode === "rent";
  const needsAddress = !isSplit && mode !== "request";
  const validAddress = !needsAddress || isAddress(toAddress);
  const hasFunds = !movesFunds || amt <= wallet.usdcBalance;
  const splitCount = splitIds.length + 1; // includes you
  const perPerson = amt > 0 ? amt / splitCount : 0;

  const canSubmit = isDemo
    ? false
    : isSplit
      ? amt > 0 && splitIds.length > 0 && wallet.isConnected && wallet.isOnArc
      : amt > 0 &&
        validAddress &&
        wallet.isConnected &&
        wallet.isOnArc &&
        hasFunds &&
        (mode !== "request" || !!recipientId);

  const pickRecipient = (id: string) => {
    setRecipientId(id);
    setToAddress(getMember(id).wallet ?? "");
  };

  const toggleSplit = (id: string) =>
    setSplitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (!canSubmit) return;
    setError("");
    setStage("confirming");
    setStep("Confirm in your wallet…");
    try {
      let hash = "";
      if (isSplit) {
        hash = await writes.addExpense({
          title: note.trim() || "Split expense",
          category: "Other",
          amount: amt,
          participants: [me!, ...splitIds],
        });
      } else if (mode === "request") {
        hash = await writes.addExpense({
          title: note.trim() || "Payment request",
          category: "Other",
          amount: amt,
          participants: [recipientId],
        });
      } else if (mode === "settle") {
        hash = await writes.settleWith(toAddress as `0x${string}`, amt, (s) => {
          setStep(s);
          setStage(s.startsWith("Sending") ? "pending" : "confirming");
        });
      } else {
        hash = await writes.directTransfer(
          toAddress as `0x${string}`,
          amt,
          note.trim() || "USDC transfer",
          (s) => {
            setStep(s);
            setStage(s.startsWith("Sending") ? "pending" : "confirming");
          },
        );
      }
      setTxHash(hash);
      setStage("done");
      wallet.refetchBalance();
      void refresh();
      toast.success(
        mode === "settle" ? `Settled ${fmtUSD(amt)} USDC onchain` : "Transaction confirmed onchain",
      );
      if (hash && me && isAddress(toAddress) && (mode === "settle" || !isSplit) && mode !== "request") {
        recordReceipt({
          hash,
          from: me,
          to: toAddress.toLowerCase(),
          amount: amt,
          date: new Date().toISOString(),
          kind: mode === "settle" ? "settle" : mode === "rent" ? "rent" : mode === "scan" ? "qr" : "pay",
          note: note.trim() || undefined,
          chainId: arcTestnet.id,
        });
      }
      onSuccess?.({ hash, amount: amt, recipientId: recipientId || undefined, toAddress, mode });
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : "Transaction failed";
      if (/user rejected|denied/i.test(msg)) {
        setStage("form");
        return;
      }
      setError(msg);
      setStage("failed");
    }
  };

  const stageIsBusy = stage === "confirming" || stage === "pending";

  return (
          <div

        
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center"
        onClick={stageIsBusy ? undefined : onClose}
      >
        <div

          
          
          onClick={(e) => e.stopPropagation()}
          className="glass-strong max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] p-6 sm:rounded-[32px]"
        >
          {stage === "form" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{meta.title}</h3>
                <button
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {mode === "scan" && (
                <div className="mt-5 grid place-items-center rounded-[24px] bg-muted/60 p-6">
                  {isAddress(toAddress) ? (
                    <>
                      <PaymentQr value={paymentUri} />
                      <div className="mt-3 text-center text-xs text-muted-foreground">
                        Scan with any wallet to pay{" "}
                        <span className="font-mono">
                          {toAddress.slice(0, 6)}…{toAddress.slice(-4)}
                        </span>
                        {Number(amount) > 0 ? ` · ${fmtUSD(Number(amount))} USDC` : ""}
                      </div>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-24 w-24 text-foreground/70" strokeWidth={1.2} />
                      <div className="mt-3 text-xs text-muted-foreground">
                        Enter a recipient address below to generate a real QR code
                      </div>
                    </>
                  )}
                </div>
              )}

              {!wallet.isConnected && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>Connect your wallet in the top-right to sign onchain actions.</span>
                </div>
              )}
              {wallet.isConnected && !wallet.isOnArc && (
                <button
                  onClick={wallet.switchToArc}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-xs ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  <span className="font-semibold text-amber-900">Switch to Arc Testnet</span>
                  <span className="rounded-full bg-amber-600 px-3 py-1 font-bold text-white">
                    Switch
                  </span>
                </button>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Amount
                  </div>
                  {wallet.isConnected && wallet.isOnArc && (
                    <div className="text-[11px] text-muted-foreground">
                      Balance{" "}
                      <span className="font-bold tabular-nums text-foreground">
                        {wallet.usdcBalance.toFixed(2)}
                      </span>{" "}
                      USDC
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2 rounded-2xl bg-muted/50 px-4 py-4">
                  <span className="text-2xl font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    readOnly={lockAmount}
                    autoFocus={!lockAmount}
                    className="w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </div>
                {movesFunds && wallet.isConnected && wallet.isOnArc && amt > 0 && !hasFunds && (
                  <div className="mt-2 text-[11px] font-semibold text-brand">
                    Insufficient USDC balance on Arc Testnet.
                  </div>
                )}
              </div>

              {isSplit && (
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Split between
                    </div>
                    <button
                      onClick={() =>
                        setSplitIds(
                          splitIds.length === others.length ? [] : others.map((m) => m.id),
                        )
                      }
                      className="text-[11px] font-bold text-brand"
                    >
                      {splitIds.length === others.length ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {others.map((m) => {
                      const active = splitIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleSplit(m.id)}
                          className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-semibold transition ${
                            active
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-border bg-white text-foreground"
                          }`}
                        >
                          <MemberAvatar member={m} size={26} />
                          {m.name.split(" ")[0]}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                  {splitIds.length > 0 && amt > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-indigo-700">
                        {splitCount} people · equal split
                      </span>
                      <span className="font-bold tabular-nums text-indigo-700">
                        {fmtUSD(perPerson)} each
                      </span>
                    </div>
                  )}
                </div>
              )}

              {mode !== "scan" && !lockRecipient && !isSplit && (
                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {mode === "request" ? "Request from" : "To roommate"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {others.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => pickRecipient(m.id)}
                        className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-semibold transition ${
                          recipientId === m.id
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border bg-white text-foreground"
                        }`}
                      >
                        <MemberAvatar member={m} size={26} />
                        {m.name.split(" ")[0]}
                      </button>
                    ))}
                    {others.length === 0 && (
                      <div className="text-xs text-muted-foreground">
                        Invite a roommate first — they join onchain.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lockRecipient && recipientId && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                  <MemberAvatar member={getMember(recipientId)} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Paying
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {getMember(recipientId).name}
                    </div>
                  </div>
                </div>
              )}

              {!isSplit && mode !== "request" && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recipient address
                  </div>
                  <input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x…"
                    spellCheck={false}
                    readOnly={lockRecipient}
                    className="mt-2 w-full rounded-2xl bg-muted/50 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {toAddress && !validAddress && (
                    <div className="mt-2 text-[11px] font-semibold text-brand">
                      Not a valid EVM address.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isSplit || mode === "request" ? "What is it for?" : "Add a note (optional)"
                  }
                  className="w-full rounded-2xl bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {error && (
                <div className="mt-3 rounded-2xl bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
                  {error}
                </div>
              )}
              {isDemo && (
                <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
                  {rpcMessage}
                </div>
              )}

              <button
                disabled={!canSubmit}
                onClick={submit}
                className={`mt-6 w-full rounded-2xl py-4 text-sm font-bold transition disabled:opacity-40 ${meta.accent}`}
              >
                {isSplit
                  ? splitIds.length > 0
                    ? `Split ${fmtUSD(perPerson)} × ${splitCount}`
                    : "Select roommates to split with"
                  : meta.cta(amt)}
              </button>
              <div className="mt-3 text-center text-[11px] text-muted-foreground">
                {movesFunds
                  ? "Onchain USDC transfer · Arc Testnet"
                  : "Recorded onchain · payable in USDC on Arc"}
              </div>
            </>
          )}

          {stage !== "form" && (
            <div className="py-6 text-center">
              <div
                className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${stage === "failed" ? "bg-brand/10" : "bg-brand-soft"}`}
              >
                {stage === "done" ? (
                  <div

                    
                  >
                    <Check className="h-10 w-10 text-brand" strokeWidth={2.5} />
                  </div>
                ) : stage === "failed" ? (
                  <AlertTriangle className="h-10 w-10 text-brand" />
                ) : (
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold">
                {stage === "confirming" && "Confirm in your wallet"}
                {stage === "pending" && "Broadcasting on Arc…"}
                {stage === "done" &&
                  (mode === "request" || isSplit
                    ? "Recorded onchain"
                    : `You ${meta.verb} ${fmtUSD(amt)} 🎉`)}
                {stage === "failed" && "Transaction failed"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {stage === "confirming" && (step || "Approve the action in your wallet.")}
                {stage === "pending" && "Waiting for onchain confirmation…"}
                {stage === "done" &&
                  (isSplit
                    ? `Everyone owes ${fmtUSD(perPerson)} — they can settle in USDC.`
                    : mode === "request"
                      ? "They'll see the request in their Nest and can settle in USDC."
                      : "Confirmed on Arc Testnet.")}
                {stage === "failed" && (error || "Something went wrong.")}
              </p>

              {txHash && (
                <div className="mt-4 space-y-2">
                  <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-[11px]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${stage === "done" ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                  </div>
                  <button
                    onClick={() => openExplorerTx(txHash)}
                    className="mx-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                  >
                    View on ArcScan <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}

              {(stage === "done" || stage === "failed") && (
                <button
                  onClick={onClose}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
                >
                  Done <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      );
}

/**
 * Small controller for a single action modal. It intentionally returns only
 * state + handlers — rendering a component from a hook would create a new
 * component type on every render, remounting (and re-opening) the modal.
 */
export function useActionModal() {
  const [mode, setMode] = useState<ActionMode | null>(null);
  const open = useCallback((m: ActionMode) => setMode(m), []);
  const close = useCallback(() => setMode(null), []);
  return { mode, open, close };
}

export type { Member };
