import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  ExternalLink,
  Fuel,
  Gauge,
  Globe2,
  Home,
  KeyRound,
  Layers,
  Mail,
  ReceiptText,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Split,
  Users,
  Wallet,
} from "lucide-react";
import { PublicShell } from "@/components/nest/public-shell";

const CONTRACT = "0x709cbad88162b999882788155cde79ade46a6d42";
const EXPLORER = "https://explorer.testnet.arc.io";
const USDC = "0x3600000000000000000000000000000000000000";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "Nest Docs — Shared USDC money on Arc" },
      {
        name: "description",
        content:
          "Full Nest documentation: quick start, Arc network setup, homes and expenses, settlement, gasless payments, CCTP bridge, email wallets, contracts, security and FAQ.",
      },
      { property: "og:title", content: "Nest Docs — Shared USDC money on Arc" },
      {
        property: "og:description",
        content: "Everything about Nest on Arc: setup, products, contracts, security and FAQ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/docs" }],
  }),
});

const nav = [
  {
    group: "Getting started",
    items: [
      ["introduction", "Introduction"],
      ["quick-start", "Quick start"],
      ["network", "Network setup"],
    ],
  },
  {
    group: "Products",
    items: [
      ["homes", "Homes & members"],
      ["expenses", "Expenses & splits"],
      ["settle", "Settle up"],
      ["pay", "Pay & gasless"],
      ["bridge", "Bridge (CCTP v2)"],
      ["assistant", "Settlement assistant"],
    ],
  },
  {
    group: "Accounts",
    items: [
      ["wallets", "Wallets & email login"],
      ["profile", "Profile & activity"],
    ],
  },
  {
    group: "Technical",
    items: [
      ["architecture", "Architecture"],
      ["contracts", "Smart contracts"],
      ["integration", "Integration guide"],
    ],
  },
  {
    group: "Resources",
    items: [
      ["security", "Security"],
      ["limitations", "Limitations"],
      ["faq", "FAQ"],
    ],
  },
] as const;

