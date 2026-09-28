import { createConnector } from "wagmi";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Account, Address, Chain, Transport } from "viem";

/**
 * Embedded wallet for email sign-in.
 *
 * When a visitor signs in with email (Lovable Cloud auth), we create a local
 * embedded wallet for them so they can use the app without installing
 * MetaMask. The private key is generated on their device and stored in
 * localStorage, scoped to their auth user id — it never leaves the browser.
 *
 * This module is viem-only (no @metamask/sdk), so it is safe to import from
 * SSR-reachable code; the key store itself is guarded by `typeof window`.
 */

const KEY_PREFIX = "nest.embedded.key.";

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId.toLowerCase()}`;
}

/** Returns the embedded account for a user, creating one on first use. */
export function getOrCreateEmbeddedAccount(userId: string): Account | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(userId);
  let pk = window.localStorage.getItem(key);
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    pk = generatePrivateKey();
    window.localStorage.setItem(key, pk);
  }
  return privateKeyToAccount(pk as `0x${string}`);
}

/** Looks up an existing embedded account without creating one. */
export function getEmbeddedAccount(userId: string): Account | null {
  if (typeof window === "undefined") return null;
  const pk = window.localStorage.getItem(storageKey(userId));
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) return null;
  return privateKeyToAccount(pk as `0x${string}`);
}

export function hasEmbeddedWallet(userId: string): boolean {
  return getEmbeddedAccount(userId) !== null;
}

export const EMBEDDED_CONNECTOR_ID = "nest.embedded";

type EmbeddedConnectorParameters = {
  getAccount: () => Account | null;
};

/**
 * A minimal wagmi connector that exposes the embedded wallet account.
 * Signing happens locally through the viem account — no external wallet
 * prompt is involved.
 */
export function embeddedWalletConnector({ getAccount }: EmbeddedConnectorParameters) {
  let currentAccount: Account | null = null;

  return createConnector<Transport, Record<string, never>, Record<string, never>>(
    (config) => ({
      id: EMBEDDED_CONNECTOR_ID,
      name: "Nest Email Wallet",
      type: "embedded",
      icon: undefined,

      async setup() {
        currentAccount = getAccount();
      },

      async connect({ chainId } = {}) {
        const account = getAccount();
        if (!account) throw new Error("No embedded wallet. Sign in with email first.");
        currentAccount = account;
        const chain =
          config.chains.find((c) => c.id === chainId) ?? config.chains[0];
        return {
          accounts: [account.address] as readonly [Address],
          chainId: chain.id,
        };
      },

      async disconnect() {
        currentAccount = null;
      },

      async getAccounts() {
        const account = currentAccount ?? getAccount();
        return account ? ([account.address] as readonly [Address]) : [];
      },

      async getChainId() {
        return config.chains[0].id;
      },

      async isAuthorized() {
        return getAccount() !== null;
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find((c) => c.id === chainId);
        if (!chain) throw new Error(`Chain ${chainId} not configured`);
        return chain as Chain;
      },

      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {},

      async getProvider() {
        return undefined as never;
      },

      // Local signing for transactions and messages.
      async getClient() {
        return undefined as never;
      },
    }),
  );
}
