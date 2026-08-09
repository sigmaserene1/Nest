import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useNestChain } from "@/lib/chain/nest-chain";
import { ContractSetup, RoomSetup } from "@/components/nest/setup";
import { applyInvite, resolveInvite } from "@/lib/chain/config";

const PENDING_INVITE = "nest.invite.pending";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function Gate() {
  const { contractAddress, roomId, isLoading, isDemo } = useNestChain();
  if (!contractAddress) return <ContractSetup />;
  // During an RPC outage we cannot read room membership — show the app in
  // read-only demo mode instead of bouncing people to the setup screen.
  if (isDemo) return <Outlet />;
  if (!roomId && !isLoading) return <RoomSetup />;
  if (!roomId) return null;
  return <Outlet />;
}

function AppLayout() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();

  // Resolve an invite link silently: stash the token, clean the URL, then apply
  // it as soon as a wallet is connected. Users never see contract or room IDs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      localStorage.setItem(PENDING_INVITE, token);
      params.delete("invite");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
    const pending = localStorage.getItem(PENDING_INVITE);
    if (!pending || !address) return;
    const invite = resolveInvite(pending);
    if (invite) applyInvite(address, invite);
    localStorage.removeItem(PENDING_INVITE);
  }, [address]);

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) navigate({ to: "/auth" });
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return <Gate />;
}
