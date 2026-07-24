import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Wallet, Users, Zap } from "lucide-react";
import { NestLogo } from "@/components/nest/logo";

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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand animate-float-in">
          <Sparkles className="h-3.5 w-3.5" /> New · Now live on Arc testnet
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl animate-float-in">
          Shared living,
          <br />
          <span className="bg-gradient-to-r from-brand to-orange-500 bg-clip-text text-transparent">
            effortlessly settled.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground animate-float-in">
          The beautiful way to split rent, groceries, and life with your roommates. Settled in seconds with USDC.
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
    </div>
  );
}
