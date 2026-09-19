import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  ExternalLink,
  Receipt,
  Send,
  UserPlus,
  Wallet,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { MemberAvatar } from "@/components/nest/avatar";
import { EmptyState } from "@/components/nest/feedback";
import { Stagger, Item } from "@/components/nest/motion";
import { getMember, fmtUSD, fmtRelative } from "@/lib/nest-data";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useArcEnvironment } from "@/lib/arc-network";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile · Nest" },
      {
        name: "description",
        content:
          "Your Nest wallet profile: onchain payments, settlements and expenses tied to your Arc address.",
      },
      { property: "og:title", content: "Your profile · Nest" },
      {
        property: "og:description",
        content: "Every payment, settlement and expense your wallet made on Arc, in one place.",
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

  const address = wallet.address ?? me ?? "";
  const member = getMember(me ?? "");
  const name = myName ?? member.name;

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
    if (tab === "Paid")
      return (
        (a.kind === "transfer" || a.kind === "settlement") && a.actorId === me
      );
    if (tab === "Received") return a.counterpartyId === me;
    return a.kind === "expense" && a.actorId === me;
  });

  const myNet = me ? (net[me] ?? 0) : 0;

  const explorerBase =
    environment === "mainnet"
      ? "https://explorer.arc.io"
      : "https://testnet.arcscan.app";

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Your onchain identity</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Profile</h1>
        </div>
      }
    >
      {/* Identity card */}
      <Card className="mt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <MemberAvatar member={{ ...member, name }} size={56} ring />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold">{name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-mono">
                  {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "Not connected"}
                </span>
              </div>
              {room && (
                <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {room.name} · Room #{room.id}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              onClick={copy}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-muted px-3.5 py-2 text-xs font-semibold transition hover:bg-muted/70 active:scale-[0.97]"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {address && (
              <a
                href={`${explorerBase}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition active:scale-[0.97]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Explorer
              </a>
            )}
          </div>
        </div>

        <div
          className={`mt-5 rounded-2xl p-4 text-center ${
            myNet >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Net position
          </div>
          <div
            className={`mt-1 text-2xl font-black tabular-nums ${
              myNet >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {myNet >= 0 ? "+" : "−"}
            {fmtUSD(Math.abs(myNet))}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {myNet >= 0 ? "the home owes you" : "you owe the home"}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sent", value: stats.paid, tone: "text-foreground" },
          { label: "Received", value: stats.received, tone: "text-emerald-600" },
          { label: "Settled", value: stats.settled, tone: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="!p-4 text-center">
            <div className={`text-lg font-black tabular-nums ${s.tone}`}>{fmtUSD(s.value)}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{s.label}</div>
          </Card>
        ))}
        <Card className="!p-4 text-center">
          <div className="text-lg font-black tabular-nums">{stats.myExpenses}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
            Expenses added
          </div>
        </Card>
      </div>

      {/* Activity */}
      <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === t
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground ring-1 ring-black/[0.04]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mt-4 !p-2">
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
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted/50 ${
                    i !== filtered.length - 1 ? "border-b border-border/60" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <MemberAvatar member={m} size={42} />
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] text-foreground shadow-sm ring-1 ring-black/5">
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
                  {a.amount != null && (
                    <div
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        outgoing && a.kind !== "expense" ? "text-red-500" : "text-emerald-600"
                      }`}
                    >
                      {a.kind === "expense" ? "" : outgoing ? "-" : "+"}
                      {fmtUSD(a.amount)}
                    </div>
                  )}
                </Item>
              );
            })}
          </ul>
        </Stagger>
        {filtered.length === 0 && (
          <EmptyState
            emoji="👤"
            title="No activity yet"
            description="Your payments, settlements and expenses will appear here once they land onchain."
          />
        )}
      </Card>

      <div className="mt-4 text-center">
        <Link
          to="/app/receipts"
          className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
        >
          View verified receipts →
        </Link>
      </div>
    </AppShell>
  );
}
