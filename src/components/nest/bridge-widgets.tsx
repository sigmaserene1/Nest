import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Search, XCircle } from "lucide-react";
import { chainBrand } from "@/lib/chain-brand";
import { CCTP_CHAINS, type CctpChain } from "@/lib/cctp";

export function ChainLogo({ id, size = 10 }: { id: string; size?: number }) {
  const brand = chainBrand(id);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br ${brand.gradient} text-[10px] font-black text-white shadow-sm`}
      style={{ width: size * 4, height: size * 4 }}
    >
      {brand.initials.slice(0, 4)}
    </span>
  );
}

export function ChainPicker({
  label,
  chain,
  disabled,
  exclude,
  onChange,
}: {
  label: string;
  chain: CctpChain;
  disabled: boolean;
  exclude?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const options = CCTP_CHAINS.filter(
    (item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.id === chain.id,
  );

  return (
    <div ref={containerRef} className="relative rounded-2xl border bg-background p-4 transition focus-within:border-brand">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex w-full items-center gap-3 disabled:opacity-50"
      >
        <ChainLogo id={chain.id} />
        <span className="flex-1 text-left text-base font-bold">{chain.name}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      <span className="mt-2 block text-[11px] text-muted-foreground">
        Native USDC · CCTP domain {chain.domain} · {chain.eta}
      </span>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border bg-background p-2 shadow-lg">
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chains…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.id === exclude}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 ${
                  option.id === chain.id ? "bg-brand-soft" : ""
                }`}
              >
                <ChainLogo id={option.id} size={8} />
                <span className="flex-1">
                  <span className="block text-sm font-bold">{option.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    domain {option.domain} · {option.eta}
                  </span>
                </span>
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No chains match “{query}”.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type TrackerState =
  | "idle"
  | "switching"
  | "checking"
  | "approving"
  | "burning"
  | "attesting"
  | "minting"
  | "complete"
  | "error";

type StepKey = "approve" | "burn" | "attest" | "mint";

const STEP_ORDER: StepKey[] = ["approve", "burn", "attest", "mint"];

const STEP_LABEL: Record<StepKey, { title: string; active: string }> = {
  approve: { title: "Approve USDC", active: "Approving native USDC…" },
  burn: { title: "Burn on source chain", active: "Burning native USDC…" },
  attest: { title: "Circle attestation", active: "Waiting for Circle's attestation…" },
  mint: { title: "Mint on destination", active: "Minting native USDC…" },
};

function stepIndexForState(state: TrackerState): number {
  if (state === "idle" || state === "checking" || state === "switching") return -1;
  if (state === "approving") return 0;
  if (state === "burning") return 1;
  if (state === "attesting") return 2;
  if (state === "minting") return 3;
  if (state === "complete") return 4;
  if (state === "error") return -2;
  return -1;
}

export function BridgeStepTracker({ state, sourceName, destinationName }: {
  state: TrackerState;
  sourceName: string;
  destinationName: string;
}) {
  const activeIndex = stepIndexForState(state);
  const isError = state === "error";

  return (
    <ol className="mt-4 space-y-4">
      {STEP_ORDER.map((key, index) => {
        const label = STEP_LABEL[key];
        const done = activeIndex > index || state === "complete";
        const active = activeIndex === index;
        const failed = isError && activeIndex === -2 && index === 0;

        let title = label.title;
        if (key === "burn") title = `Burn on ${sourceName}`;
        if (key === "mint") title = `Mint on ${destinationName}`;

        return (
          <li key={key} className="flex gap-3">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-green-500/15 text-green-600"
                  : active
                    ? "bg-brand-soft text-brand"
                    : failed
                      ? "bg-red-500/15 text-red-500"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : failed ? (
                <XCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </span>
            <div>
              <div className={`text-xs font-bold ${active ? "text-brand" : ""}`}>{title}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {active ? label.active : done ? "Confirmed." : "Waiting."}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
