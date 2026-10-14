import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { type ArcEnvironment } from "@/lib/arc-network";

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
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[9px] font-semibold text-muted-foreground lg:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${isConnected && isOnArc ? "bg-success" : "bg-muted-foreground/50"}`} />
          {isConnected && isOnArc ? "ARC READY" : "WALLET"}
        </span>
        <select
          aria-label="Arc network"
          value={environment}
          disabled={isSwitching}
          onChange={(event) => void changeEnvironment(event.target.value === "mainnet" ? "mainnet" : "testnet")}
          className="h-9 max-w-32 rounded-xl border border-border bg-card px-2 text-xs font-bold text-foreground shadow-sm"
        >
          <option value="testnet">Arc Testnet</option>
          <option value="mainnet">Arc Mainnet</option>
        </select>

        <ConnectButton
          accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
          showBalance={false}
        />
      </div>

      {isConnected && !isOnArc && (
        <Button variant="outline"
          onClick={switchToArc}
          disabled={isSwitching}
          className="glass fixed left-3 right-3 top-20 z-50 flex items-center justify-between gap-3 rounded-2xl border-amber-400/35 px-4 py-3 text-left text-sm shadow-elevated transition hover:border-amber-400/60 disabled:opacity-70 sm:static sm:left-auto sm:right-auto sm:top-auto sm:z-auto"
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
        </Button>
      )}
    </div>
  );
}
