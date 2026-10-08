import usdcLogo from "@/assets/tokens/usdc.png.asset.json";
import { explorerTxUrl, openExplorerTx } from "@/lib/wagmi";
import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { arcEnvironmentLabel, useArcEnvironment } from "@/lib/arc-network";

export function ArcBadge({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const environment = useArcEnvironment();
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
      Arc {arcEnvironmentLabel(environment)}
    </span>
  );
}

export function UsdcMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={usdcLogo.url}
      alt="USDC"
      title="USD Coin (USDC)"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function ArcMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  // Arc brand mark: white arc on solid Arc black.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0B0B0F" />
      <path
        d="M8 22.5c0-4.42 3.58-8 8-8s8 3.58 8 8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M12.4 22.5a3.6 3.6 0 0 1 7.2 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function ArcLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ArcMark size={20} />
      <span className="text-[15px] font-bold tracking-tight">Arc</span>
    </span>
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

export function shortAddr(addr?: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

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
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard?.writeText(address);
    } catch {
      // clipboard unavailable — the copied state below is still shown
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const base =
    variant === "dark"
      ? "bg-white/10 text-white/90 hover:bg-white/15 backdrop-blur"
      : "bg-muted/70 text-foreground hover:bg-muted";
  return (
    <button
      onClick={copy}
      className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] transition ${base} ${className}`}
      aria-label="Copy wallet address"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-orange-400" />
      <span className="tabular-nums">{shortAddr(address)}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}

export function TxHashPill({
  hash,
  status = "confirmed",
  className = "",
}: {
  hash: string;
  status?: "confirmed" | "pending";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard?.writeText(hash);
    } catch {
      // clipboard unavailable — the copied state below is still shown
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const dot = status === "pending" ? "bg-amber-400" : "bg-emerald-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ${className}`}
    >
      <span className={`relative h-1.5 w-1.5 rounded-full ${dot}`}>
        {status === "pending" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
        )}
      </span>
      <span className="font-mono tabular-nums">
        {hash.length > 14 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash}
      </span>
      <button
        onClick={copy}
        className="grid h-4 w-4 place-items-center rounded-full hover:bg-black/5"
        aria-label="Copy tx hash"
      >
        {copied ? (
          <Check className="h-2.5 w-2.5 text-emerald-500" />
        ) : (
          <Copy className="h-2.5 w-2.5" />
        )}
      </button>
      <a
        href={explorerTxUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openExplorerTx(hash);
        }}
        className="grid h-4 w-4 place-items-center rounded-full hover:bg-black/5"
        aria-label="View on Arc explorer"
      >
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </span>
  );
}

export function BlockTicker() {
  // Mock ever-incrementing block height for hackathon polish.
  const [n, setN] = useState(8_421_337);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + 1), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      key={n}

      className="font-mono text-[10px] tabular-nums text-white/70"
    >
      #{n.toLocaleString()}
    </span>
  );
}
