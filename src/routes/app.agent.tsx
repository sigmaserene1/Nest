import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Loader2, ShieldCheck, Timer, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { TxHashPill } from "@/components/nest/chain";
import { useComputedBalances, useMe, useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { fmtUSD, getMember, fmtRelative } from "@/lib/nest-data";
import { recordReceipt } from "@/lib/receipts-store";
import { arcTestnet } from "@/lib/wagmi";
import { fmtCountdown, nextRunDate, useAgentConfig, useAgentRuns, type AgentRun } from "@/lib/agent-store";

export const Route = createFileRoute("/app/agent")({
  component: AgentPage,
  head: () => ({
    meta: [
      { title: "Auto-settle agent · Nest" },
      {
        name: "description",
        content:
          "Let a Nest agent net your household debts and settle them in USDC on Arc automatically each month.",
      },
      { property: "og:title", content: "Auto-settle agent · Nest" },
      {
        property: "og:description",
        content: "Scheduled, spend-capped USDC settlements executed by an agent on Arc.",
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
  const next = nextRunDate(cfg.dayOfMonth);

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
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Auto-settle agent</h1>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card className="!p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Bot className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-bold">Nest co-signer</div>
                  <button
                    onClick={() => setCfg((p) => ({ ...p, enabled: !p.enabled }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      cfg.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cfg.enabled ? "Active" : "Paused"}
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  The agent nets every open debt in this home and settles them in USDC on Arc —
                  within the limits you set below. You stay non-custodial: nothing moves beyond your
                  cap.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Settle on day">
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={cfg.dayOfMonth}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, dayOfMonth: Number(e.target.value) || 1 }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                />
              </Field>
              <Field label="Max per run (USDC)">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={cfg.maxPerRun}
                  onChange={(e) => setCfg((p) => ({ ...p, maxPerRun: Number(e.target.value) || 0 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                />
              </Field>
              <Field label="Ignore debts under (USDC)">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cfg.minDebt}
                  onChange={(e) => setCfg((p) => ({ ...p, minDebt: Number(e.target.value) || 0 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
                />
              </Field>
              <Field label="Signature policy">
                <button
                  onClick={() => setCfg((p) => ({ ...p, requireApproval: !p.requireApproval }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-left text-sm font-semibold"
                >
                  {cfg.requireApproval ? "Confirm each transfer" : "Batch without prompts"}
                </button>
              </Field>
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

            <button
              onClick={runNow}
              disabled={running || queue.length === 0}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg btn-gradient py-3 text-sm font-bold disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {running ? step || "Running agent…" : `Run agent now · ${fmtUSD(queueTotal)}`}
            </button>
          </Card>

          <Card>
            <h3 className="text-sm font-bold">Run history</h3>
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
            <div className="flex items-center gap-2 text-sm font-bold">
              <Timer className="h-4 w-4 text-brand" /> Next scheduled run
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              {next.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="text-sm text-muted-foreground">{fmtCountdown(next)}</div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div>
                Last run: {cfg.lastRunAt ? fmtRelative(cfg.lastRunAt) : "never"}
              </div>
              <div>Spend cap: {fmtUSD(cfg.maxPerRun)} per run</div>
              <div>Dust filter: under {fmtUSD(cfg.minDebt)} ignored</div>
            </div>
          </Card>

          <Card className="!p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-brand" /> Guardrails
            </div>
            <ul className="mt-3 space-y-3 text-xs text-muted-foreground">
              <li>Only settles debts you already owe — the agent can never create one.</li>
              <li>Every transfer is capped and executed against the exact onchain amount.</li>
              <li>Runs are logged with tx hashes and mirrored into your receipts.</li>
              <li>
                While the browser is closed the agent stays queued; open Nest and the pending run
                fires with one tap.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
