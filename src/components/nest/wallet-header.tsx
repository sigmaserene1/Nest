import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { arcEnvironmentLabel, type ArcEnvironment } from "@/lib/arc-network";

export function WalletHeader() {
  const {
    isConnected,
    isOnArc,
    switchToArc,
    isSwitching,
    environment,
    arcChain,
    selectEnvironment,
  } = useArcWallet();

  const changeEnvironment = async (next: ArcEnvironment) => {
    if (next === environment || isSwitching) return;
    try {
      await selectEnvironment(next);
    } catch {
      // A rejected wallet network switch keeps the existing Nest environment.
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="inline-flex rounded-xl border bg-card/70 p-1 shadow-sm">
          {(["mainnet", "testnet"] as ArcEnvironment[]).map((option) => {
            const active = environment === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => changeEnvironment(option)}
                disabled={isSwitching}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition disabled:opacity-60 ${
                  active
                    ? option === "mainnet"
                      ? "bg-emerald-600 text-white"
                      : "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title={`Use Arc ${arcEnvironmentLabel(option)}`}
              >
                {option === "mainnet" ? "Mainnet" : "Testnet"}
              </button>
            );
          })}
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border bg-card/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground shadow-sm sm:inline-flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected && isOnArc
                ? environment === "mainnet"
                  ? "bg-emerald-500"
                  : "bg-sky-500"
                : "bg-muted-foreground/50"
            }`}
          />
          {isConnected && isOnArc ? arcChain.name : "Wallet"}
        </span>

        <ConnectButton
          accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
          showBalance={false}
        />
      </div>

      {isConnected && !isOnArc && (
        <button
          onClick={switchToArc}
          disabled={isSwitching}
          className="glass flex items-center justify-between gap-3 rounded-2xl border-amber-400/35 px-4 py-3 text-left text-sm transition hover:border-amber-400/60 disabled:opacity-70"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-foreground">
              Wrong network — switch to {arcChain.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
            {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
            Switch
          </span>
        </button>
      )}
    </div>
  );
}
