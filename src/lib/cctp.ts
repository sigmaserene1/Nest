// Cross-chain USDC deposits into Nest via Circle's CCTP.
//
// CCTP burns native USDC on the source chain, Circle's attestation service
// signs the burn, and the message is minted 1:1 on the destination chain. Nest
// uses that to let a roommate pay their share from whichever chain their USDC
// already lives on, then settles the net balance natively on Arc.

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

export type RouteStep = { title: string; detail: string };

export function buildRoute(source: CctpChain, amount: number): RouteStep[] {
  const amt = amount > 0 ? `${amount.toFixed(2)} USDC` : "your USDC";
  return [
    {
      title: `Approve & burn on ${source.name}`,
      detail: `TokenMessenger burns ${amt} and emits a message for domain ${ARC_DOMAIN}.`,
    },
    {
      title: "Circle attestation",
      detail: `Circle's Iris service signs the burn (${source.eta} for this route).`,
    },
    {
      title: "Mint natively on Arc",
      detail: `MessageTransmitter mints ${amt} of native USDC to your Arc wallet.`,
    },
    {
      title: "Credit your Nest share",
      detail: "The minted USDC settles your open debts in the active home.",
    },
  ];
}

/** Arc's CCTP domain is not published for testnet yet. */
export const ARC_DOMAIN = "arc";

export const CCTP_STATUS =
  "Route planning is live. Burn-and-mint execution switches on as soon as Circle publishes Arc's CCTP domain for testnet — no app changes needed on your side.";

export function estimateFee(amount: number): number {
  // CCTP v2 fast-transfer fee is a small bps cut of the transferred amount.
  return Math.max(amount * 0.0001, 0.01);
}
