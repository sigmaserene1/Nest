import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Check, Clock, X, ExternalLink } from "lucide-react";
import { Card } from "./app-shell";
import { UsdcBadge } from "./chain";
import { ActionModal } from "./action-modal";
import { fmtUSD } from "@/lib/nest-data";
import { explorerTxUrl } from "@/lib/wagmi";
import {
  usePaymentRequests,
  markRequestPaid,
  setRequestStatus,
  type PaymentRequestRow,
} from "@/lib/nest-remote";

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function PaymentRequests() {
  const { incomingPending, outgoing, myWallet } = usePaymentRequests();
  const [paying, setPaying] = useState<PaymentRequestRow | null>(null);

  if (!myWallet) return null;
  const pendingOut = outgoing.filter((r) => r.status === "pending");
  const recentOut = outgoing.filter((r) => r.status !== "pending").slice(0, 2);
  if (incomingPending.length === 0 && pendingOut.length === 0 && recentOut.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-bold tracking-tight">Payment requests</h2>
        {incomingPending.length > 0 && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
            {incomingPending.length} to pay
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {incomingPending.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <Card className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <ArrowDownLeft className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {r.from_name || short(r.from_wallet)} requested {fmtUSD(Number(r.amount))}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.note || "No note"} · {short(r.from_wallet)}
                    </div>
                  </div>
                  <UsdcBadge />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setPaying(r)}
                    className="flex-1 rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-brand"
                  >
                    Pay {fmtUSD(Number(r.amount))}
                  </button>
                  <button
                    onClick={() => setRequestStatus(r.id, "declined")}
                    className="rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground"
                  >
                    Decline
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {[...pendingOut, ...recentOut].map((r) => (
          <Card key={r.id} className="!p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-foreground/70">
                <ArrowUpRight className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  You requested {fmtUSD(Number(r.amount))} from {r.to_name || short(r.to_wallet)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {r.status === "pending" && (
                    <>
                      <Clock className="h-3 w-3" /> Waiting for payment
                    </>
                  )}
                  {r.status === "paid" && (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Paid
                      {r.tx_hash && (
                        <a
                          href={explorerTxUrl(r.tx_hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                        >
                          view <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </>
                  )}
                  {(r.status === "declined" || r.status === "cancelled") && (
                    <>
                      <X className="h-3 w-3" /> {r.status === "declined" ? "Declined" : "Cancelled"}
                    </>
                  )}
                </div>
              </div>
              {r.status === "pending" && (
                <button
                  onClick={() => setRequestStatus(r.id, "cancelled")}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {paying && (
        <ActionModal
          mode="settle"
          onClose={() => setPaying(null)}
          defaultAmount={Number(paying.amount)}
          defaultToAddress={paying.from_wallet}
          lockAmount
          lockRecipient={false}
          onSuccess={({ hash }) => {
            void markRequestPaid(paying.id, hash);
          }}
        />
      )}
    </section>
  );
}
