import { Link } from "@tanstack/react-router";

export function NestLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground shadow-brand">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">Nest</span>
    </Link>
  );
}

export function BuiltOnArc({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground ${className}`}
      title="Settled onchain with USDC on Arc"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      Built on Arc
    </span>
  );
}
