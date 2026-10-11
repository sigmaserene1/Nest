import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CheckCircle2, Link2, Loader2, ShieldCheck, Wallet, X, UserPlus } from "lucide-react";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { ContractSetup, RoomSetup } from "@/components/nest/setup";
import { applyInvite, resolveInvite } from "@/lib/chain/config";
import { arcChainFor, useArcEnvironment } from "@/lib/arc-network";
import { useEmailAuth } from "@/lib/use-email-auth";
import { SignInDialog } from "@/components/nest/sign-in-dialog";
import { NestLogo } from "@/components/nest/logo";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";


const PENDING_INVITE = "nest.invite.pending";

type PendingInvite = {
  address: `0x${string}`;
  roomId: number;
};

function useInviteRoomName(invite: PendingInvite | null) {
  const environment = useArcEnvironment();
  const chain = arcChainFor(environment);
  const query = useReadContract({
    address: invite?.address,
    abi: EXPENSE_MANAGER_ABI,
    functionName: "getRoom",
    args: invite ? [BigInt(invite.roomId)] : undefined,
    chainId: chain.id,
    query: { enabled: !!invite },
  });

  const room = query.data as
    | { id: bigint; name: string; creator: string; createdAt: bigint }
    | undefined;

  return room?.id && room.id > 0n && room.name?.trim()
    ? room.name.trim()
    : "this shared workspace";
}

