import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Loader2, ShieldCheck, Zap, CheckCircle2, AlertTriangle, SlidersHorizontal, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { TxHashPill } from "@/components/nest/chain";
import { useComputedBalances, useMe, useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { fmtUSD, getMember, fmtRelative } from "@/lib/nest-data";
import { recordReceipt } from "@/lib/receipts-store";
import { arcTestnet } from "@/lib/wagmi";
import { useAgentConfig, useAgentRuns, type AgentRun } from "@/lib/agent-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/agent")({
  component: AgentPage,
  head: () => ({
    meta: [
      { title: "Settlement assistant · Nest" },
      {
        name: "description",
        content: "Review open household debts and submit wallet-confirmed USDC settlements on Arc.",
      },
      { property: "og:title", content: "Settlement assistant · Nest" },
      {
        property: "og:description",
        content: "Non-custodial, wallet-confirmed USDC settlements on Arc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AgentPage() {
  const me = useMe();
  const { debts } = useComputedBalances();
  const { refresh } = useNestChain();
  const { settleWith } = useNestWrites();
  const [cfg, setCfg] = useAgentConfig(me || null);
  const [runs, setRuns] = useAgentRuns(me || null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");

  const queue = useMemo(
    () => debts.filter((d) => d.fromId === me && d.amount >= cfg.minDebt),
    [debts, me, cfg.minDebt],
  );
  const queueTotal = queue.reduce((s, d) => s + d.amount, 0);
  const withinCap = queueTotal <= cfg.maxPerRun;

  async function runNow() {
    if (!me) return toast.error("Connect your wallet first.");
    if (queue.length === 0) return toast.info("Nothing for the agent to settle.");
    setRunning(true);
    const hashes: string[] = [];
    let spent = 0;
    let failure: string | undefined;

    for (const debt of queue) {
      if (spent + debt.amount > cfg.maxPerRun) {
        failure = `Spend cap of ${fmtUSD(cfg.maxPerRun)} reached — remaining debts skipped.`;
        break;
      }
      const to = getMember(debt.toId);
      setStep(`Settling ${fmtUSD(debt.amount)} with ${to.name}…`);
      try {
        const hash = await settleWith(debt.toId as `0x${string}`, debt.amount, (s) => setStep(s));
        hashes.push(hash);
        spent += debt.amount;
        recordReceipt({
          hash,
          from: me,
          to: debt.toId,
          amount: debt.amount,
          date: new Date().toISOString(),
          kind: "settle",
          note: "Auto-settled by Nest agent",
          chainId: arcTestnet.id,
        });
      } catch (err) {
        failure = err instanceof Error ? err.message : "Settlement failed.";
        break;
      }
    }

    const run: AgentRun = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      trigger: "manual",
      settled: hashes.length,
      total: spent,
      hashes,
      status: failure ? (hashes.length ? "partial" : "failed") : "success",
      message: failure,
    };
    setRuns((prev) => [run, ...prev].slice(0, 25));
    setCfg((prev) => ({ ...prev, lastRunAt: run.date }));
    setStep("");
    setRunning(false);
    await refresh();

    if (run.status === "success") toast.success(`Agent settled ${hashes.length} payment(s).`);
    else if (run.status === "partial") toast.warning(failure ?? "Agent run partially completed.");
    else toast.error(failure ?? "Agent run failed.");
  }

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Automation</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Settlement assistant</h1>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card className={`overflow-hidden !p-0 ${cfg.enabled ? "border-brand/30 shadow-glow" : ""}`}>
            <div className="border-b bg-brand-soft/55 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-brand">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold">Settlement Assistant</div>
                  <div className={`mt-0.5 text-xs font-semibold ${cfg.enabled ? "text-success" : "text-muted-foreground"}`}>
                    {cfg.enabled ? "Ready to review your payments" : "Turn on to prepare payments"}
                  </div>
                </div>
                <label className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-2.5 py-1.5 shadow-sm">
                  <span className="text-[11px] font-bold">{cfg.enabled ? "On" : "Off"}</span>
                  <Switch
                    checked={cfg.enabled}
                    onCheckedChange={(enabled) => setCfg((p) => ({ ...p, enabled }))}
                    aria-label="Turn Settlement Assistant on or off"
                  />
                </label>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand/15 bg-card/90 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Ready to pay</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{fmtUSD(queueTotal)}</div>
                </div>
                <div className="rounded-xl border border-brand/15 bg-card/90 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Payments</div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{queue.length}</div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Your safety limits
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Most I can pay at once" hint="The assistant stops at this amount.">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={cfg.maxPerRun}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, maxPerRun: Number(e.target.value) || 0 }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                />
              </Field>
              <Field label="Skip tiny payments under" hint="Example: 1 skips anything below $1.">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cfg.minDebt}
                  onChange={(e) => setCfg((p) => ({ ...p, minDebt: Number(e.target.value) || 0 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                />
              </Field>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                <WalletCards className="h-4 w-4 shrink-0 text-brand" /> You approve every payment in your wallet.
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Queued for the next run</h3>
              <span className="text-xs text-muted-foreground">
                {queue.length} item{queue.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {queue.map((d) => {
                const to = getMember(d.toId);
                return (
                  <li key={d.toId} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <MemberAvatar member={to} size={36} />
                    <div className="min-w-0 flex-1 text-sm font-semibold">{to.name}</div>
                    <div className="text-sm font-bold tabular-nums">{fmtUSD(d.amount)}</div>
                  </li>
                );
              })}
              {queue.length === 0 && (
                <li className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                  All balances are clear — the agent has nothing to do.
                </li>
              )}
            </ul>

            {!withinCap && queue.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Queue total {fmtUSD(queueTotal)} exceeds your {fmtUSD(cfg.maxPerRun)} cap. The agent
                will settle what fits and stop.
              </div>
            )}

            <Button
              onClick={runNow}
              disabled={running || queue.length === 0 || !cfg.enabled}
              className="mt-4 h-12 w-full rounded-xl btn-gradient text-sm font-bold"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {running
                ? step || "Preparing settlements…"
                : !cfg.enabled
                  ? "Turn on assistant to continue"
                  : queue.length === 0
                    ? "Nothing to settle"
                    : `Review & pay ${fmtUSD(queueTotal)}`}
            </Button>
            {queue.length > 0 && cfg.enabled && !running && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">You will review and approve each wallet request.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-bold">Run history on this device</h3>
            <ul className="mt-4 space-y-2">
              {runs.map((r) => (
                <li key={r.id} className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm font-semibold">
                      {r.settled} settled · {fmtUSD(r.total)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {fmtRelative(r.date)}
                    </span>
                  </div>
                  {r.message && (
                    <div className="mt-1 text-xs text-muted-foreground">{r.message}</div>
                  )}
                  {r.hashes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.hashes.map((h) => (
                        <TxHashPill key={h} hash={h} />
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {runs.length === 0 && (
                <li className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  No agent runs yet.
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="!p-6">
            <div className="text-sm font-bold">Review controls</div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div>Last run: {cfg.lastRunAt ? fmtRelative(cfg.lastRunAt) : "never"}</div>
              <div>Run cap: {fmtUSD(cfg.maxPerRun)}</div>
              <div>Dust filter: under {fmtUSD(cfg.minDebt)} ignored</div>
              <div>Settings and run history are stored only in this browser.</div>
            </div>
          </Card>

          <Card className="!p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-brand" /> Guardrails
            </div>
            <ul className="mt-3 space-y-3 text-xs text-muted-foreground">
              <li>Only settles debts you already owe — the agent can never create one.</li>
              <li>The run cap and dust filter are checked before any transaction is requested.</li>
              <li>
                Every payment is simulated against the current chain state, then signed by you.
              </li>
              <li>
                Confirmed payments are independently visible in onchain receipts by transaction
                hash.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>
    </label>
  );
}
