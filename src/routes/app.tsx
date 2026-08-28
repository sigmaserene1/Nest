import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useNestChain } from "@/lib/chain/nest-chain";
import { ContractSetup } from "@/components/nest/setup";
import { applyInvite, clearContractAddress, resolveInvite } from "@/lib/chain/config";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, WalletCards } from "lucide-react";
import { shortAddress } from "@/lib/nest-data";

const PENDING_INVITE = "nest.invite.pending";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function Gate() {
  const { contractAddress, isMember, isLoading, isError, rpcMessage, refresh, me } = useNestChain();
  const [copied, setCopied] = useState(false);
  if (!contractAddress) return <ContractSetup />;

  if (isLoading) {
    return (
      <GatePanel icon={<Loader2 className="animate-spin" />} title="Reading treasury state">
        Loading members, net positions, policies, and receipts directly from Arc.
      </GatePanel>
    );
  }

  if (isError) {
    return (
      <GatePanel icon={<ShieldAlert />} title="Treasury could not be verified">
        <p>{rpcMessage}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void refresh()}>
            <RefreshCw /> Retry Arc read
          </Button>
          <Button variant="outline" onClick={clearContractAddress}>
            Open another treasury
          </Button>
        </div>
      </GatePanel>
    );
  }

  if (!isMember) {
    const copyAddress = async () => {
      if (me) await navigator.clipboard?.writeText(me);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    return (
      <GatePanel icon={<WalletCards />} title="Wallet is not a member yet">
        <p>
          Ask a treasury admin to add{" "}
          <span className="font-mono text-foreground">{me ? shortAddress(me) : "this wallet"}</span>{" "}
          onchain, then retry the membership check.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void copyAddress()}>
            {copied ? "Address copied" : "Copy wallet address"}
          </Button>
          <Button variant="outline" onClick={() => void refresh()}>
            <RefreshCw /> Check membership
          </Button>
          <Button variant="ghost" onClick={clearContractAddress}>
            Open another treasury
          </Button>
        </div>
      </GatePanel>
    );
  }

  return <Outlet />;
}

function GatePanel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="protocol-setup grid min-h-screen place-items-center px-4 text-foreground">
      <section className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl shadow-black/20">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="mt-5 text-xl font-semibold">{title}</h1>
        <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
      </section>
    </main>
  );
}

function AppLayout() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("protocol-dark");
    return () => document.documentElement.classList.remove("protocol-dark");
  }, []);

  // Resolve a V2 invite silently, then verify membership against Arc.
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
      applyInvite(address, invite);
    }
    localStorage.removeItem(PENDING_INVITE);
  }, [address]);

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) navigate({ to: "/auth" });
  }, [isConnected, isConnecting, isReconnecting, navigate]);

  return <Gate />;
}
