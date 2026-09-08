export function NestLogo({ size = 32, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid place-items-center rounded-2xl text-white shadow-brand"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #ff6a5b, #e53935)",
        }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none">
          <path
            d="M4 11L12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z"
            fill="currentColor"
          />
        </svg>
      </span>
      {showWord && <span className="text-[19px] font-bold tracking-tight">Nest</span>}
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
