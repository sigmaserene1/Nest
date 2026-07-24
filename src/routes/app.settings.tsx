import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { BuiltOnArc } from "@/components/nest/logo";
import { currentUserId, getMember } from "@/lib/nest-data";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Nest" },
      { name: "description", content: "Manage your profile, connected wallet, and notification preferences." },
      { property: "og:title", content: "Settings · Nest" },
      { property: "og:description", content: "Profile, wallet, and preferences." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const me = getMember(currentUserId);
  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        <Section title="Profile" desc="How you appear inside Nest.">
          <Field label="Display name" defaultValue={me.name} />
          <Field label="Email" defaultValue="you@bedfordloft.com" />
        </Section>

        <Section title="Wallet" desc="Used to send and receive USDC on Arc.">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <div className="text-sm font-medium">Connected</div>
              <div className="font-mono text-xs text-muted-foreground">{me.wallet}</div>
            </div>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background">Disconnect</button>
          </div>
        </Section>

        <Section title="Notifications" desc="What you'd like to hear about.">
          <Toggle label="New expenses added" defaultOn />
          <Toggle label="You owe someone" defaultOn />
          <Toggle label="A settlement confirms" defaultOn />
          <Toggle label="Monthly summary email" />
        </Section>

        <Section title="Household" desc="Danger zone.">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <div className="text-sm font-medium">Leave Bedford Loft</div>
              <div className="text-xs text-muted-foreground">Your balances must be zero.</div>
            </div>
            <button className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-brand-foreground">Leave home</button>
          </div>
        </Section>

        <div className="flex justify-center pt-2"><BuiltOnArc /></div>
      </div>
    </AppShell>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-background p-5 md:grid-cols-3 md:p-6">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="space-y-3 md:col-span-2">{children}</div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
    </label>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="relative h-5 w-9 rounded-full bg-border transition-colors peer-checked:bg-brand">
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
