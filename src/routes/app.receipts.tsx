import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ExternalLink, Copy, Check, ShieldCheck, Waypoints } from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { EmptyState } from "@/components/nest/feedback";
import { Stagger, Item } from "@/components/nest/motion";
import { MemberAvatar } from "@/components/nest/avatar";
import { useReceipts } from "@/lib/receipts-store";
import { useNestChain } from "@/lib/chain/nest-chain";
import { getMember, fmtUSD } from "@/lib/nest-data";
import { explorerTxUrl, openExplorerTx } from "@/lib/wagmi";
import { arcEnvironmentLabel, useArcEnvironment } from "@/lib/arc-network";
import { useBridgeHistory } from "@/lib/bridge-history";

export const Route = createFileRoute("/app/receipts")({
  component: ReceiptsPage,
  head: () => ({
    meta: [
      { title: "Payment History & Receipts · Nest" },
      {
        name: "description",
        content:
          "Immutable receipts for every onchain USDC settlement — hash, timestamp, sender and amount, with an Arc explorer link.",
      },
      { property: "og:title", content: "Payment History & Receipts · Nest" },
      {
        property: "og:description",
        content: "Immutable Arc receipts for every USDC settlement made in your workspace.",
      },
    ],
  }),
});

const short = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
const explorerTx = (base: string, hash: string) =>
  `${base.replace(/\/$/, "")}/tx/${hash}`;

function fmtStamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      aria-label={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-black/5 hover:text-foreground active:scale-[0.96]"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">{children}</div>
    </div>
  );
}

function ReceiptsPage() {
  const environment = useArcEnvironment();
  const { address } = useAccount();
  const { me } = useNestChain();
  const receipts = useReceipts(me);
  const { entries: bridges } = useBridgeHistory(address);

  const total = useMemo(
    () =>
      receipts
        .filter((r) => !me || r.from.toLowerCase() === me.toLowerCase())
        .reduce((s, r) => s + r.amount, 0),
    [receipts, me],
  );

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Proof of payment</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Payment & bridge history</h1>
        </div>
      }
    >
      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total settled by you
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{fmtUSD(total)}</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          {receipts.length + bridges.length} record{receipts.length + bridges.length === 1 ? "" : "s"}
        </div>
      </Card>

      {receipts.length === 0 ? (
        <Card className="mt-4 !p-0">
          <EmptyState
            emoji="🧾"
            title="No receipts yet"
            description="Every settlement you complete onchain generates a permanent receipt here, with its Arc transaction hash."
          />
        </Card>
      ) : (
        <Stagger className="mt-4 space-y-3">
          {receipts.map((r) => {
            const counterparty = getMember(
              (me && r.from.toLowerCase() === me.toLowerCase() ? r.to : r.from).toLowerCase(),
            );
            const outgoing = !!me && r.from.toLowerCase() === me.toLowerCase();
            return (
              <Item key={r.hash}>
                <Card className="!p-4">
                  <div className="flex items-start gap-3">
                    <MemberAvatar member={counterparty} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">
                            {outgoing ? "Paid" : "Received from"} {counterparty.name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {fmtStamp(r.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-bold tabular-nums ${outgoing ? "text-foreground" : "text-emerald-600"}`}
                          >
                            {outgoing ? "−" : "+"}
                            {fmtUSD(r.amount)}
                          </div>
                          <div className="text-[10px] font-medium text-muted-foreground">USDC</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-3">
                        <Field label="Sender">
                          <span className="truncate font-mono">{short(r.from)}</span>
                          <CopyBtn value={r.from} label="Copy sender address" />
                        </Field>
                        <Field label="Recipient">
                          <span className="truncate font-mono">{short(r.to)}</span>
                          <CopyBtn value={r.to} label="Copy recipient address" />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Transaction hash">
                            <span className="truncate font-mono">{r.hash}</span>
                            <CopyBtn value={r.hash} label="Copy transaction hash" />
                          </Field>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Confirmed on Arc {arcEnvironmentLabel(environment)}
                        </span>
                        <a
                          href={explorerTxUrl(r.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExplorerTx(r.hash);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background transition hover:opacity-90"
                        >
                          View on explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </Item>
            );
          })}
        </Stagger>
      )}

      {bridges.length > 0 ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Waypoints className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold">Bridge transfers</h2>
          </div>
          <Stagger className="space-y-3">
            {bridges.map((bridge) => (
              <Item key={bridge.id}>
                <Card className="!p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
                      <Waypoints className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold">
                            {bridge.fromName} → {bridge.toName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {fmtStamp(new Date(bridge.completedAt ?? bridge.startedAt).toISOString())}
                            {bridge.tool ? ` · ${bridge.tool}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold tabular-nums">
                            {bridge.amount} USDC
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase ${
                              bridge.status === "complete"
                                ? "text-emerald-600"
                                : bridge.status === "error"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {bridge.status}
                          </div>
                        </div>
                      </div>

                      {bridge.recipient ? (
                        <div className="mt-3 text-[10px] text-muted-foreground">
                          Recipient <span className="font-mono">{short(bridge.recipient)}</span>
                        </div>
                      ) : null}

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {bridge.burnHash ? (
                          <a
                            href={explorerTx(bridge.explorerFrom, bridge.burnHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[11px] font-semibold transition hover:border-brand/30"
                          >
                            <span className="min-w-0 truncate font-mono">
                              Source {short(bridge.burnHash)}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : null}
                        {bridge.mintHash ? (
                          <a
                            href={explorerTx(bridge.explorerTo, bridge.mintHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-[11px] font-semibold transition hover:border-brand/30"
                          >
                            <span className="min-w-0 truncate font-mono">
                              Destination {short(bridge.mintHash)}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : null}
                      </div>

                      {bridge.errorMessage ? (
                        <p className="mt-3 text-xs text-red-600">{bridge.errorMessage}</p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Item>
            ))}
          </Stagger>
        </div>
      ) : null}
    </AppShell>
  );
}
