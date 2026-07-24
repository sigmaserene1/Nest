import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X, ArrowRight, QrCode, Home as HomeIcon } from "lucide-react";
import { MemberAvatar } from "./avatar";
import { members, currentUserId, getMember, fmtUSD, type Member } from "@/lib/nest-data";

export type ActionMode = "send" | "request" | "split" | "scan" | "rent" | "settle";

const META: Record<ActionMode, { title: string; verb: string; cta: (a: number) => string; accent: string }> = {
  send:    { title: "Send USDC",      verb: "sent",      cta: (a) => `Send ${fmtUSD(a)}`,     accent: "bg-brand text-white shadow-brand" },
  request: { title: "Request USDC",   verb: "requested", cta: (a) => `Request ${fmtUSD(a)}`,  accent: "bg-emerald-600 text-white" },
  split:   { title: "Split an expense", verb: "split",   cta: (a) => `Split ${fmtUSD(a)}`,     accent: "bg-indigo-600 text-white" },
  scan:    { title: "Scan to pay",    verb: "sent",      cta: (a) => `Pay ${fmtUSD(a)}`,       accent: "bg-brand text-white shadow-brand" },
  rent:    { title: "Pay rent",       verb: "paid rent", cta: (a) => `Pay rent · ${fmtUSD(a)}`,accent: "bg-brand text-white shadow-brand" },
  settle:  { title: "Settle up",      verb: "settled",   cta: (a) => `Settle ${fmtUSD(a)}`,    accent: "bg-brand text-white shadow-brand" },
};

type Props = {
  mode: ActionMode | null;
  onClose: () => void;
  defaultAmount?: number;
  defaultRecipientId?: string;
};

export function ActionModal({ mode, onClose, defaultAmount, defaultRecipientId }: Props) {
  const others = useMemo(() => members.filter((m) => m.id !== currentUserId), []);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [stage, setStage] = useState<"form" | "confirming" | "pending" | "done">("form");

  useEffect(() => {
    if (mode) {
      setStage("form");
      setNote("");
      setAmount(defaultAmount ? String(defaultAmount) : mode === "rent" ? "800" : "");
      if (mode === "split") setRecipients(others.map((m) => m.id));
      else if (defaultRecipientId) setRecipients([defaultRecipientId]);
      else setRecipients(mode === "rent" ? [others[0]?.id].filter(Boolean) as string[] : []);
    }
  }, [mode, defaultAmount, defaultRecipientId, others]);

  if (!mode) return null;
  const meta = META[mode];
  const amt = parseFloat(amount) || 0;
  const perPerson = mode === "split" && recipients.length > 0 ? amt / (recipients.length + 1) : amt;
  const canSubmit = amt > 0 && (mode === "scan" || recipients.length > 0);

  const toggle = (id: string) => {
    if (mode === "send" || mode === "request" || mode === "rent") setRecipients([id]);
    else setRecipients((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  };

  const submit = () => {
    if (!canSubmit) return;
    setStage("confirming");
    setTimeout(() => setStage("pending"), 700);
    setTimeout(() => setStage("done"), 1900);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
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
                  <div className="mt-3 text-xs text-muted-foreground">Point at a Nest QR to pay instantly</div>
                </div>
              )}

              {mode === "rent" && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-brand/10 p-3 text-brand">
                  <HomeIcon className="h-5 w-5" />
                  <div className="text-sm font-semibold">Bedford Loft · Monthly rent</div>
                </div>
              )}

              <div className="mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Amount</div>
                <div className="mt-2 flex items-baseline gap-2 rounded-2xl bg-muted/50 px-4 py-4">
                  <span className="text-2xl font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">USDC</span>
                </div>
              </div>

              {mode !== "scan" && (
                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {mode === "split" ? "Split with" : mode === "request" ? "Request from" : "To"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {others.map((m) => {
                      const active = recipients.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggle(m.id)}
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
                  {mode === "split" && recipients.length > 0 && amt > 0 && (
                    <div className="mt-3 rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                      Each of {recipients.length + 1} pays{" "}
                      <span className="font-bold text-foreground">{fmtUSD(perPerson)}</span>
                    </div>
                  )}
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

              <button
                disabled={!canSubmit}
                onClick={submit}
                className={`mt-6 w-full rounded-2xl py-4 text-sm font-bold transition disabled:opacity-40 ${meta.accent}`}
              >
                {meta.cta(amt)}
              </button>
              <div className="mt-3 text-center text-[11px] text-muted-foreground">
                Instant on Arc Testnet · ~$0.001 fee
              </div>
            </>
          )}

          {stage !== "form" && (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-soft">
                {stage === "done" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                    <Check className="h-10 w-10 text-brand" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Loader2 className="h-10 w-10 animate-spin text-brand" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold">
                {stage === "confirming" && "Confirm in your wallet"}
                {stage === "pending" && "Broadcasting on Arc…"}
                {stage === "done" && `You ${meta.verb} ${fmtUSD(amt)} 🎉`}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {stage === "done"
                  ? recipients.length > 0
                    ? `${recipients.map((r) => getMember(r).name.split(" ")[0]).join(", ")} ${
                        mode === "request" ? "will be notified" : "received a notification"
                      }`
                    : "Payment complete"
                  : "Sub-second finality — hang tight."}
              </p>
              {stage === "done" && (
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
