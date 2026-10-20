import type { Address } from "viem";
import type { ArcEnvironment } from "@/lib/arc-network";
import { CCTP_CHAINS, CCTP_MAINNET_CHAINS } from "@/lib/cctp";

export type BridgeTokenId = "usdc" | "eurc";

export type BridgeToken = {
  id: BridgeTokenId;
  symbol: string;
  name: string;
  decimals: number;
  /** Circle's CCTP burn token identifier used by the fee/attestation API. */
  cctpSymbol: string;
  /** Legacy Testnet lookup kept for existing callers. */
  addresses: Record<string, Address>;
  /** Chain id -> token contract address for each Arc environment. */
  addressesByEnvironment?: Record<ArcEnvironment, Record<string, Address>>;
  /**
   * Circle's CCTP v2 testnet burn service currently accepts USDC only.
   * EURC on Arc exists as a token, but there is no cross-domain burn route yet.
   */
  transferable: boolean;
  unavailableReason?: string;
};

const usdcAddresses = Object.fromEntries(
  CCTP_CHAINS.map((chain) => [chain.id, chain.usdc]),
) as Record<string, Address>;
const mainnetUsdcAddresses = Object.fromEntries(
  CCTP_MAINNET_CHAINS.map((chain) => [chain.id, chain.usdc]),
) as Record<string, Address>;

export const BRIDGE_TOKENS: BridgeToken[] = [
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    cctpSymbol: "USDC",
    addresses: usdcAddresses,
    addressesByEnvironment: {
      testnet: usdcAddresses,
      mainnet: mainnetUsdcAddresses,
    },
    transferable: true,
  },
  {
    id: "eurc",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    cctpSymbol: "EURC",
    addresses: {
      arc: "0x89b50855aa3be2f677cd6303cec089b5f319d72a",
    },
    transferable: false,
    unavailableReason:
      "Circle's transfer service does not accept EURC burns in this flow yet, so EURC cannot be bridged from here.",
  },
];

export function bridgeToken(id: BridgeTokenId): BridgeToken {
  return BRIDGE_TOKENS.find((token) => token.id === id) ?? BRIDGE_TOKENS[0];
}

export function tokenAddressFor(
  token: BridgeToken,
  chainId: string,
  environment: ArcEnvironment = "testnet",
): Address | undefined {
  return token.addressesByEnvironment?.[environment]?.[chainId] ?? token.addresses[chainId];
}
