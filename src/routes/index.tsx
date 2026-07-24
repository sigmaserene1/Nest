import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Zap, Wallet, Receipt, PieChart, Users } from "lucide-react";
import { NestLogo, BuiltOnArc } from "@/components/nest/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nest — Split rent and bills, settle instantly in USDC" },
      { name: "description", content: "Nest is the modern way for roommates to share expenses. Track rent, groceries, and bills together, then settle in seconds with USDC on Arc." },
      { property: "og:title", content: "Nest — Split rent and bills, settle instantly in USDC" },
      { property: "og:description", content: "Track shared household expenses and settle up in seconds. Built on Arc." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <NestLogo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app" className="hidden text-sm font-medium text-foreground/80 hover:text-foreground sm:inline">Sign in</Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5"
            >
              Open app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.965_0.045_27.3)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 text-center md:pt-28">
          <BuiltOnArc className="mx-auto" />
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Shared living, <span className="text-brand">settled</span> the moment
            <br className="hidden md:block" /> the bill lands.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Nest tracks rent, groceries, and bills for your household and lets you settle up
            in seconds with USDC. No IOUs, no chasing screenshots.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5"
            >
              Get started — free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              See how it works
            </a>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Free for households up to 6 · No credit card required</div>

          {/* Product screenshot mock */}
          <div className="mx-auto mt-16 max-w-5xl">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything a household needs. Nothing it doesn't.</h2>
            <p className="mt-3 text-muted-foreground">Built for the way modern roommates actually live — recurring rent, spontaneous grocery runs, and one-tap settlements.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-background p-6 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Three steps to a squared-up household</h2>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground">{i + 1}</span>
                Step {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready when your next bill is.</h2>
          <p className="mt-3 text-muted-foreground">Create your home in under a minute. Invite your roommates. Never chase a Venmo again.</p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5"
          >
            Open Nest <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <NestLogo />
            <span className="text-xs">© 2026 Nest Labs</span>
          </div>
          <BuiltOnArc />
        </div>
      </footer>
    </div>
  );
}

const features = [
  { title: "Smart splits", desc: "Equal, share-based, exact, or percentage — Nest handles the math even when the roster changes mid-month.", icon: Receipt },
  { title: "One-tap settle", desc: "Send USDC on Arc in a single click. Sub-second finality, receipts stored automatically.", icon: Zap },
  { title: "Real analytics", desc: "See category trends, monthly totals, and who's carrying the household — no spreadsheets.", icon: PieChart },
  { title: "Multi-home", desc: "Manage your apartment, your ski house, and your parents' vacation rental from one dashboard.", icon: Users },
  { title: "Onchain proof", desc: "Every settlement gets a verifiable transaction hash. Landlord asking for proof? Send the link.", icon: ShieldCheck },
  { title: "Wallet-native", desc: "Connect any EVM wallet. Your funds stay yours — Nest never touches custody.", icon: Wallet },
];

const steps = [
  { title: "Create a home", desc: "Name it, invite roommates by email or share link. Set the split defaults once." },
  { title: "Log expenses", desc: "Rent, groceries, utilities. Snap a receipt, pick a category, done in seconds." },
  { title: "Settle up", desc: "Nest simplifies the debt graph and lets you clear it with one USDC transfer on Arc." },
];

function HeroPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-elevated">
      <div className="grid grid-cols-12">
        {/* Fake sidebar */}
        <div className="col-span-3 hidden border-r border-border bg-sidebar p-4 md:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-brand-foreground text-xs">N</span>
            <span className="text-sm font-semibold">Nest</span>
          </div>
          <div className="rounded-lg border border-border bg-surface p-2.5 text-[11px]">
            <div className="text-[10px] uppercase text-muted-foreground">Home</div>
            <div className="font-semibold">Bedford Loft</div>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            {["Dashboard", "Expenses", "Activity", "Settle up", "Analytics"].map((s, i) => (
              <div key={s} className={`rounded-md px-2.5 py-1.5 ${i === 0 ? "bg-brand-soft text-brand font-medium" : "text-muted-foreground"}`}>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 p-6 md:col-span-9 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Total balance</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">You're owed <span className="text-brand">$212.86</span></div>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.65_0.16_155)]" /> 1,284.50 USDC
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: "This month", value: "$728.32" },
              { label: "Settlements", value: "3" },
              { label: "Members", value: "4" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-surface p-3">
                <div className="text-[11px] text-muted-foreground">{k.label}</div>
                <div className="mt-0.5 text-lg font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border">
            {[
              { who: "Alex → You", note: "November Rent split", amt: "+$800.00", pos: true },
              { who: "You → Priya", note: "Farmers market", amt: "-$14.72" },
              { who: "Marcus → You", note: "Verizon Fios", amt: "+$22.50", pos: true },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                <div>
                  <div className="font-medium">{r.who}</div>
                  <div className="text-xs text-muted-foreground">{r.note}</div>
                </div>
                <div className={`font-semibold ${r.pos ? "text-[oklch(0.55_0.16_155)]" : "text-foreground"}`}>{r.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
