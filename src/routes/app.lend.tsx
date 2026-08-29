import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ShieldCheck } from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { CANONICAL_EXPENSE_MANAGER_ADDRESS } from "@/lib/chain/config";

export const Route = createFileRoute("/app/lend")({
  component: LendPage,
  head: () => ({
    meta: [
      { title: "Lending status · Nest" },
      {
        name: "description",
        content:
          "Lending is not enabled on Nest's current shared-expense deployment on Arc Testnet.",
      },
    ],
  }),
});

function LendPage() {
  return (
    <AppShell greeting={<h1 className="text-xl font-bold">Lending status</h1>}>
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="!p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">Lending is not live on this deployment</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The canonical Nest contract is a shared-expense and peer-to-peer USDC settlement
                contract. It has no lending pool, so Nest does not show simulated balances or send
                supply, borrow, withdraw, or repay transactions.
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> What is live and onchain
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Rooms, membership, expense shares, and balances.</li>
            <li>USDC settlement directly between the debtor and payer.</li>
            <li>Transaction-backed activity and payment receipts on Arc Testnet.</li>
          </ul>
          <p className="mt-4 break-all rounded-xl bg-muted p-3 font-mono text-[11px] text-muted-foreground">
            {CANONICAL_EXPENSE_MANAGER_ADDRESS}
          </p>
        </Card>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          A lending product would require an independently reviewed V2 deployment and an explicit
          migration path. Existing Nest homes remain on the current canonical contract.
        </p>
      </div>
    </AppShell>
  );
}
