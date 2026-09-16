import { createClientOnlyFn } from "@tanstack/react-start";
import { getAccount } from "@wagmi/core";

import { wagmiConfig } from "@/lib/wagmi";
import { getArcEnvironment } from "@/lib/arc-network";

export type UnifiedSourceChain = "Base_Sepolia" | "Avalanche_Fuji";

export type UnifiedBalanceSnapshot = {
  totalConfirmedBalance?: string;
  totalPendingBalance?: string;
  breakdown?: Array<{
    totalConfirmed?: string;
    totalPending?: string;
    breakdown?: Array<{
      chain?: string;
      confirmedBalance?: string;
      pendingBalance?: string;
    }>;
  }>;
};

type UnifiedAction =
  | { type: "balances" }
  | { type: "deposit"; source: UnifiedSourceChain; amount: string }
  | { type: "spend"; amount: string; recipientAddress: `0x${string}` };

/**
 * Circle App Kit is intentionally loaded only in the browser.
 * Nest runs on Cloudflare Workers, while the connected EIP-1193 wallet and
 * Circle browser adapter belong exclusively to the hydrated client.
 */
const runUnifiedAction = createClientOnlyFn(async (action: UnifiedAction): Promise<unknown> => {
  if (getArcEnvironment() === "mainnet") {
    throw new Error(
      "Circle Gateway auto-funding is disabled on Arc Mainnet in this build. Switch Nest to Testnet to use Unified Balance.",
    );
  }

  const [{ AppKit }, chains, adapterPackage] = await Promise.all([
    import("@circle-fin/app-kit"),
    import("@circle-fin/app-kit/chains"),
    import("@circle-fin/adapter-viem-v2"),
  ]);

  const account = getAccount(wagmiConfig);
  if (!account.connector) {
    throw new Error("Connect your wallet first.");
  }

  const connector = account.connector as unknown as {
    getProvider: () => Promise<unknown>;
  };
  const provider = await connector.getProvider();
  if (!provider) {
    throw new Error("The connected wallet did not expose an EIP-1193 provider.");
  }

  const adapter = await adapterPackage.createViemAdapterFromProvider({
    provider: provider as Parameters<typeof adapterPackage.createViemAdapterFromProvider>[0]["provider"],
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: [chains.BaseSepolia, chains.AvalancheFuji, chains.ArcTestnet],
    },
  });

  const kit = new AppKit();

  if (action.type === "balances") {
    return kit.unifiedBalance.getBalances({
      sources: [{ adapter }],
      networkType: "testnet",
      includePending: true,
    });
  }

  if (action.type === "deposit") {
    const chain = adapterPackage.resolveChainIdentifier(action.source);
    if (chain.type !== "evm") {
      throw new Error(`${chain.name} is not an EVM chain.`);
    }

    await adapter.ensureChain(chain);

    return kit.unifiedBalance.deposit({
      from: { adapter, chain: action.source },
      amount: action.amount,
      token: "USDC",
    });
  }

  const params = {
    amount: action.amount,
    token: "USDC" as const,
    from: { adapter },
    to: {
      chain: "Arc_Testnet" as const,
      recipientAddress: action.recipientAddress,
      useForwarder: true,
    },
  };

  await kit.unifiedBalance.estimateSpend(params);
  return kit.unifiedBalance.spend(params);
});

export async function getUnifiedBalances(): Promise<UnifiedBalanceSnapshot> {
  const balances = await runUnifiedAction({ type: "balances" });
  return balances as UnifiedBalanceSnapshot;
}

export async function depositUnifiedUsdc(
  source: UnifiedSourceChain,
  amount: string,
): Promise<unknown> {
  return runUnifiedAction({ type: "deposit", source, amount });
}

export async function spendUnifiedUsdcToArc(
  amount: string,
  recipientAddress: `0x${string}`,
): Promise<unknown> {
  return runUnifiedAction({ type: "spend", amount, recipientAddress });
}
