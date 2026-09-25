import { fallback } from "viem";
import {
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from "viem/chains";
import { createConfig, http, type CreateConnectorFn } from "wagmi";
import {
  ARC_MAINNET_RPC_URLS,
  ARC_TESTNET_RPC_URLS,
  ARC_USDC_ADDRESS,
  arcExplorerFor,
  arcMainnet,
  arcTestnet,
  getArcEnvironment,
} from "@/lib/arc-network";

// Arc USDC uses the same ERC-20 predeploy on mainnet and testnet.
export const USDC_ADDRESS = ARC_USDC_ADDRESS;
export const USDC_DECIMALS = 6;

// Minimal ERC20 ABI (read + transfer)
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;


// WalletConnect projectId — get one free at https://cloud.reown.com and set VITE_WALLETCONNECT_PROJECT_ID.
const WC_RAW = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "";
const WC_VALID = /^[0-9a-f]{32}$/i.test(WC_RAW);
export const WALLETCONNECT_PROJECT_ID = WC_VALID ? WC_RAW : "";

// Explorer helpers
export const explorerTxUrl = (
  hash: string,
  explorer = arcExplorerFor(getArcEnvironment()),
) => `${explorer}/tx/${hash}`;
export const explorerAddrUrl = (
  addr: string,
  explorer = arcExplorerFor(getArcEnvironment()),
) => `${explorer}/address/${addr}`;

/**
 * Opens an explorer link in a brand-new browsing context.
 * Plain target="_blank" inherits the opener from the embedded preview, which
 * Arcscan rejects with ERR_BLOCKED_BY_RESPONSE — "noopener" avoids that.
 */
export function openExternal(url: string) {
  if (typeof window === "undefined") return;
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) w.opener = null;
  else window.location.href = url;
}

export const openExplorerTx = (hash: string) => openExternal(explorerTxUrl(hash));
export const openExplorerAddr = (addr: string) => openExternal(explorerAddrUrl(addr));

const wallets = WC_VALID
  ? [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet]
  : [metaMaskWallet, rainbowWallet, injectedWallet];

const connectors = connectorsForWallets([{ groupName: "Recommended", wallets }], {
  appName: "Nest · Arc",
  projectId: WALLETCONNECT_PROJECT_ID || "0".repeat(32), // never used when WC disabled
});

export const wagmiConfig = createConfig({
  // Both Arc environments are first-class wallet networks. The remaining
  // chains are the existing CCTP v2 testnet sources used by the bridge.
  chains: [arcMainnet, arcTestnet, sepolia, avalancheFuji, optimismSepolia, arbitrumSepolia, baseSepolia, polygonAmoy],
  connectors,
  transports: {
    [arcMainnet.id]: fallback(
      ARC_MAINNET_RPC_URLS.map((url) => http(url, { batch: true, retryCount: 2, timeout: 15_000 })),
      { rank: false },
    ),
    [arcTestnet.id]: fallback(
      ARC_TESTNET_RPC_URLS.map((url) => http(url, { batch: true, retryCount: 2, timeout: 15_000 })),
      { rank: false },
    ),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [optimismSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});
