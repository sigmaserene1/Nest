import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { arcTestnet } from "@/lib/wagmi";

export function WalletHeader() {
  const { isConnected, isOnArc, switchToArc, isSwitching } = useArcWallet();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
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
          className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-70"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-900">
              Wrong network — switch to {arcTestnet.name}
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