function InviteEntry({
  invite,
  onContinue,
  onWallet,
  onDecline,
}: {
  invite: PendingInvite;
  onContinue: () => void;
  onWallet: () => void;
  onDecline: () => void;
}) {
  const roomName = useInviteRoomName(invite);

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between">
          <NestLogo />
          <button
            type="button"
            onClick={onDecline}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground"
            aria-label="Close invitation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-[30px] border border-border bg-card shadow-xl">
          <div className="border-b border-border bg-gradient-to-b from-brand/10 to-transparent p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-sm">
              <UserPlus className="h-5 w-5" />
            </span>
            <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Workspace invitation
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Join {roomName}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in or create your Nest account first. You’ll review the invitation before
              anything is written onchain.
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl bg-muted/50 p-4">
              <div className="text-xs font-bold">No duplicate workspace</div>
              <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                If you’re new to Nest, this flow joins the existing workspace. Nest will not create
                a separate workspace for you.
              </div>
            </div>

            <button
              type="button"
              onClick={onContinue}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold"
            >
              <UserPlus className="h-4 w-4" />
              Continue to invitation
            </button>

            <button
              type="button"
              onClick={onWallet}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-xs font-bold"
            >
              <Wallet className="h-4 w-4" />
              Use an existing wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteAcceptance({
  invite,
  onJoin,
  onDecline,
  joining,
  error,
}: {
  invite: PendingInvite;
  onJoin: () => void;
  onDecline: () => void;
  joining: boolean;
  error: string;
}) {
  const roomName = useInviteRoomName(invite);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-border bg-card shadow-xl">
        <div className="border-b border-border bg-muted/35 p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background">
              <Link2 className="h-5 w-5" />
            </span>
            <button
              type="button"
              onClick={onDecline}
              disabled={joining}
              className="grid h-9 w-9 place-items-center rounded-full bg-background text-muted-foreground disabled:opacity-50"
              aria-label="Decline invitation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            Workspace invitation
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Join {roomName}?</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Joining adds your connected wallet to this existing workspace on Arc. It does not
            create a new workspace.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/45 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <div className="text-xs font-bold">Nest workspace link</div>
                <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  The link resolves to the current Nest ExpenseManager deployment on the selected
                  Arc network. Internal contract details stay out of the normal join flow.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-muted/45 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <div className="text-xs font-bold">One confirmation</div>
                <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Confirm the join transaction once. Nest then opens the workspace automatically.
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onJoin}
            disabled={joining}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold disabled:opacity-50"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {joining ? "Joining onchain…" : "Join workspace"}
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={joining}
            className="mt-2 min-h-11 w-full rounded-2xl text-xs font-bold text-muted-foreground disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const navigate = useNavigate();
  const { rooms, refresh } = useNestChain();
  const { joinRoom } = useNestWrites();
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [inviteAuthOpen, setInviteAuthOpen] = useState(false);
  const [joiningInvite, setJoiningInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Preserve an invite through Circle/email authentication and external-wallet
  // connection. The invitation is resolved before the normal workspace gate so
  // a brand-new invitee never gets an accidental personal workspace.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("invite");
    if (tokenFromUrl) {
      localStorage.setItem(PENDING_INVITE, tokenFromUrl);
      params.delete("invite");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }

    const token = tokenFromUrl ?? localStorage.getItem(PENDING_INVITE);
    if (!token) {
      setPendingInvite(null);
      setInviteChecked(true);
      return;
    }

    const parsed = resolveInvite(token);
    if (!parsed) {
      localStorage.removeItem(PENDING_INVITE);
      setPendingInvite(null);
      setInviteError("This invitation link is invalid.");
      setInviteChecked(true);
      return;
    }

    const typed = parsed as PendingInvite;
    if (address && rooms.some((room) => room.id === typed.roomId)) {
      try {
        applyInvite(address, typed);
        localStorage.removeItem(PENDING_INVITE);
        setPendingInvite(null);
        setInviteError("");
      } catch {
        setInviteError("This invitation belongs to a different Nest network.");
      }
      setInviteChecked(true);
      return;
    }

    setPendingInvite(typed);
    setInviteChecked(true);
  }, [address, rooms]);

  const acceptInvite = async () => {
    if (!address || !pendingInvite || joiningInvite) return;
    setJoiningInvite(true);
    setInviteError("");
    try {
      // Validate the invite against the currently selected Nest deployment
      // before the wallet is asked to join.
      applyInvite(undefined, pendingInvite);
      await joinRoom(pendingInvite.roomId);
      applyInvite(address, pendingInvite);
      localStorage.removeItem(PENDING_INVITE);
      setPendingInvite(null);
      await refresh();
    } catch (error) {
      setInviteError((error as Error).message.split("\n")[0] || "Could not join this workspace.");
    } finally {
      setJoiningInvite(false);
    }
  };

  const declineInvite = () => {
    if (typeof window !== "undefined") localStorage.removeItem(PENDING_INVITE);
    setPendingInvite(null);
    setInviteError("");
    void navigate({ to: "/" });
  };

  const emailAuth = useEmailAuth();
  // Wait only while an email session is being restored; once that attempt
  // finishes, a disconnected person always gets the wallet chooser.
  const isBusy = isConnecting || isReconnecting || !emailAuth.ready;

  // No separate sign-in page: the wallet chooser opens straight away, and if the
  // person closes it without connecting we send them back to the landing page.
  useEffect(() => {
    if (inviteChecked && !pendingInvite && !isConnected && !isBusy) openConnectModal?.();
  }, [inviteChecked, pendingInvite, isConnected, isBusy, openConnectModal]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (
      wasOpen.current &&
      !connectModalOpen &&
      !isConnected &&
      !isBusy &&
      !pendingInvite
    ) {
      void navigate({ to: "/" });
    }
    wasOpen.current = connectModalOpen;
  }, [connectModalOpen, isConnected, isBusy, navigate, pendingInvite]);

  if (isConnected && pendingInvite) {
    return (
      <InviteAcceptance
        invite={pendingInvite}
        onJoin={() => void acceptInvite()}
        onDecline={declineInvite}
        joining={joiningInvite}
        error={inviteError}
      />
    );
  }

  if (!isConnected && inviteChecked && pendingInvite) {
    return (
      <>
        <InviteEntry
          invite={pendingInvite}
          onContinue={() => setInviteAuthOpen(true)}
          onWallet={() => openConnectModal?.()}
          onDecline={declineInvite}
        />
        <SignInDialog
          open={inviteAuthOpen}
          onOpenChange={setInviteAuthOpen}
          onWallet={() => {
            setInviteAuthOpen(false);
            openConnectModal?.();
          }}
          onAuthenticated={() => setInviteAuthOpen(false)}
          inviteMode
        />
      </>
    );
  }

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
