import { useState } from "react";
import { ArrowRight, Check, Link2, Loader2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { NestLogo } from "./logo";
import { WalletHeader } from "./wallet-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { useNestWrites } from "@/lib/chain/writes";
import { resolveInvite, setContractAddress } from "@/lib/chain/config";

type Mode = "launch" | "join";

const protocolFacts = [
  "Net balances calculated and stored by the contract",
  "USDC moves directly between member wallets",
  "Agent caps and run receipts enforced on Arc",
];

export function ContractSetup() {
  const [mode, setMode] = useState<Mode>("launch");
  const [name, setName] = useState("My treasury");
  const [ownerName, setOwnerName] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const wallet = useArcWallet();
  const { deployTreasury } = useNestWrites();

  const launch = async () => {
    setError("");
    if (!name.trim()) return setError("Give the treasury a name.");
    if (!ownerName.trim()) return setError("Add the display name members should see.");
    if (!wallet.isOnArc) {
      wallet.switchToArc();
      return;
    }
    setBusy(true);
    try {
      const result = await deployTreasury({ name, ownerName }, setStep);
      toast.success("Treasury deployed on Arc", { description: result.address });
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = () => {
    setError("");
    const parsed = resolveInvite(invite);
    if (!parsed) return setError("Paste a Nest V2 invite link or treasury contract address.");
    setContractAddress(parsed.address);
  };

  return (
    <main className="protocol-setup min-h-screen px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-border/70 pb-5">
          <NestLogo />
          <div className="min-w-0 max-w-[60%]">
            <WalletHeader />
          </div>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:py-16">
          <section>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[11px] uppercase text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Treasury protocol v2
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Launch a treasury that lives on Arc.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              One contract holds the shared ledger, deterministic net positions, settlement
              receipts, member permissions, and agent guardrails. Nest only reads and signs what the
              contract proves.
            </p>

            <ul className="mt-8 space-y-3">
              {protocolFacts.map((fact) => (
                <li key={fact} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                  {fact}
                </li>
              ))}
            </ul>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {[
                ["Network", "Arc Testnet"],
                ["Asset", "Native USDC"],
                ["Finality", "One confirmation"],
              ].map(([label, value]) => (
                <div key={label} className="bg-card px-3 py-4">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 text-xs font-semibold sm:text-sm">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-1 shadow-2xl shadow-black/20">
            <div className="grid grid-cols-2 gap-1 border-b border-border p-1">
              <button
                type="button"
                onClick={() => setMode("launch")}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  mode === "launch"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Launch treasury
              </button>
              <button
                type="button"
                onClick={() => setMode("join")}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  mode === "join"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Open invite
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {mode === "launch" ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold">Deploy your workspace contract</h2>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Your wallet becomes the first admin. Deployment and treasury creation happen
                        in one Arc transaction.
                      </p>
                    </div>
                  </div>

                  <label className="mt-6 block">
                    <span className="protocol-label">Treasury name</span>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={80}
                      className="mt-2 h-11"
                      placeholder="Acme operations"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="protocol-label">Your onchain display name</span>
                    <Input
                      value={ownerName}
                      onChange={(event) => setOwnerName(event.target.value)}
                      maxLength={60}
                      className="mt-2 h-11"
                      placeholder="Alex"
                    />
                  </label>

                  <Button
                    onClick={launch}
                    disabled={busy || !wallet.isConnected}
                    className="mt-6 h-11 w-full"
                  >
                    {busy ? <Loader2 className="animate-spin" /> : <Network />}
                    {busy
                      ? step || "Deploying on Arc"
                      : wallet.isOnArc
                        ? "Deploy V2 treasury"
                        : "Switch to Arc"}
                    {!busy && <ArrowRight />}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-sky-400/10 text-sky-300">
                      <Link2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="font-semibold">Open an existing treasury</h2>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        An admin must add your wallet onchain before the invite grants access.
                      </p>
                    </div>
                  </div>
                  <label className="mt-6 block">
                    <span className="protocol-label">Invite or contract address</span>
                    <Input
                      value={invite}
                      onChange={(event) => setInvite(event.target.value)}
                      className="mt-2 h-11 font-mono text-xs"
                      placeholder="https://nestarc.xyz/app?invite=..."
                    />
                  </label>
                  <Button onClick={join} className="mt-6 h-11 w-full">
                    <ShieldCheck /> Verify on Arc <ArrowRight />
                  </Button>
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-md border border-red-400/25 bg-red-400/10 p-3 text-xs text-red-300"
                >
                  {error}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export const RoomSetup = ContractSetup;
