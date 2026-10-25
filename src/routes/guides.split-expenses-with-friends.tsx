import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ReceiptText,
  Split,
  Users,
  Wallet,
} from "lucide-react";
import { PublicShell } from "@/components/nest/public-shell";

export const Route = createFileRoute("/guides/split-expenses-with-friends")({
  component: SplitExpensesGuide,
  head: () => ({
    meta: [
      { title: "How to Split Expenses With Friends (Without the Awkwardness) — Nest" },
      {
        name: "description",
        content:
          "A practical guide to splitting expenses with friends and roommates: fair methods, common mistakes, and how to track shared costs and settle up in USDC with Nest on Arc.",
      },
      {
        property: "og:title",
        content: "How to Split Expenses With Friends (Without the Awkwardness) — Nest",
      },
      {
        property: "og:description",
        content:
          "Fair ways to split shared costs, the mistakes that cause friction, and how to settle up in USDC with Nest on Arc.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://nestarc.xyz/guides/split-expenses-with-friends" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://nestarc.xyz/guides/split-expenses-with-friends" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to Split Expenses With Friends (Without the Awkwardness)",
          description:
            "A practical guide to splitting expenses with friends and roommates: fair methods, common mistakes, and how to track shared costs and settle up in USDC with Nest on Arc.",
          url: "https://nestarc.xyz/guides/split-expenses-with-friends",
          publisher: { "@type": "Organization", name: "Nest", url: "https://nestarc.xyz" },
        }),
      },
    ],
  }),
});

const methods = [
  {
    title: "Split everything equally",
    body: "The classic approach: total the shared costs, divide by the number of people, and everyone pays the same. It works best when incomes are similar and everyone uses the shared thing equally — a dinner, a taxi, a weekend rental. It breaks down when one person earns much more, or when someone barely used the thing being split.",
  },
  {
    title: "Split by usage",
    body: "Each person pays for what they actually consumed. Utilities in a shared apartment, groceries where one person cooks daily and another travels for work — usage-based splits feel fairer there. The cost is bookkeeping: someone has to track who used what, which is exactly where most groups give up.",
  },
  {
    title: "Rotate who pays",
    body: "One person covers this meal, the next person covers the next. Zero math, zero apps — until someone pays for a cheap round and someone else covers an expensive one, and the rotation quietly stops being equal. Rotation works for small, frequent, similar-sized costs and falls apart for anything bigger.",
  },
  {
    title: "Track everything, settle periodically",
    body: "Everyone logs what they paid for the group as it happens, and the group settles the net difference weekly or monthly. This is the method that scales: it handles mixed expenses, unequal usage, and people joining or leaving. It only works if the tracking is effortless and everyone trusts the record — which is the problem Nest was built to solve.",
  },
];

const mistakes = [
  {
    title: "Keeping score in your head",
    body: "Memory is generous to ourselves and harsh to others. Two people can honestly remember the same month differently. A shared, written record ends the argument before it starts.",
  },
  {
    title: "Letting small debts pile up",
    body: "A $6 coffee here and a $14 ride there feel too small to mention — until they add up to real money and mentioning them feels petty. Settle small amounts often, or log them somewhere everyone can see.",
  },
  {
    title: "One person always fronting the money",
    body: "The friend who always pays first becomes the group's unwilling bank. Rotate who fronts costs, or use a tool that lets anyone add an expense the moment they pay it.",
  },
  {
    title: "Vague IOUs",
    body: "'I'll get you back' has no amount, no date, and no record. Every shared expense should have three things attached: who paid, how much, and what it was for.",
  },
];

const steps = [
  {
    icon: Users,
    title: "Create a home for your group",
    body: "In Nest, a home is your group's shared space — roommates, a trip crew, a couple. Everyone joins with their own wallet, and every expense the group logs lives in one place.",
  },
  {
    icon: ReceiptText,
    title: "Log expenses the moment they happen",
    body: "Whoever pays adds the expense with the amount and what it was for. Nest splits it across the group automatically, so there is no end-of-month spreadsheet archaeology.",
  },
  {
    icon: Calculator,
    title: "Let the assistant do the math",
    body: "Nest's settlement assistant calculates who owes whom and suggests the smallest set of payments that gets everyone back to even — no manual netting, no favorite-payment-app debates.",
  },
  {
    icon: Wallet,
    title: "Settle up in USDC on Arc",
    body: "Payments settle onchain in USDC on the Arc network. Every settlement produces a receipt derived from the transaction itself, so the record is the payment — not a screenshot of a promise.",
  },
];

function SplitExpensesGuide() {
  return (
    <PublicShell
      eyebrow="Guide"
      title="How to split expenses with friends (without the awkwardness)"
      description="Splitting shared costs is a social problem before it is a math problem. This guide covers the fair ways to split, the mistakes that cause friction, and how to settle up cleanly."
    >
      <article className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        <section>
          <h2 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            Why splitting money with friends goes wrong
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Almost nobody fights about the math. The fights come from uncertainty: nobody is quite
            sure who paid for what, whether the small stuff balances out, or whether bringing it up
            will seem cheap. The fix is not a better calculator — it is a shared record everyone
            trusts, updated at the moment money moves, with a settlement step that feels routine
            instead of confrontational.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            That principle holds whether you are roommates splitting rent and groceries, friends
            dividing a trip, or a couple sharing household costs. Pick a splitting method everyone
            agrees on, write every expense down where the whole group can see it, and settle on a
            regular rhythm so balances never grow large enough to be uncomfortable.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            Four fair ways to split shared costs
          </h2>
          <div className="mt-6 space-y-4">
            {methods.map((method, index) => (
              <div key={method.title} className="card-premium p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-bold">{method.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{method.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            The mistakes that make it awkward
          </h2>
          <div className="mt-6 space-y-4">
            {mistakes.map((mistake) => (
              <div key={mistake.title} className="card-premium p-5">
                <h3 className="text-base font-bold">{mistake.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{mistake.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            How Nest handles it end to end
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Nest is a shared-expense app built on the Arc network. It follows the
            track-everything, settle-periodically method above and automates the parts groups
            usually abandon.
          </p>
          <div className="mt-6 space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="card-premium flex gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <step.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            A simple routine that works
          </h2>
          <ul className="mt-6 space-y-3">
            {[
              "Agree on the splitting method before the first shared expense, not after.",
              "Log every shared cost the moment it happens — amount, payer, and what it was for.",
              "Settle on a fixed rhythm: weekly for active groups, monthly for calm ones.",
              "Keep individual balances small enough that settling never feels like a big ask.",
              "Use a record everyone can see, so 'did you pay me back?' never needs asking.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-3xl border border-border bg-gradient-to-br from-brand/10 via-card to-card p-8 text-center sm:p-10">
          <Split className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-4 font-display text-2xl tracking-[-0.03em] sm:text-3xl">
            Try it with your group
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            Create a home, invite your friends, and split your first expense in minutes — settled
            in USDC on Arc, with a receipt for every payment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition-transform hover:-translate-y-0.5"
            >
              Launch Nest <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition-colors hover:bg-muted"
            >
              Read the docs
            </Link>
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
