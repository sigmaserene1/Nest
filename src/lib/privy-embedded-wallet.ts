import { createConnector } from "wagmi";
import type { Address } from "viem";
import { arcTestnet } from "@/lib/arc-network";

/**
 * Privy email wallets and Circle user-controlled wallets have different keys
 * and addresses. NEVER use a Privy OTP as proof of Circle wallet ownership.
 */
export const PRIVY_CONNECTOR_ID = "nest.privy";
const WALLET_PROVIDER_KEY = "nest.email.walletProvider";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type PrivyEmbeddedWallet = {
  address: string;
  switchChain: (chainId: number) => Promise<void>;
  getEthereumProvider: () => Promise<EthereumProvider>;
};

let activeWallet: PrivyEmbeddedWallet | null = null;
let logoutPrivy: (() => Promise<void>) | null = null;

export function setPrivyEmbeddedWallet(
  wallet: PrivyEmbeddedWallet | null,
  logout?: () => Promise<void>,
) {
  activeWallet = wallet;
  if (logout) logoutPrivy = logout;
}

export function chooseEmailWalletProvider(provider: "privy" | "circle") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_PROVIDER_KEY, provider);
  window.dispatchEvent(new Event("nest-email-wallet-provider"));
}

export function isPrivyEmailWalletSelected(): boolean {
  return typeof window !== "undefined" &&
    window.localStorage.getItem(WALLET_PROVIDER_KEY) === "privy";
}

export function privyEmbeddedWalletConnector() {
  return createConnector((config) => ({
    id: PRIVY_CONNECTOR_ID,
    name: "Email wallet (Privy)",
    type: "embedded",
    async setup() {},
    async connect() {
      if (!activeWallet || !isPrivyEmailWalletSelected()) {
        throw new Error("Verify your email with Privy first.");
      }
      await activeWallet.switchChain(arcTestnet.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { accounts: [activeWallet.address as Address], chainId: arcTestnet.id } as any;
    },
    async disconnect() {
      activeWallet = null;
      chooseEmailWalletProvider("circle");
      if (logoutPrivy) await logoutPrivy();
    },
    async getAccounts() {
      return activeWallet && isPrivyEmailWalletSelected()
        ? ([activeWallet.address as Address] as readonly [Address])
        : [];
    },
    async getChainId() {
      const provider = await activeWallet?.getEthereumProvider();
      if (!provider) return arcTestnet.id;
      const chainId = await provider.request({ method: "eth_chainId" });
      return typeof chainId === "string" ? Number(BigInt(chainId)) : Number(chainId);
    },
    async getProvider() {
      if (!activeWallet || !isPrivyEmailWalletSelected()) {
        throw new Error("Your Privy email wallet is not connected.");
      }
      return activeWallet.getEthereumProvider();
    },
    async isAuthorized() {
      // Authentication and wallet presence must both be verified by Privy.
      return isPrivyEmailWalletSelected() && activeWallet !== null;
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find((value) => value.id === chainId);
      if (!chain) throw new Error("This chain is not configured for Nest.");
      if (!activeWallet) throw new Error("Your Privy wallet is not connected.");
      await activeWallet.switchChain(chainId);
      return chain;
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {},
  }));
}
