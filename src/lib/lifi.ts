import type { Address, Hex } from "viem";

const LIFI_API_URL = "https://li.quest/v1";
const LIFI_INTEGRATOR =
  String(import.meta.env.VITE_LIFI_INTEGRATOR ?? "nestarc").trim() || "nestarc";

export const LIFI_DEFAULT_SLIPPAGE = 0.005;
export const LIFI_CCTP_BRIDGES = ["cctp", "celercirclefast", "celercircle"] as const;

export type LifiChain = {
  id: number;
  key: string;
  name: string;
  chainType?: string;
  mainnet?: boolean;
  logoURI?: string;
  nativeToken?: LifiToken;
  metamask?: {
    chainId?: string;
    chainName?: string;
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
};

export type LifiToken = {
  address: Address;
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  coinKey?: string;
  logoURI?: string;
  priceUSD?: string;
};

export type LifiTransactionRequest = {
  chainId?: number;
  from?: Address;
  to: Address;
  data?: Hex;
  value?: string;
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export type LifiQuote = {
  id: string;
  type?: string;
  tool: string;
  toolDetails?: {
    name?: string;
    logoURI?: string;
  };
  action: {
    fromChainId: number;
    toChainId: number;
    fromAmount: string;
    fromToken: LifiToken;
    toToken: LifiToken;
  };
  estimate: {
    approvalAddress?: Address;
    fromAmount?: string;
    toAmount?: string;
    toAmountMin?: string;
    executionDuration?: number;
    feeCosts?: LifiCost[];
    gasCosts?: LifiCost[];
  };
  includedSteps?: Array<{
    tool?: string;
    estimate?: {
      approvalAddress?: Address;
      feeCosts?: LifiCost[];
      gasCosts?: LifiCost[];
    };
  }>;
  transactionRequest?: LifiTransactionRequest;
};

export type LifiCost = {
  name?: string;
  description?: string;
  amount?: string;
  amountUSD?: string;
  token?: LifiToken;
};

export type LifiStatus = {
  status: "NOT_FOUND" | "INVALID" | "PENDING" | "DONE" | "FAILED";
  substatus?: string;
  substatusMessage?: string;
  lifiExplorerLink?: string;
  sending?: {
    txHash?: Hex;
    txLink?: string;
  };
  receiving?: {
    txHash?: Hex;
    txLink?: string;
  };
};

export type LifiQuoteParams = {
  fromChain: number;
  toChain: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: string;
  fromAddress: Address;
  toAddress: Address;
  slippage?: number;
};

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.toString();
}

async function lifiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const query = params ? toQuery(params) : "";
  const response = await fetch(`${LIFI_API_URL}${path}${query ? `?${query}` : ""}`, {
    headers: {
      Accept: "application/json",
      "x-lifi-integrator": LIFI_INTEGRATOR,
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.message || body?.error || "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(detail || `LI.FI API returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getLifiChains(): Promise<LifiChain[]> {
  const data = await lifiFetch<{ chains?: LifiChain[] }>("/chains", {
    chainTypes: "EVM",
  });

  return (data.chains ?? [])
    .filter((chain) => chain.id && chain.name && chain.chainType !== "SVM")
    .sort((a, b) => {
      if (a.mainnet !== b.mainnet) return a.mainnet ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getLifiTokens(chainIds: number[]): Promise<Record<number, LifiToken[]>> {
  if (chainIds.length === 0) return {};
  const data = await lifiFetch<{ tokens?: Record<string, LifiToken[]> }>("/tokens", {
    chains: Array.from(new Set(chainIds)).join(","),
  });

  const result: Record<number, LifiToken[]> = {};
  for (const [chainId, tokens] of Object.entries(data.tokens ?? {})) {
    result[Number(chainId)] = tokens;
  }
  return result;
}

export async function getLifiQuote(params: LifiQuoteParams): Promise<LifiQuote> {
  const quoteParams = {
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    slippage: params.slippage ?? LIFI_DEFAULT_SLIPPAGE,
    integrator: LIFI_INTEGRATOR,
  };

  try {
    return assertExecutableQuote(
      await lifiFetch<LifiQuote>("/quote", {
        ...quoteParams,
        allowBridges: LIFI_CCTP_BRIDGES.join(","),
      }),
    );
  } catch {
    return assertExecutableQuote(
      await lifiFetch<LifiQuote>("/quote", {
        ...quoteParams,
        preferBridges: LIFI_CCTP_BRIDGES.join(","),
      }),
    );
  }
}

export async function getLifiStatus(params: {
  bridge: string;
  fromChain: number;
  toChain: number;
  txHash: Hex;
}): Promise<LifiStatus> {
  return lifiFetch<LifiStatus>("/status", {
    bridge: params.bridge,
    fromChain: params.fromChain,
    toChain: params.toChain,
    txHash: params.txHash,
  });
}

export async function waitForLifiTransfer(
  params: {
    bridge: string;
    fromChain: number;
    toChain: number;
    txHash: Hex;
  },
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
    onPending?: (status: LifiStatus) => void;
  },
): Promise<LifiStatus> {
  const timeoutMs = options?.timeoutMs ?? 45 * 60 * 1000;
  const intervalMs = options?.intervalMs ?? 6_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    let status: LifiStatus;
    try {
      status = await getLifiStatus(params);
    } catch (error) {
      options?.onPending?.({
        status: "PENDING",
        substatusMessage: error instanceof Error ? error.message : "Waiting for LI.FI status.",
      });
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      continue;
    }

    if (status.status === "DONE") return status;
    if (status.status === "FAILED" || status.status === "INVALID") {
      throw new Error(
        status.substatusMessage || status.substatus || "LI.FI marked this transfer as failed.",
      );
    }

    options?.onPending?.(status);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    "LI.FI transfer tracking timed out. Check the source transaction in the explorer.",
  );
}

export function getLifiApprovalAddress(quote: LifiQuote): Address | undefined {
  return (
    quote.estimate.approvalAddress ??
    quote.includedSteps?.find((step) => step.estimate?.approvalAddress)?.estimate?.approvalAddress
  );
}

function assertExecutableQuote(quote: LifiQuote): LifiQuote {
  if (!quote.transactionRequest?.to || !quote.transactionRequest.data) {
    throw new Error("LI.FI returned a route without an executable transaction.");
  }

  if (quote.transactionRequest.chainId && quote.transactionRequest.chainId !== quote.action.fromChainId) {
    throw new Error("LI.FI returned a transaction for a different source chain.");
  }

  return quote;
}

export function pickUsdcToken(tokens: LifiToken[] | undefined): LifiToken | undefined {
  const candidates = (tokens ?? []).filter((token) => token.symbol.toUpperCase() === "USDC");
  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => tokenScore(b) - tokenScore(a))[0];
}

function tokenScore(token: LifiToken) {
  let score = 0;
  const name = token.name.toLowerCase();
  const coinKey = token.coinKey?.toUpperCase();
  if (coinKey === "USDC") score += 6;
  if (name === "usd coin") score += 4;
  if (name.includes("native")) score += 2;
  if (name.includes("bridged") || name.includes("wormhole") || token.symbol.includes(".")) {
    score -= 3;
  }
  return score;
}

export function lifiExplorerFor(chain: LifiChain) {
  return chain.metamask?.blockExplorerUrls?.[0] ?? "";
}

export function lifiToolName(quote: LifiQuote) {
  return quote.toolDetails?.name || quote.tool || "LI.FI";
}

export function isCircleNativeUsdcRoute(quote: LifiQuote) {
  const toolNames = [
    quote.tool,
    quote.toolDetails?.name,
    ...(quote.includedSteps?.flatMap((step) => [step.tool]) ?? []),
  ]
    .filter(Boolean)
    .map((name) => String(name).toLowerCase());

  return toolNames.some(
    (name) =>
      LIFI_CCTP_BRIDGES.some((bridge) => name === bridge) ||
      name.includes("cctp") ||
      name.includes("circle"),
  );
}

export function lifiCostUsd(quote: LifiQuote): number {
  const allCosts = [
    ...(quote.estimate.feeCosts ?? []),
    ...(quote.estimate.gasCosts ?? []),
    ...(quote.includedSteps?.flatMap((step) => [
      ...(step.estimate?.feeCosts ?? []),
      ...(step.estimate?.gasCosts ?? []),
    ]) ?? []),
  ];

  return allCosts.reduce((total, cost) => {
    const value = Number(cost.amountUSD ?? 0);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}
