export function NestLogo({ size = 32, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary"
        style={{
          width: size,
          height: size,
        }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none">
          <path
            d="M4.5 15.5c2.2-5.6 12.8-5.6 15 0M7.5 18.5c1.4-3.7 7.6-3.7 9 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </span>
      {showWord && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-semibold">Nest</span>
          <span className="font-mono text-[9px] uppercase text-muted-foreground">Arc</span>
        </span>
      )}
    </span>
  );
}

export function BuiltOnArc() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Settled on Arc
    </span>
  );
}
