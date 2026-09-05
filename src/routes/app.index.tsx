import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Combine,
  Copy,
  FileCheck2,
  Github,
  Layers,
  Network,
  Plus,
  ReceiptText,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { NestLogo } from "@/components/nest/logo";
import { Reveal } from "@/components/nest/reveal";

const CONTRACT_ADDRESS = "0x709cbAd88162b999882788155cde79aDe46A6D42";
const CONTRACT_URL = `https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`;
const REPO_URL = "https://github.com/sigmaserene1/Nest";
const EXPLORER_URL = "https://testnet.arcscan.app";

const NAV_LINKS = [
  { label: "Protocol", href: "#protocol" },
  { label: "How it works", href: "#how" },
  { label: "Network", href: "#network" },
  { label: "FAQ", href: "#faq" },
] as const;

export const Route = createFileRoute("/app/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Nest — Group finance and USDC settlement on Arc" },
      {
        name: "description",
        content:
          "Nest is programmable group finance on Arc. Record shared obligations, resolve exact balances, and settle peer-to-peer in native USDC.",
      },
      { property: "og:title", content: "Nest — One ledger. Clear every balance." },
      {
        property: "og:description",
        content:
          "Onchain obligations, transparent balances, native USDC settlement and transaction-linked receipts for teams and shared groups on Arc.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nestarc.xyz/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nest — Group settlement on Arc" },
      {
        name: "twitter:description",
        content:
          "Record shared obligations, resolve exact balances and settle peer-to-peer in native USDC on Arc.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/" }],
  }),
});

