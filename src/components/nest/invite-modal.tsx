import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { useNestWrites } from "@/lib/chain/writes";
import { useNestChain } from "@/lib/chain/nest-chain";

export function InviteRoommateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { inviteMember } = useNestWrites();
  const { isDemo, rpcMessage } = useNestChain();
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWallet("");
    setError("");
    setSaving(false);
  }, [open]);

  const submit = async () => {
    if (isDemo) return;
    if (!isAddress(wallet.trim())) {
      setError("Enter a valid Arc wallet address (0x…).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await inviteMember(wallet.trim() as `0x${string}`);
      onClose();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 620, damping: 34, mass: 0.6 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md rounded-t-[32px] p-6 sm:rounded-[32px]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Invite roommate</h3>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              They join your home onchain and instantly see every shared expense.
            </p>
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="mt-5 w-full rounded-2xl bg-muted/60 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            {error && (
              <div className="mt-3 rounded-2xl bg-brand/10 p-3 text-xs font-semibold text-brand">
                {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={saving || isDemo}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}{" "}
              Add onchain
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
