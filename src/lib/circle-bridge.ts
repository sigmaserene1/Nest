import type { Address } from "viem";

export type CircleBridgeChainName =
  | "Arc"
  | "Arc_Testnet"
  | "Ethereum"
  | "Ethereum_Sepolia"
  | "Base"
  | "Base_Sepolia"
  | "Avalanche"
  | "Avalanche_Fuji"
  | "Arbitrum"
  | "Arbitrum_Sepolia"
  | "Optimism"
  | "Optimism_Sepolia"
  | "Polygon"
  | "Polygon_Amoy_Testnet";

const CHAIN_NAME_BY_ID: Record<number, CircleBridgeChainName> = {
  5042: "Arc",
  5042002: "Arc_Testnet",
  1: "Ethereum",
  11155111: "Ethereum_Sepolia",
  8453: "Base",
  84532: "Base_Sepolia",
  43114: "Avalanche",
  43113: "Avalanche_Fuji",
  42161: "Arbitrum",
  421614: "Arbitrum_Sepolia",
  10: "Optimism",
  11155420: "Optimism_Sepolia",
  137: "Polygon",
  80002: "Polygon_Amoy_Testnet",
};

const MAINNET_CHAIN_IDS = new Set([1, 10, 137, 8453, 42161, 43114, 5042]);
const TESTNET_CHAIN_IDS = new Set([
  11155111,
  11155420,
  43113,
  84532,
  421614,
  80002,
  5042002,
]);

export type CircleBridgeStep = {
  name?: string;
  state?: string;
  txHash?: string;
  explorerUrl?: string;
  data?: {
    txHash?: string;
    explorerUrl?: string;
  };
  errorMessage?: string;
};

export type CircleBridgeResult = {
  state?: string;
  provider?: string;
  amount?: string;
  steps?: CircleBridgeStep[];
};

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function circleBridgeChainName(chainId: number) {
  return CHAIN_NAME_BY_ID[chainId] ?? null;
}

export function isCircleArcBridgeRoute(fromChainId: number, toChainId: number) {
  const sameNetwork =
    (MAINNET_CHAIN_IDS.has(fromChainId) && MAINNET_CHAIN_IDS.has(toChainId)) ||
    (TESTNET_CHAIN_IDS.has(fromChainId) && TESTNET_CHAIN_IDS.has(toChainId));

  return (
    fromChainId !== toChainId &&
    sameNetwork &&
    Boolean(CHAIN_NAME_BY_ID[fromChainId]) &&
    Boolean(CHAIN_NAME_BY_ID[toChainId]) &&
    (fromChainId === 5042 ||
      toChainId === 5042 ||
      fromChainId === 5042002 ||
      toChainId === 5042002)
  );
}

/** Backwards-compatible name for callers that only want the Testnet route. */
export function isCircleArcTestnetBridgeRoute(fromChainId: number, toChainId: number) {
  return (
    isCircleArcBridgeRoute(fromChainId, toChainId) &&
    (fromChainId === 5042002 || toChainId === 5042002)
  );
}

async function buildCircleBridge(provider: Eip1193Provider) {
  const [{ AppKit }, adapterPackage] = await Promise.all([
    import("@circle-fin/app-kit"),
    import("@circle-fin/adapter-viem-v2"),
  ]);

  const adapter = await adapterPackage.createViemAdapterFromProvider({
    provider: provider as Parameters<
      typeof adapterPackage.createViemAdapterFromProvider
    >[0]["provider"],
  });

  return { kit: new AppKit(), adapter };
}

export async function estimateCircleBridge(params: {
  provider: Eip1193Provider;
  fromChainId: number;
  toChainId: number;
  amount: string;
  recipient?: Address;
}) {
  const fromChain = circleBridgeChainName(params.fromChainId);
  const toChain = circleBridgeChainName(params.toChainId);
  if (!fromChain || !toChain) throw new Error("Circle App Kit does not support this Arc route.");

  const { kit, adapter } = await buildCircleBridge(params.provider);
  const to = params.recipient
    ? { adapter, chain: toChain, recipientAddress: params.recipient }
    : { adapter, chain: toChain };

  return kit.estimateBridge({
    from: { adapter, chain: fromChain },
    to,
    amount: params.amount,
    token: "USDC",
    config: {
      // SLOW avoids "Max fee must be less than amount" for small transfers on
      // Arc while keeping the bridge usable for modest balances.
      transferSpeed: "SLOW",
    },
  } as never);
}

export async function executeCircleBridge(params: {
  provider: Eip1193Provider;
  fromChainId: number;
  toChainId: number;
  amount: string;
  recipient?: Address;
  onProgress?: (label: string, txHash?: string) => void;
}): Promise<CircleBridgeResult> {
  const fromChain = circleBridgeChainName(params.fromChainId);
  const toChain = circleBridgeChainName(params.toChainId);
  if (!fromChain || !toChain) throw new Error("Circle App Kit does not support this Arc route.");

  const { kit, adapter } = await buildCircleBridge(params.provider);

  const events = [
    ["bridge.approve", "Approving USDC"],
    ["bridge.burn", "Burning USDC on source chain"],
    ["bridge.fetchAttestation", "Waiting for Circle attestation"],
    ["bridge.attestation", "Circle attestation received"],
    ["bridge.mint", "Minting USDC on destination chain"],
  ] as const;

  for (const [eventName, label] of events) {
    kit.on(eventName as never, ((event: unknown) => {
      const values = (event as { values?: { txHash?: string } })?.values;
      params.onProgress?.(label, values?.txHash);
    }) as never);
  }

  const to = params.recipient
    ? { adapter, chain: toChain, recipientAddress: params.recipient }
    : { adapter, chain: toChain };

  const result = await kit.bridge({
    from: { adapter, chain: fromChain },
    to,
    amount: params.amount,
    token: "USDC",
    config: {
      transferSpeed: "SLOW",
    },
  } as never);

  return result as CircleBridgeResult;
}

export function circleBridgeHashes(result: CircleBridgeResult) {
  const steps = result.steps ?? [];
  const hashOf = (names: string[]) =>
    steps.find((step) => names.includes(String(step.name ?? "").toLowerCase()))?.txHash ??
    steps.find((step) => names.includes(String(step.name ?? "").toLowerCase()))?.data?.txHash;

  return {
    sourceHash: hashOf(["burn"]) ?? hashOf(["approve"]),
    destinationHash: hashOf(["mint"]),
  };
}

export function circleBridgeExplorerUrl(result: CircleBridgeResult, stepName: "burn" | "mint") {
  const step = (result.steps ?? []).find(
    (item) => String(item.name ?? "").toLowerCase() === stepName,
  );
  return step?.explorerUrl ?? step?.data?.explorerUrl ?? "";
}
