import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useAccount, useConnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Calculator,
  Check,
  CheckCircle2,
  CircleDollarSign,
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
import { useArcEnvironment } from "@/lib/arc-network";
import { SignInDialog } from "@/components/nest/sign-in-dialog";
import { Button } from "@/components/ui/button";
import { TreasuryScene } from "@/components/nest/treasury-scene";

const NAV_LINKS = [
  { label: "How it works", href: "#flow" },
  { label: "Use cases", href: "#use-cases" },
  { label: "FAQ", href: "#faq" },
] as const;

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Nest — Shared treasury and USDC settlement on Arc" },
      {
        name: "description",
        content:
          "Nest is a shared USDC treasury and settlement app on Arc. Pool funds, coordinate approvals, manage group obligations and settle payments in native USDC.",
      },
      { property: "og:title", content: "Nest — Shared treasury. Clear every balance." },
      {
        property: "og:description",
        content:
          "Shared USDC treasury, approval-controlled payments, recurring payouts, delegated budgets, group obligations and transaction-linked settlement on Arc.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nestarc.xyz/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Nest — Shared treasury on Arc" },
      {
        name: "twitter:description",
        content:
          "Pool USDC, coordinate treasury approvals, manage shared obligations and settle payments on Arc.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Nest",
              url: "https://nestarc.xyz/",
              logo: "https://nestarc.xyz/favicon.ico",
            },
            {
              "@type": "WebSite",
              name: "Nest — Shared treasury and USDC settlement on Arc",
              url: "https://nestarc.xyz/",
            },
          ],
        }),
      },
    ],
  }),
});

function useEnterApp() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { error: connectError } = useConnect();
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (requested && isConnected) {
      setRequested(false);
      setError(null);
      void navigate({ to: "/app" });
    }
  }, [requested, isConnected, navigate]);

  // Google OAuth reloads the page, so React's local `requested` flag is lost.
  // Circle sets this marker only after the embedded wallet session is fully
  // restored; send the user straight into the app once wagmi reconnects it.
  useEffect(() => {
    if (!isConnected || typeof window === "undefined") return;
    if (window.localStorage.getItem("nest.circle.authComplete") !== "1") return;
    window.localStorage.removeItem("nest.circle.authComplete");
    setRequested(false);
    setError(null);
    void navigate({ to: "/app" });
  }, [isConnected, navigate]);

  useEffect(() => {
    if (wasOpen.current && !connectModalOpen && requested && !isConnected) {
      setRequested(false);
      setError(
        connectError?.message ??
          "Wallet connection was cancelled. Try again to open your workspace.",
      );
    }
    wasOpen.current = connectModalOpen;
  }, [connectModalOpen, requested, isConnected, connectError]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const openWallet = () => {
    if (!openConnectModal) {
      setRequested(false);
      setError("Wallet connection is still loading. Please try again in a moment.");
      return;
    }
    setRequested(true);
    openConnectModal();
  };

  const enter = () => {
    setError(null);
    if (isConnected) {
      void navigate({ to: "/app" });
      return;
    }
    setRequested(true);
    setDialogOpen(true);
  };

  const onDialogChange = (o: boolean) => {
    setDialogOpen(o);
    if (!o) setRequested(false);
  };

  const onAuthenticated = () => {
    setRequested(false);
    setError(null);
    setDialogOpen(false);
    void navigate({ to: "/app" });
  };

  const dialog = (
    <SignInDialog
      open={dialogOpen}
      onOpenChange={onDialogChange}
      onWallet={openWallet}
      onAuthenticated={onAuthenticated}
    />
  );

  return { enter, error, pending: requested && !dialogOpen, dialog };
}

