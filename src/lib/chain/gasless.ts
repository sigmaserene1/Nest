// Client side of Arc's EIP-3009 gasless transfer flow: the user signs an
// authorization, the sponsor relayer broadcasts it and pays the USDC gas.

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { useServerFn } from "@tanstack/react-start";
import { getGaslessStatus, relayGaslessTransfer } from "@/lib/gasless.functions";
import { arcChainFor, ARC_USDC_ADDRESS, useArcEnvironment } from "@/lib/arc-network";

const AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Whether sponsored (gas-free) payments can be offered right now. */
export function useGaslessStatus() {
  const environment = useArcEnvironment();
  const status = useServerFn(getGaslessStatus);
  const query = useQuery({
    queryKey: ["gasless-status", environment],
    queryFn: () => status({ data: { environment } }),
    staleTime: 60_000,
    retry: false,
  });
  return {
    available: query.data?.available === true,
    sponsor: query.data && "sponsor" in query.data ? query.data.sponsor : undefined,
    isLoading: query.isLoading,
  };
}

export function useGaslessTransfer() {
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const relay = useServerFn(relayGaslessTransfer);

  /** Signs and relays a USDC transfer. Returns the Arc transaction hash. */
  return useCallback(
    async (to: `0x${string}`, amount: number, onStep?: (label: string) => void) => {
      if (!walletClient || !address) throw new Error("Connect your wallet first.");
      const value = parseUnits(amount.toFixed(6), 6);
      const now = Math.floor(Date.now() / 1000);
      const validAfter = 0n;
      const validBefore = BigInt(now + 60 * 30);
      const nonce = randomNonce();

      onStep?.("Sign to authorize…");
      const signature = await walletClient.signTypedData({
        account: address,
        domain: {
          name: "USDC",
          version: "2",
          chainId: arcChain.id,
          verifyingContract: ARC_USDC_ADDRESS,
        },
        types: AUTHORIZATION_TYPES,
        primaryType: "TransferWithAuthorization",
        message: { from: address, to, value, validAfter, validBefore, nonce },
      });

      onStep?.("Sending USDC…");
      const result = await relay({
        data: {
          environment,
          from: address,
          to,
          value: value.toString(),
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
          signature,
        },
      });
      return result.hash;
    },
    [walletClient, address, arcChain.id, environment, relay],
  );
}
