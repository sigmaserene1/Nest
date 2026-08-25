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
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NestLogo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-foreground">Product</a>
            <a href="#features" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#network" className="transition-colors hover:text-foreground">Network</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 hover:opacity-90"
            >
              Open app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 text-center">
        <div
          aria-hidden
          className="animate-soft-float pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]"
        />
        <span
          className="animate-pop-in inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand"
          style={{ animationDelay: "40ms" }}
        >
          <span className="h-2 w-2 rounded-full bg-brand" />
          Live on Arc testnet · Circle USDC gas
        </span>

        <h1
          className="animate-float-in mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.03] tracking-tight sm:text-6xl md:text-[4.5rem]"
          style={{ animationDelay: "60ms" }}
        >
          <span className="shine-text">Shared money,</span>
          <br />
          <span className="text-brand">settled onchain</span>
        </h1>
        <p
          className="animate-float-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          style={{ animationDelay: "120ms" }}
        >
          A shared-finance protocol on Arc. Record group expenses, net obligations down to the
          minimum number of transfers, and settle peer-to-peer in native USDC with sub-second
          finality — plus CCTP liquidity routing, idle-balance markets, and programmable
          auto-settlement.
        </p>

        <div
          className="animate-float-in mt-9 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "170ms" }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full btn-gradient px-7 py-3.5 text-sm font-semibold"
          >
            Launch Nest <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#product"
            className="inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 text-sm font-semibold ring-1 ring-border transition-all hover:-translate-y-0.5 hover:bg-muted"
          >
            Explore the product
          </a>
        </div>

        <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="animate-float-in bg-card px-5 py-7 transition-colors hover:bg-muted/50"
              style={{ animationDelay: `${260 + i * 45}ms` }}
            >
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
        <Reveal>
          <SectionHead
            eyebrow="One app, full stack"
            eyebrowIcon={Sparkles}
            title="The full stack for shared capital"
            body="Every surface — the expense ledger, settlement, lending markets, CCTP routing and receipts — reads and writes the same ExpenseManager contract on Arc. One source of truth, verifiable by anyone."
          />
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(0,auto)] gap-5 md:grid-cols-6">
          {PRODUCT.map((p, i) => (
            <Reveal
              key={p.title}
              delay={(i % 3) * 60}
              className={p.span ?? "md:col-span-2"}
            >
              <article className="lift group h-full rounded-2xl bg-card p-7 ring-1 ring-border">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <ul className={`mt-4 gap-2 ${p.wide ? "grid sm:grid-cols-2" : "space-y-2"}`}>
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>


      {/* How it works */}
      <section id="features" className="border-y border-border bg-surface-muted/60 py-24">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-5">
          <Reveal>
          <SectionHead
            eyebrow="Onchain settlement"
            eyebrowIcon={Link2}
            title="From obligation to final settlement"
            body="Four steps, two of them settled onchain. Non-custodial throughout: no pooled float, no intermediated transfer, no counterparty risk."
          />
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 60}>
              <div className="lift h-full rounded-2xl bg-card p-6 text-left ring-1 ring-border">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Network */}
      <section id="network" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <Reveal>
        <SectionHead
          eyebrow="Built for Arc"
          eyebrowIcon={Globe2}
          title="Native USDC, cross-chain by default"
          body="Nest integrates Circle's CCTP v2 (Arc domain 26). Participants deposit from any supported domain and receive canonical native USDC on Arc — burn-and-mint, never a wrapped representation."
        />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="h-full">
          <div className="lift h-full rounded-2xl bg-card p-8 ring-1 ring-border">
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
          </Reveal>

          <Reveal delay={120} className="h-full">
          <div className="lift h-full rounded-2xl bg-card p-8 ring-1 ring-border">
            <h3 className="text-lg">Fund from any supported testnet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Burn on the source chain, attest through Iris, mint on Arc — Nest walks the whole CCTP
              route for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CHAINS.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-brand-soft hover:text-brand"
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
          </Reveal>
        </div>
      </section>

      {/* Why different */}
      <section className="border-y border-border bg-surface-muted/60 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
          <SectionHead
            eyebrow="Why Nest"
            eyebrowIcon={ShieldCheck}
            title="Most expense apps stop at the balance. Nest clears it."
            body="Conventional tools compute a number and hand settlement off to a banking rail. Nest closes the loop in the same transaction, with an onchain record at the end of it."
          />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {DIFFS.map((d, i) => (
              <Reveal key={d.title} delay={i * 60}>
              <div className="lift h-full rounded-2xl bg-card p-7 ring-1 ring-border">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <d.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24">
        <Reveal>
        <h2 className="text-center font-display text-4xl tracking-tight">Questions, answered</h2>
        </Reveal>
        <Reveal delay={100} className="mt-10">
        <div className=" divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-6">
              <summary className="cursor-pointer list-none text-base font-semibold transition-colors group-open:text-brand hover:text-brand">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <Reveal>
        <div className="rounded-3xl bg-foreground px-8 py-14 text-center text-background">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight tracking-tight">
            Group finance, settled with finality
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-background/70">
            Connect a wallet and your group is provisioned onchain instantly. First USDC settlement on
            Arc in under two minutes.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground hover:opacity-90"
          >
            Launch Nest <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        </Reveal>
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

const PRODUCT: {
  icon: typeof Zap;
  title: string;
  body: string;
  points: string[];
  wide?: boolean;
  span?: string;
}[] = [
  {
    icon: Receipt,
    title: "Group expense ledger",
    wide: true,
    span: "md:col-span-4",
    body: "Record recurring and one-off group costs with equal, weighted or multi-payer allocation. Every participant resolves the same state directly from the contract — no local cache, no server of record.",
    points: [
      "Equal, custom and multi-payer splits",
      "Exact base-unit settlement amounts",
      "All participants read one contract",
    ],
  },
  {
    icon: Calculator,
    title: "Obligation netting",
    body: "Obligations are netted across the group so the graph collapses to the minimum number of transfers.",
    points: ["Exact base-unit math", "owedBetween resolved onchain"],
  },
  {
    icon: Bot,
    title: "Agent co-signer",
    body: "Delegate recurring settlement under an explicit spend cap and policy window.",
    points: ["Spend limits per period", "Approve-then-settle pipeline"],
  },
  {
    icon: Landmark,
    title: "Idle-balance markets",
    body: "Supply reserved USDC to the lending market to earn yield, or borrow against your position.",
    points: ["Supply and borrow markets", "Positions tracked onchain"],
  },
  {
    icon: Briefcase,
    title: "Syndicate mode",
    body: "Reconfigure the group as a revenue-sharing entity: distribute income instead of costs.",
    points: ["Revenue splits", "Client-facing receipts"],
  },
  {
    icon: Lock,
    title: "Verified receipts",
    wide: true,
    span: "md:col-span-6",
    body: "Each settlement emits a tamper-evident receipt: a SHA-256 content commitment bound to the Arc transaction hash and verifiable on Arcscan. Independent proof of payment, with no trusted intermediary.",
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
    body: "Group members record costs. Nest stores the payer, the total and the allocation per participant.",
    onchain: false,
  },
  {
    icon: Calculator,
    title: "Auto-simplify debts",
    body: "The obligation graph is reduced to the minimum set of transfers that clears every balance.",
    onchain: false,
  },
  {
    icon: Send,
    title: "Settle in USDC",
    body: "Approve once, then transfer the exact base-unit amount wallet-to-wallet in native USDC.",
    onchain: true,
  },
  {
    icon: CheckCircle2,
    title: "Confirmed in seconds",
    body: "Arc finalises the transfer sub-second, balances re-resolve from chain and the receipt is issued.",
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
    body: "Nest custodies nothing. Value moves wallet-to-wallet; the contract records obligations and settlement events only.",
  },
  {
    icon: Coins,
    title: "Stablecoin native",
    body: "Accounting, settlement and gas are denominated in USDC, so the agreed amount is the amount that settles.",
  },
  {
    icon: LineChart,
    title: "Productive by default",
    body: "Reserved capital stays productive — supply it to the market, route it across domains, or delegate it to the agent.",
  },
];

const FAQ = [
  {
    q: "Does everyone in the group need onchain experience?",
    a: "No. A wallet connection is the only prerequisite. Approvals, base-unit amounts and the settlement sequence are handled by the application.",
  },
  {
    q: "Where is the data stored?",
    a: "Expenses, participants, obligations and settlements are stored in the ExpenseManager contract on Arc Testnet, so every member resolves identical state.",
  },
  {
    q: "What happens if the Arc RPC is unavailable?",
    a: "Failed reads are detected and the interface falls back to a clearly-labelled read-only mode. Write paths resume as soon as the endpoint recovers.",
  },
  {
    q: "Can I fund a position from another chain?",
    a: "Yes. Deposits use Circle's CCTP: burn on the source domain, retrieve the attestation, mint canonical USDC on Arc. No wrapped assets, no third-party bridge.",
  },
  {
    q: "Is this real money?",
    a: "Nest runs on Arc Testnet with testnet USDC today. Contracts, settlement paths and receipts are production-shaped; mainnet is a configuration change.",
  },
];
