import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { NestChainProvider, useNestChain } from "@/lib/chain/nest-chain";
import { ContractSetup, RoomSetup } from "@/components/nest/setup";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function Gate() {
  const { contractAddress, roomId, isLoading } = useNestChain();
  if (!contractAddress) return <ContractSetup />;
  if (!roomId && !isLoading) return <RoomSetup />;
  if (!roomId) return null;
  return <Outlet />;
}

function AppLayout() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) navigate({ to: "/auth" });
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return (
    <NestChainProvider>
      <Gate />
    </NestChainProvider>
  );
}
