import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Combine,
  FileCheck2,
  Network,
  ReceiptText,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";
import { NestLogo } from "@/components/nest/logo";
import { Reveal } from "@/components/nest/reveal";

const CONTRACT_ADDRESS = "0x709cbAd88162b999882788155cde79aDe46A6D42";
const CONTRACT_URL = `https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Contract", href: CONTRACT_URL, external: true },
] as const;

export const Route = createFileRoute("/")({
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
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#07051a]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 lg:px-8">
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
                {...("external" in item && item.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c6cff] to-[#b45cf0] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(124,108,255,0.35)] transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            Launch app <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="landing-stars absolute inset-0 -z-20" />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[720px]"
            style={{
              background:
                "radial-gradient(circle at 68% 8%, rgba(124,108,255,0.26), transparent 32rem), radial-gradient(circle at 18% 22%, rgba(34,211,238,0.13), transparent 26rem), radial-gradient(circle at 50% 60%, rgba(236,72,153,0.08), transparent 30rem)",
            }}
          />
          <div aria-hidden className="aurora-orb aurora-orb--violet -z-10 left-[8%] top-24 h-72 w-72" />
          <div aria-hidden className="aurora-orb aurora-orb--cyan -z-10 right-[6%] top-40 h-80 w-80" />
          <div aria-hidden className="aurora-orb aurora-orb--pink -z-10 left-[40%] top-[26rem] h-64 w-64" />

          <div className="mx-auto flex max-w-6xl flex-col items-center px-5 pb-10 pt-20 text-center sm:pt-28 lg:px-8">
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
              <span className="text-gradient-web3">Clear every balance.</span>
            </h1>

            <p
              className="animate-float-in mx-auto mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg"
              style={{ animationDelay: "130ms" }}
            >
              Record shared obligations, resolve exact balances, then settle peer-to-peer in
              native USDC — all from one calm command center on Arc.
            </p>

            <div
              className="animate-float-in mt-9 flex flex-wrap justify-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                to="/app"
                className="pulse-ring inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7c6cff] via-[#8a6bff] to-[#b45cf0] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(124,108,255,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                Open a workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={CONTRACT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/25"
              >
                Inspect the contract <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <HeroPanel />
        </section>

        {/* Stats strip */}
        <section aria-label="Protocol facts" className="px-5 lg:px-8">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4">
            {PROOF.map((item) => (
              <div key={item.label} className="bg-[#0c0925] px-4 py-6 text-center">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {item.label}
                </dt>
                <dd className="mt-2 font-display text-lg font-bold text-white sm:text-xl">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-28 px-5 py-20 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#7c6cff]/12 px-3 py-1.5 text-xs font-bold text-[#b3a9ff]">
                  <Sparkles className="h-3.5 w-3.5" />
                  One shared ledger
                </span>
                <h2 className="mt-6 font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
                  Everything a group needs to settle cleanly.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/50">
                  Nest turns informal IOUs into explicit onchain obligations on Arc. Every member
                  reads the same rooms, balances and settlement history from ExpenseManager.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 4) * 60}>
                  <article className="holo-border group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#7c6cff]/12 text-[#a394ff] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="scroll-mt-28 border-y border-white/[0.07] bg-white/[0.02] px-5 py-20 sm:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display text-4xl leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl">
                  Record. Resolve. Settle.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/50">
                  From an open expense to a verified receipt in three onchain steps.
                </p>
              </div>
            </Reveal>

            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {FLOW.map((step, index) => (
                <Reveal key={step.title} delay={index * 70} as="li">
                  <article className="relative h-full rounded-2xl border border-white/[0.08] bg-[#0c0925] p-6">
                    <span className="font-mono text-[11px] font-bold text-[#7c6cff]">
                      0{index + 1}
                    </span>
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

        {/* CTA */}
        <section className="px-5 py-20 sm:py-28 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#7c6cff]/25 bg-gradient-to-b from-[#1a1244] to-[#0c0925] px-7 py-16 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(124,108,255,0.3), transparent 60%), radial-gradient(circle at 12% 90%, rgba(34,211,238,0.12), transparent 40%), radial-gradient(circle at 88% 85%, rgba(236,72,153,0.12), transparent 40%)",
                }}
              />
              <div aria-hidden className="aurora-orb aurora-orb--cyan left-[-4rem] top-[-4rem] h-56 w-56" />
              <div aria-hidden className="aurora-orb aurora-orb--pink bottom-[-5rem] right-[-3rem] h-64 w-64" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/75">
                  <CircleDollarSign className="h-3.5 w-3.5 text-[#a394ff]" />
                  Group settlement, without the spreadsheet
                </span>
                <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.045em] text-white sm:text-6xl">
                  Give shared money <span className="text-gradient-web3">one source of truth.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                  Create a workspace and complete your first native-USDC settlement on Arc
                  Testnet in minutes.
                </p>
                <div className="mt-9">
                  <Link
                    to="/app"
                    className="pulse-ring inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7c6cff] via-[#8a6bff] to-[#b45cf0] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_40px_rgba(124,108,255,0.45)] transition-transform hover:-translate-y-0.5"
                  >
                    Launch Nest <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="text-white">
            <NestLogo />
            <p className="mt-3 max-w-sm text-xs leading-5 text-white/40">
              Programmable group finance on Arc Testnet. Testnet assets have no real-world value.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/50">
            <Link to="/app" className="transition-colors hover:text-white">
              App
            </Link>
            <a
              href={CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Contract
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroPanel() {
  return (
    <div
      className="animate-float-in mx-auto w-full max-w-5xl px-5 pb-20 lg:px-8"
      style={{ animationDelay: "220ms" }}
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-10 -z-10 rounded-[3rem] blur-3xl"
          style={{ background: "rgba(124,108,255,0.14)" }}
        />
        <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0d0a26]/95 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="live-dot h-2 w-2 rounded-full bg-[#7c6cff]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a394ff]">
                Nest cockpit
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              Oracle synced
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1.1fr_1fr]">
            {/* Balance card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Workspace position
              </p>
              <p className="mt-3 font-display text-3xl font-bold text-white">
                48.20<span className="ml-1 text-sm font-semibold text-white/40">USDC</span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> 3 open shares this month
              </p>
              <div className="mt-5 space-y-2 text-xs text-white/50">
                <div className="flex justify-between">
                  <span>You are owed</span>
                  <span className="font-mono font-bold text-white/80">48.20</span>
                </div>
                <div className="flex justify-between">
                  <span>You owe</span>
                  <span className="font-mono font-bold text-white/80">0.00</span>
                </div>
              </div>
            </div>

            {/* Assistant card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#7c6cff]/20 bg-[#7c6cff]/[0.06] p-5 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-[#7c6cff]/40 bg-[#7c6cff]/15 text-[#b3a9ff] shadow-[0_0_32px_rgba(124,108,255,0.35)]">
                <Bot className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
                Settlement assistant
              </p>
              <p className="mt-2 font-display text-xl font-bold text-white">
                Your queue is ready.
              </p>
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

            {/* Settlements card */}
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
                    <span className="min-w-14 text-right font-mono text-[9px] font-bold text-white/75">
                      {s.amount}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-400/10 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Grouped for settlement
                </span>
                <span className="font-mono text-[10px] font-bold text-white/80">48.20 USDC</span>
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

type Feature = { icon: LucideIcon; title: string; body: string };

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
    body: "Rooms, members, expenses and shares recorded once in ExpenseManager — every member resolves the same state.",
  },
  {
    icon: CircleDollarSign,
    title: "Exact USDC settlement",
    body: "One settleWith call clears every open share owed to a counterparty. Exact base units, no pooled float.",
  },
  {
    icon: Bot,
    title: "Spend-capped assistant",
    body: "Queue eligible debts, skip dust and stop at a per-run cap while your wallet keeps full approval control.",
  },
  {
    icon: RouteIcon,
    title: "CCTP crosschain funding",
    body: "Bring canonical USDC from six supported testnets through Circle CCTP v2 before settling on Arc.",
  },
];

const FLOW = [
  {
    icon: ReceiptText,
    title: "Record obligations",
    body: "Add the payer, participants, allocation and amount to the shared onchain ledger.",
  },
  {
    icon: Combine,
    title: "Resolve net positions",
    body: "Read workspace balances from one contract and group open shares by debtor and creditor.",
  },
  {
    icon: FileCheck2,
    title: "Settle and verify",
    body: "Approve once, settle exact USDC amounts, and keep an explorer-verifiable receipt.",
  },
];

const SETTLEMENTS = [
  { from: "MA", to: "NO", amount: "21.40", fromColor: "bg-indigo-500", toColor: "bg-sky-500" },
  { from: "LI", to: "AR", amount: "17.60", fromColor: "bg-amber-500", toColor: "bg-emerald-500" },
  { from: "MA", to: "AR", amount: "9.20", fromColor: "bg-indigo-500", toColor: "bg-emerald-500" },
];
