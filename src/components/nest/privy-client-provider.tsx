import { useEffect, useRef, useState, type ReactNode } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { arcTestnet } from "@/lib/arc-network";
import { Web3Provider } from "@/components/web3-provider";
import {
  PRIVY_CONNECTOR_ID,
  isPrivyEmailWalletSelected,
  setPrivyEmbeddedWallet,
  type PrivyEmbeddedWallet,
} from "@/lib/privy-embedded-wallet";

/**
 * Real verified Privy wallets are exposed to the existing wagmi app via an
 * isolated connector. No Circle PIN or Circle credentials are involved here.
 */
function PrivyWalletSync({ children }: { children: ReactNode }) {
  const { ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected, connector: activeConnector } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [revision, setRevision] = useState(0);
  const connectingRef = useRef(false);

  useEffect(() => {
    const changed = () => setRevision((value) => value + 1);
    window.addEventListener("nest-email-wallet-provider", changed);
    return () => window.removeEventListener("nest-email-wallet-provider", changed);
  }, []);

  const wallet = authenticated
    ? wallets.find((candidate) => candidate.walletClientType === "privy")
    : undefined;

  useEffect(() => {
    setPrivyEmbeddedWallet(wallet ? (wallet as unknown as PrivyEmbeddedWallet) : null, logout);
    return () => setPrivyEmbeddedWallet(null);
  }, [wallet, logout]);

  useEffect(() => {
    if (!ready || !authenticated || !wallet || !isPrivyEmailWalletSelected()) return;
    if (isConnected || connectingRef.current) return;
    const connector = connectors.find((value) => value.id === PRIVY_CONNECTOR_ID);
    if (!connector) return;
    connectingRef.current = true;
    setPrivyEmbeddedWallet(wallet as unknown as PrivyEmbeddedWallet, logout);
    void connectAsync({ connector })
      .catch((error: unknown) => {
        console.error("Privy wallet connection failed", error);
      })
      .finally(() => { connectingRef.current = false; });
  }, [ready, authenticated, wallet, isConnected, connectors, connectAsync, logout, revision]);

  useEffect(() => {
    if (!ready || authenticated || !isConnected || activeConnector?.id !== PRIVY_CONNECTOR_ID) return;
    void disconnectAsync().catch(() => undefined);
  }, [ready, authenticated, isConnected, activeConnector?.id, disconnectAsync]);

  return <>{children}</>;
}

export default function PrivyClientProvider({
  appId,
  children,
}: {
  appId: string;
  children: ReactNode;
}) {
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
          accentColor: "#8B35EF",
          logo: "https://nestarc.xyz/favicon.ico",
        },
      }}
    >
      <Web3Provider>
        <PrivyWalletSync>{children}</PrivyWalletSync>
      </Web3Provider>
    </PrivyProvider>
  );
}
