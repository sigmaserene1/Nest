import { useEffect, useRef, useState } from "react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import type { Address } from "viem";
import { arcChainFor, getArcEnvironment } from "@/lib/arc-network";
import { PRIVY_CONNECTOR_ID, registerPrivyWalletActions, updatePrivyWalletSession } from "@/lib/privy-wallet-session";

/** Runs only inside the lazy, browser-only Privy and wagmi providers. */
export function PrivyWalletBridge() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const account = useAccount();
  const [attempt, setAttempt] = useState(0);
  const creating = useRef(false);
  const failed = useRef(false);
  const wallet = wallets.find((item) => item.walletClientType === "privy");

  useEffect(() => {
    registerPrivyWalletActions({ logout, retry: () => {
      failed.current = false;
      updatePrivyWalletSession({ error: null });
      setAttempt((value) => value + 1);
    } });
  }, [logout]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      failed.current = false;
      updatePrivyWalletSession({ ready: true, address: null, email: null, provider: null, connected: false, error: null });
      if (account.connector?.id === PRIVY_CONNECTOR_ID) void disconnectAsync();
      return;
    }
    if (failed.current) return;
    updatePrivyWalletSession({ ready: false, email: user?.email?.address ?? null });
    if (!walletsReady || !user) return;
    if (!wallet) {
      // Linked-account metadata may arrive before the wallet provider; do not
      // create a second wallet while the existing one is still restoring.
      const existing = user.linkedAccounts.some((item) => item.type === "wallet" && item.walletClientType === "privy" && item.chainType === "ethereum");
      if (existing || creating.current) return;
      creating.current = true;
      void createWallet().catch((error: unknown) => {
        failed.current = true;
        updatePrivyWalletSession({ ready: true, error: error instanceof Error ? error.message : "Could not create your EVM wallet. Please try again." });
      }).finally(() => { creating.current = false; });
      return;
    }
    let cancelled = false;
    const connect = async () => {
      try {
        const connector = connectors.find((item) => item.id === PRIVY_CONNECTOR_ID);
        if (!connector) return;
        const connected = account.connector?.id === PRIVY_CONNECTOR_ID && account.address?.toLowerCase() === wallet.address.toLowerCase() && account.isConnected;
        if (!connected) await wallet.switchChain(arcChainFor(getArcEnvironment()).id);
        const provider = await wallet.getEthereumProvider();
        if (cancelled) return;
        updatePrivyWalletSession({ address: wallet.address as Address, provider, error: null });
        if (!connected) await connectAsync({ connector });
        if (!cancelled) updatePrivyWalletSession({ ready: true, connected: true });
      } catch (error) {
        if (cancelled) return;
        failed.current = true;
        updatePrivyWalletSession({ ready: true, connected: false, error: error instanceof Error ? error.message : "Could not connect your email wallet. Please try again." });
      }
    };
    void connect();
    return () => { cancelled = true; };
  }, [ready, authenticated, user, walletsReady, wallet, connectors, connectAsync, createWallet, account.connector?.id, account.address, account.isConnected, disconnectAsync, attempt]);
  return null;
}