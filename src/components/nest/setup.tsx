// First-run onchain setup: point at a shared Nest contract (or deploy one),
// then create or join a home. Everything here writes to Arc Testnet.

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Home, Plus, LinkIcon, Rocket } from "lucide-react";
import { NestLogo } from "./logo";
import { ArcBadge } from "./chain";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { isAddress, resolveInvite, setContractAddress } from "@/lib/chain/config";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-md"
      >
        <div className="flex items-center justify-between">
          <NestLogo />
          <ArcBadge />
        </div>
        <div className="glass-strong mt-6 rounded-[28px] p-6">{children}</div>
      </motion.div>
    </div>
  );
}

export function ContractSetup() {
  const { deployContract } = useNestWrites();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"deploy" | "join" | null>(null);
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

  const deploy = async () => {
    setError("");
    setBusy("deploy");
    try {
      const addr = await deployContract();
      setContractAddress(addr);
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel>
      <h1 className="text-xl font-bold tracking-tight">Connect to a Nest home</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Nest stores every expense, split and settlement onchain. Paste the invite link from your
        roommates, or launch a new Nest home on Arc Testnet.
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

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={deploy}
        disabled={busy === "deploy"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 text-sm font-bold disabled:opacity-60"
      >
        {busy === "deploy" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {busy === "deploy" ? "Setting up onchain…" : "Start a new Nest home"}
      </button>
      {error && (
        <div className="mt-3 rounded-2xl bg-brand/10 p-3 text-xs font-medium text-brand">
          {error}
        </div>
      )}
    </Panel>
  );
}

export function RoomSetup() {
  const { rooms, selectRoom } = useNestChain();
  const { createRoom, joinRoom } = useNestWrites();
  const [name, setName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <h1 className="text-xl font-bold tracking-tight">Set up your home</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        A home is an onchain room. Everyone in it sees the same expenses and balances.
      </p>

      {rooms.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your homes
          </div>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRoom(r.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left transition hover:bg-muted"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Home className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">Shared home on Arc</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          New home name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bedford Loft"
          className="mt-1.5 w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={() => name.trim() && run(() => createRoom(name.trim()))}
          disabled={busy || !name.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 text-sm font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{" "}
          Create home onchain
        </button>
      </div>

      <div className="mt-6">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Have an invite link?
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Paste your invite link"
            className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={() => {
              const invite = resolveInvite(joinId);
              if (!invite) return setError("That invite link isn't valid.");
              setError("");
              setContractAddress(invite.address);
              run(async () => {
                await joinRoom(invite.roomId);
                selectRoom(invite.roomId);
              });
            }}
            disabled={busy || !joinId.trim()}
            className="shrink-0 rounded-2xl bg-foreground px-5 text-sm font-bold text-background disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-brand/10 p-3 text-xs font-medium text-brand">
          {error}
        </div>
      )}
    </Panel>
  );
}
