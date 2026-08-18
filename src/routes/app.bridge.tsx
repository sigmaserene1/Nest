import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Info,
  Link2,
  Loader2,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { getPublicClient, getWalletClient } from "@wagmi/core";

import { wagmiConfig } from "@/lib/wagmi";

import { AppShell, Card } from "@/components/nest/app-shell";
import { UsdcBadge, WalletChip } from "@/components/nest/chain";
import { useComputedBalances, useMe } from "@/lib/chain/nest-chain";
import { fmtUSD } from "@/lib/nest-data";

import {
  ANY_DESTINATION_CALLER,
  ARC_CCTP_CONTRACTS,
  ARC_DOMAIN,
  ARC_CHAIN_ID,
  CCTP_SOURCES,
  CCTP_STATUS,
  ERC20_ABI,
  FINALITY_FAST,
  MESSAGE_TRANSMITTER_V2_ABI,
  TOKEN_MESSENGER_V2_ABI,
  addressToBytes32,
  buildRoute,
  formatUsdc,
  getCctpFee,
  waitForAttestation,
  type CctpChain,
} from "@/lib/cctp";

export const Route = createFileRoute("/app/bridge")({
  component: BridgePage,

  head: () => ({
    meta: [
      {
        title: "Bridge USDC to Arc · Nest",
      },
      {
        name: "description",
        content:
          "Move native USDC from Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia, OP Sepolia, Avalanche Fuji or Polygon Amoy into Arc using Circle CCTP v2.",
      },
    ],
  }),
});

type TransferState =
  | "idle"
  | "switching"
  | "checking"
  | "approving"
  | "burning"
  | "attesting"
  | "minting"
  | "complete"
  | "error";

