import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAccount } from "wagmi";
import type { BridgeResult } from "@circle-fin/app-kit";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Route as RouteIcon,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  APP_KIT_FUNDING_CHAINS,
  bridgeExplorerUrls,
  bridgeUsdcToArc,
  type AppKitFundingChain,
} from "@/lib/arc/app-kit";

export const Route = createFileRoute("/app/bridge")({
  // Circle App Kit is a browser wallet SDK. Keeping this route out of SSR also
  // prevents its Solana/WebSocket transitive dependencies from entering the
  // Cloudflare Worker bundle.
  ssr: false,
  component: FundingPage,
  head: () => ({
    meta: [
      { title: "Fund with Circle App Kit · Nest" },
      {
        name: "description",
        content: "Bridge native USDC to Arc through Circle App Kit and CCTP V2.",
      },
    ],
  }),
});

function FundingPage() {
  const { connector, address } = useAccount();
  const [sourceChain, setSourceChain] = useState<AppKitFundingChain>("Base_Sepolia");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BridgeResult | null>(null);
  const numericAmount = Number(amount);
  const canBridge = Boolean(connector && address && numericAmount > 0 && !busy);

  const bridge = async () => {
    if (!connector || !canBridge) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const next = await bridgeUsdcToArc({
        connector,
        sourceChain,
        amount: numericAmount.toFixed(6),
      });
      setResult(next);
      if (next.state === "error")
        setError("App Kit could not complete every bridge step. Review the failed step below.");
    } catch (caught) {
      setError((caught as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  const explorerUrls = result ? bridgeExplorerUrls(result) : [];

  return (
    <AppShell
      greeting={
        <div>
          <div className="protocol-label">Circle App Kit · CCTP V2</div>
          <h1 className="mt-2 text-2xl font-semibold">Fund your Arc wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Move native USDC from another testnet through Circle's supported bridge workflow.
          </p>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="protocol-label">Funding route</div>
              <h2 className="mt-1 text-base font-semibold">Source chain to Arc</h2>
            </div>
            <span className="rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-1 font-mono text-[10px] text-sky-300">
              APP KIT
            </span>
          </div>

          <div className="mt-6 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="protocol-label">From</div>
              <select
                value={sourceChain}
                onChange={(event) => setSourceChain(event.target.value as AppKitFundingChain)}
                disabled={busy}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
              >
                {APP_KIT_FUNDING_CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 text-[10px] text-muted-foreground">
                Native testnet USDC · source gas required
              </div>
            </div>
            <span className="grid h-9 w-9 place-items-center justify-self-center rounded-md border border-border bg-card text-primary">
              <ArrowRight className="h-4 w-4 sm:rotate-0 rotate-90" />
            </span>
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="protocol-label">To</div>
              <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-primary/20 bg-background px-3 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> Arc Testnet
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground">
                Native USDC · CCTP domain 26
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <RouteFact icon={Waypoints} label="Protocol" value="CCTP V2" />
              <RouteFact icon={ShieldCheck} label="Asset" value="Native USDC" />
              <RouteFact
                icon={RouteIcon}
                label="Destination"
                value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet"}
              />
            </div>
          </div>

          {result && (
            <div className="mt-6">
              <div className="protocol-label">App Kit execution trace</div>
              <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                {result.steps.map((step, index) => (
                  <div
                    key={`${step.name}-${index}`}
                    className="flex items-center gap-3 px-3 py-3 text-xs"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${step.state === "success" ? "bg-emerald-300" : step.state === "error" ? "bg-red-400" : "bg-amber-300"}`}
                    />
                    <span className="min-w-0 flex-1 font-medium capitalize">{step.name}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {step.state}
                    </span>
                    {step.explorerUrl && (
                      <a
                        href={step.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Waypoints className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Bridge USDC</h2>
          </div>
          <label className="mt-5 block">
            <span className="protocol-label">Amount</span>
            <div className="relative mt-2">
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                disabled={busy}
                className="protocol-value h-12 pr-16 text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USDC
              </span>
            </div>
          </label>
          <div className="mt-5 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Wallet prompts</span>
              <span>Approve · burn · mint</span>
            </div>
            <div className="flex justify-between">
              <span>Destination</span>
              <span>Connected wallet</span>
            </div>
            <div className="flex justify-between">
              <span>Wrapped token</span>
              <span className="text-emerald-300">Never</span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-400/25 bg-red-400/5 p-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}
          {result?.state === "success" && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" /> App Kit completed the bridge. Arc USDC
              is now available to the destination wallet.
            </div>
          )}

          <Button onClick={bridge} disabled={!canBridge} className="mt-5 h-11 w-full">
            {busy ? <Loader2 className="animate-spin" /> : <Waypoints />}
            {busy ? "App Kit is executing" : "Bridge to Arc"}
          </Button>
          {busy && (
            <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
              Keep this page open and approve each wallet prompt. App Kit may switch networks during
              the route.
            </p>
          )}
          {explorerUrls.length > 0 && (
            <div className="mt-3 text-center text-[10px] text-muted-foreground">
              {explorerUrls.length} explorer proof{explorerUrls.length === 1 ? "" : "s"} available
              above
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function RouteFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Waypoints;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="protocol-label">{label}</span>
      </div>
      <div className="protocol-value mt-2 text-xs">{value}</div>
    </div>
  );
}
