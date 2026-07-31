import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X, ArrowRight, QrCode, Home as HomeIcon, AlertTriangle, ExternalLink } from "lucide-react";
import { isAddress, parseUnits } from "viem";
import { useConfig, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { MemberAvatar } from "./avatar";
import { PaymentQr } from "./qr";

import { currentUserId, getMember, fmtUSD, type Member } from "@/lib/nest-data";
import { useMembers, useExpenses } from "@/lib/nest-store";
import { ERC20_ABI, USDC_ADDRESS, USDC_DECIMALS, arcTestnet, openExplorerTx } from "@/lib/wagmi";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { saveTransaction, finalizeTransactionStatus } from "@/lib/tx-remote";
import { createPaymentRequest } from "@/lib/nest-remote";
import type { ActionMode } from "./action-modal-types";

export type { ActionMode };

const META: Record<ActionMode, { title: string; verb: string; cta: (a: number) => string; accent: string }> = {
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
    cta: (a) => `Send ${fmtUSD(a)}`,
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
  const expenses = useExpenses();
  const rentExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.category === "Rent")
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses],
  );
  const [rentExpenseId, setRentExpenseId] = useState<string>("");
  const others = useMemo(() => members.filter((m) => m.id !== currentUserId), [members]);
  const wallet = useArcWallet();
  const { writeContractAsync, reset: resetWrite } = useWriteContract();
  const wagmiConfig = useConfig();

  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [splitProgress, setSplitProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [splitHashes, setSplitHashes] = useState<`0x${string}`[]>([]);
  const [toAddress, setToAddress] = useState<string>("");
  const [stage, setStage] = useState<"form" | "confirming" | "pending" | "done" | "failed">("form");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string>("");

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: arcTestnet.id,
    query: { enabled: !!txHash },
  });

  // Reset on open
  useEffect(() => {
    if (!mode) return;
    setStage("form");
    setNote("");
    setError("");
    setTxHash(undefined);
    setSplitIds([]);
    setSplitHashes([]);
    setSplitProgress({ done: 0, total: 0 });
    resetWrite();
    setRentExpenseId("");
    setAmount(defaultAmount ? String(defaultAmount) : "");
    const rid = defaultRecipientId ?? "";
    setRecipientId(rid);
    const seedAddr = defaultToAddress ?? (rid ? (getMember(rid).wallet ?? "") : "");
    setToAddress(seedAddr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // React to receipt result
  useEffect(() => {
    if (!txHash) return;
    if (receipt.isSuccess) {
      const status = receipt.data?.status === "success" ? "confirmed" : "failed";
      void finalizeTransactionStatus(txHash);
      if (status === "confirmed") {
        setStage("done");
        wallet.refetchBalance();
        onSuccess?.({
          hash: txHash,
          amount: parseFloat(amount) || 0,
          recipientId: recipientId || undefined,
          toAddress,
          mode: mode!,
        });
      } else {
        setError("Transaction reverted onchain.");
        setStage("failed");
      }
    } else if (receipt.isError) {
      void finalizeTransactionStatus(txHash);
      setError(receipt.error?.message ?? "Failed to confirm transaction.");
      setStage("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess, receipt.isError, receipt.data?.status, txHash]);

  if (!mode) return null;
  const meta = META[mode];
  const amt = parseFloat(amount) || 0;

  const isTransferMode = mode !== "request"; // request doesn't move funds
  const isSplit = mode === "split" && !lockRecipient;
  const needsAddress = mode !== "scan" && !isSplit;
  const validAddress = !needsAddress || isAddress(toAddress);
  const hasFunds = !isTransferMode || amt <= wallet.usdcBalance;
  const splitCount = splitIds.length;
  const perPerson = splitCount > 0 ? amt / splitCount : 0;

  const canSubmit = isSplit
    ? amt > 0 && splitCount > 0 && wallet.isConnected && wallet.isOnArc && hasFunds
    : amt > 0 && validAddress && (isTransferMode ? wallet.isConnected && wallet.isOnArc && hasFunds : wallet.isConnected);

  const pickRecipient = (id: string) => {
    setRecipientId(id);
    const w = getMember(id).wallet ?? "";
    setToAddress(w);
  };

  const toggleSplit = (id: string) =>
    setSplitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Splits the amount equally and sends each roommate their share onchain, one tx at a time.
  const runSplit = async () => {
    const targets = splitIds
      .map((id) => getMember(id))
      .filter((m) => m.wallet && isAddress(m.wallet));
    if (targets.length !== splitIds.length) {
      setError("One of the selected roommates has no valid wallet address.");
      return;
    }
    const share = amt / targets.length;
    const shareStr = share.toFixed(USDC_DECIMALS);
    setSplitProgress({ done: 0, total: targets.length });
    setSplitHashes([]);
    setStage("confirming");

    for (let i = 0; i < targets.length; i++) {
      const m = targets[i];
      try {
        const hash = await writeContractAsync({
          chainId: arcTestnet.id,
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [m.wallet as `0x${string}`, parseUnits(shareStr, USDC_DECIMALS)],
        });
        setSplitHashes((h) => [...h, hash]);
        void saveTransaction({
          txHash: hash,
          fromWallet: wallet.address ?? "",
          toWallet: m.wallet!,
          toName: m.name,
          amount: share,
          mode: "split",
          note: note || undefined,
        });
        setStage("pending");
        const rec = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: arcTestnet.id });
        const ok = rec.status === "success";
        void finalizeTransactionStatus(hash);
        if (!ok) {
          setError(`Transfer to ${m.name} reverted onchain.`);
          setStage("failed");
          return;
        }
        onSuccess?.({ hash, amount: share, recipientId: m.id, toAddress: m.wallet!, mode: "split" });
        setSplitProgress({ done: i + 1, total: targets.length });
        setStage("confirming");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        if (/user rejected|denied/i.test(msg)) {
          setStage(i === 0 ? "form" : "failed");
          if (i > 0) setError(`Stopped after ${i} of ${targets.length} transfers.`);
          return;
        }
        setError(msg);
        setStage("failed");
        return;
      }
    }
    wallet.refetchBalance();
    setStage("done");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError("");

    if (isSplit) {
      await runSplit();
      return;
    }



    // Request-only: no funds move, but the request is stored so the roommate really receives it.
    if (mode === "request") {
      if (!wallet.address) {
        setError("Connect your wallet to send a request.");
        return;
      }
      if (!isAddress(toAddress)) {
        setError("Pick a roommate or enter a valid wallet address.");
        return;
      }
      setStage("confirming");
      const res = await createPaymentRequest({
        fromWallet: wallet.address,
        fromName: getMember(currentUserId).name,
        toWallet: toAddress,
        toName: recipientId ? getMember(recipientId).name : undefined,
        amount: amt,
        note: note || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        setStage("failed");
        return;
      }
      setStage("done");
      return;
    }

    // Scan is a demo QR flow — need a real address before proceeding
    if (mode === "scan" && !isAddress(toAddress)) {
      setError("Enter a valid recipient address to complete payment.");
      return;
    }

    try {
      setStage("confirming");
      const value = parseUnits(amount, USDC_DECIMALS);
      const hash = await writeContractAsync({
        chainId: arcTestnet.id,
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, value],
      });
      setTxHash(hash);
      void saveTransaction({
        txHash: hash,
        fromWallet: wallet.address ?? "",
        toWallet: toAddress,
        toName: recipientId ? getMember(recipientId).name : undefined,
        amount: amt,
        mode,
        note: note || undefined,
      });
      setStage("pending");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      // User rejection: return to form silently
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center"
        onClick={stageIsBusy ? undefined : onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 620, damping: 34, mass: 0.6 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong w-full max-w-md rounded-t-[32px] p-6 sm:rounded-[32px]"
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
                        <span className="font-mono">{toAddress.slice(0, 6)}…{toAddress.slice(-4)}</span>
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


              {mode === "rent" && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Rent expenses
                  </div>
                  {rentExpenses.length === 0 ? (
                    <div className="mt-2 flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                      <HomeIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">
                        No rent expense yet. Add one under Expenses with the “Rent” category and it will show up here.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {rentExpenses.map((e) => {
                        const payer = getMember(e.payerId);
                        const active = rentExpenseId === e.id;
                        return (
                          <button
                            key={e.id}
                            onClick={() => {
                              setRentExpenseId(e.id);
                              setAmount(String(e.amount));
                              setRecipientId(e.payerId);
                              setToAddress(payer.wallet ?? "");
                            }}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                              active ? "border-brand bg-brand/10" : "border-border bg-white hover:bg-muted/50"
                            }`}
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                              <HomeIcon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{e.title}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                Paid by {payer.name.split(" ")[0]} ·{" "}
                                {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </span>
                            <span className="text-sm font-bold tabular-nums">{fmtUSD(e.amount)}</span>
                            {active && <Check className="h-4 w-4 text-brand" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!wallet.isConnected && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>Connect your wallet in the top-right to send onchain payments.</span>
                </div>
              )}
              {isTransferMode && wallet.isConnected && !wallet.isOnArc && (
                <button
                  onClick={wallet.switchToArc}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-xs ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  <span className="font-semibold text-amber-900">Switch to Arc Testnet</span>
                  <span className="rounded-full bg-amber-600 px-3 py-1 font-bold text-white">Switch</span>
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
                      <span className="font-bold text-foreground tabular-nums">{wallet.usdcBalance.toFixed(2)}</span>{" "}
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
                    readOnly={lockAmount || mode === "rent"}
                    autoFocus={!lockAmount && mode !== "rent"}
                    className="w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </div>
                {isTransferMode && wallet.isConnected && wallet.isOnArc && amt > 0 && !hasFunds && (
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
                        setSplitIds(splitIds.length === others.length ? [] : others.map((m) => m.id))
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
                  {splitCount > 0 && amt > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-indigo-700">
                        {splitCount} {splitCount === 1 ? "person" : "people"} · equal split
                      </span>
                      <span className="font-bold tabular-nums text-indigo-700">{fmtUSD(perPerson)} each</span>
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
                    {others.map((m) => {
                      const active = recipientId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => pickRecipient(m.id)}
                          className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-semibold transition ${
                            active ? "border-brand bg-brand/10 text-brand" : "border-border bg-white text-foreground"
                          }`}
                        >
                          <MemberAvatar member={m} size={26} />
                          {m.name.split(" ")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {lockRecipient && recipientId && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                  <MemberAvatar member={getMember(recipientId)} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {mode === "request" ? "Requesting from" : "Paying"}
                    </div>
                    <div className="truncate text-sm font-semibold">{getMember(recipientId).name}</div>
                  </div>
                </div>
              )}

              {needsAddress && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recipient address
                  </div>
                  <input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x…"
                    spellCheck={false}
                    className="mt-2 w-full rounded-2xl bg-muted/50 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  {toAddress && !validAddress && (
                    <div className="mt-2 text-[11px] font-semibold text-brand">Not a valid EVM address.</div>
                  )}
                </div>
              )}
              {mode === "scan" && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recipient address
                  </div>
                  <input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x…"
                    spellCheck={false}
                    className="mt-2 w-full rounded-2xl bg-muted/50 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              )}

              <div className="mt-4">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="w-full rounded-2xl bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {error && (
                <div className="mt-3 rounded-2xl bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">{error}</div>
              )}

              <button
                disabled={!canSubmit}
                onClick={submit}
                className={`mt-6 w-full rounded-2xl py-4 text-sm font-bold transition disabled:opacity-40 ${meta.accent}`}
              >
                {isSplit
                  ? splitCount > 0
                    ? `Send ${fmtUSD(perPerson)} × ${splitCount}`
                    : "Select roommates to split with"
                  : meta.cta(amt)}
              </button>
              <div className="mt-3 text-center text-[11px] text-muted-foreground">
                {isTransferMode
                  ? "Onchain USDC transfer · Arc Testnet"
                  : "Sent to their wallet · payable in USDC on Arc"}
              </div>
            </>
          )}

          {stage !== "form" && (
            <div className="py-6 text-center">
              <div
                className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
                  stage === "failed" ? "bg-brand/10" : "bg-brand-soft"
                }`}
              >
                {stage === "done" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    <Check className="h-10 w-10 text-brand" strokeWidth={2.5} />
                  </motion.div>
                ) : stage === "failed" ? (
                  <AlertTriangle className="h-10 w-10 text-brand" />
                ) : (
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold">
                {stage === "confirming" && "Confirm in your wallet"}
                {stage === "pending" && "Broadcasting on Arc…"}
                {stage === "done" && (mode === "request" ? "Request sent" : `You ${meta.verb} ${fmtUSD(amt)} 🎉`)}
                {stage === "failed" && "Transaction failed"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {stage === "confirming" &&
                  (isSplit && splitProgress.total > 0
                    ? `Approve transfer ${Math.min(splitProgress.done + 1, splitProgress.total)} of ${splitProgress.total} in your wallet.`
                    : "Approve the USDC transfer in your wallet.")}
                {stage === "pending" && "Waiting for onchain confirmation…"}
                {stage === "done" &&
                  mode === "request" &&
                  "They'll see it in their Nest and can pay it in USDC on Arc."}
                {stage === "done" &&
                  mode !== "request" &&
                  (isSplit
                    ? `Sent ${fmtUSD(perPerson)} to each of ${splitProgress.total} roommates on Arc Testnet.`
                    : "Confirmed on Arc Testnet.")}
                {stage === "failed" && (error || "Something went wrong.")}
              </p>

              {isSplit && splitHashes.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {splitHashes.map((h) => (
                    <button
                      key={h}
                      onClick={() => openExplorerTx(h)}
                      className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-[11px] hover:underline"
                    >
                      {h.slice(0, 10)}…{h.slice(-8)} <ExternalLink className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {!isSplit && txHash && (
                <div className="mt-4 space-y-2">
                  <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-[11px]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        stage === "done"
                          ? "bg-emerald-500"
                          : stage === "failed"
                            ? "bg-brand"
                            : "bg-amber-400 animate-pulse"
                      }`}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useActionModal() {
  const [mode, setMode] = useState<ActionMode | null>(null);
  return {
    mode,
    open: (m: ActionMode) => setMode(m),
    close: () => setMode(null),
    Modal: (props: Omit<Props, "mode" | "onClose">) => (
      <ActionModal mode={mode} onClose={() => setMode(null)} {...props} />
    ),
  };
}

export type { Member };
