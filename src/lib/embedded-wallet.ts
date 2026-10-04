import { createConnector } from "wagmi";
import { createPublicClient, http, type Address } from "viem";
import { arcChainFor } from "@/lib/arc-network";

/**
 * Email wallet connector backed by Circle User-Controlled Wallets.
 * The wallet lives with Circle (same wallet on every device, recoverable with
 * the user's PIN). Signing and sending open Circle's approval screen.
 * SSR-safe: the Circle SDK is only loaded in the browser on demand.
 */
export const EMBEDDED_CONNECTOR_ID = "nest.circle";
// Circle wallets currently run on Arc Testnet.
const circleChainId = () => arcChainFor("testnet").id;

const loadCircle = () => import("@/lib/circle-sdk");

function sessionAddress(): Address | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(window.localStorage.getItem("nest.circle.session") ?? "null");
    if (!s || Date.now() - s.createdAt > 55 * 60 * 1000) return null;
    return s.address as Address;
  } catch {
    return null;
  }
}

export function clearActiveEmbeddedSession() {
  if (typeof window === "undefined") return;
  void loadCircle().then((m) => m.clearCircleSession());
}

export function embeddedWalletConnector() {
  return createConnector((config) => {
    const chain = () => config.chains.find((c) => c.id === circleChainId()) ?? config.chains[0];

    function buildProvider() {
      const c = chain();
      const rpc = createPublicClient({ chain: c, transport: config.transports?.[c.id] ?? http() });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = async ({ method, params }: { method: string; params?: any }) => {
        const p = (params ?? []) as any[];
        const m = await loadCircle();
        switch (method) {
          case "eth_accounts":
          case "eth_requestAccounts": {
            const a = sessionAddress();
            return a ? [a] : [];
          }
          case "eth_chainId":
            return `0x${c.id.toString(16)}`;
          case "personal_sign":
            return m.circleSignPayload("message", p[0]);
          case "eth_signTypedData_v4":
            return m.circleSignPayload("typedData", typeof p[1] === "string" ? p[1] : JSON.stringify(p[1]));
          case "eth_sendTransaction": {
            const tx = p[0] ?? {};
            return m.circleSendTransaction({ to: tx.to, data: tx.data, value: tx.value });
          }
          case "wallet_switchEthereumChain":
            return null;
          default:
            return rpc.request({ method, params } as any);
        }
      };
      return { request, on() {}, removeListener() {} };
    }

    return {
      id: EMBEDDED_CONNECTOR_ID,
      name: "Email Wallet (Circle)",
      type: "embedded",
      async setup() {},
      async connect() {
        const a = sessionAddress();
        if (!a) throw new Error("Sign in with email first.");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { accounts: [a] as readonly [Address], chainId: chain().id } as any;
      },
      async disconnect() {
        clearActiveEmbeddedSession();
      },
      async getAccounts() {
        const a = sessionAddress();
        return a ? ([a] as readonly [Address]) : [];
      },
      async getChainId() {
        return chain().id;
      },
      async getProvider() {
        return buildProvider();
      },
      async isAuthorized() {
        return sessionAddress() !== null;
      },
      async switchChain({ chainId }) {
        if (chainId !== chain().id) throw new Error("Email wallets run on Arc Testnet only.");
        return chain();
      },
      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {
        clearActiveEmbeddedSession();
      },
    };
  });
}
