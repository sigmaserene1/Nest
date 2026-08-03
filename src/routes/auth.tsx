import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NestLogo } from "@/components/nest/logo";
import { Wallet, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Connect Wallet · Nest" },
      { name: "description", content: "Connect your wallet to enter your Nest household on Arc." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) navigate({ to: "/app" });
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <NestLogo />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Connect your wallet</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your wallet to enter your Nest on Arc Testnet
            </p>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-elevated">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="w-full [&>div]:w-full [&_button]:w-full">
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    disabled={!mounted}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              MetaMask, WalletConnect, and more
            </p>
          </div>

          <div className="my-5 h-px bg-border" />

          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-brand" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">Self-custodial.</span> Your keys,
                your funds. No passwords.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="mt-0.5 h-4 w-4 text-brand" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">Instant USDC.</span> Settle on Arc
                Testnet in seconds.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
