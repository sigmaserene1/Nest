import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Wallet,
  Users,
  Zap,
  Link2,
  Receipt,
  Calculator,
  Send,
  CheckCircle2,
  Bot,
  Landmark,
  Globe2,
  ShieldCheck,
  Briefcase,
  Coins,
  LineChart,
  Lock,
  Sparkles,
} from "lucide-react";
import { NestLogo } from "@/components/nest/logo";
import { Reveal } from "@/components/nest/reveal";
import { ThemeToggle } from "@/components/nest/theme-toggle";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Nest — Onchain roommate expenses, settled in USDC on Arc" },
      {
        name: "description",
        content:
          "Nest is an onchain shared-finance app on Arc: split rent and groceries, auto-simplify debts, settle instantly in USDC, bridge via CCTP, lend idle balances, and keep verifiable receipts.",
      },
      { property: "og:title", content: "Nest — Onchain roommate expenses, settled in USDC on Arc" },
      {
        property: "og:description",
        content:
          "Split rent and groceries with roommates, settle instantly in USDC on Arc, bridge with CCTP, earn on idle balances, and keep verifiable onchain receipts.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nest — Onchain roommate expenses on Arc" },
      {
        name: "twitter:description",
        content:
          "Shared living, settled onchain. USDC settlement, CCTP bridging, lending and verifiable receipts on Arc.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NestLogo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#features" className="hover:text-foreground">How it works</a>
            <a href="#network" className="hover:text-foreground">Network</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Open app <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand">
          <span className="h-2 w-2 rounded-full bg-brand" />
          Live on Arc testnet · Circle USDC gas
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.03] tracking-tight sm:text-6xl md:text-[4.5rem]">
          Shared money,
          <br />
          <span className="text-brand">settled onchain</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Nest turns messy roommate spreadsheets into real, verifiable settlements. Track shared
          expenses, simplify who owes who, and pay in USDC on Arc — with cross-chain deposits,
          idle-balance yield, and an agent that can settle for you.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full btn-gradient px-7 py-3.5 text-sm font-semibold"
          >
            Launch Nest <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#product"
            className="inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 text-sm font-semibold ring-1 ring-border hover:bg-muted"
          >
            Explore the product
          </a>
        </div>

        <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card px-5 py-7">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-2 font-display text-2xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Product bento */}
      <section id="product" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
        <SectionHead
          eyebrow="One app, full stack"
          eyebrowIcon={Sparkles}
          title="Everything a household needs, onchain"
          body="Nest isn't a ledger with a wallet bolted on. Every core surface — expenses, settlement, lending, bridging, receipts — runs against the same ExpenseManager contract on Arc."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRODUCT.map((p) => (
            <article
              key={p.title}
              className={`rounded-2xl bg-card p-7 ring-1 ring-border ${p.wide ? "md:col-span-2" : ""}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              <ul className="mt-4 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {pt}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="border-y border-border bg-surface-muted/60 py-24">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-5">
          <SectionHead
            eyebrow="Onchain settlement"
            eyebrowIcon={Link2}
            title="From grocery run to final transfer"
            body="Four steps, two of them onchain. No custodial float, no IOUs, no waiting for a bank."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-card p-6 text-left ring-1 ring-border">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      s.onchain
                        ? "bg-success/10 text-success ring-1 ring-success/20"
                        : "bg-info/10 text-info ring-1 ring-info/20"
                    }`}
                  >
                    {s.onchain ? "Onchain" : "Off-chain"}
                  </span>
                </div>
                <div className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-1 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Network */}
      <section id="network" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <SectionHead
          eyebrow="Built for Arc"
          eyebrowIcon={Globe2}
          title="Native USDC, cross-chain by default"
          body="Nest speaks Circle's CCTP so roommates can fund from the chain they already hold USDC on, and everything lands on Arc as native USDC."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <div className="flex items-center gap-3">
              <img
                src="/__l5e/assets-v1/f137cacf-9417-4a42-a5bf-c214ce115c80/arc-logo.png"
                alt="Arc network logo"
                className="h-11 w-11 object-contain"
              />
              <div>
                <div className="text-sm font-bold">Arc Testnet</div>
                <div className="text-xs text-muted-foreground">
                  Sub-second finality · USDC-denominated gas
                </div>
              </div>
            </div>
            <dl className="mt-7 grid grid-cols-2 gap-5">
              {NETWORK.map((n) => (
                <div key={n.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {n.label}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs">{n.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <h3 className="text-lg">Fund from any supported testnet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Burn on the source chain, attest through Iris, mint on Arc — Nest walks the whole CCTP
              route for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CHAINS.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
            <Link
              to="/app/bridge"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90"
            >
              Open the bridge <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="border-y border-border bg-surface-muted/60 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead
            eyebrow="Why Nest"
            eyebrowIcon={ShieldCheck}
            title="Splitting apps stop at the number. Nest finishes the payment."
            body="Traditional expense apps track a balance and hand you off to a bank transfer. Nest closes the loop in the same tap."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {DIFFS.map((d) => (
              <div key={d.title} className="rounded-2xl bg-card p-7 ring-1 ring-border">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <d.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24">
        <h2 className="text-center font-display text-4xl tracking-tight">Questions, answered</h2>
        <div className="mt-10 divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-6">
              <summary className="cursor-pointer list-none text-base font-semibold">{f.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="rounded-3xl bg-foreground px-8 py-14 text-center text-background">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight tracking-tight">
            Stop chasing your roommates for money
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-background/70">
            Connect a wallet, create your household, and settle your first expense in USDC on Arc in
            under two minutes.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground hover:opacity-90"
          >
            Launch Nest <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <NestLogo />
          <p className="text-xs text-muted-foreground">
            Nest · Onchain shared finance on Arc Testnet. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({
  eyebrow,
  eyebrowIcon: Icon,
  title,
  body,
}: {
  eyebrow: string;
  eyebrowIcon: typeof Zap;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </span>
      <h2 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

const STATS = [
  { label: "Settlement", value: "~1 sec" },
  { label: "Gas token", value: "USDC" },
  { label: "CCTP domain", value: "26" },
  { label: "Source chains", value: "6+" },
];

const PRODUCT = [
  {
    icon: Receipt,
    title: "Shared expense ledger",
    wide: true,
    body: "Log rent, groceries, utilities and one-off costs. Nest splits equally or by custom share and keeps every participant in sync from onchain state — not a local cache.",
    points: [
      "Equal, custom and multi-payer splits",
      "Rent-specific payment flow with exact amounts",
      "Everyone in the household reads the same contract",
    ],
  },
  {
    icon: Calculator,
    title: "Debt simplification",
    body: "Nest nets balances across the household so you make the fewest possible transfers.",
    points: ["Exact base-unit math", "owedBetween reads from chain"],
  },
  {
    icon: Bot,
    title: "AI agent co-signer",
    body: "Schedule auto-settlements with spend caps so recurring costs clear themselves.",
    points: ["Spend limits per period", "Approve-then-settle pipeline"],
  },
  {
    icon: Landmark,
    title: "Lend idle balances",
    body: "Park USDC you're holding for shared costs and earn while it waits, or borrow against it.",
    points: ["Supply and borrow markets", "Positions tracked onchain"],
  },
  {
    icon: Briefcase,
    title: "Syndicate mode",
    body: "Flip the household into a freelance collective: split revenue instead of rent.",
    points: ["Revenue splits", "Client-facing receipts"],
  },
  {
    icon: Lock,
    title: "Verified receipts",
    wide: true,
    body: "Every settlement produces a tamper-evident receipt: SHA-256 content hash plus the Arc transaction hash, viewable on Arcscan. Proof you paid, without asking anyone to trust a screenshot.",
    points: [
      "Immutable receipt cards per settlement",
      "Explorer links for independent verification",
      "Exportable payment history",
    ],
  },
];

const STEPS = [
  {
    icon: Receipt,
    title: "Track shared expenses",
    body: "Roommates log rent, groceries and utilities. Nest records who paid and how the cost splits.",
    onchain: false,
  },
  {
    icon: Calculator,
    title: "Auto-simplify debts",
    body: "Nest nets everything down to the fewest settlements needed to clear all balances.",
    onchain: false,
  },
  {
    icon: Send,
    title: "Settle in USDC",
    body: "Approve once, then send the exact USDC amount straight to your roommate's wallet on Arc.",
    onchain: true,
  },
  {
    icon: CheckCircle2,
    title: "Confirmed in seconds",
    body: "Arc's sub-second finality confirms the transfer, updates balances and mints your receipt.",
    onchain: true,
  },
];

const NETWORK = [
  { label: "Chain", value: "Arc Testnet" },
  { label: "Gas & settlement asset", value: "Native USDC" },
  { label: "CCTP domain", value: "26" },
  { label: "Explorer", value: "Arcscan" },
];

const CHAINS = [
  "Ethereum Sepolia",
  "Base Sepolia",
  "Arbitrum Sepolia",
  "OP Sepolia",
  "Polygon Amoy",
  "Avalanche Fuji",
];

const DIFFS = [
  {
    icon: Wallet,
    title: "Self-custody, always",
    body: "Nest never holds your money. Transfers move wallet-to-wallet; the contract only records who owes what.",
  },
  {
    icon: Coins,
    title: "Stablecoin native",
    body: "Balances, settlement and gas are all USDC, so the number you agreed on is the number that moves.",
  },
  {
    icon: LineChart,
    title: "Productive by default",
    body: "Money set aside for shared bills doesn't sit dead — lend it, bridge it, or let the agent route it.",
  },
];

const FAQ = [
  {
    q: "Do all my roommates need crypto experience?",
    a: "No. They connect a wallet once and everything else looks like a normal expense app. Nest handles approvals, exact amounts and the settlement flow behind the scenes.",
  },
  {
    q: "Where is the data stored?",
    a: "Expenses, participants, balances and settlements live in the ExpenseManager contract on Arc Testnet, so every member of a household reads identical state.",
  },
  {
    q: "What happens if the Arc RPC is unavailable?",
    a: "Nest detects failed reads and drops into a clearly-labelled demo mode so the interface stays usable. Writes resume as soon as the network recovers.",
  },
  {
    q: "Can I fund Nest from another chain?",
    a: "Yes. The bridge uses Circle's CCTP: burn USDC on a supported testnet, wait for attestation, and mint native USDC on Arc — no wrapped assets.",
  },
  {
    q: "Is this real money?",
    a: "It runs on Arc Testnet today with testnet USDC. The contracts, flows and receipts are production-shaped, so a mainnet deployment is a configuration change.",
  },
];
