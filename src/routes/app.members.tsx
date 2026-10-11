import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { WalletChip, ArcBadge } from "@/components/nest/chain";
import { fmtUSD } from "@/lib/nest-data";
import { useComputedBalances, useMembers, useMe, useNestChain } from "@/lib/chain/nest-chain";
import { Check, Copy, Link2, Pencil, ShieldCheck, Share2, UserCheck } from "lucide-react";
import { ProfileNameModal } from "@/components/nest/profile-modal";
import { buildInviteLink } from "@/lib/chain/config";

export const Route = createFileRoute("/app/members")({
  component: MembersPage,
  head: () => ({
    meta: [
      { title: "Members · Nest" },
      { name: "description", content: "Manage your Nest workspace members, share a secure invite link and review each member's net balance." },
      { property: "og:title", content: "Members · Nest" },
      { property: "og:description", content: "Manage workspace members, share an invite link and review each member's net balance." },
    ],
  }),
});

function MembersPage() {
  const members = useMembers();
  const currentUserId = useMe();
  const { myName, roomId, contractAddress } = useNestChain();
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
          text: "Join my shared Nest workspace on Arc.",
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

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Workspace access</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Members</h1>
        </div>
      }
    >
      <Card className="mt-5 overflow-hidden !p-0 sm:mt-6">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
              <Link2 className="h-3.5 w-3.5" />
              Invite members
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">One link. One onchain join.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Share your workspace invite. The recipient signs in, reviews the invitation, and
              confirms one Arc transaction to join the workspace.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => void shareInvite()}
                disabled={!contractAddress || !roomId}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Invite link copied" : "Share invite link"}
              </button>
              <button
                onClick={() => void shareInvite()}
                disabled={!contractAddress || !roomId}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-bold disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
            </div>
          </div>

          <div className="border-t border-border bg-muted/35 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              How joining works
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["1", "Open invite", "The link opens the exact Nest workspace."],
                ["2", "Sign in", "Use Circle email/Google or a connected wallet."],
                ["3", "Join onchain", "Confirm once and the workspace appears in Nest."],
              ].map(([step, title, body]) => (
                <div key={step} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                    {step}
                  </span>
                  <div>
                    <div className="text-xs font-bold">{title}</div>
                    <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {m.wallet && <WalletChip address={m.wallet} />}
                    <ArcBadge />
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

      {members.length === 1 ? (
        <Card className="mt-4 !p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-bold">You’re the only member right now</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Share the invite above when you’re ready to add someone.
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <ProfileNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
    </AppShell>
  );
}
