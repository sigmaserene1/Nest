import { createConnector } from "wagmi";
import type { Address } from "viem";

/**
 * Privy and Circle own DIFFERENT wallets. This connector is only for newly
 * created Privy embedded wallets; it cannot unlock an existing Circle wallet.
 * No wallet key, OTP, or Privy access token is copied into Nest storage.
 */
export const PRIVY_CONNECTOR_ID = "nest.privy";
export const PRIVY_AUTH_SELECTION = "nest.auth.provider";

type Eip1193 = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type PrivyWallet = {
  address: string;
  getEthereumProvider: () => Promise<Eip1193>;
  switchChain: (chainId: number) => Promise<void>;
};

let currentWallet: PrivyWallet | null = null;
let signOut: (() => Promise<void>) | null = null;

export function setPrivyWallet(wallet: PrivyWallet | null, logout?: () => Promise<void>) {
  currentWallet = wallet;
  if (logout) signOut = logout;
}

export function selectPrivyLogin() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIVY_AUTH_SELECTION, "privy");
  window.dispatchEvent(new Event("nest-privy-selection"));
}

export function selectCircleLogin() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIVY_AUTH_SELECTION, "circle");
  window.dispatchEvent(new Event("nest-privy-selection"));
}

export function isPrivySelected() {
  return typeof window !== "undefined" && window.localStorage.getItem(PRIVY_AUTH_SELECTION) === "privy";
}

export function privyWalletConnector() {
  return createConnector((config) => ({
    id: PRIVY_CONNECTOR_ID,
    name: "Nest email wallet (Privy)",
    type: "embedded",
    async connect() {
      if (!currentWallet) throw new Error("Verify your email with Privy first.");
      const chain = config.chains.find((c) => c.id === (config.chains[1]?.id ?? config.chains[0].id)) ?? config.chains[0];
      // Prefer Arc Testnet for the present Nest email-wallet deployment.
      await currentWallet.switchChain(chain.id);
      return { accounts: [currentWallet.address as Address] as readonly [Address], chainId: chain.id };
    },
    async disconnect() {
      currentWallet = null;
      if (typeof window !== "undefined") window.localStorage.removeItem(PRIVY_AUTH_SELECTION);
      if (signOut) await signOut();
    },
    async getAccounts() {
      return currentWallet ? [currentWallet.address as Address] : [];
    },
    async getChainId() {
      if (!currentWallet) return config.chains[1]?.id ?? config.chains[0].id;
      const provider = await currentWallet.getEthereumProvider();
      const raw = await provider.request({ method: "eth_chainId" });
      return typeof raw === "string" ? Number(BigInt(raw)) : Number(raw);
    },
    async getProvider() {
      if (!currentWallet) throw new Error("Your Privy email wallet is not connected.");
      return currentWallet.getEthereumProvider();
    },
    async isAuthorized() {
      // Do not automatically reconnect without a restored, verified Privy SDK
      // user session and the wallet restored in PrivyWalletSync.
      return isPrivySelected() && currentWallet !== null;
    },
    async switchChain({ chainId }) {
      if (!currentWallet) throw new Error("Your Privy session has expired.");
      const chain = config.chains.find((c) => c.id === chainId);
      if (!chain) throw new Error("This network is not configured in Nest.");
      await currentWallet.switchChain(chainId);
      return chain;
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }));
}
