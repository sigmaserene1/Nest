import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import type { CreateConnectorFn } from "wagmi";
import { WALLETCONNECT_PROJECT_ID } from "@/lib/wagmi";

const WC_VALID = /^[0-9a-f]{32}$/i.test(WALLETCONNECT_PROJECT_ID);

/**
 * CLIENT-ONLY: this module pulls in @metamask/sdk, which crashes when evaluated
 * during server rendering ("Class extends value [object Module] is not a
 * constructor"). Never import it from SSR-reachable code — load it via
 * dynamic import() on the client (see getClientWagmiConfig in wagmi.ts).
 */
export function buildWalletConnectors(): CreateConnectorFn[] {
  const wallets = WC_VALID
    ? [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet]
    : [metaMaskWallet, rainbowWallet, injectedWallet];

  return connectorsForWallets([{ groupName: "Recommended", wallets }], {
    appName: "Nest · Arc",
    projectId: WALLETCONNECT_PROJECT_ID || "0".repeat(32), // never used when WC disabled
  });
}
