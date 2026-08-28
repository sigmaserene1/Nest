// Every state-changing action in Nest is a real Arc Testnet transaction.
// This hook wraps deployment, room management, expenses and USDC settlement.

import { useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
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

  /** Approves the ExpenseManager to move `needed` USDC base units, when the allowance is short. */
  const ensureAllowanceUnits = useCallback(
    async (needed: bigint, onStep?: TxStep) => {
      const { walletClient, address, publicClient } = requireEnv();
      const contract = requireContract();
      const blockNumber = await publicClient.getBlockNumber();
      const current = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contract],
        blockNumber,
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
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("USDC approval failed onchain.");

      // Do not race the settlement against an RPC node that has seen the
      // approval receipt but is still serving an older allowance value.
      const confirmed = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contract],
        blockNumber: receipt.blockNumber,
      })) as bigint;
      if (confirmed < needed) {
        throw new Error("USDC approval has not finalized yet. Please try settlement again.");
      }
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
    async (to: `0x${string}`, _amount: number, onStep?: TxStep) => {
      if (!roomId) throw new Error("No active home.");
      const { walletClient, address, publicClient } = requireEnv();
      const contract = requireContract();
      // settleWith clears *every* open share, so the contract moves the exact
      // base-unit total from owedBetween — never the rounded UI number.
      const blockNumber = await publicClient.getBlockNumber();
      const needed = (await publicClient.readContract({
        address: contract,
        abi: EXPENSE_MANAGER_ABI,
        functionName: "owedBetween",
        args: [BigInt(roomId), address, to],
        blockNumber,
      })) as bigint;
      if (needed <= 0n) throw new Error("Nothing to settle with this roommate.");
      await ensureAllowanceUnits(needed, onStep);

      // Simulate against current onchain state after approval. This prevents a
      // doomed wallet transaction and preserves the contract's revert reason.
      const simulation = await publicClient.simulateContract({
        address: contract,
        abi: EXPENSE_MANAGER_ABI,
        functionName: "settleWith",
        args: [BigInt(roomId), to],
        account: address,
      });

      onStep?.("Sending USDC…");
      const hash = await walletClient.writeContract(simulation.request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Settlement reverted onchain.");
      await refresh();
      return hash;
    },
    [roomId, ensureAllowanceUnits, requireEnv, requireContract, refresh],
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

  // ------------------------------------------------------------------ lending

  /** Supplies USDC into the lending pool (approve → supply). */
  const supplyUsdc = useCallback(
    async (amount: number, onStep?: TxStep) => {
      await ensureAllowance(amount, onStep);
      onStep?.("Supplying USDC…");
      return send("supply", [toUnits(amount)]);
    },
    [send, ensureAllowance],
  );

  const withdrawUsdc = useCallback(
    (amount: number) => send("withdraw", [toUnits(amount)]),
    [send],
  );

  const borrowUsdc = useCallback((amount: number) => send("borrow", [toUnits(amount)]), [send]);

  /** Repays outstanding debt (approve → repay). */
  const repayUsdc = useCallback(
    async (amount: number, onStep?: TxStep) => {
      await ensureAllowance(amount, onStep);
      onStep?.("Repaying USDC…");
      return send("repay", [toUnits(amount)]);
    },
    [send, ensureAllowance],
  );

  const claimInterest = useCallback(() => send("claimInterest", []), [send]);

  return {
    createRoom,
    joinRoom,
    inviteMember,
    claimName,
    addExpense,
    settleWith,
    settleSplit,
    directTransfer,
    ensureAllowance,
    supplyUsdc,
    withdrawUsdc,
    borrowUsdc,
    repayUsdc,
    claimInterest,
  };
}
