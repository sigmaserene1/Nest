import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Fingerprint, ReceiptText } from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { useNestChain } from "@/lib/chain/nest-chain";
import { fmtRelative, fmtUSD, getMember, shortAddress } from "@/lib/nest-data";

export const Route = createFileRoute("/app/receipts")({
  component: ReceiptsPage,
  head: () => ({ meta: [{ title: "Settlement receipts · Nest" }] }),
});

function ReceiptsPage() {
  const { settlements } = useNestChain();
  return (
    <AppShell
      greeting={
        <div>
          <div className="protocol-label">Contract settlement records</div>
          <h1 className="mt-2 text-2xl font-semibold">Receipts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Receipts are reconstructed from Treasury V2, not saved in this browser.
          </p>
        </div>
      }
    >
      <Card className="!p-0">
        <div className="divide-y divide-border">
          {settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[40px_1fr_auto] lg:items-center"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-md ${settlement.byAgent ? "bg-sky-400/10 text-sky-300" : "bg-emerald-400/10 text-emerald-300"}`}
              >
                {settlement.byAgent ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}
              </span>
              <div>
                <div className="text-sm font-medium">
                  Settlement #{settlement.id} from {getMember(settlement.debtorId).name}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 font-mono text-[9px] text-muted-foreground">
                  <span>{shortAddress(settlement.debtorId)}</span>
                  <span>memo {shortAddress(settlement.memoId)}</span>
                  <span>{settlement.payments.length} creditor payments</span>
                  <span>{fmtRelative(settlement.date)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settlement.payments.map((payment) => (
                    <span
                      key={`${settlement.id}-${payment.creditorId}`}
                      className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground"
                    >
                      {getMember(payment.creditorId).name} · {fmtUSD(payment.amount)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="protocol-value text-sm font-semibold">{fmtUSD(settlement.total)}</div>
            </div>
          ))}
          {settlements.length === 0 && (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <ReceiptText className="h-6 w-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">No settlement receipts yet</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Execute the first net settlement to create one.
              </p>
              <Button className="mt-4" asChild>
                <Link to="/app/settle">Open settlement</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
