import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Fuel,
  Github,
  Globe2,
  KeyRound,
  Network,
  ReceiptText,
  Route as RouteIcon,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { PublicShell } from "@/components/nest/public-shell";

const CONTRACT = "0x709cbad88162b999882788155cde79ade46a6d42";
const EXPLORER = "https://explorer.testnet.arc.io";
const CONTRACT_URL = `${EXPLORER}/address/${CONTRACT}`;
const FAUCET_URL = "https://faucet.circle.com/";
const GITHUB_URL = "https://github.com/sigmaserene1/Nest";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "Nest Docs — Arc, Circle and onchain settlement" },
      {
        name: "description",
        content:
          "Technical and reviewer documentation for Nest: Arc Testnet configuration, Circle Wallets, native USDC settlement, CCTP-preferred bridging and deployed contract proof.",
      },
      { property: "og:title", content: "Nest Docs" },
      {
        property: "og:description",
        content: "How Nest uses Arc, Circle and native USDC, with testnet setup and deployment proof.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/docs" }],
  }),
});

const quickLinks = [
  { href: "#reviewer-quickstart", label: "Reviewer quickstart" },
  { href: "#network", label: "Arc configuration" },
  { href: "#circle", label: "How Nest uses Circle" },
  { href: "#contract", label: "Contract & proof" },
  { href: "#data", label: "Data & custody model" },
  { href: "#limitations", label: "Current limitations" },
] as const;

