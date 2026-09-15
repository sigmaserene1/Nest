import type { Address } from "viem";
import { CCTP_CHAINS } from "@/lib/cctp";

export type BridgeTokenId = "usdc" | "eurc";

export type BridgeToken = {
  id: BridgeTokenId;
  symbol: string;
  name: string;
  decimals: number;
  /** Circle's CCTP burn token identifier used by the fee/attestation API. */
  cctpSymbol: string;
  /** Chain id -> token contract address. Empty means the chain has no deployment. */
  addresses: Record<string, Address>;
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

export const BRIDGE_TOKENS: BridgeToken[] = [
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    cctpSymbol: "USDC",
    addresses: usdcAddresses,
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
      "Circle's testnet transfer service does not accept EURC burns yet, so EURC cannot be bridged from here.",
  },
];

export function bridgeToken(id: BridgeTokenId): BridgeToken {
  return BRIDGE_TOKENS.find((token) => token.id === id) ?? BRIDGE_TOKENS[0];
}

export function tokenAddressFor(token: BridgeToken, chainId: string): Address | undefined {
  return token.addresses[chainId];
}
