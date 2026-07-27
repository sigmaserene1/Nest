import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X, ArrowRight, QrCode, Home as HomeIcon, AlertTriangle, ExternalLink } from "lucide-react";
import { isAddress, parseUnits } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MemberAvatar } from "./avatar";
import { members, currentUserId, getMember, fmtUSD, type Member } from "@/lib/nest-data";
import { ERC20_ABI, USDC_ADDRESS, USDC_DECIMALS, arcTestnet, explorerTxUrl } from "@/lib/wagmi";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { txStore } from "@/lib/tx-store";
import type { ActionMode } from "./action-modal-types";

export type { ActionMode };

const META: Record<ActionMode, { title: string; verb: string; cta: (a: number) => string; accent: string }> = {
  send:    { title: "Send USDC",        verb: "sent",      cta: (a) => `Send ${fmtUSD(a)}`,      accent: "bg-brand text-white shadow-brand" },
  request: { title: "Request USDC",     verb: "requested", cta: (a) => `Request ${fmtUSD(a)}`,   accent: "bg-emerald-600 text-white" },
  split:   { title: "Split an expense", verb: "split",     cta: (a) => `Send ${fmtUSD(a)}`,      accent: "bg-indigo-600 text-white" },
  scan:    { title: "Scan to pay",      verb: "sent",      cta: (a) => `Pay ${fmtUSD(a)}`,       accent: "bg-brand text-white shadow-brand" },
  rent:    { title: "Pay rent",         verb: "paid rent", cta: (a) => `Pay ${fmtUSD(a)}`,       accent: "bg-brand text-white shadow-brand" },
  settle:  { title: "Settle up",        verb: "settled",   cta: (a) => `Settle ${fmtUSD(a)}`,    accent: "bg-brand text-white shadow-brand" },
};

type Props = {
  mode: ActionMode | null;
  onClose: () => void;
  defaultAmount?: number;
  defaultRecipientId?: string;
  defaultToAddress?: string;
  lockRecipient?: boolean;
  lockAmount?: boolean;
  onSuccess?: (info: { hash: string; amount: number; recipientId?: string; toAddress: string; mode: ActionMode }) => void;
};

export function ActionModal({ mode, onClose, defaultAmount, defaultRecipientId, defaultToAddress, lockRecipient, lockAmount, onSuccess }: Props) {
  const others = useMemo(() => members.filter((m) => m.id !== currentUserId), []);
  const wallet = useArcWallet();
  const { writeContractAsync, reset: resetWrite } = useWriteContract();

  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [recipientId, setRecipientId] = useState<string>("");
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
    resetWrite();
    setAmount(defaultAmount ? String(defaultAmount) : mode === "rent" ? "800" : "");
    const rid = defaultRecipientId ?? (mode === "rent" ? others[0]?.id ?? "" : "");
    setRecipientId(rid);
    const seedAddr = defaultToAddress ?? (rid ? getMember(rid).wallet ?? "" : "");
    setToAddress(seedAddr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // React to receipt result
  useEffect(() => {
    if (!txHash) return;
    if (receipt.isSuccess) {
      const status = receipt.data?.status === "success" ? "confirmed" : "failed";
      txStore.update(txHash, { status });
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
      txStore.update(txHash, { status: "failed", error: receipt.error?.message });
      setError(receipt.error?.message ?? "Failed to confirm transaction.");
      setStage("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess, receipt.isError, receipt.data?.status, txHash]);

  if (!mode) return null;
  const meta = META[mode];
  const amt = parseFloat(amount) || 0;

  const isTransferMode = mode !== "request"; // request doesn't move funds
  const needsAddress = isTransferMode && mode !== "scan";
  const validAddress = !needsAddress || isAddress(toAddress);
  const hasFunds = !isTransferMode || amt <= wallet.usdcBalance;

  const canSubmit =
    amt > 0 &&
    (!isTransferMode ||
      (wallet.isConnected && wallet.isOnArc && validAddress && hasFunds));

  const pickRecipient = (id: string) => {
    setRecipientId(id);
    const w = getMember(id).wallet ?? "";
    setToAddress(w);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError("");

    // Request-only: no chain action, just show a confirmation
    if (mode === "request") {
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
      txStore.add({
        hash,
        from: wallet.address ?? "",
        to: toAddress,
        amount: amt,
        mode,
        note: note || undefined,
        recipientName: recipientId ? getMember(recipientId).name : undefined,
        createdAt: new Date().toISOString(),
        status: "pending",
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
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-muted" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {mode === "scan" && (
                <div className="mt-5 grid place-items-center rounded-[24px] bg-muted/60 p-8">
                  <QrCode className="h-24 w-24 text-foreground/70" strokeWidth={1.2} />
                  <div className="mt-3 text-xs text-muted-foreground">Paste a wallet address or QR result below</div>
                </div>
              )}

              {mode === "rent" && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-brand/10 p-3 text-brand">
                  <HomeIcon className="h-5 w-5" />
                  <div className="text-sm font-semibold">Bedford Loft · Monthly rent</div>
                </div>
              )}

              {isTransferMode && !wallet.isConnected && (
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
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Amount</div>
                  {wallet.isConnected && wallet.isOnArc && (
                    <div className="text-[11px] text-muted-foreground">
                      Balance <span className="font-bold text-foreground tabular-nums">{wallet.usdcBalance.toFixed(2)}</span> USDC
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
                {isTransferMode && wallet.isConnected && wallet.isOnArc && amt > 0 && !hasFunds && (
                  <div className="mt-2 text-[11px] font-semibold text-brand">Insufficient USDC balance on Arc Testnet.</div>
                )}
              </div>

              {mode !== "scan" && !lockRecipient && (
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
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recipient address</div>
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
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recipient address</div>
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
                {meta.cta(amt)}
              </button>
              <div className="mt-3 text-center text-[11px] text-muted-foreground">
                {isTransferMode ? "Onchain USDC transfer · Arc Testnet" : "Sends a request notification"}
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
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
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
                {stage === "confirming" && "Approve the USDC transfer in your wallet."}
                {stage === "pending" && "Waiting for onchain confirmation…"}
                {stage === "done" && mode === "request" &&
                  (recipientId ? `${getMember(recipientId).name.split(" ")[0]} will be notified.` : "Notification sent.")}
                {stage === "done" && mode !== "request" && "Confirmed on Arc Testnet."}
                {stage === "failed" && (error || "Something went wrong.")}
              </p>

              {txHash && (
                <div className="mt-4 space-y-2">
                  <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-[11px]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        stage === "done" ? "bg-emerald-500" : stage === "failed" ? "bg-brand" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                  </div>
                  <a
                    href={explorerTxUrl(txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mx-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                  >
                    View on Arcscan <ExternalLink className="h-3 w-3" />
                  </a>
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