function Landing() {
  return (
    <div className="landing min-h-screen overflow-x-hidden">
      <SiteHeader />

      <main>
        <Hero />
        <StatsStrip />
        <Protocol />
        <HowItWorks />
        <UseCases />
        <NetworkSection />
        <Faq />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ header */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060a14]/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <a href="#" aria-label="Nest home" className="rounded-xl text-white">
          <NestLogo />
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[13px] font-semibold text-white/60 md:flex"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/docs"
            className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 sm:inline-flex">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Arc Testnet
          </span>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#7c6cff] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(124,108,255,0.35)] transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            <Wallet className="h-3.5 w-3.5" />
            Launch app
          </Link>
        </div>
      </div>

      {/* mobile nav rail */}
      <nav
        aria-label="Section navigation"
        className="scroll-clean flex gap-1.5 overflow-x-auto border-t border-white/[0.05] px-5 py-2 text-[12px] font-semibold text-white/55 md:hidden"
      >
        {NAV_LINKS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5"
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/docs"
          className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5"
        >
          Docs
        </Link>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="landing-stars absolute inset-0 -z-20" />
      <div aria-hidden className="landing-grid absolute inset-x-0 top-0 -z-20 h-[560px]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[720px]"
        style={{
          background:
            "radial-gradient(circle at 68% 8%, rgba(124,108,255,0.22), transparent 32rem), radial-gradient(circle at 18% 22%, rgba(64,120,255,0.12), transparent 26rem)",
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-10 pt-16 text-center sm:pt-24 lg:px-8">
        <div
          className="animate-pop-in inline-flex items-center gap-2 rounded-full border border-[#7c6cff]/30 bg-[#7c6cff]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b3a9ff]"
          style={{ animationDelay: "40ms" }}
        >
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#7c6cff]" />
          Programmable group finance · Live on Arc Testnet
        </div>

        <h1
          className="animate-float-in mt-8 font-display text-[3.1rem] leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-[5rem]"
          style={{ animationDelay: "80ms" }}
        >
          One ledger.
          <br />
          <span className="text-[#a394ff]">Clear every balance.</span>
        </h1>

        <p
          className="animate-float-in mx-auto mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg"
          style={{ animationDelay: "130ms" }}
        >
          Record shared obligations, resolve exact balances, then settle peer-to-peer in native
          USDC — non-custodial, contract-recorded, verifiable in the explorer.
        </p>

        <div
          className="animate-float-in mt-9 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-[#7c6cff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(124,108,255,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            Open a workspace <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/25"
          >
            Read the docs <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          className="animate-float-in mt-7 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: "220ms" }}
        >
          <ContractChip />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-white/45">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Non-custodial
          </span>
        </div>
      </div>

      <HeroPanel />
    </section>
  );
}

function ContractChip() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-3 pr-1">
      <span className="font-mono text-[11px] text-white/45">ExpenseManager</span>
      <span className="font-mono text-[11px] text-white/70">
        {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy contract address"
        className="grid h-7 w-7 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <a
        href={CONTRACT_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="View contract on Arcscan"
        className="grid h-7 w-7 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </span>
  );
}

/* ------------------------------------------------------------------- stats */

function StatsStrip() {
  return (
    <section aria-label="Protocol facts" className="px-5 lg:px-8">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4">
        {PROOF.map((item) => (
          <div key={item.label} className="bg-[#0a0f1e] px-4 py-6 text-center">
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              {item.label}
            </dt>
            <dd className="mt-2 font-mono text-lg font-bold tabular-nums text-white sm:text-xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------------------------------------------------------------- protocol */

function Protocol() {
  return (
    <section id="protocol" className="scroll-mt-28 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#7c6cff]/12 px-3 py-1.5 text-xs font-bold text-[#b3a9ff]">
              <Sparkles className="h-3.5 w-3.5" />
              The protocol
            </span>
            <h2 className="mt-6 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
              One shared state for money between people.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              Nest turns informal IOUs into explicit onchain obligations. Every member resolves the
              same rooms, participants, balances and settlement history from ExpenseManager.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 60}>
              <article className="protocol-card group h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#7c6cff]/12 text-[#a394ff] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{feature.body}</p>
                <p className="mt-5 border-t border-white/[0.06] pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {feature.meta}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- how ---- */

function HowItWorks() {
  return (
    <section
      id="how"
      className="scroll-mt-28 border-y border-white/[0.07] bg-white/[0.02] px-5 py-20 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
              Settlement flow
            </span>
            <h2 className="mt-5 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
              Record. Resolve. Settle. Verify.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              From an open obligation to an explorer-verifiable receipt, with one source of truth
              the whole way through.
            </p>
          </div>
        </Reveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((step, index) => (
            <Reveal key={step.title} delay={index * 70} as="li">
              <article className="relative h-full rounded-2xl border border-white/[0.08] bg-[#0a0f1e] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#7c6cff]">
                    0{index + 1}
                  </span>
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                    {step.kind}
                  </span>
                </div>
                <span className="mt-4 grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- use cases -- */

function UseCases() {
  return (
    <section className="px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
              One engine, multiple groups
            </span>
            <h2 className="mt-5 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
              Shared finance beyond the household.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              These are supported workspace patterns built from the existing group ledger, balance
              views, direct settlement, capped client-side assistance and syndicate distribution —
              not roadmap items dressed up as products.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <article className="use-case-card h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                  {item.tag}
                </span>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#7c6cff]/12 text-[#a394ff]">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="font-display text-lg text-white">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/50">{item.body}</p>
                <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-xs text-white/55">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- network -- */

function NetworkSection() {
  return (
    <section
      id="network"
      className="scroll-mt-28 border-y border-white/[0.07] bg-white/[0.02] px-5 py-20 sm:py-24 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <Reveal>
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
              Purpose-built for Arc
            </span>
            <h2 className="mt-5 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
              The settlement layer is part of the product.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              Nest uses Arc because group settlement needs a stable unit of account, predictable
              execution cost and fast finality — not because a chain badge belongs on a homepage.
              Gas is paid in USDC, so a member never needs a second asset to clear a debt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={CONTRACT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                Inspect ExpenseManager <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                <Github className="h-4 w-4" /> Read the source
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0f1e]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                Network parameters
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected
              </span>
            </div>
            <dl className="divide-y divide-white/[0.05]">
              {CHAIN_PARAMS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <dt className="text-xs font-semibold text-white/45">{row.label}</dt>
                  <dd className="truncate font-mono text-xs text-white/80">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- faq */

function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
              Clear answers
            </span>
            <h2 className="mt-5 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
              Questions builders and users should ask.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              No vague custody language, and no pretending roadmap items already exist.
            </p>
            <Link
              to="/docs"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/85 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              Full documentation <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="space-y-3">
          {FAQ.map((item, index) => (
            <Reveal key={item.q} delay={(index % 4) * 50}>
              <details className="faq-item group rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 transition-colors open:border-[#7c6cff]/35 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <h3 className="font-display text-base text-white sm:text-lg">{item.q}</h3>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/12 text-white/60 transition-transform duration-300 group-open:rotate-45 group-open:border-[#7c6cff]/50 group-open:text-[#b3a9ff]">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-white/55">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- cta */

function FinalCta() {
  return (
    <section className="px-5 pb-20 pt-4 sm:pb-28 lg:px-8">
      <Reveal>
        <div className="cta-panel relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#7c6cff]/25 bg-gradient-to-b from-[#16123a] to-[#0a0f1e] px-7 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(124,108,255,0.28), transparent 60%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/75">
              <CircleDollarSign className="h-3.5 w-3.5 text-[#a394ff]" />
              Group settlement, without the spreadsheet
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.045em] text-white sm:text-6xl">
              Give shared money one source of truth.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Create a workspace, record obligations and complete your first native-USDC settlement
              on Arc Testnet in minutes.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-[#7c6cff] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(124,108,255,0.45)] transition-transform hover:-translate-y-0.5"
              >
                Launch Nest <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-7 py-3.5 text-sm font-bold text-white/85 transition-transform hover:-translate-y-0.5"
              >
                Docs
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------- footer */

function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-[#050810]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(124,108,255,0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="text-white">
              <NestLogo />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
              Programmable group finance on Arc. Record shared obligations, resolve exact balances
              and settle peer-to-peer in native USDC.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] text-white/55">
                Arc Testnet · chain 5042002
              </span>
            </div>

            <div className="mt-6 flex gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Nest on GitHub"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:border-white/25 hover:text-white"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Arcscan explorer"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:border-white/25 hover:text-white"
              >
                <Layers className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/55">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link
                          to={link.to}
                          className="inline-flex items-center gap-1 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                          className="inline-flex items-center gap-1 transition-colors hover:text-white"
                        >
                          {link.label}
                          {link.external && <ArrowUpRight className="h-3 w-3 opacity-50" />}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-white/35">
            ExpenseManager{" "}
            <a
              href={CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="text-white/55 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
            >
              {CONTRACT_ADDRESS}
            </a>
          </p>
          <p className="text-[11px] text-white/35">
            © {new Date().getFullYear()} Nest · MIT licensed
          </p>
        </div>

        <p className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-[11px] leading-5 text-amber-200/70">
          Testnet software. All balances and transactions use Arc Testnet assets with no real-world
          monetary value. Contracts are unaudited and Nest is not a custodian, bank or lender.
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- hero ui */

function HeroPanel() {
  return (
    <div
      className="animate-float-in mx-auto w-full max-w-5xl px-5 pb-20 lg:px-8"
      style={{ animationDelay: "260ms" }}
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-10 -z-10 rounded-[3rem] blur-3xl"
          style={{ background: "rgba(124,108,255,0.14)" }}
        />
        <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b101f]/95 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="live-dot h-2 w-2 rounded-full bg-[#7c6cff]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a394ff]">
                Nest cockpit
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              Ledger synced
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1.1fr_1fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Workspace position
              </p>
              <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-white">
                48.20<span className="ml-1 text-sm font-semibold text-white/40">USDC</span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> 3 open shares this month
              </p>
              <div className="mt-5 space-y-2 text-xs text-white/50">
                <div className="flex justify-between">
                  <span>You are owed</span>
                  <span className="font-mono font-bold tabular-nums text-white/80">48.20</span>
                </div>
                <div className="flex justify-between">
                  <span>You owe</span>
                  <span className="font-mono font-bold tabular-nums text-white/80">0.00</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#7c6cff]/20 bg-[#7c6cff]/[0.06] p-5 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-[#7c6cff]/40 bg-[#7c6cff]/15 text-[#b3a9ff] shadow-[0_0_32px_rgba(124,108,255,0.35)]">
                <Bot className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
                Settlement assistant
              </p>
              <p className="mt-2 font-display text-xl font-bold text-white">Your queue is ready.</p>
              <p className="mt-1.5 text-xs leading-5 text-white/50">
                3 settlements grouped under a 50 USDC per-run cap — wallet approval required for
                each.
              </p>
              <div className="mt-4 w-full space-y-1.5 text-left text-[11px]">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-white/70">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Exact debts resolved
                  </span>
                  <span className="font-mono text-white/60">3 payees</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-white/70">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Allowance checked
                  </span>
                  <span className="font-mono text-emerald-400">Ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Settlement queue
                </p>
                <span className="font-mono text-[10px] text-[#a394ff]">3 counterparties</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {SETTLEMENTS.map((s, index) => (
                  <div
                    key={s.from + s.to}
                    className="settlement-row flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5"
                    style={{ animationDelay: `${900 + index * 240}ms` }}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-white ${s.fromColor}`}
                    >
                      {s.from}
                    </span>
                    <span className="transfer-track relative h-px flex-1 bg-white/10">
                      <span className="transfer-particle absolute -top-1 h-2 w-2 rounded-full bg-[#7c6cff]" />
                    </span>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-white ${s.toColor}`}
                    >
                      {s.to}
                    </span>
                    <span className="min-w-14 text-right font-mono text-[9px] font-bold tabular-nums text-white/75">
                      {s.amount}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-400/10 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Grouped for settlement
                </span>
                <span className="font-mono text-[10px] font-bold tabular-nums text-white/80">
                  48.20 USDC
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] px-5 py-4 text-[10px] font-semibold text-white/40 sm:px-6">
            <span className="inline-flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5" /> Wallet-to-wallet · non-custodial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5 text-[#a394ff]" /> Native USDC · Arc finality
              ~1s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" /> Receipt on completion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- data */

type Feature = { icon: LucideIcon; title: string; body: string; meta: string };

const PROOF = [
  { label: "Settlement asset", value: "Native USDC" },
  { label: "Finality", value: "Sub-second" },
  { label: "CCTP domain", value: "26" },
  { label: "Source testnets", value: "6" },
];

const FEATURES: Feature[] = [
  {
    icon: ReceiptText,
    title: "Onchain obligation ledger",
    body: "Record recurring or one-off costs with equal or custom member allocations. Every member resolves the same contract state.",
    meta: "Rooms · members · expenses · shares",
  },
  {
    icon: Combine,
    title: "Balance resolution",
    body: "Summarize each member's net position and group open shares by debtor and creditor so everyone sees the same queue.",
    meta: "Exact base-unit accounting",
  },
  {
    icon: CircleDollarSign,
    title: "Counterparty settlement",
    body: "Once allowance is available, a single settleWith call clears every open share the caller owes to a selected payee.",
    meta: "No pooled float",
  },
  {
    icon: Bot,
    title: "Spend-capped assistance",
    body: "Queue eligible debts, skip dust, stop at a per-run cap and keep transaction logs while the wallet stays in control.",
    meta: "Client-side · wallet approval",
  },
  {
    icon: RouteIcon,
    title: "Crosschain funding",
    body: "Bring canonical USDC from six supported testnets through Circle CCTP v2 before settling on Arc.",
    meta: "Burn · attest · mint",
  },
  {
    icon: FileCheck2,
    title: "Transaction-linked receipts",
    body: "Keep settlement details beside the Arc transaction hash so payment history can be checked independently.",
    meta: "Explorer-verifiable",
  },
];

const FLOW = [
  {
    icon: ReceiptText,
    kind: "Contract write",
    title: "Record obligations",
    body: "Add the payer, participants, allocation and amount to the shared ExpenseManager ledger.",
  },
  {
    icon: Combine,
    kind: "Contract view",
    title: "Resolve net positions",
    body: "Read workspace balances from one contract and reduce the obligation graph before money moves.",
  },
  {
    icon: CircleDollarSign,
    kind: "USDC transfer",
    title: "Settle exact amounts",
    body: "One settleWith call clears every open share owed to a selected counterparty.",
  },
  {
    icon: FileCheck2,
    kind: "Independent proof",
    title: "Verify the outcome",
    body: "Re-resolve balances, inspect the Arc transaction and retain a transaction-linked receipt.",
  },
];

const USE_CASES = [
  {
    tag: "Workspaces",
    icon: Users,
    title: "Distributed teams",
    body: "Track shared operating costs and project payouts without one teammate becoming the permanent spreadsheet admin.",
    points: ["Recurring and one-off obligations", "Custom member allocations", "Onchain history"],
  },
  {
    tag: "Communities",
    icon: Network,
    title: "Households and collectives",
    body: "Keep the original shared-living flow while supporting clubs, creator groups and other recurring-cost communities.",
    points: ["Flexible membership", "Transparent balances", "Direct member settlement"],
  },
  {
    tag: "Shared capital",
    icon: Layers,
    title: "Projects and syndicates",
    body: "Switch the same group model from splitting costs to distributing incoming revenue across participants.",
    points: ["Weighted payout planning", "Cost-first distribution", "Direct USDC payouts"],
  },
];

const CHAIN_PARAMS = [
  { label: "Chain ID", value: "5042002" },
  { label: "Native gas asset", value: "USDC" },
  { label: "USDC ERC-20", value: "0x3600…0000" },
  { label: "CCTP domain", value: "26" },
  { label: "RPC", value: "rpc.testnet.arc.network" },
  { label: "Explorer", value: "testnet.arcscan.app" },
];

const FAQ = [
  {
    q: "Does Nest ever hold my funds?",
    a: "No. Settlement moves approved USDC directly from the caller to the expense payer through the ERC-20 interface. The contract records rooms, membership, expenses, shares and settlement status — it never pools member balances.",
  },
  {
    q: "What does settleWith actually do?",
    a: "It clears every open share the caller owes to one selected counterparty in a single transaction, using exact base units. You approve an allowance first, then the transfer executes wallet-to-wallet.",
  },
  {
    q: "Is there a global debt-minimization algorithm?",
    a: "No, and Nest does not claim one. Balances are netted per counterparty and open shares are grouped by debtor and creditor, but there is no protocol-wide minimum-transfer solver.",
  },
  {
    q: "How does the settlement assistant stay safe?",
    a: "Queueing is client-side with dust filters and a per-run cap, and every transaction still needs wallet approval. The separate Business V2 contract adds an onchain session-key policy with expiry plus per-run and per-period USDC caps; a session key can only settle genuine open shares and cannot create expenses or make arbitrary transfers.",
  },
  {
    q: "Where does the USDC come from?",
    a: "You can fund Arc from six supported EVM testnets through Circle CCTP v2 — canonical burn, attestation and mint — then settle on Arc where gas is also paid in USDC.",
  },
  {
    q: "Is this real money?",
    a: "No. Everything currently runs on Arc Testnet, so all balances and transactions use testnet assets with no real-world monetary value.",
  },
  {
    q: "Has the code been audited?",
    a: "No. The contracts are testnet code and unaudited. Business V2, which includes a 50%-LTV USDC-collateral credit line, must receive an independent security review — including economic and liquidation design review — before any real-value deployment.",
  },
  {
    q: "Is there an SDK?",
    a: "Not yet. The deployed contract is callable directly, and a typed SDK plus an embeddable interface remain roadmap work rather than shipped features.",
  },
];

const FOOTER_NAV: {
  title: string;
  links: { label: string; href?: string; to?: string; external?: boolean }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Launch app", to: "/app" },
      { label: "Protocol", href: "#protocol" },
      { label: "How it works", href: "#how" },
      { label: "Use cases", href: "#protocol" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", to: "/docs" },
      { label: "Contract", href: CONTRACT_URL, external: true },
      { label: "GitHub", href: REPO_URL, external: true },
      { label: "Run locally", to: "/docs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Network config", href: "#network" },
      { label: "Explorer", href: EXPLORER_URL, external: true },
      { label: "Circle CCTP v2", href: "https://developers.circle.com/cctp", external: true },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Arc Testnet", href: "https://rpc.testnet.arc.network", external: true },
      { label: "Arcscan", href: EXPLORER_URL, external: true },
      { label: "Status", href: "#network" },
      { label: "License (MIT)", href: `${REPO_URL}/blob/main/LICENSE`, external: true },
    ],
  },
];

const SETTLEMENTS = [
  { from: "MA", to: "NO", amount: "21.40", fromColor: "bg-indigo-500", toColor: "bg-sky-500" },
  { from: "LI", to: "AR", amount: "17.60", fromColor: "bg-amber-500", toColor: "bg-emerald-500" },
  { from: "MA", to: "AR", amount: "9.20", fromColor: "bg-indigo-500", toColor: "bg-emerald-500" },
];
