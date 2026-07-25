import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export function ArcBadge({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const cls =
    variant === "light"
      ? "bg-white/10 text-white backdrop-blur"
      : "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Arc Testnet
    </span>
  );
}

export function UsdcBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const px = size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[9.5px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[#2775CA]/10 font-bold uppercase tracking-wider text-[#2775CA] ring-1 ring-[#2775CA]/20 ${px}`}>
      <span className="grid h-3 w-3 place-items-center rounded-full bg-[#2775CA] text-[7px] text-white">$</span>
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
    try { await navigator.clipboard?.writeText(address); } catch {}
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
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />}
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
    try { await navigator.clipboard?.writeText(hash); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const dot =
    status === "pending"
      ? "bg-amber-400"
      : "bg-emerald-500";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ${className}`}>
      <span className={`relative h-1.5 w-1.5 rounded-full ${dot}`}>
        {status === "pending" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
        )}
      </span>
      <span className="font-mono tabular-nums">{hash.length > 14 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash}</span>
      <button onClick={copy} className="grid h-4 w-4 place-items-center rounded-full hover:bg-black/5" aria-label="Copy tx hash">
        {copied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
      </button>
      <a
        href={`https://testnet.arcscan.app/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
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
    <motion.span
      key={n}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      className="font-mono text-[10px] tabular-nums text-white/70"
    >
      #{n.toLocaleString()}
    </motion.span>
  );
}
