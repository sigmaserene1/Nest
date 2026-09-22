import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { useNestChain } from "@/lib/chain/nest-chain";
import { ContractSetup, RoomSetup } from "@/components/nest/setup";
import { applyInvite, resolveInvite } from "@/lib/chain/config";
import { useArcEnvironment } from "@/lib/arc-network";


const PENDING_INVITE = "nest.invite.pending";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function Gate() {
  const environment = useArcEnvironment();
  const { contractAddress, roomId, isLoading, isDemo } = useNestChain();

  // Mainnet selection should preserve the existing Nest session/UI even before
  // its contract/workspace has been deployed or migrated.
  if (environment === "mainnet" && !contractAddress) return <Outlet />;
  if (!contractAddress) return <ContractSetup />;
  // During an RPC outage we cannot read room membership — show the app in
  // read-only demo mode instead of bouncing people to the setup screen.
  if (isDemo) return <Outlet />;
  if (environment === "mainnet" && !roomId) return <Outlet />;
  if (!roomId && !isLoading) return <RoomSetup />;
  if (!roomId) return null;
  return <Outlet />;
}

function AppLayout() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { openConnectModal } = useConnectModal();

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
    if (invite) {
      try {
        applyInvite(address, invite);
      } catch {
        // Retired-deployment invites are intentionally ignored. Room discovery
        // below restores this wallet's homes from the canonical contract.
      }
    }
    localStorage.removeItem(PENDING_INVITE);
  }, [address]);

  const isBusy = isConnecting || isReconnecting;

  // No separate sign-in page: the wallet chooser opens straight away, and if the
  // person closes it without connecting we send them back to the landing page.
  useEffect(() => {
    if (!isConnected && !isBusy) openConnectModal?.();
  }, [isConnected, isBusy, openConnectModal]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !connectModalOpen && !isConnected && !isBusy) {
      void navigate({ to: "/" });
    }
    wasOpen.current = connectModalOpen;
  }, [connectModalOpen, isConnected, isBusy, navigate]);

  if (!isConnected) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Wallet className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return <Gate />;

}