const allIds = nav.flatMap((g) => g.items.map(([id]) => id));

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-border pt-10 first:border-0 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Home; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="overflow-hidden rounded-2xl border border-border bg-card">
      {items.map(([t, b], i) => (
        <li key={t} className={`flex gap-4 p-4 ${i ? "border-t border-border" : ""}`}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-black text-brand">{i + 1}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{t}</p>
            <p className="text-sm leading-6 text-muted-foreground">{b}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="overflow-hidden rounded-2xl border border-border bg-card">
      {rows.map(([k, v], i) => (
        <div key={k} className={`grid gap-1 p-4 sm:grid-cols-[180px_1fr] ${i ? "border-t border-border" : ""}`}>
          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{k}</dt>
          <dd className="break-all font-mono text-xs text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-border bg-muted p-4 font-mono text-xs leading-6 text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4 text-sm leading-6 text-foreground">{children}</div>;
}

const faqs: [string, string][] = [
  ["Do I need ETH or another gas token?", "No. On Arc, gas is paid in USDC. If you hold USDC on Arc you can use every part of Nest."],
  ["Does Nest hold my money?", "No. Payments move wallet-to-wallet or through the public contract. Nest never takes custody of funds."],
  ["Can everyone in my home see the same numbers?", "Yes. Homes, expenses and settlements are read from the contract, so every member sees the same state."],
  ["What does gasless mean here?", "For simple sends, you sign a USDC authorization (EIP-3009) and a sponsor wallet submits it, so you pay no network fee."],
  ["Can I sign in without a wallet?", "Yes. Continue with email creates a wallet for you. You can also connect MetaMask, Rabby, Coinbase or WalletConnect."],
  ["Who can see my bridge history?", "Only you. Bridge history is stored per wallet address on your device."],
  ["Is EURC supported?", "EURC is shown but transfers are disabled until a confirmed cross-chain route is available."],
  ["Where can I verify a transaction?", "Every receipt links to the Arc explorer with the transaction hash."],
];

function DocsPage() {
  const [active, setActive] = useState<string>("introduction");
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <PublicShell eyebrow="Documentation" title="Nest docs" description="Shared USDC money for homes and teams, built on Arc.">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <nav className="flex gap-6 overflow-x-auto pb-2 lg:flex-col lg:gap-5">
            {nav.map((g) => (
              <div key={g.group} className="shrink-0">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{g.group}</p>
                <div className="flex gap-1 lg:flex-col">
                  {g.items.map(([id, label]) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        active === id ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 max-w-3xl space-y-10">
          <Section id="introduction" eyebrow="Getting started" title="What is Nest?">
            <p>
              Nest is a shared money app on Arc, Circle's Layer 1 where USDC is the gas token. Create a home, add the
              people you live or work with, log shared costs, and settle up in USDC in under a second.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={CircleDollarSign} title="USDC-native">Gas is paid in USDC. No other token is needed.</Card>
              <Card icon={Gauge} title="Sub-second finality">Payments and settlements confirm almost instantly.</Card>
              <Card icon={Users} title="One shared truth">Every member reads the same onchain balances.</Card>
              <Card icon={ShieldCheck} title="Non-custodial">Funds move wallet-to-wallet. Nest never holds them.</Card>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["5042002", "Chain ID"], ["USDC", "Gas token"], ["<1s", "Finality"], ["26", "CCTP domain"]].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-xl font-black text-foreground">{v}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="quick-start" eyebrow="Getting started" title="Quick start">
            <p>Go from zero to your first settlement in about two minutes.</p>
            <Steps
              items={[
                ["Sign in", "Tap Launch Nest and continue with email, or connect an existing wallet."],
                ["Get test USDC", "Use the Circle faucet and choose Arc Testnet. Email wallets get a small fee top-up automatically."],
                ["Create a home", "Name your home. This creates it onchain and makes you the first member."],
                ["Invite members", "Share the invite link or add wallet addresses directly."],
                ["Add an expense", "Enter the amount, who paid, and how to split it."],
                ["Settle up", "Open Settle and pay what you owe in one tap. A receipt appears instantly."],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground">
                Launch Nest <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a href="https://faucet.circle.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold">
                <Fuel className="h-3.5 w-3.5" /> Circle faucet <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Section>

          <Section id="network" eyebrow="Getting started" title="Network setup">
            <p>Nest adds Arc to your wallet automatically. To add it by hand, use these values:</p>
            <KV
              rows={[
                ["Network name", "Arc Testnet"],
                ["Chain ID", "5042002"],
                ["RPC URL", "https://rpc.testnet.arc.network"],
                ["Currency symbol", "USDC"],
                ["Explorer", EXPLORER],
                ["USDC address", USDC],
              ]}
            />
            <Note>Testnet USDC has no value. Never send real funds to a testnet address.</Note>
          </Section>

          <Section id="homes" eyebrow="Products" title="Homes & members">
            <p>
              A home is a shared space for a household, trip or team. It is stored in the contract, so anyone you add sees
              it from any device as soon as they sign in with their wallet.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card icon={Home} title="Create">One transaction creates the home.</Card>
              <Card icon={Users} title="Invite">Share a link or add an address.</Card>
              <Card icon={KeyRound} title="Manage">Owners can rename and remove members.</Card>
            </div>
          </Section>

          <Section id="expenses" eyebrow="Products" title="Expenses & splits">
            <p>Log any shared cost — rent, groceries, utilities — and choose how it is divided.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b className="text-foreground">Equal</b> — split evenly across selected members.</li>
              <li><b className="text-foreground">Exact</b> — set each person's share; totals must match.</li>
              <li><b className="text-foreground">Recurring rent</b> — repeat a cost every month.</li>
            </ul>
            <p>Amounts use exact 6-decimal USDC math, so balances never drift by rounding.</p>
          </Section>

          <Section id="settle" eyebrow="Products" title="Settle up">
            <p>
              Nest nets every expense into the fewest payments needed. Open Settle, review who you owe, and pay. The
              contract marks the debt as settled and emits an event that becomes your receipt.
            </p>
            <Steps
              items={[
                ["Review", "See each balance and the total due."],
                ["Approve", "First time only: allow the contract to move the exact USDC amount."],
                ["Confirm", "Sign the settlement. It confirms in under a second."],
                ["Receipt", "A receipt with an explorer link appears in Activity."],
              ]}
            />
          </Section>

          <Section id="pay" eyebrow="Products" title="Pay & gasless">
            <p>
              Send USDC to any address or scan a payment request. Simple sends are gasless: you sign a USDC
              authorization (EIP-3009 <code className="font-mono text-foreground">transferWithAuthorization</code>) and a
              sponsor submits it, so you pay no fee.
            </p>
            <Note>Contract settlements are not gasless — they need a small USDC fee from your wallet.</Note>
          </Section>

          <Section id="bridge" eyebrow="Products" title="Bridge (CCTP v2)">
            <p>Move native USDC between Arc and other testnets using Circle's CCTP v2. No wrapped tokens.</p>
            <Steps
              items={[
                ["Approve", "Allow the TokenMessenger to burn your USDC."],
                ["Burn", "depositForBurn on the source chain."],
                ["Attest", "Circle signs the message, usually within seconds."],
                ["Mint", "receiveMessage on the destination mints fresh USDC."],
              ]}
            />
            <p>Supported: Arc, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, OP Sepolia, Avalanche Fuji and more. Your bridge history is private to your wallet.</p>
          </Section>

          <Section id="assistant" eyebrow="Products" title="Settlement assistant">
            <p>
              The assistant prepares a batch of settlements for you within limits you set — maximum per payment and per
              day. Nothing is sent until you confirm.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={Sparkles} title="Suggests">Finds the smallest set of payments.</Card>
              <Card icon={ShieldCheck} title="Stays in limits">Never exceeds your caps.</Card>
            </div>
          </Section>

          <Section id="wallets" eyebrow="Accounts" title="Wallets & email login">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={Mail} title="Continue with email">Enter your email, type the 6-digit code, and a wallet is created for you. It restores on any device.</Card>
              <Card icon={Wallet} title="Bring a wallet">MetaMask, Rabby, Coinbase Wallet or any WalletConnect wallet.</Card>
            </div>
            <p>Email sessions last about an hour; after that you'll be asked to verify again.</p>
          </Section>

          <Section id="profile" eyebrow="Accounts" title="Profile & activity">
            <p>Tap your wallet address in the sidebar to see your net position, what you've paid and received, and every onchain receipt for your wallet.</p>
          </Section>

          <Section id="architecture" eyebrow="Technical" title="Architecture">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card icon={Layers} title="App">React app reading Arc directly via viem/wagmi.</Card>
              <Card icon={ReceiptText} title="Receipts">Built from contract event logs, not local storage.</Card>
              <Card icon={RouteIcon} title="Bridge">Circle CCTP v2 contracts and attestation API.</Card>
            </div>
            <p>There is no private ledger: balances, members and receipts all come from public chain data.</p>
          </Section>

          <Section id="contracts" eyebrow="Technical" title="Smart contracts">
            <KV
              rows={[
                ["ExpenseManager", CONTRACT],
                ["USDC (Arc)", USDC],
                ["Compiler", "Solidity 0.8.28, optimizer 200 runs"],
                ["License", "MIT"],
              ]}
            />
            <a href={`${EXPLORER}/address/${CONTRACT}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-brand">
              View on Arc explorer <ExternalLink className="h-3 w-3" />
            </a>
          </Section>

          <Section id="integration" eyebrow="Technical" title="Integration guide">
            <p>Read a home's members and settle a debt with viem:</p>
            <Code>{`import { createPublicClient, http } from "viem";

const client = createPublicClient({
  transport: http("https://rpc.testnet.arc.network"),
});

const members = await client.readContract({
  address: "${CONTRACT}",
  abi: expenseManagerAbi,
  functionName: "getRoommates",
  args: [homeId],
});`}</Code>
            <p>Listen for <code className="font-mono text-foreground">SplitSettled</code> and <code className="font-mono text-foreground">DirectTransfer</code> events to build your own receipts.</p>
          </Section>

          <Section id="security" eyebrow="Resources" title="Security">
            <ul className="list-disc space-y-1 pl-5">
              <li>Non-custodial: Nest never holds user funds.</li>
              <li>Exact approvals — only the amount you're paying.</li>
              <li>Every transaction is simulated before you sign.</li>
              <li>State updates happen before transfers to prevent re-entry.</li>
              <li>Email wallets are secured by Circle; Nest never sees your keys.</li>
            </ul>
          </Section>

          <Section id="limitations" eyebrow="Resources" title="Limitations">
            <ul className="list-disc space-y-1 pl-5">
              <li>Public deployment runs on Arc Testnet; assets have no value.</li>
              <li>EURC and cirBTC transfers are disabled until routes are confirmed.</li>
              <li>Some testnet RPCs can be slow; Nest keeps the last verified state.</li>
            </ul>
          </Section>

          <Section id="faq" eyebrow="Resources" title="FAQ">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {faqs.map(([q, a], i) => (
                <div key={q} className={i ? "border-t border-border" : ""}>
                  <button
                    type="button"
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-bold text-foreground"
                    aria-expanded={open === i}
                  >
                    {q}
                    <span className="text-brand">{open === i ? "−" : "+"}</span>
                  </button>
                  {open === i && <p className="px-4 pb-4 text-sm leading-6 text-muted-foreground">{a}</p>}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <a href="https://docs.arc.network" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold">
                <BookOpen className="h-3.5 w-3.5" /> Arc docs <ExternalLink className="h-3 w-3" />
              </a>
              <a href={EXPLORER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold">
                <Globe2 className="h-3.5 w-3.5" /> Arc explorer <ExternalLink className="h-3 w-3" />
              </a>
              <Link to="/support" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold">
                <Split className="h-3.5 w-3.5" /> Support
              </Link>
            </div>
          </Section>
        </main>
      </div>
    </PublicShell>
  );
}
