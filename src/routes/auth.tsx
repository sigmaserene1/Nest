import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ArrowRight, KeyRound, Network, Radio, ShieldCheck, WalletCards } from "lucide-react";
import { NestLogo } from "@/components/nest/logo";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Connect an Arc wallet · Nest" },
      {
        name: "description",
        content: "Connect a wallet to deploy or open a Nest Treasury V2 contract on Arc Testnet.",
      },
    ],
  }),
});

const facts = [
  { icon: ShieldCheck, title: "No password", detail: "Your wallet remains the only signer." },
  {
    icon: Network,
    title: "Arc-native",
    detail: "Treasury reads and writes resolve on chain ID 5042002.",
  },
  {
    icon: KeyRound,
    title: "Scoped agents",
    detail: "Delegation limits are contract-enforced, never browser promises.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    document.documentElement.classList.add("protocol-dark");
    return () => document.documentElement.classList.remove("protocol-dark");
  }, []);

  useEffect(() => {
    if (isConnected) navigate({ to: "/app" });
  }, [isConnected, navigate]);

  return (
    <main className="protocol-setup min-h-screen px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-border/70 pb-5">
          <NestLogo />
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            Back to protocol
          </Link>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:py-16">
          <section>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[11px] uppercase text-emerald-300">
              <Radio className="h-3 w-3" /> Arc Testnet · Treasury V2
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Enter through a wallet, not an account.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Connect the wallet that owns, belongs to, or executes for an onchain treasury. Nest
              does not create a custodial login or copy your key.
            </p>

            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {facts.map((fact) => (
                <article key={fact.title} className="bg-card p-4">
                  <fact.icon className="h-4 w-4 text-primary" />
                  <h2 className="mt-4 text-sm font-semibold">{fact.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{fact.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <WalletCards className="h-5 w-5" />
              </span>
              <div>
                <div className="protocol-label">Wallet session</div>
                <h2 className="mt-1 text-lg font-semibold">Connect to Nest</h2>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-border border-y border-border text-xs">
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="protocol-value">Arc Testnet</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground">Settlement asset</dt>
                <dd className="protocol-value">Native USDC</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted-foreground">Authentication</dt>
                <dd className="protocol-value">Wallet signature</dd>
              </div>
            </dl>

            <div className="mt-6 w-full [&>div]:w-full [&_button]:w-full">
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    disabled={!mounted}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <WalletCards className="h-4 w-4" /> Connect wallet{" "}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </ConnectButton.Custom>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-muted-foreground">
              Testnet only. Never enter a seed phrase into Nest or any website.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
