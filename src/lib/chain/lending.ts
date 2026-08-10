// Live lending-pool state from the ExpenseManager contract on Arc Testnet.

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
import { arcTestnet } from "@/lib/wagmi";
import { useContractAddress } from "./config";

export type LendingPosition = {
  supplied: number;
  supplyInterest: number;
  borrowed: number;
  borrowInterest: number;
  debt: number;
  borrowLimit: number;
  available: number;
  poolSupplied: number;
  poolBorrowed: number;
  liquidity: number;
};

const EMPTY: LendingPosition = {
  supplied: 0,
  supplyInterest: 0,
  borrowed: 0,
  borrowInterest: 0,
  debt: 0,
  borrowLimit: 0,
  available: 0,
  poolSupplied: 0,
  poolBorrowed: 0,
  liquidity: 0,
};

const n = (v: bigint | undefined) => (typeof v === "bigint" ? Number(formatUnits(v, 6)) : 0);

export const BORROW_APR = 8;
export const SUPPLY_APR = 4;
export const MAX_LTV = 50;

export function useLending() {
  const { address } = useAccount();
  const contractAddress = useContractAddress();

  const enabledQuery = useReadContract({
    address: contractAddress ?? undefined,
    abi: EXPENSE_MANAGER_ABI,
    functionName: "lendingEnabled",
    chainId: arcTestnet.id,
    query: { enabled: !!contractAddress, retry: false },
  });

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress ?? undefined,
    abi: EXPENSE_MANAGER_ABI,
    functionName: "getLendingPosition",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!contractAddress && !!address && enabledQuery.data === true,
      refetchInterval: 20_000,
    },
  });

  const raw = data as Record<string, bigint> | undefined;
  const position: LendingPosition = raw
    ? {
        supplied: n(raw.supplied),
        supplyInterest: n(raw.supplyInterest),
        borrowed: n(raw.borrowed),
        borrowInterest: n(raw.borrowInterest),
        debt: n(raw.debt),
        borrowLimit: n(raw.borrowLimit),
        available: n(raw.available),
        poolSupplied: n(raw.poolSupplied),
        poolBorrowed: n(raw.poolBorrowed),
        liquidity: n(raw.liquidity),
      }
    : EMPTY;

  return {
    position,
    isLoading: isLoading || enabledQuery.isLoading,
    /** False when the configured deployment predates the lending module. */
    supported: enabledQuery.data === true,
    contractAddress,
    refresh: async () => {
      await refetch();
    },
  };
}
