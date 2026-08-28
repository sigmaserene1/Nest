import { AppKit, type BridgeResult } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { EIP1193Provider } from "viem";
import type { Connector } from "wagmi";

export const APP_KIT_FUNDING_CHAINS = [
  { id: "Ethereum_Sepolia", label: "Ethereum Sepolia" },
  { id: "Base_Sepolia", label: "Base Sepolia" },
  { id: "Arbitrum_Sepolia", label: "Arbitrum Sepolia" },
  { id: "Optimism_Sepolia", label: "Optimism Sepolia" },
  { id: "Avalanche_Fuji", label: "Avalanche Fuji" },
  { id: "Polygon_Amoy_Testnet", label: "Polygon Amoy" },
] as const;

export type AppKitFundingChain = (typeof APP_KIT_FUNDING_CHAINS)[number]["id"];

let kit: AppKit | null = null;

function getKit() {
  kit ??= new AppKit();
  return kit;
}

async function getAdapter(connector: Connector) {
  const provider = (await connector.getProvider()) as EIP1193Provider;
  if (!provider?.request) throw new Error("This wallet does not expose an EIP-1193 provider.");
  return createViemAdapterFromProvider({ provider });
}

export async function bridgeUsdcToArc(input: {
  connector: Connector;
  sourceChain: AppKitFundingChain;
  amount: string;
}): Promise<BridgeResult> {
  const adapter = await getAdapter(input.connector);
  const appKit = getKit();
  let result = await appKit.bridge({
    from: { adapter, chain: input.sourceChain },
    to: { adapter, chain: "Arc_Testnet" },
    amount: input.amount,
    token: "USDC",
  });

  if (result.state === "error") {
    result = await appKit.retryBridge(result, { from: adapter, to: adapter });
  }
  return result;
}

export function bridgeExplorerUrls(result: BridgeResult) {
  return result.steps.map((step) => step.explorerUrl).filter((url): url is string => Boolean(url));
}