function Landing() {
  const environment = useArcEnvironment();
  const { enter, error: connectIssue, pending: connecting, dialog } = useEnterApp();

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(window.location.hash);
      const header = document.querySelector<HTMLElement>("[data-landing-header]");
      if (!target) return;
      const headerHeight = Math.ceil(header?.getBoundingClientRect().height ?? 0);
      target.style.scrollMarginTop = `${headerHeight + 12}px`;
      target.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const scrollToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("#")) return;
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;

    event.preventDefault();

    const header = document.querySelector<HTMLElement>("[data-landing-header]");
    const headerHeight = Math.ceil(header?.getBoundingClientRect().height ?? 0);

    target.style.scrollMarginTop = `${headerHeight + 12}px`;
    window.history.replaceState(null, "", href);
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-background">
      {dialog}
      <header
        data-landing-header
        className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <a href="#" aria-label="Nest home" className="rounded-xl">
            <NestLogo />
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-[13px] font-semibold text-muted-foreground lg:flex"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => scrollToSection(event, item.href)}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link to="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={enter} className="h-10 rounded-full bg-foreground px-4 text-xs text-background hover:bg-foreground/90">
              {connecting ? "Connecting…" : "Launch app"} <ArrowRight />
            </Button>
          </div>
        </div>

        <nav
          aria-label="Landing page sections"
          className="mx-auto flex max-w-7xl snap-x gap-2 overflow-x-auto px-5 pb-3 lg:hidden lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => scrollToSection(event, item.href)}
              className="shrink-0 snap-start rounded-full border border-border bg-card/80 px-3.5 py-2 text-[11px] font-bold text-muted-foreground shadow-sm transition-colors hover:border-brand/35 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/docs"
            className="shrink-0 snap-start rounded-full border border-border bg-card/80 px-3.5 py-2 text-[11px] font-bold text-muted-foreground shadow-sm transition-colors hover:border-brand/35 hover:text-foreground"
          >
            Docs
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero relative isolate overflow-hidden">
          <div className="relative z-10 mx-auto max-w-5xl px-5 pt-12 text-center sm:pt-16 lg:pt-20">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Built on Arc <span className="mx-1 text-border">/</span>
              {environment === "mainnet" ? "Mainnet" : "Testnet"}
            </p>
            <h1 className="landing-headline mt-5 font-display font-semibold">
              Shared treasury.<br />
              <span className="font-quote font-normal italic text-brand">Clear every balance.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Shared money, beautifully in sync. Track expenses and settle together in USDC on Arc.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={enter} className="h-12 rounded-full bg-brand px-6 text-brand-foreground shadow-brand hover:bg-brand/90">
                {connecting ? "Connecting…" : "Launch Nest"} <ArrowRight />
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full bg-background/80 px-5">
                <Link to="/docs"><BookOpen /> Explore docs</Link>
              </Button>
            </div>
            {connectIssue && <p role="alert" className="mx-auto mt-3 max-w-lg text-xs font-semibold text-brand">{connectIssue}</p>}
          </div>
          <TreasuryScene />
          <div className="hero-caption relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pb-6 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
            <span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" /> Your wallet. Your money.</span>
            <span className="flex items-center gap-2"><CircleDollarSign className="h-3.5 w-3.5 text-info" /> Native USDC</span>
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

        <section id="protocol" className="scroll-mt-32 px-5 py-16 sm:scroll-mt-24 sm:py-24 lg:px-8">
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
          className="scroll-mt-32 border-y border-border bg-surface-muted/60 py-16 sm:scroll-mt-24 sm:py-24"
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
                    <article className="group relative h-full rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/35">
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

        <section
          id="use-cases"
          className="scroll-mt-32 px-5 py-16 sm:scroll-mt-24 sm:py-24 lg:px-8"
        >
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
                  <article className="use-case-card group relative h-full overflow-hidden rounded-lg border border-border bg-card p-8">
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
          className="scroll-mt-32 border-y border-border bg-foreground py-24 text-background sm:scroll-mt-24 sm:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-3 py-1.5 text-xs font-bold text-background/80">
                  <Zap className="h-3.5 w-3.5 text-brand" />
                  Purpose-built for Arc
                </span>
                <h2 className="mt-6 text-3xl leading-[1.08] tracking-normal sm:text-5xl">
                  The settlement layer is part of the{" "}
                  <span className="font-quote font-normal italic text-brand">product.</span>
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-background/65">
                  Nest uses Arc because group settlement needs a stable unit, predictable execution
                  costs and fast finality—not because a blockchain badge belongs on the homepage.
                </p>
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


        <section
          id="faq"
          className="scroll-mt-32 border-y border-border bg-surface-muted/60 py-16 sm:scroll-mt-24 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                  Clear answers
                </span>
                <h2 className="mt-6 text-3xl tracking-normal sm:text-5xl">
                  Questions builders and users should ask
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                  No vague custody language and no pretending roadmap items already exist.
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

        <section className="px-5 py-16 sm:py-24 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-6xl px-7 py-8 text-center text-foreground sm:px-12 sm:py-12">
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  Group settlement, without the spreadsheet
                </span>
                <h2 className="mx-auto mt-6 max-w-3xl text-3xl leading-[1.06] tracking-normal sm:text-6xl sm:leading-[1.02]">
                  Give shared money one{" "}
                  <span className="font-quote font-normal italic tracking-normal">
                    source of truth.
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Create a workspace, record obligations and complete your first native-USDC
                  settlement on Arc.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Button onClick={enter} size="lg" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
                    {connecting ? "Connecting…" : "Launch Nest"} <ArrowRight />
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/docs">Docs <BookOpen /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-[1fr_auto] sm:items-end lg:px-8">
          <div>
            <NestLogo />
            <p className="mt-3 max-w-lg text-xs leading-5 text-muted-foreground">
              Independent group-finance software built on Arc with native USDC settlement and Circle-powered wallet onboarding.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Built on Arc</span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Native USDC</span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Circle Wallets</span>
            </div>
          </div>
          <div className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted-foreground sm:justify-end">
            <Button variant="link" onClick={enter} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">App</Button>
            <Link to="/docs" className="hover:text-foreground">Docs</Link>
            <Link to="/guides/split-expenses-with-friends" className="hover:text-foreground">Splitting guide</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <a
              href="#faq"
              onClick={(event) => scrollToSection(event, "#faq")}
              className="hover:text-foreground"
            >
              FAQ
            </a>
          </div>
        </div>
      </footer>
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
      <h2 className="mt-6 text-3xl leading-[1.08] tracking-normal sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Capability; index: number }) {
  return (
    <article className="protocol-card group relative h-full overflow-hidden rounded-lg border border-border bg-card p-7 shadow-sm">
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


const FAQS = [
  {
    question: "What is Nest?",
    answer:
      "Nest is a group-finance protocol and application on Arc. Mainnet and Testnet are isolated so workspaces, balances and contract state never mix.",
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
    question: "Is the USDC shown in the app real money?",
    answer:
      "No. Current balances and transactions use testnet USDC, which has no real-world monetary value. Users should verify the selected network before signing any transaction.",
  },
];

