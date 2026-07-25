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

// USDC contract on Arc Testnet
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

// ERC20 minimal ABI (balanceOf + decimals)
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
] as const;

// WalletConnect projectId — get one free at https://cloud.reown.com
// Replace via VITE_WALLETCONNECT_PROJECT_ID env or edit this fallback.
export const WALLETCONNECT_PROJECT_ID =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  "REPLACE_WITH_YOUR_WALLETCONNECT_PROJECT_ID";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: "Nest · Arc",
    projectId: WALLETCONNECT_PROJECT_ID,
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