function ExternalButton({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        secondary
          ? "inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold transition hover:border-brand/35 hover:bg-muted"
          : "inline-flex items-center gap-2 rounded-xl bg-foreground px-3.5 py-2.5 text-xs font-bold text-background transition hover:opacity-90"
      }
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function DocsPage() {
  return (
    <PublicShell
      eyebrow="Documentation"
      title="Nest technical & reviewer docs"
      description="A factual view of what Nest runs today: the onchain data model, Arc Testnet configuration, Circle-powered wallet onboarding, native USDC settlement and the proof a reviewer can inspect."
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            On this page
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-12">
          <section className="grid gap-4 sm:grid-cols-3">
            <FactCard icon={Network} label="Network" value="Arc Testnet" detail="Chain ID 5042002" />
            <FactCard icon={CircleDollarSign} label="Settlement" value="Native USDC" detail="Wallet-to-wallet" />
            <FactCard icon={WalletCards} label="Wallet onboarding" value="Circle Wallets" detail="Email + social + external wallet" />
          </section>

          <section id="reviewer-quickstart" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Start here"
              title="Reviewer quickstart"
              body="A reviewer can verify Nest without needing real funds. The current deployment is testnet software and all testnet assets are valueless."
            />
            <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
              {[
                ["1", "Open Nest", "Launch the app and sign in with a Circle user-controlled wallet or connect an external EVM wallet."],
                ["2", "Use Arc Testnet", "The public deployment uses Arc Testnet (chain ID 5042002). Nest can request/switch the supported wallet network."],
                ["3", "Get test USDC", "For an external wallet, use Circle's public faucet and choose Arc Testnet. Testnet USDC is for testing only."],
                ["4", "Create a workspace", "Create or join a workspace, add participants and record an expense or payout obligation."],
                ["5", "Settle & verify", "Complete a settlement, then use Activity/Receipts and the Arc explorer to verify the transaction."],
              ].map(([n, title, body], index) => (
                <div
                  key={n}
                  className={`grid gap-3 p-5 sm:grid-cols-[42px_180px_1fr] sm:items-start ${index ? "border-t border-border" : ""}`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand/10 text-xs font-black text-brand">
                    {n}
                  </span>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ExternalButton href={FAUCET_URL}>
                <Fuel className="h-4 w-4" /> Circle testnet faucet
              </ExternalButton>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold transition hover:border-brand/35 hover:bg-muted"
              >
                Launch Nest <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          <section id="network" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Arc"
              title="Network configuration"
              body="These values match the public testnet configuration used by the current Nest deployment."
            />
            <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
              <DataRow name="Network" value="Arc Testnet" />
              <DataRow name="Chain ID" value="5042002" mono />
              <DataRow name="Native gas asset" value="USDC" />
              <DataRow name="USDC ERC-20 interface" value="0x3600000000000000000000000000000000000000" mono />
              <DataRow name="Primary RPC" value="https://rpc.testnet.arc.network" mono />
              <DataRow name="Explorer" value="https://explorer.testnet.arc.io" mono last />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Nest also has RPC fallbacks in the client so a temporary problem with one provider does not have to block every read.
            </p>
          </section>

          <section id="circle" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Circle"
              title="How Nest uses Circle"
              body="Circle is used where it is actually integrated in the current codebase. Nest does not claim products that are not live."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Capability
                icon={KeyRound}
                title="User-Controlled Wallets"
                body="Email and social onboarding can create or restore a Circle user-controlled wallet. External EVM wallets remain supported."
              />
              <Capability
                icon={CircleDollarSign}
                title="Native USDC"
                body="Shared obligations resolve into wallet-to-wallet USDC settlement on Arc instead of Nest pooling customer funds."
              />
              <Capability
                icon={RouteIcon}
                title="CCTP-preferred bridge"
                body="Nest requests LI.FI routes with Circle-native CCTP bridges allowed first, then falls back to other supported LI.FI routing when needed."
              />
              <Capability
                icon={Fuel}
                title="Circle Gas Station"
                body="New Circle wallets are provisioned as ERC-4337 SCAs so an enabled Circle Gas Station policy can sponsor their Arc transactions. Legacy EOA wallets are preserved rather than silently changing a user's address."
              />
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-muted/35 p-4 text-xs leading-6 text-muted-foreground">
              <strong className="text-foreground">Product distinction:</strong> Nest's Arc sponsored-gas path uses Circle Wallets Gas Station for SCA wallets. That is different from Circle's standalone permissionless Circle Paymaster product. Gateway, Circle Mint and autonomous custody are not claimed.
            </div>
          </section>

          <section id="contract" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Proof"
              title="Deployed ExpenseManager"
              body="The canonical Arc Testnet contract records workspaces, members, expenses, shares, settlement state and activity."
            />
            <div className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    ExpenseManager
                  </p>
                  <p className="mt-2 break-all font-mono text-sm font-semibold">{CONTRACT}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Deployment block: 54,971,156 · Arc Testnet
                  </p>
                </div>
                <BadgeCheck className="h-7 w-7 text-brand" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <ExternalButton href={CONTRACT_URL}>
                  <Globe2 className="h-4 w-4" /> Inspect contract
                </ExternalButton>
                <ExternalButton href={GITHUB_URL} secondary>
                  <Github className="h-4 w-4" /> Source repository
                </ExternalButton>
                <Link
                  to="/app/activity"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold transition hover:border-brand/35 hover:bg-muted"
                >
                  <ReceiptText className="h-4 w-4" /> Transaction activity
                </Link>
                <Link
                  to="/app/receipts"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold transition hover:border-brand/35 hover:bg-muted"
                >
                  <FileCheck2 className="h-4 w-4" /> Receipts
                </Link>
              </div>
            </div>
          </section>

          <section id="data" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Trust model"
              title="Data, custody and verification"
              body="Nest separates public onchain records, wallet authentication and browser-local preferences."
            />
            <div className="mt-5 space-y-3">
              <TrustRow
                title="Onchain state"
                body="Workspace membership, expenses, shares, settlement status and contract activity are read from ExpenseManager on Arc."
              />
              <TrustRow
                title="Funds"
                body="Nest does not need to hold a pooled customer balance for ordinary expense settlement. Settlement calls transfer USDC between participant wallets according to the contract flow."
              />
              <TrustRow
                title="Wallet authentication"
                body="Circle handles the secure user-controlled-wallet authentication flow for Circle-backed accounts. External wallets sign through their own wallet software."
              />
              <TrustRow
                title="Browser-local data"
                body="Some UI preferences, selected workspace information, bridge history and assistant settings can be stored locally in the browser. Clearing browser storage can remove those local-only preferences."
              />
              <TrustRow
                title="Public blockchain data"
                body="Wallet addresses and onchain transactions are public by design and can be inspected independently through the Arc explorer."
              />
            </div>
          </section>

          <section id="limitations" className="scroll-mt-28">
            <SectionTitle
              eyebrow="Current status"
              title="What a reviewer should know"
              body="Nest is a working testnet application, not a claim of audited production financial infrastructure."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "The public ExpenseManager deployment is on Arc Testnet; testnet assets have no real-world value.",
                "Business V2 and lending/session-key experiments require separate configuration and should not be treated as audited mainnet products.",
                "Bridge availability depends on a live executable route from LI.FI and the selected source/destination networks.",
                "RPC outages can temporarily affect verified reads; the UI may expose a read-only/demo state rather than inventing onchain data.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
                  <ShieldCheck className="mb-3 h-5 w-5 text-brand" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-foreground p-6 text-background sm:p-8">
            <h2 className="font-display text-2xl tracking-[-0.03em]">Need help reviewing Nest?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-background/70">
              Use the support page for contact details, testnet troubleshooting and the fastest route to report a reproducible issue.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-xs font-bold text-foreground"
              >
                Support <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <ExternalButton href={GITHUB_URL} secondary>
                Open GitHub
              </ExternalButton>
            </div>
          </section>
        </main>
      </div>
    </PublicShell>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Network;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-brand" />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl tracking-[-0.03em] sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function DataRow({
  name,
  value,
  mono = false,
  last = false,
}: {
  name: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`grid gap-2 px-5 py-4 sm:grid-cols-[190px_1fr] ${last ? "" : "border-b border-border"}`}>
      <p className="text-xs font-semibold text-muted-foreground">{name}</p>
      <p className={`break-all text-xs font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Capability({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof WalletCards;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}

function TrustRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[180px_1fr]">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
