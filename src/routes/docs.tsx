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
    <section id={id} className="scroll-mt-28 border-t border-border pt-8 first:border-0 first:pt-0 sm:pt-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground sm:leading-7">{children}</div>
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
  ["What is Nest?", "A shared money app on Arc: create a home, split expenses, settle up in USDC, send gasless payments and bridge USDC with Circle CCTP v2."],
  ["Which network do I need?", "Arc Testnet, chain ID 5042002. The app adds it to your wallet when you connect; you can also add it manually from the network setup section."],
  ["What do I pay gas in?", "USDC. Arc has no separate gas token. Fees are typically a fraction of a cent, and simple sends are gasless."],
  ["Why does my wallet show USDC with 18 decimals?", "The native balance interface on Arc is 18-decimal; the ERC-20 interface of the same USDC (0x3600…0000) is 6-decimal. They are the same asset."],
  ["Does Nest hold my money?", "No. Payments move wallet-to-wallet or through the public contract. Nest never takes custody of funds."],
  ["Can everyone in my home see the same numbers?", "Yes. Homes, expenses and settlements are read from the contract, so every member sees the same state on any device."],
  ["What does gasless mean here?", "For simple sends, you sign a USDC authorization (EIP-3009) and a sponsor wallet submits it, so you pay no network fee. Contract settlements still need a small USDC fee."],
  ["How long does a bridge take?", "CCTP v2 Fast Transfer routes settle in seconds where supported; Standard Transfer waits for source-chain finality (minutes on Ethereum). Minting on Arc is sub-second once the attestation arrives."],
  ["Are there fees?", "Only network gas, shown before you sign. Nest adds no platform fee to payments, splits or settlements."],
  ["Can I sign in without a wallet?", "Yes. Continue with email creates a wallet for you through Circle. You can also connect MetaMask, Rabby, Coinbase or WalletConnect."],
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
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <div className="lg:hidden">
            <label htmlFor="docs-section" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              On this page
            </label>
            <select
              id="docs-section"
              value={active}
              onChange={(event) => {
                const id = event.target.value;
                setActive(id);
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm outline-none"
            >
              {nav.flatMap((g) => [
                <option key={`group-${g.group}`} disabled value={`group-${g.group}`}>
                  {g.group}
                </option>,
                ...g.items.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                )),
              ])}
            </select>
          </div>

          <nav className="hidden gap-6 pb-2 lg:flex lg:flex-col lg:gap-5">
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

        <main className="min-w-0 max-w-3xl space-y-8 sm:space-y-10">
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
            <h3 className="pt-2 text-base font-bold text-foreground">Who it's for</h3>
            <p>Nest is built for anyone who shares money with other people: flatmates splitting rent and bills, friends on a trip, couples with a joint budget, and small teams paying for shared tools. Instead of one person keeping a spreadsheet and chasing everyone for payments, every member sees the same balances and can settle in a single tap.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">Why Arc</h3>
            <p>Arc is Circle's Layer 1 blockchain designed for stablecoin finance. Gas is paid in USDC, blocks finalise in under a second, and fees are typically a fraction of a cent. That makes small, everyday payments like a share of the electricity bill practical onchain for the first time, without anyone needing to buy a separate gas token.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">How it fits together</h3>
            <p>Nest does not run its own ledger or hold anyone's funds. Homes, members, expenses and settlements live in one public contract on Arc, payments move native USDC directly between wallets, and bridging uses Circle's CCTP v2. The app is a front-end that reads that public data and helps you sign the right transactions.</p>
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
            <h3 className="pt-2 text-base font-bold text-foreground">Before you start</h3>
            <p>You need either an email address or an EVM wallet such as MetaMask, Rabby or Coinbase Wallet. If you sign in with email, Nest creates a wallet for you through Circle and sends a small amount of testnet USDC to cover your first network fees. If you bring your own wallet, claim test USDC from the Circle faucet first.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">What to expect</h3>
            <p>Each step that changes data asks your wallet to confirm. Arc confirms transactions in under a second, so your new home, expense or settlement appears almost immediately. If something fails, Nest shows the reason on the same screen and nothing is charged.</p>
          </Section>

          <Section id="network" eyebrow="Getting started" title="Network setup">
            <p>Nest adds Arc to your wallet automatically. To add it by hand, use these values:</p>
            <KV
              rows={[
                ["Network name", "Arc Testnet"],
                ["Chain ID", "5042002"],
                ["RPC URL", "https://rpc.testnet.arc.io"],
                ["Currency symbol", "USDC"],
                ["Explorer", EXPLORER],
                ["USDC address", USDC],
              ]}
            />
            <Note>Testnet USDC has no value. Never send real funds to a testnet address.</Note>
            <h3 className="pt-2 text-base font-bold text-foreground">Adding Arc automatically</h3>
            <p>When you connect a wallet, Nest checks which network it is on. If it isn't Arc Testnet, Nest asks your wallet to add or switch to it. Approve the request and you're ready; no manual setup is needed for most wallets.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">USDC as gas</h3>
            <p>On Arc your wallet shows USDC as the native balance. That balance pays for gas and is the same USDC you send and receive. The native interface uses 18 decimals while the token contract at 0x3600…0000 uses 6 decimals; they are the same asset, so the numbers always match once rounded.</p>
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
            <p>Each home has an owner (the person who created it) and a list of members identified by wallet address. Members can have a display name, which is set from their profile and shown everywhere in the app instead of a raw address.</p>
            <p>Invite links contain the home ID, so anyone who opens one and signs in can join. Owners can remove a member at any time, but a member with an open balance should settle first so the history stays clear. Because the home lives onchain, it can't be lost if you change phones or clear your browser.</p>
          </Section>

          <Section id="expenses" eyebrow="Products" title="Expenses & splits">
            <p>Log any shared cost — rent, groceries, utilities — and choose how it is divided.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b className="text-foreground">Equal</b> — split evenly across selected members.</li>
              <li><b className="text-foreground">Exact</b> — set each person's share; totals must match.</li>
              <li><b className="text-foreground">Recurring rent</b> — repeat a cost every month.</li>
            </ul>
            <p>Amounts use exact 6-decimal USDC math, so balances never drift by rounding.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">Recording an expense</h3>
            <p>Pick the home, enter the amount in USDC, choose who paid and add a short description like 'March rent' or 'Groceries'. Nest calculates each member's share and records the expense with one transaction. Everyone in the home sees it straight away.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">How balances are calculated</h3>
            <p>Every expense creates debts from each participant to the person who paid. Nest adds these up across all expenses so you always see one net number per person: what you owe, or what you're owed. Shares are stored in the smallest USDC unit, so 10 USDC split three ways is 3.333334 + 3.333333 + 3.333333, never a cent more or less.</p>
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
            <p>Settlements go through the ExpenseManager contract, which transfers USDC from you to the person you owe and marks the matching debt as paid in the same transaction. Because both happen together, a balance can never be marked paid without the money moving, or the other way round.</p>
            <p>The first time you settle, your wallet asks you to approve USDC spending. Nest requests only the exact amount needed, not unlimited access. Each settlement emits a SplitSettled event that Nest reads back to build your receipt, so receipts are verifiable on the explorer by anyone.</p>
          </Section>

          <Section id="pay" eyebrow="Products" title="Pay & gasless">
            <p>
              Send USDC to any address or scan a payment request. Simple sends are gasless: you sign a USDC
              authorization (EIP-3009 <code className="font-mono text-foreground">transferWithAuthorization</code>) and a
              sponsor submits it, so you pay no fee.
            </p>
            <Note>Contract settlements are not gasless — they need a small USDC fee from your wallet.</Note>
            <h3 className="pt-2 text-base font-bold text-foreground">Sending USDC</h3>
            <p>Enter an address or scan a payment request, type the amount and confirm. Payments go directly from your wallet to theirs; Nest never touches the funds in between. Every payment shows up in Activity with a link to the Arc explorer.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">How gasless works</h3>
            <p>Instead of sending a normal transaction, you sign a short message that authorises one exact USDC transfer: amount, recipient and an expiry time. Nest's sponsor wallet submits that message to the USDC contract and pays the network fee. The sponsor cannot change the amount or recipient, and the authorisation can only be used once.</p>
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
            <h3 className="pt-2 text-base font-bold text-foreground">Fast and standard transfers</h3>
            <p>CCTP v2 Fast Transfer settles in seconds on chains that support it. Standard Transfer waits for the source chain to finalise, which can take several minutes on Ethereum. Once Circle's attestation is ready, minting on Arc is sub-second. Nest shows the expected time before you start.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">If you close the page</h3>
            <p>Your bridge is saved to your device's history for your wallet. Come back to the Bridge page, open the pending transfer and Nest will pick up the attestation and let you finish the mint step. Your USDC is never lost; it is safely burned on the source chain until you mint it on the destination.</p>
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
            <p>Turn the assistant on and set two limits: the most it can pay in one settlement and the most it can pay per day. It then looks at every open balance in your homes and prepares the smallest set of payments that clears them, showing the total before anything happens.</p>
            <p>You stay in control the whole time. The assistant can't send money by itself; it only prepares the batch, and you confirm it in your wallet. If a payment would go over your limits, it is left out and clearly marked so you can settle it manually.</p>
          </Section>

          <Section id="wallets" eyebrow="Accounts" title="Wallets & email login">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={Mail} title="Continue with email">Enter your email, type the 6-digit code, and a wallet is created for you. It restores on any device.</Card>
              <Card icon={Wallet} title="Bring a wallet">MetaMask, Rabby, Coinbase Wallet or any WalletConnect wallet.</Card>
            </div>
            <p>Email sessions last about an hour; after that you'll be asked to verify again.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">Email wallets</h3>
            <p>Enter your email and Nest sends a 6-digit code. Once you verify it, Circle creates a wallet linked to your email, or restores the one you already have. You can sign in on any device with the same email and see the same homes and balances. Circle may ask you to set a PIN on first sign-in to protect transactions.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">Bring your own wallet</h3>
            <p>If you already use a wallet, tap Connect wallet and pick it from the list. Nest supports injected browser wallets and any mobile wallet through WalletConnect. You can switch between email and your own wallet at any time; each address has its own homes and history.</p>
          </Section>

          <Section id="profile" eyebrow="Accounts" title="Profile & activity">
            <p>Tap your wallet address in the sidebar to see your net position, what you've paid and received, and every onchain receipt for your wallet.</p>
            <p>Your profile is built from your wallet's onchain history, so it's always accurate and identical on every device. It shows your total paid, total received, open balance across all homes, and a filtered list of every expense, settlement and payment you were part of.</p>
            <p>From your profile you can copy your address, open it on the Arc explorer, and set the display name your housemates see. Changing your name never changes your address or history.</p>
          </Section>

          <Section id="architecture" eyebrow="Technical" title="Architecture">
            <p>
              Nest is deliberately thin: a non-custodial front-end on top of Arc and Circle's rails, plus one public
              contract that stores homes, expenses and settlements.
            </p>
            <h3 className="pt-2 text-base font-bold text-foreground">Request flow</h3>
            <Code>{`Browser (wagmi / viem)
  ├─ reads  → Arc RPC → ExpenseManager (homes, members, debts)
  ├─ writes → your wallet signs → ExpenseManager / USDC
  ├─ gasless → you sign EIP-3009 → sponsor submits → USDC
  └─ bridge → TokenMessengerV2 → Circle attestation → receiveMessage`}</Code>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card icon={Layers} title="App">React app reading Arc directly via viem/wagmi.</Card>
              <Card icon={ReceiptText} title="Receipts">Built from contract event logs, not local storage.</Card>
              <Card icon={RouteIcon} title="Bridge">Circle CCTP v2 contracts and attestation API.</Card>
            </div>
            <p>There is no private ledger: balances, members and receipts all come from public chain data. If an RPC is slow, Nest keeps showing the last verified state instead of guessing.</p>
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
            <p>ExpenseManager is the single source of truth for Nest. It stores homes, members, expenses and debt balances, and executes settlements in USDC. The contract is verified on the Arc explorer, so anyone can read the source code and every transaction it has processed.</p>
            <p>Key events: RoomCreated when a home is made, ExpenseAdded when a cost is recorded, SplitSettled when a debt is paid, and DirectTransfer for direct payments between members. Nest uses these events to build receipts and activity.</p>
          </Section>

          <Section id="integration" eyebrow="Technical" title="Integration guide">
            <p>Read a home's members and settle a debt with viem:</p>
            <Code>{`import { createPublicClient, http } from "viem";

const client = createPublicClient({
  transport: http("https://rpc.testnet.arc.io"),
});

const members = await client.readContract({
  address: "${CONTRACT}",
  abi: expenseManagerAbi,
  functionName: "getRoommates",
  args: [homeId],
});`}</Code>
            <p>Listen for <code className="font-mono text-foreground">SplitSettled</code> and <code className="font-mono text-foreground">DirectTransfer</code> events to build your own receipts.</p>
            <p>Because everything lives in a public contract, other apps can read Nest data or build on top of it without permission. Use any Arc RPC endpoint, the ABI from the verified contract on the explorer, and standard viem or ethers tooling.</p>
            <p>For writes, remember that settlements require a USDC approval to the ExpenseManager first, and all amounts use 6 decimals. Simulate transactions before sending them to catch errors like an insufficient balance or an already-settled debt.</p>
          </Section>

          <Section id="security" eyebrow="Resources" title="Security">
            <p>What Nest controls, what it does not, and how to keep yourself safe.</p>
            <h3 className="pt-2 text-base font-bold text-foreground">Trust model</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-bold text-foreground">Nest never has</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Your private keys or seed phrase</li>
                  <li>Custody of USDC during a payment, settlement or bridge</li>
                  <li>The ability to move funds out of your wallet without your signature</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-bold text-foreground">Nest does operate</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>The website and its server functions</li>
                  <li>A sponsor wallet that submits gasless USDC authorizations you sign</li>
                  <li>A small fee top-up for brand-new email wallets on testnet</li>
                </ul>
              </div>
            </div>
            <h3 className="pt-2 text-base font-bold text-foreground">Key management</h3>
            <p>
              The sponsor key is a dedicated server-side key with no other permissions; it can only submit authorizations
              that you have already signed, for the exact amount and recipient you approved. Provider credentials live in
              server environment variables and are never shipped to the browser.
            </p>
            <h3 className="pt-2 text-base font-bold text-foreground">Third-party components</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li><b className="text-foreground">Circle CCTP v2</b> — Circle-operated contracts and attestation service.</li>
              <li><b className="text-foreground">Circle Wallets</b> — email wallets are created and secured by Circle; Nest never sees the keys.</li>
              <li><b className="text-foreground">Wallets</b> — RainbowKit / WalletConnect. Always confirm the chain and the contract you approve inside your wallet.</li>
            </ul>
            <h3 className="pt-2 text-base font-bold text-foreground">Contract safety</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Exact approvals — only the amount you're paying.</li>
              <li>Every transaction is simulated before you sign.</li>
              <li>State updates happen before transfers to prevent re-entry.</li>
            </ul>
            <h3 className="pt-2 text-base font-bold text-foreground">Staying safe</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Only use <b className="text-foreground">nestarc.xyz</b>. We will never DM you first or ask for your seed phrase.</li>
              <li>Check that approvals target the ExpenseManager address listed on the contracts section.</li>
              <li>Revoke token approvals you no longer need from your wallet.</li>
              <li>Verify the chain ID is 5042002 (Arc Testnet) before signing.</li>
            </ul>
            <h3 className="pt-2 text-base font-bold text-foreground">Report a vulnerability</h3>
            <p>
              Reach us through the <Link to="/support" className="font-bold text-brand">support page</Link> with details
              and reproduction steps. Please don't disclose publicly until we've had a chance to fix it.
            </p>
          </Section>


          <Section id="limitations" eyebrow="Resources" title="Limitations">
            <ul className="list-disc space-y-1 pl-5">
              <li>Public deployment runs on Arc Testnet; assets have no value.</li>
              <li>EURC and cirBTC transfers are disabled until routes are confirmed.</li>
              <li>Some testnet RPCs can be slow; Nest keeps the last verified state.</li>
            </ul>
            <p>Nest is in active development and the public version runs on Arc Testnet, so every balance is test money with no real value. We list known gaps here so you always know what to expect.</p>
            <p>Email sessions expire after about an hour for security, after which you verify your email again. The sponsor wallet that pays gasless fees has a limited testnet balance; if it runs low, sends fall back to a normal transaction that you pay for in USDC.</p>
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
