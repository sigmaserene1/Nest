// Gasless USDC payments on Arc via an EIP-3009 relayer.
// The user signs a `transferWithAuthorization` message offchain; this server
// function broadcasts it from a sponsor EOA that pays the USDC gas.
// Reference: https://docs.arc.io/integrate/relayers-and-paymasters/eip-3009-relayer

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, createWalletClient, http, formatUnits, parseSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcChainFor, ARC_USDC_ADDRESS, type ArcEnvironment } from "@/lib/arc-network";

const TRANSFER_WITH_AUTHORIZATION_ABI = [
  {
    type: "function",
    name: "transferWithAuthorization",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const hex = (len: number) => z.string().regex(new RegExp(`^0x[a-fA-F0-9]{${len}}$`));

const environmentSchema = z.enum(["testnet", "mainnet"]);

function relayerAccount() {
  const key = (process.env["DEPLOYER_PRIVATE_KEY"] ?? "").trim();
  if (!key) return null;
  const normalized = (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) return null;
  return privateKeyToAccount(normalized);
}

function clients(environment: ArcEnvironment) {
  const chain = arcChainFor(environment);
  const transport = http(chain.rpcUrls.default.http[0]);
  return {
    chain,
    publicClient: createPublicClient({ chain, transport }),
    transport,
  };
}

/** Reports whether gas sponsorship is live and funded for the given network. */
export const getGaslessStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ environment: environmentSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    const account = relayerAccount();
    if (!account) return { available: false as const, reason: "not-configured" as const };
    try {
      const { publicClient } = clients(data.environment);
      const balance = await publicClient.getBalance({ address: account.address });
      // Arc native USDC uses 18 decimals for gas accounting.
      const usdc = Number(formatUnits(balance, 18));
      return {
        available: usdc > 0.05,
        reason: usdc > 0.05 ? ("ok" as const) : ("unfunded" as const),
        sponsor: account.address,
        balance: usdc,
      };
    } catch {
      return { available: false as const, reason: "rpc-unavailable" as const };
    }
  });

/** Broadcasts a user-signed USDC transfer; the sponsor wallet pays the gas. */
export const relayGaslessTransfer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        environment: environmentSchema,
        from: hex(40),
        to: hex(40),
        value: z.string().regex(/^\d+$/),
        validAfter: z.string().regex(/^\d+$/),
        validBefore: z.string().regex(/^\d+$/),
        nonce: hex(64),
        signature: hex(130),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const account = relayerAccount();
    if (!account) throw new Error("Gas sponsorship is not configured.");

    const { chain, publicClient, transport } = clients(data.environment);
    const walletClient = createWalletClient({ account, chain, transport });
    const { v, r, s } = parseSignature(data.signature as `0x${string}`);

    const args = [
      data.from as `0x${string}`,
      data.to as `0x${string}`,
      BigInt(data.value),
      BigInt(data.validAfter),
      BigInt(data.validBefore),
      data.nonce as `0x${string}`,
      Number(v),
      r,
      s,
    ] as const;

    // Simulate first so a bad authorization fails before the sponsor pays gas.
    const { request } = await publicClient.simulateContract({
      address: ARC_USDC_ADDRESS,
      abi: TRANSFER_WITH_AUTHORIZATION_ABI,
      functionName: "transferWithAuthorization",
      args,
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Sponsored transfer reverted onchain.");
    return { hash, sponsor: account.address };
  });
