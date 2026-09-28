import { createConnector } from "wagmi";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createWalletClient, http, type Account, type Address } from "viem";

/**
 * Embedded wallet for email sign-in.
 *
 * When a visitor signs in with email (Lovable Cloud auth), we create a local
 * embedded wallet so they can use the app without installing MetaMask. The
 * private key is generated on their device and stored in localStorage,
 * scoped to their auth user id — it never leaves the browser.
 *
 * This module is viem-only (no @metamask/sdk), so it is safe to import from
 * SSR-reachable code; the key store itself is guarded by `typeof window`.
 */

const KEY_PREFIX = "nest.embedded.key.";
const ACTIVE_USER_KEY = "nest.embedded.user";

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
  window.localStorage.setItem(ACTIVE_USER_KEY, userId.toLowerCase());
  return privateKeyToAccount(pk as `0x${string}`);
}

/** The embedded account for the currently signed-in email user, if any. */
export function getActiveEmbeddedAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const userId = window.localStorage.getItem(ACTIVE_USER_KEY);
  if (!userId) return null;
  const pk = window.localStorage.getItem(storageKey(userId));
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) return null;
  return privateKeyToAccount(pk as `0x${string}`);
}

/** Clears the active embedded session (keys stay for when they sign back in). */
export function clearActiveEmbeddedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_USER_KEY);
}

export const EMBEDDED_CONNECTOR_ID = "nest.embedded";

/**
 * A wagmi connector backed by the embedded account. Signing and sending
 * happen locally through a viem wallet client exposed as an EIP-1193
 * provider — no external wallet prompt is involved.
 */
export function embeddedWalletConnector() {
  let currentChainId: number | undefined;

  return createConnector((config) => {
    function buildProvider(account: Account, chainId: number) {
      const chain =
        config.chains.find((c) => c.id === chainId) ?? config.chains[0];
      const transport = config.transports?.[chain.id];
      const client = createWalletClient({
        account,
        chain,
        transport: transport ?? http(),
      });
      // viem wallet clients expose an EIP-1193-compatible request method.
      return client;
    }

    return {
      id: EMBEDDED_CONNECTOR_ID,
      name: "Nest Email Wallet",
      type: "embedded",

      async setup() {},

      async connect({ chainId } = {}) {
        const account = getActiveEmbeddedAccount();
        if (!account)
          throw new Error("No embedded wallet. Sign in with email first.");
        const chain =
          config.chains.find((c) => c.id === chainId) ?? config.chains[0];
        currentChainId = chain.id;
        const accounts = [account.address] as readonly [Address];
        return { accounts, chainId: chain.id } as {
          accounts: readonly Address[];
          chainId: number;
        };
      },

      async disconnect() {
        clearActiveEmbeddedSession();
      },

      async getAccounts() {
        const account = getActiveEmbeddedAccount();
        return account ? ([account.address] as readonly [Address]) : [];
      },

      async getChainId() {
        return currentChainId ?? config.chains[0].id;
      },

      async getProvider({ chainId } = {}) {
        const account = getActiveEmbeddedAccount();
        if (!account) throw new Error("No embedded wallet session.");
        const id = chainId ?? currentChainId ?? config.chains[0].id;
        return buildProvider(account, id);
      },

      async isAuthorized() {
        return getActiveEmbeddedAccount() !== null;
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find((c) => c.id === chainId);
        if (!chain) throw new Error(`Chain ${chainId} not configured`);
        currentChainId = chainId;
        config.emitter.emit("change", { chainId });
        return chain;
      },

      onAccountsChanged() {},
      onChainChanged(chainId) {
        currentChainId = Number(chainId);
      },
      onDisconnect() {
        clearActiveEmbeddedSession();
      },
    };
  });
}
