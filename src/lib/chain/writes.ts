// Every state-changing action in Nest is a real Arc Testnet transaction.
// This hook wraps deployment, room management, expenses and USDC settlement.

import { useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import {
  EXPENSE_MANAGER_ABI,
  EXPENSE_MANAGER_BYTECODE,
} from "@/contracts/expense-manager-artifact";
import { arcTestnet, ERC20_ABI, USDC_ADDRESS } from "@/lib/wagmi";
import { useNestChain } from "./nest-chain";

export type TxStep = (label: string) => void;

export function toUnits(amount: number): bigint {
  return parseUnits(amount.toFixed(6), 6);
}

export function useNestWrites() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { contractAddress, roomId, refresh } = useNestChain();

  const requireEnv = useCallback(() => {
    if (!walletClient || !address) throw new Error("Connect your wallet first.");
    if (!publicClient) throw new Error("Arc Testnet is unavailable right now.");
    return { walletClient, address, publicClient };
  }, [walletClient, address, publicClient]);

  const requireContract = useCallback(() => {
    if (!contractAddress) throw new Error("No Nest contract configured yet.");
    return contractAddress;
  }, [contractAddress]);

  const send = useCallback(
    async (functionName: string, args: readonly unknown[]) => {
      const { walletClient, address, publicClient } = requireEnv();
      const contract = requireContract();
      const hash = await walletClient.writeContract({
        address: contract,
        abi: EXPENSE_MANAGER_ABI,
        functionName: functionName as never,
        args: args as never,
        account: address,
        chain: arcTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted onchain.");
      await refresh();
      return hash;
    },
    [requireEnv, requireContract, refresh],
  );

  /** Deploys a fresh ExpenseManager and returns its address. */
  const deployContract = useCallback(async () => {
    const { walletClient, address, publicClient } = requireEnv();
    const hash = await walletClient.deployContract({
      abi: EXPENSE_MANAGER_ABI,
      bytecode: EXPENSE_MANAGER_BYTECODE,
      args: [USDC_ADDRESS],
      account: address,
      chain: arcTestnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success" || !receipt.contractAddress)
      throw new Error("Deployment failed.");
    return receipt.contractAddress;
  }, [requireEnv]);

  /** Approves the ExpenseManager to move `needed` USDC base units, when the allowance is short. */
  const ensureAllowanceUnits = useCallback(
    async (needed: bigint, onStep?: TxStep) => {
      const { walletClient, address, publicClient } = requireEnv();
      const contract = requireContract();
      const current = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contract],
      })) as bigint;
      if (current >= needed) return;
      onStep?.("Approving USDC…");
      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contract, needed],
        account: address,
        chain: arcTestnet,
      });
      await publicClient.waitForTransactionReceipt({ hash });
    },
    [requireEnv, requireContract],
  );

  const ensureAllowance = useCallback(
    (amount: number, onStep?: TxStep) => ensureAllowanceUnits(toUnits(amount), onStep),
    [ensureAllowanceUnits],
  );


  const createRoom = useCallback((name: string) => send("createRoom", [name]), [send]);
  const joinRoom = useCallback((id: number) => send("joinRoom", [BigInt(id)]), [send]);
  const inviteMember = useCallback(
    (member: `0x${string}`) => {
      if (!roomId) throw new Error("No active home.");
      return send("inviteMember", [BigInt(roomId), member]);
    },
    [send, roomId],
  );
  const claimName = useCallback((name: string) => send("setDisplayName", [name]), [send]);

  const addExpense = useCallback(
    (input: { title: string; category: string; amount: number; participants: string[] }) => {
      if (!roomId) throw new Error("No active home.");
      const total = toUnits(input.amount);
      const n = BigInt(input.participants.length);
      const base = total / n;
      const shares = input.participants.map((_, i) => (i === 0 ? base + (total - base * n) : base));
      return send("addExpense", [
        BigInt(roomId),
        input.participants as `0x${string}`[],
        shares,
        input.category,
        input.title,
        total,
      ]);
    },
    [send, roomId],
  );

  /** Settles every open share the caller owes to `to` in the active home. */
  const settleWith = useCallback(
    async (to: `0x${string}`, amount: number, onStep?: TxStep) => {
      if (!roomId) throw new Error("No active home.");
      const { address, publicClient } = requireEnv();
      const contract = requireContract();
      // settleWith clears *every* open share, so the contract moves the exact
      // base-unit total from owedBetween — never the rounded UI number.
      let needed: bigint;
      try {
        needed = (await publicClient.readContract({
          address: contract,
          abi: EXPENSE_MANAGER_ABI,
          functionName: "owedBetween",
          args: [BigInt(roomId), address, to],
        })) as bigint;
      } catch {
        needed = toUnits(amount);
      }
      if (needed <= 0n) needed = toUnits(amount);
      if (needed <= 0n) throw new Error("Nothing to settle with this roommate.");
      await ensureAllowanceUnits(needed, onStep);
      onStep?.("Sending USDC…");
      return send("settleWith", [BigInt(roomId), to]);
    },
    [send, roomId, ensureAllowanceUnits, requireEnv, requireContract],
  );



  /** Settles one specific expense share. */
  const settleSplit = useCallback(
    async (expenseId: string, amount: number, onStep?: TxStep) => {
      await ensureAllowance(amount, onStep);
      onStep?.("Sending USDC…");
      return send("settleSplit", [BigInt(expenseId)]);
    },
    [send, ensureAllowance],
  );

  /** Arbitrary USDC transfer, logged onchain in the room's activity feed. */
  const directTransfer = useCallback(
    async (to: `0x${string}`, amount: number, note: string, onStep?: TxStep) => {
      await ensureAllowance(amount, onStep);
      onStep?.("Sending USDC…");
      return send("directTransfer", [BigInt(roomId ?? 0), to, toUnits(amount), note]);
    },
    [send, roomId, ensureAllowance],
  );

  return {
    deployContract,
    createRoom,
    joinRoom,
    inviteMember,
    claimName,
    addExpense,
    settleWith,
    settleSplit,
    directTransfer,
    ensureAllowance,
  };
}
