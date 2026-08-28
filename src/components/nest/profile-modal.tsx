import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";

function NameForm({ onDone, dismissible }: { onDone: () => void; dismissible: boolean }) {
  const { claimName } = useNestWrites();
  const { isError, rpcMessage } = useNestChain();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim() || isError) return;
    setBusy(true);
    setError("");
    try {
      await claimName(name.trim());
      onDone();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div

      
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <div

        
        
        className="glass-strong w-full max-w-md rounded-t-[32px] p-6 sm:rounded-[32px]"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Claim your name</h3>
          {dismissible && (
            <button
              onClick={onDone}
              className="grid h-9 w-9 place-items-center rounded-full bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your name is written onchain once and permanently bound to this wallet.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Chen"
          autoFocus
          className="mt-5 w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        {error && (
          <div className="mt-3 rounded-2xl bg-brand/10 p-3 text-xs font-semibold text-brand">
            {error}
          </div>
        )}
        {isError && (
          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-[11px] font-semibold leading-relaxed text-amber-900">
            {rpcMessage}
          </div>
        )}
        <button
          onClick={save}
          disabled={busy || isError || !name.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-4 text-sm font-bold disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}{" "}
          Claim onchain
        </button>
      </div>
    </div>
  );
}

export function ProfileNameModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <NameForm onDone={onClose} dismissible />;
}

export function ProfileOnboarding() {
  const { me, myName, members, isError } = useNestChain();
  const [skipped, setSkipped] = useState(false);
  useEffect(() => setSkipped(false), [me]);
  const inRoom = !!me && members.some((m) => m.id === me);
  const show = !isError && inRoom && !myName && !skipped;
  if (!show) return null;
  return <NameForm onDone={() => setSkipped(true)} dismissible />;
}
