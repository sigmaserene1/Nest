import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import type { CreateConnectorFn } from "wagmi";

// WalletConnect projectId — get one free at https://cloud.reown.com and set VITE_WALLETCONNECT_PROJECT_ID.
const WC_RAW = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "";
const WC_VALID = /^[0-9a-f]{32}$/i.test(WC_RAW);
export const WALLETCONNECT_PROJECT_ID = WC_VALID ? WC_RAW : "";

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
