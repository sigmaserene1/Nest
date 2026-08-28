import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bot,
  CheckCircle2,
  Fingerprint,
  Gauge,
  KeyRound,
  Loader2,
  PauseCircle,
  Play,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { fmtRelative, fmtUSD, shortAddress } from "@/lib/nest-data";
import { isAddress } from "@/lib/chain/config";
import { explorerTxUrl } from "@/lib/wagmi";

export const Route = createFileRoute("/app/agent")({
  component: AgentPage,
  head: () => ({
    meta: [
      { title: "Onchain agents · Nest" },
      {
        name: "description",
        content: "ERC-8004 identity and contract-enforced USDC settlement policy on Arc.",
      },
    ],
  }),
});

const AGENT_METADATA_URI = "https://nestarc.xyz/agent-metadata.json";

function AgentPage() {
  const { me, debts, agentPolicy, agentRuns, usdcAllowance } = useNestChain();
  const { setAgentPolicy, runAgent, registerAgent, ensureAllowance } = useNestWrites();
  const [enabled, setEnabled] = useState(false);
  const [executor, setExecutor] = useState("");
  const [agentId, setAgentId] = useState("0");
  const [maxPerRun, setMaxPerRun] = useState("100");
  const [maxPerPeriod, setMaxPerPeriod] = useState("500");
  const [cooldownHours, setCooldownHours] = useState("24");
  const [validDays, setValidDays] = useState("30");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");

  useEffect(() => {
    if (hydrated || !me) return;
    setExecutor(
      agentPolicy?.executor && agentPolicy.executor !== "0x0000000000000000000000000000000000000000"
        ? agentPolicy.executor
        : me,
    );
    setEnabled(agentPolicy?.enabled ?? false);
    setAgentId(agentPolicy?.agentId ?? "0");
    if (agentPolicy?.maxPerRun) setMaxPerRun(String(agentPolicy.maxPerRun));
    if (agentPolicy?.maxPerPeriod) setMaxPerPeriod(String(agentPolicy.maxPerPeriod));
    if (agentPolicy?.minInterval)
      setCooldownHours(String(Math.max(1, Math.round(agentPolicy.minInterval / 3600))));
    setHydrated(true);
  }, [agentPolicy, hydrated, me]);

  const myDebt = debts
    .filter((debt) => debt.fromId === me)
    .reduce((sum, debt) => sum + debt.amount, 0);
  const periodRemaining = Math.max(
    0,
    (agentPolicy?.maxPerPeriod ?? 0) - (agentPolicy?.spentThisPeriod ?? 0),
  );
  const runLimit = Math.min(myDebt, agentPolicy?.maxPerRun ?? 0, periodRemaining);
  const executorIsMe = Boolean(me && agentPolicy?.executor === me);
  const policyReady = Boolean(
    isAddress(executor) &&
    Number(maxPerRun) > 0 &&
    Number(maxPerPeriod) >= Number(maxPerRun) &&
    Number(cooldownHours) >= 0 &&
    Number(validDays) > 0,
  );

  const savePolicy = async () => {
    if (!me || !policyReady) return;
    setSaving(true);
    setStep("");
    try {
      if (enabled) await ensureAllowance(Number(maxPerPeriod), setStep);
      const validUntil = Math.floor(Date.now() / 1000) + Math.round(Number(validDays) * 86_400);
      const hash = await setAgentPolicy(
        {
          executor: executor as `0x${string}`,
          agentId: BigInt(agentId || "0"),
          maxPerRun: Number(maxPerRun),
          maxPerPeriod: Number(maxPerPeriod),
          minInterval: Math.round(Number(cooldownHours) * 3600),
          validUntil,
          enabled,
        },
        setStep,
      );
      toast.success("Agent policy finalized on Arc", {
        action: {
          label: "Arcscan",
          onClick: () => window.open(explorerTxUrl(hash), "_blank", "noopener"),
        },
      });
    } catch (error) {
      toast.error("Policy update failed", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const registerIdentity = async () => {
    setRegistering(true);
    setStep("");
    try {
      const result = await registerAgent(AGENT_METADATA_URI, setStep);
      setAgentId(String(result.agentId));
      toast.success(`ERC-8004 agent #${result.agentId} registered`, {
        action: {
          label: "Arcscan",
          onClick: () => window.open(explorerTxUrl(result.hash), "_blank", "noopener"),
        },
      });
    } catch (error) {
      toast.error("Agent registration failed", { description: (error as Error).message });
    } finally {
      setRegistering(false);
    }
  };

  const executeRun = async () => {
    if (!me || runLimit <= 0) return;
    setRunning(true);
    setStep("");
    try {
      const hash = await runAgent(me as `0x${string}`, runLimit, setStep);
      toast.success("Agent run finalized on Arc", {
        action: {
          label: "Arcscan",
          onClick: () => window.open(explorerTxUrl(hash), "_blank", "noopener"),
        },
      });
    } catch (error) {
      toast.error("Agent run failed", { description: (error as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const recentRuns = useMemo(
    () => agentRuns.filter((run) => run.account === me || run.executor === me),
    [agentRuns, me],
  );

  return (
    <AppShell
      greeting={
        <div>
          <div className="protocol-label">ERC-8004 identity · contract-enforced execution</div>
          <h1 className="mt-2 text-2xl font-semibold">Settlement agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Delegate execution without delegating unlimited control.
          </p>
        </div>
      }
    >
      <section className="protocol-divider-grid grid-cols-2 lg:grid-cols-4">
        <AgentMetric
          icon={Fingerprint}
          label="Agent ID"
          value={agentPolicy?.agentId !== "0" ? `#${agentPolicy?.agentId}` : "Unregistered"}
        />
        <AgentMetric
          icon={Gauge}
          label="Run cap"
          value={agentPolicy?.maxPerRun ? fmtUSD(agentPolicy.maxPerRun) : "--"}
        />
        <AgentMetric
          icon={TimerReset}
          label="Period remaining"
          value={agentPolicy ? fmtUSD(periodRemaining) : "--"}
        />
        <AgentMetric
          icon={agentPolicy?.enabled ? CheckCircle2 : PauseCircle}
          label="Policy"
          value={agentPolicy?.enabled ? "Active onchain" : "Paused"}
          positive={agentPolicy?.enabled}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="protocol-label">Wallet-owner policy</div>
              <h2 className="mt-1 text-base font-semibold">Execution guardrails</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {enabled ? "Enabled" : "Paused"}
              </span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Executor wallet">
              <Input
                value={executor}
                onChange={(event) => setExecutor(event.target.value)}
                className="font-mono text-xs"
                placeholder="0x..."
              />
            </Field>
            <Field label="ERC-8004 agent ID">
              <Input
                value={agentId}
                onChange={(event) => setAgentId(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="protocol-value"
              />
            </Field>
            <Field label="Maximum per run">
              <AmountInput value={maxPerRun} onChange={setMaxPerRun} />
            </Field>
            <Field label="30-day maximum">
              <AmountInput value={maxPerPeriod} onChange={setMaxPerPeriod} />
            </Field>
            <Field label="Minimum cooldown">
              <Input
                value={cooldownHours}
                onChange={(event) => setCooldownHours(event.target.value)}
                inputMode="numeric"
                className="protocol-value"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">
                Hours between successful runs
              </span>
            </Field>
            <Field label="Policy lifetime">
              <Input
                value={validDays}
                onChange={(event) => setValidDays(event.target.value)}
                inputMode="numeric"
                className="protocol-value"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">
                Days from this update
              </span>
            </Field>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-md border border-sky-400/20 bg-sky-400/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" /> The contract
            rejects unknown executors, expired policies, cooldown violations, cap overruns, and
            transfers larger than the wallet's USDC allowance.
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={registerIdentity} disabled={registering || saving}>
              {registering ? <Loader2 className="animate-spin" /> : <Fingerprint />}
              {registering ? step || "Registering" : "Register ERC-8004 identity"}
            </Button>
            <Button onClick={savePolicy} disabled={!policyReady || saving || registering}>
              {saving ? <Loader2 className="animate-spin" /> : <KeyRound />}
              {saving ? step || "Writing policy" : "Write policy onchain"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="protocol-label">Live execution preview</div>
          <h2 className="mt-1 text-base font-semibold">Run this policy</h2>
          <dl className="mt-5 space-y-3 text-xs">
            <RunRow label="Current net debt" value={fmtUSD(myDebt)} />
            <RunRow label="Permitted this run" value={fmtUSD(runLimit)} />
            <RunRow label="Treasury allowance" value={`${usdcAllowance.toFixed(2)} USDC`} />
            <RunRow
              label="Executor"
              value={agentPolicy?.executor ? shortAddress(agentPolicy.executor) : "--"}
            />
            <RunRow
              label="Last run"
              value={
                agentPolicy?.lastRunAt
                  ? fmtRelative(new Date(agentPolicy.lastRunAt * 1000).toISOString())
                  : "Never"
              }
            />
          </dl>

          {!executorIsMe && agentPolicy?.enabled && (
            <div className="mt-4 rounded-md border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-amber-300">
              This owner console cannot impersonate the external executor. Run the public{" "}
              <span className="font-mono">runAgent</span> function through that wallet or its
              keeper.
            </div>
          )}
          <Button
            onClick={executeRun}
            disabled={!agentPolicy?.enabled || !executorIsMe || runLimit <= 0 || running}
            className="mt-5 h-11 w-full"
          >
            {running ? <Loader2 className="animate-spin" /> : <Play />}
            {running ? step || "Executing" : `Run agent · ${fmtUSD(runLimit)}`}
          </Button>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
            The button supports a self-executing policy. A production keeper or developer-controlled
            EOA can use the same public contract path for an external executor. No private key is
            stored in this browser.
          </p>
        </Card>
      </div>

      <Card className="mt-5 !p-0">
        <div className="border-b border-border px-5 py-4">
          <div className="protocol-label">Contract receipts</div>
          <h2 className="mt-1 text-base font-semibold">Agent run history</h2>
        </div>
        <div className="divide-y divide-border">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium">
                    Run #{run.id} · Agent #{run.agentId}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                    executor {shortAddress(run.executor)} · memo {shortAddress(run.memoId)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {run.paymentCount} payments · {fmtRelative(run.date)}
              </div>
              <div className="protocol-value text-sm font-semibold">{fmtUSD(run.amount)}</div>
            </div>
          ))}
          {recentRuns.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No onchain agent runs recorded yet.
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
}

function AgentMetric({
  icon: Icon,
  label,
  value,
  positive = false,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="protocol-label">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div
        className={`protocol-value mt-4 text-base font-semibold sm:text-lg ${positive ? "text-emerald-300" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="protocol-label">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function AmountInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="protocol-value pr-14"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
        USDC
      </span>
    </div>
  );
}

function RunRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="protocol-value text-right">{value}</dd>
    </div>
  );
}
