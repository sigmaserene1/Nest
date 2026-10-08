// First-run onchain setup: point at a shared Nest contract (or deploy one),
// then create or join a home. Everything here writes to Arc Testnet.

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Fuel, Loader2, LinkIcon, RefreshCw } from "lucide-react";
import { NestLogo } from "./logo";
import { ArcBadge } from "./chain";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { isAddress, resolveInvite, setContractAddress } from "@/lib/chain/config";
import { readSignupDraft } from "@/lib/signup-draft";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10">
      <div


        className="mx-auto w-full max-w-md"
      >
        <div className="flex items-center justify-between">
          <NestLogo />
          <ArcBadge />
        </div>
        <div className="glass-strong mt-6 rounded-[28px] p-6">{children}</div>
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/70 p-3 text-[11px] leading-5 text-muted-foreground">
          <div className="flex items-start gap-2">
            <Fuel className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            <span>
              Testing with an external wallet on Arc Testnet?{" "}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-foreground hover:text-brand"
              >
                Get test USDC from Circle
                <ExternalLink className="h-3 w-3" />
              </a>
              . Testnet assets have no real-world value.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContractSetup() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const useExisting = () => {
    setError("");
    const parsed = resolveInvite(code);
    if (parsed) {
      setContractAddress(parsed.address);
      return;
    }
    if (isAddress(code.trim())) {
      setContractAddress(code.trim());
      return;
    }
    setError("Paste the invite link your roommate sent you.");
  };

  return (
    <Panel>
      <h1 className="text-xl font-bold tracking-tight">Connect to a Nest home</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Nest stores every expense, split and settlement in the original shared contract. Paste the
        invite link from your roommates to open their home.
      </p>

      <div className="mt-6">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Invite link
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your invite link"
          className="mt-1.5 w-full rounded-2xl bg-muted/60 px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-brand"
        />

        <button
          onClick={useExisting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background transition hover:opacity-90"
        >
          <LinkIcon className="h-4 w-4" /> Continue
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded-2xl bg-brand/10 p-3 text-xs font-medium text-brand">
          {error}
        </div>
      )}
    </Panel>
  );
}

/**
 * First run for a wallet with no home yet: instead of asking people to name or
 * pick a room, Nest provisions one onchain automatically and drops them into
 * the app. Only a signature is required.
 */
export function RoomSetup() {
  const { rooms, selectRoom, refresh } = useNestChain();
  const { createRoom } = useNestWrites();
  const [error, setError] = useState("");
  const started = useRef(false);

  const provision = async () => {
    setError("");
    try {
      const signup = readSignupDraft();
      await createRoom(signup?.workspaceName || "My household");
      await refresh();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (rooms.length > 0) {
      selectRoom(rooms[0].id);
      return;
    }
    void provision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel>
      <h1 className="text-xl font-bold tracking-tight">Setting up your workspace</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Nest is creating {readSignupDraft()?.workspaceName ? `“${readSignupDraft()?.workspaceName}”` : "your shared workspace"} on Arc.
        Approve the secure wallet request once, then you go straight into the app.
      </p>

      {error ? (
        <>
          <div className="mt-5 rounded-2xl bg-brand/10 p-3 text-xs font-medium text-brand">
            {error}
          </div>
          <button
            onClick={provision}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 text-sm font-bold"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          Provisioning onchain…
        </div>
      )}
    </Panel>
  );
}
