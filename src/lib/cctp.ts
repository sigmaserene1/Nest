import type { Address, Hex } from "viem";

export type CctpChain = {
  id: string;
  name: string;
  domain: number;
  chainId: number;
  usdc: Address;
  tokenMessengerV2: Address;
  messageTransmitterV2: Address;
  explorer: string;
  eta: string;
};

const TOKEN_MESSENGER_V2 = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as Address;

const MESSAGE_TRANSMITTER_V2 = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as Address;

export const ARC_DOMAIN = 26;

export const ARC_CHAIN_ID = 5042002;

export const ARC_RPC_URL = "https://rpc.testnet.arc.network";

export const ARC_USDC = "0x3600000000000000000000000000000000000000" as Address;

export const ARC_CCTP_CONTRACTS = {
  tokenMessengerV2: TOKEN_MESSENGER_V2,
  messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
  usdc: ARC_USDC,
} as const;

/**
 * Circle CCTP v2 testnet.
 *
 * All supported EVM testnets use the same CCTP V2
 * TokenMessengerV2 and MessageTransmitterV2 addresses.
 */
export const CCTP_SOURCES: CctpChain[] = [
  {
    id: "ethereum",
    name: "Ethereum Sepolia",
    domain: 0,
    chainId: 11155111,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://sepolia.etherscan.io",
    eta: "~13–19 min",
  },

  {
    id: "avalanche",
    name: "Avalanche Fuji",
    domain: 1,
    chainId: 43113,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://testnet.snowtrace.io",
    eta: "~8 sec+",
  },

  {
    id: "optimism",
    name: "OP Sepolia",
    domain: 2,
    chainId: 11155420,
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://sepolia-optimism.etherscan.io",
    eta: "~13–19 min",
  },

  {
    id: "arbitrum",
    name: "Arbitrum Sepolia",
    domain: 3,
    chainId: 421614,
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://sepolia.arbiscan.io",
    eta: "~13–19 min",
  },

  {
    id: "base",
    name: "Base Sepolia",
    domain: 6,
    chainId: 84532,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://sepolia.basescan.org",
    eta: "~13–19 min",
  },

  {
    id: "polygon",
    name: "Polygon Amoy",
    domain: 7,
    chainId: 80002,
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    tokenMessengerV2: TOKEN_MESSENGER_V2,
    messageTransmitterV2: MESSAGE_TRANSMITTER_V2,
    explorer: "https://amoy.polygonscan.com",
    eta: "~8 sec+",
  },
];

export const IRIS_SANDBOX_URL = "https://iris-api-sandbox.circle.com";

export const CCTP_MESSAGE_API = `${IRIS_SANDBOX_URL}/v2/messages`;

export const CCTP_FEE_API = `${IRIS_SANDBOX_URL}/v2/burn/USDC/fees`;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

export const TOKEN_MESSENGER_V2_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "destinationDomain",
        type: "uint32",
      },
      {
        name: "mintRecipient",
        type: "bytes32",
      },
      {
        name: "burnToken",
        type: "address",
      },
      {
        name: "destinationCaller",
        type: "bytes32",
      },
      {
        name: "maxFee",
        type: "uint256",
      },
      {
        name: "minFinalityThreshold",
        type: "uint32",
      },
    ],
    outputs: [
      {
        name: "nonce",
        type: "uint64",
      },
    ],
  },
] as const;

export const MESSAGE_TRANSMITTER_V2_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "message",
        type: "bytes",
      },
      {
        name: "attestation",
        type: "bytes",
      },
    ],
    outputs: [
      {
        name: "success",
        type: "bool",
      },
    ],
  },
] as const;

/**
 * CCTP V2:
 *
 * 1000 = Fast / confirmed
 * 2000 = Standard / finalized
 */
export const FINALITY_FAST = 1000;

export const FINALITY_STANDARD = 2000;

/**
 * bytes32(0)
 *
 * Allows any address to call receiveMessage on Arc.
 */
export const ANY_DESTINATION_CALLER = `0x${"00".repeat(32)}` as Hex;

/**
 * Convert an EVM address into the bytes32 representation
 * required by CCTP.
 */
export function addressToBytes32(address: Address): Hex {
  return `0x${address.slice(2).padStart(64, "0")}` as Hex;
}

