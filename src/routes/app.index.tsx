import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  Bot,
  Braces,
  CircleDollarSign,
  FilePlus2,
  Gauge,
  Radio,
  ReceiptText,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { BlockTicker, WalletChip } from "@/components/nest/chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { fmtRelative, fmtUSD, getMember, shortAddress } from "@/lib/nest-data";
import { useNestChain } from "@/lib/chain/nest-chain";
import { explorerAddrUrl } from "@/lib/wagmi";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Treasury overview · Nest" },
      {
        name: "description",
        content: "Live Arc treasury positions, settlements, agent limits, and contract activity.",
      },
    ],
  }),
});

function Dashboard() {
  const wallet = useArcWallet();
  const {
    room,
    contractAddress,
    protocolVersion,
    members,
    expenses,
    settlements,
    agentPolicy,
    net,
    debts,
    me,
    usdcAllowance,
  } = useNestChain();

  const myNet = me ? (net[me] ?? 0) : 0;
  const myDebts = debts.filter((debt) => debt.fromId === me);
  const totalOwed = myDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthVolume = expenses
    .filter((expense) => new Date(expense.date) >= monthStart)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <AppShell
      greeting={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="h-3.5 w-3.5 text-emerald-400" /> Live contract state
              <span className="text-border">/</span>
              <BlockTicker />
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{room?.name ?? "Treasury"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Net positions, payments, and agent authority verified from Arc.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/app/bridge">
                <Waypoints /> Fund
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/expenses">
                <FilePlus2 /> Record obligation
              </Link>
            </Button>
          </div>
        </div>
      }
    >
      <section className="protocol-divider-grid grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Wallet balance"
          value={`${wallet.usdcBalance.toFixed(2)} USDC`}
          detail="Spendable plus gas"
          icon={CircleDollarSign}
        />
        <Metric
          label="Net position"
          value={`${myNet >= 0 ? "+" : "-"}${fmtUSD(Math.abs(myNet))}`}
          detail={myNet >= 0 ? "Treasury owes you" : "You owe treasury"}
          icon={Gauge}
          tone={myNet < 0 ? "warning" : "positive"}
        />
        <Metric
          label="Month recorded"
          value={fmtUSD(monthVolume)}
          detail={`${expenses.length} total obligations`}
          icon={ReceiptText}
        />
        <Metric
          label="Agent policy"
          value={agentPolicy?.enabled ? "Active" : "Paused"}
          detail={
            agentPolicy?.enabled
              ? `${fmtUSD(agentPolicy.maxPerRun)} per run`
              : "No delegated execution"
          }
          icon={Bot}
          tone={agentPolicy?.enabled ? "positive" : "default"}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="protocol-label">Deterministic settlement</div>
              <h2 className="mt-1 text-base font-semibold">Your next net route</h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/settle">
                Open settlement <ArrowRight />
              </Link>
            </Button>
          </div>

          {myDebts.length > 0 ? (
            <div className="mt-5 divide-y divide-border border-y border-border">
              {myDebts.map((debt, index) => {
                const creditor = getMember(debt.toId);
                return (
                  <div
                    key={`${debt.toId}-${index}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-400/10 text-amber-300">
                      <ArrowDownRight className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">Pay {creditor.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {shortAddress(debt.toId)}
                      </div>
                    </div>
                    <div className="protocol-value text-sm text-amber-300">
                      {fmtUSD(debt.amount)}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-muted-foreground">Total route</span>
                <span className="protocol-value font-semibold">{fmtUSD(totalOwed)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
              <div>
                <div className="text-sm font-medium text-emerald-200">
                  Your net position is clear
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  The contract currently has no outgoing settlement route for this wallet.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="protocol-label">Protocol state</div>
          <h2 className="mt-1 text-base font-semibold">Verified deployment</h2>
          <dl className="mt-5 space-y-3 text-xs">
            <ProtocolRow label="Version" value={`Nest Treasury V${protocolVersion ?? "-"}`} />
            <ProtocolRow label="Members" value={String(members.length)} />
            <ProtocolRow label="Settlements" value={String(settlements.length)} />
            <ProtocolRow label="USDC allowance" value={`${usdcAllowance.toFixed(2)} USDC`} />
          </dl>
          {contractAddress && (
            <a
              href={explorerAddrUrl(contractAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2.5 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary"
            >
              <span>{shortAddress(contractAddress)}</span>
              <Braces className="h-3.5 w-3.5" />
            </a>
          )}
        </Card>
      </div>

      <Card className="mt-5 !p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="protocol-label">Onchain ledger</div>
            <h2 className="mt-1 text-base font-semibold">Recent obligations</h2>
          </div>
          <Link to="/app/expenses" className="text-xs font-medium text-primary hover:underline">
            View ledger
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-3 py-3 font-medium">Payer</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Recorded</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.slice(0, 6).map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{expense.title}</div>
                    <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                      OBL-{expense.id.padStart(4, "0")}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">{getMember(expense.payerId).name}</td>
                  <td className="px-3 py-3.5 text-muted-foreground">{expense.category}</td>
                  <td className="px-3 py-3.5 text-muted-foreground">{fmtRelative(expense.date)}</td>
                  <td className="protocol-value px-5 py-3.5 text-right font-medium">
                    {fmtUSD(expense.amount)}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No obligations have been recorded on this contract.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <ActionLink
          to="/app/settle"
          icon={CircleDollarSign}
          title="Settle net position"
          detail="Atomic USDC route with Arc memo"
        />
        <ActionLink
          to="/app/agent"
          icon={Bot}
          title="Configure executor"
          detail="Onchain caps, expiry, cooldown"
        />
        <ActionLink
          to="/app/bridge"
          icon={Waypoints}
          title="Fund from another chain"
          detail="Circle App Kit and CCTP"
        />
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Gauge;
  tone?: "default" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : "text-foreground";
  return (
    <div className="bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="protocol-label">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`protocol-value mt-4 text-xl font-semibold sm:text-2xl ${toneClass}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

function ProtocolRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="protocol-value text-right">{value}</dd>
    </div>
  );
}

function ActionLink({
  to,
  icon: Icon,
  title,
  detail,
}: {
  to: "/app/settle" | "/app/agent" | "/app/bridge";
  icon: typeof Gauge;
  title: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
    >
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
