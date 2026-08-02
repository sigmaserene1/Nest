import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { NestChainProvider, useNestChain } from "@/lib/chain/nest-chain";
import { ContractSetup, RoomSetup } from "@/components/nest/setup";
import { applyInvite, resolveInvite } from "@/lib/chain/config";

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
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();

  // Resolve an invite link silently: set the contract + room, then clean the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) return;
    const invite = resolveInvite(token);
    if (invite && address) {
      applyInvite(address, invite);
      params.delete("invite");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) navigate({ to: "/auth" });
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return (
    <NestChainProvider>
      <Gate />
    </NestChainProvider>
  );
}