function BridgePage() {
  const me = useMe();

  const { address, isConnected, chainId } = useAccount();

  const { switchChainAsync } = useSwitchChain();

  const { data: walletClient } = useWalletClient();

  const { debts } = useComputedBalances();

  const owed = useMemo(() => debts.filter((d) => d.fromId === me).reduce((sum, d) => sum + d.amount, 0), [debts, me]);

  const [sourceId, setSourceId] = useState(CCTP_SOURCES[3].id);

  const [amount, setAmount] = useState(owed > 0 ? owed.toFixed(2) : "1");

  const [state, setState] = useState<TransferState>("idle");

  const [error, setError] = useState("");

  const [approvalHash, setApprovalHash] = useState("");

  const [burnHash, setBurnHash] = useState("");

  const [mintHash, setMintHash] = useState("");

  const [statusText, setStatusText] = useState("");

  const source = CCTP_SOURCES.find((item) => item.id === sourceId) ?? CCTP_SOURCES[0];

  const value = Number(amount) || 0;

  const route = buildRoute(source, value.toFixed(2));

  const isBusy = !["idle", "complete", "error"].includes(state);

  async function executeBridge() {
    if (!address) {
      setError("Connect your wallet first.");
      return;
    }

    if (!walletClient) {
      setError("Wallet client is unavailable.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid USDC amount.");
      return;
    }

    setError("");
    setApprovalHash("");
    setBurnHash("");
    setMintHash("");

    try {
      const amountUnits = BigInt(Math.round(value * 1_000_000));

      /**
       * --------------------------------------------------
       * 1. Switch to source chain
       * --------------------------------------------------
       */

      setState("switching");
      setStatusText(`Switching wallet to ${source.name}…`);

      if (chainId !== source.chainId) {
        await switchChainAsync({
          chainId: source.chainId,
        });
      }

      /**
       * --------------------------------------------------
       * 2. Get source-chain clients
       * --------------------------------------------------
       */

      const sourceWallet = await getWalletClientForChain(source.chainId);

      if (!sourceWallet) {
        throw new Error(`Unable to create a wallet client for ${source.name}.`);
      }

      const sourcePublic = getPublicClientForChain(source.chainId);

      if (!sourcePublic) {
        throw new Error(`Unable to create a public client for ${source.name}.`);
      }

      /**
       * --------------------------------------------------
       * 3. Check USDC balance
       * --------------------------------------------------
       */

      setState("checking");
      setStatusText("Checking source USDC balance and CCTP fee…");

      const balance = await sourcePublic.readContract({
        address: source.usdc,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      if (balance < amountUnits) {
        throw new Error(`Insufficient USDC on ${source.name}. You have ${formatUsdc(balance)} USDC.`);
      }

      /**
       * --------------------------------------------------
       * 4. Get live CCTP fee
       * --------------------------------------------------
       */

      const maxFee = await getCctpFee(source.domain, ARC_DOMAIN, amountUnits);

      const totalRequired = amountUnits + maxFee;

      if (balance < totalRequired) {
        throw new Error(`You need approximately ${formatUsdc(totalRequired)} USDC including the CCTP fee.`);
      }

      /**
       * --------------------------------------------------
       * 5. Check allowance
       * --------------------------------------------------
       */

      const allowance = await sourcePublic.readContract({
        address: source.usdc,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, source.tokenMessengerV2],
      });

      /**
       * --------------------------------------------------
       * 6. Approve TokenMessengerV2
       * --------------------------------------------------
       */

      if (allowance < amountUnits) {
        setState("approving");
        setStatusText(`Approve ${value.toFixed(2)} USDC for CCTP…`);

        const approval = await sourceWallet.writeContract({
          address: source.usdc,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [source.tokenMessengerV2, amountUnits],
        });

        setApprovalHash(approval);

        await sourcePublic.waitForTransactionReceipt({
          hash: approval,
        });
      }

      /**
       * --------------------------------------------------
       * 7. Burn source USDC
       * --------------------------------------------------
       */

      setState("burning");
      setStatusText(`Burning ${value.toFixed(2)} native USDC on ${source.name}…`);

      const mintRecipient = addressToBytes32(address);

      /**
       * bytes32(0) means any address may
       * submit receiveMessage.
       *
       * This makes the destination step
       * recoverable if the browser disconnects.
       */

      const burn = await sourceWallet.writeContract({
        address: source.tokenMessengerV2,

        abi: TOKEN_MESSENGER_V2_ABI,

        functionName: "depositForBurn",

        args: [amountUnits, ARC_DOMAIN, mintRecipient, source.usdc, ANY_DESTINATION_CALLER, maxFee, FINALITY_FAST],
      });

      setBurnHash(burn);

      await sourcePublic.waitForTransactionReceipt({
        hash: burn,
      });

      /**
       * --------------------------------------------------
       * 8. Wait for Circle attestation
       * --------------------------------------------------
       */

      setState("attesting");
      setStatusText("Waiting for Circle attestation…");

      const attestation = await waitForAttestation(source.domain, burn, {
        timeoutMs: 30 * 60 * 1000,

        intervalMs: 5_000,

        onPending: () => {
          setStatusText("Source burn confirmed. Waiting for Circle to attest the CCTP message…");
        },
      });

      /**
       * --------------------------------------------------
       * 9. Switch to Arc
       * --------------------------------------------------
       */

      setState("switching");
      setStatusText("Switching wallet to Arc Testnet…");

      if (chainId !== ARC_CHAIN_ID) {
        await switchChainAsync({
          chainId: ARC_CHAIN_ID,
        });
      }

      /**
       * --------------------------------------------------
       * 10. Create Arc wallet client
       * --------------------------------------------------
       */

      const arcWallet = await getWalletClientForChain(ARC_CHAIN_ID);

      const arcPublic = getPublicClientForChain(ARC_CHAIN_ID);

      if (!arcWallet || !arcPublic) {
        throw new Error("Unable to connect to Arc Testnet.");
      }

      /**
       * --------------------------------------------------
       * 11. Mint on Arc
       * --------------------------------------------------
       */

      setState("minting");
      setStatusText("Submitting Circle attestation to Arc…");

      const mint = await arcWallet.writeContract({
        address: ARC_CCTP_CONTRACTS.messageTransmitterV2,

        abi: MESSAGE_TRANSMITTER_V2_ABI,

        functionName: "receiveMessage",

        args: [attestation.message!, attestation.attestation!],
      });

      setMintHash(mint);

      await arcPublic.waitForTransactionReceipt({
        hash: mint,
      });

      /**
       * --------------------------------------------------
       * 12. Done
       * --------------------------------------------------
       */

      setState("complete");

      setStatusText(`${value.toFixed(2)} USDC has been minted natively on Arc.`);
    } catch (err: any) {
      console.error("CCTP bridge error:", err);

      setState("error");

      setError(getReadableError(err));
    }
  }

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">CROSS-CHAIN</div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Deposit USDC from any chain</h1>

          <p className="mt-1 text-sm text-muted-foreground">Bring native USDC into Nest through Circle CCTP v2.</p>
        </div>
      }
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        {/* --------------------------------------------- */}
        {/* MAIN BRIDGE */}
        {/* --------------------------------------------- */}

        <div className="space-y-4 lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Deposit from</h3>

                <p className="mt-1 text-xs text-muted-foreground">Select where your USDC currently lives.</p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                <CircleDollarSign className="h-4 w-4" />
                CCTP v2
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CCTP_SOURCES.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setSourceId(chain.id)}
                  className={[
                    "rounded-xl border p-3 text-left transition",
                    chain.id === sourceId ? "border-brand bg-brand-soft" : "border-border hover:bg-muted/60",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: chain.id === source.id ? "currentColor" : undefined,
                      }}
                    />

                    <span className="text-xs font-bold">{chain.name}</span>
                  </span>

                  <span className="mt-2 block text-[11px] text-muted-foreground">Domain {chain.domain}</span>

                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{chain.eta}</span>
                </button>
              ))}
            </div>

            {/* AMOUNT */}

            <label className="mt-6 block">
              <span className="text-xs font-semibold text-muted-foreground">Amount</span>

              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  disabled={isBusy}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-xl border bg-background px-4 py-4 text-3xl font-bold tabular-nums outline-none focus:border-brand"
                />

                <UsdcBadge size="md" />
              </div>
            </label>

            {owed > 0 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setAmount(owed.toFixed(2))}
                className="mt-2 text-xs font-bold text-brand hover:underline"
              >
                Use open household balance · {fmtUSD(owed)}
              </button>
            )}

            {/* DESTINATION */}

            <div className="mt-5 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-background">
                  <Wallet className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground">ARC DESTINATION</div>

                  <div className="mt-1 text-sm font-bold">
                    {address ? <WalletChip address={address} /> : "Connect wallet"}
                  </div>
                </div>

                <ShieldCheck className="ml-auto h-5 w-5 text-brand" />
              </div>
            </div>

            {/* FLOW */}

            <div className="mt-4 rounded-xl border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>

                <span className="font-bold">{value.toFixed(2)} USDC</span>
              </div>

              <div className="my-3 flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Destination</span>

                <span className="font-bold">Arc · Native USDC</span>
              </div>

              <div className="mt-3 text-[11px] text-muted-foreground">
                CCTP burns native USDC on the source chain and mints native USDC on Arc. No wrapped token is used.
              </div>
            </div>

            {/* EXECUTE */}

            <button
              type="button"
              disabled={!isConnected || isBusy || value <= 0}
              onClick={executeBridge}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  {state === "approving"
                    ? "Approving USDC…"
                    : state === "burning"
                      ? "Burning USDC…"
                      : state === "attesting"
                        ? "Waiting for Circle…"
                        : state === "minting"
                          ? "Minting on Arc…"
                          : "Preparing…"}
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />

                  {isConnected ? "Bridge USDC to Arc" : "Connect wallet"}
                </>
              )}
            </button>

            {/* STATUS */}

            {statusText && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs">
                {state === "complete" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : state === "error" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                )}

                <span>{statusText}</span>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-600">
                <b>Bridge failed</b>

                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* TX LINKS */}

            {(approvalHash || burnHash || mintHash) && (
              <div className="mt-4 space-y-2">
                {approvalHash && <TxLink label="Approval transaction" hash={approvalHash} explorer={source.explorer} />}

                {burnHash && <TxLink label="CCTP burn transaction" hash={burnHash} explorer={source.explorer} />}

                {mintHash && (
                  <TxLink label="Arc mint transaction" hash={mintHash} explorer="https://testnet.arcscan.app" />
                )}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

              <span>{CCTP_STATUS}</span>
            </div>
          </Card>
        </div>

        {/* --------------------------------------------- */}
        {/* RIGHT SIDE */}
        {/* --------------------------------------------- */}

        <div className="space-y-4 lg:col-span-2">
          <Card className="!p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Link2 className="h-4 w-4 text-brand" />
              Transfer route
            </div>

            <ol className="mt-5 space-y-5">
              {route.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {state === "complete" && index < route.length ? <Check className="h-4 w-4" /> : index + 1}
                  </span>

                  <div>
                    <div className="text-sm font-semibold">{step.title}</div>

                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* CCTP CONTRACTS */}

          <Card className="!p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Arc CCTP v2</h3>

              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand">
                DOMAIN {ARC_DOMAIN}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <ContractRow
                label="TokenMessengerV2"
                address={ARC_CCTP_CONTRACTS.tokenMessengerV2}
                explorer="https://testnet.arcscan.app/address/0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA"
              />

              <ContractRow
                label="MessageTransmitterV2"
                address={ARC_CCTP_CONTRACTS.messageTransmitterV2}
                explorer="https://testnet.arcscan.app/address/0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275"
              />

              <ContractRow
                label="Native USDC"
                address={ARC_CCTP_CONTRACTS.usdc}
                explorer="https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000"
              />
            </div>
          </Card>

          <Card className="!p-6">
            <h3 className="text-sm font-bold">Why Nest uses CCTP</h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Roommates do not need to hold USDC on the same blockchain. A roommate can burn native USDC where they
              already have it, Circle attests the transfer, and the household receives native USDC on Arc.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Bridge" value="CCTP v2" />

              <MiniStat label="Destination" value="Arc" />

              <MiniStat label="Asset" value="Native USDC" />

              <MiniStat label="Domain" value="26" />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * These two helpers intentionally use the project's
 * existing wagmi configuration.
 *
 * If your wagmi config does not contain one of the
 * source chains, add that chain to src/lib/wagmi.ts.
 */
async function getWalletClientForChain(chainId: number) {
  return getWalletClient(wagmiConfig, { chainId: chainId as any });
}

function getPublicClientForChain(chainId: number) {
  return getPublicClient(wagmiConfig, { chainId: chainId as any });
}

function TxLink({ label, hash, explorer }: { label: string; hash: string; explorer: string }) {
  return (
    <a
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs hover:bg-muted"
    >
      <span className="font-semibold">{label}</span>

      <span className="flex items-center gap-1 text-brand">
        {hash.slice(0, 8)}…
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function ContractRow({ label, address, explorer }: { label: string; address: string; explorer: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="truncate text-[11px]">{address}</code>

        <a href={explorer} target="_blank" rel="noreferrer" className="shrink-0 text-brand">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-[10px] font-semibold text-muted-foreground">{label}</div>

      <div className="mt-1 text-xs font-bold">{value}</div>
    </div>
  );
}

function getReadableError(error: any): string {
  const message = error?.shortMessage || error?.details || error?.message || "Unknown wallet error.";

  if (message.includes("User rejected")) {
    return "You rejected the transaction in your wallet.";
  }

  if (message.includes("insufficient funds")) {
    return "The wallet does not have enough funds to pay the source-chain transaction fee.";
  }

  if (message.includes("transfer amount exceeds allowance")) {
    return "The USDC allowance is too low. Try the bridge again so Nest can approve the required amount.";
  }

  if (message.includes("used nonce")) {
    return "This CCTP message has already been received on the destination chain.";
  }

  return message;
}
