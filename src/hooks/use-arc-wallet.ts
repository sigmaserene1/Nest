import { useAccount, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { arcTestnet, USDC_ADDRESS, ERC20_ABI } from "@/lib/wagmi";

export function useArcWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isOnArc = chainId === arcTestnet.id;

  const {
    data: rawBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const usdcBalance = typeof rawBalance === "bigint" ? Number(formatUnits(rawBalance, 6)) : 0;

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    isOnArc,
    chainId,
    switchToArc: () => switchChain({ chainId: arcTestnet.id }),
    isSwitching,
    usdcBalance,
    isBalanceLoading,
    refetchBalance,
  };
}
