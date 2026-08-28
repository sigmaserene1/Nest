import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useBlockNumber } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";
import { shortAddress } from "@/lib/nest-data";

export function WalletChip({
  address,
  variant = "light",
  className = "",
}: {
  address: string;
  variant?: "light" | "dark";
  className?: string;
}) {
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

  const base =
    variant === "dark"
      ? "bg-white/10 text-white/90 hover:bg-white/15 backdrop-blur"
      : "bg-muted/70 text-foreground hover:bg-muted";

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] transition ${base} ${className}`}
      aria-label="Copy wallet address"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-orange-400" />
      <span className="tabular-nums">{shortAddress(address)}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}

export function ArcBadge({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const cls =
    variant === "light"
      ? "bg-white/10 text-white backdrop-blur"
      : "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Arc Testnet
    </span>
  );
}

export function UsdcMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        fill="#fff"
        d="M20.7 18.5c0-2.2-1.3-2.9-4-3.2-1.9-.26-2.3-.77-2.3-1.67 0-.9.65-1.48 1.94-1.48 1.16 0 1.81.39 2.13 1.35.06.19.26.32.45.32h1.03c.26 0 .45-.19.45-.45v-.07a3.22 3.22 0 0 0-2.9-2.64V9.15c0-.26-.19-.45-.52-.52h-.97c-.26 0-.45.19-.52.52v1.42c-1.94.26-3.16 1.55-3.16 3.16 0 2.06 1.29 2.84 3.94 3.16 1.81.32 2.39.71 2.39 1.74 0 1.03-.9 1.74-2.13 1.74-1.68 0-2.26-.71-2.45-1.68-.06-.26-.26-.39-.45-.39h-1.1c-.26 0-.45.19-.45.45v.07c.26 1.61 1.29 2.77 3.42 3.1v1.42c0 .26.19.45.52.52h.97c.26 0 .45-.19.52-.52v-1.42c1.93-.32 3.22-1.68 3.22-3.42Z"
      />
      <path
        fill="#fff"
        d="M12.9 24.9c-5.03-1.81-7.61-7.42-5.74-12.39A9.6 9.6 0 0 1 12.9 7.1c.26-.13.39-.32.39-.65v-.9c0-.26-.13-.45-.39-.52-.06 0-.19 0-.26.06a11.6 11.6 0 0 0-7.55 14.58 11.5 11.5 0 0 0 7.55 7.36c.26.13.52 0 .58-.26.06-.06.06-.13.06-.26v-.9c0-.19-.19-.45-.38-.71Zm6.45-19.8c-.26-.13-.52 0-.58.26-.06.07-.06.13-.06.26v.9c0 .26.19.52.39.71 5.03 1.81 7.61 7.42 5.74 12.39a9.6 9.6 0 0 1-5.74 5.42c-.26.13-.39.32-.39.64v.9c0 .26.13.45.39.52.06 0 .19 0 .26-.07a11.62 11.62 0 0 0 7.55-14.58 11.66 11.66 0 0 0-7.55-7.35Z"
      />
    </svg>
  );
}

export function UsdcBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const px = size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[9.5px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#2775CA]/10 font-bold uppercase tracking-wider text-[#2775CA] ring-1 ring-[#2775CA]/20 ${px}`}
    >
      <UsdcMark size={size === "md" ? 14 : 12} />
      USDC
    </span>
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
