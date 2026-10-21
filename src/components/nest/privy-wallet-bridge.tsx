import { useEffect, useRef, useState } from "react";
import { useCreateWallet, usePrivy, useToken, useWallets } from "@privy-io/react-auth";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import type { Address } from "viem";
import { arcChainFor, getArcEnvironment } from "@/lib/arc-network";
import { PRIVY_CONNECTOR_ID, registerPrivyWalletActions, updatePrivyWalletSession } from "@/lib/privy-wallet-session";
import { shouldCreatePrivyWallet } from "@/lib/privy-wallet-policy";

/** Runs only inside the lazy, browser-only Privy and wagmi providers. */
export function PrivyWalletBridge() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { getAccessToken } = useToken();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const account = useAccount();
  const [attempt, setAttempt] = useState(0);
  const creating = useRef(false);
  const connecting = useRef(false);
  const generation = useRef(0);
  const failed = useRef(false);
  const wallet = wallets.find((item) => item.walletClientType === "privy");

  useEffect(() => {
    registerPrivyWalletActions({ logout, getAccessToken, retry: () => {
      failed.current = false;
      updatePrivyWalletSession({ error: null });
      setAttempt((value) => value + 1);
    } });
  }, [logout, getAccessToken]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      generation.current += 1;
      failed.current = false;
      updatePrivyWalletSession({ ready: true, address: null, email: null, provider: null, connected: false, error: null });
      if (account.connector?.id === PRIVY_CONNECTOR_ID) void disconnectAsync();
      return;
    }
    if (failed.current) return;
    if (account.connector?.id === PRIVY_CONNECTOR_ID && account.isConnected && wallet?.address.toLowerCase() === account.address?.toLowerCase()) {
      updatePrivyWalletSession({ ready: true, connected: true, email: user?.email?.address ?? null });
      return;
    }
    updatePrivyWalletSession({ ready: false, email: user?.email?.address ?? null });
    if (!walletsReady || !user) return;
    if (!wallet) {
      // Linked-account metadata may arrive before the wallet provider; do not
      // create a second wallet while the existing one is still restoring.
      if (!shouldCreatePrivyWallet(false, user.linkedAccounts, creating.current)) return;
      creating.current = true;
      void createWallet().catch((error: unknown) => {
        failed.current = true;
        updatePrivyWalletSession({ ready: true, error: error instanceof Error ? error.message : "Could not create your EVM wallet. Please try again." });
      }).finally(() => { creating.current = false; });
      return;
    }
    if (connecting.current) return;
    connecting.current = true;
    const currentGeneration = generation.current;
    const connect = async () => {
      try {
        const connector = connectors.find((item) => item.id === PRIVY_CONNECTOR_ID);
        if (!connector) throw new Error("Email wallet connection is still loading. Please try again.");
        const connected = account.connector?.id === PRIVY_CONNECTOR_ID && account.address?.toLowerCase() === wallet.address.toLowerCase() && account.isConnected;
        const withTimeout = <T,>(promise: Promise<T>, ms: number) => Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
        // Switching network is best-effort: Privy can hang on custom chains.
        if (!connected) await withTimeout(wallet.switchChain(arcChainFor(getArcEnvironment()).id), 8_000).catch(() => undefined);
        const provider = await withTimeout(wallet.getEthereumProvider(), 20_000);
        if (currentGeneration !== generation.current) return;
        // The wallet is usable as soon as its provider exists; enter Nest now
        // and finish the wagmi link in the background.
        updatePrivyWalletSession({ address: wallet.address as Address, provider, error: null, ready: true, connected: true });
        if (!connected) await withTimeout(connectAsync({ connector }), 15_000).catch(() => undefined);
      } catch (error) {
        if (currentGeneration !== generation.current) return;
        failed.current = true;
        updatePrivyWalletSession({ ready: true, connected: false, error: error instanceof Error ? error.message : "Could not connect your email wallet. Please try again." });
      } finally {
        connecting.current = false;
      }
    };
    void connect();
  }, [ready, authenticated, user, walletsReady, wallet, connectors, connectAsync, createWallet, account.connector?.id, account.address, account.isConnected, disconnectAsync, attempt]);
  return null;
}