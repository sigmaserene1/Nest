import { useAccount, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI, USDC_ADDRESS } from "@/lib/wagmi";
import {
  arcChainFor,
  setArcEnvironment,
  useArcEnvironment,
  type ArcEnvironment,
} from "@/lib/arc-network";

export function useArcWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const environment = useArcEnvironment();
  const arcChain = arcChainFor(environment);
  const { switchChain, switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const isOnArc = chainId === arcChain.id;

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

  const usdcBalance = typeof rawBalance === "bigint" ? Number(formatUnits(rawBalance, 6)) : 0;

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
    isBalanceLoading,
    refetchBalance,
  };
}
