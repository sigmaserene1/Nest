import { Wallet } from "lucide-react";
import { useState } from "react";

export function WalletButton() {
  const [connected, setConnected] = useState(true);
  const addr = "0x8f2c…41Ae";
  const balance = 1284.5;

  if (!connected) {
    return (
      <button
        onClick={() => setConnected(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5"
      >
        <Wallet className="h-4 w-4" />
        Connect wallet
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
      <span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.16_155)]" />
      <span className="font-medium">${balance.toFixed(2)}</span>
      <span className="text-muted-foreground">USDC</span>
      <span className="mx-1 h-4 w-px bg-border" />
      <span className="font-mono text-xs text-muted-foreground">{addr}</span>
    </div>
  );
}
