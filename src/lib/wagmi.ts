import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { metaMaskWallet, walletConnectWallet, injectedWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";

// Official Arc Testnet params
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Circle USDC on Arc Testnet
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;
export const USDC_DECIMALS = 6;

// Minimal ERC20 ABI (read + transfer)
export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

// WalletConnect projectId — get one free at https://cloud.reown.com and set VITE_WALLETCONNECT_PROJECT_ID.
const WC_RAW = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "";
const WC_VALID = /^[0-9a-f]{32}$/i.test(WC_RAW);
export const WALLETCONNECT_PROJECT_ID = WC_VALID ? WC_RAW : "";

// Explorer helpers
export const explorerTxUrl = (hash: string) => `${arcTestnet.blockExplorers.default.url}/tx/${hash}`;
export const explorerAddrUrl = (addr: string) => `${arcTestnet.blockExplorers.default.url}/address/${addr}`;

const wallets = WC_VALID
  ? [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet]
  : [metaMaskWallet, rainbowWallet, injectedWallet];

const connectors = connectorsForWallets(
  [{ groupName: "Recommended", wallets }],
  {
    appName: "Nest · Arc",
    projectId: WALLETCONNECT_PROJECT_ID || "0".repeat(32), // never used when WC disabled
  },
);

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors,
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
