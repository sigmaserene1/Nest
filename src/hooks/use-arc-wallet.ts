import { useEffect, useMemo, useRef } from "react";
import { useAccount, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI, USDC_ADDRESS } from "@/lib/wagmi";
import {
  arcChainFor,
  setArcEnvironment,
  useArcEnvironment,
  type ArcEnvironment,
} from "@/lib/arc-network";
import { pushAccountCache } from "@/lib/account-cache";

type CachedWalletBalance = {
  amount: number;
  savedAt: number;
};

const balanceKey = (environment: ArcEnvironment, address: string) =>
  `nest.wallet.balance.${environment}.${address.toLowerCase()}`;

function readCachedBalance(
  environment: ArcEnvironment,
  address?: string,
): CachedWalletBalance | null {
  if (typeof window === "undefined" || !address) return null;
  try {
    const raw = localStorage.getItem(balanceKey(environment, address));
    return raw ? (JSON.parse(raw) as CachedWalletBalance) : null;
  } catch {
    return null;
  }
}

export function useArcWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const { switchChain, switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const isOnArc = chainId === arcChain.id;
  const cachedBalance = useMemo(
    () => readCachedBalance(environment, address),
    [environment, address],
  );
  const lastSyncedBalance = useRef("");

  const {
    data: rawBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcChain.id,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const liveBalance =
    typeof rawBalance === "bigint" ? Number(formatUnits(rawBalance, 6)) : null;
  const usdcBalance = liveBalance ?? cachedBalance?.amount ?? 0;
  const isBalanceFromCache = liveBalance == null && cachedBalance != null;

  useEffect(() => {
    if (!address || liveBalance == null || typeof window === "undefined") return;

    const payload: CachedWalletBalance = {
      amount: liveBalance,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(balanceKey(environment, address), JSON.stringify(payload));
    } catch {
      // Cache failure must never block the wallet UI.
    }

    const signature = `${environment}:${address.toLowerCase()}:${liveBalance}`;
    if (signature === lastSyncedBalance.current) return;
    lastSyncedBalance.current = signature;

    void pushAccountCache(environment, {
      preferences: {
        walletBalance: liveBalance,
        walletBalanceAt: payload.savedAt,
      },
    });
  }, [address, environment, liveBalance]);

  const selectEnvironment = async (next: ArcEnvironment) => {
    const nextChain = arcChainFor(next);
    if (isConnected && chainId !== nextChain.id) {
      await switchChainAsync({ chainId: nextChain.id as never });
    }
    setArcEnvironment(next);
  };

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    isOnArc,
    chainId,
    environment,
    arcChain,
    selectEnvironment,
    switchToArc: () => switchChain({ chainId: arcChain.id as never }),
    switchToArcAsync: () => switchChainAsync({ chainId: arcChain.id as never }),
    isSwitching,
    usdcBalance,
    isBalanceLoading: isBalanceLoading && !cachedBalance,
    isBalanceFromCache,
    refetchBalance,
  };
}
