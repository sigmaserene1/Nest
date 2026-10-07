import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/nest/public-shell";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms — Nest" },
      {
        name: "description",
        content: "Terms for using the Nest onchain group-finance application.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/terms" }],
  }),
});

function TermsPage() {
  return (
    <PublicShell
      eyebrow="Trust"
      title="Terms of use"
      description="Important conditions for using the current Nest testnet application and its onchain features."
    >
      <article className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <p className="text-xs font-semibold text-muted-foreground">Last updated: October 7, 2026</p>

        <div className="mt-8 space-y-9 text-sm leading-7 text-muted-foreground">
          <Section title="1. Testnet software">
            The current public Nest deployment includes Arc Testnet functionality. Testnet tokens are
            for development and testing and do not represent real-world money. Features can change,
            reset or become unavailable as the network and application evolve.
          </Section>

          <Section title="2. No custody or financial advice">
            Nest is software for recording shared obligations and initiating wallet-to-wallet onchain
            actions. It is not a bank, broker, investment adviser or financial adviser. Ordinary Nest
            settlement does not require Nest to take custody of a pooled user balance.
          </Section>

          <Section title="3. Your wallet and approvals">
            You are responsible for reviewing wallet addresses, networks, amounts and transaction
            approvals before signing. Never share a seed phrase or private key with Nest or anyone
            claiming to provide Nest support.
          </Section>

          <Section title="4. Smart-contract and network risk">
            Smart contracts, public RPC services, bridges, wallets and blockchain networks can contain
            bugs, experience downtime or behave unexpectedly. Test before relying on any workflow and
            do not treat the current testnet build as audited production financial infrastructure.
          </Section>

          <Section title="5. Third-party services">
            Nest may use or link to Circle, Arc infrastructure, LI.FI, wallet software, RPC providers,
            explorers and other third-party services. Their availability, security and terms are
            outside Nest's direct control.
          </Section>

          <Section title="6. Prohibited use">
            Do not use Nest to violate applicable law, interfere with the service, compromise another
            user's wallet or account, distribute malware, impersonate Nest/Arc/Circle, or attempt to
            obtain credentials or private keys from other users.
          </Section>

          <Section title="7. Availability and changes">
            Nest may modify, suspend or remove testnet features as the product changes. Documentation
            reflects the current public build and may be updated when integrations or deployments change.
          </Section>

          <Section title="8. Contact">
            Questions about these terms can be sent to{" "}
            <a className="font-semibold text-brand hover:underline" href="mailto:auth@nestarc.xyz">
              auth@nestarc.xyz
            </a>
            .
          </Section>
        </div>
      </article>
    </PublicShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
