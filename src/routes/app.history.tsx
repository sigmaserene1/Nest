import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { BuiltOnArc } from "@/components/nest/logo";
import { fmtUSD, getMember, settlements } from "@/lib/nest-data";
import { ArrowRight, Check, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/history")({
  head: () => ({
    meta: [
      { title: "Transactions · Nest" },
      { name: "description", content: "Every onchain USDC settlement in your household with verifiable proof on Arc." },
      { property: "og:title", content: "Transactions · Nest" },
      { property: "og:description", content: "Onchain settlement history." },
    ],
  }),
  component: History,
});

function History() {
  const total = settlements.reduce((s, x) => s + x.amount, 0);
  return (
    <AppShell title="Transactions" action={<BuiltOnArc />}>
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Settlements" value={String(settlements.length)} />
        <Stat label="Total settled" value={fmtUSD(total)} />
        <Stat label="Network" value="Arc testnet" />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">From → To</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Tx hash</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s, i) => {
              const from = getMember(s.fromId);
              const to = getMember(s.toId);
              return (
                <tr key={s.id} className={i > 0 ? "border-t border-border" : ""}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <MemberAvatar member={from} size={22} />
                      <span className="text-xs">{from.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <MemberAvatar member={to} size={22} />
                      <span className="text-xs">{to.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{fmtUSD(s.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.txHash}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.96_0.06_155)] px-2 py-0.5 text-[11px] font-medium text-[oklch(0.4_0.14_155)]">
                      <Check className="h-3 w-3" /> {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href="#" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
