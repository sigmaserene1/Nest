import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Fuel, Github, LifeBuoy, SearchCheck } from "lucide-react";
import { PublicShell } from "@/components/nest/public-shell";

const GITHUB_URL = "https://github.com/sigmaserene1/Nest";
const ISSUES_URL = "https://github.com/sigmaserene1/Nest/issues";
const FAUCET_URL = "https://faucet.circle.com/";
const EXPLORER_URL = "https://explorer.testnet.arc.io/";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — Nest" },
      {
        name: "description",
        content: "Nest support, testnet funding, explorer links and issue reporting.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/support" }],
  }),
});

function SupportPage() {
  return (
    <PublicShell
      eyebrow="Support"
      title="Get help with Nest"
      description="Fast links for reviewers and testnet users: funding, explorer verification, documentation and reproducible issue reporting."
    >
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            icon={LifeBuoy}
            title="Contact"
            body="For product, partnership or review questions, email the Nest project support address."
          >
            <a
              href="mailto:auth@nestarc.xyz"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background"
            >
              auth@nestarc.xyz
            </a>
          </Card>

          <Card
            icon={Fuel}
            title="Need Arc Testnet USDC?"
            body="Circle's public faucet can fund a test wallet. Choose Arc Testnet. Testnet assets have no real-world value."
          >
            <External href={FAUCET_URL}>Open Circle faucet</External>
          </Card>

          <Card
            icon={SearchCheck}
            title="Verify onchain"
            body="Use the Arc Testnet explorer to inspect contract addresses, wallet activity and transaction hashes independently."
          >
            <External href={EXPLORER_URL}>Open Arc explorer</External>
          </Card>

          <Card
            icon={Github}
            title="Report a reproducible issue"
            body="Include the route, wallet type, network, expected result, actual result and transaction hash when available. Never post private keys."
          >
            <External href={ISSUES_URL}>Open GitHub issues</External>
          </Card>
        </div>

        <section className="mt-8 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Before reporting a testnet problem</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li><strong className="text-foreground">1.</strong> Confirm the wallet is on Arc Testnet (chain ID 5042002).</li>
            <li><strong className="text-foreground">2.</strong> Confirm the wallet has enough testnet USDC for the flow you are testing.</li>
            <li><strong className="text-foreground">3.</strong> Copy the transaction hash or failed route details if one exists.</li>
            <li><strong className="text-foreground">4.</strong> Check the same address/transaction in the Arc explorer.</li>
            <li><strong className="text-foreground">5.</strong> Do not send a seed phrase, private key, password or recovery code.</li>
          </ol>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/docs" className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted">
            Read Nest docs
          </Link>
          <External href={GITHUB_URL}>Source repository</External>
        </div>
      </main>
    </PublicShell>
  );
}

function Card({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof LifeBuoy;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-base font-bold">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold transition hover:border-brand/35 hover:bg-muted"
    >
      {children} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