/**
 * Get the current Circle CCTP fee.
 *
 * Circle returns fee rates for the selected source/destination pair.
 */
export async function getCctpFee(
  sourceDomain: number,
  destinationDomain: number,
  amountUnits: bigint,
): Promise<bigint> {
  if (amountUnits <= 0n) {
    return 0n;
  }

  const response = await fetch(`${CCTP_FEE_API}/${sourceDomain}/${destinationDomain}`);

  if (!response.ok) {
    throw new Error(`Unable to retrieve CCTP fee (${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Circle returned no CCTP fee quote.");
  }

  const fast = data.find((item: any) => Number(item.finalityThreshold) === FINALITY_FAST) ?? data[0];

  const minimumFee = Number(fast.minimumFee ?? 0);

  if (!Number.isFinite(minimumFee)) {
    throw new Error("Invalid CCTP fee returned by Circle.");
  }

  /**
   * Circle's minimumFee is represented as basis points.
   *
   * Convert the percentage into USDC subunits.
   */
  const protocolFee = (amountUnits * BigInt(Math.round(minimumFee * 100))) / 1_000_000n;

  /**
   * Add a 20% safety buffer as recommended by Circle.
   */
  return (protocolFee * 120n) / 100n;
}

/**
 * Fetch CCTP message + attestation for a source burn transaction.
 */
export async function getAttestation(
  sourceDomain: number,
  transactionHash: Hex,
): Promise<{
  status: "pending" | "complete";
  message?: Hex;
  attestation?: Hex;
}> {
  const response = await fetch(`${CCTP_MESSAGE_API}/${sourceDomain}?transactionHash=${transactionHash}`);

  /**
   * Circle returns 404 until the burn message
   * has been indexed. That is a pending state,
   * not a failure.
   */
  if (response.status === 404) {
    return {
      status: "pending",
    };
  }

  if (!response.ok) {
    throw new Error(`Circle attestation API returned ${response.status}`);
  }

  const data = await response.json();

  const message = data?.messages?.[0];

  if (!message) {
    return {
      status: "pending",
    };
  }

  if (message.status !== "complete") {
    return {
      status: "pending",
    };
  }

  if (!message.message || !message.attestation) {
    return {
      status: "pending",
    };
  }

  return {
    status: "complete",
    message: message.message as Hex,
    attestation: message.attestation as Hex,
  };
}

/**
 * Poll Circle until the message becomes complete.
 */
export async function waitForAttestation(
  sourceDomain: number,
  transactionHash: Hex,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
    onPending?: () => void;
  },
) {
  const timeoutMs = options?.timeoutMs ?? 30 * 60 * 1000;

  const intervalMs = options?.intervalMs ?? 5_000;

  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const result = await getAttestation(sourceDomain, transactionHash);

    if (result.status === "complete" && result.message && result.attestation) {
      return result;
    }

    options?.onPending?.();

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("CCTP attestation timed out. The burn succeeded, but Circle has not returned the attestation yet.");
}

export type RouteStep = {
  title: string;
  detail: string;
};

export function buildRoute(source: CctpChain, amount: string): RouteStep[] {
  return [
    {
      title: `Approve native USDC`,
      detail: `Approve TokenMessengerV2 on ${source.name} to spend ${amount} USDC.`,
    },

    {
      title: `Burn on ${source.name}`,
      detail: "CCTP V2 depositForBurn burns native USDC and emits the cross-chain message.",
    },

    {
      title: "Circle attestation",
      detail: "Nest polls Circle's CCTP attestation service until the source burn is attested.",
    },

    {
      title: "Mint on Arc",
      detail:
        "MessageTransmitterV2.receiveMessage verifies the attestation and mints native USDC directly to your Arc wallet.",
    },

    {
      title: "Settle your Nest balance",
      detail: "The USDC arriving on Arc becomes available for your household settlement.",
    },
  ];
}

export const CCTP_STATUS =
  "CCTP v2 uses Circle's burn-and-mint model. Native USDC is burned on the selected source chain, Circle attests the message, and MessageTransmitterV2 mints native USDC on Arc. No wrapped USDC is involved.";

export function formatUsdc(units: bigint): string {
  const whole = units / 1_000_000n;
  const fraction = (units % 1_000_000n).toString().padStart(6, "0").slice(0, 2);

  return `${whole}.${fraction}`;
}
