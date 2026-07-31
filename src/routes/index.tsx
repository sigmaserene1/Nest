import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wallet, Users, Zap, Link2, Receipt, Calculator, Send, CheckCircle2 } from "lucide-react";
import { NestLogo } from "@/components/nest/logo";
import { ArcMark } from "@/components/nest/chain";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Nest — Shared living, effortlessly settled" },
      {
        name: "description",
        content:
          "The premium way to split rent, groceries, and life with your roommates. Instant USDC settlement on Arc.",
      },
      { property: "og:title", content: "Nest — Shared living, effortlessly settled" },
      { property: "og:description", content: "Split rent, groceries, and life. Instantly settled in USDC." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <NestLogo />
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Open app <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background animate-float-in">
          <ArcMark size={18} className="rounded-md ring-1 ring-white/20" /> Built on Arc
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl animate-float-in">
          Shared living,
          <br />
          <span className="bg-gradient-to-r from-brand to-orange-500 bg-clip-text text-transparent">
            effortlessly settled
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground animate-float-in">
          The beautiful way to split rent, groceries, and life with your roommates. Every payment — and every gas
          fee — is paid in USDC.
        </p>

        <div className="mt-8 flex justify-center gap-3 animate-float-in">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-sm font-semibold ring-1 ring-border transition hover:bg-muted"
          >
            See how it works
          </a>
        </div>

        <div className="glass-strong mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 rounded-[32px] p-8 sm:grid-cols-3 animate-pop-in">
          {[
            { icon: Wallet, title: "Instant USDC", body: "Sub-second settlement. No IOUs, no chasing." },
            { icon: Users, title: "Roommate friendly", body: "Beautiful shared home, built for real life." },
            { icon: Zap, title: "One-tap settle", body: "Auto-simplified debts. Pay everyone at once." },
          ].map((f) => (
            <div key={f.title} className="text-left">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          <Link2 className="h-3.5 w-3.5" /> Onchain settlement
        </span>
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          How roommates settle on{" "}
          <span className="bg-gradient-to-r from-brand to-orange-500 bg-clip-text text-transparent">Arc</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          From splitting groceries to an onchain USDC transfer — here's the full flow, step by step.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-[24px] bg-card p-6 text-left shadow-sm ring-1 ring-border/70 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <s.icon className="h-5 w-5" />
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    s.onchain
                      ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                      : "bg-[#2775CA]/10 text-[#2775CA] ring-1 ring-[#2775CA]/20"
                  }`}
                >
                  {s.onchain ? "Onchain" : "Off-chain"}
                </span>
              </div>
              <div className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span className="absolute right-4 top-1/2 hidden h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground lg:grid">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="glass-strong mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-[28px] p-8 sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <ArcMark size={40} />
            <div>
              <div className="text-sm font-bold">Every settlement is a real Arc transaction</div>
              <div className="text-xs text-muted-foreground">
                Signed by your wallet, verifiable on Arcscan, paid in Circle USDC.
              </div>
            </div>
          </div>
          <Link
            to="/app"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.02]"
          >
            Settle onchain <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    icon: Receipt,
    title: "Track shared expenses",
    body: "Every roommate logs expenses — rent, groceries, utilities. Nest tracks who paid and how the cost splits across the household.",
    onchain: false,
  },
  {
    icon: Calculator,
    title: "Auto-simplify debts",
    body: "Nest minimizes transfers. Instead of everyone paying everyone, it calculates the fewest settlements needed to clear all balances.",
    onchain: false,
  },
  {
    icon: Send,
    title: "Settle onchain with USDC",
    body: "Tap settle and your wallet sends the exact USDC amount directly to your roommate's wallet on Arc Testnet. No middleman, no IOUs.",
    onchain: true,
  },
  {
    icon: CheckCircle2,
    title: "Confirmed in seconds",
    body: "Arc's sub-second finality means the transaction is confirmed and verifiable on Arcscan within ~1 second. Balances update instantly.",
    onchain: true,
  },
];

