import { createConnector } from "wagmi";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { arcChainFor, getArcEnvironment } from "@/lib/arc-network";
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
      // Minimal EIP-1193 provider: account/signing methods are handled
      // locally with the embedded key; everything else goes to the RPC.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = async ({ method, params }: { method: string; params?: any }) => {
        const p = (params ?? []) as any[];
        switch (method) {
          case "eth_accounts":
          case "eth_requestAccounts":
            return [account.address];
          case "eth_chainId":
            return `0x${chain.id.toString(16)}`;
          case "personal_sign":
            return client.signMessage({ account, message: { raw: p[0] } });
          case "eth_signTypedData_v4": {
            const data = typeof p[1] === "string" ? JSON.parse(p[1]) : p[1];
            const { EIP712Domain: _d, ...types } = data.types ?? {};
            return client.signTypedData({
              account,
              domain: data.domain,
              types,
              primaryType: data.primaryType,
              message: data.message,
            });
          }
          case "eth_sendTransaction": {
            const tx = p[0] ?? {};
            const big = (v?: string) => (v ? BigInt(v) : undefined);
            return client.sendTransaction({
              account,
              chain,
              to: tx.to,
              data: tx.data,
              value: big(tx.value),
              gas: big(tx.gas),
              nonce: tx.nonce ? Number(tx.nonce) : undefined,
            } as any);
          }
          case "wallet_switchEthereumChain":
            return null;
          default:
            return client.request({ method, params } as any);
        }
      };
      return { request, on() {}, removeListener() {} };
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
        const target = chainId ?? arcChainFor(getArcEnvironment()).id;
        const chain =
          config.chains.find((c) => c.id === target) ?? config.chains[0];
        currentChainId = chain.id;
        const accounts = [account.address] as readonly [Address];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { accounts, chainId: chain.id } as any;
      },

      async disconnect() {
        clearActiveEmbeddedSession();
      },

      async getAccounts() {
        const account = getActiveEmbeddedAccount();
        return account ? ([account.address] as readonly [Address]) : [];
      },

      async getChainId() {
        return currentChainId ?? arcChainFor(getArcEnvironment()).id;
      },

      async getProvider({ chainId } = {}) {
        const account = getActiveEmbeddedAccount();
        if (!account) throw new Error("No embedded wallet session.");
        const id = chainId ?? currentChainId ?? arcChainFor(getArcEnvironment()).id;
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
