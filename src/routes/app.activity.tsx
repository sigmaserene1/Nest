import { createFileRoute } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { TxHashPill, shortAddr } from "@/components/nest/chain";
import { getMember, fmtUSD, fmtRelative, categoryMeta, mockTxHash } from "@/lib/nest-data";
import { useHouseholdActivity } from "@/lib/nest-store";
import { useTxHistory } from "@/lib/tx-store";
import { explorerTxUrl } from "@/lib/wagmi";
import { ArrowLeftRight, UserPlus, ExternalLink, Loader2, AlertTriangle, Check } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
  head: () => ({
    meta: [{ title: "Activity · Nest" }, { name: "description", content: "Everything happening in your home." }],
  }),
});

const filters = ["All", "Onchain", "Expenses", "Payments", "Members"] as const;

function ActivityPage() {
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const txs = useTxHistory();
  const { address } = useAccount();
  const activity = useHouseholdActivity();

  const filtered = activity.filter((a) => {
    if (f === "All" || f === "Onchain") return f === "All";
    if (f === "Expenses") return a.kind === "expense";
    if (f === "Payments") return a.kind === "settlement";
    return a.kind === "member";
  });
  const showTxs = f === "All" || f === "Onchain" || f === "Payments";

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Live feed</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Activity</h1>
        </div>
      }
    >
      <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {filters.map((c) => (
          <button
            key={c}
            onClick={() => setF(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              f === c ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-black/[0.04]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {showTxs && txs.length > 0 && (
        <Card className="mt-5 !p-2">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Onchain · Arc Testnet
          </div>
          <ul>
            {txs.map((t, i) => {
              const isReceived =
                !!address &&
                t.to.toLowerCase() === address.toLowerCase() &&
                t.from.toLowerCase() !== address.toLowerCase();

              const statusMeta =
                t.status === "confirmed"
                  ? { dot: "bg-emerald-500", label: "Confirmed", icon: <Check className="h-3 w-3 text-emerald-600" /> }
                  : t.status === "failed"
                    ? { dot: "bg-brand", label: "Failed", icon: <AlertTriangle className="h-3 w-3 text-brand" /> }
                    : {
                        dot: "bg-amber-400 animate-pulse",
                        label: "Pending",
                        icon: <Loader2 className="h-3 w-3 animate-spin text-amber-600" />,
                      };
              return (
                <li
                  key={t.hash}
                  className={`flex items-center gap-3 p-3 ${i !== txs.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {t.mode === "rent"
                        ? "Rent payment"
                        : t.mode === "settle"
                          ? "Settled up"
                          : t.mode === "split"
                            ? "Split share"
                            : t.mode === "scan"
                              ? "QR payment"
                              : "Sent USDC"}
                      {t.recipientName && (
                        <span className="font-normal text-muted-foreground"> → {t.recipientName.split(" ")[0]}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                      <span>·</span>
                      <span>{fmtRelative(t.createdAt)}</span>
                      <span>·</span>
                      <span className="font-mono">to {shortAddr(t.to)}</span>
                      <a
                        href={explorerTxUrl(t.hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] hover:bg-muted/80"
                      >
                        {t.hash.slice(0, 6)}…{t.hash.slice(-4)} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    {t.error && <div className="mt-1 text-[10px] font-semibold text-brand">{t.error.slice(0, 90)}</div>}
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${t.status === "failed" ? "text-muted-foreground line-through" : "text-brand"}`}
                  >
                    −{fmtUSD(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {f !== "Onchain" && (
        <Card className="mt-5 !p-2">
          {(f === "All" || txs.length > 0) && (
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Household activity
            </div>
          )}
          <ul>
            {filtered.map((a, i) => {
              const m = getMember(a.actorId);
              const meta = a.category ? categoryMeta[a.category] : null;
              const icon =
                a.kind === "settlement" ? (
                  <ArrowLeftRight className="h-4 w-4" />
                ) : a.kind === "member" ? (
                  <UserPlus className="h-4 w-4" />
                ) : null;
              return (
                <li
                  key={a.id}
                  className={`relative flex items-center gap-3 p-3 ${i !== filtered.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <div className="relative">
                    <MemberAvatar member={m} size={42} />
                    <span
                      className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] shadow-sm ring-1 ring-black/5 ${a.kind === "settlement" ? "text-emerald-600" : "text-foreground"}`}
                    >
                      {meta ? meta.icon : icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-semibold">{m.name.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{fmtRelative(a.date)}</span>
                      {a.kind === "settlement" && <TxHashPill hash={mockTxHash(a.id)} />}
                    </div>
                  </div>
                  {a.amount != null && (
                    <div
                      className={`text-sm font-bold tabular-nums ${a.kind === "settlement" ? "text-emerald-600" : ""}`}
                    >
                      {a.kind === "settlement" ? "+" : ""}
                      {fmtUSD(a.amount)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {showTxs && txs.length === 0 && f === "Onchain" && (
        <Card className="mt-5 py-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted">
            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-3 text-sm font-semibold">No onchain payments yet</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Send USDC or settle up to see real Arc Testnet transactions here.
          </div>
        </Card>
      )}
    </AppShell>
  );
}
