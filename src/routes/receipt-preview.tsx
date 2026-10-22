// TEMPORARY preview route for visual verification — deleted after checks.
import { createFileRoute } from "@tanstack/react-router";
import { ReceiptPaper } from "@/components/nest/receipt-paper";

export const Route = createFileRoute("/receipt-preview")({
  component: () => (
    <div className="min-h-screen bg-background p-6">
      <ReceiptPaper
        receipt={{
          hash: "0xd367e5453d125232831614154cf2c3621886a2ff71ca3a0ddc7914d0ba1c36e7",
          from: "0x709cbad88162b999882788155cde79ade46a6d42",
          to: "0x3f8a1c9e2b4d6f708192a3b4c5d6e7f8091a2b3c",
          amount: 42.5,
          date: new Date().toISOString(),
          kind: "settle",
          note: "Groceries split",
          chainId: 5042,
        }}
        meta={{
          counterpartyName: "Ava",
          direction: "sent",
          networkLabel: "Mainnet",
          explorerUrl:
            "https://explorer.arc.io/tx/0xd367e5453d125232831614154cf2c3621886a2ff71ca3a0ddc7914d0ba1c36e7",
        }}
      />
    </div>
  ),
});
