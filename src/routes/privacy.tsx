import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/nest/public-shell";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy — Nest" },
      {
        name: "description",
        content: "Privacy information for the Nest onchain group-finance application.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nestarc.xyz/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <PublicShell
      eyebrow="Trust"
      title="Privacy"
      description="How the current Nest application handles wallet, authentication, onchain and browser-local information."
    >
      <article className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <p className="text-xs font-semibold text-muted-foreground">Last updated: October 7, 2026</p>

        <div className="mt-8 space-y-9 text-sm leading-7 text-muted-foreground">
          <Section title="1. Scope">
            This notice applies to the Nest web application at nestarc.xyz and describes the current
            public testnet build. Nest is an independent software project and is not Arc or Circle.
          </Section>

          <Section title="2. Information used by the app">
            Nest may process wallet addresses, selected workspace information, transaction hashes,
            public blockchain activity and information you submit to the application. When you use
            Circle-backed sign-in, authentication and user-controlled-wallet information is handled
            through Circle's wallet services. External wallets are handled by the wallet software and
            connector you choose.
          </Section>

          <Section title="3. Public blockchain data">
            Arc is a public blockchain. Wallet addresses, smart-contract calls, balances and transaction
            history written onchain are public and can be independently viewed through blockchain
            explorers. Nest cannot make public blockchain records private after they are confirmed.
          </Section>

          <Section title="4. Browser-local data">
            Nest uses browser storage for parts of the user experience, such as selected network or
            workspace state, session information, some bridge history and local assistant/preferences.
            Clearing site data or using another browser/device may remove local-only information.
          </Section>

          <Section title="5. Third-party services">
            The current application can interact with Circle services, Arc RPC/explorer infrastructure,
            LI.FI routing, external wallet providers and other infrastructure selected by the user or
            application. Those services operate under their own terms and privacy practices.
          </Section>

          <Section title="6. Security">
            Do not send passwords, seed phrases or private keys to Nest support. Nest does not need your
            wallet seed phrase. Wallet approvals should be reviewed in the wallet or Circle-controlled
            security interface before confirmation.
          </Section>

          <Section title="7. Contact">
            Privacy questions can be sent to{" "}
            <a className="font-semibold text-brand hover:underline" href="mailto:auth@nestarc.xyz">
              auth@nestarc.xyz
            </a>
            . For technical issues, you can also use the public GitHub repository linked from the Nest
            support page.
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
