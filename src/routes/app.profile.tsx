import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  AtSign,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  FileText,
  LockKeyhole,
  Loader2,
  Network,
  Pencil,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import {
  MemberAvatar,
  ProfileAvatarGraphic,
} from "@/components/nest/avatar";
import { EmptyState } from "@/components/nest/feedback";
import { Stagger, Item } from "@/components/nest/motion";
import { ViewportPortal } from "@/components/nest/viewport-portal";
import { getMember, fmtUSD, fmtRelative } from "@/lib/nest-data";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { arcEnvironmentLabel, arcExplorerFor, useArcEnvironment } from "@/lib/arc-network";
import {
  PROFILE_AVATARS,
  saveProfileDetails,
  saveProfileAvatar,
  useProfileDisplayName,
  useProfileNote,
  useProfileAvatar,
  type ProfileAvatarId,
} from "@/lib/profile-avatar";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile · Nest" },
      {
        name: "description",
        content:
          "Your Nest identity, avatar, wallet and verified onchain activity on Arc.",
      },
      { property: "og:title", content: "Your profile · Nest" },
      {
        property: "og:description",
        content: "Manage your Nest profile and review the Arc activity tied to your wallet.",
      },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const tabs = ["All", "Paid", "Received", "Expenses"] as const;

function ProfilePage() {
  const { me, myName, activity, expenses, net, room } = useNestChain();
  const wallet = useArcWallet();
  const environment = useArcEnvironment();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const address = wallet.address ?? me ?? "";
  const member = getMember(me ?? address);
  const profileDisplayName = useProfileDisplayName(address);
  const profileNote = useProfileNote(address);
  const name = profileDisplayName || myName || member.name;
  const avatar = useProfileAvatar(address || member.id);

  const mine = useMemo(
    () =>
      activity.filter(
        (a) => a.actorId === me || a.counterpartyId === me,
      ),
    [activity, me],
  );

  const stats = useMemo(() => {
    let paid = 0;
    let received = 0;
    let settled = 0;

    for (const a of mine) {
      if (a.kind === "transfer" && a.actorId === me) paid += a.amount ?? 0;
      if (a.kind === "transfer" && a.counterpartyId === me) received += a.amount ?? 0;
      if (a.kind === "settlement" && a.actorId === me) settled += a.amount ?? 0;
      if (a.kind === "settlement" && a.counterpartyId === me) received += a.amount ?? 0;
    }

    const myExpenses = expenses.filter((e) => e.payerId === me).length;
    return { paid, received, settled, myExpenses };
  }, [mine, expenses, me]);

  const filtered = mine.filter((a) => {
    if (tab === "All") return true;
    if (tab === "Paid") {
      return (
        (a.kind === "transfer" || a.kind === "settlement") && a.actorId === me
      );
    }
    if (tab === "Received") return a.counterpartyId === me;
    return a.kind === "expense" && a.actorId === me;
  });

  const myNet = me ? (net[me] ?? 0) : 0;
  const explorerBase = arcExplorerFor(environment);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is optional.
    }
  };

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Identity & account</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Profile</h1>
        </div>
      }
    >
      <section className="mt-4 overflow-hidden rounded-[30px] border border-border/75 bg-card shadow-sm">
        <div className="relative overflow-hidden px-5 pb-6 pt-7 sm:px-7 sm:pb-7">
          <div
            aria-hidden
            className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-brand/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-28 left-1/4 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <MemberAvatar member={{ ...member, name }} size={72} ring />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black tracking-[-0.035em]">{name}</h2>
                  {myName ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Onchain name
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono">
                    {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Not connected"}
                  </span>
                </div>

                {profileNote ? (
                  <p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground">
                    {profileNote}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                    <Network className="h-3 w-3" />
                    Arc {arcEnvironmentLabel(environment)}
                  </span>
                  {room ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      {room.name}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                disabled={!address}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-brand/25 bg-brand/5 px-4 text-xs font-bold text-brand transition hover:border-brand/45 hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </button>
              <button
                onClick={copy}
                disabled={!address}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-background/80 px-4 text-xs font-bold transition hover:bg-muted disabled:opacity-50"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy wallet"}
              </button>
              {address ? (
                <a
                  href={`${explorerBase}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-bold text-background transition hover:opacity-90"
                >
                  Explorer
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div
              className={`rounded-2xl border p-4 ${
                myNet >= 0
                  ? "border-emerald-500/15 bg-emerald-500/[0.07]"
                  : "border-red-500/15 bg-red-500/[0.07]"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Workspace net position
              </div>
              <div
                className={`mt-1 text-2xl font-black tabular-nums tracking-[-0.03em] ${
                  myNet >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {myNet >= 0 ? "+" : "−"}
                {fmtUSD(Math.abs(myNet))}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {myNet >= 0 ? "You are owed this amount" : "You currently owe this amount"}
              </div>
            </div>

            <div className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <LockKeyhole className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold">Wallet-bound identity</div>
                <div className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                  Onchain name is permanent.
                  <br />
                  Avatar stays editable.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sent", value: fmtUSD(stats.paid), tone: "text-foreground" },
          { label: "Received", value: fmtUSD(stats.received), tone: "text-emerald-600" },
          { label: "Settled", value: fmtUSD(stats.settled), tone: "text-brand" },
          { label: "Expenses", value: String(stats.myExpenses), tone: "text-foreground" },
        ].map((s) => (
          <Card key={s.label} className="!p-4 sm:!p-5">
            <div className={`text-lg font-black tabular-nums tracking-[-0.025em] ${s.tone}`}>
              {s.value}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-bold">Your activity</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Payments, settlements and expenses tied to this wallet.
          </div>
        </div>
        <Link
          to="/app/receipts"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[11px] font-bold text-muted-foreground transition hover:border-brand/30 hover:text-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified receipts
        </Link>
      </div>

      <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-9 shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === t
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground ring-1 ring-black/[0.04]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mt-3 !p-2">
        <Stagger>
          <ul>
            {filtered.map((a, i) => {
              const m = getMember(a.actorId);
              const outgoing = a.actorId === me;
              const icon =
                a.kind === "settlement" ? (
                  <ArrowLeftRight className="h-4 w-4" />
                ) : a.kind === "transfer" ? (
                  <Send className="h-4 w-4" />
                ) : a.kind === "member" ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <Receipt className="h-4 w-4" />
                );

              return (
                <Item
                  as="li"
                  key={a.id}
                  className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors hover:bg-muted/50 ${
                    i !== filtered.length - 1 ? "border-b border-border/60" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <MemberAvatar member={m} size={42} />
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-card text-[11px] text-foreground shadow-sm ring-1 ring-border">
                      {icon}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      <span className="font-semibold">
                        {outgoing ? "You" : m.name.split(" ")[0]}
                      </span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {fmtRelative(a.date)}
                    </div>
                  </div>

                  {a.amount != null ? (
                    <div
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        outgoing && a.kind !== "expense"
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {a.kind === "expense" ? "" : outgoing ? "-" : "+"}
                      {fmtUSD(a.amount)}
                    </div>
                  ) : null}
                </Item>
              );
            })}
          </ul>
        </Stagger>

        {filtered.length === 0 ? (
          <EmptyState
            emoji="👤"
            title="No activity yet"
            description="Your payments, settlements and expenses will appear here after they are recorded onchain."
          />
        ) : null}
      </Card>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        address={address}
        initialName={name}
        initialNote={profileNote}
        initialAvatar={avatar}
      />
    </AppShell>
  );
}

function EditProfileModal({
  open,
  onClose,
  address,
  initialName,
  initialNote,
  initialAvatar,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
  initialName: string;
  initialNote: string;
  initialAvatar: ProfileAvatarId;
}) {
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [avatar, setAvatar] = useState<ProfileAvatarId>(initialAvatar);
  const [showAvatars, setShowAvatars] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setNote(initialNote);
    setAvatar(initialAvatar);
    setShowAvatars(false);
    setError("");
  }, [open, initialAvatar, initialName, initialNote]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  const selectedAvatar = PROFILE_AVATARS.find((option) => option.id === avatar);

  const save = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setError("Add a display name before saving.");
      return;
    }
    if (!address) {
      setError("Connect your wallet before editing your profile.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await saveProfileAvatar(address, avatar);
      await saveProfileDetails(address, { displayName: nextName, note });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ViewportPortal>
      <div
        className="nest-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 backdrop-blur-[6px] sm:items-center sm:p-4"
        role="presentation"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target && !busy) onClose();
        }}
      >
        <div
          className="nest-sheet-enter mobile-sheet glass-strong max-h-[min(760px,calc(100dvh-1rem))] w-full max-w-lg overflow-y-auto rounded-[30px] p-5 sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                Your profile
              </div>
              <h3 id="edit-profile-title" className="mt-1 text-xl font-black tracking-[-0.03em]">
                Edit profile
              </h3>
              <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">
                Change how Nest presents you. Your wallet and permanent onchain identity stay safe.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted transition hover:bg-muted/80 disabled:opacity-50"
              aria-label="Close edit profile"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-xs font-bold">
                <AtSign className="h-3.5 w-3.5 text-brand" />
                Display name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 60))}
                maxLength={60}
                autoFocus
                placeholder="Your Nest name"
                className="min-h-12 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
              <span className="text-[11px] leading-4 text-muted-foreground">
                This editable label is shown in Nest. The onchain name remains permanent.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-xs font-bold">
                <FileText className="h-3.5 w-3.5 text-brand" />
                Profile note <span className="font-normal text-muted-foreground">optional</span>
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 140))}
                maxLength={140}
                rows={2}
                placeholder="e.g. Managing the shared treasury"
                className="w-full resize-none rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
              <span className="text-right text-[10px] text-muted-foreground">{note.length}/140</span>
            </label>

            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <ProfileAvatarGraphic avatarId={avatar} size={50} ring />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">Profile avatar</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Current mark: {selectedAvatar?.label ?? "Nest"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatars((visible) => !visible)}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-[11px] font-bold transition hover:border-brand/35 hover:text-brand"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {showAvatars ? "Hide" : "Change"}
                </button>
              </div>

              {showAvatars ? (
                <div className="mt-4 grid grid-cols-5 gap-2.5">
                  {PROFILE_AVATARS.map((option) => {
                    const selected = avatar === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAvatar(option.id)}
                        className={`group relative grid aspect-square place-items-center rounded-2xl border transition active:scale-[0.96] ${
                          selected
                            ? "border-brand bg-brand/5 ring-2 ring-brand/15"
                            : "border-border/60 bg-background/55 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-background/80"
                        }`}
                        title={option.label}
                        aria-label={`Use ${option.label} profile avatar`}
                      >
                        <ProfileAvatarGraphic avatarId={option.id} size={42} />
                        {selected ? (
                          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand text-white shadow-sm">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-brand/10 p-3 text-xs font-semibold leading-5 text-brand">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-11 rounded-2xl border border-border px-4 text-sm font-bold transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !name.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
