import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Calculator,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Coins,
  Combine,
  FileCheck2,
  Globe2,
  House,
  Layers3,
  Link2,
  LockKeyhole,
  Network,
  ReceiptText,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NestLogo } from "@/components/nest/logo";
import { Reveal } from "@/components/nest/reveal";
import { ThemeToggle } from "@/components/nest/theme-toggle";

const CONTRACT_ADDRESS = "0x709cbAd88162b999882788155cde79aDe46A6D42";
const CONTRACT_URL = `https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`;
const GITHUB_URL = "https://github.com/sigmaserene1/Nest";

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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <a href="#" aria-label="Nest home" className="rounded-xl">
            <NestLogo />
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-[13px] font-semibold text-muted-foreground lg:flex"
          >
            <a href="#protocol" className="transition-colors hover:text-foreground">
              Protocol
            </a>
            <a href="#flow" className="transition-colors hover:text-foreground">
              Settlement flow
            </a>
            <a href="#use-cases" className="transition-colors hover:text-foreground">
              Use cases
            </a>
            <a href="#arc" className="transition-colors hover:text-foreground">
              Why Arc
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Launch app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="hero-grid absolute inset-0 -z-20" />
          <div aria-hidden className="hero-aurora absolute inset-x-0 top-0 -z-10 h-[760px]" />

          <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
            <div className="text-center lg:text-left">
              <div
                className="animate-pop-in inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/80 px-3.5 py-2 text-xs font-bold text-brand shadow-sm"
                style={{ animationDelay: "40ms" }}
              >
                <span className="live-dot h-2 w-2 rounded-full bg-brand" />
                Live on Arc Testnet
                <span className="h-3 w-px bg-brand/25" />
                Native USDC
              </div>

              <h1
                className="animate-float-in mt-7 font-display text-[3.3rem] leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[5.2rem]"
                style={{ animationDelay: "80ms" }}
              >
                One ledger.
                <br />
                <span className="text-brand">Clear every balance.</span>
              </h1>

              <p
                className="animate-float-in mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0 lg:max-w-xl"
                style={{ animationDelay: "130ms" }}
              >
                Nest is programmable group finance on Arc. Record shared expenses and payouts,
                resolve exact balances, then settle every open share peer-to-peer in native USDC.
              </p>

              <div
                className="animate-float-in mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                style={{ animationDelay: "180ms" }}
              >
                <Link
                  to="/app"
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold"
                >
                  Open a workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={CONTRACT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3.5 text-sm font-bold shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/40"
                >
                  View contract <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              <div
                className="animate-float-in mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground lg:justify-start"
                style={{ animationDelay: "230ms" }}
              >
                {["Non-custodial", "Contract-recorded state", "Circle CCTP v2"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <SettlementVisual />
          </div>
        </section>

        <section aria-label="Protocol facts" className="border-y border-border bg-card/60">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-border px-5 sm:grid-cols-4 sm:divide-y-0 lg:px-8">
            {PROOF.map((item) => (
              <div key={item.label} className="px-4 py-6 text-center">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-2 font-display text-lg font-bold sm:text-xl">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="protocol" className="scroll-mt-24 px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionHeading
                eyebrow="The protocol"
                title="One shared state for money between people"
                body="Nest turns informal IOUs into explicit onchain obligations. Every member resolves the same rooms, participants, balances and settlement history from ExpenseManager."
              />
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index % 3) * 60}>
                  <FeatureCard feature={feature} index={index + 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="flow"
          className="scroll-mt-24 border-y border-border bg-surface-muted/60 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Settlement flow"
                title="From many open shares to a clear settlement queue"
                body="The ledger and balance logic stay connected from the first obligation to the final receipt, so a workspace does not have to reconcile multiple sources of truth."
              />
            </Reveal>

            <div className="relative mt-16">
              <div
                aria-hidden
                className="flow-rail absolute left-6 top-0 hidden h-full w-px md:left-0 md:top-10 md:block md:h-px md:w-full"
              />
              <ol className="grid gap-5 md:grid-cols-4">
                {FLOW.map((step, index) => (
                  <Reveal key={step.title} delay={index * 70} as="li">
                    <article className="group relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/35">
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background shadow-sm transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
                          <step.icon className="h-5 w-5" />
                        </span>
                        <span className="font-mono text-[11px] font-bold text-muted-foreground">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                        {step.label}
                      </p>
                      <h3 className="mt-2 text-xl">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                    </article>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="use-cases" className="scroll-mt-24 px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <SectionHeading
                  align="left"
                  eyebrow="One engine, multiple groups"
                  title="Shared finance beyond the household"
                  body="The original roommate experience remains. The same obligation and settlement model also fits teams and project-based groups that need transparent shared balances."
                />
                <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end">
                  Nest is not positioning unbuilt modules as live products. These are supported
                  workspace patterns built from the existing group ledger, balance views, direct
                  settlement, capped client-side assistance and syndicate distribution mode.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {USE_CASES.map((useCase, index) => (
                <Reveal key={useCase.title} delay={index * 70}>
                  <article className="use-case-card group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8">
                    <div
                      aria-hidden
                      className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl transition-transform duration-500 group-hover:scale-150"
                    />
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <useCase.icon className="h-5 w-5" />
                    </span>
                    <p className="relative mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                      {useCase.kicker}
                    </p>
                    <h3 className="relative mt-2 text-2xl">{useCase.title}</h3>
                    <p className="relative mt-3 text-sm leading-6 text-muted-foreground">
                      {useCase.body}
                    </p>
                    <ul className="relative mt-6 space-y-2.5">
                      {useCase.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
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

        <section
          id="arc"
          className="scroll-mt-24 border-y border-border bg-foreground py-24 text-background sm:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-3 py-1.5 text-xs font-bold text-background/80">
                  <Zap className="h-3.5 w-3.5 text-brand" />
                  Purpose-built for Arc
                </span>
                <h2 className="mt-6 text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                  The settlement layer is part of the product.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-background/65">
                  Nest uses Arc because group settlement needs a stable unit, predictable execution
                  costs and fast finality—not because a blockchain badge belongs on the homepage.
                </p>
                <a
                  href={CONTRACT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-background/15 px-5 py-3 text-sm font-bold transition-colors hover:bg-background hover:text-foreground"
                >
                  Inspect ExpenseManager <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <div className="grid gap-px overflow-hidden rounded-3xl border border-background/10 bg-background/10 sm:grid-cols-2">
              {ARC_REASONS.map((reason, index) => (
                <Reveal key={reason.title} delay={index * 50}>
                  <article className="h-full bg-foreground p-7 transition-colors hover:bg-background/[0.04]">
                    <reason.icon className="h-5 w-5 text-brand" />
                    <h3 className="mt-5 text-lg text-background">{reason.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-background/60">{reason.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="border-b border-border p-8 sm:p-10 lg:border-b-0 lg:border-r">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success/10 text-success">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-success">
                      Verifiable by default
                    </p>
                    <h2 className="mt-3 text-3xl tracking-[-0.035em] sm:text-4xl">
                      Claims should resolve to evidence.
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      Nest exposes its deployed contract, transaction history and linked receipts.
                      Testnet status is stated clearly, and mainnet readiness is treated as security
                      work—not a configuration toggle.
                    </p>
                  </div>

                  <dl className="grid sm:grid-cols-2">
                    {EVIDENCE.map((item) => (
                      <div
                        key={item.label}
                        className="border-b border-border p-7 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                      >
                        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="mt-3 text-sm font-bold">{item.value}</dd>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-24 border-y border-border bg-surface-muted/60 py-24 sm:py-32"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                  Clear answers
                </span>
                <h2 className="mt-6 text-4xl tracking-[-0.04em] sm:text-5xl">
                  Questions builders and users should ask
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                  No hidden mainnet claims, no vague custody language and no pretending roadmap
                  items already exist.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <Accordion
                type="single"
                collapsible
                className="overflow-hidden rounded-2xl border border-border bg-card px-6 sm:px-8"
              >
                {FAQS.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`item-${index}`}
                    className="last:border-b-0"
                  >
                    <AccordionTrigger className="py-6 text-left text-base font-bold hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-2xl pb-6 text-sm leading-6 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 sm:py-32 lg:px-8">
          <Reveal>
            <div className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand px-7 py-16 text-center text-white sm:px-12 sm:py-20">
              <div aria-hidden className="cta-orbit absolute inset-0" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  Group settlement, without the spreadsheet
                </span>
                <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] tracking-[-0.045em] sm:text-6xl">
                  Give shared money one source of truth.
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                  Create a workspace, record obligations and complete your first native-USDC
                  settlement on Arc Testnet.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand transition-transform hover:-translate-y-0.5"
                  >
                    Launch Nest <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                  >
                    Read the source <Code2 className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <NestLogo />
            <p className="mt-3 max-w-sm text-xs leading-5 text-muted-foreground">
              Programmable group finance on Arc Testnet. Testnet assets have no real-world value.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground">
            <Link to="/app" className="hover:text-foreground">
              App
            </Link>
            <a
              href={CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Contract
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SettlementVisual() {
  return (
    <div
      className="animate-float-in relative mx-auto w-full max-w-xl"
      style={{ animationDelay: "150ms" }}
    >
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-[3rem] bg-brand/10 blur-3xl" />
      <div className="settlement-panel overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/90 shadow-2xl shadow-foreground/10 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold">August settlement</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Distributed studio · 6 members
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
            Ready
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-6">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Before
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">12 open shares</span>
            </div>
            <div className="relative mt-5 h-40">
              <div className="absolute inset-0">
                {BEFORE_LINES.map((line) => (
                  <span
                    key={line.className}
                    aria-hidden
                    className={`obligation-line ${line.className}`}
                  />
                ))}
              </div>
              {BEFORE_NODES.map((node) => (
                <span
                  key={node.name}
                  className={`absolute grid h-9 w-9 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-white shadow-md ${node.className} ${node.position}`}
                  title={node.name}
                >
                  {node.initials}
                </span>
              ))}
              <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-foreground text-background shadow-lg">
                <Network className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:flex-col">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/20">
              <Combine className="h-4 w-4" />
            </span>
            <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.12em] text-brand sm:ml-0 sm:mt-2">
              Group
            </span>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-brand-soft/45 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                After
              </span>
              <span className="font-mono text-[10px] text-brand">3 counterparties</span>
            </div>
            <div className="mt-5 space-y-3">
              {SETTLEMENTS.map((settlement, index) => (
                <div
                  key={settlement.from + settlement.to}
                  className="settlement-row flex items-center gap-2 rounded-xl border border-brand/10 bg-card/80 p-2.5"
                  style={{ animationDelay: `${900 + index * 240}ms` }}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-white ${settlement.fromColor}`}
                  >
                    {settlement.from}
                  </span>
                  <span className="transfer-track relative h-px flex-1 bg-brand/20">
                    <span className="transfer-particle absolute -top-1 h-2 w-2 rounded-full bg-brand" />
                  </span>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[9px] font-bold text-white ${settlement.toColor}`}
                  >
                    {settlement.to}
                  </span>
                  <span className="min-w-14 text-right font-mono text-[9px] font-bold">
                    {settlement.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-success/10 px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Grouped for settlement
              </span>
              <span className="font-mono text-[10px] font-bold">48.20 USDC</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/35 px-5 py-4 text-[10px] font-semibold text-muted-foreground sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5" />
            Wallet-to-wallet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-brand" />
            Arc finality · ~1 second
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            Receipt on completion
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
      <h2 className="mt-6 text-4xl leading-[1.06] tracking-[-0.045em] sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Capability; index: number }) {
  return (
    <article className="protocol-card group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm">
      <div
        aria-hidden
        className="absolute right-5 top-4 font-display text-5xl font-bold text-muted/60 transition-colors group-hover:text-brand-soft"
      >
        {String(index).padStart(2, "0")}
      </div>
      <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
        <feature.icon className="h-5 w-5" />
      </span>
      <h3 className="relative mt-6 text-xl">{feature.title}</h3>
      <p className="relative mt-3 text-sm leading-6 text-muted-foreground">{feature.body}</p>
      <div className="relative mt-6 flex items-center gap-2 text-[11px] font-bold text-foreground">
        <span className="h-px w-6 bg-brand" />
        {feature.proof}
      </div>
    </article>
  );
}

type Capability = {
  icon: LucideIcon;
  title: string;
  body: string;
  proof: string;
};

const PROOF = [
  { label: "Settlement asset", value: "Native USDC" },
  { label: "Finality", value: "Sub-second" },
  { label: "CCTP domain", value: "26" },
  { label: "Source testnets", value: "6" },
];

const CAPABILITIES: Capability[] = [
  {
    icon: ReceiptText,
    title: "Onchain obligation ledger",
    body: "Record recurring or one-off costs with equal or custom member allocations. Members resolve the same contract state.",
    proof: "Rooms, members, expenses and shares",
  },
  {
    icon: Calculator,
    title: "Balance resolution",
    body: "Summarize each member's net position and group open shares by debtor and creditor so everyone sees the same settlement queue.",
    proof: "Exact base-unit accounting",
  },
  {
    icon: CircleDollarSign,
    title: "Counterparty settlement",
    body: "After allowance is available, one settleWith call clears every open share the caller owes to a selected payee.",
    proof: "Exact USDC amounts, no pooled float",
  },
  {
    icon: Bot,
    title: "Spend-capped assistance",
    body: "Queue eligible debts, skip dust, stop at a per-run cap and retain transaction logs while the wallet remains in control.",
    proof: "Client-side controls, wallet approval",
  },
  {
    icon: RouteIcon,
    title: "Crosschain funding",
    body: "Bring canonical USDC from six supported testnets through Circle CCTP v2 before settling on Arc.",
    proof: "Burn, attest and mint",
  },
  {
    icon: FileCheck2,
    title: "Transaction-linked receipts",
    body: "Keep settlement details beside the Arc transaction hash so payment history can be checked independently in the explorer.",
    proof: "Explorer-verifiable transaction",
  },
];

const FLOW = [
  {
    icon: Layers3,
    label: "Contract write",
    title: "Record obligations",
    body: "Add the payer, participants, allocation and amount to the shared ExpenseManager ledger.",
  },
  {
    icon: Combine,
    label: "Contract view",
    title: "Resolve net positions",
    body: "Read workspace balances from one contract and reduce the obligation graph before money moves.",
  },
  {
    icon: WalletCards,
    label: "USDC transfer",
    title: "Settle exact amounts",
    body: "After sufficient allowance, one settleWith call clears every open share owed to a selected counterparty.",
  },
  {
    icon: BadgeCheck,
    label: "Independent proof",
    title: "Verify the outcome",
    body: "Re-resolve balances, inspect the Arc transaction and retain a transaction-linked receipt.",
  },
];

const USE_CASES = [
  {
    icon: BriefcaseBusiness,
    kicker: "Workspaces",
    title: "Distributed teams",
    body: "Track shared operating costs and project payouts without one teammate becoming the permanent spreadsheet administrator.",
    points: [
      "Recurring and one-off obligations",
      "Custom member allocations",
      "Onchain settlement history",
    ],
  },
  {
    icon: Users,
    kicker: "Communities",
    title: "Households and collectives",
    body: "Keep the original shared-living flow while supporting clubs, creator groups and other communities with recurring costs.",
    points: ["Flexible group membership", "Transparent balances", "Direct member settlement"],
  },
  {
    icon: House,
    kicker: "Shared capital",
    title: "Projects and syndicates",
    body: "Switch the same group model from splitting costs to distributing incoming revenue across participants.",
    points: ["Weighted payout planning", "Cost-first distribution", "Direct USDC payouts"],
  },
];

const ARC_REASONS = [
  {
    icon: Coins,
    title: "Stable unit from gas to settlement",
    body: "USDC is both Arc's native gas asset and Nest's accounting and settlement unit, reducing two-token friction.",
  },
  {
    icon: Zap,
    title: "Deterministic finality",
    body: "A completed settlement does not sit through probabilistic confirmation states before a group can trust the result.",
  },
  {
    icon: Link2,
    title: "Circle-native liquidity",
    body: "CCTP v2 routes canonical USDC into Arc through a burn-and-mint flow instead of wrapped representations.",
  },
  {
    icon: Globe2,
    title: "A global settlement surface",
    body: "The same contract and stable unit can serve participants across borders without introducing a bank-owned group account.",
  },
];

const EVIDENCE = [
  {
    label: "Network",
    value: "Arc Testnet · Chain ID 5042002",
    note: "Every live flow currently uses testnet assets with no real-world value.",
  },
  {
    label: "ExpenseManager",
    value: "0x709c…6D42",
    note: "The canonical contract address is published and linked to Arcscan.",
  },
  {
    label: "Custody model",
    value: "Wallet-to-wallet settlement",
    note: "Nest records obligations and settlement events; it does not operate a pooled customer balance.",
  },
  {
    label: "Mainnet posture",
    value: "Security work required",
    note: "Mainnet deployment will require contract review, verified deployment and operational readiness.",
  },
];

const FAQS = [
  {
    question: "What is Nest?",
    answer:
      "Nest is a group-finance protocol and application on Arc Testnet. It records shared obligations, resolves workspace balances and lets members settle peer-to-peer in native USDC.",
  },
  {
    question: "Is the roommate-expense product being removed?",
    answer:
      "No. Shared households remain a primary workspace pattern. The broader positioning reflects that the same ledger and settlement engine also supports teams, communities and project groups.",
  },
  {
    question: "What information is stored onchain?",
    answer:
      "Rooms, membership, expenses, participant shares, settlement status and related activity are resolved from ExpenseManager. Onchain information is public, so users should not place private or sensitive information in descriptions.",
  },
  {
    question: "Does Nest hold or custody group funds?",
    answer:
      "No pooled float is required for expense settlement. USDC moves wallet-to-wallet when the payer approves and executes settlement through the contract. Optional lending interactions have separate smart-contract risk.",
  },
  {
    question: "How does balance aggregation help?",
    answer:
      "Nest summarizes what each member owes and is owed, then groups open expense shares by debtor and creditor. A settleWith call can clear every open share the caller owes to one counterparty; Nest does not claim a global minimum-transfer algorithm.",
  },
  {
    question: "Why does Nest use Arc?",
    answer:
      "Arc uses USDC as native gas, offers fast deterministic settlement and integrates directly with Circle infrastructure. Those properties reduce friction for a product whose accounting and final payments are already denominated in USDC.",
  },
  {
    question: "Can members fund Nest from another chain?",
    answer:
      "Yes on testnet. The current bridge flow uses Circle CCTP v2 to burn native testnet USDC on a supported source chain, retrieve Circle's attestation and mint canonical testnet USDC on Arc.",
  },
  {
    question: "What can an automated agent do?",
    answer:
      "The current assistant is client-side: it builds a queue, applies a dust threshold and per-run cap, then walks approved settlements while logging transaction hashes. It does not receive unrestricted or autonomous treasury authority, and wallet authorization is still required.",
  },
  {
    question: "Can another Arc application integrate Nest?",
    answer:
      "The deployed ExpenseManager contract is publicly callable today. A polished typed SDK and embeddable settlement interface are roadmap items and are not claimed as currently available.",
  },
  {
    question: "Is Nest ready for Arc mainnet?",
    answer:
      "Nest currently runs on Arc Testnet. Moving to mainnet is not described as a simple configuration change: it requires an independent security review, verified contracts, production monitoring and a deliberate deployment process.",
  },
  {
    question: "Is the USDC shown in the app real money?",
    answer:
      "No. Current balances and transactions use testnet USDC, which has no real-world monetary value. Users should verify the selected network before signing any transaction.",
  },
];

const BEFORE_NODES = [
  { name: "Maya", initials: "MA", className: "bg-indigo-500", position: "left-0 top-2" },
  { name: "Noah", initials: "NO", className: "bg-sky-500", position: "right-0 top-3" },
  { name: "Lina", initials: "LI", className: "bg-amber-500", position: "bottom-0 left-5" },
  { name: "Ari", initials: "AR", className: "bg-emerald-500", position: "bottom-1 right-4" },
];

const BEFORE_LINES = [
  { className: "left-[18%] top-[24%] w-[62%] rotate-[4deg]" },
  { className: "left-[20%] top-[58%] w-[58%] -rotate-[7deg]" },
  { className: "left-[22%] top-[45%] w-[28%] rotate-[55deg]" },
  { className: "right-[18%] top-[48%] w-[30%] -rotate-[57deg]" },
];

const SETTLEMENTS = [
  { from: "MA", to: "NO", amount: "21.40", fromColor: "bg-indigo-500", toColor: "bg-sky-500" },
  { from: "LI", to: "AR", amount: "17.60", fromColor: "bg-amber-500", toColor: "bg-emerald-500" },
  { from: "MA", to: "AR", amount: "9.20", fromColor: "bg-indigo-500", toColor: "bg-emerald-500" },
];
