// First-run workspace setup for Nest on Arc.

import { useState } from "react";
import { ExternalLink, Fuel, Loader2, LinkIcon } from "lucide-react";
import { NestLogo } from "./logo";
import { ArcBadge } from "./chain";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { isAddress, resolveInvite, setContractAddress } from "@/lib/chain/config";
import { readSignupDraft } from "@/lib/signup-draft";
import { useArcEnvironment } from "@/lib/arc-network";

function Panel({ children }: { children: React.ReactNode }) {
  const environment = useArcEnvironment();

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
        {environment === "testnet" ? (
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
        ) : null}
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
 * First run for a wallet with no workspace yet.
 * Normal new users create one workspace explicitly, then invite people later.
 * Invite recipients never reach this screen because AppLayout handles the
 * pending invitation before the workspace gate.
 */
export function RoomSetup() {
  const environment = useArcEnvironment();
  const isMainnet = environment === "mainnet";
  const { refresh } = useNestChain();
  const { createRoom } = useNestWrites();
  const signup = readSignupDraft();
  const [workspaceName, setWorkspaceName] = useState(signup?.workspaceName ?? "");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const createWorkspace = async () => {
    const name = workspaceName.trim();
    if (name.length < 2 || name.length > 80) {
      setError("Enter a workspace name between 2 and 80 characters.");
      return;
    }

    setError("");
    setCreating(true);
    try {
      await createRoom(name);
      await refresh();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
      setCreating(false);
    }
  };

  return (
    <Panel>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
        {isMainnet ? "Mainnet workspace" : "First workspace"}
      </div>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {isMainnet ? "Create your Mainnet workspace" : "Create your workspace"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {isMainnet ? (
          <>
            Arc keeps Testnet and Mainnet workspaces separate. Your existing Testnet workspace
            stays unchanged; create this Mainnet workspace explicitly to start recording new
            onchain activity there. Previous expenses and balances are not copied between networks.
          </>
        ) : (
          <>
            Start with one shared workspace. After it is created, you can invite members from the
            Members page whenever you’re ready.
          </>
        )}
      </p>

      <label className="mt-6 block">
        <span className="text-[11px] font-bold text-muted-foreground">Workspace name</span>
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Apartment 12, Design Team"
          disabled={creating}
          className="mt-1.5 min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
        />
      </label>

      <div className="mt-4 rounded-2xl bg-muted/55 p-4 text-xs leading-5 text-muted-foreground">
        Creating a workspace adds only your wallet first. No one else is added until you share an
        invite or add them later.
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-destructive/5 p-3 text-xs font-semibold text-destructive">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void createWorkspace()}
        disabled={creating}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl btn-gradient px-5 text-sm font-bold disabled:opacity-50"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {creating ? "Creating on Arc…" : "Create workspace"}
      </button>
    </Panel>
  );
}
