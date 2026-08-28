import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useBlockNumber } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";
import { shortAddress } from "@/lib/nest-data";

export function WalletChip({ address, className = "" }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary ${className}`}
      aria-label="Copy wallet address"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {shortAddress(address)}
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  );
}

export function BlockTicker() {
  const { data: blockNumber } = useBlockNumber({
    chainId: arcTestnet.id,
    watch: true,
  });

  return (
    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
      {blockNumber == null ? "block --" : `#${blockNumber.toLocaleString()}`}
    </span>
  );
}
