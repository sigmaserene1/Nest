// Cross-chain USDC deposits into Nest via Circle's CCTP v2.
//
// CCTP burns native USDC on the source chain, Circle's Iris attestation service
// signs the burn, and MessageTransmitterV2 mints it 1:1 on Arc. Nest uses that
// to let a roommate pay their share from whichever chain their USDC already
// lives on, then settles the net balance natively on Arc.
//
// Reference: https://docs.arc.io/integrate/exchanges/cctp-bridging

export type CctpChain = {
  id: string;
  name: string;
  /** Circle CCTP domain id. */
  domain: number;
  chainId: number;
  color: string;
  /** Typical end-to-end time for a CCTP v2 fast transfer. */
  eta: string;
};

export const CCTP_SOURCES: CctpChain[] = [
  { id: "ethereum", name: "Ethereum Sepolia", domain: 0, chainId: 11155111, color: "#627EEA", eta: "~15 min" },
  { id: "arbitrum", name: "Arbitrum Sepolia", domain: 3, chainId: 421614, color: "#12AAFF", eta: "~1 min" },
  { id: "base", name: "Base Sepolia", domain: 6, chainId: 84532, color: "#0052FF", eta: "~1 min" },
  { id: "optimism", name: "OP Sepolia", domain: 2, chainId: 11155420, color: "#FF0420", eta: "~1 min" },
  { id: "polygon", name: "Polygon Amoy", domain: 7, chainId: 80002, color: "#8247E5", eta: "~2 min" },
  { id: "avalanche", name: "Avalanche Fuji", domain: 1, chainId: 43113, color: "#E84142", eta: "~1 min" },
];

/** Arc's Circle CCTP domain (docs.arc.io). */
export const ARC_DOMAIN = 26;

/** CCTP v2 contracts on Arc Testnet. */
export const ARC_CCTP_CONTRACTS = {
  tokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  messageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  usdc: "0x3600000000000000000000000000000000000000",
} as const;

/** Circle's Iris attestation API (v2). */
export const IRIS_ATTESTATION_API = "https://iris-api.circle.com/v2/attestations";

/** `MessageSent(bytes)` topic emitted by MessageTransmitter on burn. */
export const MESSAGE_SENT_TOPIC =
  "0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0";

export const ARC_RPC_URL = "https://rpc.testnet.arc.io";

export type RouteStep = { title: string; detail: string };

export function buildRoute(source: CctpChain, amount: number): RouteStep[] {
  const amt = amount > 0 ? `${amount.toFixed(2)} USDC` : "your USDC";
  return [
    {
      title: `Approve & burn on ${source.name}`,
      detail: `approve() the source TokenMessengerV2, then depositForBurn(${amt}, destinationDomain ${ARC_DOMAIN}, mintRecipient, USDC).`,
    },
    {
      title: "Circle attestation (Iris)",
      detail: `Hash the MessageSent log and poll ${IRIS_ATTESTATION_API}/<messageHash> until status is complete (${source.eta} for this route).`,
    },
    {
      title: "Mint natively on Arc",
      detail: `receiveMessage(message, attestation) on MessageTransmitterV2 ${ARC_CCTP_CONTRACTS.messageTransmitterV2.slice(0, 8)}… mints ${amt} of native USDC to your Arc wallet.`,
    },
    {
      title: "Credit your Nest share",
      detail: "The minted USDC settles your open debts in the active home.",
    },
  ];
}

export const CCTP_STATUS =
  "Route planning is live and uses Arc's published CCTP v2 domain (26) and contracts. In-app burn-and-mint execution is next — today you can run the same route from any CCTP-enabled wallet and the minted USDC lands on your Arc address.";

export function estimateFee(amount: number): number {
  // CCTP v2 fast-transfer fee is a small bps cut of the transferred amount.
  return Math.max(amount * 0.0001, 0.01);
}
