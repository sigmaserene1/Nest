import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, UserPlus, Check, Loader2 } from "lucide-react";
import { addRoommate } from "@/lib/nest-store";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import type { Member } from "@/lib/nest-data";

export function InviteRoommateModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: (m: Member) => void;
}) {
  const { address: myWallet } = useArcWallet();
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<Member | null>(null);


  useEffect(() => {
    if (!open) return;
    setName("");
    setWallet("");
    setError("");
    setAdded(null);
  }, [open]);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    const res = await addRoommate(name, wallet, { wallet: myWallet, name: "Me" });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    setAdded(res.member);
    onAdded?.(res.member);
    setTimeout(onClose, 900);
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-xl ring-1 ring-black/5 sm:rounded-[28px]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-base font-bold">Invite roommate</div>
                  <div className="text-xs text-muted-foreground">Add them to your household</div>
                </div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {added ? (
              <div className="mt-8 flex flex-col items-center py-6">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-7 w-7" />
                </span>
                <div className="mt-3 text-sm font-bold">{added.name} added</div>
                <div className="text-xs text-muted-foreground">They can now be picked in every flow.</div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Full name
                  </div>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    maxLength={60}
                    autoFocus
                    placeholder="e.g. Sara Kim"
                    className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Arc wallet address
                  </div>
                  <input
                    value={wallet}
                    onChange={(e) => {
                      setWallet(e.target.value);
                      setError("");
                    }}
                    spellCheck={false}
                    maxLength={42}
                    placeholder="0x…"
                    className="w-full rounded-2xl bg-muted/60 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-brand/10 px-4 py-2.5 text-xs font-semibold text-brand">{error}</div>
                )}

                <button
                  onClick={submit}
                  className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01]"
                >
                  Add roommate
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
