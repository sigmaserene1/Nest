import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { WalletChip } from "@/components/nest/chain";
import { fmtUSD } from "@/lib/nest-data";
import { useComputedBalances, useMembers, useMe, useNestChain } from "@/lib/chain/nest-chain";
import { Check, Copy, Link2, Pencil, ShieldCheck, Share2, UsersRound } from "lucide-react";
import { ProfileNameModal } from "@/components/nest/profile-modal";
import { buildInviteLink } from "@/lib/chain/config";

export const Route = createFileRoute("/app/members")({
  component: MembersPage,
  head: () => ({
    meta: [
      { title: "Workspace members — Nest shared balances" },
      { name: "description", content: "Manage your Nest workspace members, share a workspace invite link and review each member's net balance." },
      { property: "og:title", content: "Workspace members — Nest shared balances" },
      { property: "og:description", content: "Manage workspace members, share an invite link and review each member's net balance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function MembersPage() {
  const members = useMembers();
  const currentUserId = useMe();
  const { myName, roomId, room, contractAddress } = useNestChain();
  const nameLocked = !!myName;
  const { net } = useComputedBalances();
  const [copied, setCopied] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);

  const shareInvite = async () => {
    if (!contractAddress || !roomId) return;
    const link = buildInviteLink(contractAddress, roomId);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my Nest workspace",
          text: `Join ${room?.name ?? "my Nest workspace"} on Arc.`,
          url: link,
        });
      }
      else await navigator.clipboard?.writeText(link);
    } catch {
      try {
        await navigator.clipboard?.writeText(link);
      } catch {
        // clipboard unavailable — the copied state below is still shown
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const copyInvite = async () => {
    if (!contractAddress || !roomId) return;
    const link = buildInviteLink(contractAddress, roomId);
    try {
      await navigator.clipboard?.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be unavailable in embedded previews.
    }
  };

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Workspace access</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Members</h1>
        </div>
      }
    >
      <Card className="mt-5 !p-5 sm:mt-6 sm:!p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
              <Link2 className="h-3.5 w-3.5" />
              Invite member
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Invite to {room?.name ?? "this workspace"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Share one invite link. New users can create their Nest account and join this existing
              workspace; existing users can sign in and join directly.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
            <UsersRound className="h-3.5 w-3.5" />
            {members.length} member{members.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => void shareInvite()}
            disabled={!contractAddress || !roomId}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Invite link ready" : "Share invite"}
          </button>
          <button
            onClick={() => void copyInvite()}
            disabled={!contractAddress || !roomId}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-bold disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/50 px-4 py-3 text-[11px] leading-5 text-muted-foreground">
          Anyone with this link can join the current ExpenseManager workspace, so share it only
          with intended members. Treasury manager roles and delegated spending permissions are
          separate and are not granted by this invite.
        </div>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {members.map((m) => {
          const bal = net[m.id] ?? 0;
          const positive = bal >= 0;
          const isMe = m.id === currentUserId;
          return (
            <Card key={m.id} className="!p-5">
              <div className="flex items-start gap-4">
                <MemberAvatar member={m} size={56} ring />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-base font-bold">{m.name}</div>
                    {isMe && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                        You
                      </span>
                    )}
                    {isMe && nameLocked && (
                      <span
                        title="This name is permanently linked to your wallet"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                      >
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {isMe && !nameLocked && (
                      <button
                        onClick={() => setNameOpen(true)}
                        aria-label="Claim display name"
                        className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-brand"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.handle}</div>
                  <div className="mt-1.5">
                    {m.wallet && <WalletChip address={m.wallet} />}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 p-3">
                <span className="text-xs text-muted-foreground">Net balance</span>
                <span
                  className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-600" : "text-brand"}`}
                >
                  {positive ? "+" : ""}
                  {fmtUSD(bal)}
                </span>
              </div>
            </Card>
          );
        })}

      </div>



      <ProfileNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
    </AppShell>
  );
}
