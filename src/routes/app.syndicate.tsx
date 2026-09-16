import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Briefcase, Check, Home as HomeIcon, Loader2, Minus, Send, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { UsdcBadge } from "@/components/nest/chain";
import { useExpenses, useMembers, useMe, useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { fmtUSD } from "@/lib/nest-data";
import { recordReceipt } from "@/lib/receipts-store";
import { computePayouts, MODE_COPY, useWorkspaceMode } from "@/lib/workspace-mode";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/syndicate")({
  component: SyndicatePage,
  head: () => ({
    meta: [
      { title: "Syndicate mode · Nest" },
      {
        name: "description",
        content:
          "Switch Nest from household to project syndicate: track shared tooling costs and split client revenue in USDC on Arc.",
      },
      { property: "og:title", content: "Syndicate mode · Nest" },
      {
        property: "og:description",
        content: "Deduct shared project costs from client revenue, then pay out collaborators in USDC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SyndicatePage() {
  const { roomId } = useNestChain();
  const { mode, setMode, copy } = useWorkspaceMode(roomId);
  const members = useMembers();
  const expenses = useExpenses();
  const me = useMe();
  const { directTransfer } = useNestWrites();

  const costs = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const [revenue, setRevenue] = useState("2000");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [paying, setPaying] = useState<string | null>(null);

  const people = members.map((m) => ({
    id: m.id,
    name: m.name,
    weight: weights[m.id] ?? 1,
  }));
  const { distributable, rows } = computePayouts(Number(revenue) || 0, costs, people);

  async function payout(id: string, amount: number) {
    if (amount <= 0) return;
    setPaying(id);
    try {
      const hash = await directTransfer(id as `0x${string}`, amount, "Syndicate payout");
      recordReceipt({
        hash,
        from: me,
        to: id,
        amount,
        date: new Date().toISOString(),
        kind: "transfer",
        note: "Syndicate payout",
      });
      toast.success("Payout sent onchain.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payout failed.");
    } finally {
      setPaying(null);
    }
  }

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Workspace</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Syndicate mode</h1>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card className="overflow-hidden !p-0">
            <div className="border-b bg-brand-soft/55 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-foreground shadow-brand"><Briefcase className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-base font-bold">Choose how you use Nest</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">You can switch anytime. Your payments stay unchanged.</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {(["household", "syndicate"] as const).map((m) => {
                const c = MODE_COPY[m];
                const Icon = m === "household" ? HomeIcon : Briefcase;
                const active = mode === m;
                return (
                  <Button
                    variant="outline"
                    key={m}
                    onClick={() => setMode(m)}
                    className={`relative h-auto min-h-28 justify-start rounded-xl p-4 text-left ${
                      active ? "border-brand bg-brand-soft shadow-sm" : "bg-card hover:border-brand/40 hover:bg-muted/60"
                    }`}
                  >
                    <span className="block min-w-0">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span>
                      <span className="mt-2 block text-sm font-bold">{c.label}</span>
                      <span className="mt-0.5 block whitespace-normal text-xs text-muted-foreground">{c.tagline}</span>
                    </span>
                    {active && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-foreground"><Check className="h-3 w-3" /></span>}
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand/15 bg-brand-soft/45 px-3 py-2.5 text-xs">
              <Check className="h-3.5 w-3.5 text-brand" />
              <span><strong>{mode === "syndicate" ? "Syndicate mode is active" : "Household mode is active"}</strong> · {copy.people} · {copy.expenses}</span>
            </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-brand" /><h3 className="text-sm font-bold">Split a client payment</h3></div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter what the client paid. Nest subtracts shared costs and shows everyone’s share.
            </p>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-muted-foreground">
                Client payment received (USDC)
              </span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-3 text-2xl font-bold tabular-nums"
                />
                <UsdcBadge size="md" />
              </div>
            </label>

            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
              <Stat label="Client paid" value={fmtUSD(Number(revenue) || 0)} />
              <span className="grid place-items-center text-muted-foreground"><Minus className="h-4 w-4" /></span>
              <Stat label="Shared costs" value={fmtUSD(costs)} />
            </div>
            <div className="mt-2 rounded-xl border border-brand/20 bg-brand-soft/60 p-4">
              <div className="text-[10px] font-bold uppercase text-muted-foreground">Ready to split</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-brand">{fmtUSD(distributable)}</div>
            </div>

            <ul className="mt-4 space-y-2">
              {rows.map((r) => {
                const member = members.find((m) => m.id === r.id);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 sm:flex-nowrap">
                    {member && <MemberAvatar member={member} size={36} />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{r.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Weight</span>
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          value={r.weight}
                          onChange={(e) =>
                            setWeights((w) => ({ ...w, [r.id]: Number(e.target.value) || 0 }))
                          }
                          className="w-16 rounded border bg-background px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-bold tabular-nums">
                      {fmtUSD(r.payout)}
                    </div>
                    {r.id === me ? (
                      <span className="ml-auto rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">Your share</span>
                    ) : (
                      <Button
                        onClick={() => void payout(r.id, r.payout)}
                        disabled={paying !== null || r.payout <= 0}
                        className="ml-auto h-9 rounded-lg btn-gradient px-3 text-xs font-bold"
                      >
                        {paying === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Pay {r.name}
                      </Button>
                    )}
                  </li>
                );
              })}
              {rows.length === 0 && (
                <li className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Invite collaborators to plan a payout.
                </li>
              )}
            </ul>
          </Card>
        </div>

        <Card className="lg:col-span-2 !p-6">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand" /><h3 className="text-sm font-bold">How it works</h3></div>
          <ol className="mt-4 space-y-4">
            {[
              { t: "Log shared costs", d: "AWS, GitHub, API keys — added as normal expenses." },
              { t: "Client pays in USDC", d: "Revenue lands in the wallet that fronts the project." },
              { t: "Costs reimbursed first", d: "Nest deducts logged costs before any split." },
              { t: "Payouts onchain", d: "Each collaborator is paid their weighted share on Arc." },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{s.t}</div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
