import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Clock3, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chainBrand } from "@/lib/chain-brand";
import { CCTP_CHAINS, type CctpChain } from "@/lib/cctp";

export function ChainLogo({ id, size = 10 }: { id: string; size?: number }) {
  const brand = chainBrand(id);
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-border/70 bg-card text-[9px] font-black text-primary-foreground shadow-sm ${failed || !brand.logo ? brand.accent : ""}`}
      style={{ width: size * 4, height: size * 4 }}
    >
      {brand.logo && !failed ? (
        <img
          src={brand.logo}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        brand.initials.slice(0, 4)
      )}
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
    <div ref={containerRef} className="relative">
      <span className="mb-2 block text-[11px] font-bold uppercase text-muted-foreground">{label} network</span>
      <Button
        variant="outline"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="h-auto min-h-16 w-full justify-start rounded-xl border-border bg-card px-3 py-3 shadow-none hover:bg-muted/50"
      >
        <ChainLogo id={chain.id} size={10} />
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">{chain.name}</span>
            <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-warning">Testnet</span>
          </span>
          <span className="mt-1 block text-[10px] font-medium text-muted-foreground">
            Chain {chain.chainId} · Domain {chain.domain}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover p-2 shadow-elevated">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chains…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="scroll-clean mt-2 max-h-72 space-y-1 overflow-y-auto">
            {options.map((option) => (
              <Button
                variant="ghost"
                key={option.id}
                type="button"
                disabled={option.id === exclude}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left disabled:opacity-40 ${
                  option.id === chain.id ? "bg-brand-soft" : ""
                }`}
              >
                <ChainLogo id={option.id} size={9} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{option.name}</span>
                    <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-warning">Testnet</span>
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" /> {option.eta} · Chain {option.chainId} · CCTP {option.domain}
                  </span>
                </span>
                {option.id === chain.id && <Check className="h-4 w-4 text-brand" />}
              </Button>
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
  approve: { title: "Approve USDC", active: "Confirm approval in your wallet" },
  burn: { title: "Burn on source chain", active: "Submitting the CCTP burn" },
  attest: { title: "Circle attestation", active: "Waiting for Circle to attest" },
  mint: { title: "Mint on destination", active: "Confirm the destination mint" },
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
    <ol className="relative mt-4 space-y-1 before:absolute before:bottom-5 before:left-3 before:top-5 before:w-px before:bg-border">
      {STEP_ORDER.map((key, index) => {
        const label = STEP_LABEL[key];
        const done = activeIndex > index || state === "complete";
        const active = activeIndex === index;
        const failed = isError && activeIndex === -2 && index === 0;

        let title = label.title;
        if (key === "burn") title = `Burn on ${sourceName}`;
        if (key === "mint") title = `Mint on ${destinationName}`;

        return (
          <li key={key} className="relative flex gap-3 rounded-lg py-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-success/15 text-success"
                  : active
                    ? "bg-brand-soft text-brand"
                    : failed
                      ? "bg-destructive/15 text-destructive"
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
              <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                {active ? label.active : done ? "Confirmed onchain" : index === 2 ? "Usually 10–20 seconds" : "Waiting"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
