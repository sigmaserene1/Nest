import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { NestLogo } from "@/components/nest/logo";

const CONTRACT_ADDRESS = "0x709cbAd88162b999882788155cde79aDe46A6D42";
const CONTRACT_URL = `https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`;
const REPO_URL = "https://github.com/sigmaserene1/Nest";

export const Route = createFileRoute("/app/docs")({
  component: Docs,
  head: () => ({
    meta: [
      { title: "Docs — Nest" },
      {
        name: "description",
        content:
          "Nest documentation: Arc Testnet configuration, ExpenseManager contract, settlement flow, CCTP funding and local development.",
      },
    ],
  }),
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "network", label: "Network configuration" },
  { id: "contract", label: "Contract" },
  { id: "settlement", label: "Settlement flow" },
  { id: "funding", label: "Crosschain funding" },
  { id: "assistance", label: "Capped assistance" },
  { id: "local", label: "Run locally" },
  { id: "limits", label: "Scope and limitations" },
] as const;

function Docs() {
  return (
    <div className="landing min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060a14]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Link to="/" className="text-white" aria-label="Nest home">
            <NestLogo />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/80 transition-colors hover:border-white/25"
            >
              <Github className="h-3.5 w-3.5" /> Source
            </a>
            <Link
              to="/app"
              className="rounded-full bg-[#7c6cff] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(124,108,255,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Launch app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <nav aria-label="Docs sections" className="mt-6 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="max-w-3xl">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#a394ff]">
            Documentation
          </span>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.04em] text-white sm:text-5xl">
            Build on Nest
          </h1>
          <p className="mt-4 text-base leading-7 text-white/55">
            Nest is programmable group finance on Arc Testnet. A workspace records shared
            obligations, resolves exact balances, and lets members settle open shares peer-to-peer
            in native USDC.
          </p>

          <section id="overview" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Overview</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              A workspace is a room in the ExpenseManager contract. Members are wallet addresses.
              Expenses carry a payer, participants and an allocation, and each participant's share
              is stored as an explicit obligation. Reading the contract gives every member the same
              net positions, and settlement clears those obligations with a direct USDC transfer to
              the payer.
            </p>
          </section>

          <section id="network" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Network configuration</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08]">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    ["Chain ID", "5042002"],
                    ["Native gas asset", "USDC"],
                    ["USDC ERC-20 interface", "0x3600000000000000000000000000000000000000"],
                    ["CCTP domain", "26"],
                    ["Primary RPC", "https://rpc.testnet.arc.network"],
                    ["Explorer", "https://testnet.arcscan.app"],
                  ].map(([k, v]) => (
                    <tr key={k} className="bg-white/[0.02]">
                      <th className="w-56 px-5 py-3 font-semibold text-white/50">{k}</th>
                      <td className="break-all px-5 py-3 font-mono text-xs text-white/80">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="contract" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Contract</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              ExpenseManager stores rooms, membership, expenses, member shares, settlement status
              and activity. It is callable directly.
            </p>
            <a
              href={CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-xs text-white/80 transition-colors hover:border-white/25"
            >
              {CONTRACT_ADDRESS} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </section>

          <section id="settlement" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Settlement flow</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-white/55">
              <li>
                <span className="font-mono text-[#a394ff]">01</span> Record the obligation with
                payer, participants, allocation and amount.
              </li>
              <li>
                <span className="font-mono text-[#a394ff]">02</span> Resolve net positions and group
                open shares by debtor and creditor.
              </li>
              <li>
                <span className="font-mono text-[#a394ff]">03</span> Approve USDC allowance, then
                call <code className="font-mono text-white/80">settleWith</code> to clear every open
                share owed to that counterparty.
              </li>
              <li>
                <span className="font-mono text-[#a394ff]">04</span> Re-resolve balances and keep the
                transaction-linked receipt for independent verification.
              </li>
            </ol>
          </section>

          <section id="funding" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Crosschain funding</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Canonical USDC can be brought to Arc from six supported EVM testnets through Circle
              CCTP v2: burn on the source domain, fetch the attestation, mint on Arc. Nest does not
              integrate Circle Gateway.
            </p>
          </section>

          <section id="assistance" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Capped assistance</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Assisted settlement queues eligible debts client-side, filters dust and stops at a
              per-run cap, with wallet approval for every transaction. NestBusinessV2 adds an
              onchain, revocable session-key policy for new business workspaces: a key may only
              settle genuine open shares for the member who authorized it, within an expiry plus
              per-run and per-period USDC caps. It cannot create expenses or make arbitrary
              transfers.
            </p>
          </section>

          <section id="local" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Run locally</h2>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#080d18] p-5 font-mono text-xs leading-6 text-white/75">
{`git clone https://github.com/sigmaserene1/Nest.git
cd Nest
npm install
npm run dev

# checks
npm run build
npx tsc --noEmit`}
            </pre>
          </section>

          <section id="limits" className="mt-14 scroll-mt-28">
            <h2 className="font-display text-2xl text-white">Scope and limitations</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Nest does not claim a global minimum-transfer algorithm, autonomous custody, Circle
              Gateway integration or a production SDK. Contracts are unaudited testnet code, and
              testnet assets have no real-world monetary value. Business V2 requires an independent
              security review, including economic and liquidation design review, before any
              real-value deployment.
            </p>
          </section>

          <div className="mt-16 flex flex-wrap gap-3 border-t border-white/[0.07] pt-8">
            <Link
              to="/app"
              className="rounded-full bg-[#7c6cff] px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Open a workspace
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white/85 transition-colors hover:border-white/25"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
