import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Loader2, Unplug, Wallet } from "lucide-react";

export function WalletHeader() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              disabled={!mounted}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {!mounted ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wallet className="h-3.5 w-3.5" />
              )}
              Connect
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-400/35 bg-amber-400/10 px-3 text-xs font-semibold text-amber-300"
            >
              <Unplug className="h-3.5 w-3.5" /> Switch network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openChainModal}
              className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground hover:border-primary/40 sm:inline-flex"
              aria-label="Change network"
            >
              {chain.hasIcon && chain.iconUrl ? (
                <img src={chain.iconUrl} alt="" className="h-4 w-4 rounded" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
              <span>{chain.name}</span>
            </button>
            <button
              type="button"
              onClick={openAccountModal}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 font-mono text-xs hover:border-primary/40"
            >
              {account.displayName}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
