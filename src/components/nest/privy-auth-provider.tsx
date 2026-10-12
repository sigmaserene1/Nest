import { useEffect, useState, type ReactNode } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/arc-network";
import {
  PRIVY_CONNECTOR_ID,
  isPrivySelected,
  setPrivyWallet,
  type PrivyWallet,
} from "@/lib/privy-wallet";

/**
 * Opt-in rollout only. Do not deploy the new login to live traffic until the
 * Privy app is configured, the dependency lock is refreshed, and a real
 * testnet wallet transaction passes. Existing Circle wallets are unchanged.
 */
export function NestPrivyProvider({ children }: { children: ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID as string;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        appearance: {
          theme: "light",
          accentColor: "#E53935",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

/**
 * Maps Privy's own EIP-1193 wallet into Nest's existing wagmi transaction
 * hooks. Never convert a Privy OTP into a Circle user token: that is not
 * supported and would create an unsafe account-ownership assumption.
 */
export function PrivyWalletSync({ children }: { children: ReactNode }) {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { connector: activeConnector, isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [selectionRevision, setSelectionRevision] = useState(0);

  useEffect(() => {
    const onSelection = () => setSelectionRevision((revision) => revision + 1);
    window.addEventListener("nest-privy-selection", onSelection);
    return () => window.removeEventListener("nest-privy-selection", onSelection);
  }, []);

  const wallet = authenticated
    ? wallets.find((item) => item.walletClientType === "privy")
    : undefined;

  useEffect(() => {
    setPrivyWallet(wallet ? (wallet as unknown as PrivyWallet) : null, logout);
  }, [wallet, logout]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated && activeConnector?.id === PRIVY_CONNECTOR_ID) {
      void disconnectAsync().catch(() => {});
      return;
    }

    if (!authenticated || !wallet || !isPrivySelected() || isConnected) return;
    const connector = connectors.find((item) => item.id === PRIVY_CONNECTOR_ID);
    if (!connector) return;
    // wallet is already reflected via the effect above, before reconnection.
    setPrivyWallet(wallet as unknown as PrivyWallet, logout);
    void connectAsync({ connector }).catch((error: unknown) => {
      console.error("Could not restore Privy wallet", error);
    });
  }, [
    ready, authenticated, wallet, activeConnector?.id, isConnected,
    connectors, connectAsync, disconnectAsync, logout, selectionRevision,
  ]);

  return <>{children}</>;
}
